import { validItemLocation } from '@/lib/room-data';
import { db } from '@/db';
import { rooms, categories, itemBatches, items, stockEvents } from '@/db/schema';
import { houseUser, unauthorized } from '@/lib/access';
import { createItemInput } from '@/lib/validation';
import { stockSummary } from '@/lib/stock';
import { and, desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const url = new URL(request.url); const houseId = url.searchParams.get('houseId');
  if (!houseId || !await houseUser(houseId)) return unauthorized();
  const archived = url.searchParams.get('archived') === 'true';
  const rows = await db().select({ item: items, category: categories, room: rooms }).from(items).leftJoin(categories, eq(items.categoryId, categories.id)).leftJoin(rooms, eq(items.roomId, rooms.id)).where(and(eq(items.houseId, houseId), url.searchParams.get('scope') === 'all' ? undefined : eq(items.archived, archived))).orderBy(desc(items.updatedAt));
  return Response.json(rows.map(({ item, category, room }) => ({ ...item, category, room })));
}
export async function POST(request: Request) {
  try {
    const data = createItemInput.parse(await request.json()); const user = await houseUser(data.houseId); if (!user) return unauthorized();

    const { batches, quantity, expiryDate, ...metadata } = data;
    const initialBatches = (batches ?? [{ quantity: quantity ?? 0, expiryDate: expiryDate ?? null }]).filter(batch => batch.quantity > 0);
    const item = await db().transaction(async tx => {
      if (!await validItemLocation(data.houseId, data.roomId ?? null, data.categoryId ?? null, tx)) throw new Error('Invalid location');
      const [created] = await tx.insert(items).values({ ...metadata, archived: false, quantity: 0, expiryDate: null }).returning();
      if (initialBatches.length) await tx.insert(itemBatches).values(initialBatches.map(batch => ({ ...batch, itemId: created.id })));
      const updated = await stockSummary(tx, created.id);
      if (updated.quantity) await tx.insert(stockEvents).values({ itemId: created.id, userId: user.id, delta: updated.quantity, quantityAfter: updated.quantity });
      return updated;
    });
    return Response.json(item, { status: 201 });
  } catch { return Response.json({ error: 'ข้อมูลสินค้าไม่ถูกต้อง' }, { status: 400 }); }
}
