/**
 * EndNode — Terminal node.
 * Gray accent. Single input handle. Auto-placed.
 */

"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import { CircleCheck } from "lucide-react";

type EndNodeData = {
  label: string;
};

type EndNodeType = Node<EndNodeData, "end">;

function EndNodeComponent({ selected }: NodeProps<EndNodeType>) {
  return (
    <div
      className={`
        rounded-lg border-2 bg-card px-4 py-3 shadow-sm min-w-[160px]
        ${selected ? "border-muted-foreground ring-2 ring-muted-foreground/30" : "border-muted-foreground/40"}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-muted-foreground !bg-background"
      />

      <div className="flex items-center justify-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
          <CircleCheck className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">End</span>
      </div>
    </div>
  );
}

export const EndNode = memo(EndNodeComponent);
