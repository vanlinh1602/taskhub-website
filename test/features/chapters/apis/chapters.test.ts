import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getChapter,
  updateChapterConfiguration,
  updateChapterTask,
} from '@/features/chapters/apis';
import { backendService } from '@/services';

describe('chapter APIs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('loads chapter detail with the workspace, story, and chapter scope', async () => {
    const detail = { chapter: {}, chapterWorkflow: null, tasks: [] };
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: detail } as never);

    await expect(
      getChapter('workspace id', 'story/id', 'chapter id'),
    ).resolves.toBe(detail);

    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%20id/stories/story%2Fid/chapters/chapter%20id',
    );
  });

  it('patches chapter configuration with the selected difficulty, priority, and R18 flag', async () => {
    const patch = vi
      .spyOn(backendService, 'patch')
      .mockResolvedValue({ kind: 'ok', data: null } as never);

    await updateChapterConfiguration(
      'workspace id',
      'story/id',
      'chapter id',
      { difficulty: 'VERY_HARD', priority: 'HIGH', hasAdultContent: true },
    );

    expect(patch).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%20id/stories/story%2Fid/chapters/chapter%20id',
      { difficulty: 'VERY_HARD', priority: 'HIGH', hasAdultContent: true },
    );
  });

  it('patches a task with the manager update payload and encoded scope', async () => {
    const patch = vi
      .spyOn(backendService, 'patch')
      .mockResolvedValue({ kind: 'ok', data: null } as never);

    await updateChapterTask(
      'workspace id',
      'story/id',
      'chapter id',
      'task/id',
      { agreedPrice: '150000.00', assigneeDiscordUserId: null },
    );

    expect(patch).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%20id/stories/story%2Fid/chapters/chapter%20id/tasks/task%2Fid',
      { agreedPrice: '150000.00', assigneeDiscordUserId: null },
    );
  });
});
