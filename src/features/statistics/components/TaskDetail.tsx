import { CheckCircle2, CircleMinus, Settings2 } from 'lucide-react';
import type { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  StatisticsStageColumn,
  StatisticsTaskCell,
  StatisticsTaskStatus,
} from '@/features/statistics/types';
import {
  formatDate,
  paymentLabel,
  statusLabel,
} from '@/features/statistics/utils/labels';
import { canCompleteTask } from '@/features/tasks/utils';
import { translations } from '@/locales/translations';
import { formatMoney } from '@/utils/money';

export interface SelectedTask {
  readonly cell: StatisticsTaskCell;
  readonly chapterName: string;
  readonly stage: StatisticsStageColumn;
  readonly storyTitle: string;
}

const STATUS_CLASS: Readonly<Record<StatisticsTaskStatus, string>> = {
  BLOCKED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-destructive/10 text-destructive',
  COMPLETED: 'bg-positive-surface text-positive',
  IN_PROGRESS: 'bg-primary/10 text-link',
  READY: 'bg-primary/10 text-link',
};

function Chip({
  children,
  className,
}: {
  readonly children: string;
  readonly className: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

export function TaskDetail({
  language,
  onComplete,
  onDeduct,
  onEdit,
  selected,
  t,
}: {
  readonly language: string;
  readonly onComplete: () => void;
  readonly onDeduct: () => void;
  readonly onEdit: () => void;
  readonly selected: SelectedTask;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const { cell, chapterName, stage, storyTitle } = selected;
  const noDate = t(translations.statistics.noDate);
  const assignee =
    cell.assigneeDisplayName ??
    cell.assigneeDiscordUserId ??
    t(translations.statistics.unassigned);
  const isUnassigned = !cell.assigneeDisplayName && !cell.assigneeDiscordUserId;
  const isPaid = cell.paymentStatus === 'PAID';
  const timeline = [
    { label: t(translations.statistics.createdAt), value: cell.createdAt },
    { label: t(translations.statistics.dueAt), value: cell.dueAt },
    { label: t(translations.statistics.completedAt), value: cell.completedAt },
    { label: t(translations.statistics.paidAt), value: cell.paidAt },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="gap-1 border-b border-border/60 px-6 pt-6 pr-14 pb-5">
        <p className="text-xs font-bold tracking-[0.12em] text-link uppercase">
          {stage.name}
        </p>
        <DialogTitle className="text-2xl leading-tight font-extrabold break-words">
          {chapterName}
        </DialogTitle>
        <DialogDescription className="break-words">
          {storyTitle}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <section className="rounded-2xl border border-border/70 bg-muted/30 p-5">
          <p className="text-xs font-semibold text-muted-foreground">
            {t(translations.statistics.price)}
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-link tabular-nums">
            {formatMoney(cell.agreedPrice, cell.currency, language)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip className={STATUS_CLASS[cell.taskStatus]}>
              {statusLabel(cell.taskStatus, t)}
            </Chip>
            <Chip
              className={
                isPaid
                  ? 'bg-positive-surface text-positive'
                  : 'bg-muted text-muted-foreground'
              }
            >
              {paymentLabel(cell.paymentStatus, t)}
            </Chip>
          </div>
        </section>

        <section className="flex items-center gap-3">
          {cell.assigneeAvatarUrl ? (
            <img
              alt=""
              className="size-11 shrink-0 rounded-full object-cover"
              referrerPolicy="no-referrer"
              src={cell.assigneeAvatarUrl}
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-link uppercase"
            >
              {isUnassigned ? '?' : assignee.charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">
              {t(translations.statistics.assigneeValue)}
            </p>
            <p
              className={`truncate text-base font-bold ${isUnassigned ? 'text-muted-foreground italic' : ''}`}
            >
              {assignee}
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
            {t(translations.statistics.timeline)}
          </h3>
          <ol className="mt-3 space-y-0">
            {timeline.map((step, index) => (
              <li className="flex gap-3" key={step.label}>
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ${step.value ? 'bg-primary' : 'border-2 border-border bg-card'}`}
                  />
                  {index < timeline.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="my-1 w-px flex-1 bg-border"
                    />
                  ) : null}
                </div>
                <div className="pb-4">
                  <p className="text-xs text-muted-foreground">{step.label}</p>
                  <p
                    className={`text-sm font-semibold ${step.value ? '' : 'text-muted-foreground'}`}
                  >
                    {formatDate(step.value, language, noDate)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="font-mono text-xs text-muted-foreground">
          {t(translations.statistics.taskId)} #{cell.taskId}
        </p>
      </div>

      <div className="grid gap-2 border-t border-border/60 bg-card px-6 py-4 sm:grid-cols-[1fr_auto]">
        <Button
          disabled={
            !canCompleteTask({
              assigneeDiscordUserId: cell.assigneeDiscordUserId,
              dueAt: cell.dueAt,
              status: cell.taskStatus,
            })
          }
          onClick={onComplete}
          size="lg"
          type="button"
        >
          <CheckCircle2 aria-hidden="true" />
          {t(translations.management.stories.completeTask)}
        </Button>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button onClick={onEdit} size="lg" type="button" variant="outline">
            <Settings2 aria-hidden="true" />
            {t(translations.management.stories.editTask)}
          </Button>
          <Button
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isPaid}
            onClick={onDeduct}
            size="lg"
            type="button"
            variant="outline"
          >
            <CircleMinus aria-hidden="true" />
            {t(translations.management.stories.deductMoney)}
          </Button>
        </div>
      </div>
    </div>
  );
}
