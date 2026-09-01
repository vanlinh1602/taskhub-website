import { describe, expect, it } from 'vitest';

import { filterTaskAssignees } from '@/features/chapters/utils';
import type { Member } from '@/features/members/types';

const members: readonly Member[] = [
  {
    discordUserId: 'active-with-stage',
    displayName: 'Active Translator',
    username: 'translator',
    avatarUrl: null,
    gmail: 'translator@example.com',
    status: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00.000Z',
    stages: [
      { id: '1', code: 'TRANSLATE', name: 'Translation', isActive: true },
    ],
    bankQr: { configured: true, fileName: 'qr.png' },
  },
  {
    discordUserId: 'inactive-stage',
    displayName: 'Inactive Stage',
    username: 'inactive-stage',
    avatarUrl: null,
    gmail: 'inactive-stage@example.com',
    status: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00.000Z',
    stages: [
      { id: '2', code: 'TRANSLATE', name: 'Translation', isActive: false },
    ],
    bankQr: { configured: false, fileName: null },
  },
  {
    discordUserId: 'wrong-stage',
    displayName: 'Quality Checker',
    username: 'qc',
    avatarUrl: null,
    gmail: 'qc@example.com',
    status: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00.000Z',
    stages: [{ id: '3', code: 'QC', name: 'Quality check', isActive: true }],
    bankQr: { configured: false, fileName: null },
  },
  {
    discordUserId: 'missing-gmail',
    displayName: 'Missing Gmail',
    username: 'missing-gmail',
    avatarUrl: null,
    gmail: null,
    status: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00.000Z',
    stages: [
      { id: '4', code: 'TRANSLATE', name: 'Translation', isActive: true },
    ],
    bankQr: { configured: false, fileName: null },
  },
  {
    discordUserId: 'suspended',
    displayName: 'Suspended Translator',
    username: 'suspended',
    avatarUrl: null,
    gmail: 'suspended@example.com',
    status: 'SUSPENDED',
    joinedAt: '2026-01-01T00:00:00.000Z',
    stages: [
      { id: '5', code: 'TRANSLATE', name: 'Translation', isActive: true },
    ],
    bankQr: { configured: false, fileName: null },
  },
];

describe('filterTaskAssignees', () => {
  it('keeps only active members with Gmail and an active matching stage', () => {
    expect(filterTaskAssignees(members, { stageCode: 'TRANSLATE' })).toEqual([
      { discordUserId: 'active-with-stage', displayName: 'Active Translator' },
    ]);
  });

  it('returns no candidates without a task stage', () => {
    expect(filterTaskAssignees(members, null)).toEqual([]);
  });
});
