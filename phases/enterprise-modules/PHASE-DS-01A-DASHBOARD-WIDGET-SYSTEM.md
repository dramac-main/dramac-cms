# PHASE-DS-01A: Main Dashboard - Widget System

## Overview

- **Objective**: Build a comprehensive widget architecture system for the enterprise dashboard that enables composable, reusable, and configurable dashboard widgets
- **Scope**: Widget types, registry, factory, base components, configuration system
- **Dependencies**: PHASE-UI-05A (Dashboard Page Overhaul) - Already complete
- **Estimated Effort**: 6-8 hours

## Pre-Implementation Checklist

- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified (recharts 3.7.0 installed, Framer Motion for animations)
- [x] No conflicts detected

## Implementation Steps

### Step 1: Create Widget Type Definitions

**File**: `src/types/dashboard-widgets.ts`
**Action**: Create
**Purpose**: Define comprehensive TypeScript types for the widget system

```typescript
// Types for the dashboard widget system

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type WidgetType = 'stat' | 'chart' | 'table' | 'list' | 'progress' | 'custom';
export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'sparkline' | 'heatmap';
export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom';

export interface WidgetPosition {
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
}

export interface WidgetThreshold {
  warning: number;
  danger: number;
  direction?: 'above' | 'below';
}

export interface WidgetDataSource {
  type: 'api' | 'action' | 'static';
  endpoint?: string;
  action?: string;
  params?: Record<string, unknown>;
  cacheKey?: string;
  refreshInterval?: number; // in milliseconds
}

export interface WidgetConfig {
  // Data configuration
  dataSource: WidgetDataSource;
  
  // Chart-specific configuration
  chartType?: ChartType;
  chartConfig?: ChartConfig;
  
  // Time range
  timeRange?: TimeRange;
  customTimeRange?: { start: Date; end: Date };
  
  // Filters
  filters?: Record<string, unknown>;
  
  // Thresholds for alerts
  thresholds?: WidgetThreshold;
  
  // Display options
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  animateOnLoad?: boolean;
  
  // Colors
  colors?: string[];
  gradients?: boolean;
}

export interface ChartConfig {
  xAxisKey?: string;
  yAxisKey?: string;
  dataKeys?: string[];
  stacked?: boolean;
  curved?: boolean;
  fillOpacity?: number;
  strokeWidth?: number;
  showDots?: boolean;
  showValues?: boolean;
}

export interface WidgetMetadata {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  category?: string;
  version?: string;
  author?: string;
}

export interface Widget {
  metadata: WidgetMetadata;
  type: WidgetType;
  size: WidgetSize;
  position: WidgetPosition;
  config: WidgetConfig;
  
  // State
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  lastUpdated?: Date;
  
  // Permissions
  minRole?: 'owner' | 'admin' | 'member';
  requiredModules?: string[];
}

// Stat widget specific types
export interface StatWidgetData {
  value: number | string;
  previousValue?: number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percentage' | 'compact';
}

// Chart widget data types
export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartWidgetData {
  data: ChartDataPoint[];
  totals?: Record<string, number>;
  comparison?: {
    previousPeriod: ChartDataPoint[];
    changePercent: number;
  };
}

// Table widget data types
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'date' | 'currency' | 'badge';
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export interface TableWidgetData {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  totalRows?: number;
  pageSize?: number;
  currentPage?: number;
}

// List widget data types
export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  avatar?: string;
  badge?: { label: string; variant: string };
  timestamp?: string;
  href?: string;
}

export interface ListWidgetData {
  items: ListItem[];
  emptyMessage?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
}

// Progress widget data types
export interface ProgressWidgetData {
  current: number;
  target: number;
  label?: string;
  unit?: string;
  milestones?: { value: number; label: string }[];
}

// Union type for all widget data
export type WidgetData = 
  | StatWidgetData 
  | ChartWidgetData 
  | TableWidgetData 
  | ListWidgetData 
  | ProgressWidgetData;

// Dashboard configuration
export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  layout?: {
    columns: number;
    rowHeight?: number;
    gap?: number;
  };
  filters?: {
    timeRange?: TimeRange;
    customFilters?: Record<string, unknown>;
  };
  permissions?: {
    canEdit?: boolean;
    canShare?: boolean;
    canExport?: boolean;
  };
}

// Widget registry entry
export interface WidgetRegistryEntry {
  type: string;
  component: React.ComponentType<WidgetComponentProps>;
  defaultConfig: Partial<WidgetConfig>;
  validateConfig?: (config: WidgetConfig) => boolean;
  fetchData?: (config: WidgetConfig) => Promise<WidgetData>;
}

// Props for widget components
export interface WidgetComponentProps {
  widget: Widget;
  data?: WidgetData;
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onConfigChange?: (config: Partial<WidgetConfig>) => void;
}
```

