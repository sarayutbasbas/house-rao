import { db } from '@/db';
import { categories } from '@/db/schema';
import { houseUser, unauthorized } from '@/lib/access';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { categoryInput } from '@/lib/category-input';

type Context = { params: Promise<{ houseId: string; categoryId: string }> };


export async function PATCH(request: Request, { params }: Context) {
  const { houseId, categoryId } = await params;
  if (!z.uuid().safeParse(houseId).success || !z.uuid().safeParse(categoryId).success) return Response.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
  if (!await houseUser(houseId)) return unauthorized();
  const parsed = categoryInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'กรุณาระบุชื่อและไอคอนหมวดหมู่ให้ถูกต้อง' }, { status: 400 });
  const [existing] = await db().select().from(categories).where(and(eq(categories.id, categoryId), eq(categories.houseId, houseId)));
  if (!existing) return Response.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
  if (parsed.data.roomId !== undefined && parsed.data.roomId !== existing.roomId) return Response.json({ error: 'ย้ายสินค้าแต่ละชิ้นไปห้องใหม่ได้จากหน้าแก้ไขสินค้า' }, { status: 400 });
  try {
    const [category] = await db().update(categories).set(parsed.data)
      .where(and(eq(categories.id, categoryId), eq(categories.houseId, houseId))).returning();
    return category ? Response.json(category) : Response.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : error;
    if (cause && typeof cause === 'object' && 'code' in cause && cause.code === '23505') return Response.json({ error: 'มีหมวดหมู่ชื่อนี้แล้ว' }, { status: 409 });
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { houseId, categoryId } = await params;
  if (!z.uuid().safeParse(houseId).success || !z.uuid().safeParse(categoryId).success) return Response.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
  if (!await houseUser(houseId)) return unauthorized();
  // The existing FK uses ON DELETE SET NULL: products and their stock stay intact.
  const [deleted] = await db().delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.houseId, houseId))).returning({ id: categories.id });
  return deleted ? Response.json(deleted) : Response.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
}
