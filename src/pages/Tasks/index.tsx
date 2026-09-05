import { ArrowDown, ArrowUp, ListTodo, SearchX, ShieldOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SelectSearch, {
  type Option as SelectSearchOption,
} from '@/components/ui/select-search';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TaskActionButtons from '@/features/tasks/components/task-action-buttons';
import {
  default as TaskActionDialogs,
  type TaskActionMode,
} from '@/features/tasks/components/task-action-dialogs';
import {
  useTaskFilterOptionsQuery,
  useTasksQuery,
} from '@/features/tasks/hooks';
import type {
  TaskActionTarget,
  TaskFilterStage,
  TaskFilterStory,
  TaskListItem,
  TaskSortBy,
  TaskSortOrder,
  TaskStatus,
} from '@/features/tasks/types';
import {
  createTaskListSearchParams,
  DEFAULT_TASK_LIST_VIEW,
  getTaskStatusLabelKey,
  isTaskOverdue,
  isTaskSortBy,
  isTaskStatus,
  readTaskListView,
  TASK_SORT_BY_VALUES,
  TASK_STATUS_VALUES,
  type TaskListViewState,
} from '@/features/tasks/utils';
import { toTaskActionTarget } from '@/features/tasks/utils/task-action-target';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const TASK_PAGE_SIZE = 25;
type TaskSortLabelKey =
  | 'sortByChapterId'
  | 'sortByChapterName'
  | 'sortByDeadline'
  | 'sortByStoryTitle';

function getTaskSortLabelKey(sortBy: TaskSortBy): TaskSortLabelKey {
  switch (sortBy) {
    case 'DEADLINE':
      return 'sortByDeadline';
    case 'STORY_TITLE':
      return 'sortByStoryTitle';
    case 'CHAPTER_NAME':
      return 'sortByChapterName';
    case 'CHAPTER_ID':
      return 'sortByChapterId';
  }
}

function isForbiddenError(error: unknown): boolean {
  if (!error) return false;
  const message = formatError(error).toLocaleLowerCase();
  return (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('quyền')
  );
}

function getStatusClassName(status: TaskStatus): string {
  if (status === 'BLOCKED') return 'bg-destructive/10 text-destructive';
  if (status === 'READY') return 'bg-primary/10 text-primary';
  if (status === 'IN_PROGRESS') return 'bg-accent text-accent-foreground';
  if (status === 'COMPLETED') return 'bg-secondary text-secondary-foreground';
  return 'bg-muted text-muted-foreground';
}

function TaskStatusBadge({
  status,
  t,
}: {
  readonly status: TaskStatus;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClassName(status)}`}
    >
      {t(translations.management.tasks[getTaskStatusLabelKey(status)])}
    </span>
  );
}

function TaskDeadline({
  dateFormatter,
  task,
  t,
}: {
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly task: TaskListItem;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  if (!task.dueAt) {
    return (
      <span className="text-sm text-muted-foreground">
        {t(translations.management.tasks.noDeadline)}
      </span>
    );
  }

  const dueAt = new Date(task.dueAt);
  if (Number.isNaN(dueAt.getTime())) {
    return (
      <span className="text-sm text-muted-foreground">
        {t(translations.management.tasks.invalidDate)}
      </span>
    );
  }

  const overdue = isTaskOverdue(task);
  return (
    <div className="space-y-1">
      <time
        className={overdue ? 'font-semibold text-destructive' : 'text-sm'}
        dateTime={task.dueAt}
        title={dueAt.toLocaleString()}
      >
        {dateFormatter.format(dueAt)}
      </time>
      {overdue ? (
        <span className="block text-xs font-medium text-destructive">
          {t(translations.management.tasks.overdue)}
        </span>
      ) : null}
    </div>
  );
}

function TaskAssignee({
  task,
  t,
}: {
  readonly task: TaskListItem;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  if (!task.assigneeDiscordUserId) {
    return (
      <span className="text-sm text-muted-foreground">
        {t(translations.management.tasks.noAssignee)}
      </span>
    );
  }

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">
        {task.assigneeDisplayName ?? task.assigneeDiscordUserId}
      </p>
      {task.assigneeDisplayName ? (
        <p className="truncate font-mono text-xs text-muted-foreground">
          {task.assigneeDiscordUserId}
        </p>
      ) : null}
    </div>
  );
}

function TaskTable({
  dateFormatter,
  onDeduct,
  onEdit,
  tasks,
  t,
}: {
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly onDeduct: (task: TaskListItem) => void;
  readonly onEdit: (task: TaskListItem) => void;
  readonly tasks: readonly TaskListItem[];
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <Table className="min-w-[1180px]">
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead>{t(translations.management.tasks.task)}</TableHead>
            <TableHead>{t(translations.management.tasks.story)}</TableHead>
            <TableHead>{t(translations.management.tasks.chapter)}</TableHead>
            <TableHead>{t(translations.management.tasks.stage)}</TableHead>
            <TableHead>{t(translations.management.tasks.assignee)}</TableHead>
            <TableHead>{t(translations.management.tasks.status)}</TableHead>
            <TableHead>{t(translations.management.tasks.deadline)}</TableHead>
            <TableHead className="text-right">
              {t(translations.management.stories.actions)}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-semibold text-primary">
                {t(translations.management.tasks.taskId, { id: task.id })}
              </TableCell>
              <TableCell className="max-w-52 font-medium">
                <span className="block truncate" title={task.storyTitle}>
                  {task.storyTitle}
                </span>
              </TableCell>
              <TableCell className="max-w-44">
                <span className="block truncate" title={task.chapterName}>
                  {task.chapterName}
                </span>
              </TableCell>
              <TableCell>
                <span title={task.stageCode}>{task.stageName}</span>
              </TableCell>
              <TableCell>
                <TaskAssignee task={task} t={t} />
              </TableCell>
              <TableCell>
                <TaskStatusBadge status={task.status} t={t} />
              </TableCell>
              <TableCell>
                <TaskDeadline dateFormatter={dateFormatter} task={task} t={t} />
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <TaskActionButtons
                  isDeductDisabled={task.paymentStatus === 'PAID'}
                  onDeduct={() => onDeduct(task)}
                  onEdit={() => onEdit(task)}
                  viewChapterHref={getChapterDetailPath(
                    task.storyId,
                    task.chapterId,
                  )}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskCardList({
  dateFormatter,
  onDeduct,
  onEdit,
  tasks,
  t,
}: {
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly onDeduct: (task: TaskListItem) => void;
  readonly onEdit: (task: TaskListItem) => void;
  readonly tasks: readonly TaskListItem[];
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="grid gap-3 lg:hidden">
      {tasks.map((task) => (
        <article
          className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"
          key={task.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-primary">
                {t(translations.management.tasks.taskId, { id: task.id })}
              </p>
              <h3
                className="mt-1 truncate font-semibold"
                title={task.storyTitle}
              >
                {task.storyTitle}
              </h3>
              <p
                className="truncate text-sm text-muted-foreground"
                title={task.chapterName}
              >
                {task.chapterName}
              </p>
            </div>
            <TaskStatusBadge status={task.status} t={t} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">
                {t(translations.management.tasks.stage)}
              </dt>
              <dd className="mt-1 truncate font-medium" title={task.stageCode}>
                {task.stageName}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t(translations.management.tasks.deadline)}
              </dt>
              <dd className="mt-1">
                <TaskDeadline dateFormatter={dateFormatter} task={task} t={t} />
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">
                {t(translations.management.tasks.assignee)}
              </dt>
              <dd className="mt-1">
                <TaskAssignee task={task} t={t} />
              </dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-border/60 pt-3">
            <TaskActionButtons
              isDeductDisabled={task.paymentStatus === 'PAID'}
              onDeduct={() => onDeduct(task)}
              onEdit={() => onEdit(task)}
              viewChapterHref={getChapterDetailPath(
                task.storyId,
                task.chapterId,
              )}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function getChapterDetailPath(storyId: string, chapterId: string): string {
  return `/stories/${encodeURIComponent(storyId)}/chapter/${encodeURIComponent(chapterId)}`;
}

function LoadingTaskList({ label }: { readonly label: string }) {
  return (
    <div aria-label={label} className="space-y-3" role="status">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton className="h-16 w-full" key={index} />
      ))}
    </div>
  );
}

export default function TasksPage() {
  const { t, i18n } = useTranslation();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const [view, setView] = useState<TaskListViewState>(() => {
    if (typeof window === 'undefined') return DEFAULT_TASK_LIST_VIEW;
    return readTaskListView(new URLSearchParams(window.location.search));
  });
  const [taskAction, setTaskAction] = useState<{
    readonly mode: TaskActionMode;
    readonly target: TaskActionTarget;
  } | null>(null);
  const { page, sortBy, sortOrder, stageDefinitionId, status, storyId } = view;
  const filterOptionsQuery = useTaskFilterOptionsQuery(workspaceId);
  const taskQuery = useTasksQuery(workspaceId, {
    page,
    pageSize: TASK_PAGE_SIZE,
    stageDefinitionId: stageDefinitionId || undefined,
    sortBy,
    sortOrder,
    status: status === 'ALL' ? undefined : status,
    storyId: storyId || undefined,
  });
  const statusOptions = useMemo<SelectSearchOption[]>(
    () => [
      {
        label: t(translations.management.tasks.allStatuses),
        value: 'ALL',
      },
      ...TASK_STATUS_VALUES.map((taskStatus) => ({
        label: t(
          translations.management.tasks[getTaskStatusLabelKey(taskStatus)],
        ),
        value: taskStatus,
      })),
    ],
    [t],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [i18n.language],
  );
  const storyOptions = useMemo<SelectSearchOption[]>(
    () =>
      (filterOptionsQuery.data?.stories ?? []).map(
        (story: TaskFilterStory) => ({
          value: String(story.id),
          label: story.isArchived
            ? `${story.title} · ${t(translations.management.tasks.archived)}`
            : story.title,
          muted: story.isArchived,
        }),
      ),
    [filterOptionsQuery.data?.stories, t],
  );
  const stageOptions = useMemo<SelectSearchOption[]>(
    () =>
      (filterOptionsQuery.data?.stages ?? []).map((stage: TaskFilterStage) => ({
        value: String(stage.id),
        label: stage.isActive
          ? stage.name
          : `${stage.name} · ${t(translations.management.tasks.inActive)}`,
        muted: !stage.isActive,
      })),
    [filterOptionsQuery.data?.stages, t],
  );
  const selectedStory = useMemo(
    () => storyOptions.find((option) => option.value === storyId) ?? null,
    [storyId, storyOptions],
  );
  const selectedStatus = useMemo(
    () => statusOptions.find((option) => option.value === status) ?? null,
    [status, statusOptions],
  );
  const selectedStage = useMemo(
    () =>
      stageOptions.find((option) => option.value === stageDefinitionId) ??
      null,
    [stageDefinitionId, stageOptions],
  );
  const tasks = taskQuery.data?.items ?? [];
  const hasActiveFilters =
    status !== 'ALL' || storyId.length > 0 || stageDefinitionId.length > 0;
  const hasActiveViewState =
    hasActiveFilters ||
    sortBy !== DEFAULT_TASK_LIST_VIEW.sortBy ||
    sortOrder !== DEFAULT_TASK_LIST_VIEW.sortOrder ||
    page > DEFAULT_TASK_LIST_VIEW.page;
  const hasTaskError = taskQuery.isError || filterOptionsQuery.isError;
  const isForbidden = isForbiddenError(
    taskQuery.error ?? filterOptionsQuery.error,
  );
  const sortLabel = t(
    translations.management.tasks[getTaskSortLabelKey(sortBy)],
  );
  const sortOrderLabel = t(
    sortOrder === 'ASC'
      ? translations.management.tasks.ascending
      : translations.management.tasks.descending,
  );
  const sortDirectionLabel = t(
    translations.management.tasks.sortDirection,
    { direction: sortOrderLabel, field: sortLabel },
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentSearchParams = new URLSearchParams(window.location.search);
    const nextSearch = createTaskListSearchParams(view, currentSearchParams);
    const search = nextSearch.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [view]);

  useEffect(() => {
    const normalizedPage = taskQuery.data?.page;
    if (normalizedPage === undefined || normalizedPage === page) return;

    setView((current) =>
      current.page === page ? { ...current, page: normalizedPage } : current,
    );
  }, [page, taskQuery.data?.page]);

  function updateView(nextView: Partial<TaskListViewState>): void {
    setView((current) => ({ ...current, ...nextView }));
  }

  function resetFilters(): void {
    setView(DEFAULT_TASK_LIST_VIEW);
  }

  function handleStatusChange(option: SelectSearchOption | null): void {
    const nextStatus = option?.value ?? 'ALL';
    if (nextStatus !== 'ALL' && !isTaskStatus(nextStatus)) return;
    updateView({ page: 0, status: nextStatus });
  }

  function handleStoryChange(option: SelectSearchOption | null): void {
    updateView({ page: 0, storyId: option?.value ?? '' });
  }

  function handleStageChange(option: SelectSearchOption | null): void {
    updateView({ page: 0, stageDefinitionId: option?.value ?? '' });
  }

  function handleSortByChange(value: string): void {
    if (!isTaskSortBy(value)) return;
    updateView({ page: 0, sortBy: value });
  }

  function toggleSortOrder(): void {
    const nextSortOrder: TaskSortOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
    updateView({ page: 0, sortOrder: nextSortOrder });
  }

  function retryQueries(): void {
    void Promise.all([taskQuery.refetch(), filterOptionsQuery.refetch()]);
  }

  function openTaskAction(mode: TaskActionMode, task: TaskListItem): void {
    setTaskAction({ mode, target: toTaskActionTarget(task) });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {t(translations.management.eyebrow)}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t(translations.navigation.tasks)}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t(translations.management.tasks.description)}
          </p>
        </div>
        <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm">
          <span className="block text-xs text-muted-foreground">
            {t(translations.management.tasks.status)}
          </span>
          <strong className="text-lg text-primary">
            {t(translations.management.tasks.taskCount, {
              count: taskQuery.data?.total ?? 0,
            })}
          </strong>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1.3fr_1.3fr_1.2fr_auto_auto] xl:items-end">
          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            {t(translations.management.tasks.filterStatus)}
            <SelectSearch
              noOptionsText={t(
                translations.management.tasks.noMatchingOptions,
              )}
              onChange={handleStatusChange}
              options={statusOptions}
              placeholder={t(translations.management.tasks.allStatuses)}
              searchPlaceholder={t(
                translations.management.tasks.searchStatuses,
              )}
              value={selectedStatus}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            {t(translations.management.tasks.filterStory)}
            <SelectSearch
              disabled={!workspaceId || filterOptionsQuery.isLoading}
              noOptionsText={t(
                translations.management.tasks.noMatchingOptions,
              )}
              onChange={handleStoryChange}
              options={storyOptions}
              placeholder={t(translations.management.tasks.allStories)}
              searchPlaceholder={t(translations.management.tasks.searchStories)}
              value={selectedStory}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            {t(translations.management.tasks.filterStage)}
            <SelectSearch
              disabled={!workspaceId || filterOptionsQuery.isLoading}
              noOptionsText={t(
                translations.management.tasks.noMatchingOptions,
              )}
              onChange={handleStageChange}
              options={stageOptions}
              placeholder={t(translations.management.tasks.allStages)}
              searchPlaceholder={t(translations.management.tasks.searchStages)}
              value={selectedStage}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            {t(translations.management.tasks.sortBy)}
            <Select onValueChange={handleSortByChange} value={sortBy}>
              <SelectTrigger
                aria-label={t(translations.management.tasks.sortBy)}
                className="w-full bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_SORT_BY_VALUES.map((sortValue: TaskSortBy) => (
                  <SelectItem key={sortValue} value={sortValue}>
                    {t(
                      translations.management.tasks[
                        getTaskSortLabelKey(sortValue)
                      ],
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <Button
            aria-label={sortDirectionLabel}
            className="justify-start bg-card sm:justify-center"
            onClick={toggleSortOrder}
            title={sortDirectionLabel}
            type="button"
            variant="outline"
          >
            {sortOrder === 'ASC' ? (
              <ArrowUp aria-hidden="true" />
            ) : (
              <ArrowDown aria-hidden="true" />
            )}
            <span className="hidden xl:inline">
              {t(
                sortOrder === 'ASC'
                  ? translations.management.tasks.ascending
                  : translations.management.tasks.descending,
              )}
            </span>
          </Button>

          <Button
            className="justify-start sm:justify-center"
            disabled={!hasActiveViewState}
            onClick={resetFilters}
            type="button"
            variant="ghost"
          >
            {t(translations.management.tasks.clearFilters)}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle>{t(translations.navigation.tasks)}</CardTitle>
          <CardDescription>
            {t(translations.management.tasks.description)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0" aria-busy={taskQuery.isFetching}>
          {!workspaceId ? (
            <Empty className="min-h-72 rounded-none border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldOff />
                </EmptyMedia>
                <EmptyTitle>
                  {t(translations.management.tasks.noWorkspace)}
                </EmptyTitle>
                <EmptyDescription>
                  {t(translations.management.tasks.noWorkspaceDescription)}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : hasTaskError ? (
            <Empty className="min-h-72 rounded-none border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  {isForbidden ? <ShieldOff /> : <ListTodo />}
                </EmptyMedia>
                <EmptyTitle>
                  {isForbidden
                    ? t(translations.management.tasks.forbidden)
                    : t(translations.management.tasks.error)}
                </EmptyTitle>
                <EmptyDescription>
                  {isForbidden
                    ? t(translations.management.tasks.forbidden)
                    : formatError(taskQuery.error ?? filterOptionsQuery.error)}
                </EmptyDescription>
              </EmptyHeader>
              {!isForbidden ? (
                <Button onClick={retryQueries} variant="outline">
                  {t(translations.management.tasks.retry)}
                </Button>
              ) : null}
            </Empty>
          ) : taskQuery.isLoading ? (
            <div className="p-5">
              <LoadingTaskList
                label={t(translations.management.tasks.loading)}
              />
            </div>
          ) : tasks.length === 0 ? (
            <Empty className="min-h-72 rounded-none border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  {hasActiveFilters ? <SearchX /> : <ListTodo />}
                </EmptyMedia>
                <EmptyTitle>
                  {t(
                    hasActiveFilters
                      ? translations.management.tasks.emptyFiltered
                      : translations.management.tasks.empty,
                  )}
                </EmptyTitle>
                <EmptyDescription>
                  {t(
                    hasActiveFilters
                      ? translations.management.tasks.emptyFilteredDescription
                      : translations.management.tasks.emptyDescription,
                  )}
                </EmptyDescription>
              </EmptyHeader>
              {hasActiveFilters ? (
                <Button onClick={resetFilters} variant="outline">
                  {t(translations.management.tasks.clearFilters)}
                </Button>
              ) : null}
            </Empty>
          ) : (
            <>
              <TaskTable
                dateFormatter={dateFormatter}
                onDeduct={(task) => openTaskAction('deduct', task)}
                onEdit={(task) => openTaskAction('edit', task)}
                tasks={tasks}
                t={t}
              />
              <TaskCardList
                dateFormatter={dateFormatter}
                onDeduct={(task) => openTaskAction('deduct', task)}
                onEdit={(task) => openTaskAction('edit', task)}
                tasks={tasks}
                t={t}
              />
              <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <span className="text-muted-foreground">
                  {t(translations.management.tasks.pageSummary, {
                    count: taskQuery.data?.total ?? 0,
                    current: (taskQuery.data?.page ?? page) + 1,
                    total: taskQuery.data?.pageCount ?? 1,
                  })}
                </span>
                <div className="flex gap-2">
                  <Button
                    aria-label={t(translations.management.tasks.previousPage)}
                    disabled={page <= 0 || taskQuery.isFetching}
                    onClick={() =>
                      updateView({ page: Math.max(0, page - 1) })
                    }
                    size="sm"
                    variant="outline"
                  >
                    {t(translations.management.tasks.previousPage)}
                  </Button>
                  <Button
                    aria-label={t(translations.management.tasks.nextPage)}
                    disabled={
                      taskQuery.isFetching ||
                      page + 1 >= (taskQuery.data?.pageCount ?? 1)
                    }
                    onClick={() => updateView({ page: page + 1 })}
                    size="sm"
                  >
                    {t(translations.management.tasks.nextPage)}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <TaskActionDialogs
        mode={taskAction?.mode ?? null}
        onOpenChange={(open) => {
          if (!open) setTaskAction(null);
        }}
        target={taskAction?.target ?? null}
        workspaceId={workspaceId}
      />
    </section>
  );
}
