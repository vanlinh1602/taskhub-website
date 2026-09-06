import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import type {
  WorkspaceChannelKey,
  WorkspaceDiscordOptions,
  WorkspaceFolderKey,
  WorkspaceRoleKey,
  WorkspaceSettings,
} from '../types';

function workspacePath(workspaceId: string): string {
  return `/api/workspace/${encodeURIComponent(workspaceId)}`;
}

const folderRouteTypes: Record<WorkspaceFolderKey, string> = {
  bankQr: 'bank-qr',
  storyWorkflow: 'story-workflow',
};

const channelRouteTypes: Record<WorkspaceChannelKey, string> = {
  extensionRequest: 'TASK_DEADLINE_EXTENSION_REQUEST',
  storyNotification: 'STORY_NOTIFICATION',
  storyPublicationNotification: 'STORY_PUBLICATION_NOTIFICATION',
  storyWorkflow: 'STORY_WORKFLOW',
};

function throwApiError(response: {
  readonly kind: string;
  readonly [key: string]: unknown;
}): never {
  throw new Error(formatError(response));
}

export async function getWorkspaceSettings(
  workspaceId: string,
): Promise<WorkspaceSettings> {
  const response = await backendService.get<WorkspaceSettings>(
    `${workspacePath(workspaceId)}/settings`,
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export async function getWorkspaceDiscordOptions(
  workspaceId: string,
): Promise<WorkspaceDiscordOptions> {
  const response = await backendService.get<WorkspaceDiscordOptions>(
    `${workspacePath(workspaceId)}/settings/discord-options`,
  );
  if (response.kind === 'ok') return response.data;
  return throwApiError(response);
}

export interface UpdateWorkspaceSettingsInput {
  readonly timezone: string;
  readonly currency: string;
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  input: UpdateWorkspaceSettingsInput,
): Promise<void> {
  const response = await backendService.patch<null>(
    `${workspacePath(workspaceId)}/settings`,
    input,
  );
  if (response.kind === 'ok') return;
  return throwApiError(response);
}

export async function updateWorkspaceRole(
  workspaceId: string,
  role: WorkspaceRoleKey,
  discordRoleId: string,
): Promise<void> {
  const response = await backendService.put<null>(
    `${workspacePath(workspaceId)}/roles/${encodeURIComponent(role)}`,
    { discordRoleId },
  );
  if (response.kind === 'ok') return;
  return throwApiError(response);
}

export async function deleteWorkspaceRole(
  workspaceId: string,
  role: WorkspaceRoleKey,
): Promise<void> {
  const response = await backendService.delete<null>(
    `${workspacePath(workspaceId)}/roles/${encodeURIComponent(role)}`,
  );
  if (response.kind === 'ok') return;
  return throwApiError(response);
}

export async function updateWorkspaceFolder(
  workspaceId: string,
  type: WorkspaceFolderKey,
  googleDriveFolderId: string,
): Promise<void> {
  const response = await backendService.put<null>(
    `${workspacePath(workspaceId)}/folders/${encodeURIComponent(folderRouteTypes[type])}`,
    { googleDriveFolderId },
  );
  if (response.kind === 'ok') return;
  return throwApiError(response);
}

export async function updateWorkspaceChannel(
  workspaceId: string,
  type: WorkspaceChannelKey,
  discordChannelId: string,
): Promise<void> {
  const response = await backendService.put<null>(
    `${workspacePath(workspaceId)}/channels/${encodeURIComponent(channelRouteTypes[type])}`,
    { discordChannelId },
  );
  if (response.kind === 'ok') return;
  return throwApiError(response);
}
