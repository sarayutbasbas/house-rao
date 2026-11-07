import { db } from '@/db';
import { itemBatches, items } from '@/db/schema';
import { houseUser, unauthorized } from '@/lib/access';
import { restockInput } from '@/lib/validation';
import { addStock, lockStock, StockError, stockErrorResponse, stockSummary } from '@/lib/stock';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

type Context = { params: Promise<{ itemId: string }> };
async function access(itemId: string) {
  if (!z.uuid().safeParse(itemId).success) return null;
  const [item] = await db().select().from(items).where(eq(items.id, itemId));
  return item ? houseUser(item.houseId) : null;
}

export async function POST(request: Request, { params }: Context) {
  const { itemId } = await params;
  const user = await access(itemId); if (!user) return unauthorized();
  const parsed = restockInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'กรุณากรอกจำนวนเต็มตั้งแต่ 1 และวันหมดอายุให้ถูกต้อง' }, { status: 400 });
  try {
    const item = await db().transaction(tx => addStock(tx, itemId, user.id, parsed.data.batches));
    return Response.json(item, { status: 201 });
  } catch (error) { return stockErrorResponse(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  const { itemId } = await params;
  if (!await access(itemId)) return unauthorized();
  const parsed = z.object({ batchId: z.uuid(), expiryDate: z.iso.date().nullable(), quantity: z.number().int().min(1).max(999999).optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'วันหมดอายุไม่ถูกต้อง' }, { status: 400 });
  try {
    const item = await db().transaction(async tx => {
      await lockStock(tx, itemId);
      const [batch] = await tx.select().from(itemBatches)
        .where(and(eq(itemBatches.id, parsed.data.batchId), eq(itemBatches.itemId, itemId)));
      if (!batch) throw new StockError('ไม่พบชุดสต็อก', 404);
      const quantity = parsed.data.quantity ?? batch.quantity;
      if (quantity > batch.quantity || quantity < 1) throw new StockError('จำนวนที่ต้องการแยกมากกว่าจำนวนคงเหลือ กรุณาโหลดข้อมูลใหม่');
      if (quantity < batch.quantity) {
        await tx.update(itemBatches).set({ quantity: batch.quantity - quantity }).where(eq(itemBatches.id, batch.id));
        await tx.insert(itemBatches).values({ itemId, quantity, expiryDate: parsed.data.expiryDate, receivedAt: batch.receivedAt });
      } else {
        await tx.update(itemBatches).set({ expiryDate: parsed.data.expiryDate }).where(eq(itemBatches.id, batch.id));
      }
      return stockSummary(tx, itemId);
    });
    return Response.json(item);
  } catch (error) { return stockErrorResponse(error); }
}
