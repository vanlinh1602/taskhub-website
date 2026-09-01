import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  approveDeadlineExtension,
  getDeadlineExtensions,
  rejectDeadlineExtension,
} from '@/features/deadline-extensions/apis';
import { backendService } from '@/services';

describe('deadline extension APIs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('loads a filtered page with encoded workspace and query values', async () => {
    const page = { items: [], page: 1, pageCount: 2, total: 26 };
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: page } as never);

    await expect(
      getDeadlineExtensions('workspace id', {
        page: 1,
        pageSize: 25,
        search: 'chapter 2',
        status: 'APPROVED',
      }),
    ).resolves.toBe(page);

    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%20id/deadline-extensions?page=1&pageSize=25&status=APPROVED&search=chapter+2',
    );
  });

  it('approves and rejects requests with the expected API contracts', async () => {
    const post = vi
      .spyOn(backendService, 'post')
      .mockResolvedValue({ kind: 'ok', data: {} } as never);

    await approveDeadlineExtension('workspace/id', 'request/id');
    await rejectDeadlineExtension('workspace/id', 'request/id', '  Không phù hợp  ');

    expect(post).toHaveBeenNthCalledWith(
      1,
      '/api/story-workflow/workspace%2Fid/deadline-extensions/request%2Fid/approve',
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/api/story-workflow/workspace%2Fid/deadline-extensions/request%2Fid/reject',
      { reason: 'Không phù hợp' },
    );
  });

  it('omits an empty rejection reason', async () => {
    const post = vi
      .spyOn(backendService, 'post')
      .mockResolvedValue({ kind: 'ok', data: {} } as never);

    await rejectDeadlineExtension('workspace-id', 'request-id', '   ');

    expect(post).toHaveBeenCalledWith(
      '/api/story-workflow/workspace-id/deadline-extensions/request-id/reject',
      { reason: undefined },
    );
  });
});
