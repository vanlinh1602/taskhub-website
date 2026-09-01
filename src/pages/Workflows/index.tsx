import {
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  Trash2,
  Workflow,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  DialogFooter,
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreateWorkflowMutation,
  useDeactivateWorkflowMutation,
  useDeleteWorkflowMutation,
  usePublishWorkflowMutation,
  useRestoreWorkflowMutation,
  useSetDefaultWorkflowMutation,
  useWorkflowTemplatesQuery,
} from '@/features/workflows/hooks';
import type {
  WorkflowTemplateStatus,
  WorkflowTemplateSummary,
} from '@/features/workflows/types';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

const ALL_STATUSES: readonly WorkflowTemplateStatus[] = [
  'DRAFT',
  'ACTIVE',
  'INACTIVE',
];
type FilterStatus = WorkflowTemplateStatus | 'ALL';
type ActionKind = 'publish' | 'deactivate' | 'restore' | 'delete';

function isForbiddenError(error: unknown): boolean {
  const message = formatError(error).toLocaleLowerCase();
  return (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('quyền')
  );
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function statusLabel(
  status: WorkflowTemplateStatus,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (status === 'DRAFT') return t(translations.workflows.draft);
  if (status === 'ACTIVE') return t(translations.workflows.active);
  return t(translations.workflows.inactive);
}

function StatusBadge({
  status,
  t,
}: {
  readonly status: WorkflowTemplateStatus;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const tone =
    status === 'ACTIVE'
      ? 'bg-primary/10 text-primary'
      : status === 'DRAFT'
        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'bg-muted text-muted-foreground';
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {statusLabel(status, t)}
    </span>
  );
}

function WorkflowActions({
  workflow,
  onAction,
  onDefault,
  onEdit,
  t,
}: {
  readonly workflow: WorkflowTemplateSummary;
  readonly onAction: (
    kind: ActionKind,
    workflow: WorkflowTemplateSummary,
  ) => void;
  readonly onDefault: (workflow: WorkflowTemplateSummary) => void;
  readonly onEdit: (workflow: WorkflowTemplateSummary) => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        aria-label={`${t(translations.workflows.edit)}: ${workflow.name}`}
        onClick={() => onEdit(workflow)}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Edit3 aria-hidden="true" />
        <span>{t(translations.workflows.edit)}</span>
      </Button>
      {workflow.status === 'ACTIVE' ? (
        <Button
          aria-label={
            workflow.isDefault
              ? t(translations.workflows.clearDefault)
              : t(translations.workflows.setDefault)
          }
          onClick={() => onDefault(workflow)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {workflow.isDefault ? (
            <XCircle aria-hidden="true" />
          ) : (
            <Check aria-hidden="true" />
          )}
          <span>
            {workflow.isDefault
              ? t(translations.workflows.clearDefault)
              : t(translations.workflows.setDefault)}
          </span>
        </Button>
      ) : null}
      {workflow.status === 'DRAFT' ? (
        <Button
          aria-label={t(translations.workflows.publish)}
          onClick={() => onAction('publish', workflow)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Workflow aria-hidden="true" />
          <span>{t(translations.workflows.publish)}</span>
        </Button>
      ) : null}
      {workflow.status === 'ACTIVE' ? (
        <Button
          aria-label={t(translations.workflows.deactivate)}
          onClick={() => onAction('deactivate', workflow)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <XCircle aria-hidden="true" />
          <span>{t(translations.workflows.deactivate)}</span>
        </Button>
      ) : null}
      {workflow.status === 'INACTIVE' ? (
        <Button
          aria-label={t(translations.workflows.restore)}
          onClick={() => onAction('restore', workflow)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Check aria-hidden="true" />
          <span>{t(translations.workflows.restore)}</span>
        </Button>
      ) : null}
      {workflow.status === 'DRAFT' ? (
        <Button
          aria-label={t(translations.workflows.delete)}
          onClick={() => onAction('delete', workflow)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" />
          <span>{t(translations.workflows.delete)}</span>
        </Button>
      ) : null}
    </div>
  );
}

function CreateWorkflowDialog({
  isPending,
  onCancel,
  onSubmit,
  open,
  t,
}: {
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (name: string) => void;
  readonly open: boolean;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const value = name.trim();
    if (!value) {
      setValidationError(t(translations.workflows.invalidName));
      return;
    }
    onSubmit(value);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(translations.workflows.createTitle)}</DialogTitle>
          <DialogDescription>
            {t(translations.workflows.createDescription)}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="workflow-name">
              {t(translations.workflows.name)}
            </Label>
            <Input
              autoFocus
              id="workflow-name"
              maxLength={100}
              onChange={(event) => {
                setName(event.target.value);
                setValidationError(null);
              }}
              placeholder={t(translations.workflows.namePlaceholder)}
              value={name}
            />
          </div>
          {validationError ? (
            <p className="text-sm text-destructive" role="alert">
              {validationError}
            </p>
          ) : null}
          <DialogFooter>
            <Button onClick={onCancel} type="button" variant="outline">
              {t(translations.workflows.cancel)}
            </Button>
            <Button disabled={isPending} type="submit">
              {t(translations.workflows.create)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading">
      {[1, 2, 3].map((item) => (
        <Skeleton className="h-20 rounded-2xl" key={item} />
      ))}
    </div>
  );
}

export default function WorkflowsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    readonly kind: ActionKind;
    readonly workflow: WorkflowTemplateSummary;
  } | null>(null);
  const statuses = filter === 'ALL' ? ALL_STATUSES : [filter];
  const query = useWorkflowTemplatesQuery(workspaceId, statuses, page);
  const createMutation = useCreateWorkflowMutation(workspaceId);
  const publishMutation = usePublishWorkflowMutation(workspaceId);
  const deactivateMutation = useDeactivateWorkflowMutation(workspaceId);
  const restoreMutation = useRestoreWorkflowMutation(workspaceId);
  const deleteMutation = useDeleteWorkflowMutation(workspaceId);
  const defaultMutation = useSetDefaultWorkflowMutation(workspaceId);
  const isActionPending =
    publishMutation.isPending ||
    deactivateMutation.isPending ||
    restoreMutation.isPending ||
    deleteMutation.isPending;

  function handleError(error: unknown): void {
    toast.error(formatError(error));
  }

  async function handleCreate(name: string): Promise<void> {
    try {
      const workflow = await createMutation.mutateAsync(name);
      setCreateOpen(false);
      navigate(`/workflows/${workflow.id}`);
      toast.success(t(translations.workflows.createSuccess));
    } catch (error) {
      handleError(error);
    }
  }

  async function handleDefault(
    workflow: WorkflowTemplateSummary,
  ): Promise<void> {
    try {
      await defaultMutation.mutateAsync(
        workflow.isDefault ? null : workflow.id,
      );
      toast.success(t(translations.workflows.defaultSuccess));
    } catch (error) {
      handleError(error);
    }
  }

  async function confirmAction(): Promise<void> {
    if (!pendingAction) return;
    const { kind, workflow } = pendingAction;
    try {
      if (kind === 'publish')
        await publishMutation.mutateAsync({ templateId: workflow.id });
      if (kind === 'deactivate')
        await deactivateMutation.mutateAsync({ templateId: workflow.id });
      if (kind === 'restore')
        await restoreMutation.mutateAsync({ templateId: workflow.id });
      if (kind === 'delete')
        await deleteMutation.mutateAsync({ templateId: workflow.id });
      setPendingAction(null);
      toast.success(
        kind === 'publish'
          ? t(translations.workflows.publishSuccess)
          : kind === 'delete'
            ? t(translations.workflows.deleteSuccess)
            : t(translations.workflows.statusSuccess),
      );
    } catch (error) {
      handleError(error);
    }
  }

  const actionCopy = pendingAction
    ? pendingAction.kind === 'publish'
      ? {
          title: t(translations.workflows.publishTitle),
          description: t(translations.workflows.publishDescription),
        }
      : pendingAction.kind === 'deactivate'
        ? {
            title: t(translations.workflows.deactivateTitle),
            description: t(translations.workflows.deactivateDescription),
          }
        : pendingAction.kind === 'restore'
          ? {
              title: t(translations.workflows.restoreTitle),
              description: t(translations.workflows.restoreDescription),
            }
          : {
              title: t(translations.workflows.deleteTitle),
              description: t(translations.workflows.deleteDescription),
            }
    : null;

  if (!workspaceId) {
    return (
      <Empty className="min-h-96 border bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Workflow aria-hidden="true" className="size-4" />
          </EmptyMedia>
          <EmptyTitle>{t(translations.workflows.noWorkspace)}</EmptyTitle>
          <EmptyDescription>
            {t(translations.workflows.noWorkspaceDescription)}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (query.isError && isForbiddenError(query.error)) {
    return (
      <Empty className="min-h-96 border bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <XCircle aria-hidden="true" className="size-4" />
          </EmptyMedia>
          <EmptyTitle>{t(translations.workflows.forbidden)}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section className="flex min-h-96 flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {t(translations.management.eyebrow)}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t(translations.workflows.title)}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t(translations.workflows.description)}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} type="button">
          <Plus aria-hidden="true" />
          {t(translations.workflows.create)}
        </Button>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label={t(translations.workflows.status)}
      >
        {(['ALL', ...ALL_STATUSES] as const).map((value) => {
          const selected = filter === value;
          const label =
            value === 'ALL'
              ? t(translations.workflows.all)
              : statusLabel(value, t);
          return (
            <Button
              aria-selected={selected}
              key={value}
              onClick={() => {
                setFilter(value);
                setPage(0);
              }}
              role="tab"
              size="sm"
              type="button"
              variant={selected ? 'default' : 'outline'}
            >
              {label}
            </Button>
          );
        })}
      </div>

      {query.isPending ? <LoadingState /> : null}
      {query.isError ? (
        <Card>
          <CardHeader>
            <CardTitle>{t(translations.workflows.error)}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {formatError(query.error)}
            </p>
            <Button
              onClick={() => void query.refetch()}
              type="button"
              variant="outline"
            >
              {t(translations.workflows.retry)}
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {query.data && query.data.items.length === 0 ? (
        <Empty className="min-h-80 border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Workflow aria-hidden="true" className="size-4" />
            </EmptyMedia>
            <EmptyTitle>{t(translations.workflows.empty)}</EmptyTitle>
            <EmptyDescription>
              {t(translations.workflows.emptyDescription)}
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setCreateOpen(true)} type="button">
            <Plus aria-hidden="true" />
            {t(translations.workflows.create)}
          </Button>
        </Empty>
      ) : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(translations.workflows.name)}</TableHead>
                  <TableHead>{t(translations.workflows.status)}</TableHead>
                  <TableHead>{t(translations.workflows.default)}</TableHead>
                  <TableHead>{t(translations.workflows.stageCount)}</TableHead>
                  <TableHead>{t(translations.workflows.updatedAt)}</TableHead>
                  <TableHead>
                    <span className="sr-only">
                      {t(translations.workflows.actions)}
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <div className="min-w-48">
                        <p className="font-semibold">{workflow.name}</p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          #{workflow.id} ·{' '}
                          {t(translations.workflows.version, {
                            version: workflow.configurationVersion,
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={workflow.status} t={t} />
                    </TableCell>
                    <TableCell>
                      {workflow.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                          <Check aria-hidden="true" className="size-4" />
                          {t(translations.workflows.yes)}
                        </span>
                      ) : (
                        t(translations.workflows.no)
                      )}
                    </TableCell>
                    <TableCell>{workflow.stageCount}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                      {formatDate(workflow.updatedAt, i18n.language)}
                    </TableCell>
                    <TableCell>
                      <WorkflowActions
                        workflow={workflow}
                        onAction={(kind, item) =>
                          setPendingAction({ kind, workflow: item })
                        }
                        onDefault={(item) => void handleDefault(item)}
                        onEdit={(item) => navigate(`/workflows/${item.id}`)}
                        t={t}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="grid gap-3 md:hidden">
            {query.data.items.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {workflow.name}
                      </CardTitle>
                      <CardDescription className="mt-1 font-mono">
                        #{workflow.id}
                      </CardDescription>
                    </div>
                    <StatusBadge status={workflow.status} t={t} />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/30 p-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t(translations.workflows.stageCount)}
                      </p>
                      <p className="mt-1 font-semibold">
                        {workflow.stageCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t(translations.workflows.updatedAt)}
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatDate(workflow.updatedAt, i18n.language)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-sm text-muted-foreground">
                      {workflow.isDefault
                        ? t(translations.workflows.defaultShort)
                        : t(translations.workflows.no)}
                    </span>
                    <WorkflowActions
                      workflow={workflow}
                      onAction={(kind, item) =>
                        setPendingAction({ kind, workflow: item })
                      }
                      onDefault={(item) => void handleDefault(item)}
                      onEdit={(item) => navigate(`/workflows/${item.id}`)}
                      t={t}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              {query.data.page + 1} / {query.data.pageCount} ·{' '}
              {query.data.total}
            </span>
            <div className="flex gap-2">
              <Button
                disabled={query.data.page <= 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                size="sm"
                type="button"
                variant="outline"
              >
                <ChevronLeft aria-hidden="true" />
                {t(translations.stages.previousPage)}
              </Button>
              <Button
                disabled={query.data.page >= query.data.pageCount - 1}
                onClick={() => setPage((current) => current + 1)}
                size="sm"
                type="button"
                variant="outline"
              >
                {t(translations.stages.nextPage)}
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <CreateWorkflowDialog
        isPending={createMutation.isPending}
        onCancel={() => setCreateOpen(false)}
        onSubmit={(name) => void handleCreate(name)}
        open={createOpen}
        t={t}
      />
      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {actionCopy?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t(translations.workflows.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isActionPending}
              onClick={(event) => {
                event.preventDefault();
                void confirmAction();
              }}
            >
              {t(translations.workflows.confirm)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
