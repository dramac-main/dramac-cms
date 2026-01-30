"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Globe, FileText, Eye, TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DashboardStats as Stats } from "@/lib/actions/dashboard";

interface StatTrend {
  value: number;
  direction: "up" | "down" | "neutral";
  label: string;
}

interface StatItemConfig {
  key: keyof Stats;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  description: string;
  getTrend?: (value: number, stats: Stats) => StatTrend | null;
}

interface DashboardStatsProps {
  stats: Stats;
  className?: string;
  animated?: boolean;
}

const statItems: StatItemConfig[] = [
  {
    key: "totalClients",
    label: "Total Clients",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    description: "Active client accounts in your agency",
  },
  {
    key: "totalSites",
    label: "Total Sites",
    icon: Globe,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    description: "All websites created in your workspace",
  },
  {
    key: "publishedSites",
    label: "Published Sites",
    icon: Eye,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    description: "Live websites accessible to visitors",
    getTrend: (value, stats) => {
      const total = stats.totalSites;
      if (total === 0) return null;
      const percentage = Math.round((value / total) * 100);
      return {
        value: percentage,
        direction: percentage >= 50 ? "up" : percentage > 0 ? "neutral" : "down",
        label: `${percentage}% published`,
      };
    },
  },
  {
    key: "totalPages",
    label: "Total Pages",
    icon: FileText,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    description: "Pages across all your websites",
  },
];

const TrendIcon = ({ direction }: { direction: "up" | "down" | "neutral" }) => {
  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };
  const colors = {
    up: "text-emerald-600 dark:text-emerald-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-muted-foreground",
  };
  const Icon = icons[direction];
  return <Icon className={cn("h-3 w-3", colors[direction])} />;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export function DashboardStats({ stats, className, animated = true }: DashboardStatsProps) {
  const Container = animated ? motion.div : "div";
  const containerProps = animated
    ? { variants: containerVariants, initial: "hidden", animate: "show" }
    : {};

  return (
    <TooltipProvider>
      <Container
        className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}
        {...containerProps}
      >
        {statItems.map((item, _index) => {
          const Icon = item.icon;
          const value = stats[item.key];
          const trend = item.getTrend?.(value, stats);
          const ItemWrapper = animated ? motion.div : "div";
          const itemProps = animated ? { variants: itemVariants } : {};

          return (
            <ItemWrapper key={item.key} {...itemProps}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="group cursor-default transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {item.label}
                      </CardTitle>
                      <div className={cn(
                        "p-2 rounded-lg transition-transform duration-200 group-hover:scale-110",
                        item.bgColor
                      )}>
                        <Icon className={cn("h-4 w-4", item.color)} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tabular-nums">
                          {value.toLocaleString()}
                        </span>
                        {trend && (
                          <div className="flex items-center gap-1 text-xs">
                            <TrendIcon direction={trend.direction} />
                            <span className="text-muted-foreground">{trend.label}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p>{item.description}</p>
                </TooltipContent>
              </Tooltip>
            </ItemWrapper>
          );
        })}
      </Container>
    </TooltipProvider>
  );
}
