import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { adminQueryKeys } from '@/features/admin/hooks';
import { chaptersQueryKeys } from '@/features/chapters/hooks';
import {
  approveDeadlineExtension,
  rejectDeadlineExtension,
} from '@/features/deadline-extensions/apis';
import type { DeadlineExtensionRequest } from '@/features/deadline-extensions/types';
import { tasksQueryKeys } from '@/features/tasks/hooks';

import { deadlineExtensionsQueryKeys } from './queryKeys';

interface RejectDeadlineExtensionInput {
  readonly requestId: string;
  readonly reason: string;
}

export async function invalidateDeadlineExtensionQueries(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: deadlineExtensionsQueryKeys.listRoot(),
    }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboardRoot() }),
    queryClient.invalidateQueries({ queryKey: tasksQueryKeys.listRoot() }),
    queryClient.invalidateQueries({ queryKey: chaptersQueryKeys.detailRoot() }),
  ]);
}

export function useApproveDeadlineExtensionMutation(
  workspaceId: string,
): UseMutationResult<DeadlineExtensionRequest, Error, string, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      approveDeadlineExtension(workspaceId, requestId),
    onSuccess: async () => {
      await invalidateDeadlineExtensionQueries(queryClient);
    },
  });
}

export function useRejectDeadlineExtensionMutation(
  workspaceId: string,
): UseMutationResult<
  DeadlineExtensionRequest,
  Error,
  RejectDeadlineExtensionInput,
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reason }: RejectDeadlineExtensionInput) =>
      rejectDeadlineExtension(workspaceId, requestId, reason),
    onSuccess: async () => {
      await invalidateDeadlineExtensionQueries(queryClient);
    },
  });
}

export type { RejectDeadlineExtensionInput };
