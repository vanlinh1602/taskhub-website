import type { TaskListQuery } from '../types';

export const tasksQueryKeys = {
  filters: (workspaceId: string) =>
    ['tasks', 'filters', workspaceId] as const,
  list: (workspaceId: string, query: TaskListQuery) =>
    ['tasks', 'list', workspaceId, query] as const,
  listRoot: () => ['tasks', 'list'] as const,
};
