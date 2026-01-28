import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, FileText, Eye } from "lucide-react";
import type { DashboardStats as Stats } from "@/lib/actions/dashboard";

interface DashboardStatsProps {
  stats: Stats;
}

const statItems = [
  {
    key: "totalClients" as const,
    label: "Total Clients",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    key: "totalSites" as const,
    label: "Total Sites",
    icon: Globe,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
  },
  {
    key: "publishedSites" as const,
    label: "Published Sites",
    icon: Eye,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    key: "totalPages" as const,
    label: "Total Pages",
    icon: FileText,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
];

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key];

        return (
          <Card key={item.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
