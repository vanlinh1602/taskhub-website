import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type {
  TaskFilterOptions,
  TaskListPage,
  TaskListQuery,
} from '../types';

function createTaskListQuery(query: TaskListQuery): string {
  const parameters = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    dueAtOrder: query.dueAtOrder,
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
