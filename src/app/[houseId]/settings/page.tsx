import { houseUser } from '@/lib/access';
import { SettingsContent } from '@/components/settings-content';
import { redirect } from 'next/navigation';

export default async function SettingsPage({ params }: { params: Promise<{ houseId: string }> }) {
  const { houseId } = await params;
  const user = await houseUser(houseId);
  if (!user) redirect('/');
  return <SettingsContent houseId={houseId} userId={user.id} />;
}
