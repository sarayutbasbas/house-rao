import test from 'node:test';
import assert from 'node:assert/strict';
import { canvasToUploadFile } from '../src/lib/compress-image.ts';

test('Safari returning PNG for a WebP request falls back to a correctly named JPEG', async () => {
  const calls = [];
  const canvas = { toBlob(callback, type) { calls.push(type); callback(new Blob(['image'], { type: type === 'image/webp' ? 'image/png' : type })); } };
  const file = await canvasToUploadFile(canvas, 'photo.png');
  assert.deepEqual(calls, ['image/webp', 'image/jpeg']);
  assert.equal(file.type, 'image/jpeg');
  assert.equal(file.name, 'photo.jpg');
});

test('WebP-capable browsers retain WebP and skip fallback', async () => {
  const calls = [];
  const file = await canvasToUploadFile({ toBlob(callback, type) { calls.push(type); callback(new Blob(['image'], { type })); } }, 'photo.jpg');
  assert.deepEqual(calls, ['image/webp']);
  assert.equal(file.type, 'image/webp');
  assert.equal(file.name, 'photo.webp');
});

test('WebP encoder exceptions also fall back to JPEG', async () => {
  const file = await canvasToUploadFile({ toBlob(callback, type) {
    if (type === 'image/webp') throw new Error('Unsupported encoder');
    callback(new Blob(['image'], { type }));
  } }, 'photo.png');
  assert.equal(file.type, 'image/jpeg');
});
