import { validItemLocation } from '@/lib/room-data';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { houseUser, unauthorized } from '@/lib/access';
import { eq } from 'drizzle-orm';
import { categoryInput } from '@/lib/category-input';
type Context = { params: Promise<{ houseId: string }> };
export async function GET(_: Request, { params }: Context) {
  const { houseId } = await params; if (!await houseUser(houseId)) return unauthorized();
  return Response.json(await db().select().from(categories).where(eq(categories.houseId, houseId)));
}
export async function POST(request: Request, { params }: Context) {
  const { houseId } = await params; if (!await houseUser(houseId)) return unauthorized();
  const parsed = categoryInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'ชื่อหมวดหมู่ไม่ถูกต้อง' }, { status: 400 });
  if (!await validItemLocation(houseId, parsed.data.roomId ?? null, null)) return Response.json({ error: 'ห้องไม่ถูกต้อง' }, { status: 400 });
  try { const [category] = await db().insert(categories).values({ houseId, ...parsed.data }).returning(); return Response.json(category, { status: 201 }); }
  catch { return Response.json({ error: 'มีหมวดหมู่นี้แล้ว' }, { status: 409 }); }
}
