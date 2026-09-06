import { format, subDays } from 'date-fns';
import {
  Calculator,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileSpreadsheet,
  RotateCcw,
  ShieldOff,
  Upload,
  UserRound,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  useExportStatisticsMutation,
  useStatisticsFiltersQuery,
  useStatisticsQuery,
  useStatisticsSummaryQuery,
} from '@/features/statistics/hooks';
import type {
  StatisticsChapterRow,
  StatisticsDateBasis,
  StatisticsFilters,
  StatisticsPaymentStatus,
  StatisticsStageColumn,
  StatisticsSummaryResult,
  StatisticsTaskCell,
  StatisticsTaskStatus,
} from '@/features/statistics/types';
import { toTaskActionTarget } from '@/features/statistics/utils/task-action-target';
import TaskActionButtons from '@/features/tasks/components/task-action-buttons';
import {
  default as TaskActionDialogs,
  type TaskActionMode,
} from '@/features/tasks/components/task-action-dialogs';
import type { TaskActionTarget } from '@/features/tasks/types';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const PAGE_SIZE = 25;
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

interface SelectedTask {
  readonly cell: StatisticsTaskCell;
  readonly chapterName: string;
  readonly stage: StatisticsStageColumn;
  readonly storyTitle: string;
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
    from: format(subDays(today, 29), 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
    dateBasis: 'CREATED',
    storyId: '',
    assigneeDiscordUserId: '',
    workflowTemplateId: '',
    stageDefinitionId: '',
    status: '',
    paymentStatus: '',
    page: 0,
    pageSize: PAGE_SIZE,
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
    page: Math.max(0, Number(searchParams.get('page') || 0) || 0),
  };
}

function statusLabel(status: StatisticsTaskStatus, t: ReturnType<typeof useTranslation>['t']): string {
  const keys: Record<StatisticsTaskStatus, string> = {
    BLOCKED: translations.statistics.statusBlocked,
    READY: translations.statistics.statusReady,
    IN_PROGRESS: translations.statistics.statusInProgress,
    COMPLETED: translations.statistics.statusCompleted,
    CANCELLED: translations.statistics.statusCancelled,
  };
  return t(keys[status]);
}

function paymentLabel(status: StatisticsPaymentStatus, t: ReturnType<typeof useTranslation>['t']): string {
  const keys: Record<StatisticsPaymentStatus, string> = {
    NOT_READY: translations.statistics.paymentNotReady,
    PENDING: translations.statistics.paymentPending,
    PAID: translations.statistics.paymentPaid,
  };
  return t(keys[status]);
}

function formatMoney(value: string, currency: string, language: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;
  return `${new Intl.NumberFormat(language.startsWith('en') ? 'en-US' : 'vi-VN', { maximumFractionDigits: 2 }).format(amount)} ${currency}`;
}

