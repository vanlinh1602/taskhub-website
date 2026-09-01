import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getDeadlineExtensions } from '@/features/deadline-extensions/apis';
import type {
  DeadlineExtensionListPage,
  DeadlineExtensionListQuery,
} from '@/features/deadline-extensions/types';

import { deadlineExtensionsQueryKeys } from './queryKeys';

interface DeadlineExtensionsQueryOptions {
  readonly enabled: boolean;
  readonly queryFn: () => Promise<DeadlineExtensionListPage>;
  readonly queryKey: ReturnType<typeof deadlineExtensionsQueryKeys.list>;
  readonly staleTime: number;
}

export function createDeadlineExtensionsQueryOptions(
  workspaceId: string,
  query: DeadlineExtensionListQuery,
): DeadlineExtensionsQueryOptions {
  return {
    enabled: workspaceId.length > 0,
    queryFn: () => getDeadlineExtensions(workspaceId, query),
    queryKey: deadlineExtensionsQueryKeys.list(workspaceId, query),
    staleTime: 30000,
  };
}

export function useDeadlineExtensionsQuery(
  workspaceId: string,
  query: DeadlineExtensionListQuery,
): UseQueryResult<DeadlineExtensionListPage, Error> {
  return useQuery(createDeadlineExtensionsQueryOptions(workspaceId, query));
}
