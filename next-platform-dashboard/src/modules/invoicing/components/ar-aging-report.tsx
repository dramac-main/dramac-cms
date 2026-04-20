"use client";

/**
 * ARAgingReport — Accounts Receivable Aging table
 *
 * Phase INV-07 + INVFIX-08: Financial Dashboard
 * Summary buckets + per-client breakdown, color-coded by severity.
 * Includes AI collection probability scoring (loaded on-demand).
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Download, Printer, ShieldAlert, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  getARAgingReport,
  getARAgingInvoices,
  exportReportCSV,
} from "../actions/report-actions";
import { getClientRiskScore } from "../actions/ai-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type {
  ARAgingReport as ARAgingReportType,
  ARAgingClientRow,
  ARAgingInvoice,
} from "../types/report-types";

const BUCKET_COLORS: Record<string, string> = {
  current: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "1-30":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "31-60":
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "61-90": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "90+": "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
};

export function ArAgingReport() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [data, setData] = useState<ARAgingReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [bucketInvoices, setBucketInvoices] = useState<ARAgingInvoice[]>([]);
  const [bucketLoading, setBucketLoading] = useState(false);
  const [riskScores, setRiskScores] = useState<
    Map<string, { probability: number; rating: "low" | "medium" | "high" }>
  >(new Map());
  const [riskLoading, setRiskLoading] = useState(false);
  const currency = "ZMW";

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    getARAgingReport(siteId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [siteId]);

  /** Load risk scores for top clients by outstanding amount (max 10) */
  const loadRiskScores = useCallback(async () => {
    if (!siteId || !data || data.byClient.length === 0) return;
    setRiskLoading(true);
    const topClients = [...data.byClient]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    const newScores = new Map(riskScores);
    for (const client of topClients) {
      if (newScores.has(client.contactId)) continue;
      try {
        const result = await getClientRiskScore(siteId, client.contactId);
        if (result.data) {
          // Collection probability is inverse of risk score
          const probability = Math.max(0, 100 - (result.data.score ?? 50));
          newScores.set(client.contactId, {
            probability,
            rating: result.data.riskRating as "low" | "medium" | "high",
          });
        }
      } catch {
        // Skip failed scores silently
      }
    }
    setRiskScores(newScores);
    setRiskLoading(false);
  }, [siteId, data, riskScores]);

  const handleBucketClick = useCallback(
    async (bucketKey: string) => {
      if (!siteId) return;
      if (selectedBucket === bucketKey) {
        setSelectedBucket(null);
        setBucketInvoices([]);
        return;
      }
      setSelectedBucket(bucketKey);
      setBucketLoading(true);
      try {
        const invoices = await getARAgingInvoices(
          siteId,
          bucketKey as "current" | "1-30" | "31-60" | "61-90" | "90+",
        );
        setBucketInvoices(invoices);
      } catch {
        setBucketInvoices([]);
      } finally {
        setBucketLoading(false);
      }
    },
    [siteId, selectedBucket],
  );

  const handleExport = useCallback(async () => {
    if (!siteId) return;
    const csv = await exportReportCSV("aging", siteId);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ar-aging-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [siteId]);

  if (!siteId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts Receivable Aging</h1>
          <p className="text-muted-foreground">
            Outstanding invoices grouped by days overdue
          </p>
        </div>
        <div className="flex items-center gap-3">
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
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No outstanding invoices found
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Buckets */}
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { label: "Current", value: data.summary.current, key: "current" },
              {
                label: "1-30 Days",
                value: data.summary.days1to30,
                key: "1-30",
              },
              {
                label: "31-60 Days",
                value: data.summary.days31to60,
                key: "31-60",
              },
              {
                label: "61-90 Days",
                value: data.summary.days61to90,
                key: "61-90",
              },
              { label: "90+ Days", value: data.summary.days90plus, key: "90+" },
            ].map((bucket) => (
              <Card
                key={bucket.key}
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  selectedBucket === bucket.key ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleBucketClick(bucket.key)}
              >
                <CardContent className="pt-6">
                  <div
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${BUCKET_COLORS[bucket.key]}`}
                  >
                    {bucket.label}
                  </div>
                  <p className="text-xl font-bold">
                    {formatInvoiceAmount(bucket.value, currency)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bucket Drilldown */}
          {selectedBucket && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Invoices —{" "}
                  {selectedBucket === "current"
                    ? "Current"
                    : `${selectedBucket} Days`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bucketLoading ? (
                  <Skeleton className="h-24" />
                ) : bucketInvoices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No invoices in this bucket
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Invoice #</th>
                          <th className="text-left py-2 px-3">Client</th>
                          <th className="text-right py-2 px-3">Amount Due</th>
                          <th className="text-right py-2 px-3">Due Date</th>
                          <th className="text-right py-2 px-3">Days Overdue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bucketInvoices.map((inv) => (
                          <tr
                            key={inv.id}
                            className="border-b last:border-0 hover:bg-muted/50"
                          >
                            <td className="py-2 px-3 font-medium">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-2 px-3">{inv.clientName}</td>
                            <td className="text-right py-2 px-3">
                              {formatInvoiceAmount(inv.amountDue, currency)}
                            </td>
                            <td className="text-right py-2 px-3">
                              {inv.dueDate
                                ? new Date(inv.dueDate).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="text-right py-2 px-3">
                              {inv.daysOverdue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Total + DSO */}
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">Total Outstanding</p>
                {(data.weightedDSO ?? 0) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Weighted DSO: {data.weightedDSO?.toFixed(1)} days
                  </p>
                )}
              </div>
              <p className="text-2xl font-bold">
                {formatInvoiceAmount(data.summary.total, currency)}
              </p>
            </CardContent>
          </Card>

          {/* Per-Client Breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Client Breakdown</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRiskScores}
                disabled={riskLoading || data.byClient.length === 0}
              >
                {riskLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <ShieldAlert className="h-4 w-4 mr-1" />
                )}
                {riskScores.size > 0 ? "Refresh Risk" : "Load Risk Scores"}
              </Button>
            </CardHeader>
            <CardContent>
              {data.byClient.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No outstanding client balances
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Client</th>
                        <th className="text-right py-2 px-3">Current</th>
                        <th className="text-right py-2 px-3">1-30</th>
                        <th className="text-right py-2 px-3">31-60</th>
                        <th className="text-right py-2 px-3">61-90</th>
                        <th className="text-right py-2 px-3">90+</th>
                        <th className="text-right py-2 px-3 font-bold">
                          Total
                        </th>
                        {riskScores.size > 0 && (
                          <th className="text-center py-2 px-3">
                            Collection %
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.byClient.map((client) => {
                        const risk = riskScores.get(client.contactId);
                        return (
                          <tr
                            key={client.contactId}
                            className="border-b last:border-0 hover:bg-muted/50"
                          >
                            <td className="py-2 px-3 font-medium">
                              {client.clientName}
                            </td>
                            <td className="text-right py-2 px-3">
                              {formatInvoiceAmount(client.current, currency)}
                            </td>
                            <td className="text-right py-2 px-3">
                              {formatInvoiceAmount(client.days1to30, currency)}
                            </td>
                            <td className="text-right py-2 px-3">
                              {formatInvoiceAmount(client.days31to60, currency)}
                            </td>
                            <td className="text-right py-2 px-3">
                              {formatInvoiceAmount(client.days61to90, currency)}
                            </td>
                            <td className="text-right py-2 px-3">
                              {formatInvoiceAmount(client.days90plus, currency)}
                            </td>
                            <td className="text-right py-2 px-3 font-bold">
                              {formatInvoiceAmount(client.total, currency)}
                            </td>
                            {riskScores.size > 0 && (
                              <td className="text-center py-2 px-3">
                                {risk ? (
                                  <Badge
                                    variant="outline"
                                    className={
                                      risk.rating === "low"
                                        ? "border-green-500 text-green-700"
                                        : risk.rating === "medium"
                                          ? "border-yellow-500 text-yellow-700"
                                          : "border-red-500 text-red-700"
                                    }
                                  >
                                    {risk.probability}%
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    —
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td className="py-2 px-3">TOTAL</td>
                        <td className="text-right py-2 px-3">
                          {formatInvoiceAmount(data.summary.current, currency)}
                        </td>
                        <td className="text-right py-2 px-3">
                          {formatInvoiceAmount(
                            data.summary.days1to30,
                            currency,
                          )}
                        </td>
                        <td className="text-right py-2 px-3">
                          {formatInvoiceAmount(
                            data.summary.days31to60,
                            currency,
                          )}
                        </td>
                        <td className="text-right py-2 px-3">
                          {formatInvoiceAmount(
                            data.summary.days61to90,
                            currency,
                          )}
                        </td>
                        <td className="text-right py-2 px-3">
                          {formatInvoiceAmount(
                            data.summary.days90plus,
                            currency,
                          )}
                        </td>
                        <td className="text-right py-2 px-3">
                          {formatInvoiceAmount(data.summary.total, currency)}
                        </td>
                        {riskScores.size > 0 && <td />}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
