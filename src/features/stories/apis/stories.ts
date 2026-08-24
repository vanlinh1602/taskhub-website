import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type { CreateStoryInput, Story } from '../types';

export async function getStories(
  workspaceId: string,
  query = '',
): Promise<Story[]> {
  const search = query ? `?${new URLSearchParams({ query }).toString()}` : '';
  const response = await backendService.get<Story[]>(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories${search}`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function getStory(
  workspaceId: string,
  storyId: string,
): Promise<Story> {
  const response = await backendService.get<Story>(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories/${encodeURIComponent(storyId)}`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function createStory(
  workspaceId: string,
  input: CreateStoryInput,
): Promise<Story> {
  const response = await backendService.post<Story>(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories`,
    input,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}
