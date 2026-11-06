export const stagesQueryKeys = {
  all: (workspaceId: string) => ['stages', 'list', workspaceId, 'all'] as const,
  list: (workspaceId: string, page: number, pageSize: number) =>
    ['stages', 'list', workspaceId, page, pageSize] as const,
};
