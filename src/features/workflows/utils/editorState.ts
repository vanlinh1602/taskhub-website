import type { WorkflowGraphEdge, WorkflowGraphNode } from './graph';

const MAX_HISTORY_LENGTH = 50;

interface WorkflowEditorSnapshot {
  readonly edges: readonly WorkflowGraphEdge[];
  readonly nodes: readonly WorkflowGraphNode[];
  readonly selectedNodeId: string | null;
}

export interface WorkflowEditorState extends WorkflowEditorSnapshot {
  readonly history: readonly WorkflowEditorSnapshot[];
  readonly isDirty: boolean;
  readonly lastMergeKey: string | null;
}

export type WorkflowEditorAction =
  | {
      readonly type: 'load';
      readonly edges: readonly WorkflowGraphEdge[];
      readonly nodes: readonly WorkflowGraphNode[];
    }
  | { readonly type: 'select'; readonly nodeId: string | null }
  | {
      readonly type: 'change';
      readonly edges?: readonly WorkflowGraphEdge[];
      readonly mergeKey?: string;
      readonly nodes?: readonly WorkflowGraphNode[];
      readonly selectedNodeId?: string | null;
    }
  | { readonly type: 'mark-dirty' }
  | { readonly type: 'undo' };

export const initialWorkflowEditorState: WorkflowEditorState = {
  edges: [],
  history: [],
  isDirty: false,
  lastMergeKey: null,
  nodes: [],
  selectedNodeId: null,
};

function pushHistory(
  state: WorkflowEditorState,
  mergeKey: string | undefined,
): readonly WorkflowEditorSnapshot[] {
  if (mergeKey && mergeKey === state.lastMergeKey) return state.history;
  const { edges, nodes, selectedNodeId } = state;
  return [...state.history, { edges, nodes, selectedNodeId }].slice(
    -MAX_HISTORY_LENGTH,
  );
}

export function reduceWorkflowEditor(
  state: WorkflowEditorState,
  action: WorkflowEditorAction,
): WorkflowEditorState {
  if (action.type === 'load') {
    const hasSelection = action.nodes.some(
      (node) => node.id === state.selectedNodeId,
    );
    return {
      ...initialWorkflowEditorState,
      edges: action.edges,
      nodes: action.nodes,
      selectedNodeId: hasSelection ? state.selectedNodeId : null,
    };
  }
  if (action.type === 'select') {
    return { ...state, lastMergeKey: null, selectedNodeId: action.nodeId };
  }
  if (action.type === 'mark-dirty') return { ...state, isDirty: true };
  if (action.type === 'change') {
    return {
      edges: action.edges ?? state.edges,
      history: pushHistory(state, action.mergeKey),
      isDirty: true,
      lastMergeKey: action.mergeKey ?? null,
      nodes: action.nodes ?? state.nodes,
      selectedNodeId:
        action.selectedNodeId === undefined
          ? state.selectedNodeId
          : action.selectedNodeId,
    };
  }
  const previous = state.history[state.history.length - 1];
  if (!previous) return state;
  return {
    ...previous,
    history: state.history.slice(0, -1),
    isDirty: true,
    lastMergeKey: null,
  };
}
