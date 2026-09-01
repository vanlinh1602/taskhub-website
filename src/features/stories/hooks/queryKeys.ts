export const storiesQueryKeys = {
  detail: (workspaceId: string, storyId: string) =>
    ['stories', 'detail', workspaceId, storyId] as const,
  list: (workspaceId: string, query: string) =>
    ['stories', 'list', workspaceId, query] as const,
  listRoot: () => ['stories', 'list'] as const,
};
