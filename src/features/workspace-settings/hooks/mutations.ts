import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { adminQueryKeys } from '@/features/admin/hooks';
import {
  deleteWorkspaceRole,
  updateWorkspaceChannel,
  updateWorkspaceFolder,
  updateWorkspaceRole,
  updateWorkspaceSettings,
  type UpdateWorkspaceSettingsInput,
} from '@/features/workspace-settings/apis';
import type {
  WorkspaceChannelKey,
  WorkspaceFolderKey,
  WorkspaceRoleKey,
} from '@/features/workspace-settings/types';

import { workspaceSettingsQueryKeys } from './queryKeys';

export async function invalidateWorkspaceSettingsQueries(
  queryClient: QueryClient,
  workspaceId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: workspaceSettingsQueryKeys.settings(workspaceId),
    }),
    queryClient.invalidateQueries({
      queryKey: workspaceSettingsQueryKeys.discordOptions(workspaceId),
    }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.workspaces() }),
  ]);
}

export function useUpdateWorkspaceSettingsMutation(
  workspaceId: string,
): UseMutationResult<void, Error, UpdateWorkspaceSettingsInput, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => updateWorkspaceSettings(workspaceId, input),
    onSuccess: () =>
      invalidateWorkspaceSettingsQueries(queryClient, workspaceId),
  });
}

export interface UpdateWorkspaceRoleInput {
  readonly role: WorkspaceRoleKey;
  readonly discordRoleId: string;
}

export function useUpdateWorkspaceRoleMutation(
  workspaceId: string,
): UseMutationResult<void, Error, UpdateWorkspaceRoleInput, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, discordRoleId }) =>
      updateWorkspaceRole(workspaceId, role, discordRoleId),
    onSuccess: () =>
      invalidateWorkspaceSettingsQueries(queryClient, workspaceId),
  });
}

export function useDeleteWorkspaceRoleMutation(
  workspaceId: string,
): UseMutationResult<void, Error, WorkspaceRoleKey, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (role) => deleteWorkspaceRole(workspaceId, role),
    onSuccess: () =>
      invalidateWorkspaceSettingsQueries(queryClient, workspaceId),
  });
}

export interface UpdateWorkspaceFolderInput {
  readonly type: WorkspaceFolderKey;
  readonly googleDriveFolderId: string;
}

export function useUpdateWorkspaceFolderMutation(
  workspaceId: string,
): UseMutationResult<void, Error, UpdateWorkspaceFolderInput, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, googleDriveFolderId }) =>
      updateWorkspaceFolder(workspaceId, type, googleDriveFolderId),
    onSuccess: () =>
      invalidateWorkspaceSettingsQueries(queryClient, workspaceId),
  });
}

export interface UpdateWorkspaceChannelInput {
  readonly type: WorkspaceChannelKey;
  readonly discordChannelId: string;
}

export function useUpdateWorkspaceChannelMutation(
  workspaceId: string,
): UseMutationResult<void, Error, UpdateWorkspaceChannelInput, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, discordChannelId }) =>
      updateWorkspaceChannel(workspaceId, type, discordChannelId),
    onSuccess: () =>
      invalidateWorkspaceSettingsQueries(queryClient, workspaceId),
  });
}