### Step 2: Create Widget Registry

**File**: `src/lib/dashboard/widget-registry.ts`
**Action**: Create
**Purpose**: Centralized registry for registering and retrieving widget types

```typescript
import { 
  WidgetRegistryEntry, 
  WidgetConfig, 
  WidgetData,
  WidgetType 
} from "@/types/dashboard-widgets";

class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets: Map<string, WidgetRegistryEntry> = new Map();

  private constructor() {}

  static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  register(type: string, entry: WidgetRegistryEntry): void {
    if (this.widgets.has(type)) {
      console.warn(`Widget type "${type}" is already registered. Overwriting...`);
    }
    this.widgets.set(type, entry);
  }

  unregister(type: string): boolean {
    return this.widgets.delete(type);
  }

  get(type: string): WidgetRegistryEntry | undefined {
    return this.widgets.get(type);
  }

  has(type: string): boolean {
    return this.widgets.has(type);
  }

  getAll(): Map<string, WidgetRegistryEntry> {
    return new Map(this.widgets);
  }

  getAllTypes(): string[] {
    return Array.from(this.widgets.keys());
  }

  getDefaultConfig(type: string): Partial<WidgetConfig> | undefined {
    const entry = this.widgets.get(type);
    return entry?.defaultConfig;
  }

  validateConfig(type: string, config: WidgetConfig): boolean {
    const entry = this.widgets.get(type);
    if (!entry || !entry.validateConfig) {
      return true; // No validation function means config is valid
    }
    return entry.validateConfig(config);
  }

  async fetchData(type: string, config: WidgetConfig): Promise<WidgetData | null> {
    const entry = this.widgets.get(type);
    if (!entry || !entry.fetchData) {
      return null;
    }
    return entry.fetchData(config);
  }
}

export const widgetRegistry = WidgetRegistry.getInstance();

// Built-in widget types
export const WIDGET_TYPES = {
  STAT: 'stat',
  STAT_CARD: 'stat-card',
  CHART_LINE: 'chart-line',
  CHART_BAR: 'chart-bar',
  CHART_AREA: 'chart-area',
  CHART_PIE: 'chart-pie',
  CHART_DONUT: 'chart-donut',
  CHART_SPARKLINE: 'chart-sparkline',
  TABLE: 'table',
  LIST: 'list',
  ACTIVITY_FEED: 'activity-feed',
  PROGRESS: 'progress',
  MINI_CHART: 'mini-chart',
} as const;

export type BuiltInWidgetType = typeof WIDGET_TYPES[keyof typeof WIDGET_TYPES];
```

### Step 3: Create Widget Factory

**File**: `src/lib/dashboard/widget-factory.ts`
**Action**: Create
**Purpose**: Factory for creating and managing widget instances

