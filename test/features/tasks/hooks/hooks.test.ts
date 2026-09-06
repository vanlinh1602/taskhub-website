import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import {
  createTaskFilterOptionsQueryOptions,
  createTasksQueryOptions,
  invalidateTaskMutationQueries,
} from '@/features/tasks/hooks';

describe('task hooks', () => {
  it('keeps all task list parameters in the query key', () => {
    const options = createTasksQueryOptions('workspace-1', {
      page: 2,
      pageSize: 25,
      sortBy: 'CHAPTER_ID',
      sortOrder: 'DESC',
      stageDefinitionId: 'stage-1',
      status: 'COMPLETED',
      storyId: 'story-1',
    });

    expect(options.queryKey).toEqual([
      'tasks',
      'list',
      'workspace-1',
      {
        page: 2,
        pageSize: 25,
        sortBy: 'CHAPTER_ID',
        sortOrder: 'DESC',
        stageDefinitionId: 'stage-1',
        status: 'COMPLETED',
        storyId: 'story-1',
      },
    ]);
    expect(options.enabled).toBe(true);
    expect('placeholderData' in options).toBe(false);
  });

  it('uses a long-lived workspace-scoped metadata query', () => {
    const options = createTaskFilterOptionsQueryOptions('workspace-1');

    expect(options.queryKey).toEqual(['tasks', 'filters', 'workspace-1']);
    expect(options.staleTime).toBe(30 * 24 * 60 * 60 * 1000);
    expect(createTaskFilterOptionsQueryOptions('').enabled).toBe(false);
  });

  it('invalidates task, statistics, chapter, and dashboard data after a task mutation', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);

    await invalidateTaskMutationQueries(queryClient, {
      chapterId: 'chapter-1',
      storyId: 'story-1',
      workspaceId: 'workspace-1',
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chapters', 'detail', 'workspace-1', 'story-1', 'chapter-1'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chapters', 'list', 'workspace-1', 'story-1'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['admin', 'dashboard'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks', 'list'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['statistics', 'list'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['statistics', 'summary'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['payroll', 'list'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['payroll', 'detail'],
    });
  });
});
