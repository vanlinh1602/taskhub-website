import {
  ArrowLeft,
  MoreHorizontal,
  Plus,
  Save,
  Undo2,
  Workflow,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDeactivateWorkflowMutation,
  usePublishWorkflowMutation,
  useRestoreWorkflowMutation,
  useSaveWorkflowMutation,
  useSetDefaultWorkflowMutation,
  useWorkflowStageCatalogQuery,
  useWorkflowTemplateQuery,
} from '@/features/workflows/hooks';
import {
  initialWorkflowEditorState,
  reduceWorkflowEditor,
} from '@/features/workflows/utils/editorState';
import {
  configurationToGraph,
  createWorkflowEdge,
  createWorkflowNode,
  getTerminalNodeIds,
  getWorkflowTotals,
  removeWorkflowNode,
  serializeWorkflowGraph,
  topologicalLayers,
  type WorkflowGraphNodeData,
  type WorkflowGraphValidationError,
} from '@/features/workflows/utils/graph';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { useMediaQuery } from '@/hooks/use-media-query';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';
import { formatMoney } from '@/utils/money';

import WorkflowStatusBadge from '../WorkflowStatusBadge';
import StageInspector from './StageInspector';
import WorkflowFlow from './WorkflowFlow';

const SIDE_PANEL_QUERY = '(min-width: 1280px)';

type ConfirmKind = 'deactivate' | 'publish' | 'save';

