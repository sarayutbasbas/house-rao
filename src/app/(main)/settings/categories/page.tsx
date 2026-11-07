import { activeHouse } from '@/lib/access';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { categories, rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CategoryManager } from '@/components/category-manager';
export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const selected = await activeHouse(); if (!selected) redirect('/');
  const [rows, roomList, query] = await Promise.all([db().select().from(categories).where(eq(categories.houseId, selected.house.id)), db().select().from(rooms).where(eq(rooms.houseId, selected.house.id)), searchParams]);
  return <CategoryManager key={`${selected.house.id}:${query.room ?? ''}`} houseId={selected.house.id} initialCategories={rows} rooms={roomList} initialRoomId={roomList.some(r => r.id === query.room) ? query.room : ''} />;
}
