import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type {
  DeductTaskInput,
  TaskFilterOptions,
  TaskListPage,
  TaskListQuery,
  UpdateTaskInput,
} from '../types';

function createTaskListQuery(query: TaskListQuery): string {
  const parameters = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  if (query.status) parameters.set('status', query.status);
  if (query.storyId) parameters.set('storyId', query.storyId);
  if (query.stageDefinitionId)
    parameters.set('stageDefinitionId', query.stageDefinitionId);

  return parameters.toString();
}

export async function getTasks(
  workspaceId: string,
  query: TaskListQuery,
): Promise<TaskListPage> {
  const response = await backendService.get<TaskListPage>(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/tasks?${createTaskListQuery(query)}`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function getTaskFilterOptions(
  workspaceId: string,
): Promise<TaskFilterOptions> {
  const response = await backendService.get<TaskFilterOptions>(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/tasks/filters`,
  );
  if (response.kind === 'ok') return response.data;
  throw new Error(formatError(response));
}

export async function updateTask(
  workspaceId: string,
  storyId: string,
  chapterId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<void> {
  const response = await backendService.patch(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories/${encodeURIComponent(storyId)}/chapters/${encodeURIComponent(chapterId)}/tasks/${encodeURIComponent(taskId)}`,
    input,
  );
  if (response.kind !== 'ok') throw new Error(formatError(response));
}

export async function completeTask(
  workspaceId: string,
  storyId: string,
  chapterId: string,
  taskId: string,
): Promise<void> {
  const response = await backendService.post(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories/${encodeURIComponent(storyId)}/chapters/${encodeURIComponent(chapterId)}/tasks/${encodeURIComponent(taskId)}/complete`,
  );
  if (response.kind !== 'ok') throw new Error(formatError(response));
}

export async function deductTask(
  workspaceId: string,
  storyId: string,
  chapterId: string,
  taskId: string,
  input: DeductTaskInput,
): Promise<void> {
  const response = await backendService.post(
    `/api/story-workflow/${encodeURIComponent(workspaceId)}/stories/${encodeURIComponent(storyId)}/chapters/${encodeURIComponent(chapterId)}/tasks/${encodeURIComponent(taskId)}/deduction`,
    input,
  );
  if (response.kind !== 'ok') throw new Error(formatError(response));
}