function formatDate(value: string | null, language: string, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function isForbidden(error: unknown): boolean {
  const message = formatError(error).toLocaleLowerCase();
  return message.includes('forbidden') || message.includes('permission') || message.includes('quyền');
}

function FilterSelect({
  children,
  label,
  onValueChange,
  value,
}: {
  readonly children: ReactNode;
  readonly label: string;
  readonly onValueChange: (value: string) => void;
  readonly value: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs font-semibold text-foreground/75">{label}</Label>
      <Select onValueChange={onValueChange} value={value || undefined}>
        <SelectTrigger className="h-10 w-full bg-background/80" aria-label={label}>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function StatusMark({ done, label }: { readonly done: boolean; readonly label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      {done ? <CheckCircle2 aria-hidden="true" className="size-3.5 text-primary" /> : <Circle aria-hidden="true" className="size-3.5 text-muted-foreground" />}
      {label}
    </span>
  );
}

const STORY_COLUMN_WIDTH = '11rem';
const CHAPTER_COLUMN_WIDTH = '12rem';
const METRIC_COLUMN_WIDTH = '9rem';
const PUBLICATION_COLUMN_WIDTH = '13rem';

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
  return (
    <div className="max-w-full border border-border/70">
      <Table className="w-max min-w-full table-fixed border-separate border-spacing-0">
        <colgroup>
          <col style={{ width: STORY_COLUMN_WIDTH }} />
          <col style={{ width: CHAPTER_COLUMN_WIDTH }} />
          <col style={{ width: PUBLICATION_COLUMN_WIDTH }} />
          {result.columns.flatMap((column) => [
            <col key={`${column.id}-amount`} style={{ width: METRIC_COLUMN_WIDTH }} />,
            <col key={`${column.id}-completed`} style={{ width: METRIC_COLUMN_WIDTH }} />,
            <col key={`${column.id}-paid`} style={{ width: METRIC_COLUMN_WIDTH }} />,
          ])}
        </colgroup>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky left-0 z-30 border-r border-b border-border/70 bg-muted/95 text-center text-foreground" rowSpan={2} style={{ width: STORY_COLUMN_WIDTH }}>
              {t(translations.statistics.storyColumn)}
            </TableHead>
            <TableHead className="sticky z-30 border-r border-b border-border/70 bg-muted/95 text-center text-foreground" rowSpan={2} style={{ left: STORY_COLUMN_WIDTH, width: CHAPTER_COLUMN_WIDTH }}>
              {t(translations.statistics.chapterColumn)}
            </TableHead>
            <TableHead className="border-r border-b border-border/70 bg-muted/95 text-center text-foreground" rowSpan={2} style={{ width: PUBLICATION_COLUMN_WIDTH }}>
              {t(translations.statistics.publicationColumn)}
            </TableHead>
            {result.columns.map((column) => (
              <TableHead className="border-r border-b border-border/70 bg-muted/70 px-3 text-center font-semibold whitespace-normal text-foreground" colSpan={3} key={column.id}>
                {column.name}
              </TableHead>
            ))}
          </TableRow>
          <TableRow className="hover:bg-transparent">
            {result.columns.flatMap((column) => [
              <TableHead className="min-w-36 border-r border-b border-border/60 bg-muted/45 text-center text-xs" key={`${column.id}-amount`}>
                {t(translations.statistics.amount)}
              </TableHead>,
              <TableHead className="min-w-36 border-r border-b border-border/60 bg-muted/45 text-center text-xs" key={`${column.id}-completed`}>
                {t(translations.statistics.completed)}
              </TableHead>,
              <TableHead className="min-w-36 border-r border-b border-border/60 bg-muted/45 text-center text-xs" key={`${column.id}-paid`}>
                {t(translations.statistics.paid)}
              </TableHead>,
            ])}
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.items.map((row, rowIndex) => {
            const isStoryStart = rowIndex === 0 || result.items[rowIndex - 1].storyId !== row.storyId;
            const isStoryEnd = rowIndex === result.items.length - 1 || result.items[rowIndex + 1].storyId !== row.storyId;
            const rowBoundaryClass = isStoryEnd ? 'border-b-2 border-primary/20' : 'border-b border-border/60';
            const storyRowSpan = result.items.slice(rowIndex).findIndex((item) => item.storyId !== row.storyId);
            const span = storyRowSpan === -1 ? result.items.length - rowIndex : storyRowSpan;
            return (
              <TableRow className={isStoryEnd ? 'border-b-2 border-primary/20' : undefined} key={row.chapterId}>
                {isStoryStart ? (
                  <TableCell className="sticky left-0 z-20 border-r border-b-2 border-primary/20 bg-card px-3 text-center align-middle font-semibold whitespace-normal" rowSpan={span} style={{ width: STORY_COLUMN_WIDTH }}>
                    {row.storyTitle}
                  </TableCell>
                ) : null}
                <TableCell className={`sticky z-20 border-r border-border/70 bg-card font-medium ${rowBoundaryClass}`} style={{ left: STORY_COLUMN_WIDTH, width: CHAPTER_COLUMN_WIDTH }}>
                  <Link
                    className="block truncate text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    title={row.chapterName}
                    to={getChapterDetailPath(row.storyId, row.chapterId)}
                  >
                    {row.chapterName}
                  </Link>
                </TableCell>
                <TableCell className={`border-r border-border/70 bg-card ${rowBoundaryClass}`} style={{ width: PUBLICATION_COLUMN_WIDTH }}>
                  {row.publicationStatus === 'PUBLISHED' ? (
                    <div className="flex items-center justify-between gap-2 px-2 py-1">
                      <StatusMark done label={t(translations.management.stories.published)} />
                      {row.publicationUrl ? (
                        <a
                          aria-label={t(translations.statistics.openPublication)}
                          className="rounded-md p-1 text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          href={row.publicationUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink aria-hidden="true" className="size-3.5" />
                        </a>
                      ) : null}
                    </div>
                  ) : (
                    <Button
                      aria-label={`${t(translations.statistics.quickPublish)}: ${row.chapterName}`}
                      className="w-full"
                      onClick={() => onPublish(row)}
                      size="sm"
                      variant="outline"
                    >
                      <Upload aria-hidden="true" />
                      {t(translations.statistics.quickPublish)}
                    </Button>
                  )}
                </TableCell>
                {result.columns.flatMap((column) => {
                  const cell = row.stages[column.id];
                   return [
                     <TableCell className={`border-r border-border/60 p-1 text-center ${rowBoundaryClass}`} key={`${row.chapterId}-${column.id}-amount`}>
                       {cell ? <button aria-label={`${column.name} ${t(translations.statistics.amount)}`} className="min-h-12 w-full rounded-lg px-2 py-2 text-sm font-semibold tabular-nums transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onClick={() => onSelect({ chapterId: row.chapterId, stageDefinitionId: column.id, storyId: row.storyId, taskId: cell.taskId })}>{formatMoney(cell.agreedPrice, cell.currency, language)}</button> : <span className="text-muted-foreground">—</span>}
                     </TableCell>,
                     <TableCell className={`border-r border-border/60 p-1 text-center ${rowBoundaryClass}`} key={`${row.chapterId}-${column.id}-completed`}>
                       {cell ? <button aria-label={`${column.name} ${t(translations.statistics.completed)}`} className="min-h-12 w-full rounded-lg px-2 py-2 transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onClick={() => onSelect({ chapterId: row.chapterId, stageDefinitionId: column.id, storyId: row.storyId, taskId: cell.taskId })}><StatusMark done={cell.taskStatus === 'COMPLETED'} label={cell.taskStatus === 'COMPLETED' ? t(translations.statistics.yes) : t(translations.statistics.no)} /></button> : <span className="text-muted-foreground">—</span>}
                     </TableCell>,
                     <TableCell className={`border-r border-border/60 p-1 text-center ${rowBoundaryClass}`} key={`${row.chapterId}-${column.id}-paid`}>
                       {cell ? <button aria-label={`${column.name} ${t(translations.statistics.paid)}`} className="min-h-12 w-full rounded-lg px-2 py-2 transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onClick={() => onSelect({ chapterId: row.chapterId, stageDefinitionId: column.id, storyId: row.storyId, taskId: cell.taskId })}><StatusMark done={cell.paymentStatus === 'PAID'} label={cell.paymentStatus === 'PAID' ? t(translations.statistics.yes) : t(translations.statistics.no)} /></button> : <span className="text-muted-foreground">—</span>}
                    </TableCell>,
                  ];
                })}
              </TableRow>
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
  const navigate = useNavigate();
  const defaults = useMemo(() => makeDefaultFilters(activeWorkspace?.timezone), [activeWorkspace?.timezone]);
  const [filters, setFilters] = useState<StatisticsFilters>(() => defaults);
  const [selectedTaskReference, setSelectedTaskReference] =
    useState<SelectedTaskReference | null>(null);
  const [taskAction, setTaskAction] = useState<{
    readonly mode: TaskActionMode;
    readonly target: TaskActionTarget;
  } | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
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
    if (filters.page > 0) params.set('page', String(filters.page));
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
    setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? (value as number) : 0 }));
  }

  function handleStoryChange(value: string): void {
    setFilters((current) => ({ ...current, storyId: value === 'all' ? '' : value, page: 0 }));
  }

  function handleDateChange(range: DateRange | undefined): void {
    if (!range?.from) return;
    const from = format(range.from, 'yyyy-MM-dd');
    const to = format(range.to ?? range.from, 'yyyy-MM-dd');
    setFilters((current) => ({ ...current, from, to, page: 0 }));
  }

  function handleClearFilters(): void {
    setFilters({ ...defaults });
  }

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

  function openPublicationDialog(chapter: StatisticsChapterRow): void {
    setPublicationNotificationError(null);
    setPublishingChapter(chapter);
  }

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
    <section className="space-y-6">
      <PageIntro t={t} />
      <Card>
        <CardHeader className="gap-1 border-b border-border/60 bg-muted/15 px-4 py-4 sm:px-5">
          <CardTitle className="text-base">{t(translations.statistics.filtersTitle)}</CardTitle>
          <CardDescription className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
            <span>{t(translations.statistics.description)}</span>
            {filtersQuery.isLoading ? <span>{t(translations.statistics.loadingFilters)}</span> : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-x-3 gap-y-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-12">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
            <Label className="text-xs font-semibold text-foreground/75">{t(translations.statistics.dateRange)}</Label>
            <StatisticsDateRangePicker from={filters.from} label={t(translations.statistics.dateRange)} onChange={handleDateChange} to={filters.to} />
          </div>
          <div className="lg:col-span-2">
            <FilterSelect label={t(translations.statistics.dateBasis)} onValueChange={(value) => updateFilter('dateBasis', value as StatisticsDateBasis)} value={filters.dateBasis}>
              <SelectItem value="CREATED">{t(translations.statistics.dateBasisCreated)}</SelectItem>
              <SelectItem value="COMPLETED">{t(translations.statistics.dateBasisCompleted)}</SelectItem>
              <SelectItem value="PAID">{t(translations.statistics.dateBasisPaid)}</SelectItem>
            </FilterSelect>
          </div>
          <div className="lg:col-span-3">
            <FilterSelect label={t(translations.statistics.story)} onValueChange={handleStoryChange} value={filters.storyId || 'all'}>
              <SelectItem value="all">{t(translations.statistics.allStories)}</SelectItem>
              {filtersQuery.data?.stories.map((story) => <SelectItem key={story.id} value={story.id}>{story.title}</SelectItem>)}
            </FilterSelect>
          </div>
          <div className="lg:col-span-3">
            <FilterSelect label={t(translations.statistics.workflow)} onValueChange={(value) => updateFilter('workflowTemplateId', value === 'all' ? '' : value)} value={filters.workflowTemplateId || 'all'}>
              <SelectItem value="all">{t(translations.statistics.allWorkflows)}</SelectItem>
              {filtersQuery.data?.workflows.map((workflow) => <SelectItem key={workflow.id} value={workflow.id}>{workflow.name}</SelectItem>)}
            </FilterSelect>
          </div>
          <div className="lg:col-span-3">
            <FilterSelect label={t(translations.statistics.assignee)} onValueChange={(value) => updateFilter('assigneeDiscordUserId', value === 'all' ? '' : value)} value={filters.assigneeDiscordUserId || 'all'}>
              <SelectItem value="all">{t(translations.statistics.allAssignees)}</SelectItem>
              {filtersQuery.data?.assignees.map((assignee) => <SelectItem key={assignee.id ?? UNASSIGNED} value={assignee.id ?? UNASSIGNED}>{assignee.id === null ? t(translations.statistics.unassigned) : assignee.displayName}</SelectItem>)}
            </FilterSelect>
          </div>
          <div className="lg:col-span-3">
            <FilterSelect label={t(translations.statistics.stage)} onValueChange={(value) => updateFilter('stageDefinitionId', value === 'all' ? '' : value)} value={filters.stageDefinitionId || 'all'}>
              <SelectItem value="all">{t(translations.statistics.allStages)}</SelectItem>
              {filtersQuery.data?.stages.map((stage) => <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>)}
            </FilterSelect>
          </div>
          <div className="lg:col-span-3">
            <FilterSelect label={t(translations.statistics.taskStatus)} onValueChange={(value) => updateFilter('status', value === 'all' ? '' : value as StatisticsTaskStatus)} value={filters.status || 'all'}>
              <SelectItem value="all">{t(translations.statistics.allTaskStatuses)}</SelectItem>
              {TASK_STATUSES.map((status) => <SelectItem key={status} value={status}>{statusLabel(status, t)}</SelectItem>)}
            </FilterSelect>
          </div>
          <div className="lg:col-span-3">
            <FilterSelect label={t(translations.statistics.paymentStatus)} onValueChange={(value) => updateFilter('paymentStatus', value === 'all' ? '' : value as StatisticsPaymentStatus)} value={filters.paymentStatus || 'all'}>
              <SelectItem value="all">{t(translations.statistics.allPaymentStatuses)}</SelectItem>
              {PAYMENT_STATUSES.map((status) => <SelectItem key={status} value={status}>{paymentLabel(status, t)}</SelectItem>)}
            </FilterSelect>
          </div>
          <div className="flex flex-wrap items-end gap-2 border-t border-border/60 pt-3 sm:col-span-2 lg:col-span-12">
            <Button className="flex-1 sm:flex-none" onClick={handleClearFilters} variant="outline"><RotateCcw aria-hidden="true" />{t(translations.statistics.clearFilters)}</Button>
            <Button className="flex-1 sm:flex-none" disabled={summaryQuery.isFetching || !activeWorkspaceId} onClick={() => setIsSummaryOpen(true)} variant="outline"><Calculator aria-hidden="true" />{t(translations.statistics.viewTotal)}</Button>
            <Button className="flex-1 sm:flex-none" disabled={exportMutation.isPending || statisticsQuery.isLoading} onClick={handleExport}><FileSpreadsheet aria-hidden="true" />{exportMutation.isPending ? t(translations.statistics.exporting) : t(translations.statistics.export)}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="gap-1">
          <CardTitle className="text-base">{t(translations.statistics.title)}</CardTitle>
          <CardDescription>{t(translations.statistics.tableDescription)}</CardDescription>
          <p className="pt-2 text-xs text-muted-foreground lg:hidden">{t(translations.statistics.mobileHint)}</p>
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
        {statisticsQuery.data && statisticsQuery.data.total > 0 ? <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6"><span className="text-muted-foreground">{t(translations.statistics.pageSummary, { count: statisticsQuery.data.total, current: statisticsQuery.data.page + 1, total: statisticsQuery.data.pageCount })}</span><div className="flex gap-2"><Button disabled={statisticsQuery.isFetching || filters.page <= 0} onClick={() => updateFilter('page', Math.max(0, filters.page - 1))} size="sm" variant="outline"><ChevronLeft aria-hidden="true" />{t(translations.statistics.previousPage)}</Button><Button disabled={statisticsQuery.isFetching || filters.page + 1 >= statisticsQuery.data.pageCount} onClick={() => updateFilter('page', filters.page + 1)} size="sm">{t(translations.statistics.nextPage)}<ChevronRight aria-hidden="true" /></Button></div></div> : null}
      </Card>

      <Sheet
        onOpenChange={(open) => {
          if (!open) setSelectedTaskReference(null);
        }}
        open={selectedTask !== null}
      >
        <SheetContent className="w-full gap-0 overflow-hidden bg-card p-0 data-[side=right]:!w-full data-[side=right]:sm:!max-w-lg">
          {selectedTask ? (
            <TaskDetail
              language={language}
              navigate={navigate}
              onDeduct={() => openSelectedTaskAction('deduct')}
              onEdit={() => openSelectedTaskAction('edit')}
              selected={selectedTask}
              t={t}
            />
          ) : null}
        </SheetContent>
      </Sheet>

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

function PageIntro({ t }: { readonly t: ReturnType<typeof useTranslation>['t'] }) {
  return <div><h2 className="text-2xl font-extrabold tracking-tight">{t(translations.statistics.title)}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t(translations.statistics.description)}</p></div>;
}

function getChapterDetailPath(storyId: string, chapterId: string): string {
  return `/stories/${encodeURIComponent(storyId)}/chapter/${encodeURIComponent(chapterId)}`;
}

function TaskDetail({
  language,
  navigate,
  onDeduct,
  onEdit,
  selected,
  t,
}: {
  readonly language: string;
  readonly navigate: ReturnType<typeof useNavigate>;
  readonly onDeduct: () => void;
  readonly onEdit: () => void;
  readonly selected: SelectedTask;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const { cell, chapterName, stage, storyTitle } = selected;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="border-b border-border/60 bg-muted/20 px-6 pt-6 pr-14 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">{stage.name}</p>
            <SheetTitle className="mt-1 text-xl">{t(translations.statistics.detailsTitle)}</SheetTitle>
            <SheetDescription className="mt-2 break-words">
              {storyTitle} <span aria-hidden="true">·</span> {chapterName}
            </SheetDescription>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 font-mono text-xs font-semibold">#{cell.taskId}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-medium">
            {cell.taskStatus === 'COMPLETED' ? <CheckCircle2 aria-hidden="true" className="size-3.5 text-primary" /> : <Circle aria-hidden="true" className="size-3.5 text-muted-foreground" />}
            {statusLabel(cell.taskStatus, t)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-medium">
            {cell.paymentStatus === 'PAID' ? <CheckCircle2 aria-hidden="true" className="size-3.5 text-primary" /> : <Circle aria-hidden="true" className="size-3.5 text-muted-foreground" />}
            {paymentLabel(cell.paymentStatus, t)}
          </span>
        </div>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-x-5 gap-y-1 text-sm sm:grid-cols-2">
           <DetailItem icon={<UserRound aria-hidden="true" />} label={t(translations.statistics.assigneeValue)} value={cell.assigneeDisplayName ?? cell.assigneeDiscordUserId ?? t(translations.statistics.unassigned)} />
          <DetailItem emphasis icon={<CircleDollarSign aria-hidden="true" />} label={t(translations.statistics.price)} value={formatMoney(cell.agreedPrice, cell.currency, language)} />
          <DetailItem icon={<CalendarDays aria-hidden="true" />} label={t(translations.statistics.createdAt)} value={formatDate(cell.createdAt, language, t(translations.statistics.noDate))} />
          <DetailItem icon={<CalendarDays aria-hidden="true" />} label={t(translations.statistics.completedAt)} value={formatDate(cell.completedAt, language, t(translations.statistics.noDate))} />
          <DetailItem icon={<CreditCard aria-hidden="true" />} label={t(translations.statistics.paidAt)} value={formatDate(cell.paidAt, language, t(translations.statistics.noDate))} />
          <DetailItem icon={<ClipboardList aria-hidden="true" />} label={t(translations.statistics.taskId)} mono value={`#${cell.taskId}`} />
        </div>
        <p className="mt-5 border-t border-border/60 pt-4 text-sm text-muted-foreground">{t(translations.statistics.detailsDescription)}</p>
      </div>
       <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-card px-6 py-4">
         <TaskActionButtons
           isDeductDisabled={cell.paymentStatus === 'PAID'}
           onDeduct={onDeduct}
           onEdit={onEdit}
         />
         <Button className="w-full sm:w-auto" onClick={() => navigate(`/stories/${encodeURIComponent(cell.storyId)}/chapter/${encodeURIComponent(cell.chapterId)}`)} variant="outline">
           <ExternalLink aria-hidden="true" />
           {t(translations.statistics.viewChapter)}
         </Button>
       </div>
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

function DetailItem({ emphasis, icon, label, mono, value }: { readonly emphasis?: boolean; readonly icon?: ReactNode; readonly label: string; readonly mono?: boolean; readonly value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-b border-border/60 py-3">
      {icon ? <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground [&>svg]:size-4">{icon}</span> : null}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 font-semibold break-words ${emphasis ? 'text-base text-primary' : ''} ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
