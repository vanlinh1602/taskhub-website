import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CircleMinus,
  ListTodo,
  SearchX,
  Settings2,
  ShieldOff,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMembersQuery } from '@/features/members/hooks';
import {
  default as TaskActionDialogs,
  type TaskActionMode,
} from '@/features/tasks/components/task-action-dialogs';
import TaskBulkActionBar from '@/features/tasks/components/task-bulk-action-bar';
import TaskBulkActionDialog from '@/features/tasks/components/task-bulk-action-dialog';
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
  canCompleteTask,
  createTaskListSearchParams,
  DEFAULT_TASK_LIST_VIEW,
  getTaskStatusLabelKey,
  isTaskOverdue,
  isTaskSortBy,
  readTaskListView,
  TASK_SORT_BY_VALUES,
  TASK_STATUS_VALUES,
  type TaskBulkMode,
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
  if (status === 'READY') return 'bg-primary/10 text-link';
  if (status === 'IN_PROGRESS') return 'bg-accent text-accent-foreground';
  if (status === 'COMPLETED') return 'bg-secondary text-secondary-foreground';
  return 'bg-muted text-muted-foreground';
}

function TaskStatusBadge({
  alignment = 'start',
  completedAt,
  dateFormatter,
  status,
  t,
}: {
  readonly alignment?: 'center' | 'end' | 'start';
  readonly completedAt?: string | null;
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly status: TaskStatus;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const completedDate =
    status === 'COMPLETED' && completedAt ? new Date(completedAt) : null;
  const isValidCompletedDate =
    completedDate !== null && !Number.isNaN(completedDate.getTime());
  const completedAtLabel = t(translations.management.tasks.completedAt);

  return (
    <div
      className={`flex flex-col gap-1 ${alignment === 'center' ? 'items-center text-center' : alignment === 'end' ? 'items-end text-right' : 'items-start text-left'}`}
    >
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusClassName(status)}`}
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
        {t(translations.management.tasks[getTaskStatusLabelKey(status)])}
      </span>
      {isValidCompletedDate && completedDate ? (
        <time
          aria-label={`${completedAtLabel}: ${dateFormatter.format(completedDate)}`}
          className="text-xs leading-4 whitespace-nowrap text-muted-foreground"
          dateTime={completedDate.toISOString()}
          title={`${completedAtLabel}: ${dateFormatter.format(completedDate)}`}
        >
          {dateFormatter.format(completedDate)}
        </time>
      ) : null}
    </div>
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
    <div className="space-y-0.5">
      <time
        className={
          overdue
            ? 'font-medium whitespace-nowrap text-destructive'
            : 'text-sm whitespace-nowrap'
        }
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '–';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toLocaleUpperCase();
}

function AssigneeAvatar({
  avatarUrl,
  name,
}: {
  readonly avatarUrl?: string | null;
  readonly name: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (avatarUrl && failedUrl !== avatarUrl) {
    return (
      <img
        alt=""
        className="size-7 shrink-0 rounded-full object-cover"
        loading="lazy"
        onError={() => setFailedUrl(avatarUrl)}
        referrerPolicy="no-referrer"
        src={avatarUrl}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold"
    >
      {getInitials(name)}
    </span>
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
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
        >
          –
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {t(translations.management.tasks.noAssignee)}
        </span>
      </div>
    );
  }

  const name = task.assigneeDisplayName ?? task.assigneeDiscordUserId;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <AssigneeAvatar avatarUrl={task.assigneeAvatarUrl} name={name} />
      <span className="truncate text-sm" title={name}>
        {name}
      </span>
    </div>
  );
}

function ActionTooltip({
  children,
  enabled,
  label,
}: {
  readonly children: ReactNode;
  readonly enabled: boolean;
  readonly label: string;
}) {
  if (!enabled) return <>{children}</>;

  return (
    <Tooltip>
      {/* The span keeps the tooltip working while the button is disabled. */}
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function TaskRowActions({
  fullWidth = false,
  onComplete,
  onDeduct,
  onEdit,
  task,
  t,
}: {
  readonly fullWidth?: boolean;
  readonly onComplete: (task: TaskListItem) => void;
  readonly onDeduct: (task: TaskListItem) => void;
  readonly onEdit: (task: TaskListItem) => void;
  readonly task: TaskListItem;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const editLabel = t(translations.management.stories.editTask);
  const deductLabel = t(translations.management.stories.deductMoney);
  const completeLabel = t(translations.management.stories.completeTask);
  const showTooltips = !fullWidth;

  return (
    <div
      className={`flex items-center gap-1 ${fullWidth ? 'w-full gap-2' : 'justify-end'}`}
    >
      <ActionTooltip enabled={showTooltips} label={completeLabel}>
        <Button
          aria-label={completeLabel}
          className={
            fullWidth ? 'h-11 flex-1' : 'text-link hover:bg-primary/15'
          }
          disabled={!canCompleteTask(task)}
          onClick={() => onComplete(task)}
          size={fullWidth ? 'default' : 'icon-sm'}
          type="button"
          variant={fullWidth ? 'default' : 'ghost'}
        >
          <CheckCircle2 aria-hidden="true" />
          {fullWidth ? t(translations.management.tasks.completed) : null}
        </Button>
      </ActionTooltip>
      <ActionTooltip enabled={showTooltips} label={editLabel}>
        <Button
          aria-label={editLabel}
          className={fullWidth ? 'size-11' : ''}
          onClick={() => onEdit(task)}
          size={fullWidth ? 'icon' : 'icon-sm'}
          title={fullWidth ? editLabel : undefined}
          type="button"
          variant={fullWidth ? 'outline' : 'ghost'}
        >
          <Settings2 aria-hidden="true" />
        </Button>
      </ActionTooltip>
      <ActionTooltip enabled={showTooltips} label={deductLabel}>
        <Button
          aria-label={deductLabel}
          className={`text-destructive hover:bg-destructive/10 hover:text-destructive ${fullWidth ? 'size-11' : ''}`}
          disabled={task.paymentStatus === 'PAID'}
          onClick={() => onDeduct(task)}
          size={fullWidth ? 'icon' : 'icon-sm'}
          title={fullWidth ? deductLabel : undefined}
          type="button"
          variant={fullWidth ? 'outline' : 'ghost'}
        >
          <CircleMinus aria-hidden="true" />
        </Button>
      </ActionTooltip>
    </div>
  );
}

const chapterLinkClassName =
  'block truncate text-sm text-link underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none';

function TaskTable({
  allSelectedState,
  completionDateFormatter,
  dateFormatter,
  onComplete,
  onDeduct,
  onEdit,
  onToggleAll,
  onToggleTask,
  selectedIds,
  tasks,
  t,
}: {
  readonly allSelectedState: boolean | 'indeterminate';
  readonly onToggleAll: () => void;
  readonly onToggleTask: (index: number, shiftKey: boolean) => void;
  readonly selectedIds: ReadonlySet<string>;
  readonly completionDateFormatter: Intl.DateTimeFormat;
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly onComplete: (task: TaskListItem) => void;
  readonly onDeduct: (task: TaskListItem) => void;
  readonly onEdit: (task: TaskListItem) => void;
  readonly tasks: readonly TaskListItem[];
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const headClassName =
    'h-11 px-3 text-xs font-bold tracking-wider text-muted-foreground uppercase';
  return (
    <TooltipProvider delayDuration={150}>
      <div className="hidden overflow-x-auto lg:block">
        <Table className="min-w-[56rem] table-fixed">
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="h-11 w-12 pr-0 pl-5">
                <Checkbox
                  aria-label={t(translations.management.tasks.bulkSelectAll)}
                  checked={allSelectedState}
                  onCheckedChange={onToggleAll}
                />
              </TableHead>
              <TableHead className={`${headClassName} w-[38%] pl-3`}>
                {t(translations.management.tasks.task)}
              </TableHead>
              <TableHead className={`${headClassName} w-44`}>
                {t(translations.management.tasks.assignee)}
              </TableHead>
              <TableHead className={`${headClassName} w-40`}>
                {t(translations.management.tasks.deadline)}
              </TableHead>
              <TableHead className={`${headClassName} w-36`}>
                {t(translations.management.tasks.status)}
              </TableHead>
              <TableHead className={`${headClassName} w-32 pr-5 text-right`}>
                {t(translations.management.stories.actions)}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task, index) => (
              <TableRow
                className={`cursor-pointer border-border/50 hover:bg-muted/30 data-[state=selected]:bg-primary/10 ${isTaskOverdue(task) ? 'shadow-[inset_3px_0_0_var(--destructive)]' : ''}`}
                data-state={selectedIds.has(task.id) ? 'selected' : undefined}
                key={task.id}
                onClick={(event) => {
                  if (
                    (event.target as HTMLElement).closest(
                      'a, button, input, [role="menuitem"]',
                    )
                  )
                    return;
                  onToggleTask(index, event.shiftKey);
                }}
              >
                <TableCell className="w-12 py-2.5 pr-0 pl-5">
                  <Checkbox
                    aria-label={t(
                      translations.management.tasks.bulkSelectTask,
                      {
                        id: task.id,
                      },
                    )}
                    checked={selectedIds.has(task.id)}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleTask(index, event.shiftKey);
                    }}
                  />
                </TableCell>
                <TableCell className="py-2.5 pr-3 pl-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        #{task.id}
                      </span>
                      <Link
                        className={`${chapterLinkClassName} text-[15px] font-bold`}
                        title={task.chapterName}
                        to={getChapterStoryPath(task.storyId, task.chapterName)}
                      >
                        {task.chapterName}
                      </Link>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="truncate text-sm text-muted-foreground"
                        title={task.storyTitle}
                      >
                        {task.storyTitle}
                      </span>
                      <span
                        className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
                        title={task.stageCode}
                      >
                        {task.stageName}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <TaskAssignee task={task} t={t} />
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <TaskDeadline
                    dateFormatter={dateFormatter}
                    task={task}
                    t={t}
                  />
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <TaskStatusBadge
                    completedAt={task.completedAt}
                    dateFormatter={completionDateFormatter}
                    status={task.status}
                    t={t}
                  />
                </TableCell>
                <TableCell className="py-2.5 pr-5 pl-3">
                  <TaskRowActions
                    onComplete={onComplete}
                    onDeduct={onDeduct}
                    onEdit={onEdit}
                    t={t}
                    task={task}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

function TaskCardList({
  allSelectedState,
  completionDateFormatter,
  dateFormatter,
  onComplete,
  onDeduct,
  onEdit,
  onToggleAll,
  onToggleTask,
  selectedIds,
  tasks,
  t,
}: {
  readonly allSelectedState: boolean | 'indeterminate';
  readonly onToggleAll: () => void;
  readonly onToggleTask: (index: number, shiftKey: boolean) => void;
  readonly selectedIds: ReadonlySet<string>;
  readonly completionDateFormatter: Intl.DateTimeFormat;
  readonly dateFormatter: Intl.DateTimeFormat;
  readonly onComplete: (task: TaskListItem) => void;
  readonly onDeduct: (task: TaskListItem) => void;
  readonly onEdit: (task: TaskListItem) => void;
  readonly tasks: readonly TaskListItem[];
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="grid gap-3 p-3 lg:hidden">
      <label className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
        <Checkbox
          aria-label={t(translations.management.tasks.bulkSelectAll)}
          checked={allSelectedState}
          onCheckedChange={onToggleAll}
        />
        {t(translations.management.tasks.bulkSelectAll)}
      </label>
      {tasks.map((task, index) => (
        <article
          className={`flex flex-col gap-3 rounded-2xl border bg-card p-4 ${selectedIds.has(task.id) ? 'border-primary ring-1 ring-primary/40' : 'border-border/70'}`}
          key={task.id}
        >
          <div className="flex items-start justify-between gap-3">
            <Checkbox
              aria-label={t(translations.management.tasks.bulkSelectTask, {
                id: task.id,
              })}
              checked={selectedIds.has(task.id)}
              className="mt-1"
              onClick={(event) => onToggleTask(index, event.shiftKey)}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="font-mono text-xs text-muted-foreground">
                #{task.id} · {task.stageName}
              </p>
              <Link
                className={`${chapterLinkClassName} font-bold`}
                title={task.chapterName}
                to={getChapterStoryPath(task.storyId, task.chapterName)}
              >
                {task.chapterName}
              </Link>
              <p
                className="truncate text-sm text-muted-foreground"
                title={task.storyTitle}
              >
                {task.storyTitle}
              </p>
            </div>
            <TaskStatusBadge
              alignment="end"
              completedAt={task.completedAt}
              dateFormatter={completionDateFormatter}
              status={task.status}
              t={t}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
            <div className="min-w-0">
              <TaskAssignee task={task} t={t} />
            </div>
            <div className="shrink-0 text-right">
              <TaskDeadline dateFormatter={dateFormatter} task={task} t={t} />
            </div>
          </div>
          <TaskRowActions
            fullWidth
            onComplete={onComplete}
            onDeduct={onDeduct}
            onEdit={onEdit}
            t={t}
            task={task}
          />
        </article>
      ))}
    </div>
  );
}

function getChapterStoryPath(storyId: string, chapterName: string): string {
  const query = new URLSearchParams({ q: chapterName });
  return `/stories/${encodeURIComponent(storyId)}?${query.toString()}`;
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
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [bulkMode, setBulkMode] = useState<TaskBulkMode | null>(null);
  const lastToggledIndex = useRef<number | null>(null);
  const {
    assigneeDiscordUserId,
    page,
    sortBy,
    sortOrder,
    stageDefinitionId,
    status,
    storyId,
  } = view;
  const membersQuery = useMembersQuery(workspaceId);
  const filterOptionsQuery = useTaskFilterOptionsQuery(workspaceId);
  const taskQuery = useTasksQuery(workspaceId, {
    assigneeDiscordUserId: assigneeDiscordUserId || undefined,
    page,
    pageSize: TASK_PAGE_SIZE,
    stageDefinitionId: stageDefinitionId || undefined,
    sortBy,
    sortOrder,
    status: status === 'ALL' ? undefined : status,
    storyId: storyId || undefined,
  });
  const statusTabs = useMemo<
    readonly {
      readonly label: string;
      readonly value: TaskListViewState['status'];
    }[]
  >(
    () => [
      { label: t(translations.management.tasks.allStatuses), value: 'ALL' },
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
  const completionDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'short',
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
  const assigneeOptions = useMemo<SelectSearchOption[]>(
    () =>
      (membersQuery.data ?? []).map((member) => ({
        value: member.discordUserId,
        label: member.displayName,
        muted: member.status !== 'ACTIVE',
      })),
    [membersQuery.data],
  );
  const selectedAssignee = useMemo(
    () =>
      assigneeOptions.find(
        (option) => option.value === assigneeDiscordUserId,
      ) ??
      (assigneeDiscordUserId
        ? { value: assigneeDiscordUserId, label: assigneeDiscordUserId }
        : null),
    [assigneeDiscordUserId, assigneeOptions],
  );
  const selectedStory = useMemo(
    () => storyOptions.find((option) => option.value === storyId) ?? null,
    [storyId, storyOptions],
  );
  const selectedStage = useMemo(
    () =>
      stageOptions.find((option) => option.value === stageDefinitionId) ?? null,
    [stageDefinitionId, stageOptions],
  );
  const tasks = useMemo(
    () => taskQuery.data?.items ?? [],
    [taskQuery.data?.items],
  );
  const selectedTasks = useMemo(
    () => tasks.filter((task) => selectedIds.has(task.id)),
    [selectedIds, tasks],
  );
  const allSelectedState: boolean | 'indeterminate' =
    tasks.length > 0 && selectedTasks.length === tasks.length
      ? true
      : selectedTasks.length > 0
        ? 'indeterminate'
        : false;
  const hasActiveFilters =
    status !== 'ALL' ||
    storyId.length > 0 ||
    stageDefinitionId.length > 0 ||
    assigneeDiscordUserId.length > 0;
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
  const sortDirectionLabel = t(translations.management.tasks.sortDirection, {
    direction: sortOrderLabel,
    field: sortLabel,
  });

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
    lastToggledIndex.current = null;
    setSelectedIds(new Set());
  }, [view, workspaceId]);

  useEffect(() => {
    const normalizedPage = taskQuery.data?.page;
    if (normalizedPage === undefined || normalizedPage === page) return;

    setView((current) =>
      current.page === page ? { ...current, page: normalizedPage } : current,
    );
  }, [page, taskQuery.data?.page]);

  function clearSelection(): void {
    lastToggledIndex.current = null;
    setSelectedIds(new Set());
  }

  function toggleAllTasks(): void {
    lastToggledIndex.current = null;
    setSelectedIds(
      allSelectedState === true
        ? new Set()
        : new Set(tasks.map((task) => task.id)),
    );
  }

  function toggleTask(index: number, shiftKey: boolean): void {
    const anchor = lastToggledIndex.current;
    const task = tasks[index];
    if (!task) return;
    const shouldSelect = !selectedIds.has(task.id);
    const range =
      shiftKey && anchor !== null
        ? tasks.slice(Math.min(anchor, index), Math.max(anchor, index) + 1)
        : [task];
    lastToggledIndex.current = index;
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const item of range) {
        if (shouldSelect) next.add(item.id);
        else next.delete(item.id);
      }
      return next;
    });
  }

  function finishBulkAction(failedTaskIds: readonly string[]): void {
    lastToggledIndex.current = null;
    setSelectedIds(new Set(failedTaskIds));
  }

  function updateView(nextView: Partial<TaskListViewState>): void {
    setView((current) => ({ ...current, ...nextView }));
  }

  function resetFilters(): void {
    setView(DEFAULT_TASK_LIST_VIEW);
  }

  function handleStoryChange(option: SelectSearchOption | null): void {
    updateView({ page: 0, storyId: option?.value ?? '' });
  }

  function handleStageChange(option: SelectSearchOption | null): void {
    updateView({ page: 0, stageDefinitionId: option?.value ?? '' });
  }

  function handleAssigneeChange(option: SelectSearchOption | null): void {
    updateView({ page: 0, assigneeDiscordUserId: option?.value ?? '' });
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
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight">
            {t(translations.navigation.tasks)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(translations.management.tasks.taskCount, {
              count: taskQuery.data?.total ?? 0,
            })}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div
          aria-label={t(translations.management.tasks.filterStatus)}
          className="flex gap-1 overflow-x-auto border-b border-border/60 px-3 pt-2"
          role="group"
        >
          {statusTabs.map((tab) => (
            <button
              aria-pressed={status === tab.value}
              className={`relative shrink-0 px-3 py-2.5 text-sm font-semibold transition-colors outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring/50 ${status === tab.value ? 'text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary' : 'text-muted-foreground hover:text-foreground'}`}
              key={tab.value}
              onClick={() => updateView({ page: 0, status: tab.value })}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {selectedTasks.length > 0 ? (
          <TaskBulkActionBar
            onAction={setBulkMode}
            onClear={clearSelection}
            selectedCount={selectedTasks.length}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/20 px-3 py-2.5">
            <div className="w-full sm:w-56">
              <SelectSearch
                aria-label={t(translations.management.tasks.filterStory)}
                disabled={!workspaceId || filterOptionsQuery.isLoading}
                noOptionsText={t(
                  translations.management.tasks.noMatchingOptions,
                )}
                onChange={handleStoryChange}
                options={storyOptions}
                placeholder={t(translations.management.tasks.allStories)}
                searchPlaceholder={t(
                  translations.management.tasks.searchStories,
                )}
                value={selectedStory}
              />
            </div>
            <div className="w-full sm:w-48">
              <SelectSearch
                aria-label={t(translations.management.tasks.filterStage)}
                disabled={!workspaceId || filterOptionsQuery.isLoading}
                noOptionsText={t(
                  translations.management.tasks.noMatchingOptions,
                )}
                onChange={handleStageChange}
                options={stageOptions}
                placeholder={t(translations.management.tasks.allStages)}
                searchPlaceholder={t(
                  translations.management.tasks.searchStages,
                )}
                value={selectedStage}
              />
            </div>
            <div className="w-full sm:w-52">
              <SelectSearch
                aria-label={t(translations.management.tasks.filterAssignee)}
                disabled={!workspaceId || membersQuery.isLoading}
                noOptionsText={t(
                  translations.management.tasks.noMatchingOptions,
                )}
                onChange={handleAssigneeChange}
                options={assigneeOptions}
                placeholder={t(translations.management.tasks.allAssignees)}
                searchPlaceholder={t(
                  translations.management.tasks.searchAssignees,
                )}
                value={selectedAssignee}
              />
            </div>
            <div className="flex items-center gap-1.5 sm:ml-auto">
              <Select onValueChange={handleSortByChange} value={sortBy}>
                <SelectTrigger
                  aria-label={t(translations.management.tasks.sortBy)}
                  className="w-40 bg-card"
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
              <Button
                aria-label={sortDirectionLabel}
                className="bg-card"
                onClick={toggleSortOrder}
                size="icon"
                title={sortDirectionLabel}
                type="button"
                variant="outline"
              >
                {sortOrder === 'ASC' ? (
                  <ArrowUp aria-hidden="true" />
                ) : (
                  <ArrowDown aria-hidden="true" />
                )}
              </Button>
              {hasActiveViewState ? (
                <Button
                  className="text-link"
                  onClick={resetFilters}
                  type="button"
                  variant="ghost"
                >
                  {t(translations.management.tasks.clearFilters)}
                </Button>
              ) : null}
            </div>
          </div>
        )}

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
                allSelectedState={allSelectedState}
                completionDateFormatter={completionDateFormatter}
                dateFormatter={dateFormatter}
                onComplete={(task) => openTaskAction('complete', task)}
                onDeduct={(task) => openTaskAction('deduct', task)}
                onEdit={(task) => openTaskAction('edit', task)}
                onToggleAll={toggleAllTasks}
                onToggleTask={toggleTask}
                selectedIds={selectedIds}
                tasks={tasks}
                t={t}
              />
              <TaskCardList
                allSelectedState={allSelectedState}
                completionDateFormatter={completionDateFormatter}
                dateFormatter={dateFormatter}
                onComplete={(task) => openTaskAction('complete', task)}
                onDeduct={(task) => openTaskAction('deduct', task)}
                onEdit={(task) => openTaskAction('edit', task)}
                onToggleAll={toggleAllTasks}
                onToggleTask={toggleTask}
                selectedIds={selectedIds}
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
                    onClick={() => updateView({ page: Math.max(0, page - 1) })}
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
      <TaskBulkActionDialog
        mode={bulkMode}
        onFinished={finishBulkAction}
        onOpenChange={(open) => {
          if (!open) setBulkMode(null);
        }}
        tasks={selectedTasks}
        workspaceId={workspaceId}
      />
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
