import { endOfMonth, format, startOfMonth } from 'date-fns';
import {
  Calculator,
  CalendarClock,
  CheckCircle2,
  Circle,
  CreditCard,
  ExternalLink,
  FileSpreadsheet,
  RotateCcw,
  ShieldOff,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react';
import { memo, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Label } from '@/components/ui/label';
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
import { useWorkspacesQuery } from '@/features/admin/hooks';
import ChapterPublicationDialog from '@/features/chapters/components/ChapterPublicationDialog';
import { useUpdateChapterPublicationMutation } from '@/features/chapters/hooks';
import { StatisticsDateRangePicker } from '@/features/statistics/components';
import {
  StateChip,
  StatusMark,
  TaskStatusChip,
} from '@/features/statistics/components/StateChip';
import {
  type SelectedTask,
  TaskDetail,
} from '@/features/statistics/components/TaskDetail';
import {
  useExportStatisticsMutation,
  useStatisticsFiltersQuery,
  useStatisticsQuery,
  useStatisticsSummaryQuery,
} from '@/features/statistics/hooks';
import type {
  StatisticsChapterRow,
  StatisticsFilters,
  StatisticsPaymentStatus,
  StatisticsStageColumn,
  StatisticsSummaryResult,
  StatisticsTaskCell,
  StatisticsTaskStatus,
} from '@/features/statistics/types';
import { paymentLabel, statusLabel } from '@/features/statistics/utils/labels';
import { toTaskActionTarget } from '@/features/statistics/utils/task-action-target';
import {
  default as TaskActionDialogs,
  type TaskActionMode,
} from '@/features/tasks/components/task-action-dialogs';
import type { TaskActionTarget } from '@/features/tasks/types';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';
import { formatMoney } from '@/utils/money';

const UNASSIGNED = '__UNASSIGNED__';
const TASK_STATUSES: readonly StatisticsTaskStatus[] = [
  'BLOCKED',
  'READY',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];
const PAYMENT_STATUSES: readonly StatisticsPaymentStatus[] = [
  'NOT_READY',
  'PENDING',
  'PAID',
];

interface SelectedTaskReference {
  readonly taskId: string;
  readonly storyId: string;
  readonly chapterId: string;
  readonly stageDefinitionId: string;
}

function getToday(timezone: string | undefined): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone || 'Asia/Ho_Chi_Minh',
    year: 'numeric',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day));
}

function makeDefaultFilters(timezone: string | undefined): StatisticsFilters {
  const today = getToday(timezone);
  return {
    from: format(startOfMonth(today), 'yyyy-MM-dd'),
    to: format(endOfMonth(today), 'yyyy-MM-dd'),
    dateBasis: 'CREATED',
    storyId: '',
    assigneeDiscordUserId: '',
    workflowTemplateId: '',
    stageDefinitionId: '',
    status: '',
    paymentStatus: '',
  };
}

function readFilters(searchParams: URLSearchParams, fallback: StatisticsFilters): StatisticsFilters {
  const dateBasis = searchParams.get('dateBasis');
  return {
    ...fallback,
    from: searchParams.get('from') || fallback.from,
    to: searchParams.get('to') || fallback.to,
    dateBasis: dateBasis === 'COMPLETED' || dateBasis === 'PAID' ? dateBasis : 'CREATED',
    storyId: searchParams.get('storyId') || '',
    assigneeDiscordUserId: searchParams.get('assigneeDiscordUserId') || '',
    workflowTemplateId: searchParams.get('workflowTemplateId') || '',
    stageDefinitionId: searchParams.get('stageDefinitionId') || '',
    status: (searchParams.get('status') as StatisticsTaskStatus | null) || '',
    paymentStatus: (searchParams.get('paymentStatus') as StatisticsPaymentStatus | null) || '',
  };
}

function isForbidden(error: unknown): boolean {
  const message = formatError(error).toLocaleLowerCase();
  return message.includes('forbidden') || message.includes('permission') || message.includes('quyền');
}

function FilterSelect({
  label,
  noOptionsText,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  value,
}: {
  readonly label: string;
  readonly noOptionsText: string;
  readonly onChange: (option: SelectSearchOption | null) => void;
  readonly options: SelectSearchOption[];
  readonly placeholder: string;
  readonly searchPlaceholder: string;
  readonly value: string;
}) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-xs font-semibold text-foreground/75">{label}</span>
      <SelectSearch
        noOptionsText={noOptionsText}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        usePortal
        value={options.find((option) => option.value === value) ?? null}
      />
    </label>
  );
}

const CHAPTER_COLUMN_WIDTH = '21.25rem';
const STAGE_COLUMN_WIDTH = '12.5rem';

function getChapterProgress(row: StatisticsChapterRow): {
  readonly done: number;
  readonly percent: number;
  readonly total: number;
} {
  const cells = Object.values(row.stages).filter(
    (cell): cell is StatisticsTaskCell => cell !== null,
  );
  const done = cells.filter((cell) => cell.taskStatus === 'COMPLETED').length;
  return {
    done,
    percent: cells.length === 0 ? 0 : Math.round((done / cells.length) * 100),
    total: cells.length,
  };
}

