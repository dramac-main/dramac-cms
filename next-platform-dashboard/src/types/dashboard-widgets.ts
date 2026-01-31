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
