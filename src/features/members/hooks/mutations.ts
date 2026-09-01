import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { updateMemberTaskClaim } from '@/features/members/apis';
import type { Member } from '@/features/members/types';

import { membersQueryKeys } from './queryKeys';

interface UpdateMemberTaskClaimMutationInput {
  readonly discordUserId: string;
  readonly enabled: boolean;
}

export async function invalidateMembersQueries(
  queryClient: QueryClient,
  workspaceId: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: membersQueryKeys.list(workspaceId),
  });
}

export function useUpdateMemberTaskClaimMutation(
  workspaceId: string,
): UseMutationResult<
  Member,
  Error,
  UpdateMemberTaskClaimMutationInput,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ discordUserId, enabled }: UpdateMemberTaskClaimMutationInput) =>
      updateMemberTaskClaim(workspaceId, discordUserId, enabled),
    onSuccess: async () => {
      await invalidateMembersQueries(queryClient, workspaceId);
    },
  });
}

export type { UpdateMemberTaskClaimMutationInput };
