/**
 * Platform Activity Component
 * 
 * PHASE-DS-04A: Admin Dashboard - Platform Overview
 * 
 * Displays real-time platform activity feed.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LucideIcon } from "lucide-react";
import {
  UserPlus,
  CreditCard,
  Globe,
  Package,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getPlatformActivity } from "@/lib/actions/admin-analytics";
import type { PlatformActivityItem } from "@/types/admin-analytics";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// Types
// ============================================================================

interface PlatformActivityProps {
  limit?: number;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const ACTIVITY_CONFIG: Record<
  PlatformActivityItem["type"],
  { icon: LucideIcon; color: string; label: string }
> = {
  signup: { icon: UserPlus, color: "text-green-500", label: "New Signup" },
  subscription: { icon: CreditCard, color: "text-blue-500", label: "Subscription" },
  publish: { icon: Globe, color: "text-purple-500", label: "Site Published" },
  module_install: { icon: Package, color: "text-orange-500", label: "Module Installed" },
  payment: { icon: CreditCard, color: "text-green-500", label: "Payment" },
  cancellation: { icon: TrendingDown, color: "text-red-500", label: "Cancellation" },
  upgrade: { icon: TrendingUp, color: "text-blue-500", label: "Upgrade" },
  error: { icon: AlertCircle, color: "text-red-500", label: "Error" },
};

// ============================================================================
// Helper Components
// ============================================================================

function ActivityItem({
  activity,
  compact = false,
}: {
  activity: PlatformActivityItem;
  compact?: boolean;
}) {
  const config = ACTIVITY_CONFIG[activity.type];
  const Icon = config.icon;

  const timeAgo = activity.timestamp
    ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
    : "Unknown";

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-2">
        <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{activity.title}</p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-4 py-3">
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        activity.type === "signup" && "bg-green-100 dark:bg-green-900/30",
        activity.type === "subscription" && "bg-blue-100 dark:bg-blue-900/30",
        activity.type === "publish" && "bg-purple-100 dark:bg-purple-900/30",
        activity.type === "module_install" && "bg-orange-100 dark:bg-orange-900/30",
        activity.type === "payment" && "bg-green-100 dark:bg-green-900/30",
        activity.type === "cancellation" && "bg-red-100 dark:bg-red-900/30",
        activity.type === "upgrade" && "bg-blue-100 dark:bg-blue-900/30",
        activity.type === "error" && "bg-red-100 dark:bg-red-900/30"
      )}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {activity.metadata?.agencyName && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground truncate">
                {activity.metadata.agencyName}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function ActivitySkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PlatformActivity({
  limit = 20,
  className,
  compact = false,
}: PlatformActivityProps) {
  const [activities, setActivities] = useState<PlatformActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getPlatformActivity(limit);
      setActivities(data);
    } catch (error) {
      console.error("Failed to fetch platform activity:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivitySkeleton count={compact ? 5 : 10} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest platform events</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchActivities(true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className={compact ? "h-[300px]" : "h-[500px]"}>
            <div className="divide-y">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} compact={compact} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact activity list for sidebar or widgets
 */
export function PlatformActivityCompact({
  limit = 5,
  className,
}: {
  limit?: number;
  className?: string;
}) {
  return <PlatformActivity limit={limit} className={className} compact />;
}

// Export with both names for compatibility
export { PlatformActivity as PlatformActivityComponent };

export default PlatformActivity;
