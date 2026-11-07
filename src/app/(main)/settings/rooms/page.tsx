import { activeHouse } from '@/lib/access';
import { redirect } from 'next/navigation';
import { roomSummaries } from '@/lib/room-data';
import { RoomBoard } from '@/components/room-board';
export default async function RoomsPage() {
  const selected = await activeHouse(); if (!selected) redirect('/welcome');
  return <RoomBoard houseId={selected.house.id} initialRooms={await roomSummaries(selected.house.id)} management/>;
}
