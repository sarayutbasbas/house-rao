import { db } from '@/db';
import { rooms, categories, items } from '@/db/schema';
import { Inventory } from '@/components/inventory';
import { and, desc, eq } from 'drizzle-orm';

export async function InventoryContent({ houseId, roomId }: { houseId: string; roomId?: string }) {
  const [rows, cats, roomList] = await Promise.all([
    db().select({ item: items, category: categories, room: rooms }).from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id)).leftJoin(rooms, eq(items.roomId, rooms.id))
      .where(and(eq(items.houseId, houseId), roomId ? eq(items.roomId, roomId) : undefined)).orderBy(desc(items.updatedAt)),
    db().select().from(categories).where(eq(categories.houseId, houseId)),
    db().select().from(rooms).where(eq(rooms.houseId, houseId)),
  ]);
  return <Inventory key={roomId ?? houseId} houseId={houseId} initialItems={rows.map(({ item, category, room }) => ({ ...item, category, room }))} categories={cats} rooms={roomList} fixedRoomId={roomId} />;
}
