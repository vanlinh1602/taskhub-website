import { RefreshCw } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
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
import { useMembersQuery } from '@/features/members/hooks';
import {
  useBulkCompleteTasksMutation,
  useBulkUpdateTasksMutation,
} from '@/features/tasks/hooks';
import type {
  BulkTaskResult,
  TaskListItem,
  TaskManagerTaskStatus,
} from '@/features/tasks/types';
import {
  BULK_UNASSIGN_VALUE,
  canBulkAssignTask,
  canBulkChangeDeadline,
  canBulkChangeStatus,
  getBulkCompletableTasks,
  isMemberEligibleForStage,
  MAX_BULK_TASK_COUNT,
  type TaskBulkMode,
} from '@/features/tasks/utils';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const bulkStatuses: readonly TaskManagerTaskStatus[] = [
  'READY',
  'BLOCKED',
  'CANCELLED',
];

function parseDateTimeLocal(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function TaskBulkActionDialog({
  mode,
  onFinished,
  onOpenChange,
  tasks,
  workspaceId,
}: {
  readonly mode: TaskBulkMode | null;
  /** Called after a run with the ids that still need attention. */
  readonly onFinished: (failedTaskIds: readonly string[]) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly tasks: readonly TaskListItem[];
  readonly workspaceId: string;
}): ReactNode {
  const { t } = useTranslation();
  const [assignee, setAssignee] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [status, setStatus] = useState<TaskManagerTaskStatus>('READY');
  const [result, setResult] = useState<BulkTaskResult | null>(null);
  const bulkT = translations.management.tasks;

  const membersQuery = useMembersQuery(workspaceId, {
    enabled: mode === 'assign',
  });
  const updateMutation = useBulkUpdateTasksMutation(workspaceId);
  const completeMutation = useBulkCompleteTasksMutation(workspaceId);
  const isPending = updateMutation.isPending || completeMutation.isPending;

  useEffect(() => {
    setAssignee('');
    setDueAt('');
    setStatus('READY');
    setResult(null);
  }, [mode]);

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const assigneeOptions = useMemo(
    () =>
      members.filter((member) =>
        tasks.some((task) => isMemberEligibleForStage(member, task.stageCode)),
      ),
    [members, tasks],
  );
  const assigneeId =
    assignee === ''
      ? undefined
      : assignee === BULK_UNASSIGN_VALUE
        ? null
        : assignee;
  const eligibleTasks = useMemo((): readonly TaskListItem[] => {
    const matching = ((): readonly TaskListItem[] => {
      switch (mode) {
        case 'complete':
          return getBulkCompletableTasks(tasks);
        case 'assign':
          return assigneeId === undefined
            ? []
            : tasks.filter((task) =>
                canBulkAssignTask(task, assigneeId, members),
              );
        case 'deadline':
          return tasks.filter(canBulkChangeDeadline);
        case 'status':
          return tasks.filter((task) => canBulkChangeStatus(task, status));
        default:
          return [];
      }
    })();
    return matching.slice(0, MAX_BULK_TASK_COUNT);
  }, [assigneeId, members, mode, status, tasks]);
  const skippedCount = tasks.length - eligibleTasks.length;
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );

  const titles: Record<TaskBulkMode, string> = {
    assign: t(bulkT.bulkAssignTitle),
    complete: t(bulkT.bulkCompleteTitle),
    deadline: t(bulkT.bulkDeadlineTitle),
    status: t(bulkT.bulkStatusTitle),
  };
  const statusLabels: Record<TaskManagerTaskStatus, string> = {
    BLOCKED: t(translations.management.stories.taskStatusBlocked),
    CANCELLED: t(translations.management.stories.taskStatusCancelled),
    READY: t(translations.management.stories.taskStatusReady),
  };
  const dueAtIsInvalid = dueAt !== '' && parseDateTimeLocal(dueAt) === null;
  const hasRequiredInput =
    mode === 'complete' ||
    mode === 'status' ||
    (mode === 'assign' && assigneeId !== undefined) ||
    (mode === 'deadline' && dueAt !== '' && !dueAtIsInvalid);

  function finish(outcome: BulkTaskResult): void {
    if (outcome.failed.length === 0) {
      toast.success(
        t(bulkT.bulkSuccess, { count: outcome.succeededIds.length }),
      );
      onOpenChange(false);
      onFinished([]);
      return;
    }
    if (outcome.succeededIds.length > 0)
      toast.success(
        t(bulkT.bulkSuccess, { count: outcome.succeededIds.length }),
      );
    setResult(outcome);
  }

  function submit(): void {
    if (!mode || eligibleTasks.length === 0 || !hasRequiredInput) return;
    const taskIds = eligibleTasks.map((task) => task.id);
    const callbacks = {
      onError: (error: Error) => toast.error(formatError(error)),
      onSuccess: finish,
    };
    if (mode === 'complete') {
      completeMutation.mutate(taskIds, callbacks);
      return;
    }
    updateMutation.mutate(
      {
        taskIds,
        ...(mode === 'assign' && assigneeId !== undefined
          ? { assigneeDiscordUserId: assigneeId }
          : {}),
        ...(mode === 'deadline' ? { dueAt: parseDateTimeLocal(dueAt) } : {}),
        ...(mode === 'status' ? { status } : {}),
      },
      callbacks,
    );
  }

  function handleOpenChange(open: boolean): void {
    if (isPending) return;
    if (!open && result) onFinished(result.failed.map((item) => item.taskId));
    onOpenChange(open);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={mode !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode ? titles[mode] : ''}</DialogTitle>
        </DialogHeader>
        {result ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-destructive" role="alert">
              {t(bulkT.bulkPartialFailure, {
                failed: result.failed.length,
                total: result.failed.length + result.succeededIds.length,
              })}
            </p>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {result.failed.map((failure) => {
                const task = taskById.get(failure.taskId);
                return (
                  <li
                    className="rounded-xl bg-muted/50 px-3 py-2 text-sm"
                    key={failure.taskId}
                  >
                    <p className="font-semibold">
                      #{failure.taskId}
                      {task
                        ? ` · ${task.storyTitle} · ${task.chapterName}`
                        : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {failure.message}
                    </p>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground">
              {t(bulkT.bulkFailedStaySelected)}
            </p>
            <Button
              className="w-full"
              onClick={() => handleOpenChange(false)}
              type="button"
            >
              {t(bulkT.bulkClose)}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {mode === 'assign' ? (
              <div className="space-y-2">
                <Label htmlFor="bulk-assignee">
                  {t(translations.management.stories.assignee)}
                </Label>
                <Select onValueChange={setAssignee} value={assignee}>
                  <SelectTrigger className="w-full" id="bulk-assignee">
                    <SelectValue placeholder={t(bulkT.bulkChooseAssignee)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BULK_UNASSIGN_VALUE}>
                      {t(bulkT.bulkUnassign)}
                    </SelectItem>
                    {assigneeOptions.map((member) => (
                      <SelectItem
                        key={member.discordUserId}
                        value={member.discordUserId}
                      >
                        {member.displayName}
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
                <p className="text-xs text-muted-foreground">
                  {t(bulkT.bulkAssignHint)}
                </p>
              </div>
            ) : null}
            {mode === 'deadline' ? (
              <div className="space-y-2">
                <Label htmlFor="bulk-deadline">
                  {t(translations.management.stories.dueAt)}
                </Label>
                <Input
                  id="bulk-deadline"
                  onChange={(event) => setDueAt(event.target.value)}
                  step="60"
                  type="datetime-local"
                  value={dueAt}
                />
                {dueAtIsInvalid ? (
                  <p className="text-xs text-destructive">
                    {t(translations.management.stories.taskDeadlineInvalid)}
                  </p>
                ) : null}
              </div>
            ) : null}
            {mode === 'status' ? (
              <div className="space-y-2">
                <Label htmlFor="bulk-status">
                  {t(translations.management.stories.status)}
                </Label>
                <Select
                  onValueChange={(value) =>
                    setStatus(value as TaskManagerTaskStatus)
                  }
                  value={status}
                >
                  <SelectTrigger className="w-full" id="bulk-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bulkStatuses.map((item) => (
                      <SelectItem key={item} value={item}>
                        {statusLabels[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {mode === 'complete' ? (
              <p className="text-sm text-muted-foreground">
                {t(translations.management.stories.completeTaskDescription)}
              </p>
            ) : null}

            <div
              aria-live="polite"
              className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm"
            >
              <p className="font-semibold">
                {t(bulkT.bulkApplicable, {
                  applicable: eligibleTasks.length,
                  total: tasks.length,
                })}
              </p>
              {skippedCount > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t(bulkT.bulkSkipped, { count: skippedCount })}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
                type="button"
                variant="outline"
              >
                {t(translations.management.stories.cancel)}
              </Button>
              <Button
                disabled={
                  isPending || eligibleTasks.length === 0 || !hasRequiredInput
                }
                onClick={submit}
                type="button"
              >
                {isPending ? (
                  <RefreshCw aria-hidden="true" className="animate-spin" />
                ) : null}
                {t(bulkT.bulkApply, { count: eligibleTasks.length })}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
