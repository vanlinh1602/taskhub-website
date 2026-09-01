export const adminQueryKeys = {
  dashboard: (workspaceId: string) =>
    ['admin', 'dashboard', workspaceId] as const,
  dashboardRoot: () => ['admin', 'dashboard'] as const,
  workspaces: () => ['workspace', 'list'] as const,
};