interface StoryProgress {
  readonly chapters: number;
  readonly done: number;
  readonly total: number;
}

function buildStoryProgress(
  items: readonly StatisticsChapterRow[],
): ReadonlyMap<string, StoryProgress> {
  const progressByStory = new Map<string, StoryProgress>();
  for (const item of items) {
    const progress = getChapterProgress(item);
    const previous = progressByStory.get(item.storyId);
    progressByStory.set(item.storyId, {
      chapters: (previous?.chapters ?? 0) + 1,
      done: (previous?.done ?? 0) + progress.done,
      total: (previous?.total ?? 0) + progress.total,
    });
  }
  return progressByStory;
}

const ChapterRows = memo(function ChapterRowGroup({
  columns,
  language,
  onPublish,
  onSelect,
  row,
  storyProgress,
  t,
}: {
  readonly columns: readonly StatisticsStageColumn[];
  readonly language: string;
  readonly onPublish: (chapter: StatisticsChapterRow) => void;
  readonly onSelect: (selected: SelectedTaskReference) => void;
  readonly row: StatisticsChapterRow;
  readonly storyProgress: StoryProgress | null;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const progress = getChapterProgress(row);
  return (
    <>
                {storyProgress ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      className="border-b border-border/60 bg-muted/30 p-0"
                      colSpan={columns.length + 1}
                    >
                      <div className="sticky left-0 flex w-max max-w-full items-center gap-3 px-5 py-2.5">
                        <span aria-hidden="true" className="h-5 w-1.5 rounded-full bg-primary" />
                        <span className="text-sm font-extrabold">{row.storyTitle}</span>
                        <span className="text-xs text-muted-foreground">
                          {t(translations.statistics.storyMeta, {
                            chapters: storyProgress.chapters,
                            done: storyProgress.done,
                            total: storyProgress.total,
                          })}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    className="sticky left-0 z-20 border-r border-b border-border/60 bg-card px-5 py-3 align-middle"
                    style={{ width: CHAPTER_COLUMN_WIDTH }}
                  >
                    <div className="flex min-w-0 flex-col gap-2">
                      <Link
                        className="block truncate text-sm font-semibold text-link underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        title={row.chapterName}
                        to={`/stories/${encodeURIComponent(row.storyId)}`}
                      >
                        {row.chapterName}
                      </Link>
                      <div className="flex min-h-8 items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            aria-label={t(translations.statistics.chapterProgress)}
                            aria-valuemax={100}
                            aria-valuemin={0}
                            aria-valuenow={progress.percent}
                            className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-border"
                            role="progressbar"
                          >
                            <div
                              className={`h-full rounded-full ${progress.percent === 100 ? 'bg-positive' : 'bg-primary'}`}
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold whitespace-nowrap tabular-nums">
                            {progress.percent}%{' '}
                            <span className="font-medium text-muted-foreground">
                              · {progress.done}/{progress.total}
                            </span>
                          </span>
                        </div>
                        {row.publicationStatus === 'PUBLISHED' ? (
                          <span className="flex shrink-0 items-center gap-1">
                            <StatusMark done label={t(translations.management.stories.published)} />
                            {row.publicationUrl ? (
                              <a
                                aria-label={t(translations.statistics.openPublication)}
                                className="inline-flex size-8 items-center justify-center rounded-md text-link hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                href={row.publicationUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <ExternalLink aria-hidden="true" className="size-3.5" />
                              </a>
                            ) : null}
                          </span>
                        ) : (
                          <Button
                            aria-label={`${t(translations.statistics.quickPublish)}: ${row.chapterName}`}
                            className="shrink-0"
                            onClick={() => onPublish(row)}
                            size="sm"
                            variant="outline"
                          >
                            <Upload aria-hidden="true" />
                            {t(translations.statistics.quickPublish)}
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {columns.map((column) => {
                    const cell = row.stages[column.id];
                    const amount = cell
                      ? formatMoney(cell.agreedPrice, cell.currency, language)
                      : '';
                    const assignee = cell
                      ? (cell.assigneeDisplayName ??
                        cell.assigneeDiscordUserId ??
                        t(translations.statistics.unassigned))
                      : '';
                    const isUnassigned =
                      cell !== null &&
                      cell !== undefined &&
                      !cell.assigneeDisplayName &&
                      !cell.assigneeDiscordUserId;
                    return (
                      <TableCell
                        className="border-b border-border/60 p-1 align-middle [&:nth-child(n+3)]:border-l"
                        key={`${row.chapterId}-${column.id}`}
                      >
                        {cell ? (
                          <button
                            aria-label={`${column.name}: ${amount}, ${assignee}`}
                            className="flex min-h-21 w-full flex-col items-start justify-center gap-1.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            onClick={() =>
                              onSelect({
                                chapterId: row.chapterId,
                                stageDefinitionId: column.id,
                                storyId: row.storyId,
                                taskId: cell.taskId,
                              })
                            }
                            type="button"
                          >
                            <span className="text-sm font-bold tabular-nums">{amount}</span>
                            <span
                              className={`max-w-full truncate text-xs font-medium text-muted-foreground ${isUnassigned ? 'italic' : ''}`}
                            >
                              {assignee}
                            </span>
                            <span className="flex flex-nowrap gap-1 whitespace-nowrap">
                              <TaskStatusChip
                                label={statusLabel(cell.taskStatus, t)}
                                status={cell.taskStatus}
                              />
                              <StateChip
                                doneLabel={t(translations.statistics.chipPaid)}
                                icon={CreditCard}
                                isDone={cell.paymentStatus === 'PAID'}
                                pendingLabel={t(translations.statistics.chipNotPaid)}
                              />
                            </span>
                          </button>
                        ) : (
                          <span
                            aria-label={t(translations.statistics.emptyCell)}
                            className="flex min-h-21 items-center px-3 text-sm text-muted-foreground"
                          >
                            —
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
    </>
  );
});

function StatisticsTable({
  language,
  onSelect,
  onPublish,
  result,
  t,
}: {
  readonly language: string;
  readonly onSelect: (selected: SelectedTaskReference) => void;
  readonly onPublish: (chapter: StatisticsChapterRow) => void;
  readonly result: NonNullable<ReturnType<typeof useStatisticsQuery>['data']>;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const storyProgressByStory = useMemo(
    () => buildStoryProgress(result.items),
    [result.items],
  );
  const stageHeadClass =
    'h-11 border-b border-border/70 bg-muted/60 px-4 text-xs font-bold tracking-[0.08em] whitespace-normal text-foreground uppercase [&:nth-child(n+3)]:border-l';
  return (
    <div className="max-w-full border-t border-border/70">
      <Table className="w-max min-w-full table-fixed border-separate border-spacing-0">
        <colgroup>
          <col style={{ width: CHAPTER_COLUMN_WIDTH }} />
          {result.columns.map((column) => (
            <col key={column.id} style={{ width: STAGE_COLUMN_WIDTH }} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              className="sticky left-0 z-30 h-11 border-r border-b border-border/70 bg-muted px-5 text-xs font-bold tracking-[0.08em] text-foreground uppercase"
              style={{ width: CHAPTER_COLUMN_WIDTH }}
            >
              {t(translations.statistics.chapterColumn)}
            </TableHead>
            {result.columns.map((column) => (
              <TableHead className={stageHeadClass} key={column.id}>
                {column.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.items.map((row, rowIndex) => {
            const isStoryStart =
              rowIndex === 0 || result.items[rowIndex - 1].storyId !== row.storyId;
            return (
              <ChapterRows
                columns={result.columns}
                key={row.chapterId}
                language={language}
                onPublish={onPublish}
                onSelect={onSelect}
                row={row}
                storyProgress={isStoryStart ? (storyProgressByStory.get(row.storyId) ?? null) : null}
                t={t}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function StatisticsTableSkeleton({ label }: { readonly label: string }) {
  return (
    <div aria-label={label} className="space-y-2 border-t border-border/60 p-4" role="status">
      {Array.from({ length: 5 }, (_, index) => <Skeleton className="h-14 w-full" key={index} />)}
    </div>
  );
}

export default function StatisticsPage() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const { data: workspaces, isLoading: isWorkspacesLoading } = useWorkspacesQuery();
  const activeWorkspace = workspaces?.find((workspace) => workspace.id === activeWorkspaceId);
  const { i18n, t } = useTranslation();
  const defaults = useMemo(() => makeDefaultFilters(activeWorkspace?.timezone), [activeWorkspace?.timezone]);
  const [filters, setFilters] = useState<StatisticsFilters>(() => defaults);
  const [selectedTaskReference, setSelectedTaskReference] =
    useState<SelectedTaskReference | null>(null);
  const [taskAction, setTaskAction] = useState<{
    readonly mode: TaskActionMode;
    readonly target: TaskActionTarget;
  } | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [publishingChapter, setPublishingChapter] =
    useState<StatisticsChapterRow | null>(null);
  const [publicationNotificationError, setPublicationNotificationError] =
    useState<string | null>(null);
  const filtersQuery = useStatisticsFiltersQuery(activeWorkspaceId);
  const statisticsQuery = useStatisticsQuery(activeWorkspaceId, filters);
  const summaryQuery = useStatisticsSummaryQuery(activeWorkspaceId, filters, isSummaryOpen);
  const exportMutation = useExportStatisticsMutation(activeWorkspaceId);
  const publicationMutation = useUpdateChapterPublicationMutation(
    activeWorkspaceId || '',
    publishingChapter?.storyId || '',
  );
  const dateBasisOptions = useMemo<SelectSearchOption[]>(
    () => [
      {
        label: t(translations.statistics.dateBasisCreated),
        value: 'CREATED',
      },
      {
        label: t(translations.statistics.dateBasisCompleted),
        value: 'COMPLETED',
      },
      {
        label: t(translations.statistics.dateBasisPaid),
        value: 'PAID',
      },
    ],
    [t],
  );
  const storyOptions = useMemo<SelectSearchOption[]>(
    () => [
      {
        label: t(translations.statistics.allStories),
        value: 'all',
      },
      ...(filtersQuery.data?.stories ?? []).map((story) => ({
        label: story.title,
        value: story.id,
      })),
    ],
    [filtersQuery.data?.stories, t],
  );
  const workflowOptions = useMemo<SelectSearchOption[]>(
    () => [
      {
        label: t(translations.statistics.allWorkflows),
        value: 'all',
      },
      ...(filtersQuery.data?.workflows ?? []).map((workflow) => ({
        label: workflow.name,
        value: workflow.id,
      })),
    ],
    [filtersQuery.data?.workflows, t],
  );
  const assigneeOptions = useMemo<SelectSearchOption[]>(
    () => [
      {
        label: t(translations.statistics.allAssignees),
        value: 'all',
      },
      ...(filtersQuery.data?.assignees ?? []).map((assignee) => ({
        label:
          assignee.id === null
            ? t(translations.statistics.unassigned)
            : assignee.displayName,
        value: assignee.id ?? UNASSIGNED,
      })),
    ],
    [filtersQuery.data?.assignees, t],
  );
  const stageOptions = useMemo<SelectSearchOption[]>(
    () => [
      {
        label: t(translations.statistics.allStages),
        value: 'all',
      },
      ...(filtersQuery.data?.stages ?? []).map((stage) => ({
        label: stage.name,
        value: stage.id,
      })),
    ],
    [filtersQuery.data?.stages, t],
  );
  const statusOptions = useMemo<SelectSearchOption[]>(
    () => [
      {
        label: t(translations.statistics.allTaskStatuses),
        value: 'all',
      },
      ...TASK_STATUSES.map((status) => ({
        label: statusLabel(status, t),
        value: status,
      })),
    ],
    [t],
  );
  const paymentStatusOptions = useMemo<SelectSearchOption[]>(
    () => [
      {
        label: t(translations.statistics.allPaymentStatuses),
        value: 'all',
      },
      ...PAYMENT_STATUSES.map((status) => ({
        label: paymentLabel(status, t),
        value: status,
      })),
    ],
    [t],
  );
  const noMatchingOptionsText = t(translations.statistics.noMatchingOptions);
  const selectedTask = useMemo<SelectedTask | null>(() => {
    if (!selectedTaskReference || !statisticsQuery.data) return null;
    const row = statisticsQuery.data.items.find(
      (item) =>
        item.storyId === selectedTaskReference.storyId &&
        item.chapterId === selectedTaskReference.chapterId,
    );
    const stage = statisticsQuery.data.columns.find(
      (column) => column.id === selectedTaskReference.stageDefinitionId,
    );
    const cell = row?.stages[selectedTaskReference.stageDefinitionId] ?? null;
    if (
      !row ||
      !stage ||
      !cell ||
      cell.taskId !== selectedTaskReference.taskId
    ) {
      return null;
    }
    return {
      cell,
      chapterName: row.chapterName,
      stage,
      storyTitle: row.storyTitle,
    };
  }, [selectedTaskReference, statisticsQuery.data]);

  useEffect(() => {
    if (activeWorkspaceId) setFilters((current) => readFilters(new URLSearchParams(window.location.search), { ...defaults, ...current }));
  }, [activeWorkspaceId, defaults]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('from', filters.from);
    params.set('to', filters.to);
    params.set('dateBasis', filters.dateBasis);
    if (filters.storyId) params.set('storyId', filters.storyId);
    if (filters.assigneeDiscordUserId) params.set('assigneeDiscordUserId', filters.assigneeDiscordUserId);
    if (filters.workflowTemplateId) params.set('workflowTemplateId', filters.workflowTemplateId);
    if (filters.stageDefinitionId) params.set('stageDefinitionId', filters.stageDefinitionId);
    if (filters.status) params.set('status', filters.status);
    if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [filters]);

  useEffect(() => {
    if (!selectedTask && selectedTaskReference) {
      setSelectedTaskReference(null);
      setTaskAction(null);
    }
  }, [selectedTask, selectedTaskReference]);

  const language = i18n.language;
  const error = statisticsQuery.error;
  const canShowTable = Boolean(statisticsQuery.data && !statisticsQuery.isLoading && !error);

  function updateFilter<Key extends keyof StatisticsFilters>(key: Key, value: StatisticsFilters[Key]): void {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleDateBasisChange(option: SelectSearchOption | null): void {
    if (!option) return;
    if (
      option.value === 'CREATED' ||
      option.value === 'COMPLETED' ||
      option.value === 'PAID'
    ) {
      updateFilter('dateBasis', option.value);
    }
  }

  function handleStoryChange(option: SelectSearchOption | null): void {
    updateFilter('storyId', option?.value === 'all' ? '' : option?.value ?? '');
  }

  function handleWorkflowChange(option: SelectSearchOption | null): void {
    updateFilter(
      'workflowTemplateId',
      option?.value === 'all' ? '' : option?.value ?? '',
    );
  }

  function handleAssigneeChange(option: SelectSearchOption | null): void {
    updateFilter(
      'assigneeDiscordUserId',
      option?.value === 'all' ? '' : option?.value ?? '',
    );
  }

  function handleStageChange(option: SelectSearchOption | null): void {
    updateFilter(
      'stageDefinitionId',
      option?.value === 'all' ? '' : option?.value ?? '',
    );
  }

  function handleStatusChange(option: SelectSearchOption | null): void {
    const value = option?.value ?? '';
    if (value === '' || value === 'all') {
      updateFilter('status', '');
      return;
    }
    if (TASK_STATUSES.includes(value as StatisticsTaskStatus)) {
      updateFilter('status', value as StatisticsTaskStatus);
    }
  }

  function handlePaymentStatusChange(option: SelectSearchOption | null): void {
    const value = option?.value ?? '';
    if (value === '' || value === 'all') {
      updateFilter('paymentStatus', '');
      return;
    }
    if (PAYMENT_STATUSES.includes(value as StatisticsPaymentStatus)) {
      updateFilter('paymentStatus', value as StatisticsPaymentStatus);
    }
  }

  function handleDateChange(range: DateRange | undefined): void {
    if (!range?.from) return;
    const from = format(range.from, 'yyyy-MM-dd');
    const to = format(range.to ?? range.from, 'yyyy-MM-dd');
    setFilters((current) => ({ ...current, from, to }));
  }

  function handleClearFilters(): void {
    setFilters({ ...defaults });
  }

  const optionLabel = (options: readonly SelectSearchOption[], value: string): string =>
    options.find((option) => option.value === value)?.label ?? value;
  const activeFilters = [
    { key: 'storyId', label: t(translations.statistics.story), raw: filters.storyId, value: optionLabel(storyOptions, filters.storyId), clear: () => updateFilter('storyId', '') },
    { key: 'workflowTemplateId', label: t(translations.statistics.workflow), raw: filters.workflowTemplateId, value: optionLabel(workflowOptions, filters.workflowTemplateId), clear: () => updateFilter('workflowTemplateId', '') },
    { key: 'assigneeDiscordUserId', label: t(translations.statistics.assignee), raw: filters.assigneeDiscordUserId, value: optionLabel(assigneeOptions, filters.assigneeDiscordUserId), clear: () => updateFilter('assigneeDiscordUserId', '') },
    { key: 'stageDefinitionId', label: t(translations.statistics.stage), raw: filters.stageDefinitionId, value: optionLabel(stageOptions, filters.stageDefinitionId), clear: () => updateFilter('stageDefinitionId', '') },
    { key: 'status', label: t(translations.statistics.taskStatus), raw: filters.status, value: optionLabel(statusOptions, filters.status), clear: () => updateFilter('status', '') },
    { key: 'paymentStatus', label: t(translations.statistics.paymentStatus), raw: filters.paymentStatus, value: optionLabel(paymentStatusOptions, filters.paymentStatus), clear: () => updateFilter('paymentStatus', '') },
  ].filter((filter) => filter.raw !== '');
  const moreFiltersCount = activeFilters.filter((filter) =>
    ['stageDefinitionId', 'status', 'paymentStatus'].includes(filter.key),
  ).length;

  function handleExport(): void {
    exportMutation.mutate({ filters, locale: language.startsWith('en') ? 'en' : 'vi' }, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'statistics.xlsx';
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success(t(translations.statistics.exportSuccess));
      },
      onError: (exportError) => toast.error(t(translations.statistics.exportError), { description: formatError(exportError) }),
    });
  }

  function openSelectedTaskAction(mode: TaskActionMode): void {
    if (!selectedTask) return;
    setTaskAction({
      mode,
      target: toTaskActionTarget(selectedTask.cell, selectedTask.stage),
    });
  }

  const openPublicationDialog = useCallback((chapter: StatisticsChapterRow): void => {
    setPublicationNotificationError(null);
    setPublishingChapter(chapter);
  }, []);

  function submitPublication(input: {
    readonly notify?: boolean;
    readonly publicationUrl?: string;
  }): void {
    if (!publishingChapter || !activeWorkspaceId) return;
    setPublicationNotificationError(null);
    publicationMutation.mutate(
      {
        chapterId: publishingChapter.chapterId,
        publicationStatus: 'PUBLISHED',
        ...input,
      },
      {
        onSuccess: (result) => {
          if (
            result.notificationStatus === 'SENT' ||
            result.notificationStatus === 'NOT_REQUESTED'
          ) {
            setPublishingChapter(null);
            setPublicationNotificationError(null);
            toast.success(
              result.notificationStatus === 'SENT'
                ? t(translations.statistics.publicationNotificationSent)
                : t(translations.statistics.publicationSuccess),
            );
            return;
          }
          const message = t(
            result.notificationStatus === 'NOT_CONFIGURED'
              ? translations.statistics.publicationNotificationNotConfigured
              : translations.statistics.publicationNotificationFailed,
          );
          setPublicationNotificationError(message);
          toast.error(message);
        },
        onError: (mutationError: Error) => {
          const message = formatError(mutationError);
          setPublicationNotificationError(message);
          toast.error(message);
        },
      },
    );
  }

  if (!activeWorkspaceId) {
    return (
      <section className="space-y-6">
        <PageIntro t={t} />
        <Empty className="min-h-80 border bg-card/50">
          <EmptyHeader><EmptyMedia variant="icon"><CalendarClock /></EmptyMedia><EmptyTitle>{t(translations.statistics.noWorkspace)}</EmptyTitle><EmptyDescription>{t(translations.statistics.noWorkspaceDescription)}</EmptyDescription></EmptyHeader>
        </Empty>
      </section>
    );
  }

  if (isWorkspacesLoading) {
    return <StatisticsTableSkeleton label={t(translations.statistics.loading)} />;
  }

  if (!activeWorkspace) {
    return (
      <section className="space-y-6">
        <PageIntro t={t} />
        <Empty className="min-h-80 border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClock />
            </EmptyMedia>
            <EmptyTitle>{t(translations.statistics.noWorkspace)}</EmptyTitle>
            <EmptyDescription>
              {t(translations.statistics.noWorkspaceDescription)}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <PageIntro
        actions={
          <>
            <Button
              disabled={summaryQuery.isFetching || !activeWorkspaceId}
              onClick={() => setIsSummaryOpen(true)}
              size="lg"
              variant="outline"
            >
              <Calculator aria-hidden="true" />
              {t(translations.statistics.viewTotal)}
            </Button>
            <Button
              disabled={statisticsQuery.isLoading}
              loading={exportMutation.isPending}
              onClick={handleExport}
              size="lg"
            >
              {exportMutation.isPending ? null : (
                <FileSpreadsheet aria-hidden="true" />
              )}
              {exportMutation.isPending
                ? t(translations.statistics.exporting)
                : t(translations.statistics.export)}
            </Button>
          </>
        }
        t={t}
      />
      <Card>
        <CardContent className="space-y-3.5 p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/75">{t(translations.statistics.dateRange)}</Label>
              <StatisticsDateRangePicker from={filters.from} label={t(translations.statistics.dateRange)} onChange={handleDateChange} to={filters.to} />
            </div>
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-foreground/75">{t(translations.statistics.dateBasis)}</span>
              <div aria-label={t(translations.statistics.dateBasis)} className="inline-flex gap-0.5 rounded-xl bg-muted p-0.5" role="group">
                {dateBasisOptions.map((option) => (
                  <button
                    aria-pressed={filters.dateBasis === option.value}
                    className={`min-h-9 rounded-lg px-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${filters.dateBasis === option.value ? 'bg-card font-bold text-foreground shadow-sm' : 'font-semibold text-muted-foreground hover:text-foreground'}`}
                    key={option.value}
                    onClick={() => handleDateBasisChange(option)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-w-64 min-w-40 flex-1 basis-44">
              <FilterSelect
                label={t(translations.statistics.story)}
                noOptionsText={noMatchingOptionsText}
                onChange={handleStoryChange}
                options={storyOptions}
                placeholder={t(translations.statistics.allStories)}
                searchPlaceholder={t(translations.statistics.searchStories)}
                value={filters.storyId || 'all'}
              />
            </div>
            <div className="max-w-64 min-w-40 flex-1 basis-44">
              <FilterSelect
                label={t(translations.statistics.workflow)}
                noOptionsText={noMatchingOptionsText}
                onChange={handleWorkflowChange}
                options={workflowOptions}
                placeholder={t(translations.statistics.allWorkflows)}
                searchPlaceholder={t(translations.statistics.searchWorkflows)}
                value={filters.workflowTemplateId || 'all'}
              />
            </div>
            <div className="max-w-64 min-w-40 flex-1 basis-44">
              <FilterSelect
                label={t(translations.statistics.assignee)}
                noOptionsText={noMatchingOptionsText}
                onChange={handleAssigneeChange}
                options={assigneeOptions}
                placeholder={t(translations.statistics.allAssignees)}
                searchPlaceholder={t(translations.statistics.searchAssignees)}
                value={filters.assigneeDiscordUserId || 'all'}
              />
            </div>
            <Button
              aria-expanded={isMoreFiltersOpen}
              className="border-dashed"
              onClick={() => setIsMoreFiltersOpen((open) => !open)}
              size="lg"
              variant="outline"
            >
              <SlidersHorizontal aria-hidden="true" />
              {isMoreFiltersOpen ? t(translations.statistics.lessFilters) : t(translations.statistics.moreFilters)}
              {moreFiltersCount > 0 ? (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {moreFiltersCount}
                </span>
              ) : null}
            </Button>
          </div>
          {isMoreFiltersOpen ? (
            <div className="grid gap-3 border-t border-border/60 pt-3.5 sm:grid-cols-2 lg:grid-cols-3">
              <FilterSelect
                label={t(translations.statistics.stage)}
                noOptionsText={noMatchingOptionsText}
                onChange={handleStageChange}
                options={stageOptions}
                placeholder={t(translations.statistics.allStages)}
                searchPlaceholder={t(translations.statistics.searchStages)}
                value={filters.stageDefinitionId || 'all'}
              />
              <FilterSelect
                label={t(translations.statistics.taskStatus)}
                noOptionsText={noMatchingOptionsText}
                onChange={handleStatusChange}
                options={statusOptions}
                placeholder={t(translations.statistics.allTaskStatuses)}
                searchPlaceholder={t(translations.statistics.searchTaskStatuses)}
                value={filters.status || 'all'}
              />
              <FilterSelect
                label={t(translations.statistics.paymentStatus)}
                noOptionsText={noMatchingOptionsText}
                onChange={handlePaymentStatusChange}
                options={paymentStatusOptions}
                placeholder={t(translations.statistics.allPaymentStatuses)}
                searchPlaceholder={t(translations.statistics.searchPaymentStatuses)}
                value={filters.paymentStatus || 'all'}
              />
            </div>
          ) : null}
          {filtersQuery.isLoading ? (
            <p className="text-xs text-muted-foreground">{t(translations.statistics.loadingFilters)}</p>
          ) : null}
          {activeFilters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3.5">
              <span className="text-xs font-semibold text-muted-foreground">{t(translations.statistics.activeFilters)}</span>
              {activeFilters.map((filter) => (
                <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-secondary pr-1 pl-3 text-sm font-semibold text-secondary-foreground" key={filter.key}>
                  {filter.label}: {filter.value}
                  <button
                    aria-label={t(translations.statistics.removeFilter, { name: filter.label })}
                    className="inline-flex size-6 items-center justify-center rounded-full hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    onClick={filter.clear}
                    type="button"
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                </span>
              ))}
              <span className="flex-1" />
              <Button onClick={handleClearFilters} size="sm" variant="ghost">
                <RotateCcw aria-hidden="true" />
                {t(translations.statistics.clearFilters)}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t(translations.statistics.progressTitle)}</CardTitle>
            <CardDescription>{t(translations.statistics.tableDescription)}</CardDescription>
            <p className="pt-1 text-xs text-muted-foreground lg:hidden">{t(translations.statistics.mobileHint)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 aria-hidden="true" className="size-3.5 text-positive" />{t(translations.statistics.completed)}</span>
            <span className="inline-flex items-center gap-1.5"><CreditCard aria-hidden="true" className="size-3.5 text-positive" />{t(translations.statistics.paid)}</span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Circle aria-hidden="true" className="size-3.5" />{t(translations.statistics.no)}</span>
          </div>
        </CardHeader>
        {filtersQuery.isError ? <div className="px-4 pb-4 text-sm text-destructive">{formatError(filtersQuery.error)}</div> : null}
        {error ? (
          <Empty className="min-h-72 border-0 bg-destructive/5">
            <EmptyHeader><EmptyMedia variant="icon"><ShieldOff /></EmptyMedia><EmptyTitle>{isForbidden(error) ? t(translations.statistics.forbidden) : t(translations.statistics.error)}</EmptyTitle><EmptyDescription>{isForbidden(error) ? t(translations.statistics.forbidden) : formatError(error)}</EmptyDescription></EmptyHeader>
            {!isForbidden(error) ? <Button onClick={() => void statisticsQuery.refetch()} variant="outline"><RotateCcw aria-hidden="true" />{t(translations.statistics.retry)}</Button> : null}
          </Empty>
        ) : statisticsQuery.isLoading ? <StatisticsTableSkeleton label={t(translations.statistics.loading)} /> : statisticsQuery.data?.items.length === 0 ? (
          <Empty className="min-h-72 border-0 bg-muted/20"><EmptyHeader><EmptyMedia variant="icon"><Circle /></EmptyMedia><EmptyTitle>{t(translations.statistics.empty)}</EmptyTitle><EmptyDescription>{t(translations.statistics.emptyDescription)}</EmptyDescription></EmptyHeader></Empty>
         ) : canShowTable && statisticsQuery.data ? <StatisticsTable language={language} onPublish={openPublicationDialog} onSelect={setSelectedTaskReference} result={statisticsQuery.data} t={t} /> : null}
        {statisticsQuery.data && statisticsQuery.data.total > 0 ? <div className="border-t border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground sm:px-6">{t(translations.statistics.totalChapters, { count: statisticsQuery.data.total })}</div> : null}
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setSelectedTaskReference(null);
        }}
        open={selectedTask !== null}
      >
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-lg">
          {selectedTask ? (
            <TaskDetail
              language={language}
              onComplete={() => openSelectedTaskAction('complete')}
              onDeduct={() => openSelectedTaskAction('deduct')}
              onEdit={() => openSelectedTaskAction('edit')}
              selected={selectedTask}
              t={t}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <TaskActionDialogs
        mode={taskAction?.mode ?? null}
        onOpenChange={(open) => {
          if (!open) setTaskAction(null);
        }}
        target={taskAction?.target ?? null}
        workspaceId={activeWorkspaceId}
      />

      <StatisticsSummaryDialog
        language={language}
        onOpenChange={setIsSummaryOpen}
        open={isSummaryOpen}
        query={summaryQuery}
        t={t}
      />

      <ChapterPublicationDialog
        chapter={
          publishingChapter
            ? { ...publishingChapter, id: publishingChapter.chapterId }
            : null
        }
        errorMessage={publicationNotificationError}
        isPending={publicationMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setPublishingChapter(null);
            setPublicationNotificationError(null);
          }
        }}
        onSubmit={submitPublication}
      />
    </section>
  );
}

function PageIntro({
  actions,
  t,
}: {
  readonly actions?: ReactNode;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1 basis-80">
        <h2 className="text-3xl font-extrabold tracking-tight">{t(translations.statistics.title)}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t(translations.statistics.description)}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

function StatisticsSummaryDialog({
  language,
  onOpenChange,
  open,
  query,
  t,
}: {
  readonly language: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly query: ReturnType<typeof useStatisticsSummaryQuery>;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-hidden p-0 sm:w-[70vw] sm:!max-w-[70vw]">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <DialogTitle>{t(translations.statistics.viewTotalTitle)}</DialogTitle>
          <DialogDescription>{t(translations.statistics.viewTotalDescription)}</DialogDescription>
        </DialogHeader>
        {query.isLoading ? (
          <StatisticsTableSkeleton label={t(translations.statistics.loadingSummary)} />
        ) : query.isError ? (
          <div className="space-y-4 px-6 py-6">
            <p className="text-sm text-destructive">{formatError(query.error)}</p>
            <Button onClick={() => void query.refetch()} variant="outline"><RotateCcw aria-hidden="true" />{t(translations.statistics.retry)}</Button>
          </div>
        ) : query.data?.rows.length === 0 ? (
          <Empty className="min-h-56 border-0 bg-muted/20">
            <EmptyHeader><EmptyMedia variant="icon"><Circle /></EmptyMedia><EmptyTitle>{t(translations.statistics.summaryEmpty)}</EmptyTitle><EmptyDescription>{t(translations.statistics.emptyDescription)}</EmptyDescription></EmptyHeader>
          </Empty>
        ) : query.data ? (
          <StatisticsSummaryContent language={language} result={query.data} t={t} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function getSummaryWorkflowRowSpan(
  rows: StatisticsSummaryResult['rows'],
  rowIndex: number,
): number {
  const workflowId = rows[rowIndex]?.workflowId;
  if (!workflowId) return 1;

  let rowSpan = 1;
  while (rows[rowIndex + rowSpan]?.workflowId === workflowId) rowSpan += 1;
  return rowSpan;
}

function StatisticsSummaryContent({
  language,
  result,
  t,
}: {
  readonly language: string;
  readonly result: StatisticsSummaryResult;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="overflow-hidden">
      <div className="max-h-[60vh] overflow-auto px-6 py-1">
        <div className="overflow-hidden rounded-xl border border-border/70">
          <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky top-0 z-10 w-[34%] border-r border-border/60 bg-muted/95 text-center">{t(translations.statistics.summaryWorkflow)}</TableHead>
              <TableHead className="sticky top-0 z-10 w-[28%] border-r border-border/60 bg-muted/95 text-center">{t(translations.statistics.summaryStage)}</TableHead>
              <TableHead className="sticky top-0 z-10 w-[16%] border-r border-border/60 bg-muted/95 text-center">{t(translations.statistics.summaryTaskCount)}</TableHead>
              <TableHead className="sticky top-0 z-10 w-[22%] bg-muted/95 text-center">{t(translations.statistics.summaryTotalAmount)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((row, rowIndex) => {
              const isWorkflowStart = rowIndex === 0 || result.rows[rowIndex - 1]?.workflowId !== row.workflowId;
              const workflowRowSpan = isWorkflowStart ? getSummaryWorkflowRowSpan(result.rows, rowIndex) : 0;
              return (
                <TableRow key={`${row.workflowId}-${row.stageDefinitionId}-${row.currency}`}>
                  {isWorkflowStart ? <TableCell className="border-r border-border/60 bg-muted/20 text-center align-middle font-semibold whitespace-normal" rowSpan={workflowRowSpan}>{row.workflowName}</TableCell> : null}
                  <TableCell className="border-r border-border/60">{row.stageName}</TableCell>
                  <TableCell className="border-r border-border/60 text-right tabular-nums">{row.taskCount}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatMoney(row.totalAgreedPrice, row.currency, language)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 bg-muted/25 px-6 py-4">
        <span className="text-sm font-semibold">{t(translations.statistics.summaryTotalTasks, { count: result.totalTaskCount })}</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold tabular-nums">
          {result.totals.map((total) => <span key={total.currency}>{t(translations.statistics.summaryTotalAmount)}: {formatMoney(total.totalAgreedPrice, total.currency, language)}</span>)}
        </div>
      </div>
    </div>
  );
}
