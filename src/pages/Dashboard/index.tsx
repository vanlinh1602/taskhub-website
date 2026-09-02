import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock3,
  GitPullRequest,
  Layers3,
  LoaderCircle,
  type LucideIcon,
  RefreshCw,
  ShieldOff,
} from 'lucide-react';
import { useMemo } from 'react';
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
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

type Translate = ReturnType<typeof useTranslation>['t'];

interface ActionMeta {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly tone: string;
}

interface AttentionItem {
  readonly href: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly tone: string;
  readonly value: number;
}

interface TrendPoint {
  readonly completed: number;
  readonly date: string;
}

function getActionMeta(type: DashboardActionType, t: Translate): ActionMeta {
  switch (type) {
    case 'OVERDUE_TASK':
      return {
        icon: Clock3,
        label: t(translations.dashboard.actionTypes.overdueTask),
        tone: 'bg-destructive/10 text-destructive',
      };
    case 'BLOCKED_TASK':
      return {
        icon: AlertCircle,
        label: t(translations.dashboard.actionTypes.blockedTask),
        tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
      };
    case 'PENDING_EXTENSION':
      return {
        icon: GitPullRequest,
        label: t(translations.dashboard.actionTypes.pendingExtension),
        tone: 'bg-primary/10 text-primary',
      };
    case 'PENDING_PAYMENT':
      return {
        icon: Banknote,
        label: t(translations.dashboard.actionTypes.pendingPayment),
        tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
      };
    case 'READY_TO_PUBLISH':
      return {
        icon: Layers3,
        label: t(translations.dashboard.actionTypes.readyToPublish),
        tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
      };
  }
}

function getAttentionItems(
  attention: AdminDashboard['attention'],
  t: Translate,
): readonly AttentionItem[] {
  return [
    {
      href: ROUTES.TASKS,
      icon: Clock3,
      label: t(translations.dashboard.overdue),
      tone: 'text-destructive',
      value: attention.overdueTasks,
    },
    {
      href: ROUTES.TASKS,
      icon: AlertCircle,
      label: t(translations.dashboard.blocked),
      tone: 'text-amber-600 dark:text-amber-300',
      value: attention.blockedTasks,
    },
    {
      href: ROUTES.DEADLINE_EXTENSIONS,
      icon: GitPullRequest,
      label: t(translations.dashboard.extensions),
      tone: 'text-primary',
      value: attention.pendingExtensions,
    },
    {
      href: ROUTES.PAYROLL,
      icon: Banknote,
      label: t(translations.dashboard.payments),
      tone: 'text-sky-600 dark:text-sky-300',
      value: attention.pendingPayments,
    },
    {
      href: ROUTES.STORIES,
      icon: Layers3,
      label: t(translations.dashboard.publishing),
      tone: 'text-violet-600 dark:text-violet-300',
      value: attention.readyToPublish,
    },
  ];
}

