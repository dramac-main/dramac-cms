"use client";

import Image from "next/image";
import type { CreateInvoiceLineItemInput } from "../actions/invoice-actions";
import {
  calculateLineItemTotals,
  calculateInvoiceTotals,
  formatInvoiceAmount,
} from "../lib/invoicing-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface InvoicePreviewProps {
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItems: CreateInvoiceLineItemInput[];
  discountType: "percentage" | "fixed" | null;
  discountValue: number;
  notes?: string;
  invoiceNumber?: string;
  companyName?: string;
  companyLogoUrl?: string;
  paymentInstructions?: string;
}

export function InvoicePreview({
  clientName,
  clientEmail,
  clientAddress,
  issueDate,
  dueDate,
  currency,
  lineItems,
  discountType,
  discountValue,
  notes,
  invoiceNumber,
  companyName,
  companyLogoUrl,
  paymentInstructions,
}: InvoicePreviewProps) {
  const validItems = lineItems.filter((li) => li.name.trim());

  const computedItems = validItems.map((item) =>
    calculateLineItemTotals(
      item.quantity,
      item.unitPrice,
      item.discountType || null,
      item.discountValue || 0,
      item.taxRate || 0,
    ),
  );

  const totals = calculateInvoiceTotals(
    computedItems,
    discountType,
    discountValue,
  );

  // Tax breakdown grouped by rate
  const taxByRate = new Map<number, number>();
  validItems.forEach((item, i) => {
    const rate = item.taxRate || 0;
    if (rate > 0) {
      taxByRate.set(
        rate,
        (taxByRate.get(rate) || 0) + computedItems[i].taxAmount,
      );
    }
  });

  const fmt = (cents: number) => formatInvoiceAmount(cents, currency);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Live Preview
            </CardTitle>
            {companyName && (
              <p className="font-semibold text-sm">{companyName}</p>
            )}
          </div>
          {companyLogoUrl && (
            <Image
              src={companyLogoUrl}
              alt="Company logo"
              width={64}
              height={64}
              className="rounded object-contain"
            />
          )}
        </div>
        {invoiceNumber && (
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {invoiceNumber}
          </p>
        )}
      </CardHeader>
      <CardContent className="text-sm space-y-4">
        {/* Client */}
        <div>
          <p className="font-medium">{clientName || "Client Name"}</p>
          {clientEmail && (
            <p className="text-muted-foreground text-xs">{clientEmail}</p>
          )}
          {clientAddress && (
            <p className="text-muted-foreground text-xs whitespace-pre-line">
              {clientAddress}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Issue:</span>{" "}
            {issueDate || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Due:</span> {dueDate || "—"}
          </div>
        </div>

        <Separator />

        {/* Line items */}
        {validItems.length > 0 ? (
          <div className="space-y-2">
            {validItems.map((item, i) => {
              const itemTotals = computedItems[i];
              return (
                <div key={i} className="flex justify-between text-xs">
                  <div className="flex-1 min-w-0">
                    <span className="truncate">{item.name}</span>
                    <span className="text-muted-foreground ml-1">
                      × {item.quantity}
                    </span>
                  </div>
                  <span className="ml-2 font-medium">
                    {fmt(itemTotals.total)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No line items yet
          </p>
        )}

        <Separator />

        {/* Totals */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{fmt(totals.subtotal)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount</span>
              <span>-{fmt(totals.discountAmount)}</span>
            </div>
          )}
          {/* Tax breakdown by rate */}
          {taxByRate.size > 0 && (
            <>
              {Array.from(taxByRate.entries()).map(([rate, amount]) => (
                <div key={rate} className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({rate}%)</span>
                  <span>{fmt(amount)}</span>
                </div>
              ))}
            </>
          )}
          {taxByRate.size === 0 && totals.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{fmt(totals.taxAmount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-base pt-1">
            <span>Amount Due</span>
            <span>{fmt(totals.total)}</span>
          </div>
        </div>

        {/* Payment Instructions */}
        {paymentInstructions && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Payment Instructions
              </p>
              <p className="text-xs whitespace-pre-line">
                {paymentInstructions}
              </p>
            </div>
          </>
        )}

        {/* Notes */}
        {notes && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-xs whitespace-pre-line">{notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
