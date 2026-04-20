"use client";

/**
 * RevenueTrendsReport — Full-page revenue trends with detailed chart
 *
 * Phase INV-07 + INVFIX-08: Financial Dashboard + Reports Overhaul
 * Added: Revenue by source breakdown, CSV export, print button.
 */

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Download, Printer, TrendingUp, TrendingDown, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "./revenue-chart";
import { DateRangeFilter, getDefaultDateRange } from "./date-range-filter";
import {
  getCrossModuleRevenue,
  exportCrossModuleCSV,
  getRevenueTrendsComparison,
} from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type {
  CrossModuleRevenue,
  RevenueTrendsComparison,
  DateRange,
} from "../types/report-types";

export function RevenueTrendsReport() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [sourceData, setSourceData] = useState<CrossModuleRevenue | null>(null);
  const [sourceLoading, setSourceLoading] = useState(true);
  const [comparison, setComparison] =
    useState<RevenueTrendsComparison | null>(null);
  const [compLoading, setCompLoading] = useState(true);
  const currency = "ZMW";

  useEffect(() => {
    if (!siteId) return;
    setSourceLoading(true);
    getCrossModuleRevenue(siteId, dateRange)
      .then(setSourceData)
      .catch(() => setSourceData(null))
      .finally(() => setSourceLoading(false));

    setCompLoading(true);
    getRevenueTrendsComparison(siteId, dateRange)
      .then(setComparison)
      .catch(() => setComparison(null))
      .finally(() => setCompLoading(false));
  }, [siteId, dateRange]);

  const handleExport = useCallback(async () => {
    if (!siteId) return;
    const csv = await exportCrossModuleCSV("revenue", siteId, dateRange);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-trends-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [siteId, dateRange]);

  if (!siteId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Revenue Trends</h1>
          <p className="text-muted-foreground">
            Revenue over time with invoiced, collected, and expense lines
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {/* Invoicing Revenue Chart */}
      <RevenueChart siteId={siteId} dateRange={dateRange} currency="ZMW" />

      {/* Revenue by Source (INVFIX-08) */}
      {sourceLoading ? (
        <Skeleton className="h-24" />
      ) : sourceData && sourceData.bySource.some((s) => s.amount > 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {sourceData.bySource.map((source) => (
                <div
                  key={source.source}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: source.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{source.label}</p>
                    <p className="text-lg font-bold">
                      {formatInvoiceAmount(source.amount, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {source.count} transaction{source.count !== 1 ? "s" : ""}
                      {sourceData.totalRevenue > 0 && (
                        <>
                          {" "}
                          &middot;{" "}
                          {(
                            (source.amount / sourceData.totalRevenue) *
                            100
                          ).toFixed(0)}
                          %
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Period-over-Period Comparison */}
      {compLoading ? (
        <Skeleton className="h-24" />
      ) : comparison ? (
        <Card>
          <CardHeader>
            <CardTitle>Period Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-3 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  Current Period
                </p>
                <p className="text-lg font-bold">
                  {formatInvoiceAmount(comparison.currentTotal, currency)}
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  Previous Period
                </p>
                <p className="text-lg font-bold">
                  {formatInvoiceAmount(comparison.previousTotal, currency)}
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-sm text-muted-foreground">Growth</p>
                <div className="flex items-center gap-1">
                  {comparison.growthPercent >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-lg font-bold ${
                      comparison.growthPercent >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {comparison.growthPercent > 0 ? "+" : ""}
                    {comparison.growthPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Client Segments */}
      {comparison &&
        (comparison.clientSegments.top10Count > 0 ||
          comparison.clientSegments.otherCount > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Client Revenue Segments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    Top {comparison.clientSegments.top10Count} Clients
                  </p>
                  <p className="text-lg font-bold">
                    {formatInvoiceAmount(
                      comparison.clientSegments.top10Revenue,
                      currency,
                    )}
                  </p>
                  {comparison.currentTotal > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {(
                        (comparison.clientSegments.top10Revenue /
                          comparison.currentTotal) *
                        100
                      ).toFixed(0)}
                      % of total revenue
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    Other Clients ({comparison.clientSegments.otherCount})
                  </p>
                  <p className="text-lg font-bold">
                    {formatInvoiceAmount(
                      comparison.clientSegments.otherRevenue,
                      currency,
                    )}
                  </p>
                  {comparison.currentTotal > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {(
                        (comparison.clientSegments.otherRevenue /
                          comparison.currentTotal) *
                        100
                      ).toFixed(0)}
                      % of total revenue
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
