import {
  topologicalLayers,
  type WorkflowGraphEdge,
  type WorkflowGraphNode,
} from './graph';

export const WORKFLOW_NODE_WIDTH = 160;

export const WORKFLOW_NODE_HEIGHT = 76;
const COLUMN_GAP = 40;
const ROW_GAP = 14;
const HEADER_HEIGHT = 32;
const ARROW_GAP = 3;
const ARROW_SIZE = 6;

export interface WorkflowLayoutPoint {
  readonly x: number;
  readonly y: number;
}

export interface WorkflowLayoutEdge {
  readonly id: string;
  readonly path: string;
  readonly source: string;
  readonly target: string;
}

export interface WorkflowLayout {
  readonly columnOffsets: readonly number[];
  readonly edges: readonly WorkflowLayoutEdge[];
  readonly height: number;
  readonly positions: ReadonlyMap<string, WorkflowLayoutPoint>;
  readonly width: number;
}

function getStackHeight(count: number): number {
  return count * WORKFLOW_NODE_HEIGHT + Math.max(0, count - 1) * ROW_GAP;
}

function createEdgePath(
  from: WorkflowLayoutPoint,
  to: WorkflowLayoutPoint,
): string {
  const startX = from.x + WORKFLOW_NODE_WIDTH;
  const startY = from.y + WORKFLOW_NODE_HEIGHT / 2;
  const endX = to.x - ARROW_GAP;
  const endY = to.y + WORKFLOW_NODE_HEIGHT / 2;
  const middleX = (startX + endX) / 2;
  const curve = `M${startX} ${startY} C${middleX} ${startY} ${middleX} ${endY} ${endX} ${endY}`;
  const arrow = `M${endX - ARROW_SIZE} ${endY - ARROW_SIZE + 2} L${endX} ${endY} L${endX - ARROW_SIZE} ${endY + ARROW_SIZE - 2}`;
  return `${curve} ${arrow}`;
}

export function layoutWorkflowGraph(
  nodes: readonly WorkflowGraphNode[],
  edges: readonly WorkflowGraphEdge[],
): WorkflowLayout {
  const sortedLayers = topologicalLayers(nodes, edges);
  const layers =
    sortedLayers.length > 0 ? sortedLayers : [nodes.map((node) => node.id)];
  const stackHeight = getStackHeight(
    Math.max(0, ...layers.map((layer) => layer.length)),
  );
  const columnOffsets = layers.map(
    (_, index) => index * (WORKFLOW_NODE_WIDTH + COLUMN_GAP),
  );
  const positions = new Map<string, WorkflowLayoutPoint>();
  layers.forEach((layer, column) => {
    const top = HEADER_HEIGHT + (stackHeight - getStackHeight(layer.length)) / 2;
    layer.forEach((id, row) => {
      positions.set(id, {
        x: columnOffsets[column],
        y: top + row * (WORKFLOW_NODE_HEIGHT + ROW_GAP),
      });
    });
  });
  return {
    columnOffsets,
    edges: edges.flatMap((edge) => {
      const from = positions.get(edge.source);
      const to = positions.get(edge.target);
      if (!from || !to) return [];
      return [
        {
          id: edge.id,
          path: createEdgePath(from, to),
          source: edge.source,
          target: edge.target,
        },
      ];
    }),
    height: HEADER_HEIGHT + stackHeight,
    positions,
    width:
      layers.length * WORKFLOW_NODE_WIDTH +
      Math.max(0, layers.length - 1) * COLUMN_GAP,
  };
}
