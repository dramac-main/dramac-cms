"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { MoreHorizontal, RefreshCw, Maximize2, LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// =============================================================================
// DASHBOARD WIDGET
// =============================================================================

export interface DashboardWidgetAction {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
}

export interface DashboardWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Widget title
   */
  title: string;
  /**
   * Optional description
   */
  description?: string;
  /**
   * Icon to display in header
   */
  icon?: LucideIcon;
  /**
   * Icon background color
   */
  iconBg?: string;
  /**
   * Icon color
   */
  iconColor?: string;
  /**
   * Primary header action
   */
  action?: DashboardWidgetAction;
  /**
   * Dropdown menu actions
   */
  menuActions?: DashboardWidgetAction[];
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Enable refresh button
   */
  onRefresh?: () => void;
  /**
   * Refreshing state
   */
  refreshing?: boolean;
  /**
   * Remove padding from content
   */
  noPadding?: boolean;
  /**
   * Enable expand to full screen
   */
  expandable?: boolean;
  /**
   * Last updated timestamp
   */
  lastUpdated?: Date | string;
  /**
   * Animation variant
   */
  animated?: boolean;
}

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

/**
 * DashboardWidget - A standardized widget container for dashboard content.
 * 
 * Features:
 * - Optional icon with customizable colors
 * - Header actions (button or dropdown menu)
 * - Refresh functionality
 * - Loading skeleton state
 * - Expandable to fullscreen
 * - Last updated indicator
 * - Framer Motion animations
 * 
 * @example
 * ```tsx
 * <DashboardWidget
 *   title="Recent Sites"
 *   description="Your recently updated websites"
 *   icon={Globe}
 *   iconBg="bg-blue-100"
 *   iconColor="text-blue-600"
 *   action={{ label: "View All", href: "/sites" }}
 *   onRefresh={refetchSites}
 * >
 *   <SitesList sites={sites} />
 * </DashboardWidget>
 * ```
 */
const DashboardWidget = React.forwardRef<HTMLDivElement, DashboardWidgetProps>(
  ({
    className,
    title,
    description,
    icon: Icon,
    iconBg = "bg-muted",
    iconColor = "text-muted-foreground",
    action,
    menuActions,
    loading = false,
    onRefresh,
    refreshing = false,
    noPadding = false,
    expandable = false,
    lastUpdated,
    animated = true,
    children,
    ...props
  }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    
    const formatLastUpdated = (date: Date | string) => {
      const d = typeof date === "string" ? new Date(date) : date;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return d.toLocaleDateString();
    };

    const Wrapper = animated ? motion.div : "div";
    const wrapperProps = animated ? { variants: itemVariants } : {};

    const cardContent = (
      <Card 
        className={cn(
          "relative overflow-hidden transition-shadow duration-200",
          "hover:shadow-md hover:border-border/80",
          isExpanded && "fixed inset-4 z-50 !h-auto",
          className
        )} 
        {...props}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className={cn(
                "p-2 rounded-lg shrink-0",
                iconBg
              )}>
                <Icon className={cn("h-4 w-4", iconColor)} />
              </div>
            )}
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              {description && (
                <CardDescription className="text-xs">{description}</CardDescription>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground mr-2">
                {formatLastUpdated(lastUpdated)}
              </span>
            )}
            
            {onRefresh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={onRefresh}
                      disabled={refreshing}
                    >
                      <RefreshCw className={cn(
                        "h-4 w-4",
                        refreshing && "animate-spin"
                      )} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {expandable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isExpanded ? "Collapse" : "Expand"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {action && !menuActions && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={action.onClick}
                asChild={!!action.href}
              >
                {action.href ? (
                  <a href={action.href}>
                    {action.icon && <action.icon className="h-3 w-3 mr-1" />}
                    {action.label}
                  </a>
                ) : (
                  <>
                    {action.icon && <action.icon className="h-3 w-3 mr-1" />}
                    {action.label}
                  </>
                )}
              </Button>
            )}

            {menuActions && menuActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {menuActions.map((menuAction, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={menuAction.onClick}
                      asChild={!!menuAction.href}
                    >
                      {menuAction.href ? (
                        <a href={menuAction.href} className="flex items-center">
                          {menuAction.icon && <menuAction.icon className="h-4 w-4 mr-2" />}
                          {menuAction.label}
                        </a>
                      ) : (
                        <>
                          {menuAction.icon && <menuAction.icon className="h-4 w-4 mr-2" />}
                          {menuAction.label}
                        </>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent className={cn(noPadding && "p-0 pt-0")}>
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    );

    return (
      <Wrapper ref={ref as React.Ref<HTMLDivElement>} {...wrapperProps}>
        {cardContent}
      </Wrapper>
    );
  }
);

DashboardWidget.displayName = "DashboardWidget";

export { DashboardWidget };
