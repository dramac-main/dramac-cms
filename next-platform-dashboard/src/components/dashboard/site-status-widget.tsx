"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Eye, FileEdit, AlertCircle, Clock, LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// =============================================================================
// SITE STATUS WIDGET
// =============================================================================

export interface SiteStatusData {
  published: number;
  draft: number;
  total: number;
  recentlyUpdated: number;
  needsAttention: number;
}

export interface SiteStatusWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  data: SiteStatusData;
  animated?: boolean;
}

interface StatusItemProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  description: string;
  percentage?: number;
}

const statusItems: Omit<StatusItemProps, "value" | "percentage">[] = [
  {
    icon: Eye,
    label: "Published",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    description: "Live and accessible to visitors",
  },
  {
    icon: FileEdit,
    label: "Draft",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    description: "Work in progress, not published",
  },
  {
    icon: Clock,
    label: "Recently Updated",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    description: "Updated in the last 7 days",
  },
  {
    icon: AlertCircle,
    label: "Needs Attention",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    description: "Issues that need resolution",
  },
];

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

/**
 * SiteStatusWidget - Visual overview of site statuses.
 * 
 * @example
 * ```tsx
 * <SiteStatusWidget
 *   data={{
 *     published: 12,
 *     draft: 3,
 *     total: 15,
 *     recentlyUpdated: 5,
 *     needsAttention: 1
 *   }}
 * />
 * ```
 */
const SiteStatusWidget = React.forwardRef<HTMLDivElement, SiteStatusWidgetProps>(
  ({ className, data, animated = true, ...props }, ref) => {
    const values = [data.published, data.draft, data.recentlyUpdated, data.needsAttention];
    const percentages = data.total > 0 
      ? values.map(v => Math.round((v / data.total) * 100))
      : [0, 0, 0, 0];

    return (
      <div 
        ref={ref}
        className={cn("space-y-4", className)} 
        {...props}
      >
        {/* Status Bar Visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Site Distribution</span>
            <span className="text-muted-foreground">{data.total} total</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {data.total > 0 && (
              <>
                <div 
                  className="bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${percentages[0]}%` }}
                />
                <div 
                  className="bg-amber-500 transition-all duration-500" 
                  style={{ width: `${percentages[1]}%` }}
                />
              </>
            )}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Published ({percentages[0]}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Draft ({percentages[1]}%)</span>
            </div>
          </div>
        </div>

        {/* Status Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-2 gap-3">
            {statusItems.map((item, index) => {
              const Icon = item.icon;
              const value = values[index];
              const Wrapper = animated ? motion.div : "div";
              const wrapperProps = animated ? { variants: itemVariants } : {};

              return (
                <Wrapper key={item.label} {...wrapperProps}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        "hover:border-primary/20 transition-colors cursor-default"
                      )}>
                        <div className={cn("p-2 rounded-md", item.bgColor)}>
                          <Icon className={cn("h-4 w-4", item.color)} />
                        </div>
                        <div>
                          <div className="text-xl font-bold tabular-nums">{value}</div>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </Wrapper>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    );
  }
);

SiteStatusWidget.displayName = "SiteStatusWidget";

export { SiteStatusWidget };
