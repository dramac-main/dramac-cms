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
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { ChartDataPoint, TimeRange } from "@/types/dashboard-widgets";
import { TimeRangeButtons } from "./time-range-selector";

export interface AreaChartWidgetProps {
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
  curved?: boolean;
  strokeWidth?: number;
  fillOpacity?: number;
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
                className="w-2.5 h-2.5 rounded-full"
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

export function AreaChartWidget({
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
  curved = true,
  strokeWidth = 2,
  fillOpacity = 0.4,
  gradients = true,
  height = 300,
  className,
  timeRange,
  onTimeRangeChange,
  showTimeRangeSelector = false,
  formatYAxis,
  formatTooltip,
}: AreaChartWidgetProps) {
  // Generate unique IDs for gradients
  const gradientIds = React.useMemo(
    () => dataKeys.map((_, i) => `area-gradient-${i}-${Math.random().toString(36).substr(2, 9)}`),
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
          <AreaChart
            data={data}
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
                      stopOpacity={fillOpacity}
                    />
                    <stop
                      offset="95%"
                      stopColor={colors[index % colors.length]}
                      stopOpacity={0.05}
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
                vertical={false}
              />
            )}

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

            {showTooltip && (
              <Tooltip
                content={<CustomTooltip formatValue={formatTooltip} />}
                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              />
            )}

            {showLegend && (
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: 10 }}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground ml-1">{value}</span>
                )}
              />
            )}

            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type={curved ? "monotone" : "linear"}
                dataKey={key}
                stackId={stacked ? "stack" : undefined}
                stroke={colors[index % colors.length]}
                strokeWidth={strokeWidth}
                fill={gradients ? `url(#${gradientIds[index]})` : colors[index % colors.length]}
                fillOpacity={gradients ? 1 : fillOpacity}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Simplified area chart for cards
export function MiniAreaChart({
  data,
  dataKey,
  color = "hsl(var(--primary))",
  height = 60,
  className,
}: {
  data: ChartDataPoint[];
  dataKey: string;
  color?: string;
  height?: number;
  className?: string;
}) {
  const gradientId = React.useMemo(
    () => `mini-area-gradient-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
