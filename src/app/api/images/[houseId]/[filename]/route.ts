import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { houseUser, unauthorized } from '@/lib/access';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ houseId: string; filename: string }> }) {
  const { houseId, filename } = await params;
  if (!/^[0-9a-f-]{36}$/.test(houseId) || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename)) return new Response(null, { status: 404 });
  if (!await houseUser(houseId)) return unauthorized();
  try {
    const file = await readFile(path.join(/* turbopackIgnore: true */ process.env.LOCAL_UPLOAD_DIR || '/app/data/uploads', houseId, filename));
    const type = filename.endsWith('.jpg') ? 'image/jpeg' : filename.endsWith('.png') ? 'image/png' : 'image/webp';
    return new Response(file, { headers: { 'Content-Type': type, 'Cache-Control': 'private, max-age=60' } });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return new Response(null, { status: 404 });
    throw error;
  }
}
