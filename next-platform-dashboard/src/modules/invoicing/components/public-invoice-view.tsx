"use client";

/**
 * Public Invoice View Component — INV-09
 *
 * Public-facing branded invoice view rendered from API data.
 * No authentication — token-based access.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, CreditCard, Building2 } from "lucide-react";
import { formatInvoiceAmount } from "../lib/invoicing-utils";

interface PublicLineItem {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

interface PublicSettings {
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyLogo?: string | null;
  brandColor?: string | null;
  paymentInstructions?: string | null;
  invoiceFooter?: string | null;
  taxNumber?: string | null;
}

export interface PublicInvoiceData {
  id: string;
  invoiceNumber: string;
  status: string;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  clientCompany?: string | null;
  currency: string;
  issueDate: string;
  dueDate?: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string | null;
  terms?: string | null;
  reference?: string | null;
  lineItems: PublicLineItem[];
  settings: PublicSettings | null;
  paymentToken?: string | null;
}

const statusColor: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  viewed: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  partial:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

interface PublicInvoiceViewProps {
  invoice: PublicInvoiceData;
  pdfUrl?: string;
  payUrl?: string;
}

export function PublicInvoiceView({
  invoice,
  pdfUrl,
  payUrl,
}: PublicInvoiceViewProps) {
  const s = invoice.settings;
  const brandColor = s?.brandColor || "#2563eb";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {s?.companyLogo ? (
              <img
                src={s.companyLogo}
                alt={s.companyName || "Company"}
                className="h-10 w-auto"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold"
                style={{ backgroundColor: brandColor }}
              >
                <Building2 className="h-5 w-5" />
              </div>
            )}
            {s?.companyName && (
              <span className="text-lg font-semibold">{s.companyName}</span>
            )}
          </div>
          <div className="flex gap-2">
            {pdfUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </a>
              </Button>
            )}
            {payUrl && invoice.amountDue > 0 && (
              <Button size="sm" asChild>
                <a href={payUrl}>
                  <CreditCard className="h-4 w-4 mr-1" />
                  Pay Now
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Main Invoice Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
                {invoice.reference && (
                  <p className="text-sm text-muted-foreground">
                    Ref: {invoice.reference}
                  </p>
                )}
              </div>
              <Badge className={statusColor[invoice.status] || ""}>
                {invoice.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* From / To */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  From
                </p>
                {s?.companyName && (
                  <p className="text-sm font-medium">{s.companyName}</p>
                )}
                {s?.companyAddress && (
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {s.companyAddress}
                  </p>
                )}
                {s?.companyPhone && (
                  <p className="text-xs text-muted-foreground">
                    {s.companyPhone}
                  </p>
                )}
                {s?.companyEmail && (
                  <p className="text-xs text-muted-foreground">
                    {s.companyEmail}
                  </p>
                )}
                {s?.taxNumber && (
                  <p className="text-xs text-muted-foreground">
                    Tax #: {s.taxNumber}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Bill To
                </p>
                {invoice.clientName && (
                  <p className="text-sm font-medium">{invoice.clientName}</p>
                )}
                {invoice.clientCompany && (
                  <p className="text-xs text-muted-foreground">
                    {invoice.clientCompany}
                  </p>
                )}
                {invoice.clientAddress && (
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {invoice.clientAddress}
                  </p>
                )}
                {invoice.clientEmail && (
                  <p className="text-xs text-muted-foreground">
                    {invoice.clientEmail}
                  </p>
                )}
                {invoice.clientPhone && (
                  <p className="text-xs text-muted-foreground">
                    {invoice.clientPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Issue Date</p>
                <p className="text-sm font-medium">{invoice.issueDate}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-sm font-medium">{invoice.dueDate}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 text-xs font-medium text-muted-foreground pb-2 border-b">
                <span>Item</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
              </div>
              {invoice.lineItems.map((li) => (
                <div
                  key={li.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-2 text-sm border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{li.name}</p>
                    {li.description && (
                      <p className="text-xs text-muted-foreground">
                        {li.description}
                      </p>
                    )}
                  </div>
                  <span className="text-right">{li.quantity}</span>
                  <span className="text-right">
                    {formatInvoiceAmount(li.unitPrice, invoice.currency)}
                  </span>
                  <span className="text-right font-medium">
                    {formatInvoiceAmount(li.total, invoice.currency)}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="ml-auto max-w-xs space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {formatInvoiceAmount(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">
                    -
                    {formatInvoiceAmount(
                      invoice.discountTotal,
                      invoice.currency,
                    )}
                  </span>
                </div>
              )}
              {invoice.taxTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>
                    {formatInvoiceAmount(invoice.taxTotal, invoice.currency)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>
                  {formatInvoiceAmount(invoice.total, invoice.currency)}
                </span>
              </div>
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Paid</span>
                  <span>
                    -{formatInvoiceAmount(invoice.amountPaid, invoice.currency)}
                  </span>
                </div>
              )}
              {invoice.amountDue > 0 && invoice.amountDue !== invoice.total && (
                <div className="flex justify-between text-base font-bold">
                  <span>Amount Due</span>
                  <span>
                    {formatInvoiceAmount(invoice.amountDue, invoice.currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Notes / Terms */}
            {(invoice.notes || invoice.terms) && (
              <>
                <Separator />
                {invoice.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Notes
                    </p>
                    <p className="text-sm whitespace-pre-line">
                      {invoice.notes}
                    </p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Terms & Conditions
                    </p>
                    <p className="text-sm whitespace-pre-line">
                      {invoice.terms}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Payment Instructions */}
            {s?.paymentInstructions && invoice.amountDue > 0 && (
              <>
                <Separator />
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: `${brandColor}10` }}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Payment Instructions
                  </p>
                  <p className="text-sm whitespace-pre-line">
                    {s.paymentInstructions}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        {s?.invoiceFooter && (
          <p className="text-center text-xs text-muted-foreground">
            {s.invoiceFooter}
          </p>
        )}

        {/* Pay button bottom */}
        {payUrl && invoice.amountDue > 0 && (
          <div className="flex justify-center">
            <Button size="lg" asChild>
              <a href={payUrl}>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {formatInvoiceAmount(
                  invoice.amountDue,
                  invoice.currency,
                )}{" "}
                Now
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
