"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPayment } from "../actions/payment-actions";
import type { Payment } from "../types/payment-types";
import type { Invoice } from "../types/invoice-types";
import { PaymentMethodIcon } from "./payment-method-icon";
import { AmountDisplay } from "./amount-display";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, Image as ImageIcon } from "lucide-react";
import type { InvoiceStatus } from "../types/invoice-types";

interface PaymentDetailProps {
  siteId: string;
  paymentId: string;
}

export function PaymentDetail({ siteId, paymentId }: PaymentDetailProps) {
  const [data, setData] = useState<(Payment & { invoice: Invoice }) | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayment(paymentId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [paymentId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Payment not found.</p>
        <Button variant="link" asChild>
          <Link href={`/dashboard/sites/${siteId}/invoicing/payments`}>
            Back to payments
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/sites/${siteId}/invoicing/payments`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              {data.paymentNumber || "Payment"}
            </h2>
            <Badge
              variant={data.type === "refund" ? "destructive" : "secondary"}
              className="text-xs capitalize"
            >
              {data.type}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {data.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-base">
                <AmountDisplay amount={data.amount} currency={data.currency} />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{data.paymentDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <PaymentMethodIcon method={data.paymentMethod} />
            </div>
            {data.paymentMethodDetail && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Detail</span>
                <span>{data.paymentMethodDetail}</span>
              </div>
            )}
            {data.transactionReference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">
                  {data.transactionReference}
                </span>
              </div>
            )}
            {data.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Notes
                  </p>
                  <p className="whitespace-pre-line">{data.notes}</p>
                </div>
              </>
            )}
            {data.proofUrl && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Payment Proof
                  </p>
                  <a
                    href={data.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <ImageIcon className="h-4 w-4" />
                    View Proof
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Linked Invoice */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Linked Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice</span>
              <Link
                href={`/dashboard/sites/${siteId}/invoicing/invoices/${data.invoice.id}`}
                className="text-primary hover:underline font-medium"
              >
                {data.invoice.invoiceNumber}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client</span>
              <span>{data.invoice.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <InvoiceStatusBadge
                status={data.invoice.status as InvoiceStatus}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <AmountDisplay
                amount={data.invoice.total}
                currency={data.invoice.currency}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance Due</span>
              <AmountDisplay
                amount={data.invoice.amountDue}
                currency={data.invoice.currency}
                className="font-medium"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
