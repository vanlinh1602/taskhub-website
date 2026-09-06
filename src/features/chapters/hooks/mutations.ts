import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { adminQueryKeys } from '@/features/admin/hooks';
import {
  createChapter,
  deleteChapter,
  notifyChapterProgress,
  updateChapterConfiguration,
  updateChapterPublication,
} from '@/features/chapters/apis';
import type {
  ChapterPublicationResult,
  CreateChapterInput,
  UpdateChapterConfigurationInput,
  UpdateChapterPublicationInput,
} from '@/features/chapters/types';
import { statisticsQueryKeys } from '@/features/statistics/hooks';
import { invalidateTaskMutationQueries } from '@/features/tasks/hooks/mutations';

import { chaptersQueryKeys } from './queryKeys';

interface UpdateChapterConfigurationMutationInput {
  readonly chapterId: string;
  readonly input: UpdateChapterConfigurationInput;
}

interface UpdateChapterPublicationMutationInput
  extends UpdateChapterPublicationInput {
  readonly chapterId: string;
}

export async function invalidateChapterListQueries(
  queryClient: QueryClient,
  workspaceId: string,
  storyId: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: chaptersQueryKeys.listRoot(workspaceId, storyId),
  });
}

export async function invalidateChapterConfigurationQueries(
  queryClient: QueryClient,
  workspaceId: string,
  storyId: string,
): Promise<void> {
  await Promise.all([
    invalidateChapterListQueries(queryClient, workspaceId, storyId),
    queryClient.invalidateQueries({
      queryKey: chaptersQueryKeys.detailRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: adminQueryKeys.dashboardRoot(),
    }),
  ]);
}

export async function invalidateChapterTaskQueries(
  queryClient: QueryClient,
  workspaceId: string,
  storyId: string,
  chapterId: string,
): Promise<void> {
  await invalidateTaskMutationQueries(queryClient, {
    chapterId,
    storyId,
    workspaceId,
  });
}

export async function invalidateChapterDeleteQueries(
  queryClient: QueryClient,
  workspaceId: string,
  storyId: string,
  chapterId: string,
): Promise<void> {
  await Promise.all([
    invalidateChapterListQueries(queryClient, workspaceId, storyId),
    queryClient.invalidateQueries({
      queryKey: chaptersQueryKeys.detail(workspaceId, storyId, chapterId),
    }),
    queryClient.invalidateQueries({
      queryKey: chaptersQueryKeys.detailRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: adminQueryKeys.dashboardRoot(),
    }),
  ]);
}

export async function invalidateChapterPublicationQueries(
  queryClient: QueryClient,
  workspaceId: string,
  storyId: string,
  chapterId: string,
): Promise<void> {
  await Promise.all([
    invalidateChapterListQueries(queryClient, workspaceId, storyId),
    queryClient.invalidateQueries({
      queryKey: chaptersQueryKeys.detail(workspaceId, storyId, chapterId),
    }),
    queryClient.invalidateQueries({
      queryKey: chaptersQueryKeys.detailRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: adminQueryKeys.dashboardRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: statisticsQueryKeys.listRoot(),
    }),
  ]);
}

export function useCreateChapterMutation(
  workspaceId: string,
  storyId: string,
): UseMutationResult<void, Error, CreateChapterInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChapterInput) =>
      createChapter(workspaceId, storyId, input),
    onSuccess: async () => {
      await invalidateChapterListQueries(queryClient, workspaceId, storyId);
    },
  });
}

export function useDeleteChapterMutation(
  workspaceId: string,
  storyId: string,
): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chapterId: string) =>
      deleteChapter(workspaceId, storyId, chapterId),
    onSuccess: async (_result, chapterId) => {
      await invalidateChapterDeleteQueries(
        queryClient,
        workspaceId,
        storyId,
        chapterId,
      );
    },
  });
}

export function useUpdateChapterConfigurationMutation(
  workspaceId: string,
  storyId: string,
): UseMutationResult<
  void,
  Error,
  UpdateChapterConfigurationMutationInput,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chapterId,
      input,
    }: UpdateChapterConfigurationMutationInput) =>
      updateChapterConfiguration(workspaceId, storyId, chapterId, input),
    onSuccess: async () => {
      await invalidateChapterConfigurationQueries(
        queryClient,
        workspaceId,
        storyId,
      );
    },
  });
}

export function useUpdateChapterPublicationMutation(
  workspaceId: string,
  storyId: string,
): UseMutationResult<
  ChapterPublicationResult,
  Error,
  UpdateChapterPublicationMutationInput,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chapterId,
      ...input
    }: UpdateChapterPublicationMutationInput) =>
      updateChapterPublication(
        workspaceId,
        storyId,
        chapterId,
        input,
      ),
    onSuccess: async (_result, { chapterId }) => {
      await invalidateChapterPublicationQueries(
        queryClient,
        workspaceId,
        storyId,
        chapterId,
      );
    },
  });
}

export function useNotifyChapterProgressMutation(
  workspaceId: string,
  storyId: string,
  chapterId: string,
): UseMutationResult<void, Error, void, unknown> {
  return useMutation({
    mutationFn: () => notifyChapterProgress(workspaceId, storyId, chapterId),
  });
}

export type {
  UpdateChapterConfigurationMutationInput,
  UpdateChapterPublicationMutationInput,
};

export {
  type DeductTaskMutationInput as DeductChapterTaskMutationInput,
  type UpdateTaskMutationInput as UpdateChapterTaskMutationInput,
  useDeductTaskMutation as useDeductChapterTaskMutation,
  useUpdateTaskMutation as useUpdateChapterTaskMutation,
} from '@/features/tasks/hooks/mutations';
