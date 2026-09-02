import { describe, expect, it } from 'vitest';

import { statisticsQueryKeys } from '@/features/statistics/hooks/queryKeys';

describe('statistics query keys', () => {
  it('contains workspace, filter, and pagination state', () => {
    const filters = {
      from: '2026-08-01',
      to: '2026-08-31',
      dateBasis: 'PAID' as const,
      storyId: '',
      assigneeDiscordUserId: '',
      workflowTemplateId: '900',
      stageDefinitionId: '',
      status: '',
      paymentStatus: 'PAID' as const,
      page: 2,
      pageSize: 25,
    };

    expect(statisticsQueryKeys.list('workspace-1', filters)).toEqual([
      'statistics',
      'list',
      'workspace-1',
      filters,
    ]);
    expect(statisticsQueryKeys.summary('workspace-1', {
      from: filters.from,
      to: filters.to,
      dateBasis: filters.dateBasis,
      storyId: filters.storyId,
      assigneeDiscordUserId: filters.assigneeDiscordUserId,
      workflowTemplateId: filters.workflowTemplateId,
      stageDefinitionId: filters.stageDefinitionId,
      status: filters.status,
      paymentStatus: filters.paymentStatus,
    })).toEqual([
      'statistics',
      'summary',
      'workspace-1',
      expect.objectContaining({ workflowTemplateId: '900' }),
    ]);
    expect(statisticsQueryKeys.summaryRoot()).toEqual([
      'statistics',
      'summary',
    ]);
  });
});
