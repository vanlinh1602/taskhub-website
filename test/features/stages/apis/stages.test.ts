import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createStage,
  getStages,
  updateStage,
  updateStageStatus,
} from '@/features/stages/apis';
import { backendService } from '@/services';

describe('stage APIs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('encodes workspace and stage IDs and limits page size to 25', async () => {
    const page = { activeTotal: 0, items: [], page: 0, pageCount: 1, total: 0 };
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: page } as never);

    await expect(getStages('guild/id', 2, 100)).resolves.toBe(page);
    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/guild%2Fid/stages?page=2&pageSize=25',
    );
  });

  it('sends create, update, and status payloads without allowing a code field', async () => {
    const post = vi
      .spyOn(backendService, 'post')
      .mockResolvedValue({ kind: 'ok', data: { id: '12' } } as never);
    const patch = vi
      .spyOn(backendService, 'patch')
      .mockResolvedValue({ kind: 'ok', data: { id: '12' } } as never);
    const payload = {
      defaultPrice: '125000.00',
      displayOrder: 1,
      durationHours: 24,
      isRewardEligible: true,
      name: 'Biên tập',
    };

    await createStage('guild/id', payload);
    await updateStage('guild/id', '12/1', payload);
    await updateStageStatus('guild/id', '12/1', false);

    expect(post).toHaveBeenCalledWith(
      '/api/story-workflow/guild%2Fid/stages',
      payload,
    );
    expect(patch).toHaveBeenNthCalledWith(
      1,
      '/api/story-workflow/guild%2Fid/stages/12%2F1',
      payload,
    );
    expect(patch).toHaveBeenNthCalledWith(
      2,
      '/api/story-workflow/guild%2Fid/stages/12%2F1/status',
      { isActive: false },
    );
  });
});
