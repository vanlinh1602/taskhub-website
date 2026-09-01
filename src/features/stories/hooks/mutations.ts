import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { createStory } from '@/features/stories/apis';
import type { CreateStoryInput, Story } from '@/features/stories/types';

import { storiesQueryKeys } from './queryKeys';

export async function invalidateStoryListQueries(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: storiesQueryKeys.listRoot(),
  });
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
