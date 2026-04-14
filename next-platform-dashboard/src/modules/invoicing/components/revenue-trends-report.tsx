"use client";

/**
 * RevenueTrendsReport — Full-page revenue trends with detailed chart
 *
 * Phase INV-07: Financial Dashboard
 */

import { useParams } from "next/navigation";
import { useState } from "react";
import { RevenueChart } from "./revenue-chart";
import { DateRangeFilter, getDefaultDateRange } from "./date-range-filter";
import type { DateRange } from "../types/report-types";

export function RevenueTrendsReport() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  if (!siteId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revenue Trends</h1>
          <p className="text-muted-foreground">
            Revenue over time with invoiced, collected, and expense lines
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <RevenueChart siteId={siteId} dateRange={dateRange} currency="ZMW" />
    </div>
  );
}
