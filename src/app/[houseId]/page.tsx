import { houseUser } from '@/lib/access';
import { HomeContent } from '@/components/home-content';
import { redirect } from 'next/navigation';

export default async function Dashboard({ params }: { params: Promise<{ houseId: string }> }) {
  const { houseId } = await params;
  if (!await houseUser(houseId)) redirect('/');
  return <HomeContent houseId={houseId} />;
}
