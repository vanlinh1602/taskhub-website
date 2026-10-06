import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  activateMember,
  getMembers,
  MembersForbiddenError,
  removeMember,
  retryMemberRevocation,
  updateMemberTaskClaim,
} from '@/features/members/apis';
import { backendService } from '@/services';

describe('member APIs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('loads members with an encoded workspace scope', async () => {
    const members = [{ discordUserId: 'member/1' }];
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: members } as never);

    await expect(getMembers('workspace id')).resolves.toBe(members);

    expect(get).toHaveBeenCalledWith('/api/users/workspace%20id/members');
  });

  it('sends the explicit task-claim state with encoded identifiers', async () => {
    const member = { discordUserId: 'member/1', status: 'SUSPENDED' };
    const patch = vi
      .spyOn(backendService, 'patch')
      .mockResolvedValue({ kind: 'ok', data: member } as never);

    await expect(
      updateMemberTaskClaim('workspace id', 'member/1', false),
    ).resolves.toBe(member);

    expect(patch).toHaveBeenCalledWith(
      '/api/users/workspace%20id/members/member%2F1/task-claim',
      { enabled: false },
    );
  });

  it('preserves the forbidden state for the page access boundary', async () => {
    vi.spyOn(backendService, 'get').mockResolvedValue({
      kind: 'forbidden',
    } as never);

    await expect(getMembers('workspace id')).rejects.toBeInstanceOf(
      MembersForbiddenError,
    );
  });

  it('removes a member from only the encoded workspace route', async () => {
    const result = {
      member: { discordUserId: 'member/1', status: 'LEFT' },
      unassignedTaskCount: 2,
      payrollLockedTaskCount: 1,
    };
    const remove = vi
      .spyOn(backendService, 'delete')
      .mockResolvedValue({ kind: 'ok', data: result } as never);

    await expect(removeMember('workspace id', 'member/1')).resolves.toBe(result);

    expect(remove).toHaveBeenCalledWith(
      '/api/users/workspace%20id/members/member%2F1',
    );
  });

  it('uses workspace-scoped retry and activation routes', async () => {
    const removalResult = { member: { discordUserId: 'member-id' } };
    const member = { discordUserId: 'member-id', status: 'ACTIVE' };
    const post = vi
      .spyOn(backendService, 'post')
      .mockResolvedValueOnce({ kind: 'ok', data: removalResult } as never)
      .mockResolvedValueOnce({ kind: 'ok', data: member } as never);

    await expect(
      retryMemberRevocation('workspace-1', 'member-id'),
    ).resolves.toBe(removalResult);
    await expect(activateMember('workspace-1', 'member-id')).resolves.toBe(
      member,
    );
    expect(post).toHaveBeenNthCalledWith(
      1,
      '/api/users/workspace-1/members/member-id/revocation/retry',
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/api/users/workspace-1/members/member-id/reactivate',
    );
  });
});
