import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const id = '10000000-0000-4000-8000-000000000001';
let listImpl, delImpl;
mock.module('@vercel/blob', { namedExports: { list: options => listImpl(options), del: urls => delImpl(urls) } });
const { deleteHouseImages } = await import('../src/lib/house-storage.ts');
test('local deletion is restricted to the selected house and is retryable', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'house-delete-'));
  process.env.STORAGE_DRIVER = 'local'; process.env.LOCAL_UPLOAD_DIR = root;
  try {
    await mkdir(path.join(root, id)); await writeFile(path.join(root, id, 'photo.webp'), 'image');
    await writeFile(path.join(root, 'other-house.webp'), 'keep');
    await assert.rejects(deleteHouseImages('../'));
    await deleteHouseImages(id); await deleteHouseImages(id);
    await assert.rejects(access(path.join(root, id)));
    await access(path.join(root, 'other-house.webp'));
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('Blob pagination collects every page before deletion and scopes requests', async () => {
  process.env.STORAGE_DRIVER = 'blob';
  const calls = []; const removed = [];
  listImpl = async ({ prefix, cursor }) => {
    assert.equal(prefix, `houses/${id}/`); calls.push(cursor);
    return { blobs: [{ pathname: `${prefix}${cursor || 'first'}.webp`, url: `https://test/${cursor || 'first'}.webp` }], hasMore: !cursor, cursor: cursor ? undefined : 'next' };
  };
  delImpl = async urls => { assert.equal(calls.length, 2); removed.push(...urls); };
  await deleteHouseImages(id);
  assert.deepEqual(calls, [undefined, 'next']); assert.equal(removed.length, 2);
});
test('storage failures are surfaced and foreign namespaces are never deleted', async () => {
  listImpl = async () => ({ blobs: [{ pathname: 'houses/another/photo.webp', url: 'https://test/foreign' }], hasMore: false });
  delImpl = async () => assert.fail('Must not delete foreign files');
  await assert.rejects(deleteHouseImages(id), /namespace/);
  listImpl = async () => ({ blobs: [{ pathname: `houses/${id}/photo.webp`, url: 'https://test/own' }], hasMore: false });
  delImpl = async () => { throw new Error('storage unavailable'); };
  await assert.rejects(deleteHouseImages(id), /storage unavailable/);
});
