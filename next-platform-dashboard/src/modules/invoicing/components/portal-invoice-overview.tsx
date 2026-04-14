"use client";

/**
 * Portal Invoice Overview Component — INV-09
 *
 * Landing page for the client invoicing portal.
 * Shows outstanding balance, recent invoices, quick actions.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  CreditCard,
  Receipt,
  TrendingDown,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import {
  getClientBalance,
  getPortalInvoices,
  type ClientBalance,
} from "../actions/statement-actions";

interface PortalInvoiceOverviewProps {
  siteId: string;
  clientId: string;
}

export function PortalInvoiceOverview({
  siteId,
  clientId,
}: PortalInvoiceOverviewProps) {
  const [balance, setBalance] = useState<ClientBalance | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getClientBalance(siteId, clientId),
      getPortalInvoices(siteId, clientId, undefined, { page: 1, perPage: 5 }),
    ])
      .then(([bal, inv]) => {
        setBalance(bal);
        setRecentInvoices(inv.invoices);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId, clientId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const basePath = `/portal/sites/${siteId}/invoicing`;

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Invoiced</p>
                <p className="text-lg font-bold">
                  {formatInvoiceAmount(balance?.totalInvoiced || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-lg font-bold">
                  {formatInvoiceAmount(balance?.totalPaid || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-lg font-bold">
                  {formatInvoiceAmount(balance?.outstanding || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-lg font-bold">
                  {formatInvoiceAmount(balance?.overdueAmount || 0)}
                </p>
                {(balance?.overdueCount || 0) > 0 && (
                  <p className="text-xs text-destructive">
                    {balance?.overdueCount} invoice(s)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button asChild variant="outline" size="sm">
          <Link href={`${basePath}/invoices`}>
            <FileText className="h-4 w-4 mr-1.5" />
            View All Invoices
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`${basePath}/payments`}>
            <Receipt className="h-4 w-4 mr-1.5" />
            Payment History
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`${basePath}/statements`}>
            <CreditCard className="h-4 w-4 mr-1.5" />
            Statement of Account
          </Link>
        </Button>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Invoices</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href={`${basePath}/invoices`}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No invoices yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map((inv: any) => (
                <Link
                  key={inv.id}
                  href={`${basePath}/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.issue_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={inv.status} />
                    <span className="text-sm font-medium">
                      {formatInvoiceAmount(inv.total || 0, inv.currency)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    paid: "default",
    partial: "secondary",
    sent: "outline",
    viewed: "outline",
    overdue: "destructive",
  };
  return (
    <Badge variant={variants[status] || "secondary"} className="text-xs">
      {status}
    </Badge>
  );
}
