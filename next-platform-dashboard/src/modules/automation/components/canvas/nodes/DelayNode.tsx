/**
 * DelayNode — Wait/delay step.
 * Purple accent. Single input, single output.
 */

"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import { Clock } from "lucide-react";
import type { WorkflowStep } from "../../../types/automation-types";

type DelayNodeData = {
  step: WorkflowStep;
  label: string;
};

type DelayNodeType = Node<DelayNodeData, "delay">;

function formatDelay(step: WorkflowStep): string {
  const cfg = step.delay_config;
  if (!cfg) return "No delay configured";
  if (cfg.type === "fixed") return `Wait ${cfg.value || "0s"}`;
  if (cfg.type === "until") return `Wait until ${cfg.value || "..."}`;
  if (cfg.type === "expression") return `Expression: ${cfg.value || "..."}`;
  return cfg.value || "Delay";
}

function DelayNodeComponent({ data, selected }: NodeProps<DelayNodeType>) {
  const step = data.step;

  return (
    <div
      className={`
        rounded-lg border-2 bg-card px-4 py-3 shadow-sm min-w-[220px]
        ${selected ? "border-purple-400 ring-2 ring-purple-400/30" : "border-purple-500/40 hover:border-purple-500/70"}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-purple-500 !bg-background"
      />

      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-purple-500/20">
          <Clock className="h-4 w-4 text-purple-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {data.label || "Delay"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {step ? formatDelay(step) : "Configure delay"}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-purple-500 !bg-background"
      />
    </div>
  );
}

export const DelayNode = memo(DelayNodeComponent);
