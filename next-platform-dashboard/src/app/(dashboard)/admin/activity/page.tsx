import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRecentActivity, type ActivityLogEntry } from "@/lib/actions/admin";
import { formatDistanceToNow, format } from "date-fns";
import {
  UserPlus,
  Building2,
  Globe,
  Settings,
  Activity,
  Download,
  Filter,
  LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Activity Log | Admin | DRAMAC",
  description: "View platform activity and audit logs",
};

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

const actionColors: Record<string, string> = {
  "user.created": "bg-green-100 text-green-800",
  "user.updated": "bg-blue-100 text-blue-800",
  "agency.created": "bg-purple-100 text-purple-800",
  "agency.updated": "bg-purple-100 text-purple-800",
  "site.created": "bg-cyan-100 text-cyan-800",
  "site.published": "bg-emerald-100 text-emerald-800",
  "site.updated": "bg-cyan-100 text-cyan-800",
};

function ActivityItem({ activity }: { activity: ActivityLogEntry }) {
  const Icon = actionIcons[activity.action] || Activity;
  const label = actionLabels[activity.action] || activity.action;
  const colorClass = actionColors[activity.action] || "bg-gray-100 text-gray-800";

  return (
    <div className="flex items-start gap-4 p-4 border-b last:border-0">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={colorClass}>
            {label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(activity.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-sm mt-1">
          <span className="font-medium">
            {activity.user_name || activity.user_email}
          </span>{" "}
          performed this action
          {activity.resource_type && (
            <span className="text-muted-foreground">
              {" "}
              on {activity.resource_type} {activity.resource_id}
            </span>
          )}
        </p>
        {Object.keys(activity.details).length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {JSON.stringify(activity.details)}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(activity.created_at), "PPpp")}
        </p>
      </div>
    </div>
  );
}

export default async function AdminActivityPage() {
  const activities = await getRecentActivity(50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Track all actions performed on the platform"
        actions={
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user">User Actions</SelectItem>
                <SelectItem value="agency">Agency Actions</SelectItem>
                <SelectItem value="site">Site Actions</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="7d">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activity recorded yet</p>
              <p className="text-sm mt-1">
                Activity will appear here as users interact with the platform
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">Activity Logging</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This page displays a mock activity log. To enable full activity
                logging, create an <code>activity_logs</code> table in your
                database and update the server actions to log user activities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
