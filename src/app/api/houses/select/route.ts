import { NextResponse } from 'next/server';
import { db } from '@/db';
import { memberships } from '@/db/schema';
import { ACTIVE_HOUSE_COOKIE, currentUser, unauthorized } from '@/lib/access';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = z.object({ houseId: z.uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: 'บ้านไม่ถูกต้อง' }, { status: 400 });
  const [member] = await db().select({ houseId: memberships.houseId }).from(memberships)
    .where(and(eq(memberships.houseId, parsed.data.houseId), eq(memberships.userId, user.id)));
  if (!member) return unauthorized();
  const response = NextResponse.json({ id: member.houseId });
  response.cookies.set(ACTIVE_HOUSE_COOKIE, member.houseId, { httpOnly: true, sameSite: 'lax', path: '/' });
  return response;
}
