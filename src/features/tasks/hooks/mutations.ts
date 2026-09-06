import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { adminQueryKeys } from '@/features/admin/hooks/queryKeys';
import { chaptersQueryKeys } from '@/features/chapters/hooks/queryKeys';
import { payrollQueryKeys } from '@/features/payroll/hooks/queryKeys';
import { statisticsQueryKeys } from '@/features/statistics/hooks/queryKeys';

import { completeTask, deductTask, updateTask } from '../apis';
import type { DeductTaskInput, UpdateTaskInput } from '../types';
import { tasksQueryKeys } from './queryKeys';

interface TaskMutationInput {
  readonly taskId: string;
  readonly input: UpdateTaskInput | DeductTaskInput;
}

interface TaskMutationScope {
  readonly workspaceId: string;
  readonly storyId: string;
  readonly chapterId: string;
}

interface UpdateTaskMutationInput {
  readonly taskId: string;
  readonly input: UpdateTaskInput;
}

interface DeductTaskMutationInput {
  readonly taskId: string;
  readonly input: DeductTaskInput;
}

interface CompleteTaskMutationInput {
  readonly taskId: string;
}

export async function invalidateTaskMutationQueries(
  queryClient: QueryClient,
  scope: TaskMutationScope,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: chaptersQueryKeys.detail(
        scope.workspaceId,
        scope.storyId,
        scope.chapterId,
      ),
    }),
    queryClient.invalidateQueries({
      queryKey: chaptersQueryKeys.listRoot(scope.workspaceId, scope.storyId),
    }),
    queryClient.invalidateQueries({
      queryKey: adminQueryKeys.dashboardRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: tasksQueryKeys.listRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: statisticsQueryKeys.listRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: statisticsQueryKeys.summaryRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: payrollQueryKeys.listRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: payrollQueryKeys.detailRoot(),
    }),
  ]);
}

export function useUpdateTaskMutation(
  workspaceId: string,
  storyId: string,
  chapterId: string,
): UseMutationResult<void, Error, UpdateTaskMutationInput, unknown> {
  const queryClient = useQueryClient();
  const scope = { chapterId, storyId, workspaceId };

  return useMutation({
    mutationFn: ({ input, taskId }: UpdateTaskMutationInput) =>
      updateTask(workspaceId, storyId, chapterId, taskId, input),
    onSuccess: async () => {
      await invalidateTaskMutationQueries(queryClient, scope);
    },
  });
}

export function useDeductTaskMutation(
  workspaceId: string,
  storyId: string,
  chapterId: string,
): UseMutationResult<void, Error, DeductTaskMutationInput, unknown> {
  const queryClient = useQueryClient();
  const scope = { chapterId, storyId, workspaceId };

  return useMutation({
    mutationFn: ({ input, taskId }: DeductTaskMutationInput) =>
      deductTask(workspaceId, storyId, chapterId, taskId, input),
    onSuccess: async () => {
      await invalidateTaskMutationQueries(queryClient, scope);
    },
  });
}

export function useCompleteTaskMutation(
  workspaceId: string,
  storyId: string,
  chapterId: string,
): UseMutationResult<void, Error, CompleteTaskMutationInput, unknown> {
  const queryClient = useQueryClient();
  const scope = { chapterId, storyId, workspaceId };

  return useMutation({
    mutationFn: ({ taskId }: CompleteTaskMutationInput) =>
      completeTask(workspaceId, storyId, chapterId, taskId),
    onSuccess: async () => {
      await invalidateTaskMutationQueries(queryClient, scope);
    },
  });
}

export type {
  CompleteTaskMutationInput,
  DeductTaskMutationInput,
  TaskMutationInput,
  TaskMutationScope,
  UpdateTaskMutationInput,
};
