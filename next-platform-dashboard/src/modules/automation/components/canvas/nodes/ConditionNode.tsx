/**
 * ConditionNode — Branching decision node.
 * Yellow accent. Input at top, two outputs: "True" (bottom-left) and "False" (bottom-right).
 */

"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import type { WorkflowStep } from "../../../types/automation-types";

type ConditionNodeData = {
  step: WorkflowStep;
  label: string;
};

type ConditionNodeType = Node<ConditionNodeData, "condition">;

function ConditionNodeComponent({ data, selected }: NodeProps<ConditionNodeType>) {
  const step = data.step;
  const condCount = step?.condition_config?.conditions?.length || 0;
  const operator = step?.condition_config?.operator || "and";

  return (
    <div
      className={`
        rounded-lg border-2 bg-card px-4 py-3 shadow-sm min-w-[260px]
        ${selected ? "border-yellow-400 ring-2 ring-yellow-400/30" : "border-yellow-500/40 hover:border-yellow-500/70"}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-yellow-500 !bg-background"
      />

      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-yellow-500/20">
          <GitBranch className="h-4 w-4 text-yellow-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {data.label || "Condition"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {condCount > 0
              ? `${condCount} condition${condCount > 1 ? "s" : ""} (${operator.toUpperCase()})`
              : "No conditions set"}
          </div>
        </div>
      </div>

      {/* True output (left) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!h-3 !w-3 !border-2 !border-green-500 !bg-background !left-[30%]"
      />

      {/* False output (right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!h-3 !w-3 !border-2 !border-red-400 !bg-background !left-[70%]"
      />

      {/* Branch labels */}
      <div className="mt-2 flex justify-between px-2 text-[10px] font-medium">
        <span className="text-green-500">True</span>
        <span className="text-red-400">False</span>
      </div>
    </div>
  );
}

export const ConditionNode = memo(ConditionNodeComponent);
