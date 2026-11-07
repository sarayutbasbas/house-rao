import { SettingsContent } from '@/components/settings-content';
import { activeHouse } from '@/lib/access';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const selected = await activeHouse();
  if (!selected) redirect('/');
  return <SettingsContent houseId={selected.house.id} userId={selected.user.id} />;
}
