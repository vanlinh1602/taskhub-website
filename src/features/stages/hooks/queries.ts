import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getAllStages, getStages } from '@/features/stages/apis';
import type { Stage, StagePage } from '@/features/stages/types';

import { stagesQueryKeys } from './queryKeys';

export function useStagesQuery(
  workspaceId: string,
  page: number,
  pageSize: number,
): UseQueryResult<StagePage, Error> {
  return useQuery({
    queryKey: stagesQueryKeys.list(workspaceId, page, pageSize),
    queryFn: () => getStages(workspaceId, page, pageSize),
    enabled: workspaceId.length > 0,
    placeholderData: (previousData) => previousData,
  });
}

export function useAllStagesQuery(
  workspaceId: string,
): UseQueryResult<readonly Stage[], Error> {
  return useQuery({
    queryKey: stagesQueryKeys.all(workspaceId),
    queryFn: () => getAllStages(workspaceId),
    enabled: workspaceId.length > 0,
  });
}
