import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  completeTask,
  deductTask,
  getTaskFilterOptions,
  getTasks,
  updateTask,
} from '@/features/tasks/apis';
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
        page: 2,
        pageSize: 10,
        sortBy: 'STORY_TITLE',
        sortOrder: 'DESC',
        stageDefinitionId: 'stage/id',
        status: 'IN_PROGRESS',
        storyId: 'story/id',
      }),
    ).resolves.toBe(page);

    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%20id/tasks?page=2&pageSize=10&sortBy=STORY_TITLE&sortOrder=DESC&status=IN_PROGRESS&storyId=story%2Fid&stageDefinitionId=stage%2Fid',
    );
  });

  it('omits optional filters when loading all tasks', async () => {
    vi.spyOn(backendService, 'get').mockResolvedValue({
      kind: 'ok',
      data: { items: [], page: 0, pageCount: 1, total: 0 },
    } as never);

    await getTasks('workspace-id', {
      page: 0,
      pageSize: 25,
      sortBy: 'DEADLINE',
      sortOrder: 'ASC',
    });

    expect(backendService.get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace-id/tasks?page=0&pageSize=25&sortBy=DEADLINE&sortOrder=ASC',
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

  it('updates a task with every nested identifier encoded', async () => {
    const patch = vi
      .spyOn(backendService, 'patch')
      .mockResolvedValue({ kind: 'ok' } as never);

    await updateTask(
      'workspace/id',
      'story id',
      'chapter/id',
      'task/id',
      {
        agreedPrice: '12.50',
        assigneeDiscordUserId: 'member/id',
        status: 'BLOCKED',
      },
    );

    expect(patch).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/stories/story%20id/chapters/chapter%2Fid/tasks/task%2Fid',
      {
        agreedPrice: '12.50',
        assigneeDiscordUserId: 'member/id',
        status: 'BLOCKED',
      },
    );
  });

  it('posts a deduction with every nested identifier encoded', async () => {
    const post = vi
      .spyOn(backendService, 'post')
      .mockResolvedValue({ kind: 'ok' } as never);

    await deductTask(
      'workspace/id',
      'story id',
      'chapter/id',
      'task/id',
      {
        amount: '3.25',
        evidenceUrl: 'https://discord.com/channels/1/2/3',
        reason: 'Late delivery',
      },
    );

    expect(post).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/stories/story%20id/chapters/chapter%2Fid/tasks/task%2Fid/deduction',
      {
        amount: '3.25',
        evidenceUrl: 'https://discord.com/channels/1/2/3',
        reason: 'Late delivery',
      },
    );
  });

  it('updates a deadline as an ISO value', async () => {
    const patch = vi
      .spyOn(backendService, 'patch')
      .mockResolvedValue({ kind: 'ok' } as never);

    await updateTask('workspace-id', 'story-id', 'chapter-id', 'task-id', {
      dueAt: '2026-09-10T12:00:00.000Z',
    });

    expect(patch).toHaveBeenCalledWith(
      '/api/story-workflow/workspace-id/stories/story-id/chapters/chapter-id/tasks/task-id',
      { dueAt: '2026-09-10T12:00:00.000Z' },
    );
  });

  it('posts task completion with every nested identifier encoded', async () => {
    const post = vi
      .spyOn(backendService, 'post')
      .mockResolvedValue({ kind: 'ok' } as never);

    await completeTask('workspace/id', 'story id', 'chapter/id', 'task/id');

    expect(post).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/stories/story%20id/chapters/chapter%2Fid/tasks/task%2Fid/complete',
    );
  });
});
