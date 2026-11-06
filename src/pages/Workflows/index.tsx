import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Workflow,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { FetchingBadge } from '@/components/fetching-overlay';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

import WorkflowRow, { type WorkflowActionKind } from './WorkflowRow';

const ALL_STATUSES: readonly WorkflowTemplateStatus[] = [
  'DRAFT',
  'ACTIVE',
  'INACTIVE',
];
const FILTERS = ['ALL', 'ACTIVE', 'DRAFT', 'INACTIVE'] as const;
type FilterStatus = (typeof FILTERS)[number];

const FILTER_LABELS = {
  ACTIVE: translations.workflows.active,
  ALL: translations.workflows.all,
  DRAFT: translations.workflows.draft,
  INACTIVE: translations.workflows.inactive,
} as const;

const ACTION_COPY = {
  deactivate: {
    confirm: translations.workflows.deactivate,
    description: translations.workflows.deactivateDescription,
    title: translations.workflows.deactivateTitle,
  },
  delete: {
    confirm: translations.workflows.delete,
    description: translations.workflows.deleteDescription,
    title: translations.workflows.deleteTitle,
  },
  publish: {
    confirm: translations.workflows.publish,
    description: translations.workflows.publishDescription,
    title: translations.workflows.publishTitle,
  },
  restore: {
    confirm: translations.workflows.restore,
    description: translations.workflows.restoreDescription,
    title: translations.workflows.restoreTitle,
  },
} as const;

function isForbiddenError(error: unknown): boolean {
  const message = formatError(error).toLocaleLowerCase();
  return (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('quyền')
  );
}

function CreateWorkflowDialog({
  isPending,
  onCancel,
  onSubmit,
  open,
}: {
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (name: string) => void;
  readonly open: boolean;
}) {
  const { t } = useTranslation();
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
            <Button loading={isPending} type="submit">
              {t(translations.workflows.create)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LoadingState({ label }: { readonly label: string }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label={label} role="status">
      {[1, 2, 3].map((item) => (
        <Skeleton className="h-24 rounded-2xl" key={item} />
      ))}
    </div>
  );
}

export default function WorkflowsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    readonly kind: WorkflowActionKind;
    readonly workflow: WorkflowTemplateSummary;
  } | null>(null);
  const statuses = filter === 'ALL' ? ALL_STATUSES : [filter];
  const normalizedSearch = searchText.trim().toLocaleLowerCase();
  const query = useWorkflowTemplatesQuery(workspaceId, statuses, page, normalizedSearch);
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
    deleteMutation.isPending ||
    defaultMutation.isPending;

  const visibleWorkflows = useMemo(
    () =>
      (query.data?.items ?? [])
        .filter((workflow) =>
          workflow.name.toLocaleLowerCase().includes(normalizedSearch),
        )
        .sort(
          (first, second) =>
            Number(second.isDefault) - Number(first.isDefault),
        ),
    [normalizedSearch, query.data?.items],
  );

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

  const actionCopy = pendingAction ? ACTION_COPY[pendingAction.kind] : null;

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
    <section className="flex min-h-96 flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t(translations.workflows.title)}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t(translations.workflows.description)}
          </p>
        </div>
        <Button
          className="shadow-[var(--control-shadow)]"
          disabled={createMutation.isPending}
          onClick={() => setCreateOpen(true)}
          type="button"
        >
          <Plus aria-hidden="true" />
          {t(translations.workflows.create)}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          aria-label={t(translations.workflows.status)}
          className="flex flex-wrap gap-0.5 rounded-xl bg-secondary p-1"
          role="group"
        >
          {FILTERS.map((value) => (
            <Button
              aria-pressed={filter === value}
              className={
                filter === value
                  ? 'bg-card font-bold shadow-sm hover:bg-card'
                  : 'text-muted-foreground'
              }
              key={value}
              onClick={() => {
                setFilter(value);
                setPage(0);
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              {t(FILTER_LABELS[value])}
            </Button>
          ))}
        </div>
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label={t(translations.workflows.search)}
            className="pl-9"
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(0);
            }}
            maxLength={100}
            placeholder={t(translations.workflows.search)}
            type="search"
            value={searchText}
          />
        </div>
      </div>

      {query.isPending ? (
        <LoadingState label={t(translations.workflows.loading)} />
      ) : null}
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
      {query.data && query.data.items.length === 0 && !normalizedSearch ? (
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
      {query.data && (query.data.items.length > 0 || normalizedSearch) ? (
        <div
          aria-busy={query.isFetching}
          className={`relative rounded-2xl border border-border/70 bg-card shadow-[var(--soft-shadow)] transition-opacity ${query.isFetching && !query.isPending ? 'opacity-60' : ''}`}
        >
          <FetchingBadge active={query.isFetching && !query.isPending} />
          {visibleWorkflows.length > 0 ? (
            <ul aria-label={t(translations.workflows.title)}>
              {visibleWorkflows.map((workflow) => (
                <WorkflowRow
                  isPending={isActionPending}
                  key={workflow.id}
                  locale={i18n.language}
                  onAction={(kind, item) =>
                    setPendingAction({ kind, workflow: item })
                  }
                  onDefault={(item) => void handleDefault(item)}
                  workflow={workflow}
                />
              ))}
            </ul>
          ) : (
            <Empty className="min-h-64 border-0">
              <EmptyHeader>
                <EmptyTitle>{t(translations.workflows.noResults)}</EmptyTitle>
                <EmptyDescription>
                  {t(translations.workflows.noResultsDescription)}
                </EmptyDescription>
              </EmptyHeader>
              <Button
                onClick={() => setSearchText('')}
                type="button"
                variant="outline"
              >
                {t(translations.workflows.clearSearch)}
              </Button>
            </Empty>
          )}
        </div>
      ) : null}
      {query.data && query.data.pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {query.data.page + 1} / {query.data.pageCount} · {query.data.total}
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
      ) : null}

      <CreateWorkflowDialog
        isPending={createMutation.isPending}
        onCancel={() => setCreateOpen(false)}
        onSubmit={(name) => void handleCreate(name)}
        open={createOpen}
      />
      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionCopy ? t(actionCopy.title) : null}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionCopy ? t(actionCopy.description) : null}
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
              variant={
                pendingAction?.kind === 'delete' ? 'destructive' : 'default'
              }
            >
              {actionCopy ? t(actionCopy.confirm) : null}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
