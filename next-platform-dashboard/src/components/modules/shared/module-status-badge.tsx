"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ModuleStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  draft: { label: "Draft", variant: "outline" },
  review: { label: "In Review", variant: "secondary" },
  deprecated: { label: "Deprecated", variant: "destructive" },
  pending: { label: "Pending", variant: "secondary" },
  enabled: { label: "Enabled", variant: "default" },
  disabled: { label: "Disabled", variant: "outline" },
};

export function ModuleStatusBadge({ status, className }: ModuleStatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || { 
    label: status.charAt(0).toUpperCase() + status.slice(1), 
    variant: "secondary" as const 
  };

  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        status === "active" && "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200",
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
