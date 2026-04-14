"use client";

/**
 * Portal Invoice Detail Component — INV-09
 *
 * Client portal invoice view — shows line items, totals,
 * payment history, download PDF and pay buttons.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  CreditCard,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { INV_TABLES } from "../lib/invoicing-constants";

interface PortalInvoiceDetailProps {
  siteId: string;
  invoiceId: string;
  invoice: any;
  lineItems: any[];
  payments: any[];
}

export function PortalInvoiceDetail({
  siteId,
  invoiceId,
  invoice,
  lineItems,
  payments,
}: PortalInvoiceDetailProps) {
  const basePath = `/portal/sites/${siteId}/invoicing`;
  const currency = invoice?.currency || "ZMW";
  const amountDue =
    (invoice?.total || 0) -
    (invoice?.amount_paid || 0) -
    (invoice?.credits_applied || 0);

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button asChild variant="ghost" size="sm">
        <Link href={`${basePath}/invoices`}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Invoices
        </Link>
      </Button>

      {/* Invoice Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            Invoice {invoice?.invoice_number}
          </h2>
          <p className="text-sm text-muted-foreground">
            Issued {invoice?.issue_date} · Due {invoice?.due_date}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={invoice?.status} />
          {invoice?.view_token && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/api/invoicing/view/${invoice.view_token}`}
                target="_blank"
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                View Online
              </Link>
            </Button>
          )}
          {amountDue > 0 && invoice?.payment_token && (
            <Button asChild size="sm">
              <Link
                href={`/api/invoicing/pay/${invoice.payment_token}`}
                target="_blank"
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                Pay Now
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(lineItems || []).map((li: any, idx: number) => (
                  <TableRow key={li.id || idx}>
                    <TableCell>
                      <p className="font-medium">{li.name}</p>
                      {li.description && (
                        <p className="text-xs text-muted-foreground">
                          {li.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {li.quantity} {li.unit || ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatInvoiceAmount(li.unit_price || 0, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatInvoiceAmount(li.tax_amount || 0, currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatInvoiceAmount(li.total || 0, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>
                {formatInvoiceAmount(invoice?.subtotal || 0, currency)}
              </span>
            </div>
            {(invoice?.discount_amount || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">
                  -{formatInvoiceAmount(invoice.discount_amount, currency)}
                </span>
              </div>
            )}
            {(invoice?.tax_amount || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatInvoiceAmount(invoice.tax_amount, currency)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatInvoiceAmount(invoice?.total || 0, currency)}</span>
            </div>
            {(invoice?.amount_paid || 0) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Paid</span>
                <span>
                  -{formatInvoiceAmount(invoice.amount_paid, currency)}
                </span>
              </div>
            )}
            {(invoice?.credits_applied || 0) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Credits</span>
                <span>
                  -{formatInvoiceAmount(invoice.credits_applied, currency)}
                </span>
              </div>
            )}
            {amountDue > 0 && (
              <>
                <Separator />
                <div className="flex justify-between font-bold text-base text-destructive">
                  <span>Amount Due</span>
                  <span>{formatInvoiceAmount(amountDue, currency)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payments.map((pmt: any) => (
                <div
                  key={pmt.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {pmt.payment_number || "Payment"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pmt.payment_date} ·{" "}
                      {(pmt.payment_method || "").replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        pmt.status === "completed" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {pmt.status}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatInvoiceAmount(pmt.amount || 0, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {invoice?.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
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
    <Badge
      variant={variants[status] || "secondary"}
      className="text-lg px-3 py-1 capitalize"
    >
      {status}
    </Badge>
  );
}
