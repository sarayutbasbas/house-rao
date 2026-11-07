import { activeHouse, currentUser } from '@/lib/access';
import { redirect } from 'next/navigation';
import { AppFrame } from '@/components/app-frame';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/login');
  const selected = await activeHouse();
  if (!selected) redirect('/welcome');
  return <AppFrame houseId={selected.house.id} houseName={selected.house.name}
    userName={user.name ?? user.email} userImage={user.image}>{children}</AppFrame>;
}
