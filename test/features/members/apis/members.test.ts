import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getMembers,
  MembersForbiddenError,
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
});
