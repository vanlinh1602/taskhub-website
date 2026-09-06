import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type {
  ChapterDetail,
  ChapterPage,
  ChapterPublicationResult,
  ChapterWorkflowFilter,
  CreateChapterInput,
  UpdateChapterConfigurationInput,
  UpdateChapterPublicationInput,
} from '../types';

export {
  deductTask as deductChapterTask,
  updateTask as updateChapterTask,
} from '@/features/tasks/apis';

export async function getChapter(
  workspaceId: string,
  storyId: string,
  chapterId: string,
): Promise<ChapterDetail> {
  const response = await backendService.get<ChapterDetail>(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories/${encodeURIComponent(storyId)}/chapters/${encodeURIComponent(chapterId)}`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function getChapters(
  workspaceId: string,
  storyId: string,
  options: {
    readonly page?: number;
    readonly status?: ChapterWorkflowFilter;
  } = {},
): Promise<ChapterPage> {
  const query = new URLSearchParams({
    page: String(options.page ?? 0),
    status: options.status ?? 'ALL',
  });
  const response = await backendService.get<ChapterPage>(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories/${encodeURIComponent(storyId)}/chapters?${query.toString()}`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function createChapter(
  workspaceId: string,
  storyId: string,
  input: CreateChapterInput,
): Promise<void> {
  const response = await backendService.post(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories/${encodeURIComponent(storyId)}/chapters`,
    input,
  );
  if (response.kind !== 'ok') throw new Error(formatError(response));
}

export async function deleteChapter(
  workspaceId: string,
  storyId: string,
  chapterId: string,
): Promise<void> {
  const response = await backendService.delete(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories/${encodeURIComponent(storyId)}/chapters/${encodeURIComponent(chapterId)}`,
  );
  if (response.kind !== 'ok') throw new Error(formatError(response));
}

export async function updateChapterPublication(
  workspaceId: string,
  storyId: string,
  chapterId: string,
  input: UpdateChapterPublicationInput,
): Promise<ChapterPublicationResult> {
  const response = await backendService.patch<ChapterPublicationResult>(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories/${encodeURIComponent(storyId)}/chapters/${encodeURIComponent(chapterId)}/publication`,
    input,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function updateChapterConfiguration(
  workspaceId: string,
  storyId: string,
  chapterId: string,
  input: UpdateChapterConfigurationInput,
): Promise<void> {
  const response = await backendService.patch(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories/${encodeURIComponent(storyId)}/chapters/${encodeURIComponent(chapterId)}`,
    input,
  );
  if (response.kind !== 'ok') throw new Error(formatError(response));
}

export async function notifyChapterProgress(
  workspaceId: string,
  storyId: string,
  chapterId: string,
): Promise<void> {
  const response = await backendService.post(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories/${encodeURIComponent(storyId)}/chapters/${encodeURIComponent(chapterId)}/progress-notification`,
  );
  if (response.kind !== 'ok') throw new Error(formatError(response));
}
