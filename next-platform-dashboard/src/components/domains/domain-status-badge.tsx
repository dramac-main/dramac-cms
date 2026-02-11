"use client";

import { Badge } from "@/components/ui/badge";
import { CircleCheck, Clock, AlertTriangle, CircleX, RefreshCw, Ban, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DomainStatus = 'active' | 'pending' | 'expired' | 'suspended' | 'transferring' | 'redemption' | 'cancelled';

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  variant: string;
}

interface DomainStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<DomainStatus, StatusConfig> = {
  active: { label: 'Active', icon: CircleCheck, variant: 'bg-green-500/10 text-green-600 border-green-200' },
  pending: { label: 'Pending', icon: Clock, variant: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
  expired: { label: 'Expired', icon: CircleX, variant: 'bg-red-500/10 text-red-600 border-red-200' },
  suspended: { label: 'Suspended', icon: AlertTriangle, variant: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  transferring: { label: 'Transferring', icon: RefreshCw, variant: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  redemption: { label: 'Redemption', icon: AlertTriangle, variant: 'bg-red-500/10 text-red-600 border-red-200' },
  cancelled: { label: 'Cancelled', icon: Ban, variant: 'bg-gray-500/10 text-gray-600 border-gray-200' },
};

const defaultConfig = statusConfig.pending;

export function DomainStatusBadge({ status, className }: DomainStatusBadgeProps) {
  const config: StatusConfig = (status in statusConfig) 
    ? statusConfig[status as DomainStatus] 
    : defaultConfig;
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={cn(config.variant, "gap-1", className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
