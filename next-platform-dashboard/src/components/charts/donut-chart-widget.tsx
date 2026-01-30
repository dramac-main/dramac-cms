"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendItem } from "./chart-container";

// =============================================================================
// DONUT CHART WIDGET
// =============================================================================

export interface DonutChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface DonutChartWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  data: DonutChartDataPoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  loading?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
  valueFormatter?: (value: number) => string;
}

/**
 * DonutChartWidget - Donut/pie chart for distribution visualization.
 */
const DonutChartWidget = React.forwardRef<HTMLDivElement, DonutChartWidgetProps>(
  ({
    className,
    data,
    height = 300,
    innerRadius = 60,
    outerRadius = 100,
    showLegend = true,
    showLabels = false,
    loading = false,
    centerLabel,
    centerValue,
    valueFormatter = (v) => v.toLocaleString(),
    ...props
  }, ref) => {
    const noData = !loading && data.length === 0;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    const legendItems: ChartLegendItem[] = data.map(item => ({
      name: item.name,
      color: item.color,
      value: `${Math.round((item.value / total) * 100)}%`,
    }));

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <ChartContainer height={height} loading={loading} noData={noData}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              label={showLabels ? ({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : undefined}
              labelLine={showLabels}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const item = payload[0];
                const percentage = total > 0 
                  ? ((item.value as number) / total * 100).toFixed(1) 
                  : 0;
                return (
                  <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[120px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: item.payload.color }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {valueFormatter(item.value as number)} ({percentage}%)
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ChartContainer>

        {/* Center Label */}
        {(centerLabel || centerValue) && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ top: -height / 2 + 20 }}
          >
            {centerValue && (
              <span className="text-2xl font-bold">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-xs text-muted-foreground">{centerLabel}</span>
            )}
          </div>
        )}

        {showLegend && (
          <ChartLegend items={legendItems} direction="horizontal" className="justify-center" />
        )}
      </div>
    );
  }
);

DonutChartWidget.displayName = "DonutChartWidget";

export { DonutChartWidget };
