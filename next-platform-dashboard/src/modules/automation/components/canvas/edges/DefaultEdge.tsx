/**
 * DefaultEdge — Smooth step edge with optional label and delete button on hover.
 */

"use client";

import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
} from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { X } from "lucide-react";

function DefaultEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
  markerEnd,
  selected,
}: EdgeProps) {
  const { deleteElements } = useReactFlow();
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  });

  return (
    <>
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? "hsl(var(--primary))" : "hsl(var(--border))",
          strokeWidth: selected ? 2 : 1.5,
        }}
      />

      <EdgeLabelRenderer>
        {/* Branch label */}
        {label && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
            }}
            className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border shadow-sm"
          >
            {label}
          </div>
        )}

        {/* Delete button */}
        {hovered && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + (label ? 18 : 0)}px)`,
              pointerEvents: "all",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <button
              onClick={() => deleteElements({ edges: [{ id }] })}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/80 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export const DefaultEdge = memo(DefaultEdgeComponent);