```typescript
import { Widget, WidgetConfig, WidgetMetadata, WidgetSize, WidgetType, WidgetPosition } from "@/types/dashboard-widgets";
import { widgetRegistry, WIDGET_TYPES } from "./widget-registry";
import { v4 as uuid } from "uuid";

export interface CreateWidgetOptions {
  type: WidgetType | string;
  title: string;
  description?: string;
  size?: WidgetSize;
  position?: Partial<WidgetPosition>;
  config?: Partial<WidgetConfig>;
}

export function createWidget(options: CreateWidgetOptions): Widget {
  const { type, title, description, size = 'md', position = {}, config = {} } = options;
  
  // Get default config from registry if available
  const defaultConfig = widgetRegistry.getDefaultConfig(type) || {};
  
  const widget: Widget = {
    metadata: {
      id: uuid(),
      title,
      description,
      category: type,
      version: '1.0.0',
    },
    type: type as WidgetType,
    size,
    position: {
      row: position.row ?? 0,
      col: position.col ?? 0,
      rowSpan: position.rowSpan,
      colSpan: position.colSpan,
    },
    config: {
      ...defaultConfig,
      ...config,
      dataSource: config.dataSource || defaultConfig.dataSource || {
        type: 'static',
      },
    },
    isLoading: false,
    hasError: false,
    lastUpdated: new Date(),
  };
  
  return widget;
}

export function createStatWidget(
  title: string,
  options: {
    dataSource: WidgetConfig['dataSource'];
    thresholds?: WidgetConfig['thresholds'];
    size?: WidgetSize;
  }
): Widget {
  return createWidget({
    type: WIDGET_TYPES.STAT_CARD,
    title,
    size: options.size || 'sm',
    config: {
      dataSource: options.dataSource,
      thresholds: options.thresholds,
      animateOnLoad: true,
    },
  });
}

export function createChartWidget(
  title: string,
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'donut',
  options: {
    dataSource: WidgetConfig['dataSource'];
    chartConfig?: WidgetConfig['chartConfig'];
    timeRange?: WidgetConfig['timeRange'];
    size?: WidgetSize;
    showLegend?: boolean;
  }
): Widget {
  const typeMap = {
    line: WIDGET_TYPES.CHART_LINE,
    bar: WIDGET_TYPES.CHART_BAR,
    area: WIDGET_TYPES.CHART_AREA,
    pie: WIDGET_TYPES.CHART_PIE,
    donut: WIDGET_TYPES.CHART_DONUT,
  };
  
  return createWidget({
    type: typeMap[chartType],
    title,
    size: options.size || 'md',
    config: {
      dataSource: options.dataSource,
      chartType,
      chartConfig: options.chartConfig,
      timeRange: options.timeRange,
      showLegend: options.showLegend ?? true,
      showTooltip: true,
      showGrid: true,
      animateOnLoad: true,
      gradients: true,
    },
  });
}

export function createTableWidget(
  title: string,
  options: {
    dataSource: WidgetConfig['dataSource'];
    size?: WidgetSize;
  }
): Widget {
  return createWidget({
    type: WIDGET_TYPES.TABLE,
    title,
    size: options.size || 'lg',
    config: {
      dataSource: options.dataSource,
    },
  });
}

export function createListWidget(
  title: string,
  options: {
    dataSource: WidgetConfig['dataSource'];
    size?: WidgetSize;
  }
): Widget {
  return createWidget({
    type: WIDGET_TYPES.LIST,
    title,
    size: options.size || 'md',
    config: {
      dataSource: options.dataSource,
    },
  });
}

// Utility to clone a widget with new ID
export function cloneWidget(widget: Widget): Widget {
  return {
    ...widget,
    metadata: {
      ...widget.metadata,
      id: uuid(),
    },
  };
}

// Utility to update widget config
export function updateWidgetConfig(
  widget: Widget,
  config: Partial<WidgetConfig>
): Widget {
  return {
    ...widget,
    config: {
      ...widget.config,
      ...config,
    },
  };
}

// Utility to get widget size classes
export function getWidgetSizeClasses(size: WidgetSize): {
  colSpan: string;
  minHeight: string;
} {
  const sizeMap: Record<WidgetSize, { colSpan: string; minHeight: string }> = {
    sm: { colSpan: 'col-span-1', minHeight: 'min-h-[120px]' },
    md: { colSpan: 'col-span-1 md:col-span-2', minHeight: 'min-h-[200px]' },
    lg: { colSpan: 'col-span-1 md:col-span-2 lg:col-span-3', minHeight: 'min-h-[300px]' },
    xl: { colSpan: 'col-span-full lg:col-span-4', minHeight: 'min-h-[400px]' },
    full: { colSpan: 'col-span-full', minHeight: 'min-h-[400px]' },
  };
  
  return sizeMap[size] || sizeMap.md;
}
```

### Step 4: Create Base Widget Container Component

**File**: `src/components/dashboard/widgets/widget-container.tsx`
**Action**: Create
**Purpose**: Base container component for all widgets with common functionality

