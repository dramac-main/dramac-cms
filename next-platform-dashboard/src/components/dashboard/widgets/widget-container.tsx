"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCw,
  MoreHorizontal,
  Maximize2,
  Settings,
  Download,
  Trash2,
  AlertCircle,
  Clock,
  LucideIcon,
} from "lucide-react";
import { Widget, WidgetSize } from "@/types/dashboard-widgets";
import { getWidgetSizeClasses } from "@/lib/dashboard/widget-factory";
import { formatDistanceToNow } from "date-fns";

export interface WidgetContainerProps {
  widget: Widget;
  children: React.ReactNode;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onSettings?: () => void;
  onExpand?: () => void;
  onExport?: () => void;
  onRemove?: () => void;
  refreshing?: boolean;
  className?: string;
  headerActions?: React.ReactNode;
  noPadding?: boolean;
  animated?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export function WidgetContainer({
  widget,
  children,
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  isLoading = false,
  error,
  onRefresh,
  onSettings,
  onExpand,
  onExport,
  onRemove,
  refreshing = false,
  className,
  headerActions,
  noPadding = false,
  animated = true,
}: WidgetContainerProps) {
  const { title, description } = widget.metadata;
  const sizeClasses = getWidgetSizeClasses(widget.size);
  const lastUpdated = widget.lastUpdated;

  const content = (
    <Card className="h-full flex flex-col overflow-hidden group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 border-b">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className={cn("p-2 rounded-lg", iconBg)}>
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
          )}
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Time indicator */}
          {lastUpdated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground mr-2">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Last updated</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Custom header actions */}
          {headerActions}
          
          {/* Refresh button */}
          {onRefresh && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={onRefresh}
                    disabled={refreshing || isLoading}
                  >
                    <RefreshCw className={cn(
                      "h-4 w-4",
                      (refreshing || isLoading) && "animate-spin"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* More actions menu */}
          {(onSettings || onExpand || onExport || onRemove) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onExpand && (
                  <DropdownMenuItem onClick={onExpand}>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Expand
                  </DropdownMenuItem>
                )}
                {onSettings && (
                  <DropdownMenuItem onClick={onSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                )}
                {onExport && (
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onRemove}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={cn(
        "flex-1",
        noPadding ? "p-0" : "p-4 pt-4"
      )}>
        {/* Error state */}
        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="text-sm font-medium text-destructive">Failed to load</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              {error}
            </p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="mt-4"
              >
                Try Again
              </Button>
            )}
          </div>
        ) : isLoading ? (
          <WidgetLoadingSkeleton type={widget.type} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );

  if (animated) {
    return (
      <motion.div
        variants={itemVariants}
        className={cn(
          sizeClasses.colSpan,
          sizeClasses.minHeight,
          className
        )}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className={cn(
      sizeClasses.colSpan,
      sizeClasses.minHeight,
      className
    )}>
      {content}
    </div>
  );
}

// Loading skeleton for different widget types
interface WidgetLoadingSkeletonProps {
  type: string;
}

export function WidgetLoadingSkeleton({ type }: WidgetLoadingSkeletonProps) {
  if (type.includes('stat')) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }
  
  if (type.includes('chart')) {
    return (
      <div className="h-full flex flex-col gap-2">
        <div className="flex gap-2 mb-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex-1 flex items-end gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
        </div>
      </div>
    );
  }
  
  if (type.includes('list') || type.includes('activity')) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (type.includes('table')) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  // Default loading skeleton
  return (
    <div className="h-full flex items-center justify-center">
      <Skeleton className="h-20 w-20 rounded-lg" />
    </div>
  );
}
