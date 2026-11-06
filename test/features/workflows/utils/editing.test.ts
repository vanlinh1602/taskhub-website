import { describe, expect, it } from 'vitest';

import type { Stage } from '@/features/stages/types';
import {
  initialWorkflowEditorState,
  reduceWorkflowEditor,
} from '@/features/workflows/utils/editorState';
import {
  createWorkflowEdge,
  createWorkflowNode,
  getDescendantIds,
  getTerminalNodeIds,
  getWorkflowTotals,
  removeWorkflowNode,
} from '@/features/workflows/utils/graph';
import {
  layoutWorkflowGraph,
  WORKFLOW_NODE_WIDTH,
} from '@/features/workflows/utils/layout';

function stage(id: string, hours = 24, price = '100'): Stage {
  return {
    id,
    code: id.toUpperCase(),
    name: id,
    description: null,
    defaultPrice: price,
    defaultDurationHours: hours,
    currency: 'VND',
    displayOrder: 0,
    isActive: true,
    isRewardEligible: true,
    createdAt: '',
    updatedAt: '',
  };
}

const nodes = [
  createWorkflowNode(stage('a', 10, '100')),
  createWorkflowNode(stage('b', 20, '200')),
  createWorkflowNode(stage('c', 5, '300')),
  createWorkflowNode(stage('d', 1, '400')),
];
const edges = [
  createWorkflowEdge('a', 'b'),
  createWorkflowEdge('a', 'c'),
  createWorkflowEdge('b', 'd'),
  createWorkflowEdge('c', 'd'),
];

describe('workflow graph editing', () => {
  it('finds every stage waiting on a stage', () => {
    expect([...getDescendantIds(edges, 'a')].sort()).toEqual(['b', 'c', 'd']);
    expect([...getDescendantIds(edges, 'b')]).toEqual(['d']);
    expect([...getDescendantIds(edges, 'd')]).toEqual([]);
  });

  it('finds stages with no follower', () => {
    expect(getTerminalNodeIds(nodes, edges)).toEqual(['d']);
  });

  it('reconnects neighbors when a stage is removed', () => {
    const result = removeWorkflowNode(nodes, edges, 'b');

    expect(result.nodes.map((node) => node.id)).toEqual(['a', 'c', 'd']);
    expect(result.edges.map((edge) => edge.id).sort()).toEqual([
      'a->c',
      'a->d',
      'c->d',
    ]);
  });

  it('does not duplicate an existing edge when reconnecting', () => {
    const chain = [...edges, createWorkflowEdge('a', 'd')];

    const ids = removeWorkflowNode(nodes, chain, 'b').edges.map(
      (edge) => edge.id,
    );

    expect(ids.filter((id) => id === 'a->d')).toHaveLength(1);
  });

  it('uses the longest path for duration and sums every price', () => {
    expect(getWorkflowTotals(nodes, edges)).toEqual({
      minimumHours: 31,
      totalPrice: 1000,
    });
  });
});

describe('workflow layout', () => {
  it('places stages in step columns and draws one path per edge', () => {
    const layout = layoutWorkflowGraph(nodes, edges);

    expect(layout.columnOffsets).toHaveLength(3);
    expect(layout.positions.get('b')?.x).toBe(layout.positions.get('c')?.x);
    expect(layout.positions.get('b')?.y).not.toBe(layout.positions.get('c')?.y);
    expect(layout.positions.get('a')?.x).toBe(0);
    expect(layout.edges).toHaveLength(edges.length);
    expect(layout.width).toBeGreaterThan(WORKFLOW_NODE_WIDTH * 3);
  });

  it('keeps cyclic data visible in one column', () => {
    const cycle = [createWorkflowEdge('a', 'b'), createWorkflowEdge('b', 'a')];

    const layout = layoutWorkflowGraph(nodes.slice(0, 2), cycle);

    expect(layout.columnOffsets).toEqual([0]);
    expect(layout.positions.size).toBe(2);
  });
});

describe('workflow editor state', () => {
  const loaded = reduceWorkflowEditor(initialWorkflowEditorState, {
    type: 'load',
    edges,
    nodes,
  });

  it('restores the previous graph on undo', () => {
    const changed = reduceWorkflowEditor(loaded, {
      type: 'change',
      edges: [],
      selectedNodeId: 'a',
    });
    const undone = reduceWorkflowEditor(changed, { type: 'undo' });

    expect(changed.isDirty).toBe(true);
    expect(undone.edges).toBe(edges);
    expect(undone.selectedNodeId).toBeNull();
    expect(undone.history).toHaveLength(0);
  });

  it('groups consecutive edits of one field into one undo step', () => {
    const first = reduceWorkflowEditor(loaded, {
      type: 'change',
      mergeKey: 'price:a',
      nodes: nodes.slice(0, 3),
    });
    const second = reduceWorkflowEditor(first, {
      type: 'change',
      mergeKey: 'price:a',
      nodes: nodes.slice(0, 2),
    });

    expect(second.history).toHaveLength(1);
    expect(reduceWorkflowEditor(second, { type: 'undo' }).nodes).toBe(nodes);
  });

  it('clears history and unsaved state after loading saved data', () => {
    const changed = reduceWorkflowEditor(loaded, { type: 'change', edges: [] });
    const reloaded = reduceWorkflowEditor(changed, {
      type: 'load',
      edges,
      nodes,
    });

    expect(reloaded.isDirty).toBe(false);
    expect(reloaded.history).toHaveLength(0);
  });
});