```typescript
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
      type: "spring",
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

  const Container = animated ? motion.div : 'div';
  const containerProps = animated ? { variants: itemVariants } : {};

  return (
    <Container
      {...containerProps}
      className={cn(
        sizeClasses.colSpan,
        sizeClasses.minHeight,
        className
      )}
    >
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
    </Container>
  );
}

// Loading skeleton for different widget types
interface WidgetLoadingSkeletonProps {
  type: string;
}

function WidgetLoadingSkeleton({ type }: WidgetLoadingSkeletonProps) {
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

// Export loading skeleton for external use
export { WidgetLoadingSkeleton };
```

### Step 5: Create Widget Index Barrel File

**File**: `src/components/dashboard/widgets/index.ts`
**Action**: Create
**Purpose**: Export all widget components

```typescript
// Widget system exports
export * from "./widget-container";

// Re-export types
export type {
  Widget,
  WidgetConfig,
  WidgetData,
  WidgetSize,
  WidgetType,
  WidgetPosition,
  WidgetMetadata,
  WidgetThreshold,
  WidgetDataSource,
  ChartConfig,
  ChartType,
  TimeRange,
  StatWidgetData,
  ChartWidgetData,
  ChartDataPoint,
  TableWidgetData,
  TableColumn,
  ListWidgetData,
  ListItem,
  ProgressWidgetData,
  DashboardConfig,
  WidgetComponentProps,
} from "@/types/dashboard-widgets";

// Re-export factory functions
export {
  createWidget,
  createStatWidget,
  createChartWidget,
  createTableWidget,
  createListWidget,
  cloneWidget,
  updateWidgetConfig,
  getWidgetSizeClasses,
} from "@/lib/dashboard/widget-factory";

// Re-export registry
export { widgetRegistry, WIDGET_TYPES } from "@/lib/dashboard/widget-registry";
```

### Step 6: Create Stat Card Widget Component

**File**: `src/components/dashboard/widgets/stat-card-widget.tsx`
**Action**: Create
**Purpose**: Modern stat card widget with trend indicators and animations

