"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Globe, FileText, Settings, User, Edit, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ClientActivityLogProps {
  clientId: string;
}

const getActivityIcon = (action: string, entityType: string) => {
  if (action.includes("delete")) return Trash;
  if (action.includes("update") || action.includes("edit")) return Edit;
  
  switch (entityType) {
    case "site":
      return Globe;
    case "page":
      return FileText;
    case "settings":
      return Settings;
    default:
      return User;
  }
};

const formatActivityMessage = (activity: ActivityItem): string => {
  const { action, metadata } = activity;
  
  switch (action) {
    case "client.created":
      return "Client was created";
    case "client.updated":
      return "Client details were updated";
    case "site.created":
      return `Site "${(metadata.site_name as string) || 'Unknown'}" was created`;
    case "site.published":
      return `Site "${(metadata.site_name as string) || 'Unknown'}" was published`;
    case "site.deleted":
      return `Site "${(metadata.site_name as string) || 'Unknown'}" was deleted`;
    case "portal.invited":
      return "Portal invitation was sent";
    case "portal.access_granted":
      return "Portal access was granted";
    case "portal.access_revoked":
      return "Portal access was revoked";
    default:
      return action.replace(/\./g, " ").replace(/_/g, " ");
  }
};

export function ClientActivityLog({ clientId }: ClientActivityLogProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadActivities() {
      try {
        // Try to fetch activities from API
        const response = await fetch(`/api/clients/${clientId}/activities`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data || []);
        } else {
          // If API fails or doesn't exist, show empty state
          setActivities([]);
        }
      } catch (_error) {
        // Activity tracking not implemented yet
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadActivities();
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity recorded yet.</p>
            <p className="text-sm mt-1">Activity will appear here as you work with this client.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.action, activity.entity_type);
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{formatActivityMessage(activity)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
