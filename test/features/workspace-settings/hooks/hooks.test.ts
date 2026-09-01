import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { adminQueryKeys } from '@/features/admin/hooks';
import {
  invalidateWorkspaceSettingsQueries,
  workspaceSettingsQueryKeys,
} from '@/features/workspace-settings/hooks';

describe('workspace settings hooks', () => {
  it('keeps the documented query keys and invalidates workspace summaries after save', async () => {
    expect(workspaceSettingsQueryKeys.settings('workspace-1')).toEqual([
      'workspaceSettings',
      'workspace-1',
    ]);
    expect(workspaceSettingsQueryKeys.discordOptions('workspace-1')).toEqual([
      'workspaceSettings',
      'discord-options',
      'workspace-1',
    ]);

    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true);
    await invalidateWorkspaceSettingsQueries(queryClient, 'workspace-1');

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: workspaceSettingsQueryKeys.settings('workspace-1'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: workspaceSettingsQueryKeys.discordOptions('workspace-1'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.workspaces(),
    });
  });
});
