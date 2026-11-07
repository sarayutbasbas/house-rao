import { activeHouse } from '@/lib/access';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { RoomCover } from '@/components/room-board';
import { InventoryContent } from '@/components/inventory-content';
export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const selected = await activeHouse(); if (!selected) redirect('/welcome');
  if (!z.uuid().safeParse(roomId).success) notFound();
  const [room] = await db().select().from(rooms).where(and(eq(rooms.id, roomId), eq(rooms.houseId, selected.house.id)));
  if (!room) notFound();
  return <><RoomCover room={room}/><div className="room-detail-content"><InventoryContent houseId={selected.house.id} roomId={room.id}/></div></>;
}
