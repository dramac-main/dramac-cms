"use client";

import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Globe,
  User,
  FileText,
  Settings,
  CreditCard,
  Users,
  Edit,
  Trash,
  Plus,
  Eye,
  RefreshCw,
  Check,
  X,
  Send,
  Download,
  Upload,
  LucideIcon,
} from "lucide-react";
import type { ActivityLogEntry } from "@/types/notifications";

interface ActivityItemProps {
  activity: ActivityLogEntry;
  showAvatar?: boolean;
}

const RESOURCE_ICONS: Record<string, LucideIcon> = {
  site: Globe,
  client: User,
  page: FileText,
  settings: Settings,
  billing: CreditCard,
  team: Users,
};

const ACTION_KEYWORDS: Record<string, { icon: LucideIcon; color: string }> = {
  created: { icon: Plus, color: "text-green-500" },
  added: { icon: Plus, color: "text-green-500" },
  updated: { icon: Edit, color: "text-blue-500" },
  changed: { icon: Edit, color: "text-blue-500" },
  deleted: { icon: Trash, color: "text-red-500" },
  removed: { icon: Trash, color: "text-red-500" },
  viewed: { icon: Eye, color: "text-muted-foreground" },
  published: { icon: Check, color: "text-green-500" },
  unpublished: { icon: X, color: "text-orange-500" },
  invited: { icon: Send, color: "text-blue-500" },
  joined: { icon: Users, color: "text-green-500" },
  left: { icon: Users, color: "text-orange-500" },
  exported: { icon: Download, color: "text-blue-500" },
  imported: { icon: Upload, color: "text-green-500" },
  synced: { icon: RefreshCw, color: "text-blue-500" },
};

function getActionStyle(action: string): { icon: LucideIcon; color: string } {
  const lowerAction = action.toLowerCase();
  
  for (const [keyword, style] of Object.entries(ACTION_KEYWORDS)) {
    if (lowerAction.includes(keyword)) {
      return style;
    }
  }
  
  return { icon: FileText, color: "text-muted-foreground" };
}

function formatAction(action: string): string {
  // Convert action codes to readable text
  // e.g., "site.created" -> "created site"
  // e.g., "page.updated" -> "updated page"
  if (action.includes(".")) {
    const [resource, verb] = action.split(".");
    return `${verb} ${resource}`;
  }
  return action.toLowerCase();
}

export function ActivityItem({ activity, showAvatar = true }: ActivityItemProps) {
  const actionStyle = getActionStyle(activity.action);
  const ActionIcon = actionStyle.icon;
  const actionColor = actionStyle.color;
  const ResourceIcon = RESOURCE_ICONS[activity.resource_type] || FileText;
  
  const initials = activity.user_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const formattedAction = formatAction(activity.action);
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
  });

  return (
    <div className="flex items-start gap-3 py-2">
      {showAvatar && (
        <Avatar className="h-8 w-8 shrink-0">
          {activity.user_avatar && (
            <AvatarImage src={activity.user_avatar} alt={activity.user_name || ""} />
          )}
          <AvatarFallback className="text-xs bg-muted">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <ActionIcon className={`h-4 w-4 shrink-0 ${actionColor}`} />
          <span className="text-sm font-medium truncate">
            {activity.user_name || "System"}
          </span>
          <span className="text-sm text-muted-foreground">
            {formattedAction}
          </span>
        </div>

        {activity.resource_name && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ResourceIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{activity.resource_name}</span>
          </div>
        )}

        {activity.details && Object.keys(activity.details).length > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-block">
            {Object.entries(activity.details)
              .slice(0, 2)
              .map(([key, value]) => (
                <span key={key} className="mr-2">
                  {key}: {String(value)}
                </span>
              ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  );
}

