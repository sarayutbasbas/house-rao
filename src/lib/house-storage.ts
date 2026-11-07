import { del, list } from '@vercel/blob';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

/** Only delete the house namespace; never follow arbitrary item image URLs. */
export async function deleteHouseImages(houseId: string) {
  z.uuid().parse(houseId);
  if (process.env.STORAGE_DRIVER === 'local') {
    const root = process.env.LOCAL_UPLOAD_DIR || '/app/data/uploads';
    await rm(path.join(/* turbopackIgnore: true */ root, houseId), { recursive: true, force: true });
    return;
  }
  const prefix = `houses/${houseId}/`;
  const urls: string[] = [];
  let cursor: string | undefined;
  // Finish pagination before deleting so cursors never traverse a changing listing.
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      if (!blob.pathname.startsWith(prefix)) throw new Error('Unexpected storage namespace');
      urls.push(blob.url);
    }
    if (page.hasMore && !page.cursor) throw new Error('Missing storage cursor');
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  for (let i = 0; i < urls.length; i += 100) await del(urls.slice(i, i + 100));
}
