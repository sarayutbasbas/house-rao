import { auth } from '@/auth';
import { db } from '@/db';
import { memberships, users } from '@/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { houses } from '@/db/schema';

export const currentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.email) return null;
  const email = session.user.email.toLowerCase();
  const [existing] = await db().select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    const image = session.user.image && session.user.image !== existing.image ? session.user.image : undefined;
    const name = !existing.name && session.user.name ? session.user.name : undefined;
    if (image || name) {
      const [updated] = await db().update(users).set({ ...(image && { image }), ...(name && { name }) })
        .where(eq(users.id, existing.id)).returning();
      return updated;
    }
    return existing;
  }
  const [created] = await db().insert(users).values({ email, name: session.user.name, image: session.user.image })
    .onConflictDoNothing().returning();
  if (created) return created;
  const [user] = await db().select().from(users).where(eq(users.email, email));
  return user;
});
export const houseUser = cache(async (houseId: string) => {
  const user = await currentUser();
  if (!user) return null;
  const [membership] = await db().select().from(memberships).where(and(eq(memberships.houseId, houseId), eq(memberships.userId, user.id))).limit(1);
  return membership ? user : null;
});
export const unauthorized = () => Response.json({ error: 'กรุณาเข้าสู่ระบบหรือเข้าร่วมบ้านก่อน' }, { status: 403 });

export const ACTIVE_HOUSE_COOKIE = 'house-rao-active-house';

export const activeHouse = cache(async () => {
  const user = await currentUser();
  if (!user) return null;
  const selectedId = (await cookies()).get(ACTIVE_HOUSE_COOKIE)?.value;
  const rows = await db().select({ house: houses, role: memberships.role })
    .from(memberships).innerJoin(houses, eq(memberships.houseId, houses.id))
    .where(eq(memberships.userId, user.id)).orderBy(asc(memberships.joinedAt));
  const selected = rows.find(row => row.house.id === selectedId) ?? rows[0];
  return selected ? { ...selected, user } : null;
});