```typescript
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowUpRight, 
  ArrowDownRight,
  LucideIcon 
} from "lucide-react";
import { StatWidgetData } from "@/types/dashboard-widgets";

export interface StatCardWidgetProps {
  title: string;
  value: number | string;
  previousValue?: number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percentage' | 'compact';
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  description?: string;
  loading?: boolean;
  animated?: boolean;
  sparkline?: number[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'bordered';
}

const formatValue = (
  value: number | string,
  format?: StatCardWidgetProps['format'],
  prefix?: string,
  suffix?: string
): string => {
  if (typeof value === 'string') return `${prefix || ''}${value}${suffix || ''}`;
  
  let formatted: string;
  
  switch (format) {
    case 'currency':
      formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
      break;
    case 'percentage':
      formatted = `${value.toFixed(1)}%`;
      break;
    case 'compact':
      formatted = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(value);
      break;
    case 'number':
    default:
      formatted = new Intl.NumberFormat('en-US').format(value);
  }
  
  return `${prefix || ''}${formatted}${suffix || ''}`;
};

const TrendIndicator = ({ 
  direction, 
  value, 
  label,
  size = 'md' 
}: { 
  direction: 'up' | 'down' | 'neutral'; 
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };
  
  const colorClasses = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-muted-foreground',
  };
  
  const bgClasses = {
    up: 'bg-emerald-100 dark:bg-emerald-900/30',
    down: 'bg-rose-100 dark:bg-rose-900/30',
    neutral: 'bg-muted',
  };
  
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-0.5 rounded-full",
      bgClasses[direction]
    )}>
      <Icon className={cn(iconSizes[size], colorClasses[direction])} />
      <span className={cn(sizeClasses[size], "font-medium", colorClasses[direction])}>
        {Math.abs(value).toFixed(1)}%
      </span>
      {label && (
        <span className={cn(sizeClasses[size], "text-muted-foreground")}>
          {label}
        </span>
      )}
    </div>
  );
};

// Mini sparkline component
const MiniSparkline = ({ data, className }: { data: number[]; className?: string }) => {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 80;
  const stepX = width / (data.length - 1);
  
  const points = data.map((value, index) => ({
    x: index * stepX,
    y: height - ((value - min) / range) * height,
  }));
  
  const pathD = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  
  // Determine if trending up or down
  const isUp = data[data.length - 1] > data[0];
  const strokeColor = isUp ? '#10b981' : '#f43f5e';
  
  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={cn("overflow-visible", className)}
      style={{ width, height }}
    >
      <defs>
        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <path
        d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#sparklineGradient)"
      />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={strokeColor}
      />
    </svg>
  );
};

export function StatCardWidget({
  title,
  value,
  previousValue,
  trend,
  prefix,
  suffix,
  format = 'number',
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  description,
  loading = false,
  animated = true,
  sparkline,
  className,
  size = 'md',
  variant = 'default',
}: StatCardWidgetProps) {
  const formattedValue = formatValue(value, format, prefix, suffix);
  
  const sizeClasses = {
    sm: {
      value: 'text-xl font-bold',
      title: 'text-xs',
      icon: 'h-4 w-4',
      iconContainer: 'p-1.5',
    },
    md: {
      value: 'text-2xl font-bold',
      title: 'text-sm',
      icon: 'h-5 w-5',
      iconContainer: 'p-2',
    },
    lg: {
      value: 'text-3xl font-bold',
      title: 'text-base',
      icon: 'h-6 w-6',
      iconContainer: 'p-2.5',
    },
  };
  
  const variantClasses = {
    default: '',
    gradient: 'bg-gradient-to-br from-primary/5 to-primary/10',
    bordered: 'border-l-4 border-l-primary',
  };
  
  return (
    <div className={cn("flex flex-col gap-3", variantClasses[variant], className)}>
      {/* Header with title and icon */}
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-muted-foreground font-medium",
          sizeClasses[size].title
        )}>
          {title}
        </span>
        {Icon && (
          <div className={cn("rounded-lg", iconBg, sizeClasses[size].iconContainer)}>
            <Icon className={cn(sizeClasses[size].icon, iconColor)} />
          </div>
        )}
      </div>
      
      {/* Value */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          {animated ? (
            <motion.span
              className={sizeClasses[size].value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {formattedValue}
            </motion.span>
          ) : (
            <span className={sizeClasses[size].value}>{formattedValue}</span>
          )}
          
          {/* Trend indicator */}
          {trend && (
            <TrendIndicator
              direction={trend.direction}
              value={trend.value}
              label={trend.label}
              size={size}
            />
          )}
          
          {/* Description */}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        
        {/* Sparkline */}
        {sparkline && sparkline.length > 0 && (
          <MiniSparkline data={sparkline} />
        )}
      </div>
    </div>
  );
}
```

### Step 7: Update Dashboard Index to Export New Components

**File**: `src/components/dashboard/index.ts`
**Action**: Modify
**Purpose**: Add exports for new widget system components

```typescript
// Add these exports to the existing file
export * from "./widgets";
```

## Verification Steps

1. **TypeScript Check**:
   ```bash
   cd next-platform-dashboard
   npx tsc --noEmit --skipLibCheck
   ```

2. **Build Check**:
   ```bash
   pnpm build
   ```

3. **Manual Testing**:
   - Import StatCardWidget in a page
   - Verify animations work
   - Check trend indicators display correctly
   - Verify sparkline renders

## Rollback Plan

If issues arise:
1. Delete newly created files:
   - `src/types/dashboard-widgets.ts`
   - `src/lib/dashboard/widget-registry.ts`
   - `src/lib/dashboard/widget-factory.ts`
   - `src/components/dashboard/widgets/` folder
2. Remove the export line from `src/components/dashboard/index.ts`

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| src/types/dashboard-widgets.ts | Create | Widget type definitions |
| src/lib/dashboard/widget-registry.ts | Create | Widget registration system |
| src/lib/dashboard/widget-factory.ts | Create | Widget creation helpers |
| src/components/dashboard/widgets/widget-container.tsx | Create | Base widget wrapper |
| src/components/dashboard/widgets/stat-card-widget.tsx | Create | Stat card component |
| src/components/dashboard/widgets/index.ts | Create | Widget exports |
| src/components/dashboard/index.ts | Modify | Add widget exports |

## Next Phase

PHASE-DS-01B will build upon this foundation by adding:
- Interactive chart widgets (line, bar, area, pie)
- Time range selectors
- Chart tooltips and legends
- Real-time data updates
- Dashboard metrics integration
