import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { memberships } from '@/db/schema';
import { ACTIVE_HOUSE_COOKIE } from './access';

export async function houseExitResponse(userId: string) {
  const [next] = await db().select({ id: memberships.houseId }).from(memberships)
    .where(eq(memberships.userId, userId)).orderBy(asc(memberships.joinedAt)).limit(1);
  const response = NextResponse.json({ ok: true, nextHref: next ? '/home' : '/welcome' });
  if (next) response.cookies.set(ACTIVE_HOUSE_COOKIE, next.id, { httpOnly: true, sameSite: 'lax', path: '/' });
  else response.cookies.delete(ACTIVE_HOUSE_COOKIE);
  return response;
}
