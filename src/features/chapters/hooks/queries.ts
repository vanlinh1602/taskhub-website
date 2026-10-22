import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import { getChapter, getChapters } from '@/features/chapters/apis';
import type {
  Chapter,
  ChapterDetail,
  ChapterWorkflowFilter,
} from '@/features/chapters/types';

import { chaptersQueryKeys } from './queryKeys';

interface ChaptersQueryOptions {
  readonly enabled: boolean;
  readonly queryFn: () => Promise<Chapter[]>;
  readonly queryKey: ReturnType<typeof chaptersQueryKeys.list>;
  readonly staleTime: number;
}

interface ChapterQueryOptions {
  readonly enabled: boolean;
  readonly queryFn: () => Promise<ChapterDetail>;
  readonly queryKey: ReturnType<typeof chaptersQueryKeys.detail>;
  readonly staleTime: number;
}

export function createChaptersQueryOptions(
  workspaceId: string,
  storyId: string,
  workflow: ChapterWorkflowFilter,
): ChaptersQueryOptions {
  return {
    queryKey: chaptersQueryKeys.list(workspaceId, storyId, workflow),
    queryFn: () => getChapters(workspaceId, storyId, { status: workflow }),
    enabled: Boolean(workspaceId && storyId),
    staleTime: 86400000,
  };
}

export function createChapterQueryOptions(
  workspaceId: string,
  storyId: string,
  chapterId: string,
): ChapterQueryOptions {
  return {
    queryKey: chaptersQueryKeys.detail(workspaceId, storyId, chapterId),
    queryFn: () => getChapter(workspaceId, storyId, chapterId),
    enabled: Boolean(workspaceId && storyId && chapterId),
    staleTime: 86400000,
  };
}

export function useChaptersQuery(
  workspaceId: string,
  storyId: string,
  workflow: ChapterWorkflowFilter,
): UseQueryResult<Chapter[], Error> {
  return useQuery(
    createChaptersQueryOptions(workspaceId, storyId, workflow),
  );
}

export function useChapterQuery(
  workspaceId: string,
  storyId: string,
  chapterId: string,
): UseQueryResult<ChapterDetail, Error> {
  return useQuery(createChapterQueryOptions(workspaceId, storyId, chapterId));
}
