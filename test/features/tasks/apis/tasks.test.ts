import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTaskFilterOptions, getTasks } from '@/features/tasks/apis';
import { backendService } from '@/services';

describe('task APIs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('loads a filtered task page with encoded query parameters', async () => {
    const page = { items: [], page: 0, pageCount: 1, total: 0 };
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: page } as never);

    await expect(
      getTasks('workspace id', {
        dueAtOrder: 'DESC',
        page: 2,
        pageSize: 10,
        stageDefinitionId: 'stage/id',
        status: 'IN_PROGRESS',
        storyId: 'story/id',
      }),
    ).resolves.toBe(page);

    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%20id/tasks?page=2&pageSize=10&dueAtOrder=DESC&status=IN_PROGRESS&storyId=story%2Fid&stageDefinitionId=stage%2Fid',
    );
  });

  it('omits optional filters when loading all tasks', async () => {
    vi.spyOn(backendService, 'get').mockResolvedValue({
      kind: 'ok',
      data: { items: [], page: 0, pageCount: 1, total: 0 },
    } as never);

    await getTasks('workspace-id', {
      dueAtOrder: 'ASC',
      page: 0,
      pageSize: 25,
    });

    expect(backendService.get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace-id/tasks?page=0&pageSize=25&dueAtOrder=ASC',
    );
  });

  it('loads task filter metadata', async () => {
    const filters = { stories: [], stages: [] };
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: filters } as never);

    await expect(getTaskFilterOptions('workspace/id')).resolves.toBe(filters);

    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/tasks/filters',
    );
  });
});
