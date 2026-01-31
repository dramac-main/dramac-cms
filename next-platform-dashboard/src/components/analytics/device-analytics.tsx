"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Tv,
  Watch,
  Globe,
  Chrome,
} from "lucide-react";
import { PieChartWidget, BarChartWidget } from "@/components/dashboard/widgets";
import type { DeviceAnalytics, BrowserAnalytics } from "@/types/site-analytics";
import { formatNumber, formatPercentage } from "./site-analytics-metrics";

const deviceIcons: Record<string, React.ReactNode> = {
  desktop: <Monitor className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  tablet: <Tablet className="h-4 w-4" />,
  laptop: <Laptop className="h-4 w-4" />,
  tv: <Tv className="h-4 w-4" />,
  watch: <Watch className="h-4 w-4" />,
  other: <Globe className="h-4 w-4" />,
};

const deviceColors: Record<string, string> = {
  desktop: "bg-blue-500",
  mobile: "bg-emerald-500",
  tablet: "bg-purple-500",
  laptop: "bg-orange-500",
  tv: "bg-rose-500",
  watch: "bg-cyan-500",
  other: "bg-gray-500",
};

const deviceBgColors: Record<string, string> = {
  desktop: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  mobile: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  tablet: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  laptop: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  tv: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
  watch: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  other: "bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-gray-400",
};

interface DeviceBreakdownProps {
  devices: DeviceAnalytics[];
  loading?: boolean;
  className?: string;
}

export function DeviceBreakdown({
  devices,
  loading = false,
  className,
}: DeviceBreakdownProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Device Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalVisitors = devices.reduce((sum, d) => sum + d.visitors, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Device Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {devices.map((device) => (
            <div key={device.device} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded",
                      deviceBgColors[device.device.toLowerCase()] || deviceBgColors.other
                    )}
                  >
                    {deviceIcons[device.device.toLowerCase()] || deviceIcons.other}
                  </div>
                  <span className="font-medium capitalize">{device.device}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatPercentage(device.percentage)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    deviceColors[device.device.toLowerCase()] || deviceColors.other
                  )}
                  style={{ width: `${device.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatNumber(device.visitors)} visitors</span>
                <span>Avg. {Math.round(device.avgSessionDuration)}s session</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface DeviceChartProps {
  devices: DeviceAnalytics[];
  loading?: boolean;
  className?: string;
}

export function DeviceChart({
  devices,
  loading = false,
  className,
}: DeviceChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Device Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <Skeleton className="h-[180px] w-[180px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = devices.map((device) => ({
    label: device.device.charAt(0).toUpperCase() + device.device.slice(1),
    value: device.visitors,
  }));

  const totalVisitors = devices.reduce((sum, d) => sum + d.visitors, 0);

  const colors = [
    "hsl(221, 83%, 53%)", // blue (desktop)
    "hsl(142, 76%, 36%)", // emerald (mobile)
    "hsl(262, 83%, 58%)", // purple (tablet)
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Device Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <PieChartWidget
          data={chartData}
          donut
          height={200}
          centerValue={totalVisitors}
          centerLabel="Total"
          colors={colors}
          formatValue={(v) => formatNumber(v)}
        />
      </CardContent>
    </Card>
  );
}

interface BrowserBreakdownProps {
  browsers: BrowserAnalytics[];
  loading?: boolean;
  className?: string;
  limit?: number;
}

export function BrowserBreakdown({
  browsers,
  loading = false,
  className,
  limit = 5,
}: BrowserBreakdownProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Browser Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedBrowsers = [...browsers]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, limit);

  const browserColors: Record<string, string> = {
    chrome: "text-yellow-600 dark:text-yellow-400",
    firefox: "text-orange-600 dark:text-orange-400",
    safari: "text-blue-600 dark:text-blue-400",
    edge: "text-cyan-600 dark:text-cyan-400",
    opera: "text-red-600 dark:text-red-400",
    samsung: "text-indigo-600 dark:text-indigo-400",
    other: "text-gray-600 dark:text-gray-400",
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Browser Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedBrowsers.map((browser, index) => (
            <div key={browser.browser} className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center">
                <Chrome
                  className={cn(
                    "h-4 w-4",
                    browserColors[browser.browser.toLowerCase()] || browserColors.other
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{browser.browser}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatPercentage(browser.percentage)}
                  </span>
                </div>
                <Progress value={browser.percentage} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface BrowserChartProps {
  browsers: BrowserAnalytics[];
  loading?: boolean;
  className?: string;
}

export function BrowserChart({
  browsers,
  loading = false,
  className,
}: BrowserChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Browser Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = browsers
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 5)
    .map((browser) => ({
      label: browser.browser,
      value: browser.visitors,
      visitors: browser.visitors,
    }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Browser Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChartWidget
          data={chartData}
          dataKeys={["visitors"]}
          height={200}
          horizontal
          formatTooltip={(v: number) => formatNumber(v)}
        />
      </CardContent>
    </Card>
  );
}

interface DeviceCompactProps {
  devices: DeviceAnalytics[];
  className?: string;
}

export function DeviceCompact({ devices, className }: DeviceCompactProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {devices.slice(0, 3).map((device) => (
        <div key={device.device} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded",
              deviceBgColors[device.device.toLowerCase()] || deviceBgColors.other
            )}
          >
            {deviceIcons[device.device.toLowerCase()] || deviceIcons.other}
          </div>
          <div>
            <span className="text-sm font-medium capitalize">{device.device}</span>
            <span className="text-xs text-muted-foreground ml-1">
              {formatPercentage(device.percentage)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
