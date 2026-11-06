import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renameStory, updateStoryPriority } from '@/features/stories/apis';
import { backendService } from '@/services';

describe('story APIs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('patches the story title with the encoded workspace and story scope', async () => {
    const story = { id: 'story/id', title: 'New title' };
    const patch = vi
      .spyOn(backendService, 'patch')
      .mockResolvedValue({ kind: 'ok', data: story } as never);

    await expect(
      renameStory('workspace id', 'story/id', { title: 'New title' }),
    ).resolves.toBe(story);

    expect(patch).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%20id/stories/story%2Fid',
      { title: 'New title' },
    );
  });

  it('patches the story priority endpoint', async () => {
    const story = { id: 'story/id', priority: 'HIGH' };
    const patch = vi
      .spyOn(backendService, 'patch')
      .mockResolvedValue({ kind: 'ok', data: story } as never);

    await expect(
      updateStoryPriority('workspace id', 'story/id', { priority: 'HIGH' }),
    ).resolves.toBe(story);

    expect(patch).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%20id/stories/story%2Fid/priority',
      { priority: 'HIGH' },
    );
  });
});
