import { db } from "@/db";
import { items, rooms, categories, shoppingEntries } from "@/db/schema";
import { and, asc, eq, sql, count } from "drizzle-orm";
export async function shoppingList(houseId: string) {
  const rows = await db()
    .select({
      item: items,
      room: rooms,
      category: categories,
      entry: shoppingEntries,
    })
    .from(items)
    .leftJoin(rooms, eq(items.roomId, rooms.id))
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .leftJoin(shoppingEntries, eq(items.id, shoppingEntries.itemId))
    .where(
      and(
        eq(items.houseId, houseId),
        eq(items.archived, false),
        sql`(${items.quantity} <= ${items.minimum} OR ${shoppingEntries.itemId} IS NOT NULL)`,
      ),
    )
    .orderBy(asc(items.name));
  return rows.map(({ item, room, category, entry }) => ({
    ...item,
    room,
    category,
    shopping: {
      checked: entry?.checked ?? false,
      quantity:
        entry?.quantity ??
        Math.min(
          999999 - item.quantity,
          Math.max(1, item.minimum + 1 - item.quantity),
        ),
      expiryDate: entry?.expiryDate ?? null,
    },
  }));
}
export type ShoppingItem = Awaited<ReturnType<typeof shoppingList>>[number];

// Same membership criteria as shoppingList, without loading images or item details.
export async function shoppingCount(houseId: string) {
  const [row] = await db().select({ count: count() }).from(items)
    .leftJoin(shoppingEntries, eq(items.id, shoppingEntries.itemId))
    .where(and(eq(items.houseId, houseId), eq(items.archived, false),
      sql`(${items.quantity} <= ${items.minimum} OR ${shoppingEntries.itemId} IS NOT NULL)`));
  return row.count;
}
