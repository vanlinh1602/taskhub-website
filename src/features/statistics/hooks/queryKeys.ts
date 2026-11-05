import type { StatisticsFilters, StatisticsSummaryFilters } from '../types';

export const statisticsQueryKeys = {
  filters: (workspaceId: string) =>
    ['statistics', 'filters', workspaceId] as const,
  list: (workspaceId: string, filters: StatisticsFilters) =>
    ['statistics', 'list', workspaceId, filters] as const,
  story: (workspaceId: string, storyId: string) =>
    ['statistics', 'list', 'story', workspaceId, storyId] as const,
  summary: (workspaceId: string, filters: StatisticsSummaryFilters) =>
    ['statistics', 'summary', workspaceId, filters] as const,
  summaryRoot: () => ['statistics', 'summary'] as const,
  listRoot: () => ['statistics', 'list'] as const,
};
