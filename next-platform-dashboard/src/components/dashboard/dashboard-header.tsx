"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, RefreshCw, Download, Settings, Plus, LucideIcon } from "lucide-react";

// =============================================================================
// DASHBOARD HEADER
// =============================================================================

export type TimeRange = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

export interface DashboardHeaderAction {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
}

export interface DashboardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Page title
   */
  title: string;
  /**
   * Optional subtitle/description
   */
  subtitle?: string;
  /**
   * Show time range selector
   */
  showTimeRange?: boolean;
  /**
   * Current time range value
   */
  timeRange?: TimeRange;
  /**
   * Time range change handler
   */
  onTimeRangeChange?: (range: TimeRange) => void;
  /**
   * Primary action button
   */
  primaryAction?: DashboardHeaderAction;
  /**
   * Secondary actions
   */
  secondaryActions?: DashboardHeaderAction[];
  /**
   * Show refresh button
   */
  showRefresh?: boolean;
  /**
   * Refresh handler
   */
  onRefresh?: () => void;
  /**
   * Refreshing state
   */
  refreshing?: boolean;
  /**
   * Show export button
   */
  showExport?: boolean;
  /**
   * Export handler
   */
  onExport?: () => void;
  /**
   * Custom right content
   */
  rightContent?: React.ReactNode;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
  { value: "all", label: "All time" },
];

/**
 * DashboardHeader - Page header for dashboard views with time range and actions.
 * 
 * @example
 * ```tsx
 * <DashboardHeader
 *   title="Dashboard"
 *   subtitle="Welcome back! Here's your agency overview."
 *   showTimeRange
 *   timeRange={timeRange}
 *   onTimeRangeChange={setTimeRange}
 *   primaryAction={{
 *     label: "New Site",
 *     icon: Plus,
 *     onClick: () => router.push('/sites/new')
 *   }}
 *   onRefresh={refetchData}
 * />
 * ```
 */
const DashboardHeader = React.forwardRef<HTMLDivElement, DashboardHeaderProps>(
  ({
    className,
    title,
    subtitle,
    showTimeRange = false,
    timeRange = "30d",
    onTimeRangeChange,
    primaryAction,
    secondaryActions,
    showRefresh = false,
    onRefresh,
    refreshing = false,
    showExport = false,
    onExport,
    rightContent,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
        {...props}
      >
        {/* Left: Title & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {rightContent}

          {showTimeRange && (
            <Select
              value={timeRange}
              onValueChange={(value) => onTimeRangeChange?.(value as TimeRange)}
            >
              <SelectTrigger className="w-[160px] h-9">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showRefresh && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              className="h-9"
            >
              <RefreshCw className={cn(
                "h-4 w-4 mr-2",
                refreshing && "animate-spin"
              )} />
              Refresh
            </Button>
          )}

          {showExport && onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-9"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {secondaryActions?.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              asChild={!!action.href}
              className="h-9"
            >
              {action.href ? (
                <a href={action.href}>
                  {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                  {action.label}
                </a>
              ) : (
                <>
                  {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                  {action.label}
                </>
              )}
            </Button>
          ))}

          {primaryAction && (
            <Button
              size="sm"
              onClick={primaryAction.onClick}
              asChild={!!primaryAction.href}
              className="h-9"
            >
              {primaryAction.href ? (
                <a href={primaryAction.href}>
                  {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
                  {primaryAction.label}
                </a>
              ) : (
                <>
                  {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
                  {primaryAction.label}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }
);

DashboardHeader.displayName = "DashboardHeader";

export { DashboardHeader };
