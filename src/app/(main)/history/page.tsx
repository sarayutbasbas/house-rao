import { HistoryContent } from '@/components/history-content';
import { activeHouse } from '@/lib/access';
import { redirect } from 'next/navigation';

export default async function HistoryPage() {
  const selected = await activeHouse();
  if (!selected) redirect('/');
  return <HistoryContent houseId={selected.house.id} />;
}
