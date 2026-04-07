/**
 * Graph Validation Utility
 *
 * Validates the automation workflow graph for structural correctness:
 * - Single trigger node required
 * - All nodes reachable from trigger
 * - No orphaned nodes (except notes)
 * - Condition nodes must have at least one outgoing edge
 */

import type { Node, Edge } from "@xyflow/react";
import { TRIGGER_NODE_ID, END_NODE_ID } from "./converters";

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: "missing_trigger" | "orphaned_node" | "missing_connection" | "cycle_detected";
  nodeId?: string;
  message: string;
}

export interface ValidationWarning {
  type: "dead_end" | "unconnected_condition_branch" | "empty_workflow";
  nodeId?: string;
  message: string;
}

export function validateGraph(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for trigger node
  const triggerNode = nodes.find((n) => n.id === TRIGGER_NODE_ID);
  if (!triggerNode) {
    errors.push({
      type: "missing_trigger",
      message: "Workflow must have a trigger node",
    });
    return { isValid: false, errors, warnings };
  }

  // Build adjacency from edges
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const edge of edges) {
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
    outgoing.get(edge.source)!.push(edge.target);

    if (!incoming.has(edge.target)) incoming.set(edge.target, []);
    incoming.get(edge.target)!.push(edge.source);
  }

  // Check reachability from trigger (BFS)
  const reachable = new Set<string>();
  const queue = [TRIGGER_NODE_ID];
  reachable.add(TRIGGER_NODE_ID);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of outgoing.get(current) || []) {
      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    }
  }

  // Find orphaned nodes (not reachable and not note type)
  for (const node of nodes) {
    if (node.type === "note") continue; // Notes don't need connections
    if (!reachable.has(node.id)) {
      errors.push({
        type: "orphaned_node",
        nodeId: node.id,
        message: `Node "${node.data?.label || node.id}" is not connected to the workflow`,
      });
    }
  }

  // Check condition nodes have outgoing edges
  const conditionNodes = nodes.filter((n) => n.type === "condition");
  for (const cond of conditionNodes) {
    const outs = outgoing.get(cond.id) || [];
    if (outs.length === 0) {
      warnings.push({
        type: "unconnected_condition_branch",
        nodeId: cond.id,
        message: `Condition "${cond.data?.label || cond.id}" has no outgoing connections`,
      });
    }
  }

  // Check for dead-end action nodes (no outgoing edge, not end node)
  for (const node of nodes) {
    if (
      node.id === END_NODE_ID ||
      node.type === "end" ||
      node.type === "note"
    )
      continue;

    const outs = outgoing.get(node.id) || [];
    if (outs.length === 0) {
      warnings.push({
        type: "dead_end",
        nodeId: node.id,
        message: `Node "${node.data?.label || node.id}" has no outgoing connection`,
      });
    }
  }

  // Empty workflow warning
  const stepNodes = nodes.filter(
    (n) => n.id !== TRIGGER_NODE_ID && n.id !== END_NODE_ID && n.type !== "note",
  );
  if (stepNodes.length === 0) {
    warnings.push({
      type: "empty_workflow",
      message: "Workflow has no action steps",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
