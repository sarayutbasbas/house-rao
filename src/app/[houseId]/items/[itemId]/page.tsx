import { db } from '@/db';
import { rooms, categories, itemBatches, items } from '@/db/schema';
import { houseUser } from '@/lib/access';
import { and, asc, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { ItemDetail } from '@/components/item-detail';

export default async function ItemPage({ params }: { params: Promise<{ houseId: string; itemId: string }> }) {
  const { houseId, itemId } = await params;
  if (!await houseUser(houseId)) redirect('/');
  const [row] = await db().select({ item: items, category: categories, room: rooms }).from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id)).leftJoin(rooms, eq(items.roomId, rooms.id))
    .where(and(eq(items.id, itemId), eq(items.houseId, houseId)));
  if (!row) notFound();
  const [cats, batches, roomList] = await Promise.all([
    db().select().from(categories).where(eq(categories.houseId, houseId)),
    db().select().from(itemBatches).where(eq(itemBatches.itemId, itemId))
      .orderBy(asc(itemBatches.expiryDate), asc(itemBatches.receivedAt), asc(itemBatches.id)),
    db().select().from(rooms).where(eq(rooms.houseId, houseId)),
  ]);
  return <ItemDetail houseId={houseId} initialItem={{ ...row.item, category: row.category, room: row.room, batches }} categories={cats} rooms={roomList} />;
}
