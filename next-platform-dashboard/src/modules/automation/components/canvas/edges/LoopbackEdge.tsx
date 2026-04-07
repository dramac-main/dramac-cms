/**
 * LoopbackEdge — Curved edge that loops back to an earlier node.
 * Dashed style with arrow marker.
 */

"use client";

import { memo } from "react";
import { BaseEdge, getBezierPath } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";

function LoopbackEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.8,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: selected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
        strokeWidth: selected ? 2 : 1.5,
        strokeDasharray: "6 3",
      }}
    />
  );
}

export const LoopbackEdge = memo(LoopbackEdgeComponent);
