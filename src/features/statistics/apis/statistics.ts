import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type {
  StatisticsFilterOptions,
  StatisticsFilters,
  StatisticsResult,
  StatisticsSummaryFilters,
  StatisticsSummaryResult,
} from '../types';

function createPath(workspaceId: string, suffix: string): string {
  return `/api/story-workflow/${encodeURIComponent(workspaceId)}/statistics${suffix}`;
}

export function createStatisticsQuery(
  filters: StatisticsFilters | StatisticsSummaryFilters,
  includePagination = true,
): string {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    dateBasis: filters.dateBasis,
  });
  if (includePagination && 'page' in filters) {
    if (filters.page !== undefined) params.set('page', String(filters.page));
    if (filters.pageSize !== undefined) {
      params.set('pageSize', String(filters.pageSize));
    }
  }
  const optionalFilters: Readonly<Record<string, string>> = {
    storyId: filters.storyId,
    assigneeDiscordUserId: filters.assigneeDiscordUserId,
    workflowTemplateId: filters.workflowTemplateId,
    stageDefinitionId: filters.stageDefinitionId,
    status: filters.status,
    paymentStatus: filters.paymentStatus,
  };
  Object.entries(optionalFilters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export async function getStatisticsSummary(
  workspaceId: string,
  filters: StatisticsSummaryFilters,
): Promise<StatisticsSummaryResult> {
  const response = await backendService.get<StatisticsSummaryResult>(
    `${createPath(workspaceId, '/summary')}?${createStatisticsQuery(filters, false)}`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function getStatistics(
  workspaceId: string,
  filters: StatisticsFilters,
): Promise<StatisticsResult> {
  const response = await backendService.get<StatisticsResult>(
    `${createPath(workspaceId, '')}?${createStatisticsQuery(filters)}`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

/**
 * Loads every chapter of one story in a single request. Omitting `page` and
 * `pageSize` makes the backend return the complete (already story-scoped) set,
 * so no per-page fan-out is needed.
 */
export async function getStoryStatistics(
  workspaceId: string,
  storyId: string,
): Promise<StatisticsResult> {
  return getStatistics(workspaceId, {
    from: '2000-01-01',
    to: '2100-12-31',
    dateBasis: 'CREATED',
    storyId,
    assigneeDiscordUserId: '',
    workflowTemplateId: '',
    stageDefinitionId: '',
    status: '',
    paymentStatus: '',
  });
}

export async function getStatisticsFilters(
  workspaceId: string,
): Promise<StatisticsFilterOptions> {
  const response = await backendService.get<StatisticsFilterOptions>(
    createPath(workspaceId, '/filters'),
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function exportStatistics(
  workspaceId: string,
  filters: StatisticsFilters,
  locale: 'vi' | 'en',
): Promise<Blob> {
  const response = await backendService.download(
    createPath(workspaceId, '/export'),
    {
      from: filters.from,
      to: filters.to,
      dateBasis: filters.dateBasis,
      storyId: filters.storyId || undefined,
      assigneeDiscordUserId: filters.assigneeDiscordUserId || undefined,
      workflowTemplateId: filters.workflowTemplateId || undefined,
      stageDefinitionId: filters.stageDefinitionId || undefined,
      status: filters.status || undefined,
      paymentStatus: filters.paymentStatus || undefined,
      locale,
    },
  );
  if (response.kind === 'ok' && response.data) return response.data;
  throw new Error(formatError(response));
}
