"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Globe,
  Share2,
  Mail,
  Link2,
  DollarSign,
  HelpCircle,
} from "lucide-react";
import { PieChartWidget } from "@/components/dashboard/widgets";
import type { TrafficSource, TrafficSourceType } from "@/types/site-analytics";
import { formatNumber, formatPercentage } from "./site-analytics-metrics";

const sourceIcons: Record<TrafficSourceType, React.ReactNode> = {
  organic: <Search className="h-4 w-4" />,
  direct: <Globe className="h-4 w-4" />,
  social: <Share2 className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  referral: <Link2 className="h-4 w-4" />,
  paid: <DollarSign className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
};

const sourceColors: Record<TrafficSourceType, string> = {
  organic: "bg-emerald-500",
  direct: "bg-blue-500",
  social: "bg-purple-500",
  email: "bg-orange-500",
  referral: "bg-cyan-500",
  paid: "bg-rose-500",
  other: "bg-gray-500",
};

const sourceBgColors: Record<TrafficSourceType, string> = {
  organic: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  direct: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  social: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  email: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  referral: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  paid: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
  other: "bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-gray-400",
};

interface TrafficSourcesChartProps {
  sources: TrafficSource[];
  loading?: boolean;
  className?: string;
}

export function TrafficSourcesChart({
  sources,
  loading = false,
  className,
}: TrafficSourcesChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px]">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Aggregate by source type
  const aggregated = sources.reduce(
    (acc, source) => {
      if (!acc[source.type]) {
        acc[source.type] = { visitors: 0, pageViews: 0 };
      }
      acc[source.type].visitors += source.visitors;
      acc[source.type].pageViews += source.pageViews;
      return acc;
    },
    {} as Record<TrafficSourceType, { visitors: number; pageViews: number }>
  );

  const chartData = Object.entries(aggregated)
    .map(([type, data]) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: data.visitors,
    }))
    .sort((a, b) => b.value - a.value);

  const totalVisitors = chartData.reduce((sum, d) => sum + d.value, 0);

  const colors = [
    "hsl(142, 76%, 36%)", // emerald (organic)
    "hsl(221, 83%, 53%)", // blue (direct)
    "hsl(262, 83%, 58%)", // purple (social)
    "hsl(25, 95%, 53%)", // orange (email)
    "hsl(187, 85%, 43%)", // cyan (referral)
    "hsl(0, 84%, 60%)", // rose (paid)
    "hsl(220, 9%, 46%)", // gray (other)
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <PieChartWidget
          data={chartData}
          donut
          height={250}
          centerValue={totalVisitors}
          centerLabel="Visitors"
          colors={colors}
          formatValue={(v) => formatNumber(v)}
        />
      </CardContent>
    </Card>
  );
}

interface TrafficSourcesListProps {
  sources: TrafficSource[];
  loading?: boolean;
  className?: string;
  showDetails?: boolean;
}

export function TrafficSourcesList({
  sources,
  loading = false,
  className,
  showDetails = true,
}: TrafficSourcesListProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalVisitors = sources.reduce((sum, s) => sum + s.visitors, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sources.map((source) => {
            const percentage = totalVisitors > 0 ? (source.visitors / totalVisitors) * 100 : 0;
            return (
              <div key={source.source} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded",
                      sourceBgColors[source.type]
                    )}
                  >
                    {sourceIcons[source.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{source.source}</span>
                      <span className="text-sm font-medium">
                        {formatNumber(source.visitors)}
                      </span>
                    </div>
                    {showDetails && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatPercentage(percentage)}</span>
                        <span>•</span>
                        <span>Bounce: {source.bounceRate.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      sourceColors[source.type]
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface TrafficSourcesBadgesProps {
  sources: TrafficSource[];
  className?: string;
}

export function TrafficSourcesBadges({
  sources,
  className,
}: TrafficSourcesBadgesProps) {
  const totalVisitors = sources.reduce((sum, s) => sum + s.visitors, 0);

  // Aggregate by type
  const byType = sources.reduce(
    (acc, source) => {
      acc[source.type] = (acc[source.type] || 0) + source.visitors;
      return acc;
    },
    {} as Record<TrafficSourceType, number>
  );

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {Object.entries(byType)
        .sort(([, a], [, b]) => b - a)
        .map(([type, visitors]) => (
          <Badge
            key={type}
            variant="outline"
            className={cn("gap-1.5", sourceBgColors[type as TrafficSourceType])}
          >
            {sourceIcons[type as TrafficSourceType]}
            <span className="capitalize">{type}</span>
            <span className="opacity-70">
              {totalVisitors > 0 ? ((visitors / totalVisitors) * 100).toFixed(0) : 0}%
            </span>
          </Badge>
        ))}
    </div>
  );
}
