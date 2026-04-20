"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  InvoiceWithItems,
  InvoiceStatus,
  Payment,
  InvoiceActivity,
} from "../types";
import { getInvoice } from "../actions/invoice-actions";

type InvoiceWithDetails = InvoiceWithItems & {
  payments: Payment[];
  activities: InvoiceActivity[];
};
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { AmountDisplay } from "./amount-display";
import { InvoiceActivityLog } from "./invoice-activity-log";
import { InvoiceActionsToolbar } from "./invoice-actions-toolbar";
import { PaymentForm } from "./payment-form";
import { RefundForm } from "./refund-form";
import { PaymentMethodIcon } from "./payment-method-icon";
import { CreditApplyDialog } from "./credit-apply-dialog";
import { BillableExpenseSelector } from "./billable-expense-selector";
import { DunningTimeline } from "./dunning-timeline";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Pencil } from "lucide-react";
import {
  formatInvoiceAmount,
  calculateLineItemTotals,
} from "../lib/invoicing-utils";
import { INVOICE_SOURCE_LABELS } from "../lib/invoicing-constants";
import { toast } from "sonner";

interface InvoiceDetailProps {
  siteId: string;
  invoiceId: string;
}

export function InvoiceDetail({ siteId, invoiceId }: InvoiceDetailProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  const loadInvoice = () => {
    setLoading(true);
    getInvoice(invoiceId)
      .then(setInvoice)
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="link" asChild>
          <Link href={`/dashboard/sites/${siteId}/invoicing/invoices`}>
            Back to invoices
          </Link>
        </Button>
      </div>
    );
  }

  const lineItems = invoice.lineItems ?? [];
  const payments = invoice.payments ?? [];
  const activities = invoice.activities ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/sites/${siteId}/invoicing/invoices`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{invoice.invoiceNumber}</h2>
              <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {invoice.clientName}
              {invoice.sourceType && (
                <>
                  {" "}
                  &middot;{" "}
                  {INVOICE_SOURCE_LABELS[invoice.sourceType] ??
                    invoice.sourceType}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === "draft" && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/dashboard/sites/${siteId}/invoicing/invoices/${invoiceId}?edit=true`}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Link>
            </Button>
          )}
          {invoice.status !== "paid" &&
            invoice.status !== "void" &&
            invoice.status !== "cancelled" &&
            invoice.status !== "draft" && (
              <>
                <PaymentForm
                  invoiceId={invoice.id}
                  amountDue={invoice.amountDue}
                  currency={invoice.currency}
                  onSuccess={loadInvoice}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreditDialogOpen(true)}
                >
                  Apply Credit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpenseDialogOpen(true)}
                >
                  Add Expenses
                </Button>
              </>
            )}
          {(invoice.status === "paid" || invoice.status === "partial") &&
            invoice.amountPaid > 0 && (
              <RefundForm
                invoiceId={invoice.id}
                amountPaid={invoice.amountPaid}
                currency={invoice.currency}
                onSuccess={loadInvoice}
              />
            )}
          <InvoiceActionsToolbar siteId={siteId} invoice={invoice} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main — left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client + Dates */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Bill To
                  </p>
                  <p className="font-medium">{invoice.clientName}</p>
                  {invoice.clientTaxId && (
                    <p className="text-sm text-muted-foreground">
                      Tax ID: {invoice.clientTaxId}
                    </p>
                  )}
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
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {invoice.clientAddress}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                      Issued
                    </p>
                    <p>{invoice.issueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                      Due
                    </p>
                    <p>{invoice.dueDate}</p>
                  </div>
                  {invoice.reference && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                        Reference
                      </p>
                      <p>{invoice.reference}</p>
                    </div>
                  )}
                  {invoice.paymentTerms && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                        Terms
                      </p>
                      <p>{invoice.paymentTerms}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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
                      <TableHead className="w-20 text-right">Qty</TableHead>
                      <TableHead className="w-28 text-right">Price</TableHead>
                      <TableHead className="w-24 text-right">Tax</TableHead>
                      <TableHead className="w-28 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((li, idx) => (
                      <TableRow key={li.id ?? idx}>
                        <TableCell>
                          <p className="font-medium">{li.name}</p>
                          {li.description && (
                            <p className="text-xs text-muted-foreground">
                              {li.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {li.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          <AmountDisplay
                            amount={li.unitPrice}
                            currency={invoice.currency}
                          />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {li.taxRate ? `${li.taxRate}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <AmountDisplay
                            amount={li.total}
                            currency={invoice.currency}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <AmountDisplay
                      amount={invoice.subtotal}
                      currency={invoice.currency}
                    />
                  </div>
                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Discount</span>
                      <span>
                        -
                        <AmountDisplay
                          amount={invoice.discountAmount}
                          currency={invoice.currency}
                        />
                      </span>
                    </div>
                  )}
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax</span>
                      <AmountDisplay
                        amount={invoice.taxAmount}
                        currency={invoice.currency}
                      />
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <AmountDisplay
                      amount={invoice.total}
                      currency={invoice.currency}
                    />
                  </div>
                  {invoice.amountPaid > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Paid</span>
                      <span>
                        -
                        <AmountDisplay
                          amount={invoice.amountPaid}
                          currency={invoice.currency}
                        />
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base">
                    <span>Balance Due</span>
                    <AmountDisplay
                      amount={invoice.amountDue}
                      currency={invoice.currency}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue={invoice.notes ? "notes" : "terms"}>
                  <TabsList>
                    {invoice.notes && (
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                    )}
                    {invoice.terms && (
                      <TabsTrigger value="terms">Terms</TabsTrigger>
                    )}
                  </TabsList>
                  {invoice.notes && (
                    <TabsContent value="notes">
                      <p className="text-sm whitespace-pre-line">
                        {invoice.notes}
                      </p>
                    </TabsContent>
                  )}
                  {invoice.terms && (
                    <TabsContent value="terms">
                      <p className="text-sm whitespace-pre-line">
                        {invoice.terms}
                      </p>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — right 1 col */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span>{invoice.currency}</span>
              </div>
              {invoice.sentAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span>{new Date(invoice.sentAt).toLocaleDateString()}</span>
                </div>
              )}
              {invoice.viewedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Viewed</span>
                  <span>{new Date(invoice.viewedAt).toLocaleDateString()}</span>
                </div>
              )}
              {invoice.paidDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span>{new Date(invoice.paidDate).toLocaleDateString()}</span>
                </div>
              )}
              {invoice.tags && invoice.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {invoice.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payments</CardTitle>
                <CardDescription>
                  {payments.length} payment{payments.length !== 1 ? "s" : ""}{" "}
                  received
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {payments.map((p: Payment) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        <AmountDisplay
                          amount={p.amount}
                          currency={invoice.currency}
                        />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.paymentDate} &middot;{" "}
                        <PaymentMethodIcon
                          method={p.paymentMethod}
                          className="inline-flex text-xs"
                          iconClassName="h-3 w-3"
                        />
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {p.type === "refund" && (
                        <Badge variant="destructive" className="text-xs">
                          Refund
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dunning Timeline — only for overdue invoices */}
          {(invoice.status === "overdue" || (invoice as any).dunningStage > 0) && (
            <DunningTimeline
              invoiceId={invoice.id}
              currentStage={(invoice as any).dunningStage || 0}
              writeOffFlagged={(invoice as any).writeOffFlagged || false}
              dunningPaused={(invoice as any).metadata?.dunning_paused || false}
              onSendReminder={async () => {
                try {
                  const { autoSendOverdueReminderEmail } = await import(
                    "../services/email-autosend-service"
                  );
                  await autoSendOverdueReminderEmail(siteId, invoice.id);
                  toast.success("Reminder sent");
                } catch {
                  toast.error("Failed to send reminder");
                }
              }}
              onTogglePause={async (paused: boolean) => {
                try {
                  const { createClient } = await import("@/lib/supabase/client");
                  const supabase = createClient() as any;
                  const { data: current } = await supabase
                    .from("mod_invoicing_invoices")
                    .select("metadata")
                    .eq("id", invoice.id)
                    .single();
                  const metadata = (current?.metadata as Record<string, unknown>) || {};
                  metadata.dunning_paused = paused;
                  await supabase
                    .from("mod_invoicing_invoices")
                    .update({ metadata, updated_at: new Date().toISOString() })
                    .eq("id", invoice.id);
                  toast.success(paused ? "Dunning paused" : "Dunning resumed");
                  loadInvoice();
                } catch {
                  toast.error("Failed to update dunning status");
                }
              }}
            />
          )}

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceActivityLog activities={activities} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Credit Apply Dialog */}
      <CreditApplyDialog
        siteId={siteId}
        invoiceId={invoice.id}
        invoiceAmountDue={invoice.amountDue}
        contactId={invoice.contactId || ""}
        currency={invoice.currency}
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        onApplied={loadInvoice}
      />

      {/* Billable Expense Selector */}
      <BillableExpenseSelector
        siteId={siteId}
        invoiceId={invoice.id}
        contactId={invoice.contactId || undefined}
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        onConverted={loadInvoice}
      />
    </div>
  );
}
