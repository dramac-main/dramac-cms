"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isAfter, addDays, format } from "date-fns";

interface DomainExpiryBadgeProps {
  expiryDate: string | null;
  className?: string;
  showIcon?: boolean;
}

export function DomainExpiryBadge({ expiryDate, className, showIcon = true }: DomainExpiryBadgeProps) {
  if (!expiryDate) return null;
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  const isExpired = !isAfter(expiry, now);
  const isExpiringSoon = !isExpired && !isAfter(expiry, addDays(now, 30));
  const isExpiringVerySoon = !isExpired && !isAfter(expiry, addDays(now, 7));
  
  const getVariant = () => {
    if (isExpired) return 'bg-red-500/10 text-red-600 border-red-200';
    if (isExpiringVerySoon) return 'bg-red-500/10 text-red-600 border-red-200';
    if (isExpiringSoon) return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    return 'bg-muted text-muted-foreground';
  };
  
  const getLabel = () => {
    if (isExpired) return 'Expired';
    return `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`;
  };
  
  return (
    <Badge variant="outline" className={cn(getVariant(), "gap-1 text-xs", className)}>
      {showIcon && <Calendar className="h-3 w-3" />}
      {getLabel()}
    </Badge>
  );
}

// Standalone function for formatting expiry dates
export function formatExpiryDate(expiryDate: string | null): string {
  if (!expiryDate) return 'N/A';
  return format(new Date(expiryDate), 'MMM dd, yyyy');
}
