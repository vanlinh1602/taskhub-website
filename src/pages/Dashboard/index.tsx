import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Hourglass,
  LoaderCircle,
  type LucideIcon,
  RefreshCw,
  ShieldOff,
  Upload,
  X,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

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
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardQuery } from '@/features/admin/hooks';
import type {
  AdminDashboard,
  DashboardActionItem,
  DashboardActionType,
} from '@/features/admin/types';
import { ROUTES } from '@/features/layouts/constants/routes';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { cn } from '@/lib/utils';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

type Translate = ReturnType<typeof useTranslation>['t'];

type UrgencyGroup = 'overdue' | 'today' | 'upcoming' | 'noDeadline';

interface ActionMeta {
  readonly cta: string;
  readonly hint: string;
  readonly icon: LucideIcon;
  readonly kpiLabel: string;
  readonly label: string;
  readonly text: string;
  readonly tone: string;
}

interface TrendPoint {
  readonly completed: number;
  readonly date: string;
}

interface ActionRowData {
  readonly group: UrgencyGroup;
  readonly item: DashboardActionItem;
  readonly key: string;
}

const ACTION_TYPES: readonly DashboardActionType[] = [
  'OVERDUE_TASK',
  'BLOCKED_TASK',
  'PENDING_EXTENSION',
  'PENDING_PAYMENT',
  'READY_TO_PUBLISH',
];

const ACTION_QUEUE_HREFS: Record<DashboardActionType, string> = {
  BLOCKED_TASK: `${ROUTES.TASKS}?status=BLOCKED`,
  OVERDUE_TASK: ROUTES.TASKS,
  PENDING_EXTENSION: ROUTES.DEADLINE_EXTENSIONS,
  PENDING_PAYMENT: ROUTES.PAYROLL,
  READY_TO_PUBLISH: ROUTES.STORIES,
};

const GROUP_ORDER: readonly UrgencyGroup[] = [
  'overdue',
  'today',
  'upcoming',
  'noDeadline',
];

const GROUP_TEXT: Record<UrgencyGroup, string> = {
  overdue: 'text-destructive',
  today: 'text-amber-700 dark:text-amber-300',
  upcoming: 'text-link',
  noDeadline: 'text-muted-foreground',
};

const DAY_MS = 24 * 60 * 60 * 1000;

function getActionMeta(type: DashboardActionType, t: Translate): ActionMeta {
  const d = translations.dashboard;
  switch (type) {
    case 'OVERDUE_TASK':
      return {
        cta: t(d.actionCta.overdueTask),
        hint: t(d.actionHints.overdueTask),
        icon: Clock3,
        kpiLabel: t(d.overdue),
        label: t(d.actionTypes.overdueTask),
        text: 'text-destructive',
        tone: 'bg-destructive/10 text-destructive',
      };
    case 'BLOCKED_TASK':
      return {
        cta: t(d.actionCta.blockedTask),
        hint: t(d.actionHints.blockedTask),
        icon: AlertCircle,
        kpiLabel: t(d.blocked),
        label: t(d.actionTypes.blockedTask),
        text: 'text-amber-700 dark:text-amber-300',
        tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
      };
    case 'PENDING_EXTENSION':
      return {
        cta: t(d.actionCta.pendingExtension),
        hint: t(d.actionHints.pendingExtension),
        icon: Hourglass,
        kpiLabel: t(d.extensions),
        label: t(d.actionTypes.pendingExtension),
        text: 'text-link',
        tone: 'bg-primary/10 text-link',
      };
    case 'PENDING_PAYMENT':
      return {
        cta: t(d.actionCta.pendingPayment),
        hint: t(d.actionHints.pendingPayment),
        icon: Banknote,
        kpiLabel: t(d.payments),
        label: t(d.actionTypes.pendingPayment),
        text: 'text-sky-700 dark:text-sky-300',
        tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
      };
    case 'READY_TO_PUBLISH':
      return {
        cta: t(d.actionCta.readyToPublish),
        hint: t(d.actionHints.readyToPublish),
        icon: Upload,
        kpiLabel: t(d.publishing),
        label: t(d.actionTypes.readyToPublish),
        text: 'text-violet-700 dark:text-violet-300',
        tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
      };
  }
}

function getAttentionCount(
  attention: AdminDashboard['attention'],
  type: DashboardActionType,
): number {
  switch (type) {
    case 'OVERDUE_TASK':
      return attention.overdueTasks;
    case 'BLOCKED_TASK':
      return attention.blockedTasks;
    case 'PENDING_EXTENSION':
      return attention.pendingExtensions;
    case 'PENDING_PAYMENT':
      return attention.pendingPayments;
    case 'READY_TO_PUBLISH':
      return attention.readyToPublish;
  }
}

