import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import {
  getWorkspaceDiscordOptions,
  getWorkspaceSettings,
} from '@/features/workspace-settings/apis';
import type {
  WorkspaceDiscordOptions,
  WorkspaceSettings,
} from '@/features/workspace-settings/types';

import { workspaceSettingsQueryKeys } from './queryKeys';

export function useWorkspaceSettingsQuery(
  workspaceId: string,
): UseQueryResult<WorkspaceSettings, Error> {
  return useQuery({
    queryKey: workspaceSettingsQueryKeys.settings(workspaceId),
    queryFn: () => getWorkspaceSettings(workspaceId),
    enabled: workspaceId.length > 0,
  });
}

export function useWorkspaceDiscordOptionsQuery(
  workspaceId: string,
): UseQueryResult<WorkspaceDiscordOptions, Error> {
  return useQuery({
    queryKey: workspaceSettingsQueryKeys.discordOptions(workspaceId),
    queryFn: () => getWorkspaceDiscordOptions(workspaceId),
    enabled: workspaceId.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
