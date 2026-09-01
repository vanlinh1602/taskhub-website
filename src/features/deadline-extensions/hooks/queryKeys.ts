import type { DeadlineExtensionListQuery } from '../types';

export const deadlineExtensionsQueryKeys = {
  list: (workspaceId: string, query: DeadlineExtensionListQuery) =>
    ['deadline-extensions', 'list', workspaceId, query] as const,
  listRoot: () => ['deadline-extensions', 'list'] as const,
};
