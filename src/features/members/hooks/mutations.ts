import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import {
  activateMember,
  removeMember,
  retryMemberRevocation,
  updateMemberTaskClaim,
} from '@/features/members/apis';
import type { Member, MemberRemovalResult } from '@/features/members/types';

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

interface WorkspaceMemberMutationInput {
  readonly discordUserId: string;
}

export function useRemoveMemberMutation(
  workspaceId: string,
): UseMutationResult<
  MemberRemovalResult,
  Error,
  WorkspaceMemberMutationInput,
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ discordUserId }) => removeMember(workspaceId, discordUserId),
    onSuccess: async () => invalidateMembersQueries(queryClient, workspaceId),
  });
}

export function useRetryMemberRevocationMutation(
  workspaceId: string,
): UseMutationResult<
  MemberRemovalResult,
  Error,
  WorkspaceMemberMutationInput,
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ discordUserId }) =>
      retryMemberRevocation(workspaceId, discordUserId),
    onSuccess: async () => invalidateMembersQueries(queryClient, workspaceId),
  });
}

export function useActivateMemberMutation(
  workspaceId: string,
): UseMutationResult<Member, Error, WorkspaceMemberMutationInput, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ discordUserId }) => activateMember(workspaceId, discordUserId),
    onSuccess: async () => invalidateMembersQueries(queryClient, workspaceId),
  });
}

export type { UpdateMemberTaskClaimMutationInput };
