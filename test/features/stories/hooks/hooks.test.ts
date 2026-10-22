import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import {
  createStoriesQueryOptions,
  createStoryQueryOptions,
  invalidateStoryListQueries,
  invalidateStoryRenameQueries,
} from '@/features/stories/hooks';

describe('stories hooks', () => {
  it('includes workspace and search text in the list query key', () => {
    expect(createStoriesQueryOptions('workspace-1', 'keyword')).toMatchObject({
      enabled: true,
      queryKey: ['stories', 'list', 'workspace-1', 'keyword'],
      staleTime: 86400000,
    });
  });

  it('disables story details when either identifier is missing', () => {
    expect(createStoryQueryOptions('', 'story-1').enabled).toBe(false);
    expect(createStoryQueryOptions('workspace-1', 'story-1').queryKey).toEqual([
      'stories',
      'detail',
      'workspace-1',
      'story-1',
    ]);
  });

  it('invalidates every story list variant', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);

    await invalidateStoryListQueries(queryClient);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['stories', 'list'],
    });
  });

  it('invalidates story and derived name queries after a rename', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);

    await invalidateStoryRenameQueries(queryClient, 'workspace-1', 'story-1');

    for (const queryKey of [
      ['stories', 'list'],
      ['stories', 'detail', 'workspace-1', 'story-1'],
      ['admin', 'dashboard'],
      ['tasks', 'filters', 'workspace-1'],
      ['tasks', 'list'],
      ['statistics', 'filters', 'workspace-1'],
      ['statistics', 'list'],
      ['statistics', 'summary'],
      ['payroll', 'list'],
      ['payroll', 'detail'],
      ['payroll', 'batch-detail'],
    ]) {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey });
    }
  });
});
