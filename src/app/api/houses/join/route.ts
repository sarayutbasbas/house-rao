import { db } from '@/db';
import { houses, memberships } from '@/db/schema';
import { ACTIVE_HOUSE_COOKIE, currentUser, unauthorized } from '@/lib/access';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  const user = await currentUser(); if (!user) return unauthorized();
  const parsed = z.object({ code: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: 'รหัสเชิญไม่ถูกต้อง' }, { status: 400 });
  const [house] = await db().select().from(houses).where(eq(houses.inviteCode, parsed.data.code.trim())).limit(1);
  if (!house) return Response.json({ error: 'ไม่พบรหัสเชิญนี้' }, { status: 404 });
  await db().insert(memberships).values({ houseId: house.id, userId: user.id }).onConflictDoNothing();
  const response = NextResponse.json({ id: house.id });
  response.cookies.set(ACTIVE_HOUSE_COOKIE, house.id, { httpOnly: true, sameSite: 'lax', path: '/' });
  return response;
}
