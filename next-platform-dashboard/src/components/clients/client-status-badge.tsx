import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClientStatus } from "@/types/client";

interface ClientStatusBadgeProps {
  status: ClientStatus;
  className?: string;
}

const statusConfig: Record<ClientStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-success text-success-foreground",
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground",
  },
  archived: {
    label: "Archived",
    className: "bg-destructive/10 text-destructive",
  },
};

export function ClientStatusBadge({ status, className }: ClientStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
