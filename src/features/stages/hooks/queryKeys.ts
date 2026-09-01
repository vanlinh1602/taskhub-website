export const stagesQueryKeys = {
  list: (workspaceId: string, page: number, pageSize: number) =>
    ['stages', 'list', workspaceId, page, pageSize] as const,
};
