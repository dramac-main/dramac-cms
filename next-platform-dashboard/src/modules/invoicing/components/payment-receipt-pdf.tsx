"use client";

import { useState, useEffect, useRef } from "react";
import { getPaymentReceipt } from "../actions/payment-actions";
import type { PaymentReceiptData } from "../actions/payment-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { PAYMENT_METHOD_LABELS } from "../lib/invoicing-constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Printer } from "lucide-react";

interface PaymentReceiptPdfProps {
  siteId: string;
  paymentId: string;
}

export function PaymentReceiptPdf({
  siteId,
  paymentId,
}: PaymentReceiptPdfProps) {
  const [data, setData] = useState<PaymentReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPaymentReceipt(siteId, paymentId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [siteId, paymentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Receipt not found.
      </div>
    );
  }

  const { payment, invoice, company, receiptNumber } = data;
  const brandColor = company.brandColor || "#1f2937";
  const methodLabel =
    PAYMENT_METHOD_LABELS[
      payment.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS
    ] || payment.paymentMethod;

  return (
    <div className="space-y-4">
      {/* Actions (hidden in print) */}
      <div className="flex gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Receipt Template */}
      <div
        ref={receiptRef}
        className="bg-white dark:bg-gray-950 border rounded-lg shadow-sm max-w-2xl mx-auto print:shadow-none print:border-none"
      >
        {/* Header with branding */}
        <div
          className="px-8 py-6 rounded-t-lg"
          style={{ backgroundColor: brandColor }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {company.logoUrl && (
                <img
                  src={company.logoUrl}
                  alt={company.name || "Company Logo"}
                  className="h-12 w-auto rounded"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-white">
                  {company.name || "Company"}
                </h1>
                {company.address && (
                  <p className="text-white/80 text-sm">{company.address}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-semibold text-white">
                PAYMENT RECEIPT
              </h2>
              <p className="text-white/80 text-sm">{receiptNumber}</p>
            </div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="px-8 py-6 space-y-6">
          {/* Receipt Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Received From
              </h3>
              <p className="font-medium">{invoice.clientName}</p>
              {invoice.clientEmail && (
                <p className="text-sm text-muted-foreground">
                  {invoice.clientEmail}
                </p>
              )}
              {invoice.clientPhone && (
                <p className="text-sm text-muted-foreground">
                  {invoice.clientPhone}
                </p>
              )}
              {invoice.clientAddress && (
                <p className="text-sm text-muted-foreground">
                  {invoice.clientAddress}
                </p>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Receipt Details
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Receipt #:</span>{" "}
                  <span className="font-medium">{receiptNumber}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Payment Date:</span>{" "}
                  <span className="font-medium">{payment.paymentDate}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Payment #:</span>{" "}
                  <span className="font-medium">
                    {payment.paymentNumber || "—"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Payment Info Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">
                    Description
                  </th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">
                        Payment for Invoice {invoice.invoiceNumber}
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Method: {methodLabel}
                        {payment.paymentMethodDetail &&
                          ` — ${payment.paymentMethodDetail}`}
                      </p>
                      {payment.transactionReference && (
                        <p className="text-muted-foreground text-xs">
                          Reference: {payment.transactionReference}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatInvoiceAmount(payment.amount, payment.currency)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30">
                  <td className="px-4 py-3 font-semibold">Amount Received</td>
                  <td className="px-4 py-3 text-right font-bold text-lg">
                    {formatInvoiceAmount(payment.amount, payment.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Invoice Summary */}
          <div className="bg-muted/30 rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2">Invoice Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground">Invoice Total</p>
                <p className="font-medium">
                  {formatInvoiceAmount(invoice.total, invoice.currency)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Paid</p>
                <p className="font-medium">
                  {formatInvoiceAmount(invoice.amountPaid, invoice.currency)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Balance Due</p>
                <p className="font-medium">
                  {formatInvoiceAmount(invoice.amountDue, invoice.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {payment.notes && (
            <div className="text-sm">
              <h4 className="font-medium mb-1">Notes</h4>
              <p className="text-muted-foreground">{payment.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t text-center text-xs text-muted-foreground">
          <p className="font-medium">{company.name}</p>
          {company.email && <span>{company.email}</span>}
          {company.phone && <span> • {company.phone}</span>}
          {company.website && <span> • {company.website}</span>}
          {company.taxId && <p className="mt-1">Tax ID: {company.taxId}</p>}
          <p className="mt-2">Thank you for your payment.</p>
        </div>
      </div>
    </div>
  );
}
