"use client";

/**
 * TaxSummaryReport — Tax collected vs paid with net liability, by rate
 *
 * Phase INV-07: Financial Dashboard
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeFilter, getDefaultDateRange } from "./date-range-filter";
import { getTaxSummary, exportReportCSV } from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { TaxSummary, DateRange } from "../types/report-types";

export function TaxSummaryReport() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [data, setData] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const currency = "ZMW";

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    getTaxSummary(siteId, dateRange)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [siteId, dateRange]);

  const handleExport = useCallback(async () => {
    if (!siteId) return;
    const csv = await exportReportCSV("tax", siteId, dateRange);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-summary-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [siteId, dateRange]);

  if (!siteId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tax Summary</h1>
          <p className="text-muted-foreground">
            Tax collected on invoices vs tax paid on expenses
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
            className="no-print"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tax data available for the selected period
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Totals */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Tax Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatInvoiceAmount(data.taxCollected, currency)}
                </p>
                <p className="text-xs text-muted-foreground">From invoices</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Tax Paid</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatInvoiceAmount(data.taxPaid, currency)}
                </p>
                <p className="text-xs text-muted-foreground">On expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Net Tax Owed</p>
                <p
                  className={`text-2xl font-bold ${
                    data.netTaxOwed >= 0 ? "text-yellow-600" : "text-green-600"
                  }`}
                >
                  {formatInvoiceAmount(Math.abs(data.netTaxOwed), currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.netTaxOwed >= 0 ? "Liability" : "Credit"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* By Tax Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Breakdown by Tax Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {data.byRate.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No tax rates applied in this period
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Tax Rate</th>
                        <th className="text-right py-2 px-3">Rate</th>
                        <th className="text-right py-2 px-3">Collected</th>
                        <th className="text-right py-2 px-3">Paid</th>
                        <th className="text-right py-2 px-3 font-bold">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byRate.map((rate) => (
                        <tr
                          key={rate.taxRateId}
                          className="border-b last:border-0 hover:bg-muted/50"
                        >
                          <td className="py-2 px-3 font-medium">
                            {rate.taxRateName}
                          </td>
                          <td className="text-right py-2 px-3">
                            {(rate.rate / 100).toFixed(2)}%
                          </td>
                          <td className="text-right py-2 px-3 text-green-600">
                            {formatInvoiceAmount(rate.collected, currency)}
                          </td>
                          <td className="text-right py-2 px-3 text-red-600">
                            {formatInvoiceAmount(rate.paid, currency)}
                          </td>
                          <td
                            className={`text-right py-2 px-3 font-bold ${
                              rate.net >= 0
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            {formatInvoiceAmount(Math.abs(rate.net), currency)}
                            <span className="text-xs ml-1">
                              {rate.net >= 0 ? "owed" : "credit"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filing Period Breakdown */}
          {data.byFilingPeriod && data.byFilingPeriod.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tax by Filing Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Period</th>
                        <th className="text-right py-2 px-3">Collected</th>
                        <th className="text-right py-2 px-3">Paid</th>
                        <th className="text-right py-2 px-3 font-bold">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byFilingPeriod.map((fp) => (
                        <tr
                          key={fp.period}
                          className="border-b last:border-0 hover:bg-muted/50"
                        >
                          <td className="py-2 px-3 font-medium">{fp.period}</td>
                          <td className="text-right py-2 px-3 text-green-600">
                            {formatInvoiceAmount(fp.collected, currency)}
                          </td>
                          <td className="text-right py-2 px-3 text-red-600">
                            {formatInvoiceAmount(fp.paid, currency)}
                          </td>
                          <td
                            className={`text-right py-2 px-3 font-bold ${
                              fp.net >= 0 ? "text-yellow-600" : "text-green-600"
                            }`}
                          >
                            {formatInvoiceAmount(Math.abs(fp.net), currency)}
                            <span className="text-xs ml-1">
                              {fp.net >= 0 ? "owed" : "credit"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td className="py-2 px-3">Total</td>
                        <td className="text-right py-2 px-3 text-green-600">
                          {formatInvoiceAmount(data.taxCollected, currency)}
                        </td>
                        <td className="text-right py-2 px-3 text-red-600">
                          {formatInvoiceAmount(data.taxPaid, currency)}
                        </td>
                        <td className="text-right py-2 px-3">
                          {formatInvoiceAmount(
                            Math.abs(data.netTaxOwed),
                            currency,
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