function getActionHref(item: DashboardActionItem): string {
  if (item.type === 'PENDING_EXTENSION') return ROUTES.DEADLINE_EXTENSIONS;
  if (item.type === 'PENDING_PAYMENT') return ROUTES.PAYROLL;
  return `/stories/${encodeURIComponent(item.storyId)}/chapter/${encodeURIComponent(item.chapterId)}`;
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

function ActionDeadline({
  dueAt,
  language,
  t,
}: {
  readonly dueAt: string | null;
  readonly language: string;
  readonly t: Translate;
}) {
  if (!dueAt) return <span>{t(translations.dashboard.noDeadline)}</span>;

  return (
    <span>
      {new Intl.DateTimeFormat(language, {
        day: '2-digit',
        month: 'short',
      }).format(new Date(dueAt))}
    </span>
  );
}

function ActionItemRow({
  item,
  language,
  t,
}: {
  readonly item: DashboardActionItem;
  readonly language: string;
  readonly t: Translate;
}) {
  const meta = getActionMeta(item.type, t);
  const Icon = meta.icon;

  return (
    <Link
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-background p-3 transition-colors hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:ring-2 focus-visible:outline-none"
      to={getActionHref(item)}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-lg ${meta.tone}`}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {meta.label}
          </span>
          {item.stageName ? (
            <span className="text-xs text-muted-foreground">
              · {item.stageName}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block truncate font-medium">
          {item.chapterName}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {item.storyTitle}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-right text-xs text-muted-foreground">
        <span className="hidden text-right sm:block">
          {item.requestedHours !== null ? (
            <span className="block">
              {t(translations.dashboard.requestedHours, {
                count: item.requestedHours,
              })}
            </span>
          ) : null}
          <span className="mt-1 flex items-center justify-end gap-1">
            <CalendarClock className="size-3.5" />
            <ActionDeadline
              dueAt={item.dueAt}
              language={language}
              t={t}
            />
          </span>
        </span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function ActionItemsPanel({
  dashboard,
  language,
  t,
}: {
  readonly dashboard: AdminDashboard;
  readonly language: string;
  readonly t: Translate;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="border-b border-border/60 bg-muted/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{t(translations.dashboard.actionItems)}</CardTitle>
            <CardDescription>
              {t(translations.dashboard.actionItemsCount, {
                count: dashboard.actionItems.length,
              })}
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link to={ROUTES.TASKS}>
              {t(translations.dashboard.viewAll)}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        {dashboard.actionItems.length === 0 ? (
          <Empty className="min-h-64 border-0 p-4">
            <EmptyHeader>
              <EmptyMedia className="text-primary" variant="icon">
                <CheckCircle2 />
              </EmptyMedia>
              <EmptyTitle>{t(translations.dashboard.emptyActions)}</EmptyTitle>
              <EmptyDescription>
                {t(translations.dashboard.emptyActionsDescription)}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-2">
            {dashboard.actionItems.map((item) => (
              <ActionItemRow
                item={item}
                key={`${item.type}-${item.id}`}
                language={language}
                t={t}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AttentionSummary({
  dashboard,
  t,
}: {
  readonly dashboard: AdminDashboard;
  readonly t: Translate;
}) {
  const items = getAttentionItems(dashboard.attention, t);

  return (
    <Card>
      <CardHeader className="border-b border-border/60 bg-muted/20">
        <CardTitle>{t(translations.dashboard.summary)}</CardTitle>
        <CardDescription>{t(translations.dashboard.lastUpdated)}</CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-3">
        <div className="divide-y divide-border/60">
          {items.map(({ href, icon: Icon, label, tone, value }) => (
            <Link
              className="group flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:outline-none"
              key={label}
              to={href}
            >
              <Icon className={`size-4 shrink-0 ${tone}`} />
              <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
              <span className="font-heading text-lg font-semibold">{value}</span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StageProgress({
  stages,
  t,
}: {
  readonly stages: AdminDashboard['stages'];
  readonly t: Translate;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t(translations.dashboard.stageProgress)}</CardTitle>
      </CardHeader>
      <CardContent>
        {stages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t(translations.dashboard.emptyActionsDescription)}
          </p>
        ) : (
          <div className="space-y-5">
            {stages.map((stage) => {
              const percentage = stage.total
                ? Math.round((stage.completed / stage.total) * 100)
                : 0;
              return (
                <div key={stage.name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{stage.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {stage.completed}/{stage.total} · {percentage}%
                    </span>
                  </div>
                  <div
                    aria-label={`${stage.name}: ${percentage}%`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={percentage}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
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
  const points = useMemo(() => buildTrendPoints(progress), [progress]);
  const maxCompleted = Math.max(...points.map((point) => point.completed), 1);
  const totalCompleted = points.reduce(
    (total, point) => total + point.completed,
    0,
  );
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(language, { day: '2-digit', month: 'short' }),
    [language],
  );

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t(translations.dashboard.completedByDay)}</CardTitle>
        <CardDescription>
          {t(translations.dashboard.completedTotal, { count: totalCompleted })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-44 items-end gap-1" role="img">
          {points.map((point) => (
            <span
              aria-label={`${point.date}: ${point.completed}`}
              className="min-w-0 flex-1 rounded-t-md bg-primary/75 transition-[height] hover:bg-primary"
              key={point.date}
              style={{
                height: `${point.completed ? Math.max(8, (point.completed / maxCompleted) * 100) : 4}%`,
              }}
              title={`${point.date}: ${point.completed}`}
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>{dateFormatter.format(new Date(`${points[0].date}T00:00:00Z`))}</span>
          <span>
            {dateFormatter.format(
              new Date(`${points[Math.floor(points.length / 2)].date}T00:00:00Z`),
            )}
          </span>
          <span>
            {dateFormatter.format(
              new Date(`${points[points.length - 1].date}T00:00:00Z`),
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]">
        <Skeleton className="min-h-96" />
        <Skeleton className="min-h-96" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { i18n, t } = useTranslation();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const dashboardQuery = useDashboardQuery(workspaceId);

  return (
    <section className="space-y-6" aria-busy={dashboardQuery.isFetching}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t(translations.dashboard.pageTitle)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t(translations.dashboard.description)}
          </p>
        </div>
        <Button
          disabled={dashboardQuery.isFetching || !workspaceId}
          onClick={() => void dashboardQuery.refetch()}
          variant="outline"
        >
          {dashboardQuery.isFetching ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <RefreshCw />
          )}
          {dashboardQuery.isFetching
            ? t(translations.dashboard.refreshing)
            : t(translations.dashboard.refresh)}
        </Button>
      </div>

      {!workspaceId ? (
        <Empty className="min-h-80 border border-dashed bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldOff />
            </EmptyMedia>
            <EmptyTitle>{t(translations.dashboard.noWorkspace)}</EmptyTitle>
            <EmptyDescription>
              {t(translations.dashboard.noWorkspaceDescription)}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : dashboardQuery.isError ? (
        <Empty className="min-h-80 border border-destructive/20 bg-destructive/5">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle />
            </EmptyMedia>
            <EmptyTitle>{t(translations.dashboard.error)}</EmptyTitle>
            <EmptyDescription>{formatError(dashboardQuery.error)}</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => void dashboardQuery.refetch()} variant="outline">
            {t(translations.dashboard.retry)}
          </Button>
        </Empty>
      ) : dashboardQuery.isLoading || !dashboardQuery.data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]">
            <ActionItemsPanel
              dashboard={dashboardQuery.data}
              language={i18n.language}
              t={t}
            />
            <AttentionSummary dashboard={dashboardQuery.data} t={t} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <StageProgress stages={dashboardQuery.data.stages} t={t} />
            <CompletionTrend
              language={i18n.language}
              progress={dashboardQuery.data.progress}
              t={t}
            />
          </div>
        </>
      )}
    </section>
  );
}
