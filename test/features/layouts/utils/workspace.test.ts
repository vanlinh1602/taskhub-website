import { describe, expect, it } from 'vitest';

import { getWorkspaceName } from '@/features/layouts/utils/workspace';
import type { User } from '@/features/user/type';

const fallbackName = 'Taskory Hub';

const user: User = {
  address: '',
  avatar: '',
  bio: '',
  email: 'manager@example.com',
  gender: '',
  id: 1,
  name: 'Manager',
  permissions: {
    activeTeam: 2,
    teams: [
      { name: 'Alpha', role: 'manager', teamId: 1 },
      { name: 'Beta', role: 'manager', teamId: 2 },
    ],
  },
  phone: '',
  username: 'manager',
};

describe('getWorkspaceName', () => {
  it('returns the active workspace name', () => {
    expect(getWorkspaceName(user, fallbackName)).toBe('Beta');
  });

  it('falls back when no active workspace is available', () => {
    expect(getWorkspaceName(undefined, fallbackName)).toBe(fallbackName);
    expect(getWorkspaceName({ ...user, permissions: { teams: user.permissions?.teams } }, fallbackName)).toBe(fallbackName);
  });
});
