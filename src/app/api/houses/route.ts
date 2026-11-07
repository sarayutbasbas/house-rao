import { db } from '@/db';
import { categories, houses, memberships } from '@/db/schema';
import { currentUser, unauthorized } from '@/lib/access';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { ACTIVE_HOUSE_COOKIE } from '@/lib/access';

export async function GET() {
  const user = await currentUser(); if (!user) return unauthorized();
  const rows = await db().select({ id: houses.id, name: houses.name, role: memberships.role }).from(memberships).innerJoin(houses, eq(memberships.houseId, houses.id)).where(eq(memberships.userId, user.id));
  return Response.json(rows);
}
export async function POST(request: Request) {
  const user = await currentUser(); if (!user) return unauthorized();
  try {
    const { name, houseNumber } = z.object({ name: z.string().trim().min(1).max(80), houseNumber: z.string().trim().max(50).optional() }).parse(await request.json());
    const house = await db().transaction(async tx => {
    const [created] = await tx.insert(houses).values({ name, houseNumber: houseNumber || null, inviteCode: randomBytes(12).toString('base64url'), createdBy: user.id }).returning();
    await tx.insert(memberships).values({ houseId: created.id, userId: user.id, role: 'owner' });
    await tx.insert(categories).values([
      { houseId: created.id, name: 'อาหารและเครื่องปรุง', emoji: 'food', color: '#fff1da' },
      { houseId: created.id, name: 'ของใช้ส่วนตัว', emoji: 'bottle', color: '#e9edf9' },
      { houseId: created.id, name: 'ทำความสะอาด', emoji: 'sparkles', color: '#e2f4eb' },
      { houseId: created.id, name: 'อุปกรณ์อื่นๆ', emoji: 'battery', color: '#f3e8f3' },
    ]);
    return created;
    });
    const response = NextResponse.json(house, { status: 201 });
    response.cookies.set(ACTIVE_HOUSE_COOKIE, house.id, { httpOnly: true, sameSite: 'lax', path: '/' });
    return response;
  } catch { return Response.json({ error: 'ข้อมูลบ้านไม่ถูกต้อง' }, { status: 400 }); }
}
