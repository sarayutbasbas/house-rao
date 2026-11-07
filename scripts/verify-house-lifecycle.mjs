// Local Docker integration check: creates only temporary users/houses and cleans them up.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import pg from 'pg';
import { encode } from 'next-auth/jwt';
const env = dotenv.parse(fs.readFileSync('.env.docker.local'));
const url = new URL(env.DATABASE_URL); url.hostname = '127.0.0.1'; url.port = '5433';
const db = new pg.Client({ connectionString: url.href }); await db.connect();
const emails = [], houseIds = [];
async function actor(name) {
  const email = `lifecycle-${randomUUID()}@example.test`; emails.push(email);
  const token = await encode({ secret: env.AUTH_SECRET, salt: '__Secure-authjs.session-token', token: { sub: randomUUID(), email, name } });
  return { cookie: `__Secure-authjs.session-token=${token}`, token, email };
}
async function req(actor, path, method = 'GET', body) {
  const r = await fetch(`http://localhost:8002${path}`, { method, headers: { cookie: actor.cookie, ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
  return { status: r.status, data: await r.json() };
}
async function create(owner) {
  const r = await req(owner, '/api/houses', 'POST', { name: 'Lifecycle verification' }); assert.equal(r.status, 201); houseIds.push(r.data.id); return r.data;
}
async function upload(owner, id) {
  const f = new FormData(); f.set('houseId', id); f.set('file', new File([fs.readFileSync('public/house-rao-logo-pastel.png')], 'test.png', { type: 'image/png' }));
  const r = await req(owner, '/api/upload', 'POST', f); assert.equal(r.status, 200); return r.data.url;
}
try {
  const owner = await actor('Owner test'), member = await actor('Member test'), coowner = await actor('Coowner test');
  const target = await create(owner), keep = await create(owner);
  const image = await upload(owner, target.id); await upload(owner, target.id); // orphan upload must also disappear
  const keepImage = await upload(owner, keep.id);
  for (const user of [member, coowner]) assert.equal((await req(user, '/api/houses/join', 'POST', { code: target.inviteCode })).status, 200);
  const coId = (await db.query('select id from users where email=$1', [coowner.email])).rows[0].id;
  assert.equal((await req(owner, `/api/houses/${target.id}/members/${coId}`, 'PATCH', { role: 'co_owner' })).status, 200);
  for (const user of [member, coowner]) assert.equal((await req(user, `/api/houses/${target.id}`, 'DELETE', { confirm: true })).status, 403);
  assert.equal((await req(member, `/api/houses/${target.id}/invite`)).status, 403);
  assert.equal((await req(member, `/api/houses/${target.id}/invite`, 'POST')).status, 403);
  assert.equal((await req(coowner, `/api/houses/${target.id}/invite`)).status, 200);
  const html = await (await fetch('http://localhost:8002/settings', { headers: { cookie: `${member.cookie}; house-rao-active-house=${target.id}` } })).text();
  assert.ok(!html.includes(target.inviteCode), 'Member HTML/RSC must not contain invite secret');
  assert.equal((await req(owner, `/api/houses/${target.id}/leave`, 'POST')).status, 403);
  assert.equal((await req(member, `/api/houses/${target.id}/leave`, 'POST')).data.nextHref, '/welcome');
  assert.equal((await req(member, `/api/items?houseId=${target.id}`)).status, 403);
  assert.equal((await req(coowner, `/api/houses/${target.id}/leave`, 'POST')).status, 200);
  const item = await req(owner, '/api/items', 'POST', { houseId: target.id, name: 'Cascade test', imageUrl: image, unit: 'ชิ้น', minimum: 1, batches: [{ quantity: 2, expiryDate: '2027-01-01' }] }); assert.equal(item.status, 201);
  assert.equal((await req(owner, `/api/houses/${target.id}`, 'DELETE', {})).status, 400);
  const deleted = await req(owner, `/api/houses/${target.id}`, 'DELETE', { confirm: true }); assert.equal(deleted.status, 200); assert.equal(deleted.data.nextHref, '/home');
  for (const table of ['houses', 'memberships', 'categories', 'items']) {
    const field = table === 'houses' ? 'id' : 'house_id';
    assert.equal((await db.query(`select count(*)::int n from ${table} where ${field}=$1`, [target.id])).rows[0].n, 0);
  }
  for (const table of ['item_batches', 'stock_events']) assert.equal((await db.query(`select count(*)::int n from ${table} where item_id=$1`, [item.data.id])).rows[0].n, 0);
  execFileSync('docker', ['exec', 'homeshelf', 'test', '!', '-e', `/app/data/uploads/${target.id}`]);
  assert.equal((await fetch(`http://localhost:8002${keepImage}`, { headers: { cookie: owner.cookie } })).status, 200);
  assert.equal((await req(owner, `/api/houses/${target.id}`, 'DELETE', { confirm: true })).status, 404);
  console.log('PASS: owner-only delete, confirmation, invite privacy, member/co-owner leave, cascades, orphan cleanup and other-house isolation');
} finally {
  for (const id of houseIds) {
    await db.query('delete from houses where id=$1', [id]);
    execFileSync('docker', ['exec', 'homeshelf', 'rm', '-rf', `/app/data/uploads/${id}`]);
  }
  await db.query('delete from users where email=any($1::text[])', [emails]); await db.end();
}
