import { db } from '@/db';
import { itemBatches, items, stockEvents } from '@/db/schema';
import { and, asc, eq, gt } from 'drizzle-orm';

type Transaction = Parameters<Parameters<ReturnType<typeof db>['transaction']>[0]>[0];

export class StockError extends Error {
  constructor(message: string, readonly status = 409) { super(message); }
}

// Every stock mutation locks the parent item first, so concurrent family members
// cannot consume the same units or overwrite the quantity/expiry summary.
export async function lockStock(tx: Transaction, itemId: string) {
  const [item] = await tx.select().from(items).where(eq(items.id, itemId)).for('update');
  if (!item) throw new StockError('ไม่พบสินค้า', 404);
  return item;
}

export async function stockSummary(tx: Transaction, itemId: string) {
  const batches = await tx.select().from(itemBatches).where(eq(itemBatches.itemId, itemId))
    .orderBy(asc(itemBatches.expiryDate), asc(itemBatches.receivedAt), asc(itemBatches.id));
  const live = batches.filter(batch => batch.quantity > 0);
  const quantity = live.reduce((sum, batch) => sum + batch.quantity, 0);
  if (quantity > 999999) throw new StockError('จำนวนรวมต้องไม่เกิน 999,999');
  const expiryDate = live.find(batch => batch.expiryDate !== null)?.expiryDate ?? null;
  const [item] = await tx.update(items).set({ quantity, expiryDate, updatedAt: new Date() })
    .where(eq(items.id, itemId)).returning();
  return { ...item, batches };
}

export async function addStock(tx: Transaction, itemId: string, userId: string,
  batches: { quantity: number; expiryDate: string | null }[]) {
  const item = await lockStock(tx, itemId);
  const delta = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  if (item.quantity + delta > 999999) throw new StockError('จำนวนรวมต้องไม่เกิน 999,999');
  await tx.insert(itemBatches).values(batches.map(batch => ({ ...batch, itemId })));
  await tx.update(items).set({ archived: false }).where(eq(items.id, itemId));
  const updated = await stockSummary(tx, itemId);
  await tx.insert(stockEvents).values({ itemId, userId, delta, quantityAfter: updated.quantity });
  return updated;
}

export async function consumeStock(tx: Transaction, itemId: string, userId: string, count: number, batchId?: string) {
  const item = await lockStock(tx, itemId);
  if (item.archived) throw new StockError('สินค้านี้อยู่ในรายการย้อนหลัง', 404);
  const batches = await tx.select().from(itemBatches)
    .where(and(eq(itemBatches.itemId, itemId), gt(itemBatches.quantity, 0), batchId ? eq(itemBatches.id, batchId) : undefined))
    .orderBy(asc(itemBatches.expiryDate), asc(itemBatches.receivedAt), asc(itemBatches.id));
  if (batches.reduce((sum, batch) => sum + batch.quantity, 0) < count) throw new StockError('จำนวนคงเหลือในชุดสต็อกไม่เพียงพอ');
  let remaining = count;
  for (const batch of batches) {
    const taken = Math.min(remaining, batch.quantity);
    if (!taken) break;
    await tx.update(itemBatches).set({ quantity: batch.quantity - taken }).where(eq(itemBatches.id, batch.id));
    remaining -= taken;
  }
  const updated = await stockSummary(tx, itemId);
  await tx.insert(stockEvents).values({ itemId, userId, delta: -count, quantityAfter: updated.quantity });
  return updated;
}

export function stockErrorResponse(error: unknown) {
  if (error instanceof StockError) return Response.json({ error: error.message }, { status: error.status });
  console.error('Stock operation failed', error instanceof Error ? error.message : 'Unknown error');
  return Response.json({ error: 'บันทึกสต็อกไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
}
