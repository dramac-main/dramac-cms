/**
 * TriggerNode — The workflow start node.
 * Green accent. Single output handle at bottom. Cannot be deleted.
 */

"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import { Zap } from "lucide-react";

type TriggerNodeData = {
  label: string;
  triggerType?: string;
  triggerConfig?: Record<string, unknown>;
};

type TriggerNodeType = Node<TriggerNodeData, "trigger">;

function TriggerNodeComponent({ data, selected }: NodeProps<TriggerNodeType>) {
  const eventType = data.triggerConfig?.event_type as string | undefined;

  return (
    <div
      className={`
        rounded-lg border-2 bg-card px-4 py-3 shadow-sm min-w-[240px]
        ${selected ? "border-green-400 ring-2 ring-green-400/30" : "border-green-500/60"}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
          <Zap className="h-4 w-4 text-green-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-green-500">
            Trigger
          </div>
          <div className="truncate text-sm font-medium text-foreground">
            {eventType || data.label || "Configure Trigger"}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-green-500 !bg-background"
      />
    </div>
  );
}

export const TriggerNode = memo(TriggerNodeComponent);
