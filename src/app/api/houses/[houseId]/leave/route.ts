import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { houses, memberships } from '@/db/schema';
import { currentUser, unauthorized } from '@/lib/access';
import { houseExitResponse } from '@/lib/house-exit';

export async function POST(_: Request, { params }: { params: Promise<{ houseId: string }> }) {
  const { houseId } = await params;
  if (!z.uuid().safeParse(houseId).success) return Response.json({ error: 'บ้านไม่ถูกต้อง' }, { status: 400 });
  const user = await currentUser();
  if (!user) return unauthorized();
  const result = await db().transaction(async tx => {
    const [house] = await tx.select().from(houses).where(eq(houses.id, houseId)).for('update');
    if (!house) return Response.json({ error: 'ไม่พบบ้าน' }, { status: 404 });
    const predicate = and(eq(memberships.houseId, houseId), eq(memberships.userId, user.id));
    const [member] = await tx.select().from(memberships).where(predicate).for('update');
    if (!member) return unauthorized();
    if (member.role === 'owner' || house.createdBy === user.id)
      return Response.json({ error: 'เจ้าของบ้านหลักออกจากบ้านไม่ได้ กรุณาใช้เมนูลบบ้าน' }, { status: 403 });
    await tx.delete(memberships).where(predicate);
    return null;
  });
  return result ?? await houseExitResponse(user.id);
}
