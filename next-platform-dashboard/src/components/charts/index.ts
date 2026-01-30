// =============================================================================
// CHART COMPONENTS BARREL EXPORT
// =============================================================================

/**
 * This module exports all chart components for the DRAMAC CMS dashboard.
 * Built on top of Recharts with custom wrappers for consistent styling.
 * 
 * @module @/components/charts
 * @version 1.0.0
 */

// Container and utilities
export {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  type ChartContainerProps,
} from "./chart-container";

// Area chart
export {
  AreaChartWidget,
  type AreaChartWidgetProps,
  type AreaChartSeries,
} from "./area-chart-widget";

// Line chart
export {
  LineChartWidget,
  type LineChartWidgetProps,
  type LineChartSeries,
} from "./line-chart-widget";

// Bar chart
export {
  BarChartWidget,
  type BarChartWidgetProps,
  type BarChartSeries,
} from "./bar-chart-widget";

// Donut/Pie chart
export {
  DonutChartWidget,
  type DonutChartWidgetProps,
  type DonutChartDataPoint,
} from "./donut-chart-widget";

// Sparklines and mini charts
export {
  Sparkline,
  MiniAreaChart,
  TrendLine,
  type SparklineProps,
  type TrendLineProps,
} from "./sparkline";

// Metric cards
export {
  MetricCard,
  ComparisonCard,
  type MetricCardProps,
  type ComparisonCardProps,
} from "./metric-card";

// =============================================================================
// COMMON CHART COLORS
// =============================================================================

/**
 * Default color palette for charts.
 * Follows a consistent design language across the application.
 */
export const chartColors = {
  primary: "#8884d8",
  secondary: "#82ca9d",
  tertiary: "#ffc658",
  quaternary: "#ff7300",
  accent: "#00C49F",
  muted: "#888888",
  
  // Status colors
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  
  // Gradients (for fills)
  gradients: {
    primary: ["#8884d8", "#8884d800"],
    secondary: ["#82ca9d", "#82ca9d00"],
    success: ["#22c55e", "#22c55e00"],
  },
} as const;

/**
 * Color palette array for multi-series charts.
 */
export const chartColorPalette = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
  "#0088FE",
  "#FFBB28",
  "#FF8042",
  "#a4de6c",
  "#d0ed57",
] as const;

// =============================================================================
// TYPE HELPERS
// =============================================================================

/**
 * Generic data point interface for charts.
 */
export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

/**
 * Time series data point.
 */
export interface TimeSeriesDataPoint {
  date: string | Date;
  value: number;
  [key: string]: string | number | Date;
}

/**
 * Category data point for bar/pie charts.
 */
export interface CategoryDataPoint {
  category: string;
  value: number;
  color?: string;
}
