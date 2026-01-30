"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { HardDrive, Image, FileText, Video, File } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// =============================================================================
// STORAGE WIDGET
// =============================================================================

export interface StorageBreakdown {
  images: number;
  documents: number;
  videos: number;
  other: number;
}

export interface StorageWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Used storage in bytes
   */
  used: number;
  /**
   * Total available storage in bytes
   */
  total: number;
  /**
   * Storage breakdown by type
   */
  breakdown?: StorageBreakdown;
  /**
   * Show detailed breakdown
   */
  showBreakdown?: boolean;
  /**
   * Animate the progress bar
   */
  animated?: boolean;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const breakdownItems = [
  { key: "images", label: "Images", icon: Image, color: "bg-blue-500" },
  { key: "documents", label: "Documents", icon: FileText, color: "bg-emerald-500" },
  { key: "videos", label: "Videos", icon: Video, color: "bg-violet-500" },
  { key: "other", label: "Other", icon: File, color: "bg-gray-400" },
] as const;

/**
 * StorageWidget - Display media storage usage with breakdown.
 * 
 * @example
 * ```tsx
 * <StorageWidget
 *   used={1024 * 1024 * 500}  // 500 MB
 *   total={1024 * 1024 * 1024 * 5}  // 5 GB
 *   breakdown={{
 *     images: 1024 * 1024 * 300,
 *     documents: 1024 * 1024 * 100,
 *     videos: 1024 * 1024 * 80,
 *     other: 1024 * 1024 * 20,
 *   }}
 *   showBreakdown
 * />
 * ```
 */
const StorageWidget = React.forwardRef<HTMLDivElement, StorageWidgetProps>(
  ({ 
    className, 
    used, 
    total, 
    breakdown, 
    showBreakdown = true, 
    animated = true,
    ...props 
  }, ref) => {
    const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
    const isWarning = percentage >= 80;
    const isDanger = percentage >= 95;

    const getStatusColor = () => {
      if (isDanger) return "text-red-600 dark:text-red-400";
      if (isWarning) return "text-amber-600 dark:text-amber-400";
      return "text-emerald-600 dark:text-emerald-400";
    };

    const getProgressColor = () => {
      if (isDanger) return "bg-red-500";
      if (isWarning) return "bg-amber-500";
      return "bg-primary";
    };

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {/* Main Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-muted">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">Storage Used</span>
            </div>
            <span className={cn("text-sm font-semibold tabular-nums", getStatusColor())}>
              {percentage}%
            </span>
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn("h-full rounded-full", getProgressColor())}
              initial={animated ? { width: 0 } : undefined}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatBytes(used)} used</span>
            <span>{formatBytes(total - used)} available</span>
          </div>
        </div>

        {/* Breakdown */}
        {showBreakdown && breakdown && (
          <TooltipProvider>
            <div className="space-y-3 pt-2 border-t">
              <span className="text-xs font-medium text-muted-foreground">Breakdown by Type</span>
              
              {/* Stacked Bar */}
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                {breakdownItems.map((item) => {
                  const value = breakdown[item.key];
                  const itemPercentage = used > 0 ? (value / used) * 100 : 0;
                  if (itemPercentage === 0) return null;
                  return (
                    <Tooltip key={item.key}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn("h-full transition-all", item.color)}
                          style={{ width: `${itemPercentage}%` }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {item.label}: {formatBytes(value)} ({Math.round(itemPercentage)}%)
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2">
                {breakdownItems.map((item) => {
                  const Icon = item.icon;
                  const value = breakdown[item.key];
                  
                  return (
                    <div key={item.key} className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full shrink-0", item.color)} />
                      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {item.label}
                      </span>
                      <span className="text-xs font-medium ml-auto tabular-nums">
                        {formatBytes(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TooltipProvider>
        )}

        {/* Warning Messages */}
        {isDanger && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            ⚠️ Storage almost full. Consider upgrading your plan or removing unused files.
          </div>
        )}
        {isWarning && !isDanger && (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
            Storage is running low. Consider cleaning up unused assets.
          </div>
        )}
      </div>
    );
  }
);

StorageWidget.displayName = "StorageWidget";

export { StorageWidget };
