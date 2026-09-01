import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  CircleMinus,
  Clock3,
  ExternalLink,
  FileText,
  ListChecks,
  RefreshCw,
  Send,
  Settings2,
  Upload,
  UserRound,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useChapterQuery,
  useDeductChapterTaskMutation,
  useNotifyChapterProgressMutation,
  useUpdateChapterConfigurationMutation,
  useUpdateChapterPublicationMutation,
  useUpdateChapterTaskMutation,
} from '@/features/chapters/hooks';
import type {
  Chapter,
  ChapterAssignee,
  ChapterDifficulty,
  ChapterManagerTaskStatus,
  ChapterPaymentStatus,
  ChapterTask,
  ChapterTaskStatus,
  ChapterWorkflowStatus,
  DeductChapterTaskInput,
  UpdateChapterTaskInput,
} from '@/features/chapters/types';
import { filterTaskAssignees } from '@/features/chapters/utils';
import { useMembersQuery } from '@/features/members/hooks';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const terminalTaskStatuses: readonly ChapterTaskStatus[] = [
  'COMPLETED',
  'CANCELLED',
];
const emptyTasks: readonly ChapterTask[] = [];
const chapterDifficulties: readonly ChapterDifficulty[] = [
  'NORMAL',
  'HARD',
  'VERY_HARD',
];
const managerTaskStatuses: readonly ChapterManagerTaskStatus[] = [
  'BLOCKED',
  'READY',
  'CANCELLED',
];
const unassignedValue = '__UNASSIGNED__';

