"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Receipt, 
  Download, 
  ExternalLink, 
  Loader2,
  Calendar,
  CreditCard,
  CircleCheck,
  Clock,
  AlertCircle,
  RefreshCcw,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
import { 
  getPortalInvoices, 
  getPortalBillingOverview,
  type PortalInvoice,
  type PortalBillingOverview 
} from "@/lib/portal/portal-billing-service";

function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: currency,
  }).format(amount / 100); // LemonSqueezy amounts are in cents
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(DEFAULT_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusIcon(status: string) {
  switch (status) {
    case "paid":
      return <CircleCheck className="h-4 w-4 text-green-600" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "refunded":
      return <AlertCircle className="h-4 w-4 text-blue-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />;
  }
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid":
      return "default";
    case "pending":
      return "secondary";
    case "refunded":
      return "outline";
    default:
      return "secondary";
  }
}

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [overview, setOverview] = useState<PortalBillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [invoicesResult, overviewResult] = await Promise.all([
        getPortalInvoices(),
        getPortalBillingOverview(),
      ]);

      setInvoices(invoicesResult.invoices);
      setOverview(overviewResult);
    } catch (error) {
      console.error("Failed to load billing data:", error);
      toast.error("Failed to load billing information");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Invoices & Billing
          </h1>
          <p className="text-muted-foreground mt-1">
            View your billing history and download invoices
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Billing Overview Cards */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Current Plan */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Current Plan</CardDescription>
              <CardTitle className="text-2xl">
                {overview.currentPlan || "No Active Plan"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overview.planStatus && (
                <Badge variant={overview.planStatus === "active" ? "default" : "secondary"}>
                  {overview.planStatus}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Total Paid */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Paid (This Year)</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Coins className="h-5 w-5" />
                {formatCurrency(overview.totalPaidThisYear, overview.currency)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {overview.invoiceCount} invoice{overview.invoiceCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Next Payment */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Next Payment</CardDescription>
              <CardTitle className="text-2xl">
                {overview.nextPaymentDate 
                  ? formatDate(overview.nextPaymentDate)
                  : "N/A"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overview.nextPaymentAmount && (
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(overview.nextPaymentAmount, overview.currency)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            All invoices and payments for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Invoices Yet</h3>
              <p className="text-muted-foreground">
                Your invoice history will appear here once you have billing activity.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(invoice.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="truncate max-w-[200px] block">
                        {invoice.description || invoice.productName || "Subscription"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusBadgeVariant(invoice.status)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.invoiceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (invoice.invoiceUrl) {
                                window.open(invoice.invoiceUrl, "_blank");
                              }
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        {invoice.receiptUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (invoice.receiptUrl) {
                                window.open(invoice.receiptUrl, "_blank");
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">Need help with billing?</h3>
              <p className="text-sm text-muted-foreground">
                Contact your agency for billing inquiries or subscription changes.
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/portal/support">Contact Support</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
