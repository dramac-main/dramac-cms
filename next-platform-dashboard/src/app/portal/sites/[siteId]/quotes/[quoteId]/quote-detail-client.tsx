"use client";

/**
 * Portal Quotes — detail client (Session 6A).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PortalStatusPill } from "@/components/portal/patterns/portal-status-pill";
import type {
  PortalQuoteDetail,
  PortalQuoteStatus,
} from "@/lib/portal/commerce-data-access";
import {
  formatPortalCurrency,
  formatPortalDate,
} from "@/lib/portal/format";
import {
  convertQuoteToOrderAction,
  updateQuoteStatusAction,
} from "../_actions";

const QUOTE_TRANSITIONS: Record<string, readonly PortalQuoteStatus[]> = {
  draft: ["sent", "cancelled"],
  pending_approval: ["sent", "cancelled"],
  sent: ["viewed", "accepted", "rejected", "expired", "cancelled"],
  viewed: ["accepted", "rejected", "expired", "cancelled"],
  accepted: ["converted", "cancelled"],
  rejected: [],
  expired: [],
  converted: [],
  cancelled: [],
};

export function QuoteDetailClient({
  siteId,
  quote,
}: {
  siteId: string;
  quote: PortalQuoteDetail;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newStatus, setNewStatus] = useState<PortalQuoteStatus | "">("");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [pendingStatus, setPendingStatus] =
    useState<PortalQuoteStatus | null>(null);
  const [reason, setReason] = useState("");

  const allowed = QUOTE_TRANSITIONS[quote.status] ?? [];
  const canConvert = quote.status === "accepted" && !quote.convertedToOrderId;

  function onApplyStatus() {
    if (!newStatus) return;
    if (newStatus === "cancelled" || newStatus === "rejected") {
      setPendingStatus(newStatus);
      setReason("");
      setReasonOpen(true);
      return;
    }
    runUpdate(newStatus);
  }

  function runUpdate(status: PortalQuoteStatus, reasonText?: string) {
    startTransition(async () => {
      const res = await updateQuoteStatusAction({
        siteId,
        quoteId: quote.id,
        status,
        reason: reasonText,
      });
      if (res.ok) {
        toast.success(`Quote marked ${status.replace(/_/g, " ")}`);
        setReasonOpen(false);
        setPendingStatus(null);
        setNewStatus("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onConvert() {
    startTransition(async () => {
      const res = await convertQuoteToOrderAction({
        siteId,
        quoteId: quote.id,
      });
      if (res.ok && res.orderId) {
        toast.success("Converted to order");
        router.push(`/portal/sites/${siteId}/orders/${res.orderId}`);
      } else if (!res.ok) {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/portal/sites/${siteId}/quotes`}>
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden /> Back to quotes
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">
            {quote.title || `Quote ${quote.quoteNumber}`}
          </h1>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {quote.quoteNumber}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <PortalStatusPill status={quote.status} />
            {quote.validUntil ? (
              <span className="text-xs text-muted-foreground">
                Valid until {formatPortalDate(quote.validUntil)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {allowed.length > 0 ? (
            <>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as PortalQuoteStatus)}
              >
                <SelectTrigger className="h-9 w-44">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {allowed
                    .filter((s) => s !== "converted")
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!newStatus || isPending}
                onClick={onApplyStatus}
              >
                Apply
              </Button>
            </>
          ) : null}
          {canConvert ? (
            <Button size="sm" onClick={onConvert} disabled={isPending}>
              Convert to order
            </Button>
          ) : null}
          {quote.convertedToOrderId ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/portal/sites/${siteId}/orders/${quote.convertedToOrderId}`}
              >
                View converted order
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line items</CardTitle>
            </CardHeader>
            <CardContent>
              {quote.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>
                          <div className="font-medium">{it.productName}</div>
                          {it.description ? (
                            <div className="text-xs text-muted-foreground">
                              {it.description}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {it.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPortalCurrency(
                            it.unitPriceCents,
                            quote.currency,
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPortalCurrency(
                            it.totalPriceCents,
                            quote.currency,
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {quote.introduction || quote.notesToCustomer || quote.termsAndConditions ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {quote.introduction ? (
                  <Section label="Introduction">{quote.introduction}</Section>
                ) : null}
                {quote.notesToCustomer ? (
                  <Section label="Notes to customer">
                    {quote.notesToCustomer}
                  </Section>
                ) : null}
                {quote.termsAndConditions ? (
                  <Section label="Terms">{quote.termsAndConditions}</Section>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {quote.internalNotes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">
                {quote.internalNotes}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="font-medium">{quote.customerName || "—"}</div>
              <div className="text-muted-foreground">{quote.customerEmail}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <TotalRow
                label="Subtotal"
                value={formatPortalCurrency(quote.subtotalCents, quote.currency)}
              />
              {quote.discountCents > 0 ? (
                <TotalRow
                  label="Discount"
                  value={`-${formatPortalCurrency(quote.discountCents, quote.currency)}`}
                />
              ) : null}
              {quote.shippingCents > 0 ? (
                <TotalRow
                  label="Shipping"
                  value={formatPortalCurrency(
                    quote.shippingCents,
                    quote.currency,
                  )}
                />
              ) : null}
              {quote.taxCents > 0 ? (
                <TotalRow
                  label="Tax"
                  value={formatPortalCurrency(quote.taxCents, quote.currency)}
                />
              ) : null}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatPortalCurrency(quote.totalCents, quote.currency)}
                </dd>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <TimelineRow
                label="Created"
                value={quote.createdAt ? formatPortalDate(quote.createdAt) : "—"}
              />
              <TimelineRow
                label="Valid from"
                value={quote.validFrom ? formatPortalDate(quote.validFrom) : "—"}
              />
              <TimelineRow
                label="Valid until"
                value={
                  quote.validUntil ? formatPortalDate(quote.validUntil) : "—"
                }
              />
              <TimelineRow
                label="Sent"
                value={quote.sentAt ? formatPortalDate(quote.sentAt) : "—"}
              />
              <TimelineRow
                label="Responded"
                value={
                  quote.respondedAt ? formatPortalDate(quote.respondedAt) : "—"
                }
              />
              <TimelineRow
                label="Converted"
                value={
                  quote.convertedAt ? formatPortalDate(quote.convertedAt) : "—"
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide a reason</DialogTitle>
            <DialogDescription>
              Reason is stored with the status change for audit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="quote-reason">Reason</Label>
            <Textarea
              id="quote-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReasonOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={isPending || reason.trim().length < 3}
              onClick={() => pendingStatus && runUpdate(pendingStatus, reason)}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
