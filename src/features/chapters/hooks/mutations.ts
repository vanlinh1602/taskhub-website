import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { adminQueryKeys } from '@/features/admin/hooks';
import {
  createChapter,
  updateChapterConfiguration,
  updateChapterPublication,
  updateChapterTask,
} from '@/features/chapters/apis';
import type {
  CreateChapterInput,
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
    onSuccess: async () => {
      await invalidateChapterListQueries(queryClient, workspaceId, storyId);
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

export type {
  UpdateChapterConfigurationMutationInput,
  UpdateChapterPublicationMutationInput,
  UpdateChapterTaskMutationInput,
};
