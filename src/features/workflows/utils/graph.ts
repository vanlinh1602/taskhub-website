import type { Stage } from '@/features/stages/types';

import type {
  WorkflowTemplateConfiguration,
  WorkflowTemplateSavePayload,
} from '../types';

export interface WorkflowGraphNodeData extends Record<string, unknown> {
  readonly stageDefinitionId: string;
  readonly stageDefinition: Stage;
  readonly durationHoursOverride: number | null;
  readonly priceOverride: string | null;
  readonly durationOverrideEnabled?: boolean;
  readonly priceOverrideEnabled?: boolean;
  readonly effectiveDurationHours: number;
  readonly effectivePrice: string;
}

export interface WorkflowGraphNode {
  readonly id: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly data: WorkflowGraphNodeData;
}

export interface WorkflowGraphEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
}

export type WorkflowGraphValidationCode =
  | 'empty'
  | 'duplicate-node'
  | 'self-loop'
  | 'duplicate-edge'
  | 'outside-workflow'
  | 'cycle';

export interface WorkflowGraphValidationError {
  readonly code: WorkflowGraphValidationCode;
  readonly source?: string;
  readonly target?: string;
}

export interface WorkflowGraphSerializationResult {
  readonly payload?: WorkflowTemplateSavePayload;
  readonly errors: readonly WorkflowGraphValidationError[];
  readonly layers: readonly string[][];
}

const LAYER_X = 80;
const LAYER_Y = 180;

export function configurationToGraph(
  configuration: WorkflowTemplateConfiguration,
): {
  readonly nodes: readonly WorkflowGraphNode[];
  readonly edges: readonly WorkflowGraphEdge[];
} {
  const nodes = configuration.stages.map((stage, index) => ({
    id: String(stage.stageDefinitionId),
    position: {
      x: stage.stepIndex * LAYER_X,
      y: (index % 4) * LAYER_Y,
    },
    data: {
      stageDefinitionId: String(stage.stageDefinitionId),
      stageDefinition: stage.stageDefinition,
      durationHoursOverride: stage.durationHoursOverride,
      priceOverride: stage.priceOverride,
      durationOverrideEnabled: stage.durationHoursOverride !== null,
      priceOverrideEnabled: stage.priceOverride !== null,
      effectiveDurationHours: stage.effectiveDurationHours,
      effectivePrice: stage.effectivePrice,
    },
  }));
  const edges = configuration.dependencies.map((dependency) => ({
    id: `${dependency.prerequisiteStageDefinitionId}->${dependency.dependentStageDefinitionId}`,
    source: String(dependency.prerequisiteStageDefinitionId),
    target: String(dependency.dependentStageDefinitionId),
  }));
  return { nodes, edges };
}

export function validateWorkflowGraph(
  nodes: readonly WorkflowGraphNode[],
  edges: readonly WorkflowGraphEdge[],
): readonly WorkflowGraphValidationError[] {
  const errors: WorkflowGraphValidationError[] = [];
  if (nodes.length === 0) errors.push({ code: 'empty' });

  const nodeIds = new Set<string>();
  nodes.forEach((node) => {
    if (nodeIds.has(node.id))
      errors.push({ code: 'duplicate-node', source: node.id });
    nodeIds.add(node.id);
  });

  const edgeKeys = new Set<string>();
  edges.forEach((edge) => {
    const key = `${edge.source}->${edge.target}`;
    if (edge.source === edge.target) {
      errors.push({
        code: 'self-loop',
        source: edge.source,
        target: edge.target,
      });
    }
    if (edgeKeys.has(key)) {
      errors.push({
        code: 'duplicate-edge',
        source: edge.source,
        target: edge.target,
      });
    }
    edgeKeys.add(key);
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push({
        code: 'outside-workflow',
        source: edge.source,
        target: edge.target,
      });
    }
  });

  if (
    nodes.length > 0 &&
    errors.every((error) => error.code !== 'outside-workflow')
  ) {
    const indegree = new Map(nodes.map((node) => [node.id, 0]));
    const outgoing = new Map<string, string[]>();
    edges.forEach((edge) => {
      if (!indegree.has(edge.source) || !indegree.has(edge.target)) return;
      indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
      outgoing.set(edge.source, [
        ...(outgoing.get(edge.source) ?? []),
        edge.target,
      ]);
    });
    const queue = nodes
      .filter((node) => indegree.get(node.id) === 0)
      .map((node) => node.id);
    let visited = 0;
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      visited += 1;
      (outgoing.get(current) ?? []).forEach((target) => {
        const next = (indegree.get(target) ?? 1) - 1;
        indegree.set(target, next);
        if (next === 0) queue.push(target);
      });
    }
    if (visited !== nodes.length) errors.push({ code: 'cycle' });
  }

  return errors;
}

export function topologicalLayers(
  nodes: readonly WorkflowGraphNode[],
  edges: readonly WorkflowGraphEdge[],
): readonly string[][] {
  const incoming = new Map<string, string[]>();
  nodes.forEach((node) => incoming.set(node.id, []));
  edges.forEach((edge) => {
    if (incoming.has(edge.target) && incoming.has(edge.source)) {
      incoming.set(edge.target, [
        ...(incoming.get(edge.target) ?? []),
        edge.source,
      ]);
    }
  });
  const layerByNode = new Map<string, number>();
  const unresolved = new Set(nodes.map((node) => node.id));
  while (unresolved.size > 0) {
    const ready = nodes
      .filter((node) => unresolved.has(node.id))
      .filter((node) =>
        (incoming.get(node.id) ?? []).every(
          (source) => !unresolved.has(source),
        ),
      );
    if (ready.length === 0) return [];
    ready.forEach((node) => {
      const layer =
        Math.max(
          -1,
          ...(incoming.get(node.id) ?? []).map(
            (source) => layerByNode.get(source) ?? -1,
          ),
        ) + 1;
      layerByNode.set(node.id, layer);
      unresolved.delete(node.id);
    });
  }
  const layers: string[][] = [];
  nodes.forEach((node) => {
    const layer = layerByNode.get(node.id) ?? 0;
    layers[layer] = [...(layers[layer] ?? []), node.id];
  });
  return layers.map((layer) => layer ?? []);
}

export function serializeWorkflowGraph(
  name: string,
  nodes: readonly WorkflowGraphNode[],
  edges: readonly WorkflowGraphEdge[],
): WorkflowGraphSerializationResult {
  const errors = validateWorkflowGraph(nodes, edges);
  if (errors.length > 0) return { errors, layers: [] };
  const layers = topologicalLayers(nodes, edges);
  if (layers.length === 0) return { errors: [{ code: 'cycle' }], layers: [] };
  const prerequisites = new Map<string, string[]>();
  nodes.forEach((node) => prerequisites.set(node.id, []));
  edges.forEach((edge) => {
    prerequisites.set(edge.target, [
      ...(prerequisites.get(edge.target) ?? []),
      edge.source,
    ]);
  });
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  return {
    errors: [],
    layers,
    payload: {
      name: name.trim(),
      steps: layers.map((layer) => ({
        stages: layer.map((id) => {
          const node = nodeById.get(id);
          if (!node) throw new Error(`Missing workflow node ${id}`);
          return {
            stageDefinitionId: node.data.stageDefinitionId,
            prerequisiteStageDefinitionIds: prerequisites.get(id) ?? [],
            durationHours:
              node.data.durationOverrideEnabled === false
                ? null
                : node.data.durationHoursOverride,
            priceOverride:
              node.data.priceOverrideEnabled === false
                ? null
                : node.data.priceOverride,
          };
        }),
      })),
    },
  };
}
