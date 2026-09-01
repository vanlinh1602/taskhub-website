import { describe, expect, it } from 'vitest';

import {
  serializeWorkflowGraph,
  topologicalLayers,
  validateWorkflowGraph,
  type WorkflowGraphEdge,
  type WorkflowGraphNode,
} from '@/features/workflows/utils/graph';

function node(id: string): WorkflowGraphNode {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {
      durationHoursOverride: null,
      effectiveDurationHours: 24,
      effectivePrice: '0',
      priceOverride: null,
      stageDefinition: {
        id,
        code: id.toUpperCase(),
        name: id,
        description: null,
        defaultPrice: '0',
        defaultDurationHours: 24,
        currency: 'VND',
        displayOrder: 0,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      stageDefinitionId: id,
    },
  };
}

function edge(source: string, target: string): WorkflowGraphEdge {
  return { id: `${source}->${target}`, source, target };
}

describe('workflow graph utilities', () => {
  it('layers nodes by the deepest prerequisite', () => {
    const nodes = ['a', 'b', 'c', 'd'].map(node);
    const edges = [edge('a', 'c'), edge('b', 'c'), edge('c', 'd')];

    expect(topologicalLayers(nodes, edges)).toEqual([
      ['a', 'b'],
      ['c'],
      ['d'],
    ]);
    expect(serializeWorkflowGraph('Workflow', nodes, edges).payload?.steps).toEqual([
      { stages: [{ stageDefinitionId: 'a', prerequisiteStageDefinitionIds: [], durationHours: null, priceOverride: null }, { stageDefinitionId: 'b', prerequisiteStageDefinitionIds: [], durationHours: null, priceOverride: null }] },
      { stages: [{ stageDefinitionId: 'c', prerequisiteStageDefinitionIds: ['a', 'b'], durationHours: null, priceOverride: null }] },
      { stages: [{ stageDefinitionId: 'd', prerequisiteStageDefinitionIds: ['c'], durationHours: null, priceOverride: null }] },
    ]);
  });

  it('rejects self-loops, duplicate edges, outside nodes, and cycles', () => {
    expect(validateWorkflowGraph([node('a')], [edge('a', 'a')])).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'self-loop' })]),
    );
    expect(validateWorkflowGraph([node('a'), node('b')], [edge('a', 'b'), edge('a', 'b')])).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'duplicate-edge' })]),
    );
    expect(validateWorkflowGraph([node('a')], [edge('a', 'missing')])).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'outside-workflow' })]),
    );
    expect(validateWorkflowGraph([node('a'), node('b')], [edge('a', 'b'), edge('b', 'a')])).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'cycle' })]),
    );
  });
});
