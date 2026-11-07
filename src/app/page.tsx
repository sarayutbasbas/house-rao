import { activeHouse, currentUser } from '@/lib/access';
import { redirect } from 'next/navigation';
export default async function Home() {
  const user = await currentUser(); if (!user) redirect('/login');
  redirect(await activeHouse() ? '/home' : '/welcome');
}
