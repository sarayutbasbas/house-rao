import { db } from '@/db';
import { rooms } from '@/db/schema';
import { houseUser, unauthorized } from '@/lib/access';
import { roomInput } from '@/lib/room-input';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
type Context = { params: Promise<{ houseId: string; roomId: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const { houseId, roomId } = await params;
  if (!z.uuid().safeParse(houseId).success || !z.uuid().safeParse(roomId).success || !await houseUser(houseId)) return unauthorized();
  const parsed = roomInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'ข้อมูลห้องไม่ถูกต้อง' }, { status: 400 });
  try {
    const [room] = await db().update(rooms).set(parsed.data).where(and(eq(rooms.houseId, houseId), eq(rooms.id, roomId))).returning();
    return room ? Response.json(room) : Response.json({ error: 'ไม่พบห้อง' }, { status: 404 });
  } catch { return Response.json({ error: 'บันทึกห้องไม่สำเร็จ อาจมีชื่อห้องนี้แล้ว' }, { status: 409 }); }
}
export async function DELETE(request: Request, { params }: Context) {
  const { houseId, roomId } = await params;
  if (!z.uuid().safeParse(houseId).success || !z.uuid().safeParse(roomId).success || !await houseUser(houseId)) return unauthorized();
  if ((await request.json().catch(() => null))?.confirm !== true) return Response.json({ error: 'กรุณายืนยันการลบห้อง' }, { status: 400 });
  // Room categories are removed; FK SET NULL retains every product, batch and event.
  const [room] = await db().delete(rooms).where(and(eq(rooms.houseId, houseId), eq(rooms.id, roomId))).returning({ id: rooms.id });
  return room ? Response.json({ ok: true }) : Response.json({ error: 'ไม่พบห้อง' }, { status: 404 });
}
