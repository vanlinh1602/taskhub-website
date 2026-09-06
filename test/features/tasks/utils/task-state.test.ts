import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  canCompleteTask,
  getTaskStatusLabelKey,
  isTaskOverdue,
  normalizeTaskFilterValue,
} from '@/features/tasks/utils';

describe('task state utilities', () => {
  afterEach(() => vi.useRealTimers());

  it('marks only active work with a past deadline as overdue', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-01T12:00:00.000Z'));

    expect(
      isTaskOverdue({
        dueAt: '2026-09-01T11:00:00.000Z',
        status: 'IN_PROGRESS',
      }),
    ).toBe(true);
    expect(
      isTaskOverdue({
        dueAt: '2026-09-01T11:00:00.000Z',
        status: 'COMPLETED',
      }),
    ).toBe(false);
    expect(isTaskOverdue({ dueAt: null, status: 'READY' })).toBe(false);
  });

  it('enables completion only for assigned in-progress tasks before their deadline', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-01T12:00:00.000Z'));

    expect(
      canCompleteTask({
        assigneeDiscordUserId: 'member-id',
        dueAt: '2026-09-01T13:00:00.000Z',
        status: 'IN_PROGRESS',
      }),
    ).toBe(true);
    expect(
      canCompleteTask({
        assigneeDiscordUserId: null,
        dueAt: '2026-09-01T13:00:00.000Z',
        status: 'IN_PROGRESS',
      }),
    ).toBe(false);
    expect(
      canCompleteTask({
        assigneeDiscordUserId: 'member-id',
        dueAt: '2026-09-01T11:00:00.000Z',
        status: 'IN_PROGRESS',
      }),
    ).toBe(false);
    expect(
      canCompleteTask({
        assigneeDiscordUserId: 'member-id',
        dueAt: '2026-09-01T13:00:00.000Z',
        status: 'READY',
      }),
    ).toBe(false);
    expect(
      canCompleteTask({
        assigneeDiscordUserId: 'member-id',
        dueAt: null,
        status: 'IN_PROGRESS',
      }),
    ).toBe(false);
  });

  it('maps every API status to a translation key', () => {
    expect(getTaskStatusLabelKey('BLOCKED')).toBe('taskStatusBlocked');
    expect(getTaskStatusLabelKey('READY')).toBe('taskStatusReady');
    expect(getTaskStatusLabelKey('IN_PROGRESS')).toBe('taskStatusInProgress');
    expect(getTaskStatusLabelKey('COMPLETED')).toBe('taskStatusCompleted');
    expect(getTaskStatusLabelKey('CANCELLED')).toBe('taskStatusCancelled');
  });

  it('normalizes numeric filter IDs without treating them as all', () => {
    expect(normalizeTaskFilterValue(12)).toBe('12');
    expect(normalizeTaskFilterValue('4')).toBe('4');
    expect(normalizeTaskFilterValue('ALL')).toBe('');
    expect(normalizeTaskFilterValue(null)).toBe('');
  });
});
