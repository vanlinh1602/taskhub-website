import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { adminQueryKeys } from '@/features/admin/hooks';
import {
  createChapter,
  deductChapterTask,
  deleteChapter,
  notifyChapterProgress,
  updateChapterConfiguration,
  updateChapterPublication,
  updateChapterTask,
} from '@/features/chapters/apis';
import type {
  CreateChapterInput,
  DeductChapterTaskInput,
  UpdateChapterConfigurationInput,
  UpdateChapterTaskInput,
} from '@/features/chapters/types';

import { chaptersQueryKeys } from './queryKeys';

interface UpdateChapterConfigurationMutationInput {
  readonly chapterId: string;
  readonly input: UpdateChapterConfigurationInput;
}

interface UpdateChapterPublicationMutationInput {
  readonly chapterId: string;
  readonly publicationStatus: 'PUBLISHED' | 'UNPUBLISHED';
}

interface UpdateChapterTaskMutationInput {
  readonly taskId: string;
  readonly input: UpdateChapterTaskInput;
}

interface DeductChapterTaskMutationInput {
  readonly taskId: string;
  readonly input: DeductChapterTaskInput;
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
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: chaptersQueryKeys.detail(workspaceId, storyId, chapterId),
    }),
    invalidateChapterListQueries(queryClient, workspaceId, storyId),
    queryClient.invalidateQueries({
      queryKey: adminQueryKeys.dashboardRoot(),
    }),
  ]);
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
  void,
  Error,
  UpdateChapterPublicationMutationInput,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chapterId,
      publicationStatus,
    }: UpdateChapterPublicationMutationInput) =>
      updateChapterPublication(
        workspaceId,
        storyId,
        chapterId,
        publicationStatus,
      ),
    onSuccess: async (_result, { chapterId }) => {
      await Promise.all([
        invalidateChapterListQueries(queryClient, workspaceId, storyId),
        queryClient.invalidateQueries({
          queryKey: chaptersQueryKeys.detail(workspaceId, storyId, chapterId),
        }),
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.dashboardRoot(),
        }),
      ]);
    },
  });
}

export function useUpdateChapterTaskMutation(
  workspaceId: string,
  storyId: string,
  chapterId: string,
): UseMutationResult<void, Error, UpdateChapterTaskMutationInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: UpdateChapterTaskMutationInput) =>
      updateChapterTask(workspaceId, storyId, chapterId, taskId, input),
    onSuccess: async () => {
      await invalidateChapterTaskQueries(
        queryClient,
        workspaceId,
        storyId,
        chapterId,
      );
    },
  });
}

export function useDeductChapterTaskMutation(
  workspaceId: string,
  storyId: string,
  chapterId: string,
): UseMutationResult<void, Error, DeductChapterTaskMutationInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: DeductChapterTaskMutationInput) =>
      deductChapterTask(workspaceId, storyId, chapterId, taskId, input),
    onSuccess: async () => {
      await invalidateChapterTaskQueries(
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
  DeductChapterTaskMutationInput,
  UpdateChapterConfigurationMutationInput,
  UpdateChapterPublicationMutationInput,
  UpdateChapterTaskMutationInput,
};
