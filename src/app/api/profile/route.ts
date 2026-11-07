import { db } from '@/db';
import { users } from '@/db/schema';
import { currentUser, unauthorized } from '@/lib/access';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = z.object({ name: z.string().trim().min(1).max(80) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: 'ชื่อต้องมี 1–80 ตัวอักษร' }, { status: 400 });
  const [updated] = await db().update(users).set({ name: parsed.data.name }).where(eq(users.id, user.id))
    .returning({ name: users.name });
  return Response.json(updated);
}
