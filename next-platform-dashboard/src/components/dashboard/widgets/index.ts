// Widget system exports
export * from "./widget-container";
export * from "./stat-card-widget";

// Interactive chart widgets
export * from "./time-range-selector";
export * from "./line-chart-widget";
export * from "./bar-chart-widget";
export * from "./area-chart-widget";
export * from "./pie-chart-widget";
export * from "./metrics-grid";

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
  TimeRange as WidgetTimeRange,
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
