import { ArrowDown, ArrowUp, ListTodo, SearchX, ShieldOff } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import {
  useTaskFilterOptionsQuery,
  useTasksQuery,
} from '@/features/tasks/hooks';
import type {
  TaskDueAtOrder,
  TaskFilterStage,
  TaskFilterStory,
  TaskListItem,
  TaskStatus,
} from '@/features/tasks/types';
import {
  getTaskStatusLabelKey,
  isTaskOverdue,
} from '@/features/tasks/utils';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const TASK_PAGE_SIZE = 25;
const TASK_STATUSES: readonly TaskStatus[] = [
  'BLOCKED',
  'READY',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

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
  tasks,
  t,
}: {
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly tasks: readonly TaskListItem[];
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <Table className="min-w-[960px]">
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead>{t(translations.management.tasks.task)}</TableHead>
            <TableHead>{t(translations.management.tasks.story)}</TableHead>
            <TableHead>{t(translations.management.tasks.chapter)}</TableHead>
            <TableHead>{t(translations.management.tasks.stage)}</TableHead>
            <TableHead>{t(translations.management.tasks.assignee)}</TableHead>
            <TableHead>{t(translations.management.tasks.status)}</TableHead>
            <TableHead>{t(translations.management.tasks.deadline)}</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskCardList({
  dateFormatter,
  tasks,
  t,
}: {
  readonly dateFormatter: Intl.DateTimeFormat;
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
        </article>
      ))}
    </div>
  );
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
  const [status, setStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [storyId, setStoryId] = useState('');
  const [stageDefinitionId, setStageDefinitionId] = useState('');
  const [dueAtOrder, setDueAtOrder] = useState<TaskDueAtOrder>('ASC');
  const [page, setPage] = useState(0);
  const filterOptionsQuery = useTaskFilterOptionsQuery(workspaceId);
  const taskQuery = useTasksQuery(workspaceId, {
    dueAtOrder,
    page,
    pageSize: TASK_PAGE_SIZE,
    stageDefinitionId: stageDefinitionId || undefined,
    status: status === 'ALL' ? undefined : status,
    storyId: storyId || undefined,
  });
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
  const selectedStage = useMemo(
    () =>
      stageOptions.find((option) => option.value === stageDefinitionId) ??
      null,
    [stageDefinitionId, stageOptions],
  );
  const tasks = taskQuery.data?.items ?? [];
  const hasActiveFilters =
    status !== 'ALL' || storyId.length > 0 || stageDefinitionId.length > 0;
  const hasTaskError = taskQuery.isError || filterOptionsQuery.isError;
  const isForbidden = isForbiddenError(
    taskQuery.error ?? filterOptionsQuery.error,
  );

  function resetFilters(): void {
    setStatus('ALL');
    setStoryId('');
    setStageDefinitionId('');
    setDueAtOrder('ASC');
    setPage(0);
  }

  function handleStatusChange(value: string): void {
    setStatus(value as TaskStatus | 'ALL');
    setPage(0);
  }

  function handleStoryChange(option: SelectSearchOption | null): void {
    setStoryId(option?.value ?? '');
    setPage(0);
  }

  function handleStageChange(option: SelectSearchOption | null): void {
    setStageDefinitionId(option?.value ?? '');
    setPage(0);
  }

  function toggleDueAtOrder(): void {
    setDueAtOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
    setPage(0);
  }

  function retryQueries(): void {
    void Promise.all([taskQuery.refetch(), filterOptionsQuery.refetch()]);
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1.3fr_1.3fr_auto_auto] xl:items-end">
          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            {t(translations.management.tasks.filterStatus)}
            <Select onValueChange={handleStatusChange} value={status}>
              <SelectTrigger
                aria-label={t(translations.management.tasks.filterStatus)}
                className="w-full bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t(translations.management.tasks.allStatuses)}
                </SelectItem>
                {TASK_STATUSES.map((taskStatus) => (
                  <SelectItem key={taskStatus} value={taskStatus}>
                    {t(
                      translations.management.tasks[
                        getTaskStatusLabelKey(taskStatus)
                      ],
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              value={selectedStage}
            />
          </label>

          <Button
            aria-label={t(
              dueAtOrder === 'ASC'
                ? translations.management.tasks.deadlineAscending
                : translations.management.tasks.deadlineDescending,
            )}
            className="justify-start bg-card sm:justify-center"
            onClick={toggleDueAtOrder}
            title={t(
              dueAtOrder === 'ASC'
                ? translations.management.tasks.deadlineAscending
                : translations.management.tasks.deadlineDescending,
            )}
            type="button"
            variant="outline"
          >
            {dueAtOrder === 'ASC' ? (
              <ArrowUp aria-hidden="true" />
            ) : (
              <ArrowDown aria-hidden="true" />
            )}
            <span className="hidden xl:inline">
              {t(translations.management.tasks.deadline)}
            </span>
          </Button>

          <Button
            className="justify-start sm:justify-center"
            disabled={!hasActiveFilters}
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
              <TaskTable dateFormatter={dateFormatter} tasks={tasks} t={t} />
              <TaskCardList dateFormatter={dateFormatter} tasks={tasks} t={t} />
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
                      setPage((current) => Math.max(0, current - 1))
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
                    onClick={() => setPage((current) => current + 1)}
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
    </section>
  );
}
