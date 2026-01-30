"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendItem } from "./chart-container";

// =============================================================================
// BAR CHART WIDGET
// =============================================================================

export interface BarChartDataPoint {
  [key: string]: string | number;
}

export interface BarChartSeries {
  dataKey: string;
  name: string;
  color: string;
  radius?: number;
}

export interface BarChartWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  data: BarChartDataPoint[];
  xAxisKey: string;
  series: BarChartSeries[];
  height?: number;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
  loading?: boolean;
  barSize?: number;
  xAxisFormatter?: (value: string) => string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string) => string;
  /**
   * Use different colors for each bar (single series)
   */
  colorByValue?: boolean;
  /**
   * Colors for colorByValue mode
   */
  colors?: string[];
}

const defaultColors = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe",
  "#00c49f", "#ffbb28", "#ff8042", "#a4de6c", "#d0ed57",
];

/**
 * BarChartWidget - Bar chart for comparisons.
 */
const BarChartWidget = React.forwardRef<HTMLDivElement, BarChartWidgetProps>(
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
    horizontal = false,
    loading = false,
    barSize,
    xAxisFormatter,
    yAxisFormatter,
    tooltipFormatter,
    colorByValue = false,
    colors = defaultColors,
    ...props
  }, ref) => {
    const noData = !loading && data.length === 0;

    const legendItems: ChartLegendItem[] = colorByValue
      ? data.map((item, index) => ({
          name: String(item[xAxisKey]),
          color: colors[index % colors.length],
        }))
      : series.map(s => ({
          name: s.name,
          color: s.color,
        }));

    const ChartComponent = horizontal ? BarChart : BarChart;

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <ChartContainer height={height} loading={loading} noData={noData}>
          <ChartComponent
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                horizontal={!horizontal}
                vertical={horizontal}
              />
            )}

            {horizontal ? (
              <>
                {showYAxis && (
                  <YAxis
                    type="category"
                    dataKey={xAxisKey}
                    tickFormatter={xAxisFormatter}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    className="text-muted-foreground"
                  />
                )}
                {showXAxis && (
                  <XAxis
                    type="number"
                    tickFormatter={yAxisFormatter}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                )}
              </>
            ) : (
              <>
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
              </>
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

            {series.map((s, seriesIndex) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color}
                radius={s.radius ?? 4}
                barSize={barSize}
                stackId={stacked ? "stack" : undefined}
              >
                {colorByValue && data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            ))}
          </ChartComponent>
        </ChartContainer>

        {showLegend && <ChartLegend items={legendItems} />}
      </div>
    );
  }
);

BarChartWidget.displayName = "BarChartWidget";

export { BarChartWidget };
