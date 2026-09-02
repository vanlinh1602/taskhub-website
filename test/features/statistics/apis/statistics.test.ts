import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createStatisticsQuery,
  exportStatistics,
  getStatistics,
  getStatisticsSummary,
} from '@/features/statistics/apis';
import type { StatisticsFilters } from '@/features/statistics/types';
import { backendService } from '@/services';

const filters: StatisticsFilters = {
  from: '2026-08-01',
  to: '2026-08-31',
  dateBasis: 'COMPLETED',
  storyId: '10',
  assigneeDiscordUserId: '__UNASSIGNED__',
  workflowTemplateId: '900',
  stageDefinitionId: '4',
  status: 'COMPLETED',
  paymentStatus: 'PAID',
  page: 1,
  pageSize: 25,
};

describe('statistics APIs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('serializes the complete filter and pagination query', () => {
    expect(createStatisticsQuery(filters)).toBe(
      'from=2026-08-01&to=2026-08-31&dateBasis=COMPLETED&page=1&pageSize=25&storyId=10&assigneeDiscordUserId=__UNASSIGNED__&workflowTemplateId=900&stageDefinitionId=4&status=COMPLETED&paymentStatus=PAID',
    );
  });

  it('loads statistics, summary, and exports the same filters without pagination', async () => {
    const result = { columns: [], items: [], page: 0, pageCount: 1, total: 0 };
    const summary = { rows: [], totals: [], totalTaskCount: 0 };
    const get = vi.spyOn(backendService, 'get').mockResolvedValue({ kind: 'ok', data: result } as never);
    const blob = new Blob(['xlsx']);
    const download = vi.spyOn(backendService, 'download').mockResolvedValue({ kind: 'ok', data: blob });

    await expect(getStatistics('workspace/id', filters)).resolves.toBe(result);
    get.mockResolvedValueOnce({ kind: 'ok', data: summary } as never);
    await expect(getStatisticsSummary('workspace/id', filters)).resolves.toBe(summary);
    await expect(exportStatistics('workspace/id', filters, 'vi')).resolves.toBe(blob);

    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/statistics?from=2026-08-01&to=2026-08-31&dateBasis=COMPLETED&page=1&pageSize=25&storyId=10&assigneeDiscordUserId=__UNASSIGNED__&workflowTemplateId=900&stageDefinitionId=4&status=COMPLETED&paymentStatus=PAID',
    );
    expect(get).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/statistics/summary?from=2026-08-01&to=2026-08-31&dateBasis=COMPLETED&storyId=10&assigneeDiscordUserId=__UNASSIGNED__&workflowTemplateId=900&stageDefinitionId=4&status=COMPLETED&paymentStatus=PAID',
    );
    expect(download).toHaveBeenCalledWith(
      '/api/story-workflow/workspace%2Fid/statistics/export',
      expect.objectContaining({
        from: '2026-08-01',
        dateBasis: 'COMPLETED',
        assigneeDiscordUserId: '__UNASSIGNED__',
        workflowTemplateId: '900',
        locale: 'vi',
      }),
    );
  });
});
