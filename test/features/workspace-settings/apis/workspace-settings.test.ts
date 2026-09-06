import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteWorkspaceRole,
  getWorkspaceDiscordOptions,
  getWorkspaceSettings,
  updateWorkspaceChannel,
  updateWorkspaceFolder,
  updateWorkspaceRole,
  updateWorkspaceSettings,
} from '@/features/workspace-settings/apis';
import { backendService } from '@/services';

describe('workspace settings APIs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('encodes the workspace settings path', async () => {
    const settings = { workspace: { id: 'guild/id' } };
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: settings } as never);

    await expect(getWorkspaceSettings('guild/id')).resolves.toBe(settings);
    expect(get).toHaveBeenCalledWith('/api/workspace/guild%2Fid/settings');
  });

  it('uses the Discord options endpoint for the current workspace', async () => {
    const options = { guildName: 'Taskory Hub' };
    const get = vi
      .spyOn(backendService, 'get')
      .mockResolvedValue({ kind: 'ok', data: options } as never);

    await getWorkspaceDiscordOptions('guild/id');
    expect(get).toHaveBeenCalledWith(
      '/api/workspace/guild%2Fid/settings/discord-options',
    );
  });

  it('maps UI setting keys to backend enum route values and sends the expected payload', async () => {
    const put = vi
      .spyOn(backendService, 'put')
      .mockResolvedValue({ kind: 'ok', data: null } as never);

    await updateWorkspaceRole('guild/id', 'manager', 'role/id');
    await updateWorkspaceFolder('guild/id', 'storyWorkflow', 'folder/id');
    await updateWorkspaceChannel('guild/id', 'extensionRequest', 'channel/id');
    await updateWorkspaceChannel(
      'guild/id',
      'storyPublicationNotification',
      'publication-channel/id',
    );

    expect(put).toHaveBeenNthCalledWith(
      1,
      '/api/workspace/guild%2Fid/roles/manager',
      { discordRoleId: 'role/id' },
    );
    expect(put).toHaveBeenNthCalledWith(
      2,
      '/api/workspace/guild%2Fid/folders/story-workflow',
      { googleDriveFolderId: 'folder/id' },
    );
    expect(put).toHaveBeenNthCalledWith(
      3,
      '/api/workspace/guild%2Fid/channels/TASK_DEADLINE_EXTENSION_REQUEST',
      { discordChannelId: 'channel/id' },
    );
    expect(put).toHaveBeenNthCalledWith(
      4,
      '/api/workspace/guild%2Fid/channels/STORY_PUBLICATION_NOTIFICATION',
      { discordChannelId: 'publication-channel/id' },
    );
  });

  it('uses PATCH for workspace basics and DELETE for role removal', async () => {
    const patch = vi
      .spyOn(backendService, 'patch')
      .mockResolvedValue({ kind: 'ok', data: null } as never);
    const remove = vi
      .spyOn(backendService, 'delete')
      .mockResolvedValue({ kind: 'ok', data: null } as never);

    await updateWorkspaceSettings('guild/id', {
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
    });
    await deleteWorkspaceRole('guild/id', 'admin');

    expect(patch).toHaveBeenCalledWith(
      '/api/workspace/guild%2Fid/settings',
      { currency: 'VND', timezone: 'Asia/Ho_Chi_Minh' },
    );
    expect(remove).toHaveBeenCalledWith(
      '/api/workspace/guild%2Fid/roles/admin',
    );
  });
});
