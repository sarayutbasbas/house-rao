import assert from 'node:assert/strict';
import test from 'node:test';
import { canChangeRole, canRemoveMember } from '../src/lib/member-permissions.ts';

const base = { actorId: 'owner', actorRole: 'owner', targetId: 'member', targetRole: 'member', creatorId: 'owner' };

test('primary owner can promote members and remove members or co-owners', () => {
  assert.equal(canChangeRole(base), true);
  assert.equal(canRemoveMember(base), true);
  assert.equal(canChangeRole({ ...base, targetRole: 'co_owner' }), true);
  assert.equal(canRemoveMember({ ...base, targetRole: 'co_owner' }), true);
});

test('primary owner cannot lose their own access', () => {
  const self = { ...base, targetId: 'owner', targetRole: 'owner' };
  assert.equal(canChangeRole(self), false);
  assert.equal(canRemoveMember(self), false);
});

test('co-owner can remove ordinary members, but cannot manage other owners', () => {
  const coOwner = { ...base, actorId: 'co-owner', actorRole: 'co_owner' };
  assert.equal(canRemoveMember(coOwner), true);
  assert.equal(canChangeRole(coOwner), false);
  assert.equal(canRemoveMember({ ...coOwner, targetRole: 'co_owner' }), false);
  assert.equal(canRemoveMember({ ...coOwner, targetId: 'owner', targetRole: 'owner' }), false);
});

test('ordinary members cannot change membership', () => {
  const member = { ...base, actorId: 'another-member', actorRole: 'member' };
  assert.equal(canChangeRole(member), false);
  assert.equal(canRemoveMember(member), false);
});
