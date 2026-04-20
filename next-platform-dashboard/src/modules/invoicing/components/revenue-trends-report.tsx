"use client";

/**
 * RevenueTrendsReport — Full-page revenue trends with detailed chart
 *
 * Phase INV-07 + INVFIX-08: Financial Dashboard + Reports Overhaul
 * Added: Revenue by source breakdown, CSV export, print button.
 */

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Download, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "./revenue-chart";
import { DateRangeFilter, getDefaultDateRange } from "./date-range-filter";
import {
  getCrossModuleRevenue,
  exportCrossModuleCSV,
} from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { CrossModuleRevenue, DateRange } from "../types/report-types";

export function RevenueTrendsReport() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [sourceData, setSourceData] = useState<CrossModuleRevenue | null>(null);
  const [sourceLoading, setSourceLoading] = useState(true);
  const currency = "ZMW";

  useEffect(() => {
    if (!siteId) return;
    setSourceLoading(true);
    getCrossModuleRevenue(siteId, dateRange)
      .then(setSourceData)
      .catch(() => setSourceData(null))
      .finally(() => setSourceLoading(false));
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
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
                        <> &middot; {((source.amount / sourceData.totalRevenue) * 100).toFixed(0)}%</>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
