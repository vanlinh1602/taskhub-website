import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getTaskFilterOptions, getTasks } from '@/features/tasks/apis';
import type {
  TaskFilterOptions,
  TaskListPage,
  TaskListQuery,
} from '@/features/tasks/types';

import { tasksQueryKeys } from './queryKeys';

interface TaskListQueryOptions {
  readonly enabled: boolean;
  readonly queryFn: () => Promise<TaskListPage>;
  readonly queryKey: ReturnType<typeof tasksQueryKeys.list>;
  readonly staleTime: number;
}

interface TaskFilterOptionsQueryOptions {
  readonly enabled: boolean;
  readonly queryFn: () => Promise<TaskFilterOptions>;
  readonly queryKey: ReturnType<typeof tasksQueryKeys.filters>;
  readonly staleTime: number;
}

export function createTasksQueryOptions(
  workspaceId: string,
  query: TaskListQuery,
): TaskListQueryOptions {
  return {
    enabled: workspaceId.length > 0,
    queryFn: () => getTasks(workspaceId, query),
    queryKey: tasksQueryKeys.list(workspaceId, query),
    staleTime: 30000,
  };
}

export function createTaskFilterOptionsQueryOptions(
  workspaceId: string,
): TaskFilterOptionsQueryOptions {
  return {
    enabled: workspaceId.length > 0,
    queryFn: () => getTaskFilterOptions(workspaceId),
    queryKey: tasksQueryKeys.filters(workspaceId),
    staleTime: 30 * 24 * 60 * 60 * 1000,
  };
}

export function useTasksQuery(
  workspaceId: string,
  query: TaskListQuery,
): UseQueryResult<TaskListPage, Error> {
  return useQuery(createTasksQueryOptions(workspaceId, query));
}

export function useTaskFilterOptionsQuery(
  workspaceId: string,
): UseQueryResult<TaskFilterOptions, Error> {
  return useQuery(createTaskFilterOptionsQueryOptions(workspaceId));
}
