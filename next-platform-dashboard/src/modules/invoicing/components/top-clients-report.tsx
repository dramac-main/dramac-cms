"use client";

/**
 * TopClientsReport — Clients ranked by revenue contribution
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
import { getTopClients, exportReportCSV } from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { TopClient, DateRange } from "../types/report-types";

export function TopClientsReport() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [data, setData] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const currency = "ZMW";

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    getTopClients(siteId, 20, dateRange)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [siteId, dateRange]);

  const handleExport = useCallback(async () => {
    if (!siteId) return;
    const csv = await exportReportCSV("top_clients", siteId, dateRange);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `top-clients-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [siteId, dateRange]);

  if (!siteId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Top Clients</h1>
          <p className="text-muted-foreground">
            Clients ranked by revenue contribution
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
        <Skeleton className="h-96" />
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No client data available for the selected period
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Client Revenue Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">Client</th>
                    <th className="text-right py-2 px-3">Total Invoiced</th>
                    <th className="text-right py-2 px-3">Total Paid</th>
                    <th className="text-right py-2 px-3">Outstanding</th>
                    <th className="text-right py-2 px-3">Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((client, i) => (
                    <tr
                      key={client.contactId}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-2 px-3 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {client.clientName}
                      </td>
                      <td className="text-right py-2 px-3">
                        {formatInvoiceAmount(client.totalInvoiced, currency)}
                      </td>
                      <td className="text-right py-2 px-3 text-green-600">
                        {formatInvoiceAmount(client.totalPaid, currency)}
                      </td>
                      <td className="text-right py-2 px-3 text-yellow-600">
                        {formatInvoiceAmount(client.outstanding, currency)}
                      </td>
                      <td className="text-right py-2 px-3">
                        {client.invoiceCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
