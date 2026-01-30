"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Globe, 
  FileText, 
  User, 
  Eye, 
  Activity, 
  Puzzle, 
  Inbox,
  LucideIcon,
} from "lucide-react";
import { format, isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/actions/dashboard";

type ActivityType = ActivityItem["type"];

const activityConfig: Record<ActivityType, { 
  icon: LucideIcon; 
  color: string;
  bgColor: string;
}> = {
  site_created: { 
    icon: Globe, 
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  site_published: { 
    icon: Eye, 
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  page_created: { 
    icon: FileText, 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  client_created: { 
    icon: User, 
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  module_installed: { 
    icon: Puzzle, 
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
  },
  form_submission: { 
    icon: Inbox, 
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
  },
};

interface ActivityTimelineProps {
  activities: ActivityItem[];
  className?: string;
  maxItems?: number;
  showCard?: boolean;
}

interface GroupedActivities {
  label: string;
  items: ActivityItem[];
}

function getDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return format(date, "EEEE"); // Day name
  return format(date, "MMM d, yyyy");
}

function groupActivitiesByDate(activities: ActivityItem[]): GroupedActivities[] {
  const groups: Record<string, ActivityItem[]> = {};
  
  activities.forEach(activity => {
    const dateKey = format(parseISO(activity.timestamp), "yyyy-MM-dd");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      label: getDateLabel(items[0].timestamp),
      items: items.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    }));
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

function TimelineContent({ 
  activities, 
  maxItems,
}: { 
  activities: ActivityItem[];
  maxItems?: number;
}) {
  const limitedActivities = maxItems ? activities.slice(0, maxItems) : activities;
  const groupedActivities = useMemo(
    () => groupActivitiesByDate(limitedActivities),
    [limitedActivities]
  );

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Activity className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-medium">No activity to display</p>
        <p className="text-sm text-muted-foreground mt-1">
          Activity will appear here as you work.
        </p>
      </div>
    );
  }

  let itemIndex = 0;

  return (
    <div className="space-y-6">
      {groupedActivities.map((group) => (
        <div key={group.label}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-1">
            {group.label}
          </h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />
            
            <div className="space-y-1">
              {group.items.map((activity) => {
                const config = activityConfig[activity.type] || {
                  icon: Activity,
                  color: "text-muted-foreground",
                  bgColor: "bg-muted",
                };
                const Icon = config.icon;
                const currentIndex = itemIndex++;

                return (
                  <motion.div
                    key={activity.id}
                    custom={currentIndex}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="group relative flex gap-4 pl-0"
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                      config.bgColor
                    )}>
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm leading-none">
                            {activity.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {activity.description}
                          </p>
                        </div>
                        <time className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(parseISO(activity.timestamp), "h:mm a")}
                        </time>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityTimeline({ 
  activities, 
  className,
  maxItems,
  showCard = true,
}: ActivityTimelineProps) {
  if (!showCard) {
    return (
      <div className={className}>
        <TimelineContent activities={activities} maxItems={maxItems} />
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Activity Timeline</CardTitle>
        <CardDescription>Your recent platform activity</CardDescription>
      </CardHeader>
      <CardContent>
        <TimelineContent activities={activities} maxItems={maxItems} />
      </CardContent>
    </Card>
  );
}
