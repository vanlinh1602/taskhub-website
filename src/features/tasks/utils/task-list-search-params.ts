import type { TaskSortBy, TaskSortOrder, TaskStatus } from '../types';

export type TaskListStatus = TaskStatus | 'ALL';

export interface TaskListViewState {
  readonly status: TaskListStatus;
  readonly storyId: string;
  readonly stageDefinitionId: string;
  readonly sortBy: TaskSortBy;
  readonly sortOrder: TaskSortOrder;
  readonly page: number;
}

export const TASK_STATUS_VALUES: readonly TaskStatus[] = [
  'BLOCKED',
  'READY',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

export const TASK_SORT_BY_VALUES: readonly TaskSortBy[] = [
  'DEADLINE',
  'STORY_TITLE',
  'CHAPTER_NAME',
  'CHAPTER_ID',
];

export const DEFAULT_TASK_LIST_VIEW: TaskListViewState = {
  page: 0,
  sortBy: 'DEADLINE',
  sortOrder: 'ASC',
  stageDefinitionId: '',
  status: 'ALL',
  storyId: '',
};

const TASK_LIST_MANAGED_PARAMS = [
  'status',
  'storyId',
  'stageDefinitionId',
  'sortBy',
  'sortOrder',
  'page',
] as const;

export function isTaskStatus(value: string | null): value is TaskStatus {
  return value !== null && TASK_STATUS_VALUES.some((status) => status === value);
}

export function isTaskSortBy(value: string | null): value is TaskSortBy {
  return value !== null && TASK_SORT_BY_VALUES.some((sortBy) => sortBy === value);
}

export function isTaskSortOrder(
  value: string | null,
): value is TaskSortOrder {
  return value === 'ASC' || value === 'DESC';
}

function readPage(value: string | null): number {
  if (value === null || !/^\d+$/.test(value)) return 0;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : 0;
}

export function readTaskListView(
  searchParams: URLSearchParams,
): TaskListViewState {
  const status = searchParams.get('status');
  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');

  return {
    page: readPage(searchParams.get('page')),
    sortBy: isTaskSortBy(sortBy) ? sortBy : DEFAULT_TASK_LIST_VIEW.sortBy,
    sortOrder: isTaskSortOrder(sortOrder)
      ? sortOrder
      : DEFAULT_TASK_LIST_VIEW.sortOrder,
    stageDefinitionId: searchParams.get('stageDefinitionId') ?? '',
    status: isTaskStatus(status) ? status : DEFAULT_TASK_LIST_VIEW.status,
    storyId: searchParams.get('storyId') ?? '',
  };
}

export function createTaskListSearchParams(
  view: TaskListViewState,
  currentSearchParams: URLSearchParams = new URLSearchParams(),
): URLSearchParams {
  const searchParams = new URLSearchParams(currentSearchParams);

  TASK_LIST_MANAGED_PARAMS.forEach((key) => searchParams.delete(key));

  if (view.status !== DEFAULT_TASK_LIST_VIEW.status) {
    searchParams.set('status', view.status);
  }
  if (view.storyId) searchParams.set('storyId', view.storyId);
  if (view.stageDefinitionId) {
    searchParams.set('stageDefinitionId', view.stageDefinitionId);
  }
  if (view.sortBy !== DEFAULT_TASK_LIST_VIEW.sortBy) {
    searchParams.set('sortBy', view.sortBy);
  }
  if (view.sortOrder !== DEFAULT_TASK_LIST_VIEW.sortOrder) {
    searchParams.set('sortOrder', view.sortOrder);
  }
  if (view.page > DEFAULT_TASK_LIST_VIEW.page) {
    searchParams.set('page', String(view.page));
  }

  return searchParams;
}
