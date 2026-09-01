import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getStages } from '@/features/stages/apis';
import type { StagePage } from '@/features/stages/types';

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
