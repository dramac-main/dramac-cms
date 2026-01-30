"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  FileText, 
  User, 
  Eye, 
  Activity, 
  Puzzle, 
  Inbox,
  ChevronDown,
  Filter,
  LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/actions/dashboard";

type ActivityType = ActivityItem["type"];

const activityConfig: Record<ActivityType, { 
  icon: LucideIcon; 
  color: string; 
  label: string;
}> = {
  site_created: { 
    icon: Globe, 
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    label: "Sites",
  },
  site_published: { 
    icon: Eye, 
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    label: "Published",
  },
  page_created: { 
    icon: FileText, 
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Pages",
  },
  client_created: { 
    icon: User, 
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    label: "Clients",
  },
  module_installed: { 
    icon: Puzzle, 
    color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    label: "Modules",
  },
  form_submission: { 
    icon: Inbox, 
    color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    label: "Forms",
  },
};

interface RecentActivityProps {
  activities: ActivityItem[];
  initialDisplayCount?: number;
  showFilter?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut" as const,
    },
  }),
  exit: { opacity: 0, x: 10 },
};

export function RecentActivity({ 
  activities, 
  initialDisplayCount = 5,
  showFilter = true,
}: RecentActivityProps) {
  const [displayCount, setDisplayCount] = useState(initialDisplayCount);
  const [filterType, setFilterType] = useState<ActivityType | "all">("all");

  const filteredActivities = filterType === "all" 
    ? activities 
    : activities.filter(a => a.type === filterType);

  const displayedActivities = filteredActivities.slice(0, displayCount);
  const hasMore = displayCount < filteredActivities.length;

  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 5, filteredActivities.length));
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>No activity yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No activity to display</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
              Activity will appear here as you create sites, add clients, and install modules.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest updates in your platform</CardDescription>
        </div>
        {showFilter && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-3.5 w-3.5" />
                {filterType === "all" ? "All" : activityConfig[filterType]?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterType("all")}>
                All Activity
              </DropdownMenuItem>
              {Object.entries(activityConfig).map(([type, config]) => (
                <DropdownMenuItem 
                  key={type}
                  onClick={() => setFilterType(type as ActivityType)}
                >
                  <config.icon className="h-4 w-4 mr-2" />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {displayedActivities.map((activity, index) => {
              const config = activityConfig[activity.type] || { 
                icon: Activity, 
                color: "bg-muted text-muted-foreground",
                label: "Activity",
              };
              const Icon = config.icon;

              return (
                <motion.div
                  key={activity.id}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-transform group-hover:scale-105",
                    config.color
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-none">{activity.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {config.label}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadMore}
              className="w-full gap-2"
            >
              <ChevronDown className="h-4 w-4" />
              Load More ({filteredActivities.length - displayCount} remaining)
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
