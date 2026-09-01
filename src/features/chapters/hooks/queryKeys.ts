export const chaptersQueryKeys = {
  detail: (workspaceId: string, storyId: string, chapterId: string) =>
    ['chapters', 'detail', workspaceId, storyId, chapterId] as const,
  detailRoot: () => ['chapters', 'detail'] as const,
  list: (
    workspaceId: string,
    storyId: string,
    workflow: string,
    page: number,
  ) => ['chapters', 'list', workspaceId, storyId, workflow, page] as const,
  listRoot: (workspaceId: string, storyId: string) =>
    ['chapters', 'list', workspaceId, storyId] as const,
};
