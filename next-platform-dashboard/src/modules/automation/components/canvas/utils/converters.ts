/**
 * Steps ↔ Nodes/Edges Conversion
 *
 * Converts the flat ordered step list (DB format) into ReactFlow nodes+edges
 * and back. Handles sequential flows, condition branching, and position persistence.
 */

import type { Node, Edge } from "@xyflow/react";
import type { WorkflowStep, TriggerConfig } from "../../../types/automation-types";

// ============================================================================
// CONSTANTS
// ============================================================================

const TRIGGER_NODE_ID = "__trigger__";
const END_NODE_ID = "__end__";
const Y_SPACING = 120;
const X_CENTER = 0;

// ============================================================================
// STEP TYPE → NODE TYPE MAPPING
// ============================================================================

function stepTypeToNodeType(step: WorkflowStep): string {
  switch (step.step_type) {
    case "condition":
      return "condition";
    case "delay":
      return "delay";
    case "loop":
      return "loop";
    case "stop":
      return "end";
    default:
      return "action";
  }
}

// ============================================================================
// STEPS → NODES + EDGES
// ============================================================================

export interface ConvertOptions {
  triggerConfig?: TriggerConfig;
  triggerType?: string;
}

export function stepsToNodesAndEdges(
  steps: WorkflowStep[],
  options: ConvertOptions = {},
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const sorted = [...steps].sort((a, b) => a.position - b.position);

  // 1. Trigger node
  nodes.push({
    id: TRIGGER_NODE_ID,
    type: "trigger",
    position: { x: X_CENTER, y: 0 },
    data: {
      triggerConfig: options.triggerConfig || {},
      triggerType: options.triggerType || "event",
      label: options.triggerConfig?.event_type || "Trigger",
    },
    deletable: false,
  });

  // 2. Step nodes
  sorted.forEach((step, index) => {
    const hasPersistedPosition =
      step.position_x != null &&
      step.position_y != null;

    nodes.push({
      id: step.id,
      type: stepTypeToNodeType(step),
      position: hasPersistedPosition
        ? {
            x: step.position_x as number,
            y: step.position_y as number,
          }
        : {
            x: X_CENTER,
            y: (index + 1) * Y_SPACING,
          },
      data: {
        step,
        label: step.name || step.action_type || step.step_type,
      },
    });

    // Edge from previous node
    const sourceId = index === 0 ? TRIGGER_NODE_ID : sorted[index - 1].id;

    if (step.step_type === "condition") {
      // Condition node: connect from previous, but the true/false branches
      // connect to subsequent steps (handled by the graph structure)
      edges.push({
        id: `e-${sourceId}-${step.id}`,
        source: sourceId,
        target: step.id,
        type: "default-edge",
        animated: false,
      });
    } else {
      edges.push({
        id: `e-${sourceId}-${step.id}`,
        source: sourceId,
        target: step.id,
        type: "default-edge",
        animated: false,
        ...(sourceId !== TRIGGER_NODE_ID &&
        sorted[index - 1]?.step_type === "condition"
          ? { sourceHandle: "true", label: "True" }
          : {}),
      });
    }
  });

  // 3. End node
  const lastStepId =
    sorted.length > 0 ? sorted[sorted.length - 1].id : TRIGGER_NODE_ID;
  nodes.push({
    id: END_NODE_ID,
    type: "end",
    position: {
      x: X_CENTER,
      y: (sorted.length + 1) * Y_SPACING,
    },
    data: { label: "End" },
    deletable: false,
  });

  edges.push({
    id: `e-${lastStepId}-end`,
    source: lastStepId,
    target: END_NODE_ID,
    type: "default-edge",
    animated: false,
  });

  return { nodes, edges };
}

// ============================================================================
// NODES → STEPS (persist positions back)
// ============================================================================

/**
 * Extract position data from canvas nodes and merge into step configs.
 * Returns step IDs with their updated position_x/position_y.
 */
export function extractNodePositions(
  nodes: Node[],
): Map<string, { position_x: number; position_y: number }> {
  const positions = new Map<string, { position_x: number; position_y: number }>();

  for (const node of nodes) {
    // Skip trigger and end nodes
    if (node.id === TRIGGER_NODE_ID || node.id === END_NODE_ID) continue;

    positions.set(node.id, {
      position_x: Math.round(node.position.x),
      position_y: Math.round(node.position.y),
    });
  }

  return positions;
}

/**
 * Derive step ordering from the graph topology (edge connections).
 * Traverses from trigger node following edges to determine step order.
 */
export function deriveStepOrder(nodes: Node[], edges: Edge[]): string[] {
  const order: string[] = [];
  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source)!.push(edge.target);
  }

  // BFS from trigger
  const visited = new Set<string>();
  const queue = [TRIGGER_NODE_ID];
  visited.add(TRIGGER_NODE_ID);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency.get(current) || [];

    for (const next of neighbors) {
      if (visited.has(next)) continue;
      visited.add(next);

      if (next !== END_NODE_ID) {
        order.push(next);
      }
      queue.push(next);
    }
  }

  return order;
}

export { TRIGGER_NODE_ID, END_NODE_ID };
