"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendItem } from "./chart-container";

// =============================================================================
// LINE CHART WIDGET
// =============================================================================

export interface LineChartDataPoint {
  [key: string]: string | number;
}

export interface LineChartSeries {
  dataKey: string;
  name: string;
  color: string;
  strokeDasharray?: string;
  dot?: boolean;
}

export interface LineChartWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  data: LineChartDataPoint[];
  xAxisKey: string;
  series: LineChartSeries[];
  height?: number;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  showDots?: boolean;
  loading?: boolean;
  xAxisFormatter?: (value: string) => string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string) => string;
}

/**
 * LineChartWidget - Line chart for trend visualization.
 */
const LineChartWidget = React.forwardRef<HTMLDivElement, LineChartWidgetProps>(
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
    showDots = false,
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
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
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

            {series.map((s) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.strokeDasharray}
                dot={s.dot !== undefined ? s.dot : showDots}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ChartContainer>

        {showLegend && <ChartLegend items={legendItems} />}
      </div>
    );
  }
);

LineChartWidget.displayName = "LineChartWidget";

export { LineChartWidget };
