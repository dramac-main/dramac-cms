"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { PageAnalytics } from "@/types/site-analytics";
import { formatDuration, formatNumber } from "./site-analytics-metrics";

interface TopPagesTableProps {
  pages: PageAnalytics[];
  loading?: boolean;
  showExternalLinks?: boolean;
  siteUrl?: string;
  className?: string;
  maxRows?: number;
  title?: string;
}

export function TopPagesTable({
  pages,
  loading = false,
  showExternalLinks = false,
  siteUrl,
  className,
  maxRows = 10,
  title = "Top Pages",
}: TopPagesTableProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayPages = pages.slice(0, maxRows);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Unique</TableHead>
              <TableHead className="text-right">Avg. Time</TableHead>
              <TableHead className="text-right">Bounce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayPages.map((page, index) => (
              <TableRow key={page.path}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {index + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px]">
                        {page.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {page.path}
                      </span>
                    </div>
                    {showExternalLinks && siteUrl && (
                      <a
                        href={`${siteUrl}${page.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(page.views)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatNumber(page.uniqueViews)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatDuration(page.avgTimeOnPage)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-normal",
                      page.bounceRate < 40
                        ? "border-emerald-500/50 text-emerald-600"
                        : page.bounceRate > 60
                          ? "border-rose-500/50 text-rose-600"
                          : "border-muted"
                    )}
                  >
                    {page.bounceRate.toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pages.length > maxRows && (
          <div className="mt-4 text-center">
            <button className="text-sm text-muted-foreground hover:text-primary">
              View all {pages.length} pages
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TopPagesCompactProps {
  pages: PageAnalytics[];
  loading?: boolean;
  className?: string;
  maxRows?: number;
}

export function TopPagesCompact({
  pages,
  loading = false,
  className,
  maxRows = 5,
}: TopPagesCompactProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Pages</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {Array.from({ length: maxRows }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxViews = Math.max(...pages.map((p) => p.views), 1);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Top Pages</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {pages.slice(0, maxRows).map((page) => (
            <div key={page.path} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[200px] font-medium">
                  {page.path === "/" ? "Homepage" : page.title}
                </span>
                <span className="text-muted-foreground ml-2">
                  {formatNumber(page.views)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary/60 transition-all duration-500"
                  style={{ width: `${(page.views / maxViews) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
