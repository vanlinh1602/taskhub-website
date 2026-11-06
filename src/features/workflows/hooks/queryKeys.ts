export const workflowQueryKeys = {
  listRoot: (workspaceId: string) =>
    ['workflows', 'list', workspaceId] as const,
  list: (
    workspaceId: string,
    statuses: readonly string[],
    page: number,
    pageSize: number,
    search = '',
  ) =>
    [
      'workflows',
      'list',
      workspaceId,
      statuses.join(','),
      page,
      pageSize,
      search,
    ] as const,
  detail: (workspaceId: string, templateId: string) =>
    ['workflows', 'detail', workspaceId, templateId] as const,
  stageCatalog: (workspaceId: string) =>
    ['workflows', 'stage-catalog', workspaceId] as const,
};
