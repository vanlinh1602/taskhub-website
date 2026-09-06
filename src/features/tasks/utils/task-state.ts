import type { TaskListItem, TaskStatus } from '../types';

export function normalizeTaskFilterValue(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';

  const normalizedValue = String(value);
  return normalizedValue === 'ALL' ? '' : normalizedValue;
}

export function isTaskOverdue(task: Pick<TaskListItem, 'dueAt' | 'status'>): boolean {
  if (!task.dueAt || !['READY', 'IN_PROGRESS'].includes(task.status)) {
    return false;
  }

  const dueAt = new Date(task.dueAt);
  return !Number.isNaN(dueAt.getTime()) && dueAt.getTime() < Date.now();
}

export function canCompleteTask(
  task: Pick<
    TaskListItem,
    'assigneeDiscordUserId' | 'dueAt' | 'status'
  >,
): boolean {
  if (task.status !== 'IN_PROGRESS' || !task.assigneeDiscordUserId || !task.dueAt)
    return false;

  const dueAt = new Date(task.dueAt);
  return !Number.isNaN(dueAt.getTime()) && dueAt.getTime() > Date.now();
}

export function getTaskStatusLabelKey(status: TaskStatus):
  | 'taskStatusBlocked'
  | 'taskStatusReady'
  | 'taskStatusInProgress'
  | 'taskStatusCompleted'
  | 'taskStatusCancelled' {
  if (status === 'BLOCKED') return 'taskStatusBlocked';
  if (status === 'READY') return 'taskStatusReady';
  if (status === 'IN_PROGRESS') return 'taskStatusInProgress';
  if (status === 'COMPLETED') return 'taskStatusCompleted';
  return 'taskStatusCancelled';
}
