import { describe, expect, it } from 'vitest';

import {
  createTaskFilterOptionsQueryOptions,
  createTasksQueryOptions,
} from '@/features/tasks/hooks';

describe('task hooks', () => {
  it('keeps all task list parameters in the query key', () => {
    const options = createTasksQueryOptions('workspace-1', {
      dueAtOrder: 'DESC',
      page: 2,
      pageSize: 25,
      stageDefinitionId: 'stage-1',
      status: 'COMPLETED',
      storyId: 'story-1',
    });

    expect(options.queryKey).toEqual([
      'tasks',
      'list',
      'workspace-1',
      {
        dueAtOrder: 'DESC',
        page: 2,
        pageSize: 25,
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
});
