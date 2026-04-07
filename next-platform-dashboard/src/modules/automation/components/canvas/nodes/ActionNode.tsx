/**
 * ActionNode — Standard action step.
 * Blue accent. Input handle at top, output handle at bottom.
 */

"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import {
  Mail,
  Bell,
  User,
  Globe,
  Database,
  Bot,
  Link,
  MessageSquare,
  Smartphone,
  Zap,
  icons,
} from "lucide-react";
import type { WorkflowStep } from "../../../types/automation-types";

type ActionNodeData = {
  step: WorkflowStep;
  label: string;
};

type ActionNodeType = Node<ActionNodeData, "action">;

function getActionIcon(actionType?: string | null) {
  if (!actionType) return Zap;
  if (actionType.startsWith("email")) return Mail;
  if (actionType.startsWith("notification.send_sms")) return Smartphone;
  if (actionType.startsWith("notification.send_slack")) return MessageSquare;
  if (actionType.startsWith("notification")) return Bell;
  if (actionType.startsWith("crm")) return User;
  if (actionType.startsWith("webhook")) return Globe;
  if (actionType.startsWith("data")) return Database;
  if (actionType.startsWith("ai")) return Bot;
  if (actionType.startsWith("integration")) return Link;
  if (actionType.startsWith("chat")) return MessageSquare;
  return Zap;
}

function getConfigSummary(step: WorkflowStep): string {
  if (step.description) return step.description;
  if (step.action_type) {
    const parts = step.action_type.split(".");
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" → ");
  }
  return "Configure action";
}

function ActionNodeComponent({ data, selected }: NodeProps<ActionNodeType>) {
  const step = data.step;
  const Icon = getActionIcon(step?.action_type);
  const isInactive = step && !step.is_active;

  return (
    <div
      className={`
        rounded-lg border-2 bg-card px-4 py-3 shadow-sm min-w-[240px]
        ${isInactive ? "opacity-50" : ""}
        ${selected ? "border-blue-400 ring-2 ring-blue-400/30" : "border-blue-500/40 hover:border-blue-500/70"}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-blue-500 !bg-background"
      />

      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-blue-500/20">
          <Icon className="h-4 w-4 text-blue-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {data.label || "Action"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {step ? getConfigSummary(step) : ""}
          </div>
        </div>
      </div>

      {step?.on_error === "retry" && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          {(() => {
            const RefreshIcon = icons["RefreshCw"];
            return RefreshIcon ? <RefreshIcon className="h-3 w-3" /> : null;
          })()}
          <span>Retry ({step.max_retries}x)</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-blue-500 !bg-background"
      />
    </div>
  );
}

export const ActionNode = memo(ActionNodeComponent);
