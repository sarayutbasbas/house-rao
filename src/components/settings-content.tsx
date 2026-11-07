import { db } from '@/db';
import { categories, houses, memberships, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { SettingsPanel } from '@/components/settings-panel';
import { redirect } from 'next/navigation';

export async function SettingsContent({ houseId, userId }: { houseId: string; userId: string }) {
  const [[house], cats, members, [membership], allHouses] = await Promise.all([
    db().select().from(houses).where(eq(houses.id, houseId)),
    db().select().from(categories).where(eq(categories.houseId, houseId)),
    db().select({ id: users.id, name: users.name, email: users.email, image: users.image, role: memberships.role })
      .from(memberships).innerJoin(users, eq(memberships.userId, users.id)).where(eq(memberships.houseId, houseId)),
    db().select().from(memberships).where(and(eq(memberships.houseId, houseId), eq(memberships.userId, userId))),
    db().select({ id: houses.id, name: houses.name }).from(memberships)
      .innerJoin(houses, eq(memberships.houseId, houses.id)).where(eq(memberships.userId, userId)),
  ]);
  if (!house || !membership) redirect('/');
  const me = members.find(member => member.id === userId);
  return <SettingsPanel houseId={houseId} houseName={house.name} houseNumber={house.houseNumber}
    inviteCode={['owner', 'co_owner'].includes(membership.role) ? house.inviteCode : ''} initialCategories={cats} members={members}
    role={membership.role} userId={userId} userName={me?.name ?? me?.email ?? ''}
    userEmail={me?.email ?? ''} userImage={me?.image ?? null} houses={allHouses} />;
}
