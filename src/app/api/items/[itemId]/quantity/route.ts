import { db } from '@/db';
import { items } from '@/db/schema';
import { houseUser, unauthorized } from '@/lib/access';
import { consumeStock, stockErrorResponse } from '@/lib/stock';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

type Context = { params: Promise<{ itemId: string }> };
export async function POST(request: Request, { params }: Context) {
  const { itemId } = await params;
  const parsed = z.object({ delta: z.number().int().min(-999999).max(-1), batchId: z.uuid().optional() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success || !z.uuid().safeParse(itemId).success) return Response.json({ error: 'หากต้องการเพิ่มจำนวน กรุณาใช้เติมสต็อกและระบุวันหมดอายุ' }, { status: 400 });
  const [existing] = await db().select().from(items).where(eq(items.id, itemId));
  if (!existing) return Response.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
  const user = await houseUser(existing.houseId); if (!user) return unauthorized();
  try {
    const item = await db().transaction(tx => consumeStock(tx, itemId, user.id, -parsed.data.delta, parsed.data.batchId));
    return Response.json(item);
  } catch (error) { return stockErrorResponse(error); }
}