export default function ChapterDetailPage(): ReactNode {
  const { i18n, t } = useTranslation();
  const { storyId = '', chapterId = '' } = useParams();
  const { activeWorkspaceId: workspaceId } = useWorkspaceStore();
  const [isChapterEditorOpen, setIsChapterEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ChapterTask | null>(null);
  const [chapterDifficulty, setChapterDifficulty] =
    useState<ChapterDifficulty>('NORMAL');
  const [chapterPriority, setChapterPriority] =
    useState<Chapter['priority']>('NORMAL');
  const [chapterAdultContent, setChapterAdultContent] = useState(false);
  const [taskStatus, setTaskStatus] =
    useState<ChapterManagerTaskStatus>('READY');
  const [taskStatusDirty, setTaskStatusDirty] = useState(false);
  const [taskPrice, setTaskPrice] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(unassignedValue);
  const [deductionTask, setDeductionTask] = useState<ChapterTask | null>(null);
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionReason, setDeductionReason] = useState('');
  const [deductionEvidenceUrl, setDeductionEvidenceUrl] = useState('');
  const chapterQuery = useChapterQuery(workspaceId, storyId, chapterId);
  const membersQuery = useMembersQuery(workspaceId, {
    enabled: Boolean(editingTask),
  });
  const taskAssignees = useMemo(
    () => filterTaskAssignees(membersQuery.data ?? [], editingTask),
    [editingTask, membersQuery.data],
  );
  const chapterMutation = useUpdateChapterConfigurationMutation(
    workspaceId,
    storyId,
  );
  const taskMutation = useUpdateChapterTaskMutation(
    workspaceId,
    storyId,
    chapterId,
  );
  const deductionMutation = useDeductChapterTaskMutation(
    workspaceId,
    storyId,
    chapterId,
  );
  const progressMutation = useNotifyChapterProgressMutation(
    workspaceId,
    storyId,
    chapterId,
  );
  const publicationMutation = useUpdateChapterPublicationMutation(
    workspaceId,
    storyId,
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [i18n.language],
  );
  const detail = chapterQuery.data;
  const tasks = detail?.tasks ?? emptyTasks;
  const taskSummary = useMemo(() => summarizeTasks(tasks), [tasks]);
  const compactDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    [i18n.language],
  );
  const storyPath = `/stories/${encodeURIComponent(storyId)}`;

  function openChapterEditor(): void {
    if (!detail) return;
    setChapterDifficulty(detail.chapter.difficulty);
    setChapterPriority(detail.chapter.priority);
    setChapterAdultContent(detail.chapter.hasAdultContent);
    setIsChapterEditorOpen(true);
  }

  function openTaskEditor(task: ChapterTask): void {
    setEditingTask(task);
    setTaskStatus(
      managerTaskStatuses.includes(task.status as ChapterManagerTaskStatus)
        ? (task.status as ChapterManagerTaskStatus)
        : 'READY',
    );
    setTaskStatusDirty(false);
    setTaskPrice(task.agreedPrice ?? '');
    setTaskAssignee(task.assignee?.discordUserId ?? unassignedValue);
  }

  function openTaskDeduction(task: ChapterTask): void {
    if (task.paymentStatus === 'PAID') return;
    setDeductionTask(task);
    setDeductionAmount('');
    setDeductionReason('');
    setDeductionEvidenceUrl('');
  }

  function submitChapter(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    chapterMutation.mutate(
      {
        chapterId,
        input: {
          difficulty: chapterDifficulty,
          priority: chapterPriority,
          hasAdultContent: chapterAdultContent,
        },
      },
      {
        onSuccess: () => {
          setIsChapterEditorOpen(false);
          toast.success(t(translations.management.stories.save));
        },
        onError: (error: Error) => toast.error(formatError(error)),
      },
    );
  }

  function submitTask(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!editingTask) return;
    if (!/^\d+(?:\.\d{1,2})?$/.test(taskPrice)) {
      toast.error(t(translations.management.stories.taskPriceInvalid));
      return;
    }
    const previousAssignee = editingTask.assignee?.discordUserId ?? null;
    const nextAssignee = taskAssignee === unassignedValue ? null : taskAssignee;
    const input: UpdateChapterTaskInput =
      nextAssignee !== previousAssignee
        ? { agreedPrice: taskPrice, assigneeDiscordUserId: nextAssignee }
        : taskStatusDirty
          ? { agreedPrice: taskPrice, status: taskStatus }
          : { agreedPrice: taskPrice };
    taskMutation.mutate(
      { taskId: editingTask.id, input },
      {
        onSuccess: () => {
          setEditingTask(null);
          toast.success(t(translations.management.stories.taskSaved));
        },
        onError: (error: Error) => toast.error(formatError(error)),
      },
    );
  }

  function submitDeduction(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!deductionTask) return;
    if (!/^\d+(?:\.\d{1,2})?$/.test(deductionAmount) || Number(deductionAmount) <= 0) {
      toast.error(t(translations.management.stories.deductionAmountInvalid));
      return;
    }
    if (!deductionReason.trim()) {
      toast.error(t(translations.management.stories.deductReasonRequired));
      return;
    }
    const input: DeductChapterTaskInput = {
      amount: deductionAmount,
      reason: deductionReason,
      ...(deductionEvidenceUrl.trim()
        ? { evidenceUrl: deductionEvidenceUrl.trim() }
        : {}),
    };
    deductionMutation.mutate(
      { taskId: deductionTask.id, input },
      {
        onSuccess: () => {
          setDeductionTask(null);
          toast.success(t(translations.management.stories.deductionSaved));
        },
        onError: (error: Error) => toast.error(formatError(error)),
      },
    );
  }

  function notifyProgress(): void {
    progressMutation.mutate(undefined, {
      onSuccess: () =>
        toast.success(t(translations.management.stories.notifyProgressSuccess)),
      onError: (error: Error) => toast.error(formatError(error)),
    });
  }

  function togglePublication(): void {
    if (!detail) return;
    const isPublished = detail.chapter.publicationStatus === 'PUBLISHED';
    publicationMutation.mutate(
      {
        chapterId,
        publicationStatus: isPublished ? 'UNPUBLISHED' : 'PUBLISHED',
      },
      {
        onSuccess: () =>
          toast.success(
            t(
              isPublished
                ? translations.management.stories.unpublished
                : translations.management.stories.published,
            ),
          ),
        onError: (error: Error) => toast.error(formatError(error)),
      },
    );
  }

  if (chapterQuery.isLoading) {
    return <ChapterDetailSkeleton />;
  }

  if (chapterQuery.isError || !detail) {
    const error = chapterQuery.error;
    return (
      <section className="space-y-6">
        <Button asChild size="sm" variant="ghost">
          <Link to={storyPath}>
            <ArrowLeft aria-hidden="true" />
            {t(translations.management.stories.backToStory)}
          </Link>
        </Button>
        <Card className="border-destructive/25 bg-destructive/5">
          <CardHeader>
            <CardTitle>
              {t(translations.management.stories.chapterLoadError)}
            </CardTitle>
            <CardDescription className="text-destructive">
              {error ? formatError(error) : t(translations.errors.unknown)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => void chapterQuery.refetch()}>
              <RefreshCw aria-hidden="true" />
              {t(translations.management.stories.retry)}
            </Button>
            <Button asChild variant="outline">
              <Link to={storyPath}>
                {t(translations.management.stories.backToStory)}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const { chapter, chapterWorkflow } = detail;
  const progress = chapter.totalTasks
    ? Math.round((chapter.completedTasks / chapter.totalTasks) * 100)
    : 0;
  const workflowLabel = chapterWorkflow
    ? getWorkflowLabel(t, chapterWorkflow.status)
    : t(translations.management.stories.workflowUnset);

  return (
    <section className="space-y-6">
      <Button asChild size="sm" variant="ghost">
        <Link to={storyPath}>
          <ArrowLeft aria-hidden="true" />
          {t(translations.management.stories.backToStory)}
        </Link>
      </Button>

      <header className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/12 via-card to-card p-5 shadow-[var(--soft-shadow)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-muted-foreground">
              {t(translations.management.stories.storyWorkspace)}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
              {chapter.chapterName}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={chapter.workflowStatus}>
                {workflowLabel}
              </StatusBadge>
              <StatusBadge
                status={chapter.difficulty === 'VERY_HARD' ? 'HIGH' : null}
              >
                {getDifficultyLabel(t, chapter.difficulty)}
              </StatusBadge>
              <StatusBadge status={chapter.priority === 'HIGH' ? 'HIGH' : null}>
                {getPriorityLabel(t, chapter.priority)}
              </StatusBadge>
              <StatusBadge status={chapter.hasAdultContent ? 'BLOCKED' : null}>
                {chapter.hasAdultContent
                  ? t(translations.management.stories.adultContent)
                  : t(translations.management.stories.notAdultContent)}
              </StatusBadge>
              <StatusBadge status={chapter.publicationStatus}>
                {chapter.publicationStatus === 'PUBLISHED'
                  ? t(translations.management.stories.published)
                  : t(translations.management.stories.unpublished)}
              </StatusBadge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={openChapterEditor} size="sm" variant="outline">
              <Settings2 aria-hidden="true" />
              {t(translations.management.stories.editChapter)}
            </Button>
            <Button
              disabled={publicationMutation.isPending}
              onClick={togglePublication}
              size="sm"
              variant={
                chapter.publicationStatus === 'PUBLISHED'
                  ? 'outline'
                  : 'default'
              }
            >
              {publicationMutation.isPending ? (
                <RefreshCw aria-hidden="true" className="animate-spin" />
              ) : (
                <Upload aria-hidden="true" />
              )}
              {chapter.publicationStatus === 'PUBLISHED'
                ? t(translations.management.stories.unpublish)
                : t(translations.management.stories.publish)}
            </Button>
            <Button
              disabled={progressMutation.isPending}
              onClick={notifyProgress}
              size="sm"
              variant="outline"
            >
              {progressMutation.isPending ? (
                <RefreshCw aria-hidden="true" className="animate-spin" />
              ) : (
                <Send aria-hidden="true" />
              )}
              {t(translations.management.stories.notifyProgress)}
            </Button>
            {chapter.googleDriveUrl ? (
              <Button asChild size="sm" variant="outline">
                <a
                  href={chapter.googleDriveUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink aria-hidden="true" />
                  {t(translations.management.stories.drive)}
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-border/70 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem
            icon={<ListChecks aria-hidden="true" />}
            label={t(translations.management.stories.taskProgress)}
            value={`${chapter.completedTasks}/${chapter.totalTasks}`}
            detail={`${progress}%`}
          />
          <SummaryItem
            icon={<CheckCircle2 aria-hidden="true" />}
            label={t(translations.management.stories.completedTaskCount)}
            value={String(taskSummary.completed)}
            detail={t(translations.management.stories.completed)}
          />
          <SummaryItem
            icon={<Clock3 aria-hidden="true" />}
            label={t(translations.management.stories.activeTaskCount)}
            value={String(taskSummary.active)}
            detail={t(translations.management.stories.inProgress)}
          />
          <SummaryItem
            icon={<CalendarClock aria-hidden="true" />}
            label={t(translations.management.stories.overdueTaskCount)}
            value={String(taskSummary.overdue)}
            detail={t(translations.management.stories.dueAt)}
          />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t(translations.management.stories.workflow)}</CardTitle>
            <CardDescription>
              {chapterWorkflow?.name ??
                t(translations.management.stories.noWorkflow)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <DetailItem
              label={t(translations.management.stories.createdAt)}
              value={formatDate(chapterWorkflow?.createdAt, dateFormatter, t)}
            />
            <DetailItem
              label={t(translations.management.stories.startedAt)}
              value={formatDate(chapterWorkflow?.activatedAt, dateFormatter, t)}
            />
            <DetailItem
              label={t(translations.management.stories.completedAt)}
              value={formatDate(chapterWorkflow?.completedAt, dateFormatter, t)}
            />
            {chapterWorkflow?.note ? (
              <div className="sm:col-span-3">
                <DetailItem
                  label={t(translations.management.stories.workflowNote)}
                  value={chapterWorkflow.note}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t(translations.management.stories.amountSummary)}
            </CardTitle>
            <CardDescription>
              {t(translations.management.stories.amountSummaryDescription)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {taskSummary.amounts.length > 0 ? (
              <div className="space-y-3">
                {taskSummary.amounts.map((amount) => (
                  <div
                    className="flex items-center justify-between gap-3 border-b border-border/70 pb-3 last:border-0 last:pb-0"
                    key={amount.currency}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CircleDollarSign aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold">
                        {amount.currency}
                      </span>
                    </div>
                    <span className="text-sm font-bold">
                      {formatMoney(
                        amount.total,
                        amount.currency,
                        i18n.language,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t(translations.management.stories.noAmount)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="chapter-tasks-title" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3
              className="text-xl font-extrabold tracking-tight"
              id="chapter-tasks-title"
            >
              {t(translations.management.stories.chapterTasks)}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(translations.management.stories.chapterTasksDescription)}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {t(translations.management.stories.totalTaskCount, {
              count: tasks.length,
            })}
          </span>
        </div>

        {tasks.length === 0 ? (
          <Empty className="border-border bg-muted/20 py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>
                {t(translations.management.stories.emptyChapterTasks)}
              </EmptyTitle>
              <EmptyDescription>
                {t(
                  translations.management.stories.emptyChapterTasksDescription,
                )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <TaskTable
              compactDateFormatter={compactDateFormatter}
              dateFormatter={dateFormatter}
              language={i18n.language}
              onDeduct={openTaskDeduction}
              onEdit={openTaskEditor}
              tasks={tasks}
            />
            <div className="grid gap-3 lg:hidden">
              {tasks.map((task) => (
                <TaskCard
                  dateFormatter={dateFormatter}
                  key={task.id}
                  language={i18n.language}
                  onDeduct={() => openTaskDeduction(task)}
                  onEdit={() => openTaskEditor(task)}
                  task={task}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <Dialog open={isChapterEditorOpen} onOpenChange={setIsChapterEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(translations.management.stories.chapterConfiguration)}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitChapter}>
            <div className="space-y-2">
              <Label htmlFor="chapter-detail-difficulty">
                {t(translations.management.stories.difficulty)}
              </Label>
              <Select
                value={chapterDifficulty}
                onValueChange={(value) =>
                  setChapterDifficulty(value as ChapterDifficulty)
                }
              >
                <SelectTrigger
                  id="chapter-detail-difficulty"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chapterDifficulties.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {getDifficultyLabel(t, difficulty)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter-detail-priority">
                {t(translations.management.stories.priority)}
              </Label>
              <Select
                value={chapterPriority}
                onValueChange={(value) =>
                  setChapterPriority(value as Chapter['priority'])
                }
              >
                <SelectTrigger id="chapter-detail-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['LOW', 'NORMAL', 'HIGH'] as const).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {getPriorityLabel(t, priority)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-3 text-sm font-medium">
              <input
                checked={chapterAdultContent}
                className="size-4 accent-primary"
                onChange={(event) =>
                  setChapterAdultContent(event.target.checked)
                }
                type="checkbox"
              />
              {t(translations.management.stories.adultContent)}
            </label>
            <Button
              className="w-full"
              disabled={chapterMutation.isPending}
              type="submit"
            >
              {t(translations.management.stories.save)}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <TaskEditDialog
        assignees={taskAssignees}
        assigneesError={membersQuery.isError ? membersQuery.error : null}
        assigneesLoading={membersQuery.isLoading}
        editingTask={editingTask}
        isPending={taskMutation.isPending}
        onAssigneeChange={(value) => {
          setTaskAssignee(value);
          if (value === unassignedValue) setTaskStatus('READY');
        }}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onRetry={() => void membersQuery.refetch()}
        onStatusChange={(value) => {
          setTaskStatus(value);
          setTaskStatusDirty(true);
        }}
        onPriceChange={setTaskPrice}
        onSubmit={submitTask}
        price={taskPrice}
        status={taskStatus}
        assignee={taskAssignee}
      />

      <TaskDeductionDialog
        amount={deductionAmount}
        evidenceUrl={deductionEvidenceUrl}
        isPending={deductionMutation.isPending}
        language={i18n.language}
        onAmountChange={setDeductionAmount}
        onEvidenceUrlChange={setDeductionEvidenceUrl}
        onOpenChange={(open) => !open && setDeductionTask(null)}
        onReasonChange={setDeductionReason}
        onSubmit={submitDeduction}
        reason={deductionReason}
        task={deductionTask}
      />
    </section>
  );
}

function TaskEditDialog({
  assignee,
  assignees,
  assigneesError,
  assigneesLoading,
  editingTask,
  isPending,
  onAssigneeChange,
  onOpenChange,
  onRetry,
  onStatusChange,
  onPriceChange,
  onSubmit,
  price,
  status,
}: {
  assignee: string;
  assignees: readonly ChapterAssignee[];
  assigneesError: Error | null;
  assigneesLoading: boolean;
  editingTask: ChapterTask | null;
  isPending: boolean;
  onAssigneeChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  onStatusChange: (value: ChapterManagerTaskStatus) => void;
  onPriceChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  price: string;
  status: ChapterManagerTaskStatus;
}): ReactNode {
  const { t } = useTranslation();
  const assigneeOptions = useMemo(() => {
    if (!editingTask?.assignee) return assignees;
    if (
      assignees.some(
        (option) =>
          option.discordUserId === editingTask.assignee?.discordUserId,
      )
    )
      return assignees;
    return [editingTask.assignee, ...assignees];
  }, [assignees, editingTask]);

  return (
    <Dialog open={editingTask !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(translations.management.stories.editTask)}
          </DialogTitle>
        </DialogHeader>
        {editingTask ? (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="rounded-xl bg-muted/50 px-3 py-2.5">
              <p className="font-semibold">{editingTask.stageName}</p>
              <p className="text-xs text-muted-foreground">
                {t(translations.management.stories.taskId, {
                  id: editingTask.id,
                })}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-edit-status">
                {t(translations.management.stories.status)}
              </Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  onStatusChange(value as ChapterManagerTaskStatus)
                }
              >
                <SelectTrigger id="task-edit-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {managerTaskStatuses.map((item) => (
                    <SelectItem key={item} value={item}>
                      {getTaskStatusLabel(t, item)}
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
                onChange={(event) => onPriceChange(event.target.value)}
                step="0.01"
                type="number"
                value={price}
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
              <Select value={assignee} onValueChange={onAssigneeChange}>
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
              {assigneesLoading ? (
                <p className="text-xs text-muted-foreground">
                  {t(translations.management.stories.loadingAssignees)}
                </p>
              ) : null}
              {assigneesError ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  <span>{formatError(assigneesError)}</span>
                  <Button
                    onClick={onRetry}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {t(translations.management.stories.retry)}
                  </Button>
                </div>
              ) : null}
              {assignee !== unassignedValue &&
              assignee !== editingTask.assignee?.discordUserId ? (
                <p className="text-xs text-primary">
                  {t(translations.management.stories.assigneeWillStart)}
                </p>
              ) : null}
              {assignee === unassignedValue && editingTask.assignee ? (
                <p className="text-xs text-muted-foreground">
                  {t(translations.management.stories.unassignWillReady)}
                </p>
              ) : null}
            </div>
            <Button className="w-full" disabled={isPending} type="submit">
              {t(translations.management.stories.save)}
            </Button>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TaskDeductionDialog({
  amount,
  evidenceUrl,
  isPending,
  language,
  onAmountChange,
  onEvidenceUrlChange,
  onOpenChange,
  onReasonChange,
  onSubmit,
  reason,
  task,
}: {
  amount: string;
  evidenceUrl: string;
  isPending: boolean;
  language: string;
  onAmountChange: (value: string) => void;
  onEvidenceUrlChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  reason: string;
  task: ChapterTask | null;
}): ReactNode {
  const { t } = useTranslation();

  return (
    <Dialog open={task !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(translations.management.stories.deductMoneyTitle)}
          </DialogTitle>
        </DialogHeader>
        {task ? (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="rounded-xl bg-muted/50 px-3 py-2.5">
              <p className="font-semibold">{task.stageName}</p>
              <p className="text-xs text-muted-foreground">
                {t(translations.management.stories.taskId, { id: task.id })}
                {' · '}
                {t(translations.management.stories.agreedPrice)}:{' '}
                {formatMoney(task.agreedPrice, task.currency, language)}
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
                onChange={(event) => onAmountChange(event.target.value)}
                step="0.01"
                type="number"
                value={amount}
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
                onChange={(event) => onReasonChange(event.target.value)}
                value={reason}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-deduction-evidence">
                {t(translations.management.stories.deductEvidenceUrl)}
              </Label>
              <Input
                id="task-deduction-evidence"
                onChange={(event) => onEvidenceUrlChange(event.target.value)}
                placeholder="https://discord.com/channels/..."
                type="url"
                value={evidenceUrl}
              />
              <p className="text-xs text-muted-foreground">
                {t(translations.management.stories.deductEvidenceHint)}
              </p>
            </div>
            <Button
              className="w-full"
              disabled={isPending}
              type="submit"
              variant="destructive"
            >
              {isPending ? (
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
  );
}

function TaskTable({
  compactDateFormatter,
  dateFormatter,
  language,
  onDeduct,
  onEdit,
  tasks,
}: {
  compactDateFormatter: Intl.DateTimeFormat;
  dateFormatter: Intl.DateTimeFormat;
  language: string;
  onDeduct: (task: ChapterTask) => void;
  onEdit: (task: ChapterTask) => void;
  tasks: readonly ChapterTask[];
}): ReactNode {
  const { t } = useTranslation();
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card lg:block">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>{t(translations.management.stories.taskName)}</TableHead>
            <TableHead>{t(translations.management.stories.assignee)}</TableHead>
            <TableHead>{t(translations.management.stories.status)}</TableHead>
            <TableHead>{t(translations.management.stories.time)}</TableHead>
            <TableHead>{t(translations.management.stories.dueAt)}</TableHead>
            <TableHead className="text-right">
              {t(translations.management.stories.amount)}
            </TableHead>
            <TableHead>
              {t(translations.management.stories.paymentStatus)}
            </TableHead>
            <TableHead className="text-right">
              {t(translations.management.stories.actions)}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <p className="font-semibold">{task.stageName}</p>
                <p className="text-xs text-muted-foreground">
                  {t(translations.management.stories.taskId, { id: task.id })}
                </p>
              </TableCell>
              <TableCell>
                <AssigneeDisplay assignee={task.assignee} />
              </TableCell>
              <TableCell>
                <TaskStatusBadge status={task.status} />
              </TableCell>
              <TableCell className="w-48">
                <TaskTimeSummary
                  compactDateFormatter={compactDateFormatter}
                  dateFormatter={dateFormatter}
                  task={task}
                />
              </TableCell>
              <TableCell>
                <DueDate task={task} dateFormatter={dateFormatter} />
              </TableCell>
              <TableCell className="min-w-36 text-right">
                <p className="font-semibold">
                  {formatMoney(task.agreedPrice, task.currency, language)}
                </p>
                {Number(task.rewardAmount) > 0 ? (
                  <p className="text-xs text-primary">
                    + {formatMoney(task.rewardAmount, task.currency, language)}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={task.paymentStatus} />
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center gap-1">
                  <Button
                    aria-label={t(translations.management.stories.deductMoney)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={task.paymentStatus === 'PAID'}
                    onClick={() => onDeduct(task)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <CircleMinus aria-hidden="true" />
                  </Button>
                  <Button
                    aria-label={t(translations.management.stories.editTask)}
                    className="text-primary hover:bg-primary/10 hover:text-primary"
                    onClick={() => onEdit(task)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Settings2 aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskTimeSummary({
  compactDateFormatter,
  dateFormatter,
  task,
}: {
  compactDateFormatter: Intl.DateTimeFormat;
  dateFormatter: Intl.DateTimeFormat;
  task: ChapterTask;
}): ReactNode {
  const { t } = useTranslation();
  return (
    <div className="grid w-44 grid-cols-2 gap-x-3 gap-y-1 text-[0.6875rem]">
      <CompactTime
        formatter={compactDateFormatter}
        fullFormatter={dateFormatter}
        label={t(translations.management.stories.createdShort)}
        value={task.createdAt}
      />
      <CompactTime
        formatter={compactDateFormatter}
        fullFormatter={dateFormatter}
        label={t(translations.management.stories.startedShort)}
        value={task.startedAt}
      />
      <CompactTime
        formatter={compactDateFormatter}
        fullFormatter={dateFormatter}
        label={t(translations.management.stories.completedShort)}
        value={task.completedAt}
      />
    </div>
  );
}

function CompactTime({
  formatter,
  fullFormatter,
  label,
  value,
}: {
  formatter: Intl.DateTimeFormat;
  fullFormatter: Intl.DateTimeFormat;
  label: string;
  value: string | null;
}): ReactNode {
  const { t } = useTranslation();
  const compactValue = formatCompactDate(value, formatter);
  const fullValue = formatDate(value, fullFormatter, t);
  return (
    <div
      aria-label={`${label}: ${fullValue}`}
      className="min-w-0 truncate"
      title={`${label}: ${fullValue}`}
    >
      <span className="mr-1 text-muted-foreground">{label}</span>
      <time dateTime={value ?? undefined} className="font-medium tabular-nums">
        {compactValue}
      </time>
    </div>
  );
}

function TaskCard({
  dateFormatter,
  language,
  onDeduct,
  onEdit,
  task,
}: {
  dateFormatter: Intl.DateTimeFormat;
  language: string;
  onDeduct: () => void;
  onEdit: () => void;
  task: ChapterTask;
}): ReactNode {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="truncate">{task.stageName}</CardTitle>
          <CardDescription>
            {t(translations.management.stories.taskId, { id: task.id })}
          </CardDescription>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <TaskStatusBadge status={task.status} />
          <PaymentStatusBadge status={task.paymentStatus} />
          <Button
            aria-label={t(translations.management.stories.deductMoney)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={task.paymentStatus === 'PAID'}
            onClick={onDeduct}
            size="icon-sm"
            variant="ghost"
          >
            <CircleMinus aria-hidden="true" />
          </Button>
          <Button
            aria-label={t(translations.management.stories.editTask)}
            className="text-primary hover:bg-primary/10 hover:text-primary"
            onClick={onEdit}
            size="icon-sm"
            variant="ghost"
          >
            <Settings2 aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-4">
        <DetailItem
          icon={<UserRound aria-hidden="true" />}
          label={t(translations.management.stories.assignee)}
          value={<AssigneeDisplay assignee={task.assignee} />}
        />
        <DetailItem
          icon={<CalendarClock aria-hidden="true" />}
          label={t(translations.management.stories.dueAt)}
          value={<DueDate dateFormatter={dateFormatter} task={task} />}
        />
        <DetailItem
          label={t(translations.management.stories.createdAt)}
          value={formatDate(task.createdAt, dateFormatter, t)}
        />
        <DetailItem
          label={t(translations.management.stories.startedAt)}
          value={formatDate(task.startedAt, dateFormatter, t)}
        />
        <DetailItem
          label={t(translations.management.stories.completedAt)}
          value={formatDate(task.completedAt, dateFormatter, t)}
        />
        <div className="col-span-2 rounded-xl bg-muted/50 px-3 py-2.5">
          <DetailItem
            icon={<CircleDollarSign aria-hidden="true" />}
            label={t(translations.management.stories.amount)}
            value={
              <div>
                <p className="font-semibold">
                  {formatMoney(task.agreedPrice, task.currency, language)}
                </p>
                {Number(task.rewardAmount) > 0 ? (
                  <p className="text-xs text-primary">
                    + {formatMoney(task.rewardAmount, task.currency, language)}
                  </p>
                ) : null}
              </div>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  detail,
  icon,
  label,
  value,
}: {
  detail: string;
  icon: ReactNode;
  label: string;
  value: string;
}): ReactNode {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card/75 px-3 py-3 ring-1 ring-foreground/10">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="font-bold tracking-tight">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}): ReactNode {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function AssigneeDisplay({
  assignee,
}: {
  assignee: ChapterTask['assignee'];
}): ReactNode {
  const { t } = useTranslation();
  if (!assignee) {
    return (
      <span className="text-muted-foreground">
        {t(translations.management.stories.unassigned)}
      </span>
    );
  }

  return (
    <div className="min-w-28">
      <p className="font-semibold">
        {assignee.displayName ?? assignee.discordUserId}
      </p>
      <p className="font-mono text-[0.6875rem] text-muted-foreground">
        {t(translations.management.stories.assigneeId, {
          id: assignee.discordUserId,
        })}
      </p>
    </div>
  );
}

function DueDate({
  dateFormatter,
  task,
}: {
  dateFormatter: Intl.DateTimeFormat;
  task: ChapterTask;
}): ReactNode {
  const { t } = useTranslation();
  const isOverdue = task.dueAt
    ? new Date(task.dueAt).getTime() < Date.now() &&
      !terminalTaskStatuses.includes(task.status)
    : false;
  return (
    <span className={isOverdue ? 'font-semibold text-destructive' : undefined}>
      {formatDate(task.dueAt, dateFormatter, t)}
    </span>
  );
}

function TaskStatusBadge({ status }: { status: ChapterTaskStatus }): ReactNode {
  const { t } = useTranslation();
  return (
    <StatusBadge status={status}>{getTaskStatusLabel(t, status)}</StatusBadge>
  );
}

function PaymentStatusBadge({
  status,
}: {
  status: ChapterPaymentStatus;
}): ReactNode {
  const { t } = useTranslation();
  return (
    <StatusBadge status={status}>
      {getPaymentStatusLabel(t, status)}
    </StatusBadge>
  );
}

function StatusBadge({
  children,
  status,
}: {
  children: ReactNode;
  status: string | null;
}): ReactNode {
  return (
    <span className={getStatusClass(status)} data-status={status ?? 'unset'}>
      {children}
    </span>
  );
}

function ChapterDetailSkeleton(): ReactNode {
  return (
    <section className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-6 rounded-3xl border border-border/70 p-5 sm:p-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-6 w-56" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton className="h-20" key={index} />
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
      <Skeleton className="h-72" />
    </section>
  );
}

function summarizeTasks(tasks: readonly ChapterTask[]): {
  readonly active: number;
  readonly amounts: readonly { currency: string; total: number }[];
  readonly completed: number;
  readonly overdue: number;
} {
  const amounts = new Map<string, number>();
  let completed = 0;
  let active = 0;
  let overdue = 0;
  const now = Date.now();

  for (const task of tasks) {
    if (task.status === 'COMPLETED') completed += 1;
    if (task.status === 'IN_PROGRESS') active += 1;
    if (
      task.dueAt &&
      new Date(task.dueAt).getTime() < now &&
      !terminalTaskStatuses.includes(task.status)
    ) {
      overdue += 1;
    }

    const agreedPrice =
      task.agreedPrice === null ? null : Number(task.agreedPrice);
    const rewardAmount =
      task.rewardAmount === null ? null : Number(task.rewardAmount);
    const hasAmount =
      (agreedPrice !== null && Number.isFinite(agreedPrice)) ||
      (rewardAmount !== null && Number.isFinite(rewardAmount));
    const total =
      (agreedPrice !== null && Number.isFinite(agreedPrice) ? agreedPrice : 0) +
      (rewardAmount !== null && Number.isFinite(rewardAmount)
        ? rewardAmount
        : 0);
    if (hasAmount) {
      amounts.set(task.currency, (amounts.get(task.currency) ?? 0) + total);
    }
  }

  return {
    active,
    amounts: [...amounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([currency, total]) => ({ currency, total })),
    completed,
    overdue,
  };
}

function formatDate(
  value: string | null | undefined,
  formatter: Intl.DateTimeFormat,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (!value) return t(translations.management.stories.missingValue);
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? t(translations.management.stories.missingValue)
    : formatter.format(date);
}

function formatCompactDate(
  value: string | null | undefined,
  formatter: Intl.DateTimeFormat,
): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : formatter.format(date);
}

function formatMoney(
  amount: number | string | null,
  currency: string,
  language: string,
): string {
  if (amount === null || amount === '') return '—';
  const value = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat(language, {
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
      style: 'currency',
    }).format(value);
  } catch {
    return `${new Intl.NumberFormat(language).format(value)} ${currency}`;
  }
}

function getWorkflowLabel(
  t: ReturnType<typeof useTranslation>['t'],
  status: ChapterWorkflowStatus,
): string {
  return status === 'DRAFT'
    ? t(translations.management.stories.workflowDraft)
    : status === 'ACTIVE'
      ? t(translations.management.stories.workflowActive)
      : status === 'COMPLETED'
        ? t(translations.management.stories.workflowCompleted)
        : t(translations.management.stories.workflowCancelled);
}

function getPriorityLabel(
  t: ReturnType<typeof useTranslation>['t'],
  priority: Chapter['priority'],
): string {
  return priority === 'HIGH'
    ? t(translations.management.stories.priorityHigh)
    : priority === 'LOW'
      ? t(translations.management.stories.priorityLow)
      : t(translations.management.stories.priorityNormal);
}

function getDifficultyLabel(
  t: ReturnType<typeof useTranslation>['t'],
  difficulty: ChapterDifficulty,
): string {
  return difficulty === 'VERY_HARD'
    ? t(translations.management.stories.difficultyVeryHard)
    : difficulty === 'HARD'
      ? t(translations.management.stories.difficultyHard)
      : t(translations.management.stories.difficultyNormal);
}

function getTaskStatusLabel(
  t: ReturnType<typeof useTranslation>['t'],
  status: ChapterTaskStatus,
): string {
  return status === 'BLOCKED'
    ? t(translations.management.stories.taskStatusBlocked)
    : status === 'READY'
      ? t(translations.management.stories.taskStatusReady)
      : status === 'IN_PROGRESS'
        ? t(translations.management.stories.taskStatusInProgress)
        : status === 'COMPLETED'
          ? t(translations.management.stories.taskStatusCompleted)
          : t(translations.management.stories.taskStatusCancelled);
}

function getPaymentStatusLabel(
  t: ReturnType<typeof useTranslation>['t'],
  status: ChapterPaymentStatus,
): string {
  return status === 'NOT_READY'
    ? t(translations.management.stories.paymentStatusNotReady)
    : status === 'PENDING'
      ? t(translations.management.stories.paymentStatusPending)
      : t(translations.management.stories.paymentStatusPaid);
}

function getStatusClass(status: string | null): string {
  if (status === 'COMPLETED' || status === 'PAID' || status === 'PUBLISHED') {
    return 'rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary';
  }
  if (status === 'IN_PROGRESS' || status === 'ACTIVE' || status === 'PENDING') {
    return 'rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground';
  }
  if (status === 'BLOCKED' || status === 'CANCELLED' || status === 'HIGH') {
    return 'rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive';
  }
  return 'rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground';
}