function getActionHref(item: DashboardActionItem): string {
  if (item.type === 'PENDING_EXTENSION') return ROUTES.DEADLINE_EXTENSIONS;
  if (item.type === 'PENDING_PAYMENT') return ROUTES.PAYROLL;
  const query = new URLSearchParams({ q: item.chapterName });
  return `/stories/${encodeURIComponent(item.storyId)}?${query.toString()}`;
}

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

/** Calendar-day difference between the deadline and now (negative = overdue). */
function getDayDiff(dueAt: string, now: Date): number {
  return Math.round(
    (startOfDay(new Date(dueAt)) - startOfDay(now)) / DAY_MS,
  );
}

function getGroup(item: DashboardActionItem, now: Date): UrgencyGroup {
  if (!item.dueAt) return 'noDeadline';
  const diff = getDayDiff(item.dueAt, now);
  if (diff < 0) return 'overdue';
  return diff === 0 ? 'today' : 'upcoming';
}

function getDueLabel(item: DashboardActionItem, now: Date, t: Translate): string {
  const d = translations.dashboard;
  if (!item.dueAt) return t(d.noDeadline);
  const diff = getDayDiff(item.dueAt, now);
  if (diff < 0) return t(d.dueOverdueDays, { count: -diff });
  if (diff === 0) return t(d.dueToday);
  if (diff === 1) return t(d.dueTomorrow);
  return t(d.dueInDays, { count: diff });
}

function sortActionRows(
  items: readonly DashboardActionItem[],
  now: Date,
): ActionRowData[] {
  return items
    .map((item) => ({
      group: getGroup(item, now),
      item,
      key: `${item.type}-${item.id}`,
    }))
    .sort((a, b) => {
      const byGroup =
        GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
      if (byGroup !== 0) return byGroup;
      const aTime = new Date(a.item.dueAt ?? a.item.createdAt).getTime();
      const bTime = new Date(b.item.dueAt ?? b.item.createdAt).getTime();
      return aTime - bTime;
    });
}

function buildTrendPoints(progress: AdminDashboard['progress']): TrendPoint[] {
  const completedByDate = new Map(
    progress.map((item) => [item.date, item.completed]),
  );
  const today = new Date();
  const points: TrendPoint[] = [];

  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - offset,
      ),
    );
    const dateKey = date.toISOString().slice(0, 10);
    points.push({
      date: dateKey,
      completed: completedByDate.get(dateKey) ?? 0,
    });
  }

  return points;
}

