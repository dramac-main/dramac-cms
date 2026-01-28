import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Globe, FileText, User, Eye, Activity, Puzzle, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityItem } from "@/lib/actions/dashboard";

const activityIcons = {
  site_created: Globe,
  site_published: Eye,
  page_created: FileText,
  client_created: User,
  module_installed: Puzzle,
  form_submission: Inbox,
};

const activityColors = {
  site_created: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  site_published: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  page_created: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  client_created: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  module_installed: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  form_submission: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>No activity yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Your activity will appear here as you work.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest updates in your platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type] || Activity;
            const colorClass = activityColors[activity.type] || "bg-muted text-muted-foreground";

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
