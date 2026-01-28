import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Puzzle, 
  Image, 
  FileText, 
  BookOpen, 
  Users2, 
  Workflow 
} from "lucide-react";
import type { EnhancedMetrics as Metrics } from "@/lib/actions/dashboard";

interface EnhancedMetricsProps {
  metrics: Metrics;
}

const metricItems = [
  {
    key: "moduleInstallations" as const,
    label: "Active Modules",
    icon: Puzzle,
    color: "text-violet-600",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
  },
  {
    key: "totalAssets" as const,
    label: "Media Assets",
    icon: Image,
    color: "text-teal-600",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
  },
  {
    key: "formSubmissions" as const,
    label: "Form Submissions",
    icon: FileText,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    key: "blogPosts" as const,
    label: "Blog Posts",
    icon: BookOpen,
    color: "text-rose-600",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
  {
    key: "teamMembers" as const,
    label: "Team Members",
    icon: Users2,
    color: "text-sky-600",
    bgColor: "bg-sky-100 dark:bg-sky-900/30",
  },
  {
    key: "activeWorkflows" as const,
    label: "Active Workflows",
    icon: Workflow,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
];

export function EnhancedMetrics({ metrics }: EnhancedMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {metricItems.map((item) => {
        const Icon = item.icon;
        const value = metrics[item.key];

        return (
          <Card key={item.key} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <div className={`p-1.5 rounded-md ${item.bgColor}`}>
                <Icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
