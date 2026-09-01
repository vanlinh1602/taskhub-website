import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import {
  createMembersQueryOptions,
  invalidateMembersQueries,
} from '@/features/members/hooks';

describe('members hooks', () => {
  it('supports lazy member loading for task assignment dialogs', () => {
    expect(createMembersQueryOptions('workspace-1', { enabled: false })).toMatchObject({
      enabled: false,
      queryKey: ['members', 'list', 'workspace-1'],
      staleTime: 86400000,
    });
  });

  it('invalidates only the affected workspace member list', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);

    await invalidateMembersQueries(queryClient, 'workspace-1');

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['members', 'list', 'workspace-1'],
    });
  });
});
