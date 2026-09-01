export const workflowQueryKeys = {
  all: (workspaceId: string) => ['workflows', workspaceId] as const,
  list: (
    workspaceId: string,
    statuses: readonly string[],
    page: number,
    pageSize: number,
  ) =>
    [
      'workflows',
      'list',
      workspaceId,
      statuses.join(','),
      page,
      pageSize,
    ] as const,
  detail: (workspaceId: string, templateId: string) =>
    ['workflows', 'detail', workspaceId, templateId] as const,
  stageCatalog: (workspaceId: string) =>
    ['workflows', 'stage-catalog', workspaceId] as const,
};
