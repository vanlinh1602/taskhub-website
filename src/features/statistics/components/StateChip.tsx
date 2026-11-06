import {
  Ban,
  CheckCircle2,
  Circle,
  CircleDot,
  Loader,
  XCircle,
} from 'lucide-react';
import type { ComponentType } from 'react';

import type { StatisticsTaskStatus } from '@/features/statistics/types';

const TASK_STATUS_CHIP: Record<
  StatisticsTaskStatus,
  { readonly className: string; readonly icon: typeof Circle }
> = {
  BLOCKED: { className: 'bg-destructive/10 text-destructive', icon: Ban },
  READY: { className: 'bg-muted text-muted-foreground', icon: CircleDot },
  IN_PROGRESS: { className: 'bg-primary/10 text-link', icon: Loader },
  COMPLETED: {
    className: 'bg-positive-surface text-positive',
    icon: CheckCircle2,
  },
  CANCELLED: { className: 'bg-muted text-muted-foreground', icon: XCircle },
};

export function TaskStatusChip({
  label,
  status,
}: {
  readonly label: string;
  readonly status: StatisticsTaskStatus;
}) {
  const { className, icon: Icon } = TASK_STATUS_CHIP[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full py-0.5 pr-2 pl-1.5 text-[0.6875rem] leading-4 font-bold ${className}`}
    >
      <Icon aria-hidden="true" className="size-3" />
      {label}
    </span>
  );
}

export function StatusMark({
  done,
  label,
}: {
  readonly done: boolean;
  readonly label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      {done ? (
        <CheckCircle2 aria-hidden="true" className="size-3.5 text-positive" />
      ) : (
        <Circle aria-hidden="true" className="size-3.5 text-muted-foreground" />
      )}
      {label}
    </span>
  );
}

export function StateChip({
  doneLabel,
  icon: Icon,
  isDone,
  pendingLabel,
}: {
  readonly doneLabel: string;
  readonly icon: ComponentType<{
    readonly className?: string;
    readonly 'aria-hidden'?: boolean | 'true' | 'false';
  }>;
  readonly isDone: boolean;
  readonly pendingLabel: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full py-0.5 pr-2 pl-1.5 text-[0.6875rem] leading-4 font-bold ${isDone ? 'bg-positive-surface text-positive' : 'bg-muted text-muted-foreground'}`}
    >
      <Icon aria-hidden="true" className="size-3" />
      {isDone ? doneLabel : pendingLabel}
    </span>
  );
}
