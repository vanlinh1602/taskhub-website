import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Banknote,
  Clock3,
  GitPullRequest,
  Layers3,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboard } from '@/features/admin/apis';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard', workspaceId],
    queryFn: () => getDashboard(workspaceId),
    enabled: workspaceId.length > 0,
  });

  const cards = dashboardQuery.data
    ? [
        {
          icon: Clock3,
          label: t(translations.dashboard.overdue),
          value: dashboardQuery.data.attention.overdueTasks,
        },
        {
          icon: AlertCircle,
          label: t(translations.dashboard.blocked),
          value: dashboardQuery.data.attention.blockedTasks,
        },
        {
          icon: GitPullRequest,
          label: t(translations.dashboard.extensions),
          value: dashboardQuery.data.attention.pendingExtensions,
        },
        {
          icon: Banknote,
          label: t(translations.dashboard.payments),
          value: dashboardQuery.data.attention.pendingPayments,
        },
        {
          icon: Layers3,
          label: t(translations.dashboard.publishing),
          value: dashboardQuery.data.attention.readyToPublish,
        },
      ]
    : [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {t(translations.dashboard.eyebrow)}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t(translations.dashboard.title)}
          </h2>
        </div>
      </div>
      {dashboardQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : null}
      {dashboardQuery.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map(({ icon: Icon, label, value }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-extrabold">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t(translations.dashboard.stageProgress)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardQuery.data.stages.map((stage) => (
                  <div key={stage.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{stage.name}</span>
                      <span>
                        {stage.completed}/{stage.total}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${stage.total ? (stage.completed / stage.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t(translations.dashboard.completedByDay)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardQuery.data.progress.map((item) => (
                  <div key={item.date} className="flex justify-between text-sm">
                    <span>{item.date}</span>
                    <strong>{item.completed}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  );
}
