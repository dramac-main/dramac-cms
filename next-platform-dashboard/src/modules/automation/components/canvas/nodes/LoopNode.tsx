/**
 * LoopNode — Iteration/repeat step.
 * Orange accent. Single input, two outputs: "Loop Body" and "Done".
 */

"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import { Repeat } from "lucide-react";
import type { WorkflowStep } from "../../../types/automation-types";

type LoopNodeData = {
  step: WorkflowStep;
  label: string;
};

type LoopNodeType = Node<LoopNodeData, "loop">;

function LoopNodeComponent({ data, selected }: NodeProps<LoopNodeType>) {
  const step = data.step;
  const maxIter = step?.loop_config?.maxIterations || 100;

  return (
    <div
      className={`
        rounded-lg border-2 bg-card px-4 py-3 shadow-sm min-w-[240px]
        ${selected ? "border-orange-400 ring-2 ring-orange-400/30" : "border-orange-500/40 hover:border-orange-500/70"}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-orange-500 !bg-background"
      />

      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-orange-500/20">
          <Repeat className="h-4 w-4 text-orange-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {data.label || "Loop"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            Max {maxIter} iterations
            {step?.loop_config?.source
              ? ` over ${step.loop_config.source}`
              : ""}
          </div>
        </div>
      </div>

      {/* Loop Body output (left) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="body"
        className="!h-3 !w-3 !border-2 !border-orange-500 !bg-background !left-[30%]"
      />

      {/* Done output (right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="done"
        className="!h-3 !w-3 !border-2 !border-muted-foreground !bg-background !left-[70%]"
      />

      <div className="mt-2 flex justify-between px-2 text-[10px] font-medium">
        <span className="text-orange-500">Body</span>
        <span className="text-muted-foreground">Done</span>
      </div>
    </div>
  );
}

export const LoopNode = memo(LoopNodeComponent);
