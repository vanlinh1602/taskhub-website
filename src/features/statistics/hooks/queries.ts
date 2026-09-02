import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import {
  getStatistics,
  getStatisticsFilters,
  getStatisticsSummary,
} from '@/features/statistics/apis';

import type {
  StatisticsFilterOptions,
  StatisticsFilters,
  StatisticsResult,
  StatisticsSummaryFilters,
  StatisticsSummaryResult,
} from '../types';
import { statisticsQueryKeys } from './queryKeys';

export function useStatisticsQuery(
  workspaceId: string,
  filters: StatisticsFilters,
): UseQueryResult<StatisticsResult, Error> {
  return useQuery({
    enabled: workspaceId.length > 0 && filters.from.length > 0 && filters.to.length > 0,
    queryFn: () => getStatistics(workspaceId, filters),
    queryKey: statisticsQueryKeys.list(workspaceId, filters),
    staleTime: 30000,
  });
}

export function useStatisticsFiltersQuery(
  workspaceId: string,
): UseQueryResult<StatisticsFilterOptions, Error> {
  return useQuery({
    enabled: workspaceId.length > 0,
    queryFn: () => getStatisticsFilters(workspaceId),
    queryKey: statisticsQueryKeys.filters(workspaceId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStatisticsSummaryQuery(
  workspaceId: string,
  filters: StatisticsFilters,
  enabled: boolean,
): UseQueryResult<StatisticsSummaryResult, Error> {
  const summaryFilters: StatisticsSummaryFilters = {
    from: filters.from,
    to: filters.to,
    dateBasis: filters.dateBasis,
    storyId: filters.storyId,
    assigneeDiscordUserId: filters.assigneeDiscordUserId,
    workflowTemplateId: filters.workflowTemplateId,
    stageDefinitionId: filters.stageDefinitionId,
    status: filters.status,
    paymentStatus: filters.paymentStatus,
  };
  return useQuery({
    enabled: enabled && workspaceId.length > 0 && filters.from.length > 0 && filters.to.length > 0,
    queryFn: () => getStatisticsSummary(workspaceId, summaryFilters),
    queryKey: statisticsQueryKeys.summary(workspaceId, summaryFilters),
    staleTime: 30000,
  });
}
