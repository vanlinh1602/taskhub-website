import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { membersQueryKeys } from '@/features/members/hooks';
import { payrollQueryKeys } from '@/features/payroll/hooks';
import { tasksQueryKeys } from '@/features/tasks/hooks';

import { createStage, updateStage, updateStageStatus } from '../apis';
import type { Stage, StagePayload } from '../types';
import { createStagePayload, renumberStages } from '../utils/order';
import { stagesQueryKeys } from './queryKeys';

export async function invalidateStageRelatedQueries(
  queryClient: QueryClient,
  workspaceId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['stages', 'list', workspaceId],
    }),
    queryClient.invalidateQueries({
      queryKey: membersQueryKeys.list(workspaceId),
    }),
    queryClient.invalidateQueries({
      queryKey: tasksQueryKeys.filters(workspaceId),
    }),
    queryClient.invalidateQueries({ queryKey: payrollQueryKeys.listRoot() }),
    queryClient.invalidateQueries({ queryKey: payrollQueryKeys.detailRoot() }),
  ]);
}

export function useCreateStageMutation(
  workspaceId: string,
): UseMutationResult<Stage, Error, StagePayload, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createStage(workspaceId, payload),
    onSuccess: () => invalidateStageRelatedQueries(queryClient, workspaceId),
  });
}

export interface UpdateStageInput {
  readonly stageId: string;
  readonly payload: StagePayload;
}

export function useUpdateStageMutation(
  workspaceId: string,
): UseMutationResult<Stage, Error, UpdateStageInput, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, payload }) =>
      updateStage(workspaceId, stageId, payload),
    onSuccess: () => invalidateStageRelatedQueries(queryClient, workspaceId),
  });
}

export interface UpdateStageStatusInput {
  readonly stageId: string;
  readonly isActive: boolean;
}

export function useUpdateStageStatusMutation(
  workspaceId: string,
): UseMutationResult<Stage, Error, UpdateStageStatusInput, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, isActive }) =>
      updateStageStatus(workspaceId, stageId, isActive),
    onSuccess: () => invalidateStageRelatedQueries(queryClient, workspaceId),
  });
}

interface ReorderStagesContext {
  readonly previousStages: readonly Stage[] | undefined;
}

export function useReorderStagesMutation(
  workspaceId: string,
): UseMutationResult<void, Error, readonly Stage[], ReorderStagesContext> {
  const queryClient = useQueryClient();
  const queryKey = stagesQueryKeys.all(workspaceId);
  return useMutation({
    mutationFn: async (orderedStages) => {
      await Promise.all(
        orderedStages.flatMap((stage, index) =>
          stage.displayOrder === index + 1
            ? []
            : [
                updateStage(
                  workspaceId,
                  stage.id,
                  createStagePayload(stage, index + 1),
                ),
              ],
        ),
      );
    },
    onMutate: async (orderedStages) => {
      await queryClient.cancelQueries({ queryKey });
      const previousStages =
        queryClient.getQueryData<readonly Stage[]>(queryKey);
      queryClient.setQueryData(queryKey, renumberStages(orderedStages));
      return { previousStages };
    },
    onError: (_error, _orderedStages, context) => {
      queryClient.setQueryData(queryKey, context?.previousStages);
    },
    onSettled: () => invalidateStageRelatedQueries(queryClient, workspaceId),
  });
}

export { stagesQueryKeys };
