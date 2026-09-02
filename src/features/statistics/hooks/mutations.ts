import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { exportStatistics } from '@/features/statistics/apis';

import type { StatisticsFilters } from '../types';

export function useExportStatisticsMutation(
  workspaceId: string,
): UseMutationResult<Blob, Error, { filters: StatisticsFilters; locale: 'vi' | 'en' }> {
  return useMutation({
    mutationFn: ({ filters, locale }) => exportStatistics(workspaceId, filters, locale),
  });
}
