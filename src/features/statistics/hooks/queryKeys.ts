import type { StatisticsFilters, StatisticsSummaryFilters } from '../types';

export const statisticsQueryKeys = {
  filters: (workspaceId: string) =>
    ['statistics', 'filters', workspaceId] as const,
  list: (workspaceId: string, filters: StatisticsFilters) =>
    ['statistics', 'list', workspaceId, filters] as const,
  summary: (workspaceId: string, filters: StatisticsSummaryFilters) =>
    ['statistics', 'summary', workspaceId, filters] as const,
  listRoot: () => ['statistics', 'list'] as const,
};
