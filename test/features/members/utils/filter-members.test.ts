import { describe, expect, it } from 'vitest';

import { filterMembers } from '@/features/members/utils';

const members = [
  {
    discordUserId: '100',
    displayName: 'An Nhiên',
    username: 'annhien',
    avatarUrl: null,
    gmail: 'nhien@example.com',
    status: 'ACTIVE' as const,
    joinedAt: '2026-01-01T00:00:00.000Z',
    stages: [{ id: '1', code: 'QC', name: 'Quality check', isActive: true }],
    bankQr: { configured: true, fileName: 'qr.png' },
  },
  {
    discordUserId: '200',
    displayName: 'Bình Minh',
    username: null,
    avatarUrl: null,
    gmail: null,
    status: 'SUSPENDED' as const,
    joinedAt: '2026-01-02T00:00:00.000Z',
    stages: [],
    bankQr: { configured: false, fileName: null },
  },
];

describe('filterMembers', () => {
  it('searches across identity, email, and stage metadata', () => {
    expect(filterMembers(members, 'quality', 'ALL')).toHaveLength(1);
    expect(filterMembers(members, '200', 'ALL')[0]?.displayName).toBe('Bình Minh');
  });

  it('filters by the member status after applying the search', () => {
    expect(filterMembers(members, '', 'SUSPENDED')).toEqual([members[1]]);
    expect(filterMembers(members, 'ann', 'SUSPENDED')).toHaveLength(0);
  });
});
