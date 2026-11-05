import { describe, expect, it } from 'vitest';

import type { Member } from '@/features/members/types';
import type { TaskListItem } from '@/features/tasks/types';
import {
  canBulkAssignTask,
  canBulkChangeDeadline,
  canBulkChangeStatus,
  getBulkCompletableTasks,
} from '@/features/tasks/utils';

const future = new Date(Date.now() + 3_600_000).toISOString();

function task(overrides: Partial<TaskListItem> = {}): TaskListItem {
  return {
    agreedPrice: '10',
    assigneeDiscordUserId: null,
    assigneeDisplayName: null,
    chapterId: 'c1',
    chapterName: 'Chapter 1',
    currency: 'VND',
    dueAt: null,
    id: 't1',
    paymentStatus: 'NOT_READY',
    stageCode: 'TRANSLATE',
    stageDefinitionId: 's1',
    stageName: 'Translate',
    status: 'READY',
    storyId: 'st1',
    storyTitle: 'Story',
    ...overrides,
  };
}

function member(overrides: Partial<Member> = {}): Member {
  return {
    bankQr: { configured: false, fileName: null },
    discordUserId: 'm1',
    displayName: 'Member',
    gmail: 'm@example.com',
    joinedAt: '2026-01-01T00:00:00.000Z',
    stages: [{ code: 'TRANSLATE', id: 's1', isActive: true, name: 'Translate' }],
    status: 'ACTIVE',
    username: null,
    avatarUrl: null,
    ...overrides,
  };
}

describe('task bulk eligibility', () => {
  it('only assigns to active members configured for the task stage', () => {
    const members = [
      member(),
      member({ discordUserId: 'm2', stages: [] }),
      member({ discordUserId: 'm3', gmail: null }),
    ];

    expect(canBulkAssignTask(task(), 'm1', members)).toBe(true);
    expect(canBulkAssignTask(task(), 'm2', members)).toBe(false);
    expect(canBulkAssignTask(task(), 'm3', members)).toBe(false);
    expect(canBulkAssignTask(task({ assigneeDiscordUserId: 'm1' }), 'm1', members)).toBe(false);
  });

  it('skips paid and finished tasks when assigning', () => {
    const members = [member()];

    expect(canBulkAssignTask(task({ paymentStatus: 'PAID' }), 'm1', members)).toBe(false);
    expect(canBulkAssignTask(task({ status: 'COMPLETED' }), 'm1', members)).toBe(false);
  });

  it('unassigns only tasks that currently have an assignee', () => {
    expect(canBulkAssignTask(task(), null, [])).toBe(false);
    expect(
      canBulkAssignTask(task({ assigneeDiscordUserId: 'm1', status: 'IN_PROGRESS' }), null, []),
    ).toBe(true);
  });

  it('completes only in-progress, assigned, on-time, unpaid tasks', () => {
    const completable = task({
      assigneeDiscordUserId: 'm1',
      dueAt: future,
      status: 'IN_PROGRESS',
    });

    expect(
      getBulkCompletableTasks([
        completable,
        task({ id: 't2' }),
        { ...completable, id: 't3', paymentStatus: 'PAID' },
      ]).map((item) => item.id),
    ).toEqual(['t1']);
  });

  it('limits deadline and status changes to editable tasks', () => {
    expect(canBulkChangeDeadline(task())).toBe(true);
    expect(canBulkChangeDeadline(task({ status: 'COMPLETED' }))).toBe(false);
    expect(canBulkChangeStatus(task(), 'BLOCKED')).toBe(true);
    expect(canBulkChangeStatus(task(), 'READY')).toBe(false);
    expect(canBulkChangeStatus(task({ paymentStatus: 'PAID' }), 'BLOCKED')).toBe(false);
  });
});
