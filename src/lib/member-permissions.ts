type MemberAccess = {
  actorId: string;
  actorRole: string;
  targetId: string;
  targetRole: string;
  creatorId: string;
};

export function canChangeRole(access: MemberAccess) {
  return access.actorRole === 'owner'
    && access.actorId !== access.targetId
    && access.targetId !== access.creatorId
    && access.targetRole !== 'owner';
}

export function canRemoveMember(access: MemberAccess) {
  if (access.actorId === access.targetId || access.targetId === access.creatorId || access.targetRole === 'owner') return false;
  return access.actorRole === 'owner' || (access.actorRole === 'co_owner' && access.targetRole === 'member');
}
