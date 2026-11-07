import { validItemLocation } from '@/lib/room-data';
import { db } from '@/db';
import { rooms, categories, itemBatches, items, stockEvents } from '@/db/schema';
import { houseUser, unauthorized } from '@/lib/access';
import { itemInput } from '@/lib/validation';
import { lockStock, stockErrorResponse, stockSummary } from '@/lib/stock';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';

type Context = { params: Promise<{ itemId: string }> };
export async function GET(_request: Request, { params }: Context) {
  const { itemId } = await params;
  if (!z.uuid().safeParse(itemId).success) return Response.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
  const [row] = await db().select({ item: items, category: categories, room: rooms }).from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id)).leftJoin(rooms, eq(items.roomId, rooms.id)).where(eq(items.id, itemId));
  if (!row || !await houseUser(row.item.houseId)) return unauthorized();
  const [cats, batches, roomList] = await Promise.all([
    db().select().from(categories).where(eq(categories.houseId, row.item.houseId)),
    db().select().from(itemBatches).where(eq(itemBatches.itemId, itemId))
      .orderBy(asc(itemBatches.expiryDate), asc(itemBatches.receivedAt), asc(itemBatches.id)),
    db().select().from(rooms).where(eq(rooms.houseId, row.item.houseId)),
  ]);
  return Response.json({ item: { ...row.item, category: row.category, room: row.room, batches }, categories: cats, rooms: roomList }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: Request, { params }: Context) {
  const { itemId } = await params;
  if (!z.uuid().safeParse(itemId).success) return Response.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
  const [existing] = await db().select().from(items).where(eq(items.id, itemId));
  const user = existing && await houseUser(existing.houseId);
  if (!existing || !user) return unauthorized();
  const body = await request.json().catch(() => null);
  if (body && typeof body === 'object' && ('expiryDate' in body || 'quantity' in body || 'batches' in body)) return Response.json({ error: 'กรุณาแก้จำนวนและวันหมดอายุในแต่ละชุดสต็อก' }, { status: 400 });
  const parsed = itemInput.omit({ houseId: true }).partial().safeParse(body);
  if (!parsed.success) return Response.json({ error: 'ข้อมูลสินค้าไม่ถูกต้อง' }, { status: 400 });
  if (parsed.data.categoryId) {
    const [category] = await db().select().from(categories).where(and(eq(categories.id, parsed.data.categoryId), eq(categories.houseId, existing.houseId)));
    if (!category) return Response.json({ error: 'หมวดหมู่ไม่ถูกต้อง' }, { status: 400 });
  }
  try {
    const item = await db().transaction(async tx => {
      const locked = await lockStock(tx, itemId);
      if (!await validItemLocation(existing.houseId, parsed.data.roomId === undefined ? locked.roomId : parsed.data.roomId, parsed.data.categoryId === undefined ? locked.categoryId : parsed.data.categoryId, tx)) throw new Error('ห้องหรือหมวดหมู่ไม่ตรงกัน');
      if (parsed.data.archived === true) {
        await tx.update(itemBatches).set({ quantity: 0 }).where(eq(itemBatches.itemId, itemId));
        if (locked.quantity) await tx.insert(stockEvents).values({ itemId, userId: user.id, delta: -locked.quantity, quantityAfter: 0 });
      }
      await tx.update(items).set({ ...parsed.data, updatedAt: new Date() }).where(eq(items.id, itemId));
      return stockSummary(tx, itemId);
    });
    return Response.json(item);
  } catch (error) { return stockErrorResponse(error); }
}

export async function DELETE(request: Request, { params }: Context) {
  const { itemId } = await params;
  if (!z.uuid().safeParse(itemId).success) return Response.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
  const [existing] = await db().select().from(items).where(eq(items.id, itemId));
  if (!existing || !await houseUser(existing.houseId)) return unauthorized();
  if ((await request.json().catch(() => null))?.confirm !== true) return Response.json({ error: 'กรุณายืนยันการลบสินค้า' }, { status: 400 });
  try {
    await db().transaction(async tx => {
      await lockStock(tx, itemId);
      await tx.delete(items).where(and(eq(items.id, itemId), eq(items.houseId, existing.houseId)));
    });
    return Response.json({ ok: true });
  } catch (error) { return stockErrorResponse(error); }
}
