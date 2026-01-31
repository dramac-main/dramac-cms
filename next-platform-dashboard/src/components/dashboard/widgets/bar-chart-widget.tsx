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
  Legend,
  ResponsiveContainer,
  TooltipProps,
  Cell,
} from "recharts";
import { ChartDataPoint, TimeRange } from "@/types/dashboard-widgets";
import { TimeRangeButtons } from "./time-range-selector";

export interface BarChartWidgetProps {
  title?: string;
  description?: string;
  data: ChartDataPoint[];
  dataKeys: string[];
  xAxisKey?: string;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
  barSize?: number;
  radius?: number;
  gradients?: boolean;
  height?: number;
  className?: string;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  showTimeRangeSelector?: boolean;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
}

// Default color palette
const DEFAULT_COLORS = [
  "hsl(var(--chart-1, 221.2 83.2% 53.3%))",
  "hsl(var(--chart-2, 142.1 76.2% 36.3%))",
  "hsl(var(--chart-3, 47.9 95.8% 53.1%))",
  "hsl(var(--chart-4, 0 84.2% 60.2%))",
  "hsl(var(--chart-5, 262.1 83.3% 57.8%))",
];

// Custom tooltip component
const CustomTooltip = (props: TooltipProps<number, string> & { formatValue?: (value: number) => string }) => {
  const { active, formatValue } = props;
  const payload = (props as unknown as { payload?: Array<{ color?: string; name?: string; value?: number }> }).payload;
  const label = (props as unknown as { label?: string }).label;
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 min-w-[150px]">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: { color?: string; name?: string; value?: number }, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-sm font-medium">
              {formatValue ? formatValue(entry.value as number) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function BarChartWidget({
  title,
  description,
  data,
  dataKeys,
  xAxisKey = "label",
  colors = DEFAULT_COLORS,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  stacked = false,
  horizontal = false,
  barSize = 24,
  radius = 4,
  gradients = true,
  height = 300,
  className,
  timeRange,
  onTimeRangeChange,
  showTimeRangeSelector = false,
  formatYAxis,
  formatTooltip,
}: BarChartWidgetProps) {
  // Generate unique IDs for gradients
  const gradientIds = React.useMemo(
    () => dataKeys.map((_, i) => `bar-gradient-${i}-${Math.random().toString(36).substr(2, 9)}`),
    [dataKeys]
  );

  return (
    <div className={cn("w-full", className)}>
      {(title || showTimeRangeSelector) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-base font-semibold">{title}</h3>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {showTimeRangeSelector && timeRange && onTimeRangeChange && (
            <TimeRangeButtons value={timeRange} onChange={onTimeRangeChange} />
          )}
        </div>
      )}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            {gradients && (
              <defs>
                {dataKeys.map((key, index) => (
                  <linearGradient
                    key={gradientIds[index]}
                    id={gradientIds[index]}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={colors[index % colors.length]}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="95%"
                      stopColor={colors[index % colors.length]}
                      stopOpacity={0.6}
                    />
                  </linearGradient>
                ))}
              </defs>
            )}

            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
                vertical={!horizontal}
                horizontal={horizontal}
              />
            )}

            {horizontal ? (
              <>
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={formatYAxis}
                />
                <YAxis
                  dataKey={xAxisKey}
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  width={80}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={xAxisKey}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  dx={-10}
                  tickFormatter={formatYAxis}
                />
              </>
            )}

            {showTooltip && (
              <Tooltip
                content={<CustomTooltip formatValue={formatTooltip} />}
                cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.5 }}
              />
            )}

            {showLegend && (
              <Legend
                verticalAlign="top"
                align="right"
                iconType="square"
                iconSize={10}
                wrapperStyle={{ paddingBottom: 10 }}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground ml-1">{value}</span>
                )}
              />
            )}

            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId={stacked ? "stack" : undefined}
                fill={gradients ? `url(#${gradientIds[index]})` : colors[index % colors.length]}
                radius={[radius, radius, 0, 0]}
                barSize={barSize}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Single color bar chart (for simple metrics)
export function SimpleBarChart({
  data,
  dataKey,
  xAxisKey = "label",
  color = "hsl(var(--primary))",
  height = 200,
  showValues = false,
  className,
}: {
  data: ChartDataPoint[];
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  height?: number;
  showValues?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: showValues ? 20 : 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis
            dataKey={xAxisKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[4, 4, 0, 0]}
            label={
              showValues
                ? {
                    position: "top",
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }
                : false
            }
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
