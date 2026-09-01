export const membersQueryKeys = {
  list: (workspaceId: string) => ['members', 'list', workspaceId] as const,
};
