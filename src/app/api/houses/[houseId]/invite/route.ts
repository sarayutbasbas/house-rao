import { db } from '@/db';
import { houses, memberships } from '@/db/schema';
import { houseUser, unauthorized } from '@/lib/access';
import { and, eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
type Context = { params: Promise<{ houseId: string }> };
export async function GET(_: Request, { params }: Context) {
  const { houseId } = await params; const user = await houseUser(houseId); if (!user) return unauthorized();
  const [member] = await db().select().from(memberships).where(and(eq(memberships.houseId, houseId), eq(memberships.userId, user.id)));
  if (!member || !['owner', 'co_owner'].includes(member.role)) return unauthorized();
  const [house] = await db().select({ inviteCode: houses.inviteCode }).from(houses).where(eq(houses.id, houseId));
  return house ? Response.json(house) : Response.json({ error: 'ไม่พบบ้าน' }, { status: 404 });
}
export async function POST(_: Request, { params }: Context) {
  const { houseId } = await params; const user = await houseUser(houseId); if (!user) return unauthorized();
  const [member] = await db().select().from(memberships).where(and(eq(memberships.houseId, houseId), eq(memberships.userId, user.id)));
  if (member.role !== 'owner' && member.role !== 'co_owner') return unauthorized();
  const [house] = await db().update(houses).set({ inviteCode: randomBytes(12).toString('base64url') }).where(eq(houses.id, houseId)).returning({ inviteCode: houses.inviteCode });
  return Response.json(house);
}
