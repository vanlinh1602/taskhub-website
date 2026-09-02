import { CircleMinus, RefreshCw } from 'lucide-react';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMembersQuery } from '@/features/members/hooks';
import {
  useDeductTaskMutation,
  useUpdateTaskMutation,
} from '@/features/tasks/hooks';
import type {
  DeductTaskInput,
  TaskActionTarget,
  TaskAssignee,
  TaskManagerTaskStatus,
  UpdateTaskInput,
} from '@/features/tasks/types';
import { filterTaskAssignees } from '@/features/tasks/utils/filter-task-assignees';
import {
  canDeductTask,
  hasDeductionReason,
  isValidDeductionAmount,
  isValidTaskPrice,
} from '@/features/tasks/utils/task-validation';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const managerTaskStatuses: readonly TaskManagerTaskStatus[] = [
  'BLOCKED',
  'READY',
  'CANCELLED',
];
const unassignedValue = '__UNASSIGNED__';

export type TaskActionMode = 'edit' | 'deduct';

export default function TaskActionDialogs({
  mode,
  onOpenChange,
  target,
  workspaceId,
}: {
  readonly mode: TaskActionMode | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly target: TaskActionTarget | null;
  readonly workspaceId: string;
}): ReactNode {
  const { i18n, t } = useTranslation();
  const [taskStatus, setTaskStatus] = useState<TaskManagerTaskStatus>('READY');
  const [taskStatusDirty, setTaskStatusDirty] = useState(false);
  const [taskPrice, setTaskPrice] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(unassignedValue);
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionReason, setDeductionReason] = useState('');
  const [deductionEvidenceUrl, setDeductionEvidenceUrl] = useState('');

  const membersQuery = useMembersQuery(workspaceId, {
    enabled: mode === 'edit' && target !== null,
  });
  const taskMutation = useUpdateTaskMutation(
    workspaceId,
    target?.storyId ?? '',
    target?.chapterId ?? '',
  );
  const deductionMutation = useDeductTaskMutation(
    workspaceId,
    target?.storyId ?? '',
    target?.chapterId ?? '',
  );
  const taskAssignees = useMemo(
    () => filterTaskAssignees(membersQuery.data ?? [], target),
    [membersQuery.data, target],
  );
  const assigneeOptions = useMemo((): readonly TaskAssignee[] => {
    if (!target?.assigneeDiscordUserId) return taskAssignees;
    if (
      taskAssignees.some(
        (option) => option.discordUserId === target.assigneeDiscordUserId,
      )
    ) {
      return taskAssignees;
    }
    return [
      {
        discordUserId: target.assigneeDiscordUserId,
        displayName: target.assigneeDisplayName,
      },
      ...taskAssignees,
    ];
  }, [target, taskAssignees]);

  useEffect(() => {
    if (!target) return;
    setTaskStatus(
      managerTaskStatuses.includes(target.status as TaskManagerTaskStatus)
        ? (target.status as TaskManagerTaskStatus)
        : 'READY',
    );
    setTaskStatusDirty(false);
    setTaskPrice(target.agreedPrice ?? '');
    setTaskAssignee(target.assigneeDiscordUserId ?? unassignedValue);
    setDeductionAmount('');
    setDeductionReason('');
    setDeductionEvidenceUrl('');
  }, [mode, target]);

  function submitTask(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!target) return;
    if (!isValidTaskPrice(taskPrice)) {
      toast.error(t(translations.management.stories.taskPriceInvalid));
      return;
    }
    const previousAssignee = target.assigneeDiscordUserId;
    const nextAssignee =
      taskAssignee === unassignedValue ? null : taskAssignee;
    const input: UpdateTaskInput =
      nextAssignee !== previousAssignee
        ? { agreedPrice: taskPrice, assigneeDiscordUserId: nextAssignee }
        : taskStatusDirty
          ? { agreedPrice: taskPrice, status: taskStatus }
          : { agreedPrice: taskPrice };

    taskMutation.mutate(
      { input, taskId: target.id },
      {
        onError: (error: Error) => toast.error(formatError(error)),
        onSuccess: () => {
          onOpenChange(false);
          toast.success(t(translations.management.stories.taskSaved));
        },
      },
    );
  }

  function submitDeduction(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!target || !canDeductTask(target.paymentStatus)) return;
    if (!isValidDeductionAmount(deductionAmount)) {
      toast.error(t(translations.management.stories.deductionAmountInvalid));
      return;
    }
    if (!hasDeductionReason(deductionReason)) {
      toast.error(t(translations.management.stories.deductReasonRequired));
      return;
    }
    const input: DeductTaskInput = {
      amount: deductionAmount,
      reason: deductionReason,
      ...(deductionEvidenceUrl.trim()
        ? { evidenceUrl: deductionEvidenceUrl.trim() }
        : {}),
    };
    deductionMutation.mutate(
      { input, taskId: target.id },
      {
        onError: (error: Error) => toast.error(formatError(error)),
        onSuccess: () => {
          onOpenChange(false);
          toast.success(t(translations.management.stories.deductionSaved));
        },
      },
    );
  }

  return (
    <>
      <Dialog
        open={mode === 'edit' && target !== null}
        onOpenChange={onOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(translations.management.stories.editTask)}
            </DialogTitle>
          </DialogHeader>
          {target ? (
            <form className="space-y-4" onSubmit={submitTask}>
              <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                <p className="font-semibold">{target.stageName}</p>
                <p className="text-xs text-muted-foreground">
                  {t(translations.management.stories.taskId, {
                    id: target.id,
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-edit-status">
                  {t(translations.management.stories.status)}
                </Label>
                <Select
                  value={taskStatus}
                  onValueChange={(value) => {
                    setTaskStatus(value as TaskManagerTaskStatus);
                    setTaskStatusDirty(true);
                  }}
                >
                  <SelectTrigger id="task-edit-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {managerTaskStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getTaskStatusLabel(t, status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-edit-price">
                  {t(translations.management.stories.agreedPrice)}
                </Label>
                <Input
                  id="task-edit-price"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setTaskPrice(event.target.value)}
                  step="0.01"
                  type="number"
                  value={taskPrice}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t(translations.management.stories.taskPriceHint)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-edit-assignee">
                  {t(translations.management.stories.assignee)}
                </Label>
                <Select
                  value={taskAssignee}
                  onValueChange={(value) => {
                    setTaskAssignee(value);
                    if (value === unassignedValue) setTaskStatus('READY');
                  }}
                >
                  <SelectTrigger id="task-edit-assignee" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={unassignedValue}>
                      {t(translations.management.stories.unassigned)}
                    </SelectItem>
                    {assigneeOptions.map((option) => (
                      <SelectItem
                        key={option.discordUserId}
                        value={option.discordUserId}
                      >
                        {option.displayName ?? option.discordUserId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {membersQuery.isLoading ? (
                  <p className="text-xs text-muted-foreground">
                    {t(translations.management.stories.loadingAssignees)}
                  </p>
                ) : null}
                {membersQuery.isError ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    <span>{formatError(membersQuery.error)}</span>
                    <Button
                      onClick={() => void membersQuery.refetch()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {t(translations.management.stories.retry)}
                    </Button>
                  </div>
                ) : null}
                {taskAssignee !== unassignedValue &&
                taskAssignee !== target.assigneeDiscordUserId ? (
                  <p className="text-xs text-primary">
                    {t(translations.management.stories.assigneeWillStart)}
                  </p>
                ) : null}
                {taskAssignee === unassignedValue &&
                target.assigneeDiscordUserId ? (
                  <p className="text-xs text-muted-foreground">
                    {t(translations.management.stories.unassignWillReady)}
                  </p>
                ) : null}
              </div>
              <Button
                className="w-full"
                disabled={taskMutation.isPending}
                type="submit"
              >
                {taskMutation.isPending ? (
                  <RefreshCw aria-hidden="true" className="animate-spin" />
                ) : null}
                {t(translations.management.stories.save)}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={mode === 'deduct' && target !== null}
        onOpenChange={onOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(translations.management.stories.deductMoneyTitle)}
            </DialogTitle>
          </DialogHeader>
          {target ? (
            <form className="space-y-4" onSubmit={submitDeduction}>
              <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                <p className="font-semibold">{target.stageName}</p>
                <p className="text-xs text-muted-foreground">
                  {t(translations.management.stories.taskId, { id: target.id })}
                  {' · '}
                  {t(translations.management.stories.agreedPrice)}:{' '}
                  {formatMoney(target.agreedPrice, target.currency, i18n.language)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t(translations.management.stories.deductMoneyDescription)}
              </p>
              <div className="space-y-2">
                <Label htmlFor="task-deduction-amount">
                  {t(translations.management.stories.deductAmount)}
                </Label>
                <Input
                  id="task-deduction-amount"
                  inputMode="decimal"
                  min="0.01"
                  onChange={(event) => setDeductionAmount(event.target.value)}
                  step="0.01"
                  type="number"
                  value={deductionAmount}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t(translations.management.stories.deductAmountHint)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-deduction-reason">
                  {t(translations.management.stories.deductReason)}
                </Label>
                <Textarea
                  id="task-deduction-reason"
                  maxLength={1000}
                  onChange={(event) => setDeductionReason(event.target.value)}
                  value={deductionReason}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-deduction-evidence">
                  {t(translations.management.stories.deductEvidenceUrl)}
                </Label>
                <Input
                  id="task-deduction-evidence"
                  onChange={(event) =>
                    setDeductionEvidenceUrl(event.target.value)
                  }
                  placeholder="https://discord.com/channels/..."
                  type="url"
                  value={deductionEvidenceUrl}
                />
                <p className="text-xs text-muted-foreground">
                  {t(translations.management.stories.deductEvidenceHint)}
                </p>
              </div>
              <Button
                className="w-full"
                disabled={deductionMutation.isPending}
                type="submit"
                variant="destructive"
              >
                {deductionMutation.isPending ? (
                  <RefreshCw aria-hidden="true" className="animate-spin" />
                ) : (
                  <CircleMinus aria-hidden="true" />
                )}
                {t(translations.management.stories.deductSubmit)}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatMoney(
  amount: string | null,
  currency: string,
  language: string,
): string {
  if (amount === null) return '-';
  try {
    return new Intl.NumberFormat(language, {
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
      style: 'currency',
    }).format(Number(amount));
  } catch {
    return `${amount} ${currency}`;
  }
}

function getTaskStatusLabel(
  t: ReturnType<typeof useTranslation>['t'],
  status: TaskManagerTaskStatus,
): string {
  return status === 'BLOCKED'
    ? t(translations.management.stories.taskStatusBlocked)
    : status === 'READY'
      ? t(translations.management.stories.taskStatusReady)
      : t(translations.management.stories.taskStatusCancelled);
}
