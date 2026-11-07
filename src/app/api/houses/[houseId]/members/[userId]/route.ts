import { db } from '@/db';
import { houses, memberships } from '@/db/schema';
import { currentUser, unauthorized } from '@/lib/access';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { canChangeRole, canRemoveMember } from '@/lib/member-permissions';

type Context = { params: Promise<{ houseId: string; userId: string }> };

async function permission(houseId: string, targetUserId: string) {
  if (!z.uuid().safeParse(houseId).success || !z.uuid().safeParse(targetUserId).success) return null;
  const user = await currentUser();
  if (!user) return null;
  const [[house], [actor], [target]] = await Promise.all([
    db().select({ createdBy: houses.createdBy }).from(houses).where(eq(houses.id, houseId)),
    db().select({ role: memberships.role }).from(memberships).where(and(eq(memberships.houseId, houseId), eq(memberships.userId, user.id))),
    db().select({ role: memberships.role }).from(memberships).where(and(eq(memberships.houseId, houseId), eq(memberships.userId, targetUserId))),
  ]);
  return { user, house, actor, target };
}

export async function PATCH(request: Request, { params }: Context) {
  const { houseId, userId } = await params;
  const access = await permission(houseId, userId);
  if (!access?.actor || access.actor.role !== 'owner') return unauthorized();
  if (!access.target) return Response.json({ error: 'ไม่พบสมาชิก' }, { status: 404 });
  if (!access.house || !canChangeRole({ actorId: access.user.id, actorRole: access.actor.role,
    targetId: userId, targetRole: access.target.role, creatorId: access.house.createdBy }))
    return Response.json({ error: 'ไม่สามารถเปลี่ยนสิทธิ์เจ้าของบ้านหลักได้' }, { status: 403 });
  const parsed = z.object({ role: z.enum(['member', 'co_owner']) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: 'สิทธิ์ไม่ถูกต้อง' }, { status: 400 });
  const [updated] = await db().update(memberships).set({ role: parsed.data.role })
    .where(and(eq(memberships.houseId, houseId), eq(memberships.userId, userId))).returning({ role: memberships.role });
  return Response.json(updated);
}

export async function DELETE(_: Request, { params }: Context) {
  const { houseId, userId } = await params;
  const access = await permission(houseId, userId);
  if (!access?.actor || !['owner', 'co_owner'].includes(access.actor.role)) return unauthorized();
  if (!access.target) return Response.json({ error: 'ไม่พบสมาชิก' }, { status: 404 });
  if (!access.house || !canRemoveMember({ actorId: access.user.id, actorRole: access.actor.role,
    targetId: userId, targetRole: access.target.role, creatorId: access.house.createdBy }))
    return Response.json({ error: 'ไม่มีสิทธิ์นำสมาชิกนี้ออก' }, { status: 403 });
  await db().delete(memberships).where(and(eq(memberships.houseId, houseId), eq(memberships.userId, userId)));
  return Response.json({ ok: true });
}
