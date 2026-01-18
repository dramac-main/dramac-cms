import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RecentActivity } from "@/lib/admin/stats-service";
import { UserPlus, Globe, Package, CreditCard, Building } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activities: RecentActivity[];
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  signup: <UserPlus className="h-4 w-4" />,
  publish: <Globe className="h-4 w-4" />,
  module_install: <Package className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  subscription: <Building className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  signup: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  publish: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  module_install: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
  payment: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
  subscription: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`p-2 rounded-full ${ACTIVITY_COLORS[activity.type] || "bg-gray-100 dark:bg-gray-800"}`}
                >
                  {ACTIVITY_ICONS[activity.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : "-"}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs capitalize shrink-0">
                  {activity.type.replace("_", " ")}
                </Badge>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No recent activity
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
