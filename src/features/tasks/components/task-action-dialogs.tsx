import { CheckCircle2, CircleMinus, RefreshCw } from 'lucide-react';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import MoneyInput from '@/components/MoneyInput';
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
  useCompleteTaskMutation,
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
import { canCompleteTask } from '@/features/tasks/utils/task-state';
import {
  canDeductTask,
  hasDeductionReason,
  isValidDeductionAmount,
  isValidTaskPrice,
} from '@/features/tasks/utils/task-validation';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';
import { formatMoney } from '@/utils/money';

const managerTaskStatuses: readonly TaskManagerTaskStatus[] = [
  'BLOCKED',
  'READY',
  'CANCELLED',
];
const unassignedValue = '__UNASSIGNED__';

export type TaskActionMode = 'edit' | 'deduct' | 'complete';

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
  const [taskDueAt, setTaskDueAt] = useState('');
  const [taskDueAtDirty, setTaskDueAtDirty] = useState(false);
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
  const completionMutation = useCompleteTaskMutation(
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
    setTaskDueAt(formatDateTimeLocal(target.dueAt));
    setTaskDueAtDirty(false);
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
    if (taskDueAtDirty && taskDueAt && !parseDateTimeLocal(taskDueAt)) {
      toast.error(t(translations.management.stories.taskDeadlineInvalid));
      return;
    }
    const previousAssignee = target.assigneeDiscordUserId;
    const nextAssignee =
      taskAssignee === unassignedValue ? null : taskAssignee;
    const input: UpdateTaskInput = {
      agreedPrice: taskPrice,
      ...(taskDueAtDirty
        ? { dueAt: taskDueAt ? parseDateTimeLocal(taskDueAt) : null }
        : {}),
      ...(nextAssignee !== previousAssignee
        ? { assigneeDiscordUserId: nextAssignee }
        : {}),
      ...(taskStatusDirty &&
      (nextAssignee === previousAssignee || taskStatus === 'READY')
        ? { status: taskStatus }
        : {}),
    };

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

  function submitCompletion(): void {
    if (!target || !canCompleteTask(target)) return;
    completionMutation.mutate(
      { taskId: target.id },
      {
        onError: (error: Error) => toast.error(formatError(error)),
        onSuccess: () => {
          onOpenChange(false);
          toast.success(t(translations.management.stories.taskCompleted));
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
                <Label htmlFor="task-edit-deadline">
                  {t(translations.management.stories.dueAt)}
                </Label>
                <Input
                  id="task-edit-deadline"
                  onChange={(event) => {
                    setTaskDueAt(event.target.value);
                    setTaskDueAtDirty(true);
                  }}
                  step="60"
                  type="datetime-local"
                  value={taskDueAt}
                />
                <p className="text-xs text-muted-foreground">
                  {t(translations.management.stories.taskDueAtHint)}
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
                <MoneyInput
                  id="task-edit-price"
                  language={i18n.language}
                  onValueChange={setTaskPrice}
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
        open={mode === 'complete' && target !== null}
        onOpenChange={onOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(translations.management.stories.completeTaskTitle)}
            </DialogTitle>
          </DialogHeader>
          {target ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                <p className="font-semibold">{target.stageName}</p>
                <p className="text-xs text-muted-foreground">
                  {t(translations.management.stories.taskId, { id: target.id })}
                  {' · '}
                  {target.assigneeDisplayName ?? target.assigneeDiscordUserId}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t(translations.management.stories.completeTaskDescription)}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  disabled={completionMutation.isPending}
                  onClick={() => onOpenChange(false)}
                  type="button"
                  variant="outline"
                >
                  {t(translations.management.stories.cancel)}
                </Button>
                <Button
                  disabled={
                    completionMutation.isPending || !canCompleteTask(target)
                  }
                  onClick={submitCompletion}
                  type="button"
                >
                  {completionMutation.isPending ? (
                    <RefreshCw aria-hidden="true" className="animate-spin" />
                  ) : (
                    <CheckCircle2 aria-hidden="true" />
                  )}
                  {t(translations.management.stories.completeTaskSubmit)}
                </Button>
              </div>
            </div>
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
                <MoneyInput
                  id="task-deduction-amount"
                  language={i18n.language}
                  onValueChange={setDeductionAmount}
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

function formatDateTimeLocal(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number): string => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDateTimeLocal(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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
