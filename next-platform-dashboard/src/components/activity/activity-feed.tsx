"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw, Globe, User, File, Users, CreditCard, Settings, type LucideIcon } from "lucide-react";
import { getAgencyActivityAction } from "@/lib/actions/activity";
import type { ActivityLogEntry } from "@/types/notifications";

interface ActivityFeedProps {
  agencyId: string;
  limit?: number;
  title?: string;
  showRefresh?: boolean;
}

const actionLabels: Record<string, string> = {
  "site.created": "created a new site",
  "site.updated": "updated site",
  "site.deleted": "deleted site",
  "site.published": "published site",
  "site.unpublished": "unpublished site",
  "client.created": "added a new client",
  "client.updated": "updated client",
  "client.deleted": "removed client",
  "client.activated": "activated client",
  "client.deactivated": "deactivated client",
  "team.invited": "invited a team member",
  "team.joined": "joined the team",
  "team.left": "left the team",
  "team.removed": "removed a team member",
  "team.role_changed": "changed team member role",
  "page.created": "created a new page",
  "page.updated": "updated page",
  "page.deleted": "deleted page",
  "page.duplicated": "duplicated page",
  "settings.updated": "updated settings",
  "settings.branding_updated": "updated branding",
  "billing.plan_changed": "changed subscription plan",
  "billing.payment_method_updated": "updated payment method",
  "billing.subscription_cancelled": "cancelled subscription",
};

const resourceTypeIcons: Record<string, LucideIcon> = {
  site: Globe,
  client: User,
  page: File,
  team: Users,
  billing: CreditCard,
  settings: Settings,
};

export function ActivityFeed({
  agencyId,
  limit = 20,
  title = "Recent Activity",
  showRefresh = true,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadActivities = useCallback(async () => {
    try {
      const data = await getAgencyActivityAction(agencyId, { limit });
      setActivities(data);
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  }, [agencyId, limit]);

  useEffect(() => {
    async function fetchActivity() {
      setIsLoading(true);
      await loadActivities();
      setIsLoading(false);
    }

    fetchActivity();
  }, [loadActivities]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActivities();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>{title}</CardTitle>
        {showRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Activity will appear here as your team makes changes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.user_avatar || undefined} />
                    <AvatarFallback>
                      {activity.user_name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span>{" "}
                      <span className="text-muted-foreground">
                        {actionLabels[activity.action] || activity.action}
                      </span>
                      {activity.resource_name && (
                        <>
                          {" "}
                          <span className="font-medium inline-flex items-center gap-1">
                            {(() => {
                              const Icon = resourceTypeIcons[activity.resource_type];
                              return Icon ? <Icon className="inline w-3.5 h-3.5" strokeWidth={1.5} /> : null;
                            })()}
                            {activity.resource_name}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
