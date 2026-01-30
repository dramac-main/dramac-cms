"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendItem } from "./chart-container";

// =============================================================================
// AREA CHART WIDGET
// =============================================================================

export interface AreaChartDataPoint {
  [key: string]: string | number;
}

export interface AreaChartSeries {
  dataKey: string;
  name: string;
  color: string;
  gradientId?: string;
}

export interface AreaChartWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Chart data
   */
  data: AreaChartDataPoint[];
  /**
   * X-axis data key
   */
  xAxisKey: string;
  /**
   * Series configuration
   */
  series: AreaChartSeries[];
  /**
   * Chart height
   */
  height?: number;
  /**
   * Show grid lines
   */
  showGrid?: boolean;
  /**
   * Show X axis
   */
  showXAxis?: boolean;
  /**
   * Show Y axis
   */
  showYAxis?: boolean;
  /**
   * Show legend
   */
  showLegend?: boolean;
  /**
   * Stacked areas
   */
  stacked?: boolean;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * X-axis tick formatter
   */
  xAxisFormatter?: (value: string) => string;
  /**
   * Y-axis tick formatter
   */
  yAxisFormatter?: (value: number) => string;
  /**
   * Tooltip value formatter
   */
  tooltipFormatter?: (value: number, name: string) => string;
}

/**
 * AreaChartWidget - Area chart with gradient fill and multiple series support.
 * 
 * @example
 * ```tsx
 * <AreaChartWidget
 *   data={[
 *     { date: '2024-01', views: 1000, visitors: 500 },
 *     { date: '2024-02', views: 1500, visitors: 700 },
 *   ]}
 *   xAxisKey="date"
 *   series={[
 *     { dataKey: 'views', name: 'Page Views', color: '#8884d8' },
 *     { dataKey: 'visitors', name: 'Visitors', color: '#82ca9d' },
 *   ]}
 *   height={300}
 *   showGrid
 *   showLegend
 * />
 * ```
 */
const AreaChartWidget = React.forwardRef<HTMLDivElement, AreaChartWidgetProps>(
  ({
    className,
    data,
    xAxisKey,
    series,
    height = 300,
    showGrid = true,
    showXAxis = true,
    showYAxis = true,
    showLegend = false,
    stacked = false,
    loading = false,
    xAxisFormatter,
    yAxisFormatter,
    tooltipFormatter,
    ...props
  }, ref) => {
    const noData = !loading && data.length === 0;

    const legendItems: ChartLegendItem[] = series.map(s => ({
      name: s.name,
      color: s.color,
    }));

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <ChartContainer height={height} loading={loading} noData={noData}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              {series.map((s, index) => {
                const gradientId = s.gradientId || `gradient-${s.dataKey}-${index}`;
                return (
                  <linearGradient
                    key={gradientId}
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>

            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                horizontal
                vertical={false}
              />
            )}

            {showXAxis && (
              <XAxis
                dataKey={xAxisKey}
                tickFormatter={xAxisFormatter}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
            )}

            {showYAxis && (
              <YAxis
                tickFormatter={yAxisFormatter}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={60}
                className="text-muted-foreground"
              />
            )}

            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload?.map(p => ({
                    name: p.name as string,
                    value: p.value as number,
                    color: p.color as string | undefined,
                  }))}
                  label={typeof label === 'number' ? String(label) : label}
                  labelFormatter={xAxisFormatter}
                  valueFormatter={tooltipFormatter}
                />
              )}
            />

            {series.map((s, index) => {
              const gradientId = s.gradientId || `gradient-${s.dataKey}-${index}`;
              return (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  stackId={stacked ? "stack" : undefined}
                />
              );
            })}
          </AreaChart>
        </ChartContainer>

        {showLegend && <ChartLegend items={legendItems} />}
      </div>
    );
  }
);

AreaChartWidget.displayName = "AreaChartWidget";

export { AreaChartWidget };
