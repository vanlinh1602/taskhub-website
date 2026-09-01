export const workspaceSettingsQueryKeys = {
  discordOptions: (workspaceId: string) =>
    ['workspaceSettings', 'discord-options', workspaceId] as const,
  settings: (workspaceId: string) =>
    ['workspaceSettings', workspaceId] as const,
};
