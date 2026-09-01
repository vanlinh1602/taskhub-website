import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import { getStories, getStory } from '@/features/stories/apis';
import type { Story } from '@/features/stories/types';

import { storiesQueryKeys } from './queryKeys';

interface StoriesQueryOptions {
  readonly enabled: boolean;
  readonly queryFn: () => Promise<Story[]>;
  readonly queryKey: ReturnType<typeof storiesQueryKeys.list>;
  readonly staleTime: number;
}

interface StoryQueryOptions {
  readonly enabled: boolean;
  readonly queryFn: () => Promise<Story>;
  readonly queryKey: ReturnType<typeof storiesQueryKeys.detail>;
  readonly staleTime: number;
}

export function createStoriesQueryOptions(
  workspaceId: string,
  query: string,
): StoriesQueryOptions {
  return {
    queryKey: storiesQueryKeys.list(workspaceId, query),
    queryFn: () => getStories(workspaceId, query),
    enabled: workspaceId.length > 0,
    staleTime: 1000 * 60 * 60 * 24,
  };
}

export function createStoryQueryOptions(
  workspaceId: string,
  storyId: string,
): StoryQueryOptions {
  return {
    queryKey: storiesQueryKeys.detail(workspaceId, storyId),
    queryFn: () => getStory(workspaceId, storyId),
    enabled: Boolean(workspaceId && storyId),
    staleTime: 86400000,
  };
}

export function useStoriesQuery(
  workspaceId: string,
  query: string,
): UseQueryResult<Story[], Error> {
  return useQuery(createStoriesQueryOptions(workspaceId, query));
}

export function useStoryQuery(
  workspaceId: string,
  storyId: string,
): UseQueryResult<Story, Error> {
  return useQuery(createStoryQueryOptions(workspaceId, storyId));
}
