import { CircleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  WorkflowGraphEdge,
  WorkflowGraphNode,
} from '@/features/workflows/utils/graph';
import {
  layoutWorkflowGraph,
  WORKFLOW_NODE_HEIGHT,
  WORKFLOW_NODE_WIDTH,
} from '@/features/workflows/utils/layout';
import { cn } from '@/lib/utils';
import { translations } from '@/locales/translations';
import { formatMoney } from '@/utils/money';

interface WorkflowFlowProps {
  readonly edges: readonly WorkflowGraphEdge[];
  readonly nodes: readonly WorkflowGraphNode[];
  readonly onSelect: (nodeId: string) => void;
  readonly selectedNodeId: string | null;
}

export default function WorkflowFlow({
  edges,
  nodes,
  onSelect,
  selectedNodeId,
}: WorkflowFlowProps) {
  const { i18n, t } = useTranslation();
  const layout = useMemo(
    () => layoutWorkflowGraph(nodes, edges),
    [edges, nodes],
  );

  function describeNode(node: WorkflowGraphNode): string {
    const prerequisites = edges
      .filter((edge) => edge.target === node.id)
      .map(
        (edge) =>
          nodes.find((item) => item.id === edge.source)?.data.stageDefinition
            .name,
      )
      .filter(Boolean);
    const name = node.data.stageDefinition.name;
    return prerequisites.length > 0
      ? `${name}: ${t(translations.workflows.runsAfter)} ${prerequisites.join(', ')}`
      : `${name}: ${t(translations.workflows.noDependencies)}`;
  }

  if (nodes.length === 0) {
    return (
      <div className="m-auto grid max-w-xs gap-1.5 text-center">
        <p className="text-base font-bold">
          {t(translations.workflows.emptyFlow)}
        </p>
        <p className="text-sm text-muted-foreground">
          {t(translations.workflows.emptyFlowDescription)}
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative m-auto shrink-0"
      style={{ height: layout.height, width: layout.width }}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        fill="none"
        height={layout.height}
        width={layout.width}
      >
        {layout.edges.map((edge) => {
          const isActive =
            edge.source === selectedNodeId || edge.target === selectedNodeId;
          return (
            <path
              className={cn(
                isActive
                  ? 'stroke-link stroke-2'
                  : 'stroke-muted-foreground/45 stroke-[1.5]',
              )}
              d={edge.path}
              key={edge.id}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
      {layout.columnOffsets.map((offset, index) => (
        <p
          className="absolute top-0 text-center text-xs font-bold tracking-widest text-muted-foreground uppercase"
          key={offset}
          style={{ left: offset, width: WORKFLOW_NODE_WIDTH }}
        >
          {t(translations.workflows.stepLabel, { step: index + 1 })}
        </p>
      ))}
      {nodes.map((node) => {
        const position = layout.positions.get(node.id);
        if (!position) return null;
        const { data } = node;
        const isSelected = node.id === selectedNodeId;
        return (
          <button
            aria-label={describeNode(node)}
            aria-pressed={isSelected}
            className={cn(
              'absolute flex flex-col justify-between rounded-2xl border-2 bg-card px-3 py-2.5 text-left transition-colors outline-none hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              isSelected ? 'border-ring bg-secondary' : 'border-border',
            )}
            key={node.id}
            onClick={() => onSelect(node.id)}
            style={{
              height: WORKFLOW_NODE_HEIGHT,
              left: position.x,
              top: position.y,
              width: WORKFLOW_NODE_WIDTH,
            }}
            type="button"
          >
            <span className="flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate leading-tight font-bold">
                {data.stageDefinition.name}
              </span>
              {!data.stageDefinition.isActive ? (
                <CircleAlert
                  aria-label={t(translations.workflows.inactiveStage)}
                  className="size-4 shrink-0 text-amber-700 dark:text-amber-300"
                />
              ) : null}
            </span>
            <span className="flex justify-between gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  data.durationOverrideEnabled && 'font-bold text-link',
                )}
              >
                {data.effectiveDurationHours} {t(translations.workflows.hours)}
              </span>
              <span
                className={cn(
                  'truncate',
                  data.priceOverrideEnabled && 'font-bold text-link',
                )}
              >
                {formatMoney(
                  data.effectivePrice,
                  data.stageDefinition.currency,
                  i18n.language,
                )}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
