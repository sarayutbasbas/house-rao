import { db } from '@/db';
import { rooms } from '@/db/schema';
import { houseUser, unauthorized } from '@/lib/access';
import { roomInput } from '@/lib/room-input';
import { roomSummaries } from '@/lib/room-data';
import { z } from 'zod';
type Context = { params: Promise<{ houseId: string }> };
export async function GET(_: Request, { params }: Context) {
  const { houseId } = await params;
  if (!z.uuid().safeParse(houseId).success || !await houseUser(houseId)) return unauthorized();
  return Response.json(await roomSummaries(houseId), { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(request: Request, { params }: Context) {
  const { houseId } = await params;
  if (!z.uuid().safeParse(houseId).success || !await houseUser(houseId)) return unauthorized();
  const parsed = roomInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'กรุณาระบุชื่อห้องและข้อมูลให้ถูกต้อง' }, { status: 400 });
  try {
    const [room] = await db().insert(rooms).values({ houseId, ...parsed.data }).returning();
    return Response.json({ ...room, itemCount: 0 }, { status: 201 });
  } catch { return Response.json({ error: 'เพิ่มห้องไม่สำเร็จ อาจมีชื่อห้องนี้แล้ว' }, { status: 409 }); }
}
