import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { membersQueryKeys } from '@/features/members/hooks';
import {
  invalidateStageRelatedQueries,
  stagesQueryKeys,
} from '@/features/stages/hooks';
import { tasksQueryKeys } from '@/features/tasks/hooks';

describe('stage hooks', () => {
  it('uses the exact paginated key and invalidates related metadata', async () => {
    expect(stagesQueryKeys.list('workspace-1', 2, 25)).toEqual([
      'stages',
      'list',
      'workspace-1',
      2,
      25,
    ]);

    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);
    await invalidateStageRelatedQueries(queryClient, 'workspace-1');

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['stages', 'list', 'workspace-1'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: membersQueryKeys.list('workspace-1'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tasksQueryKeys.filters('workspace-1'),
    });
  });
});
