import { InventoryContent } from '@/components/inventory-content';
import { activeHouse } from '@/lib/access';
import { redirect } from 'next/navigation';
export default async function InventoryPage() {
  const selected = await activeHouse(); if (!selected) redirect('/');
  return <InventoryContent houseId={selected.house.id} />;
}
