import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { adminQueryKeys } from '@/features/admin/hooks';
import { payrollQueryKeys } from '@/features/payroll/hooks';
import { statisticsQueryKeys } from '@/features/statistics/hooks';
import { createStory, renameStory } from '@/features/stories/apis';
import type {
  CreateStoryInput,
  RenameStoryInput,
  Story,
} from '@/features/stories/types';
import { tasksQueryKeys } from '@/features/tasks/hooks';

import { storiesQueryKeys } from './queryKeys';

export async function invalidateStoryListQueries(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: storiesQueryKeys.listRoot(),
  });
}

export async function invalidateStoryRenameQueries(
  queryClient: QueryClient,
  workspaceId: string,
  storyId: string,
): Promise<void> {
  await Promise.all([
    invalidateStoryListQueries(queryClient),
    queryClient.invalidateQueries({
      queryKey: storiesQueryKeys.detail(workspaceId, storyId),
    }),
    queryClient.invalidateQueries({
      queryKey: adminQueryKeys.dashboardRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: tasksQueryKeys.filters(workspaceId),
    }),
    queryClient.invalidateQueries({ queryKey: tasksQueryKeys.listRoot() }),
    queryClient.invalidateQueries({
      queryKey: statisticsQueryKeys.filters(workspaceId),
    }),
    queryClient.invalidateQueries({
      queryKey: statisticsQueryKeys.listRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: statisticsQueryKeys.summaryRoot(),
    }),
    queryClient.invalidateQueries({ queryKey: payrollQueryKeys.listRoot() }),
    queryClient.invalidateQueries({ queryKey: payrollQueryKeys.detailRoot() }),
    queryClient.invalidateQueries({
      queryKey: payrollQueryKeys.batchDetailRoot(),
    }),
  ]);
}

export function useCreateStoryMutation(
  workspaceId: string,
): UseMutationResult<Story, Error, CreateStoryInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStoryInput) => createStory(workspaceId, input),
    onSuccess: async () => {
      await invalidateStoryListQueries(queryClient);
    },
  });
}

export function useRenameStoryMutation(
  workspaceId: string,
  storyId: string,
): UseMutationResult<Story, Error, RenameStoryInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RenameStoryInput) =>
      renameStory(workspaceId, storyId, input),
    onSuccess: async () => {
      await invalidateStoryRenameQueries(queryClient, workspaceId, storyId);
    },
  });
}