function KpiBand({
  activeType,
  dashboard,
  onSelect,
  t,
}: {
  readonly activeType: DashboardActionType | null;
  readonly dashboard: AdminDashboard;
  readonly onSelect: (type: DashboardActionType) => void;
  readonly t: Translate;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {ACTION_TYPES.map((type) => {
        const meta = getActionMeta(type, t);
        const Icon = meta.icon;
        const count = getAttentionCount(dashboard.attention, type);
        const hasItems = dashboard.actionItems.some(
          (item) => item.type === type,
        );
        const active = activeType === type;
        const className = cn(
          'flex min-h-28 min-w-0 flex-col items-start gap-1.5 rounded-2xl border-2 bg-card p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          active
            ? 'border-primary bg-secondary'
            : 'border-border hover:border-primary/60',
        );

        const content = (
          <>
            <span className="flex w-full items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-muted-foreground">
                {meta.kpiLabel}
              </span>
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-lg',
                  meta.tone,
                )}
              >
                <Icon className="size-4" />
              </span>
            </span>
            <span
              className={cn(
                'font-heading text-4xl leading-none font-extrabold tracking-tight',
                count > 0 ? meta.text : 'text-muted-foreground',
              )}
            >
              {count}
            </span>
            <span className="text-xs text-muted-foreground">{meta.hint}</span>
          </>
        );

        return !hasItems && count > 0 ? (
          <Link className={className} key={type} to={ACTION_QUEUE_HREFS[type]}>
            {content}
          </Link>
        ) : (
          <button
            aria-pressed={active}
            className={className}
            disabled={count === 0}
            key={type}
            onClick={() => onSelect(type)}
            type="button"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

function ActionDueText({
  dueAt,
  language,
  t,
}: {
  readonly dueAt: string | null;
  readonly language: string;
  readonly t: Translate;
}) {
  if (!dueAt) return <span>—</span>;
  const formatted = new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(dueAt));
  return <span>{t(translations.dashboard.deadline)} {formatted}</span>;
}

function ActionItemRow({
  group,
  item,
  language,
  now,
  onSelect,
  selected,
  t,
}: {
  readonly group: UrgencyGroup;
  readonly item: DashboardActionItem;
  readonly language: string;
  readonly now: Date;
  readonly onSelect: () => void;
  readonly selected: boolean;
  readonly t: Translate;
}) {
  const meta = getActionMeta(item.type, t);
  const Icon = meta.icon;

  return (
    <button
      aria-pressed={selected}
      className={cn(
        'flex min-h-16 w-full min-w-0 items-center gap-3.5 rounded-xl border-2 px-3.5 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
        selected
          ? 'border-primary bg-secondary'
          : 'border-transparent hover:bg-muted',
      )}
      onClick={onSelect}
      type="button"
    >
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-xl',
          meta.tone,
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-semibold">
          {item.chapterName}
          <span className="font-normal text-muted-foreground">
            {' '}
            · {item.storyTitle}
          </span>
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {meta.label}
          {item.stageName
            ? ` · ${t(translations.dashboard.stage)} ${item.stageName}`
            : null}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
        <span className={cn('text-sm font-bold', GROUP_TEXT[group])}>
          {getDueLabel(item, now, t)}
        </span>
        <span className="text-xs text-muted-foreground">
          <ActionDueText dueAt={item.dueAt} language={language} t={t} />
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function ActionItemsPanel({
  activeType,
  language,
  now,
  onClearFilter,
  onSelect,
  rows,
  selectedKey,
  t,
}: {
  readonly activeType: DashboardActionType | null;
  readonly language: string;
  readonly now: Date;
  readonly onClearFilter: () => void;
  readonly onSelect: (key: string) => void;
  readonly rows: readonly ActionRowData[];
  readonly selectedKey: string | null;
  readonly t: Translate;
}) {
  const d = translations.dashboard;

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{t(d.actionItems)}</CardTitle>
            <CardDescription>
              {t(d.actionItemsSorted, { count: rows.length })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeType ? (
              <Button
                onClick={onClearFilter}
                size="lg"
                variant="secondary"
              >
                {t(d.filteringBy, {
                  label: getActionMeta(activeType, t).kpiLabel,
                })}
                <X />
              </Button>
            ) : null}
            <Button asChild size="lg" variant="ghost">
              <Link to={activeType ? ACTION_QUEUE_HREFS[activeType] : ROUTES.TASKS}>
                {t(d.viewAll)}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-4 sm:px-3">
        {rows.length === 0 ? (
          <Empty className="min-h-64 border-0 p-4">
            <EmptyHeader>
              <EmptyMedia className="text-link" variant="icon">
                <CheckCircle2 />
              </EmptyMedia>
              <EmptyTitle>{t(d.emptyActions)}</EmptyTitle>
              <EmptyDescription>{t(d.emptyActionsDescription)}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          GROUP_ORDER.map((group) => {
            const groupRows = rows.filter((row) => row.group === group);
            if (groupRows.length === 0) return null;
            return (
              <div key={group}>
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 pt-4 pb-2 text-xs font-bold tracking-wider uppercase',
                    GROUP_TEXT[group],
                  )}
                >
                  <span>{t(d.groups[group])}</span>
                  <span className="font-semibold text-muted-foreground">
                    · {groupRows.length}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {groupRows.map((row) => (
                    <ActionItemRow
                      group={row.group}
                      item={row.item}
                      key={row.key}
                      language={language}
                      now={now}
                      onSelect={() => onSelect(row.key)}
                      selected={row.key === selectedKey}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({
  children,
  label,
}: {
  readonly children: ReactNode;
  readonly label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm first:border-t-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}

function FocusPanel({
  group,
  item,
  language,
  now,
  t,
}: {
  readonly group: UrgencyGroup;
  readonly item: DashboardActionItem;
  readonly language: string;
  readonly now: Date;
  readonly t: Translate;
}) {
  const d = translations.dashboard;
  const meta = getActionMeta(item.type, t);
  const Icon = meta.icon;
  const storyHref = `/stories/${encodeURIComponent(item.storyId)}`;
  const primaryHref = getActionHref(item);
  const dueDate = item.dueAt
    ? new Intl.DateTimeFormat(language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(item.dueAt))
    : t(d.noDeadline);

  return (
    <section
      aria-label={t(d.detailLabel)}
      className="flex min-w-0 flex-col gap-5 rounded-2xl border-2 border-primary bg-card p-6 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-xl',
            meta.tone,
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        <span
          className={cn('text-xs font-bold tracking-wider uppercase', meta.text)}
        >
          {meta.label}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="text-2xl leading-tight font-extrabold tracking-tight break-words">
          {item.chapterName}
        </h3>
        <p className="mt-1 text-muted-foreground">{item.storyTitle}</p>
      </div>
      <dl className="overflow-hidden rounded-xl border border-border">
        <DetailRow label={t(d.stage)}>{item.stageName ?? '—'}</DetailRow>
        <DetailRow label={t(d.deadline)}>{dueDate}</DetailRow>
        <DetailRow label={t(d.status)}>
          <span className={GROUP_TEXT[group]}>{getDueLabel(item, now, t)}</span>
        </DetailRow>
        {item.requestedHours !== null ? (
          <DetailRow label={t(d.extensionHours)}>
            {t(d.hoursValue, { count: item.requestedHours })}
          </DetailRow>
        ) : null}
      </dl>
      <div className="flex flex-col gap-2">
        <Button asChild size="lg">
          <Link to={primaryHref}>
            {meta.cta}
            <ArrowRight />
          </Link>
        </Button>
        {primaryHref !== storyHref &&
        (item.type === 'PENDING_EXTENSION' ||
          item.type === 'PENDING_PAYMENT') ? (
          <Button asChild size="lg" variant="outline">
            <Link to={storyHref}>{t(d.openStory)}</Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function StageProgress({
  stages,
  t,
}: {
  readonly stages: AdminDashboard['stages'];
  readonly t: Translate;
}) {
  const d = translations.dashboard;
  const totals = stages.reduce(
    (sum, stage) => ({
      completed: sum.completed + stage.completed,
      total: sum.total + stage.total,
    }),
    { completed: 0, total: 0 },
  );
  const overall = totals.total
    ? Math.round((totals.completed / totals.total) * 100)
    : 0;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-baseline justify-between gap-3">
          <CardTitle>{t(d.stageProgress)}</CardTitle>
          {stages.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              {t(d.overallProgress, { percent: overall })}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {stages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t(d.emptyStages)}
          </p>
        ) : (
          <div className="space-y-4">
            {stages.map((stage) => {
              const percentage = stage.total
                ? Math.round((stage.completed / stage.total) * 100)
                : 0;
              return (
                <div key={stage.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-semibold">{stage.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {stage.completed}/{stage.total} · {percentage}%
                    </span>
                  </div>
                  <div
                    aria-label={`${stage.name}: ${percentage}%`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={percentage}
                    className="h-2 overflow-hidden rounded-full bg-secondary"
                    role="progressbar"
                  >
                    <div
                      className="h-full rounded-full bg-link transition-[width]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompletionTrend({
  language,
  progress,
  t,
}: {
  readonly language: string;
  readonly progress: AdminDashboard['progress'];
  readonly t: Translate;
}) {
  const d = translations.dashboard;
  const points = useMemo(() => buildTrendPoints(progress), [progress]);
  const maxCompleted = Math.max(...points.map((point) => point.completed), 1);
  const totalCompleted = points.reduce(
    (total, point) => total + point.completed,
    0,
  );
  const bestPoint = points.reduce((best, point) =>
    point.completed > best.completed ? point : best,
  );
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(language, { day: '2-digit', month: '2-digit' }),
    [language],
  );
  const formatDate = (date: string) =>
    dateFormatter.format(new Date(`${date}T00:00:00Z`));
  const average = new Intl.NumberFormat(language, {
    maximumFractionDigits: 1,
  }).format(totalCompleted / points.length);

  return (
    <Card className="min-w-0">
      <CardContent className="flex flex-wrap gap-x-10 gap-y-6">
        <div className="flex flex-col gap-4 sm:w-60">
          <div>
            <CardTitle>{t(d.completedByDay)}</CardTitle>
            <CardDescription>{t(d.last30Days)}</CardDescription>
          </div>
          <div>
            <div className="font-heading text-4xl leading-none font-extrabold tracking-tight">
              {totalCompleted}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t(d.completedTasks)}
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-xl font-bold">{average}</div>
              <div className="text-xs text-muted-foreground">
                {t(d.average)}
              </div>
            </div>
            <div>
              <div className="text-xl font-bold">{bestPoint.completed}</div>
              <div className="text-xs text-muted-foreground">
                {t(d.best, { date: formatDate(bestPoint.date) })}
              </div>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-[1_1_28rem]">
          <div
            aria-label={t(d.completedByDay)}
            className="flex h-40 items-end gap-1 border-b border-border"
            role="img"
          >
            {points.map((point, index) => (
              <span
                aria-label={`${point.date}: ${point.completed}`}
                className={cn(
                  'min-w-0 flex-1 rounded-t-md transition-[height]',
                  index === points.length - 1
                    ? 'bg-link'
                    : 'bg-primary/70 hover:bg-primary',
                )}
                key={point.date}
                style={{
                  height: `${point.completed ? Math.max(6, (point.completed / maxCompleted) * 100) : 3}%`,
                }}
                title={`${formatDate(point.date)}: ${point.completed}`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{formatDate(points[0].date)}</span>
            <span>{formatDate(points[Math.floor(points.length / 2)].date)}</span>
            <span>{formatDate(points[points.length - 1].date)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ACTION_TYPES.map((type) => (
          <Skeleton className="h-28" key={type} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]">
        <Skeleton className="min-h-96" />
        <Skeleton className="min-h-96" />
      </div>
      <Skeleton className="h-56" />
    </div>
  );
}

function DashboardContent({
  dashboard,
  language,
  t,
}: {
  readonly dashboard: AdminDashboard;
  readonly language: string;
  readonly t: Translate;
}) {
  const [activeType, setActiveType] = useState<DashboardActionType | null>(
    null,
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  const allRows = useMemo(
    () => sortActionRows(dashboard.actionItems, now),
    [dashboard.actionItems, now],
  );
  const rows = activeType
    ? allRows.filter((row) => row.item.type === activeType)
    : allRows;
  const selectedRow =
    rows.find((row) => row.key === selectedKey) ?? rows[0] ?? null;

  const handleKpiSelect = (type: DashboardActionType) => {
    const next = activeType === type ? null : type;
    setActiveType(next);
    const first = allRows.find((row) => !next || row.item.type === next);
    setSelectedKey(first?.key ?? null);
  };

  return (
    <>
      <KpiBand
        activeType={activeType}
        dashboard={dashboard}
        onSelect={handleKpiSelect}
        t={t}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]">
        <ActionItemsPanel
          activeType={activeType}
          language={language}
          now={now}
          onClearFilter={() => setActiveType(null)}
          onSelect={setSelectedKey}
          rows={rows}
          selectedKey={selectedRow?.key ?? null}
          t={t}
        />
        <div className="flex min-w-0 flex-col gap-5">
          {selectedRow ? (
            <FocusPanel
              group={selectedRow.group}
              item={selectedRow.item}
              language={language}
              now={now}
              t={t}
            />
          ) : null}
          <StageProgress stages={dashboard.stages} t={t} />
        </div>
      </div>
      <CompletionTrend
        language={language}
        progress={dashboard.progress}
        t={t}
      />
    </>
  );
}

export default function DashboardPage() {
  const { i18n, t } = useTranslation();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const dashboardQuery = useDashboardQuery(workspaceId);
  const d = translations.dashboard;
  const todayLabel = new Intl.DateTimeFormat(i18n.language, {
    day: '2-digit',
    month: '2-digit',
    weekday: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <section className="space-y-6" aria-busy={dashboardQuery.isFetching}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-wider text-link uppercase">
            {t(d.eyebrow)}
          </p>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t(d.pageTitle)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {dashboardQuery.data
              ? t(d.description, {
                  count: dashboardQuery.data.actionItems.length,
                  date: todayLabel,
                })
              : todayLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {t(d.lastUpdated)}
          </span>
          <Button
            disabled={dashboardQuery.isFetching || !workspaceId}
            onClick={() => void dashboardQuery.refetch()}
            size="lg"
            variant="outline"
          >
            {dashboardQuery.isFetching ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
            {dashboardQuery.isFetching ? t(d.refreshing) : t(d.refresh)}
          </Button>
        </div>
      </div>

      {!workspaceId ? (
        <Empty className="min-h-80 border border-dashed bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldOff />
            </EmptyMedia>
            <EmptyTitle>{t(d.noWorkspace)}</EmptyTitle>
            <EmptyDescription>{t(d.noWorkspaceDescription)}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : dashboardQuery.isError ? (
        <Empty className="min-h-80 border border-destructive/20 bg-destructive/5">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle />
            </EmptyMedia>
            <EmptyTitle>{t(d.error)}</EmptyTitle>
            <EmptyDescription>{formatError(dashboardQuery.error)}</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => void dashboardQuery.refetch()} variant="outline">
            {t(d.retry)}
          </Button>
        </Empty>
      ) : dashboardQuery.isLoading || !dashboardQuery.data ? (
        <DashboardSkeleton />
      ) : (
        <DashboardContent
          dashboard={dashboardQuery.data}
          language={i18n.language}
          t={t}
        />
      )}
    </section>
  );
}
