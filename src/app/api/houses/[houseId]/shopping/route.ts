import { db } from "@/db";
import {
  houses,
  memberships,
  items,
  shoppingEntries,
  shoppingReceipts,
} from "@/db/schema";
import { houseUser, unauthorized } from "@/lib/access";
import { shoppingList, shoppingCount } from "@/lib/shopping";
import { addStock, StockError, stockErrorResponse } from "@/lib/stock";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
type Context = { params: Promise<{ houseId: string }> };
const entryInput = z.object({
  itemId: z.uuid(),
  quantity: z.number().int().min(1).max(999999),
  expiryDate: z.iso.date().nullable(),
});
async function access(context: Context) {
  const { houseId } = await context.params;
  return {
    houseId,
    user: z.uuid().safeParse(houseId).success ? await houseUser(houseId) : null,
  };
}
export async function GET(request: Request, context: Context) {
  const { houseId, user } = await access(context);
  if (!user) return unauthorized();
  if (new URL(request.url).searchParams.get("count") === "true") return Response.json({ count: await shoppingCount(houseId) }, { headers: { "Cache-Control": "private, no-store" } });
  return Response.json(await shoppingList(houseId), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
type Tx = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];
async function lockHouse(tx: Tx, houseId: string, userId: string) {
  const [house] = await tx
    .select({ id: houses.id })
    .from(houses)
    .where(eq(houses.id, houseId))
    .for("update");
  const [member] = await tx
    .select()
    .from(memberships)
    .where(
      and(eq(memberships.houseId, houseId), eq(memberships.userId, userId)),
    );
  if (!house || !member) throw new StockError("ไม่มีสิทธิ์เข้าถึงบ้านนี้", 403);
}
export async function PATCH(request: Request, context: Context) {
  const { houseId, user } = await access(context);
  if (!user) return unauthorized();
  const parsed = entryInput
    .extend({ checked: z.boolean() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "จำนวนหรือวันหมดอายุไม่ถูกต้อง" },
      { status: 400 },
    );
  try {
    await db().transaction(async (tx) => {
      await lockHouse(tx, houseId, user.id);
      const [item] = await tx
        .select()
        .from(items)
        .where(
          and(eq(items.id, parsed.data.itemId), eq(items.houseId, houseId)),
        )
        .for("update");
      if (!item || item.archived)
        throw new StockError("ไม่พบสินค้าในบ้าน", 404);
      if (item.quantity + parsed.data.quantity > 999999)
        throw new StockError("จำนวนรวมมากเกินไป");
      await tx
        .insert(shoppingEntries)
        .values({ ...parsed.data, houseId })
        .onConflictDoUpdate({
          target: shoppingEntries.itemId,
          set: parsed.data,
        });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return stockErrorResponse(error);
  }
}
export async function POST(request: Request, context: Context) {
  const { houseId, user } = await access(context);
  if (!user) return unauthorized();
  const parsed = z
    .object({
      requestId: z.uuid(),
      entries: z.array(entryInput).min(1).max(200),
    })
    .safeParse(await request.json().catch(() => null));
  if (
    !parsed.success ||
    new Set(parsed.data.entries.map((e) => e.itemId)).size !==
      parsed.data.entries.length
  )
    return Response.json(
      { error: "เลือกรายการที่ซื้อแล้ว 1–200 รายการ" },
      { status: 400 },
    );
  try {
    const result = await db().transaction(async (tx) => {
      await lockHouse(tx, houseId, user.id);
      const [receipt] = await tx
        .select()
        .from(shoppingReceipts)
        .where(
          and(
            eq(shoppingReceipts.houseId, houseId),
            eq(shoppingReceipts.requestId, parsed.data.requestId),
          ),
        );
      if (receipt) return { count: receipt.count };
      for (const expected of [...parsed.data.entries].sort((a, b) =>
        a.itemId.localeCompare(b.itemId),
      )) {
        const [entry] = await tx
          .select()
          .from(shoppingEntries)
          .where(
            and(
              eq(shoppingEntries.houseId, houseId),
              eq(shoppingEntries.itemId, expected.itemId),
            ),
          );
        const [item] = await tx
          .select()
          .from(items)
          .where(and(eq(items.id, expected.itemId), eq(items.houseId, houseId)))
          .for("update");
        if (
          !entry?.checked ||
          !item ||
          item.archived ||
          entry.quantity !== expected.quantity ||
          entry.expiryDate !== expected.expiryDate
        )
          throw new StockError(
            "รายการเปลี่ยนแล้ว กรุณาโหลดใหม่และตรวจของที่ซื้อ",
          );
        await addStock(tx, item.id, user.id, [
          { quantity: entry.quantity, expiryDate: entry.expiryDate },
        ]);
      }
      await tx.delete(shoppingEntries).where(
        and(
          eq(shoppingEntries.houseId, houseId),
          inArray(
            shoppingEntries.itemId,
            parsed.data.entries.map((e) => e.itemId),
          ),
        ),
      );
      await tx
        .insert(shoppingReceipts)
        .values({
          houseId,
          requestId: parsed.data.requestId,
          count: parsed.data.entries.length,
        });
      return { count: parsed.data.entries.length };
    });
    return Response.json(result);
  } catch (error) {
    return stockErrorResponse(error);
  }
}
