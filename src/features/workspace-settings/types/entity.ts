export type WorkspaceRoleKey = 'manager' | 'admin' | 'chapterNotification';

export type WorkspaceFolderKey = 'storyWorkflow' | 'bankQr';

export type WorkspaceChannelKey =
  | 'storyWorkflow'
  | 'storyNotification'
  | 'storyPublicationNotification'
  | 'extensionRequest';

export interface WorkspaceSettingRole {
  readonly discordRoleId: string | null;
  readonly name: string | null;
}

export interface WorkspaceSettingFolder {
  readonly googleDriveFolderId: string | null;
}

export interface WorkspaceSettingChannel {
  readonly discordChannelId: string | null;
  readonly name: string | null;
  readonly type: number | null;
}

export interface WorkspaceSettings {
  readonly workspace: {
    readonly id: string;
    readonly name: string;
    readonly timezone: string;
    readonly currency: string;
    readonly isActive: boolean;
  };
  readonly roles: {
    readonly manager: WorkspaceSettingRole;
    readonly admin: WorkspaceSettingRole;
    readonly chapterNotification: WorkspaceSettingRole;
  };
  readonly folders: {
    readonly storyWorkflow: WorkspaceSettingFolder;
    readonly bankQr: WorkspaceSettingFolder;
  };
  readonly channels: {
    readonly storyWorkflow: WorkspaceSettingChannel;
    readonly storyNotification: WorkspaceSettingChannel;
    readonly storyPublicationNotification: WorkspaceSettingChannel;
    readonly extensionRequest: WorkspaceSettingChannel;
  };
}

export interface DiscordRoleOption {
  readonly id: string;
  readonly name: string;
  readonly color: number;
  readonly position: number;
}

export interface DiscordChannelOption {
  readonly id: string;
  readonly name: string;
  readonly type: number;
}

export interface WorkspaceDiscordOptions {
  readonly guildName: string;
  readonly roles: readonly DiscordRoleOption[];
  readonly storyWorkflowChannels: readonly DiscordChannelOption[];
  readonly textChannels: readonly DiscordChannelOption[];
}
