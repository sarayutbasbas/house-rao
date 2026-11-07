import { db } from '@/db';
import { houses, memberships } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { houseUser, unauthorized } from '@/lib/access';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length'));
  if (contentLength > 4_200_000) return Response.json({ error: 'รูปก่อนส่งใหญ่เกิน 4 MB' }, { status: 413 });
  const form = await request.formData(); const houseId = form.get('houseId'); const file = form.get('file');
  if (typeof houseId !== 'string') return unauthorized();
  const user = await houseUser(houseId);
  if (!user) return unauthorized();
  if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4_000_000) return Response.json({ error: 'รูปก่อนส่งต้องเป็น JPG, PNG หรือ WebP ขนาดไม่เกิน 4 MB' }, { status: 400 });
  const kind = form.get('kind');
  if (kind !== null && kind !== 'product' && kind !== 'room') return Response.json({ error: 'ประเภทภาพไม่ถูกต้อง' }, { status: 400 });
  // Old forms without a kind still submit landscape crops.
  const portrait = kind === 'product';
  let optimized: Buffer;
  try {
    const original = Buffer.from(await file.arrayBuffer());
    const image = sharp(original, { limitInputPixels: 25_000_000, failOn: 'error' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format)) throw new Error('Invalid image format');
    optimized = await image.rotate().resize({ width: portrait ? 1200 : 1600, height: portrait ? 1600 : 900, fit: 'cover', position: 'centre' }).webp({ quality: 78, effort: 4 }).toBuffer();
    if (optimized.length > 1_000_000) optimized = await sharp(original, { limitInputPixels: 25_000_000 }).rotate().resize({ width: portrait ? 900 : 1280, height: portrait ? 1200 : 720, fit: 'cover', position: 'centre' }).webp({ quality: 60, effort: 4 }).toBuffer();
    if (optimized.length > 1_000_000) return Response.json({ error: 'รูปหลังบีบอัดยังใหญ่เกิน 1 MB กรุณาเลือกรูปอื่น' }, { status: 413 });
  } catch {
    return Response.json({ error: 'ไฟล์รูปไม่ถูกต้องหรือมีขนาดภาพใหญ่เกินไป' }, { status: 400 });
  }
  return db().transaction(async tx => {
  const [house] = await tx.select({ id: houses.id }).from(houses).where(eq(houses.id, houseId)).for('share');
  if (!house) return Response.json({ error: 'บ้านนี้ถูกลบแล้ว' }, { status: 404 });
  const [member] = await tx.select({ userId: memberships.userId }).from(memberships).where(and(eq(memberships.houseId, houseId), eq(memberships.userId, user.id)));
  if (!member) return unauthorized();
  const extension = 'webp';
  if (process.env.STORAGE_DRIVER === 'local') {
    const filename = `${crypto.randomUUID()}.${extension}`;
    const dir = path.join(/* turbopackIgnore: true */ process.env.LOCAL_UPLOAD_DIR || '/app/data/uploads', houseId);
    await mkdir(/* turbopackIgnore: true */ dir, { recursive: true });
    await writeFile(path.join(/* turbopackIgnore: true */ dir, filename), optimized, { flag: 'wx' });
    return Response.json({ url: `/api/images/${houseId}/${filename}`, bytes: optimized.length });
  }
  const blob = await put(`houses/${houseId}/items/${crypto.randomUUID()}.${extension}`, optimized, { access: 'public', contentType: 'image/webp' });
  return Response.json({ url: blob.url, bytes: optimized.length });
  });
}
