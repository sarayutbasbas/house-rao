import { HistoryContent } from '@/components/history-content';
import { houseUser } from '@/lib/access';
import { redirect } from 'next/navigation';

export default async function HistoryPage({ params }: { params: Promise<{ houseId: string }> }) {
  const { houseId } = await params;
  if (!await houseUser(houseId)) redirect('/');
  return <HistoryContent houseId={houseId} />;
}
