import { HomeContent } from '@/components/home-content';
import { activeHouse } from '@/lib/access';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const selected = await activeHouse();
  if (!selected) redirect('/');
  return <HomeContent houseId={selected.house.id} />;
}
