/**
 * Auto-Layout Utility using Dagre
 *
 * Computes node positions for a top-to-bottom directed graph.
 * Used on initial load, after adding/removing nodes, and on "auto-layout" click.
 */

import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 80;
const TRIGGER_HEIGHT = 60;
const NOTE_WIDTH = 200;
const NOTE_HEIGHT = 100;

interface LayoutOptions {
  direction?: "TB" | "LR";
  nodeSep?: number;
  rankSep?: number;
}

/**
 * Apply dagre auto-layout to a set of nodes and edges.
 * Returns new node array with computed x/y positions.
 */
export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {},
): Node[] {
  const { direction = "TB", nodeSep = 50, rankSep = 80 } = options;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: nodeSep, ranksep: rankSep });

  // Add nodes
  for (const node of nodes) {
    const isNote = node.type === "note";
    const isTrigger = node.type === "trigger";
    g.setNode(node.id, {
      width: isNote ? NOTE_WIDTH : NODE_WIDTH,
      height: isTrigger ? TRIGGER_HEIGHT : isNote ? NOTE_HEIGHT : NODE_HEIGHT,
    });
  }

  // Add edges
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;

    const isNote = node.type === "note";
    const isTrigger = node.type === "trigger";
    const w = isNote ? NOTE_WIDTH : NODE_WIDTH;
    const h = isTrigger ? TRIGGER_HEIGHT : isNote ? NOTE_HEIGHT : NODE_HEIGHT;

    return {
      ...node,
      position: {
        x: dagreNode.x - w / 2,
        y: dagreNode.y - h / 2,
      },
    };
  });
}

export { NODE_WIDTH, NODE_HEIGHT };
