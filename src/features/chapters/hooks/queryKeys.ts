export const chaptersQueryKeys = {
  root: () => ['chapters'] as const,
  detail: (workspaceId: string, storyId: string, chapterId: string) =>
    ['chapters', 'detail', workspaceId, storyId, chapterId] as const,
  detailRoot: () => ['chapters', 'detail'] as const,
  list: (workspaceId: string, storyId: string, workflow: string) =>
    ['chapters', 'list', workspaceId, storyId, workflow] as const,
  listRoot: (workspaceId: string, storyId: string) =>
    ['chapters', 'list', workspaceId, storyId] as const,
};
