import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentActivity } from "@/lib/actions/admin";
import { formatDistanceToNow } from "date-fns";
import {
  UserPlus,
  Building2,
  Globe,
  Settings,
  Activity,
  LucideIcon,
} from "lucide-react";

const actionIcons: Record<string, LucideIcon> = {
  "user.created": UserPlus,
  "user.updated": Settings,
  "agency.created": Building2,
  "agency.updated": Building2,
  "site.created": Globe,
  "site.published": Globe,
  "site.updated": Globe,
};

const actionLabels: Record<string, string> = {
  "user.created": "User created",
  "user.updated": "User updated",
  "agency.created": "Agency created",
  "agency.updated": "Agency updated",
  "site.created": "Site created",
  "site.published": "Site published",
  "site.updated": "Site updated",
};

export async function RecentActivity() {
  const activity = await getRecentActivity(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-4">
            {activity.map((item) => {
              const Icon = actionIcons[item.action] || Activity;
              const label = actionLabels[item.action] || item.action;

              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      by {item.user_name || item.user_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
