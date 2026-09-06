import '@xyflow/react/dist/style.css';

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  type Connection,
  Controls,
  type Edge,
  type EdgeChange,
  Handle,
  MarkerType,
  MiniMap,
  type Node,
  type NodeChange,
  type NodeProps,
  Position,
  ReactFlow,
} from '@xyflow/react';
import {
  ArrowLeft,
  Check,
  CircleAlert,
  GitBranch,
  Plus,
  Save,
  Trash2,
  Workflow,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { WorkflowTemplateStatus } from '@/features/workflows/types';
import {
  configurationToGraph,
  serializeWorkflowGraph,
  topologicalLayers,
  type WorkflowGraphEdge,
  type WorkflowGraphNode,
  type WorkflowGraphNodeData,
  type WorkflowGraphValidationError,
} from '@/features/workflows/utils/graph';
import { useWorkspaceStore } from '@/features/workspace/hooks';
import { translations } from '@/locales/translations';
import formatError from '@/utils/formatError';

type FlowNode = Node<WorkflowGraphNodeData, 'workflow'>;
type FlowEdge = Edge;

function isForbiddenError(error: unknown): boolean {
  const message = formatError(error).toLocaleLowerCase();
  return (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('quyền')
  );
}

function effectiveDuration(data: WorkflowGraphNodeData): number {
  return (
    data.durationHoursOverride ?? data.stageDefinition.defaultDurationHours
  );
}

function effectivePrice(data: WorkflowGraphNodeData): string {
  return data.priceOverride ?? data.stageDefinition.defaultPrice;
}

function WorkflowNode({ data, selected }: NodeProps<FlowNode>) {
  return (
    <div
      className={`relative min-w-52 rounded-2xl border bg-card px-4 py-3 shadow-sm transition ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-border/80'}`}
    >
      <Handle
        className="!size-2.5 !border-2 !border-background !bg-primary"
        position={Position.Left}
        type="target"
      />
      <Handle
        className="!size-2.5 !border-2 !border-background !bg-primary"
        position={Position.Right}
        type="source"
      />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {data.stageDefinition.name}
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {data.stageDefinition.code}
          </p>
        </div>
        {!data.stageDefinition.isActive ? (
          <XCircle
            aria-label="Inactive"
            className="size-4 shrink-0 text-amber-600"
          />
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <span>{effectiveDuration(data)}h</span>
        <span className="text-right">
          {effectivePrice(data)} {data.stageDefinition.currency}
        </span>
      </div>
    </div>
  );
}

const nodeTypes = { workflow: WorkflowNode };

function statusLabel(
  status: WorkflowTemplateStatus,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (status === 'DRAFT') return t(translations.workflows.draft);
  if (status === 'ACTIVE') return t(translations.workflows.active);
  return t(translations.workflows.inactive);
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

function InspectorContent({
  idPrefix,
  node,
  onChange,
  onRemove,
  t,
}: {
  readonly idPrefix: string;
  readonly node: FlowNode | undefined;
  readonly onChange: (patch: Partial<WorkflowGraphNodeData>) => void;
  readonly onRemove: () => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  if (!node) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        {t(translations.workflows.selectNode)}
      </p>
    );
  }
  const { data } = node;
  const durationOverrideId = `${idPrefix}-workflow-duration-override`;
  const durationInputId = `${idPrefix}-workflow-duration`;
  const priceOverrideId = `${idPrefix}-workflow-price-override`;
  const priceInputId = `${idPrefix}-workflow-price`;
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-base font-semibold">{data.stageDefinition.name}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {data.stageDefinition.code}
        </p>
      </div>
      {!data.stageDefinition.isActive ? (
        <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-200">
          {t(translations.workflows.inactiveStage)}
        </p>
      ) : null}
      <div className="grid gap-3 rounded-xl bg-muted/30 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">
            {t(translations.workflows.duration)}
          </span>
          <span className="font-semibold">
            {effectiveDuration(data)} {t(translations.workflows.hours)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">
            {t(translations.workflows.price)}
          </span>
          <span className="font-semibold">
            {effectivePrice(data)} {data.stageDefinition.currency}
          </span>
        </div>
      </div>
      <div className="grid gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-border/70 p-3 transition-colors has-[:focus-visible]:border-primary/50 has-[:hover]:bg-muted/30">
          <Checkbox
            checked={data.durationOverrideEnabled === true}
            id={durationOverrideId}
            onCheckedChange={(checked) =>
              onChange({
                durationHoursOverride: checked
                  ? (data.durationHoursOverride ??
                    data.stageDefinition.defaultDurationHours)
                  : null,
                durationOverrideEnabled: checked === true,
              })
            }
          />
          <div className="grid gap-1">
            <Label htmlFor={durationOverrideId}>
              {t(translations.workflows.overrideDuration)}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t(translations.workflows.catalogDefault)}
            </p>
          </div>
        </div>
        {data.durationOverrideEnabled ? (
          <div className="grid gap-2 pl-7">
            <Label htmlFor={durationInputId}>
              {t(translations.workflows.durationInput)}
            </Label>
            <Input
              id={durationInputId}
              min={1}
              onChange={(event) =>
                onChange({
                  durationHoursOverride: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
              type="number"
              value={data.durationHoursOverride ?? ''}
            />
          </div>
        ) : null}
        <div className="flex items-start gap-3 rounded-xl border border-border/70 p-3 transition-colors has-[:focus-visible]:border-primary/50 has-[:hover]:bg-muted/30">
          <Checkbox
            checked={data.priceOverrideEnabled === true}
            id={priceOverrideId}
            onCheckedChange={(checked) =>
              onChange({
                priceOverride: checked
                  ? (data.priceOverride ?? data.stageDefinition.defaultPrice)
                  : null,
                priceOverrideEnabled: checked === true,
              })
            }
          />
          <div className="grid gap-1">
            <Label htmlFor={priceOverrideId}>
              {t(translations.workflows.overridePrice)}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t(translations.workflows.catalogDefault)}
            </p>
          </div>
        </div>
        {data.priceOverrideEnabled ? (
          <div className="grid gap-2 pl-7">
            <Label htmlFor={priceInputId}>
              {t(translations.workflows.priceInput)}
            </Label>
            <Input
              id={priceInputId}
              inputMode="decimal"
              onChange={(event) =>
                onChange({ priceOverride: event.target.value || null })
              }
              value={data.priceOverride ?? ''}
            />
          </div>
        ) : null}
      </div>
      <Button
        className="w-full"
        onClick={onRemove}
        type="button"
        variant="outline"
      >
        <Trash2 aria-hidden="true" />
        {t(translations.workflows.removeStage)}
      </Button>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  t,
}: {
  readonly message: string;
  readonly onRetry: () => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
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

export default function WorkflowEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workflowId = '' } = useParams<{ workflowId: string }>();
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const detailQuery = useWorkflowTemplateQuery(workspaceId, workflowId);
  const catalogQuery = useWorkflowStageCatalogQuery(workspaceId);
  const saveMutation = useSaveWorkflowMutation(workspaceId);
  const publishMutation = usePublishWorkflowMutation(workspaceId);
  const restoreMutation = useRestoreWorkflowMutation(workspaceId);
  const deactivateMutation = useDeactivateWorkflowMutation(workspaceId);
  const defaultMutation = useSetDefaultWorkflowMutation(workspaceId);
  const [name, setName] = useState('');
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [initializedKey, setInitializedKey] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    readonly WorkflowGraphValidationError[]
  >([]);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [removeNodeId, setRemoveNodeId] = useState<string | null>(null);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  function openMobileInspector(): void {
    if (window.matchMedia('(max-width: 1023px)').matches)
      setMobileInspectorOpen(true);
  }

  useEffect(() => {
    const configuration = detailQuery.data;
    if (!configuration) return;
    const nextKey = `${configuration.template.id}:${configuration.template.updatedAt}`;
    if (initializedKey === nextKey) return;
    const graph = configurationToGraph(configuration);
    setName(configuration.template.name);
    setNodes(graph.nodes.map((node) => ({ ...node, type: 'workflow' })));
    setEdges(
      graph.edges.map((edge) => ({
        ...edge,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
      })),
    );
    setInitializedKey(nextKey);
    setIsDirty(false);
    setEditorError(null);
    setValidationErrors([]);
  }, [detailQuery.data, initializedKey]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const presentStageIds = useMemo(
    () => new Set(nodes.map((node) => node.id)),
    [nodes],
  );
  const catalogStages = catalogQuery.data ?? [];
  const availableStages = catalogStages.filter(
    (stage) => stage.isActive && !presentStageIds.has(String(stage.id)),
  );
  const graphNodes = nodes as readonly WorkflowGraphNode[];
  const graphEdges = edges as readonly WorkflowGraphEdge[];
  const layers = useMemo(
    () => topologicalLayers(graphNodes, graphEdges),
    [graphEdges, graphNodes],
  );

  const handleNodesChange = useCallback((changes: NodeChange<FlowNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
    if (changes.some((change) => change.type === 'remove')) {
      setEdges((current) =>
        current.filter((edge) =>
          changes.every(
            (change) =>
              change.type !== 'remove' ||
              (change.id !== edge.source && change.id !== edge.target),
          ),
        ),
      );
      setIsDirty(true);
    }
  }, []);
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
    if (changes.some((change) => change.type === 'remove')) setIsDirty(true);
  }, []);
  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        current,
      ),
    );
    setIsDirty(true);
    setEditorError(null);
    setValidationErrors([]);
  }, []);

  function updateSelectedNode(patch: Partial<WorkflowGraphNodeData>): void {
    if (!selectedNodeId) return;
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== selectedNodeId) return node;
        const data = { ...node.data, ...patch };
        return {
          ...node,
          data: {
            ...data,
            effectiveDurationHours: effectiveDuration(data),
            effectivePrice: effectivePrice(data),
          },
        };
      }),
    );
    setIsDirty(true);
    setValidationErrors([]);
  }

  function addStage(stageId: string): void {
    const stage = catalogStages.find((item) => String(item.id) === stageId);
    if (!stage || presentStageIds.has(stageId)) return;
    setNodes((current) => [
      ...current,
      {
        id: stageId,
        position: { x: 80, y: current.length * 150 },
        type: 'workflow',
        data: {
          stageDefinitionId: stageId,
          stageDefinition: stage,
          durationHoursOverride: null,
          durationOverrideEnabled: false,
          priceOverride: null,
          priceOverrideEnabled: false,
          effectiveDurationHours: stage.defaultDurationHours,
          effectivePrice: stage.defaultPrice,
        },
      },
    ]);
    setSelectedNodeId(stageId);
    openMobileInspector();
    setIsDirty(true);
    setEditorError(null);
    toast.success(t(translations.workflows.stageAdded));
  }

  function removeSelectedNode(): void {
    if (!selectedNodeId) return;
    if (
      edges.some(
        (edge) =>
          edge.source === selectedNodeId || edge.target === selectedNodeId,
      )
    ) {
      setRemoveNodeId(selectedNodeId);
      return;
    }
    removeNode(selectedNodeId);
  }

  function removeNode(nodeId: string): void {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setEdges((current) =>
      current.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
    );
    setSelectedNodeId(null);
    setRemoveNodeId(null);
    setMobileInspectorOpen(false);
    setIsDirty(true);
    setEditorError(null);
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
    const result = serializeWorkflowGraph(name, graphNodes, graphEdges);
    setValidationErrors(result.errors);
    return result.errors.length === 0 ? (result.payload ?? null) : null;
  }

  async function executeSave(): Promise<boolean> {
    const payload = validateAndSerialize();
    if (!payload) return false;
    try {
      await saveMutation.mutateAsync({ templateId: workflowId, payload });
      setIsDirty(false);
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
    if (detailQuery.data?.template.status === 'ACTIVE')
      setSaveConfirmOpen(true);
    else void executeSave();
  }

  async function confirmPublish(): Promise<void> {
    setPublishConfirmOpen(false);
    if (isDirty && !(await executeSave())) return;
    try {
      await publishMutation.mutateAsync({ templateId: workflowId });
      toast.success(t(translations.workflows.publishSuccess));
      await detailQuery.refetch();
    } catch (error) {
      toast.error(formatError(error));
    }
  }

  async function handleStatusAction(
    action: 'restore' | 'deactivate',
  ): Promise<void> {
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

  async function handleDefault(): Promise<void> {
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
        <Skeleton className="h-24 rounded-2xl" />
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
        t={t}
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

  function renderInspector(idPrefix: string): React.ReactNode {
    return (
      <InspectorContent
        idPrefix={idPrefix}
        node={selectedNode}
        onChange={updateSelectedNode}
        onRemove={removeSelectedNode}
        t={t}
      />
    );
  }

  return (
    <section className="flex min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <Button
            aria-label={t(translations.workflows.back)}
            onClick={goBack}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="sr-only">
                {t(translations.workflows.editorTitle)}
              </h2>
              <Input
                aria-label={t(translations.workflows.name)}
                className="h-11 max-w-lg min-w-0 border-transparent bg-transparent px-2 text-2xl font-extrabold tracking-tight shadow-none hover:bg-card/60 focus-visible:border-input focus-visible:bg-card sm:text-3xl"
                maxLength={100}
                onChange={(event) => {
                  setName(event.target.value);
                  setEditorError(null);
                  setIsDirty(true);
                }}
                value={name}
              />
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                {statusLabel(status, t)}
              </span>
              {configuration.isDefault ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  <Check aria-hidden="true" className="size-3.5" />
                  {t(translations.workflows.defaultShort)}
                </span>
              ) : null}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(translations.workflows.editorDescription)} ·{' '}
              {t(translations.workflows.version, {
                version: configuration.template.configurationVersion,
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {status === 'ACTIVE' ? (
            <Button
              disabled={isActionPending}
              onClick={() => void handleDefault()}
              type="button"
              variant="outline"
            >
              {configuration.isDefault
                ? t(translations.workflows.clearDefault)
                : t(translations.workflows.setDefault)}
            </Button>
          ) : null}
          {status === 'ACTIVE' ? (
            <Button
              disabled={isActionPending}
              onClick={() => void handleStatusAction('deactivate')}
              type="button"
              variant="outline"
            >
              <XCircle aria-hidden="true" />
              {t(translations.workflows.deactivate)}
            </Button>
          ) : null}
          {status === 'INACTIVE' ? (
            <Button
              disabled={isActionPending}
              onClick={() => void handleStatusAction('restore')}
              type="button"
              variant="outline"
            >
              <Check aria-hidden="true" />
              {t(translations.workflows.restore)}
            </Button>
          ) : null}
          {status === 'DRAFT' ? (
            <Button
              disabled={isActionPending}
              onClick={() => setPublishConfirmOpen(true)}
              type="button"
              variant="outline"
            >
              <GitBranch aria-hidden="true" />
              {t(translations.workflows.publish)}
            </Button>
          ) : null}
          <Button
            className="w-full sm:w-auto"
            disabled={saveMutation.isPending || isActionPending}
            onClick={requestSave}
            type="button"
          >
            <Save aria-hidden="true" />
            {status === 'DRAFT'
              ? t(translations.workflows.save)
              : t(translations.workflows.saveChanges)}
          </Button>
        </div>
      </div>
      {isDirty ? (
        <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
          <CircleAlert aria-hidden="true" className="size-4" />
          {t(translations.workflows.unsaved)}
        </p>
      ) : null}
      {editorError || validationErrors.length > 0 ? (
        <div
          className="grid gap-1 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {editorError ? <p>{editorError}</p> : null}
          {validationErrors.map((error, index) => (
            <p key={`${error.code}-${index}`}>{validationMessage(error, t)}</p>
          ))}
        </div>
      ) : null}

      <div className="grid min-h-0 gap-4 lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
        <aside className="hidden self-start rounded-2xl border border-border/70 bg-card p-4 shadow-sm lg:sticky lg:top-24 lg:block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold tracking-tight">
                {t(translations.workflows.palette)}
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t(translations.workflows.paletteDescription)}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {availableStages.length}
            </span>
          </div>
          <div className="mt-4 grid max-h-[32rem] gap-2 overflow-y-auto pr-1">
            {availableStages.map((stage) => (
              <Button
                className="h-auto justify-start px-3 py-2 text-left"
                key={stage.id}
                onClick={() => addStage(String(stage.id))}
                type="button"
                variant="outline"
              >
                <Plus aria-hidden="true" className="shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-sm">{stage.name}</span>
                  <span className="block font-mono text-[11px] text-muted-foreground">
                    {stage.code}
                  </span>
                </span>
              </Button>
            ))}
            {availableStages.length === 0 ? (
              <div className="rounded-xl bg-muted/40 px-3 py-3 text-xs leading-5 text-muted-foreground">
                <p className="font-medium text-foreground">
                  {t(translations.workflows.noStages)}
                </p>
                <p className="mt-1">
                  {t(translations.workflows.noStagesDescription)}
                </p>
              </div>
            ) : null}
          </div>
        </aside>
        <div className="grid min-h-0 min-w-0 gap-3">
          <Card className="lg:hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {t(translations.workflows.palette)}
                  </CardTitle>
                  <CardDescription>
                    {t(translations.workflows.paletteDescription)}
                  </CardDescription>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  {availableStages.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2 overflow-x-auto pb-4">
              {availableStages.map((stage) => (
                <Button
                  className="h-auto shrink-0 px-3 py-2"
                  key={stage.id}
                  onClick={() => addStage(String(stage.id))}
                  type="button"
                  variant="outline"
                >
                  <Plus aria-hidden="true" />
                  {stage.name}
                </Button>
              ))}
              {availableStages.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {t(translations.workflows.noStages)}
                  </p>
                  <p className="mt-1">
                    {t(translations.workflows.noStagesDescription)}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-border/70 shadow-[var(--soft-shadow)]">
            <CardHeader className="border-b border-border/60 bg-muted/20 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch aria-hidden="true" className="size-4 text-primary" />
                {t(translations.workflows.canvas)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="h-[34rem] min-h-[34rem] w-full bg-[radial-gradient(circle_at_top,var(--canvas-glow-primary),transparent_45%)]"
                aria-label={t(translations.workflows.canvas)}
                role="region"
              >
                <ReactFlow
                  deleteKeyCode={null}
                  fitView
                  nodes={nodes}
                  nodeTypes={nodeTypes}
                  onConnect={handleConnect}
                  onEdgesChange={handleEdgesChange}
                  onNodeClick={(_, node) => {
                    setSelectedNodeId(node.id);
                    openMobileInspector();
                  }}
                  onNodesChange={handleNodesChange}
                  edges={edges}
                  nodesConnectable
                  nodesDraggable
                  panOnDrag
                  selectionOnDrag={false}
                  zoomOnScroll
                >
                  <Background gap={24} size={1} />
                  <Controls />
                  <MiniMap pannable zoomable />
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs leading-5 text-muted-foreground lg:hidden">
            {t(translations.workflows.mobileGraphHint)}
          </p>
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="text-base">
                {t(translations.workflows.steps)}
              </CardTitle>
              <CardDescription>
                {t(translations.workflows.dependencies)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {layers.length === 0 && nodes.length > 0 ? (
                <p className="text-sm text-destructive">
                  {t(translations.workflows.validationCycle)}
                </p>
              ) : null}
              {layers.map((layer, layerIndex) => (
                <div
                  className="rounded-xl bg-muted/20 p-3"
                  key={`step-${layerIndex}`}
                >
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t(translations.workflows.steps)} {layerIndex + 1}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {layer.map((nodeId) => {
                      const node = nodes.find((item) => item.id === nodeId);
                      if (!node) return null;
                      const prerequisites = edges
                        .filter((edge) => edge.target === nodeId)
                        .map(
                          (edge) =>
                            nodes.find((item) => item.id === edge.source)?.data
                              .stageDefinition.name,
                        )
                        .filter(Boolean);
                      return (
                        <button
                          className="rounded-lg bg-card px-2.5 py-1.5 text-left text-sm ring-1 ring-border/70 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/60"
                          key={nodeId}
                          onClick={() => {
                            setSelectedNodeId(nodeId);
                            openMobileInspector();
                          }}
                          type="button"
                        >
                          <span className="font-medium">
                            {node.data.stageDefinition.name}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {prerequisites.length > 0
                              ? `← ${prerequisites.join(', ')}`
                              : t(translations.workflows.noDependencies)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {nodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t(translations.workflows.validationEmpty)}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
        <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="text-base">
                {t(translations.workflows.inspector)}
              </CardTitle>
              <CardDescription>
                {selectedNode?.data.stageDefinition.name ??
                  t(translations.workflows.selectNode)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {renderInspector('desktop')}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Sheet open={mobileInspectorOpen} onOpenChange={setMobileInspectorOpen}>
        <SheetContent
          className="w-[min(92vw,24rem)] overflow-y-auto lg:hidden"
          side="right"
        >
          <SheetHeader>
            <SheetTitle>{t(translations.workflows.inspector)}</SheetTitle>
            <SheetDescription>
              {selectedNode?.data.stageDefinition.name ??
                t(translations.workflows.selectNode)}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">{renderInspector('mobile')}</div>
        </SheetContent>
      </Sheet>
      <AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(translations.workflows.activeSaveTitle)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(translations.workflows.activeSaveDescription)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t(translations.workflows.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={saveMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                setSaveConfirmOpen(false);
                void executeSave();
              }}
            >
              {t(translations.workflows.confirm)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={publishConfirmOpen}
        onOpenChange={setPublishConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(translations.workflows.publishTitle)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(translations.workflows.publishDescription)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t(translations.workflows.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={publishMutation.isPending || saveMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                void confirmPublish();
              }}
            >
              {t(translations.workflows.confirm)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(removeNodeId)}
        onOpenChange={(open) => !open && setRemoveNodeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(translations.workflows.removeStageTitle)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(translations.workflows.removeStageDescription)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t(translations.workflows.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeNodeId && removeNode(removeNodeId)}
            >
              {t(translations.workflows.confirm)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
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
