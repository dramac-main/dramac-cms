"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  Sector,
} from "recharts";
import { ChartDataPoint } from "@/types/dashboard-widgets";

export interface PieChartWidgetProps {
  title?: string;
  description?: string;
  data: ChartDataPoint[];
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  donut?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  height?: number;
  className?: string;
  formatValue?: (value: number) => string;
  centerLabel?: string;
  centerValue?: string | number;
  activeIndex?: number;
  onActiveChange?: (index: number | undefined) => void;
}

// Default color palette
const DEFAULT_COLORS = [
  "hsl(var(--chart-1, 221.2 83.2% 53.3%))",
  "hsl(var(--chart-2, 142.1 76.2% 36.3%))",
  "hsl(var(--chart-3, 47.9 95.8% 53.1%))",
  "hsl(var(--chart-4, 0 84.2% 60.2%))",
  "hsl(var(--chart-5, 262.1 83.3% 57.8%))",
  "hsl(var(--chart-6, 280 65% 60%))",
];

// Custom tooltip component
const CustomTooltip = (props: TooltipProps<number, string> & { formatValue?: (value: number) => string }) => {
  const { active, formatValue } = props;
  const payload = (props as unknown as { payload?: Array<{ payload?: { fill?: string }; name?: string; value?: number }> }).payload;
  if (!active || !payload || !payload.length) return null;

  const entry = payload[0];
  return (
    <div className="bg-popover/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 min-w-[120px]">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: entry.payload?.fill }}
        />
        <span className="text-sm font-medium">{entry.name}</span>
      </div>
      <p className="text-lg font-bold mt-1">
        {formatValue ? formatValue(entry.value as number) : entry.value}
      </p>
    </div>
  );
};

// Custom active shape for hover effect
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="drop-shadow-lg"
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

// Custom label renderer
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label for small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function PieChartWidget({
  title,
  description,
  data,
  dataKey = "value",
  nameKey = "label",
  colors = DEFAULT_COLORS,
  showLegend = true,
  showTooltip = true,
  showLabels = false,
  donut = false,
  innerRadius = 0,
  outerRadius = 80,
  paddingAngle = 2,
  height = 300,
  className,
  formatValue,
  centerLabel,
  centerValue,
  activeIndex: controlledActiveIndex,
  onActiveChange,
}: PieChartWidgetProps) {
  const [internalActiveIndex, setInternalActiveIndex] = React.useState<number | undefined>();
  
  const activeIndex = controlledActiveIndex ?? internalActiveIndex;
  const setActiveIndex = onActiveChange ?? setInternalActiveIndex;

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  // Calculate inner radius for donut
  const calculatedInnerRadius = donut ? outerRadius * 0.6 : innerRadius;

  // Calculate total for center label
  const total = data.reduce((sum, item) => sum + (item[dataKey] as number), 0);

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <div className="mb-4">
          <h3 className="text-base font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div style={{ height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {showTooltip && (
              <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
            )}

            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={calculatedInnerRadius}
              outerRadius={outerRadius}
              paddingAngle={paddingAngle}
              dataKey={dataKey}
              nameKey={nameKey}
              activeShape={activeIndex !== undefined ? renderActiveShape : undefined}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              label={showLabels ? renderCustomLabel : false}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  className="transition-all duration-200"
                />
              ))}
            </Pie>

            {showLegend && (
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                formatter={(value: string, entry: any) => (
                  <span className="text-xs text-muted-foreground ml-1">
                    {value}
                  </span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        {/* Center label for donut chart */}
        {donut && (centerLabel || centerValue) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              {centerValue && (
                <p className="text-2xl font-bold">
                  {formatValue ? formatValue(Number(centerValue)) : centerValue}
                </p>
              )}
              {centerLabel && (
                <p className="text-xs text-muted-foreground">{centerLabel}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple donut chart with center value
export function DonutChart({
  data,
  dataKey = "value",
  nameKey = "label",
  colors = DEFAULT_COLORS,
  size = 150,
  strokeWidth = 20,
  centerValue,
  centerLabel,
  className,
  formatValue,
}: {
  data: ChartDataPoint[];
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string | number;
  centerLabel?: string;
  className?: string;
  formatValue?: (value: number) => string;
}) {
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius - strokeWidth;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey={dataKey}
            nameKey={nameKey}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          {centerValue !== undefined && (
            <p className="text-xl font-bold">
              {formatValue ? formatValue(Number(centerValue)) : centerValue}
            </p>
          )}
          {centerLabel && (
            <p className="text-xs text-muted-foreground">{centerLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}
