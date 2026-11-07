import { deleteHouseImages } from '@/lib/house-storage';
import { houseExitResponse } from '@/lib/house-exit';
import { db } from '@/db';
import { houses, memberships } from '@/db/schema';
import { currentUser, unauthorized } from '@/lib/access';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

type Context = { params: Promise<{ houseId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { houseId } = await params;
  const user = await currentUser();
  if (!user) return unauthorized();
  const [membership] = await db().select({ role: memberships.role }).from(memberships)
    .where(and(eq(memberships.houseId, houseId), eq(memberships.userId, user.id)));
  if (!membership || !['owner', 'co_owner'].includes(membership.role)) return unauthorized();
  const parsed = z.object({ houseNumber: z.string().trim().max(50) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: 'บ้านเลขที่ยาวเกินไป' }, { status: 400 });
  const [house] = await db().update(houses).set({ houseNumber: parsed.data.houseNumber || null })
    .where(eq(houses.id, houseId)).returning({ houseNumber: houses.houseNumber });
  return house ? Response.json(house) : Response.json({ error: 'ไม่พบบ้าน' }, { status: 404 });
}

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function DELETE(request: Request, { params }: Context) {
  const { houseId } = await params;
  if (!z.uuid().safeParse(houseId).success) return Response.json({ error: 'บ้านไม่ถูกต้อง' }, { status: 400 });
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = z.object({ confirm: z.literal(true) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'กรุณายืนยันการลบบ้าน' }, { status: 400 });
  try {
    const result = await db().transaction(async tx => {
      // Uploads take a shared lock on this same row before writing any file.
      const [house] = await tx.select().from(houses).where(eq(houses.id, houseId)).for('update');
      if (!house) return Response.json({ error: 'ไม่พบบ้าน' }, { status: 404 });
      const [member] = await tx.select().from(memberships)
        .where(and(eq(memberships.houseId, houseId), eq(memberships.userId, user.id)));
      if (house.createdBy !== user.id || member?.role !== 'owner')
        return Response.json({ error: 'เฉพาะเจ้าของบ้านหลักเท่านั้นที่ลบบ้านได้' }, { status: 403 });
      await deleteHouseImages(houseId);
      // Foreign keys cascade to memberships, categories, items, batches and history.
      await tx.delete(houses).where(eq(houses.id, houseId));
      return null;
    });
    return result ?? await houseExitResponse(user.id);
  } catch {
    // Keep the house row on storage errors so its namespace can be retried.
    return Response.json({ error: 'ลบบ้านไม่สำเร็จ รูปบางส่วนอาจถูกลบแล้ว กรุณากดยืนยันอีกครั้งเพื่อลบให้ครบ' }, { status: 503 });
  }
}