const CONFIRM_COPY = {
  deactivate: {
    description: translations.workflows.deactivateDescription,
    title: translations.workflows.deactivateTitle,
  },
  publish: {
    description: translations.workflows.publishDescription,
    title: translations.workflows.publishTitle,
  },
  save: {
    description: translations.workflows.activeSaveDescription,
    title: translations.workflows.activeSaveTitle,
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

function applyNodeData(
  data: WorkflowGraphNodeData,
  patch: Partial<WorkflowGraphNodeData>,
): WorkflowGraphNodeData {
  const next = { ...data, ...patch };
  return {
    ...next,
    effectiveDurationHours:
      next.durationHoursOverride ?? next.stageDefinition.defaultDurationHours,
    effectivePrice: next.priceOverride ?? next.stageDefinition.defaultPrice,
  };
}

function validationMessage(
  error: WorkflowGraphValidationError,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (error.code === 'empty') return t(translations.workflows.validationEmpty);
  if (error.code === 'cycle') return t(translations.workflows.validationCycle);
  if (error.code === 'self-loop')
    return t(translations.workflows.validationSelfLoop);
  if (error.code === 'duplicate-edge')
    return t(translations.workflows.validationDuplicateEdge);
  if (error.code === 'outside-workflow')
    return t(translations.workflows.validationOutside);
  return t(translations.workflows.validationDuplicateNode);
}

function ErrorState({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(translations.workflows.error)}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button onClick={onRetry} type="button" variant="outline">
          {t(translations.workflows.retry)}
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  description,
  icon,
  title,
}: {
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly title: string;
}) {
  return (
    <Empty className="min-h-96 border bg-card/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
    </Empty>
  );
}

export default function WorkflowEditorPage() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { workflowId = '' } = useParams<{ workflowId: string }>();
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const hasSidePanel = useMediaQuery(SIDE_PANEL_QUERY);
  const detailQuery = useWorkflowTemplateQuery(workspaceId, workflowId);
  const catalogQuery = useWorkflowStageCatalogQuery(workspaceId);
  const saveMutation = useSaveWorkflowMutation(workspaceId);
  const publishMutation = usePublishWorkflowMutation(workspaceId);
  const restoreMutation = useRestoreWorkflowMutation(workspaceId);
  const deactivateMutation = useDeactivateWorkflowMutation(workspaceId);
  const defaultMutation = useSetDefaultWorkflowMutation(workspaceId);
  const [editor, dispatch] = useReducer(
    reduceWorkflowEditor,
    initialWorkflowEditorState,
  );
  const [name, setName] = useState('');
  const [initializedKey, setInitializedKey] = useState('');
  const [editorError, setEditorError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    readonly WorkflowGraphValidationError[]
  >([]);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { edges, history, isDirty, nodes, selectedNodeId } = editor;

  useEffect(() => {
    const configuration = detailQuery.data;
    if (!configuration) return;
    const nextKey = `${configuration.template.id}:${configuration.template.updatedAt}`;
    if (initializedKey === nextKey) return;
    const graph = configurationToGraph(configuration);
    setName(configuration.template.name);
    dispatch({ type: 'load', edges: graph.edges, nodes: graph.nodes });
    setInitializedKey(nextKey);
    setEditorError(null);
    setValidationErrors([]);
  }, [detailQuery.data, initializedKey]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const availableStages = useMemo(
    () =>
      (catalogQuery.data ?? []).filter(
        (stage) =>
          stage.isActive &&
          !nodes.some((node) => node.id === String(stage.id)),
      ),
    [catalogQuery.data, nodes],
  );
  const stepCount = useMemo(
    () => topologicalLayers(nodes, edges).length,
    [edges, nodes],
  );
  const totals = useMemo(() => getWorkflowTotals(nodes, edges), [edges, nodes]);
  const currency = nodes[0]?.data.stageDefinition.currency ?? '';

  function clearErrors(): void {
    setEditorError(null);
    setValidationErrors([]);
  }

  function selectNode(nodeId: string): void {
    dispatch({ type: 'select', nodeId });
    setIsSheetOpen(true);
  }

  function addStage(stageId: string): void {
    const stage = availableStages.find((item) => String(item.id) === stageId);
    if (!stage) return;
    const node = createWorkflowNode(stage);
    const sources = selectedNodeId
      ? [selectedNodeId]
      : getTerminalNodeIds(nodes, edges);
    dispatch({
      type: 'change',
      edges: [
        ...edges,
        ...sources.map((source) => createWorkflowEdge(source, node.id)),
      ],
      nodes: [...nodes, node],
      selectedNodeId: node.id,
    });
    clearErrors();
  }

  function removeSelectedNode(): void {
    if (!selectedNode) return;
    dispatch({
      type: 'change',
      ...removeWorkflowNode(nodes, edges, selectedNode.id),
      selectedNodeId: null,
    });
    setIsSheetOpen(false);
    clearErrors();
    toast.success(
      t(translations.workflows.stageRemoved, {
        name: selectedNode.data.stageDefinition.name,
      }),
      {
        action: {
          label: t(translations.workflows.undo),
          onClick: () => dispatch({ type: 'undo' }),
        },
      },
    );
  }

  function changePrerequisite(sourceId: string, isChecked: boolean): void {
    if (!selectedNodeId) return;
    const edge = createWorkflowEdge(sourceId, selectedNodeId);
    dispatch({
      type: 'change',
      edges: isChecked
        ? [...edges, edge]
        : edges.filter((item) => item.id !== edge.id),
    });
    clearErrors();
  }

  function patchSelectedNode(
    patch: Partial<WorkflowGraphNodeData>,
    mergeKey: string,
  ): void {
    if (!selectedNode) return;
    dispatch({
      type: 'change',
      mergeKey: `${mergeKey}:${selectedNode.id}`,
      nodes: nodes.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: applyNodeData(node.data, patch) }
          : node,
      ),
    });
    clearErrors();
  }

  function changeDuration(value: string): void {
    if (!selectedNode) return;
    const isDefault =
      Number(value) ===
      selectedNode.data.stageDefinition.defaultDurationHours;
    patchSelectedNode(
      {
        durationHoursOverride: value && !isDefault ? Number(value) : null,
        durationOverrideEnabled: !isDefault,
      },
      'duration',
    );
  }

  function changePrice(value: string): void {
    if (!selectedNode) return;
    const isDefault =
      value !== '' &&
      Number(value) === Number(selectedNode.data.stageDefinition.defaultPrice);
    patchSelectedNode(
      {
        priceOverride: value && !isDefault ? value : null,
        priceOverrideEnabled: !isDefault,
      },
      'price',
    );
  }

  function validateAndSerialize() {
    if (!name.trim()) {
      setEditorError(t(translations.workflows.invalidName));
      setValidationErrors([]);
      return null;
    }
    const invalidDuration = nodes.some(
      (node) =>
        node.data.durationOverrideEnabled === true &&
        (node.data.durationHoursOverride === null ||
          !Number.isInteger(node.data.durationHoursOverride) ||
          node.data.durationHoursOverride < 1),
    );
    if (invalidDuration) {
      setEditorError(t(translations.workflows.invalidDuration));
      setValidationErrors([]);
      return null;
    }
    const invalidPrice = nodes.some(
      (node) =>
        node.data.priceOverrideEnabled === true &&
        (node.data.priceOverride === null ||
          !/^\d{1,12}(?:\.\d{1,2})?$/.test(node.data.priceOverride)),
    );
    if (invalidPrice) {
      setEditorError(t(translations.workflows.invalidPrice));
      setValidationErrors([]);
      return null;
    }
    setEditorError(null);
    const result = serializeWorkflowGraph(name, nodes, edges);
    setValidationErrors(result.errors);
    return result.errors.length === 0 ? (result.payload ?? null) : null;
  }

  async function executeSave(): Promise<boolean> {
    const payload = validateAndSerialize();
    if (!payload) return false;
    try {
      await saveMutation.mutateAsync({ templateId: workflowId, payload });
      toast.success(t(translations.workflows.saveSuccess));
      return true;
    } catch (error) {
      toast.error(formatError(error));
      return false;
    }
  }

  function requestSave(): void {
    if (!name.trim()) {
      setEditorError(t(translations.workflows.invalidName));
      return;
    }
    if (detailQuery.data?.template.status === 'ACTIVE') setConfirmKind('save');
    else void executeSave();
  }

  async function publish(): Promise<void> {
    if (isDirty && !(await executeSave())) return;
    try {
      await publishMutation.mutateAsync({ templateId: workflowId });
      toast.success(t(translations.workflows.publishSuccess));
      await detailQuery.refetch();
    } catch (error) {
      toast.error(formatError(error));
    }
  }

  async function changeStatus(action: 'restore' | 'deactivate'): Promise<void> {
    try {
      if (action === 'restore')
        await restoreMutation.mutateAsync({ templateId: workflowId });
      else await deactivateMutation.mutateAsync({ templateId: workflowId });
      toast.success(t(translations.workflows.statusSuccess));
      await detailQuery.refetch();
    } catch (error) {
      toast.error(formatError(error));
    }
  }

  async function changeDefault(): Promise<void> {
    try {
      await defaultMutation.mutateAsync(
        detailQuery.data?.isDefault ? null : workflowId,
      );
      toast.success(t(translations.workflows.defaultSuccess));
      await detailQuery.refetch();
    } catch (error) {
      toast.error(formatError(error));
    }
  }

  function runConfirmedAction(): void {
    const kind = confirmKind;
    setConfirmKind(null);
    if (kind === 'save') void executeSave();
    if (kind === 'publish') void publish();
    if (kind === 'deactivate') void changeStatus('deactivate');
  }

  function goBack(): void {
    if (isDirty && !window.confirm(t(translations.workflows.unsaved))) return;
    navigate('/workflows');
  }

  if (!workspaceId)
    return (
      <EmptyState
        icon={<Workflow aria-hidden="true" className="size-4" />}
        title={t(translations.workflows.noWorkspace)}
        description={t(translations.workflows.noWorkspaceDescription)}
      />
    );
  if (detailQuery.isPending)
    return (
      <div className="grid gap-4">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-[520px] rounded-2xl" />
      </div>
    );
  if (detailQuery.isError && isForbiddenError(detailQuery.error))
    return (
      <EmptyState
        icon={<XCircle aria-hidden="true" className="size-4" />}
        title={t(translations.workflows.forbidden)}
        description=""
      />
    );
  if (detailQuery.isError || !detailQuery.data)
    return (
      <ErrorState
        message={
          detailQuery.error
            ? formatError(detailQuery.error)
            : t(translations.workflows.error)
        }
        onRetry={() => void detailQuery.refetch()}
      />
    );

  const configuration = detailQuery.data;
  const status = configuration.template.status;
  const isActionPending =
    saveMutation.isPending ||
    publishMutation.isPending ||
    restoreMutation.isPending ||
    deactivateMutation.isPending ||
    defaultMutation.isPending;
  const confirmCopy = confirmKind ? CONFIRM_COPY[confirmKind] : null;
  const selectedStageName = selectedNode?.data.stageDefinition.name;
  const stats = [
    { label: t(translations.workflows.stageCount), value: nodes.length },
    { label: t(translations.workflows.steps), value: stepCount },
    {
      label: t(translations.workflows.minimumDuration),
      value: `${totals.minimumHours} ${t(translations.workflows.hours)}`,
    },
    {
      label: t(translations.workflows.totalPrice),
      value: formatMoney(totals.totalPrice, currency, i18n.language),
    },
  ];

  const inspector = selectedNode ? (
    <StageInspector
      edges={edges}
      key={selectedNode.id}
      language={i18n.language}
      node={selectedNode}
      nodes={nodes}
      onDurationChange={changeDuration}
      onPrerequisiteChange={changePrerequisite}
      onPriceChange={changePrice}
      onRemove={removeSelectedNode}
      onResetDuration={() =>
        patchSelectedNode(
          { durationHoursOverride: null, durationOverrideEnabled: false },
          'duration',
        )
      }
      onResetPrice={() =>
        patchSelectedNode(
          { priceOverride: null, priceOverrideEnabled: false },
          'price',
        )
      }
    />
  ) : null;

  return (
    <section className="flex min-h-0 flex-col gap-4">
      <h2 className="sr-only">{t(translations.workflows.editorTitle)}</h2>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <Button
          aria-label={t(translations.workflows.back)}
          onClick={goBack}
          size="icon-lg"
          type="button"
          variant="ghost"
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <div className="flex min-w-0 flex-[999_1_20rem] flex-wrap items-center gap-2">
          <Input
            aria-label={t(translations.workflows.name)}
            className="h-11 max-w-md min-w-0 flex-1 border-transparent bg-transparent px-2 text-xl font-extrabold tracking-tight shadow-none hover:bg-card/60 focus-visible:border-input focus-visible:bg-card sm:text-2xl"
            maxLength={100}
            onChange={(event) => {
              setName(event.target.value);
              setEditorError(null);
              dispatch({ type: 'mark-dirty' });
            }}
            value={name}
          />
          <WorkflowStatusBadge status={status} />
          {configuration.isDefault ? (
            <span className="rounded-full bg-positive-surface px-2 py-0.5 text-xs font-semibold text-positive">
              {t(translations.workflows.defaultShort)}
            </span>
          ) : null}
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {t(translations.workflows.version, {
              version: configuration.template.configurationVersion,
            })}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            aria-live="polite"
            className={
              isDirty
                ? 'text-[0.8125rem] font-semibold text-amber-700 dark:text-amber-300'
                : 'text-[0.8125rem] font-semibold text-muted-foreground'
            }
          >
            {isDirty
              ? t(translations.workflows.unsavedShort)
              : t(translations.workflows.saved)}
          </span>
          <Button
            disabled={history.length === 0}
            onClick={() => dispatch({ type: 'undo' })}
            type="button"
            variant="outline"
          >
            <Undo2 aria-hidden="true" />
            {t(translations.workflows.undo)}
          </Button>
          {status === 'DRAFT' ? (
            <Button
              disabled={isActionPending || nodes.length === 0}
              onClick={() => setConfirmKind('publish')}
              type="button"
              variant="outline"
            >
              {t(translations.workflows.publish)}
            </Button>
          ) : null}
          {status === 'INACTIVE' ? (
            <Button
              disabled={isActionPending}
              onClick={() => void changeStatus('restore')}
              type="button"
              variant="outline"
            >
              {t(translations.workflows.restore)}
            </Button>
          ) : null}
          <Button
            disabled={!isDirty || isActionPending}
            loading={saveMutation.isPending}
            onClick={requestSave}
            type="button"
          >
            {saveMutation.isPending ? null : <Save aria-hidden="true" />}
            {status === 'DRAFT'
              ? t(translations.workflows.save)
              : t(translations.workflows.saveChanges)}
          </Button>
          {status === 'ACTIVE' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={t(translations.workflows.actions)}
                  disabled={isActionPending}
                  size="icon-lg"
                  type="button"
                  variant="ghost"
                >
                  <MoreHorizontal aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => void changeDefault()}>
                  {configuration.isDefault
                    ? t(translations.workflows.clearDefault)
                    : t(translations.workflows.setDefault)}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setConfirmKind('deactivate')}>
                  {t(translations.workflows.deactivate)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {editorError || validationErrors.length > 0 ? (
        <div
          className="grid gap-1 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive"
          role="alert"
        >
          {editorError ? <p>{editorError}</p> : null}
          {validationErrors.map((error, index) => (
            <p key={`${error.code}-${index}`}>{validationMessage(error, t)}</p>
          ))}
        </div>
      ) : null}

      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--soft-shadow)]">
          <div className="grid gap-2 border-b border-border/70 px-4 py-3">
            <p className="text-[0.8125rem] text-muted-foreground">
              {selectedStageName
                ? t(translations.workflows.addAfter, {
                    name: selectedStageName,
                  })
                : t(translations.workflows.addToEnd)}
            </p>
            {availableStages.length > 0 ? (
              <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                {availableStages.map((stage) => (
                  <Button
                    aria-label={`${t(translations.workflows.addStage)}: ${stage.name}`}
                    key={stage.id}
                    onClick={() => addStage(String(stage.id))}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Plus aria-hidden="true" />
                    {stage.name}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-[0.8125rem] font-medium">
                {t(translations.workflows.noStagesDescription)}
              </p>
            )}
          </div>
          <div className="flex min-h-[28rem] flex-1 overflow-x-auto bg-background bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:22px_22px] p-4">
            <WorkflowFlow
              edges={edges}
              nodes={nodes}
              onSelect={selectNode}
              selectedNodeId={selectedNodeId}
            />
          </div>
          <dl className="flex flex-wrap gap-x-8 gap-y-2 border-t border-border/70 px-5 py-3">
            {stats.map((stat) => (
              <div className="flex items-baseline gap-1.5" key={stat.label}>
                <dt className="text-[0.8125rem] text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="font-bold">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {hasSidePanel ? (
          <aside
            aria-label={t(translations.workflows.inspector)}
            className="rounded-2xl border border-border/70 bg-card p-4"
          >
            {inspector ?? (
              <div className="grid gap-2">
                <h3 className="font-extrabold">
                  {t(translations.workflows.inspector)}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t(translations.workflows.selectNode)}
                </p>
              </div>
            )}
          </aside>
        ) : (
          <Sheet
            onOpenChange={setIsSheetOpen}
            open={isSheetOpen && Boolean(selectedNode)}
          >
            <SheetContent
              className="w-[min(92vw,24rem)] overflow-y-auto"
              side="right"
            >
              <SheetHeader>
                <SheetTitle>{t(translations.workflows.inspector)}</SheetTitle>
                <SheetDescription>{selectedStageName}</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">{inspector}</div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <AlertDialog
        open={confirmKind !== null}
        onOpenChange={(open) => !open && setConfirmKind(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmCopy ? t(confirmCopy.title) : null}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCopy ? t(confirmCopy.description) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t(translations.workflows.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isActionPending}
              onClick={runConfirmedAction}
            >
              {t(translations.workflows.confirm)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
