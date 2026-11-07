import { db } from '@/db';
import { rooms, items, categories } from '@/db/schema';
import { and, asc, eq, sql } from 'drizzle-orm';

export async function roomSummaries(houseId: string) {
  return db().select({ id: rooms.id, houseId: rooms.houseId, name: rooms.name, imageUrl: rooms.imageUrl,
    description: rooms.description, createdAt: rooms.createdAt, itemCount: sql<number>`count(${items.id})::int` })
    .from(rooms).leftJoin(items, and(eq(items.roomId, rooms.id), eq(items.archived, false)))
    .where(eq(rooms.houseId, houseId)).groupBy(rooms.id).orderBy(asc(rooms.createdAt), asc(rooms.id));
}

/** Check the whole location chain before persisting any item, including moves. */
export async function validItemLocation(houseId: string, roomId: string | null, categoryId: string | null,
  client: Pick<ReturnType<typeof db>, 'select'> = db()) {
  if (roomId) {
    const [room] = await client.select({ id: rooms.id }).from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.houseId, houseId))).for('key share');
    if (!room) return false;
  }
  if (categoryId) {
    const [category] = await client.select().from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.houseId, houseId))).for('share');
    if (!category || category.roomId !== roomId) return false;
  }
  return true;
}
