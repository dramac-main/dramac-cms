"use client";

/**
 * RecentInvoicesWidget — Table: 5 most recent invoices with status and amount
 *
 * Phase INV-07: Financial Dashboard
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { fetchRecentInvoices } from "../actions/report-actions";
import { INVOICE_STATUS_CONFIG } from "../lib/invoicing-constants";

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  status: string;
  issueDate: string;
}

interface RecentInvoicesWidgetProps {
  siteId: string;
  currency?: string;
}

export function RecentInvoicesWidget({
  siteId,
  currency = "ZMW",
}: RecentInvoicesWidgetProps) {
  const [invoices, setInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchRecentInvoices(siteId)
      .then(setInvoices)
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No invoices created yet
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => {
              const statusCfg = (INVOICE_STATUS_CONFIG as any)[inv.status] ?? {
                label: inv.status,
                bgColor: "bg-gray-100",
                color: "text-gray-700",
              };
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {inv.invoiceNumber}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {inv.clientName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`${statusCfg.bgColor} ${statusCfg.color} text-xs`}
                    >
                      {statusCfg.label}
                    </Badge>
                    <span className="text-sm font-medium w-24 text-right">
                      {formatInvoiceAmount(inv.total, currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
