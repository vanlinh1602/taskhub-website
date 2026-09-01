import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import { getMembers } from '@/features/members/apis';
import type { Member } from '@/features/members/types';

import { membersQueryKeys } from './queryKeys';

interface MembersQueryOptions {
  readonly enabled?: boolean;
}

interface MembersQueryConfiguration {
  readonly enabled: boolean;
  readonly queryFn: () => Promise<Member[]>;
  readonly queryKey: ReturnType<typeof membersQueryKeys.list>;
  readonly staleTime: number;
}

export function createMembersQueryOptions(
  workspaceId: string,
  options: MembersQueryOptions = {},
): MembersQueryConfiguration {
  return {
    queryKey: membersQueryKeys.list(workspaceId),
    queryFn: () => getMembers(workspaceId),
    enabled: workspaceId.length > 0 && (options.enabled ?? true),
    staleTime: 1000 * 60 * 60 * 24,
  };
}

export function useMembersQuery(
  workspaceId: string,
  options: MembersQueryOptions = {},
): UseQueryResult<Member[], Error> {
  return useQuery(createMembersQueryOptions(workspaceId, options));
}
