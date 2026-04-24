"use client";

/**
 * Portal Orders — detail client surface.
 *
 * Displays order metadata, items, totals, addresses, and exposes status
 * transitions, shipment capture, refund issuance, and internal-note
 * addition. All mutations go through server actions that call the DAL.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Truck, Undo2, NotebookPen } from "lucide-react";
import { PortalStatusPill } from "@/components/portal/patterns/portal-status-pill";
import type {
  PortalOrderDetail,
  PortalOrderStatus,
} from "@/lib/portal/commerce-data-access";
import {
  formatPortalCurrency,
  formatPortalDate,
} from "@/lib/portal/format";
import {
  updateOrderStatusAction,
  recordShipmentAction,
  issueOrderRefundAction,
  addOrderInternalNoteAction,
} from "../_actions";

const ORDER_TRANSITIONS: Record<string, readonly PortalOrderStatus[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function OrderDetailClient({
  siteId,
  order,
}: {
  siteId: string;
  order: PortalOrderDetail;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Status transition
  const [statusTarget, setStatusTarget] = useState<PortalOrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");

  // Shipment
  const [shipOpen, setShipOpen] = useState(false);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  // Refund
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Internal note
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");

  const allowedTransitions = ORDER_TRANSITIONS[order.status] ?? [];

  const handleStatus = () => {
    if (!statusTarget) return;
    startTransition(async () => {
      const res = await updateOrderStatusAction(siteId, order.id, {
        status: statusTarget,
        internalNote: statusNote.trim() || undefined,
      });
      if (res.ok) {
        toast.success(`Order marked ${statusTarget}`);
        setStatusTarget("");
        setStatusNote("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleShip = () => {
    startTransition(async () => {
      const res = await recordShipmentAction(siteId, order.id, {
        trackingNumber: tracking,
        carrier: carrier || undefined,
        trackingUrl: trackingUrl || undefined,
      });
      if (res.ok) {
        toast.success("Shipment recorded");
        setShipOpen(false);
        setTracking("");
        setCarrier("");
        setTrackingUrl("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleRefund = () => {
    const amount = Number.parseFloat(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a positive refund amount");
      return;
    }
    startTransition(async () => {
      const res = await issueOrderRefundAction(siteId, order.id, {
        amountCents: Math.round(amount * 100),
        reason: refundReason,
      });
      if (res.ok) {
        toast.success("Refund issued");
        setRefundOpen(false);
        setRefundAmount("");
        setRefundReason("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleNote = () => {
    startTransition(async () => {
      const res = await addOrderInternalNoteAction(siteId, order.id, note);
      if (res.ok) {
        toast.success("Note saved");
        setNoteOpen(false);
        setNote("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/portal/sites/${siteId}/orders`}>
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            Back to orders
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-mono text-xl font-semibold md:text-2xl">
            {order.orderNumber}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <PortalStatusPill status={order.status} />
            <PortalStatusPill status={order.paymentStatus ?? "pending"} />
            {order.fulfillmentStatus ? (
              <PortalStatusPill status={order.fulfillmentStatus} />
            ) : null}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Placed {formatPortalDate(order.createdAt, { withTime: true })}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {allowedTransitions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusTarget}
                onValueChange={(v) => setStatusTarget(v as PortalOrderStatus)}
              >
                <SelectTrigger className="h-9 w-44">
                  <SelectValue placeholder="Change status…" />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((s) => (
                    <SelectItem key={s} value={s}>
                      Mark {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!statusTarget || isPending}
                onClick={handleStatus}
              >
                Apply
              </Button>
            </div>
          ) : null}
          {["processing", "confirmed"].includes(order.status) ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShipOpen(true)}
            >
              <Truck className="mr-2 h-4 w-4" aria-hidden /> Record shipment
            </Button>
          ) : null}
          {["shipped", "delivered"].includes(order.status) ||
          order.paymentStatus === "paid" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRefundOpen(true)}
            >
              <Undo2 className="mr-2 h-4 w-4" aria-hidden /> Issue refund
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => setNoteOpen(true)}>
            <NotebookPen className="mr-2 h-4 w-4" aria-hidden /> Add note
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items + totals */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items</p>
              ) : (
                order.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{it.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.productSku ? `SKU ${it.productSku} · ` : ""}
                        Qty {it.quantity}
                        {it.fulfilledQuantity > 0
                          ? ` (${it.fulfilledQuantity} fulfilled)`
                          : ""}
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="text-sm">
                        {formatPortalCurrency(it.unitPriceCents, order.currency)}
                      </div>
                      <div className="text-sm font-semibold">
                        {formatPortalCurrency(it.totalPriceCents, order.currency)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <TotalRow
                  label="Subtotal"
                  cents={order.subtotalCents}
                  currency={order.currency}
                />
                {order.discountCents > 0 && (
                  <TotalRow
                    label="Discount"
                    cents={-order.discountCents}
                    currency={order.currency}
                  />
                )}
                <TotalRow
                  label="Shipping"
                  cents={order.shippingCents}
                  currency={order.currency}
                />
                <TotalRow
                  label="Tax"
                  cents={order.taxCents}
                  currency={order.currency}
                />
                <div className="border-t pt-2" />
                <TotalRow
                  label="Total"
                  cents={order.totalCents}
                  currency={order.currency}
                  emphasize
                />
              </dl>
            </CardContent>
          </Card>

          {order.customerNotes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">
                  {order.customerNotes}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {order.internalNotes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">
                  {order.internalNotes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="font-medium">{order.customerName ?? "—"}</div>
              <div className="text-muted-foreground">{order.customerEmail ?? ""}</div>
              {order.customerPhone ? (
                <div className="text-muted-foreground">{order.customerPhone}</div>
              ) : null}
            </CardContent>
          </Card>

          {order.shippingAddress ? (
            <AddressCard title="Shipping address" value={order.shippingAddress} />
          ) : null}
          {order.billingAddress ? (
            <AddressCard title="Billing address" value={order.billingAddress} />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div>Method: {order.paymentMethod ?? "—"}</div>
              <div className="text-muted-foreground">
                Status: {order.paymentStatus ?? "pending"}
              </div>
            </CardContent>
          </Card>

          {(order.trackingNumber || order.shippedAt) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {order.trackingNumber ? (
                  <div className="font-mono">{order.trackingNumber}</div>
                ) : null}
                {order.shippingMethod ? (
                  <div className="text-muted-foreground">{order.shippingMethod}</div>
                ) : null}
                {order.shippedAt ? (
                  <div className="text-muted-foreground">
                    Shipped {formatPortalDate(order.shippedAt, { withTime: true })}
                  </div>
                ) : null}
                {order.deliveredAt ? (
                  <div className="text-muted-foreground">
                    Delivered {formatPortalDate(order.deliveredAt, { withTime: true })}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Shipment dialog */}
      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record shipment</DialogTitle>
            <DialogDescription>
              Capture tracking info. The customer will receive a notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="tracking">Tracking number</Label>
              <Input
                id="tracking"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="e.g. 1Z999AA10123456784"
              />
            </div>
            <div>
              <Label htmlFor="carrier">Carrier (optional)</Label>
              <Input
                id="carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. UPS"
              />
            </div>
            <div>
              <Label htmlFor="trackingUrl">Tracking URL (optional)</Label>
              <Input
                id="trackingUrl"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShipOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleShip}
              disabled={isPending || tracking.trim().length < 3}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue refund</DialogTitle>
            <DialogDescription>
              Issued refunds are recorded on the order and trigger customer
              notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="refund-amount">Amount ({order.currency})</Label>
              <Input
                id="refund-amount"
                inputMode="decimal"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="refund-reason">Reason</Label>
              <Textarea
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                placeholder="Why is this refund being issued?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRefundOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              disabled={isPending || refundReason.trim().length < 3}
            >
              Issue refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Internal note dialog */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add internal note</DialogTitle>
            <DialogDescription>
              Notes are visible to agency staff and portal users with order access.
              The customer will not see them.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            placeholder="Add a note…"
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setNoteOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNote}
              disabled={isPending || note.trim().length < 1}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TotalRow({
  label,
  cents,
  currency,
  emphasize,
}: {
  label: string;
  cents: number;
  currency: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${emphasize ? "text-base font-semibold" : ""}`}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatPortalCurrency(cents, currency)}</dd>
    </div>
  );
}

function AddressCard({
  title,
  value,
}: {
  title: string;
  value: Record<string, unknown>;
}) {
  const parts: string[] = [];
  const push = (k: string) => {
    const v = value[k];
    if (typeof v === "string" && v.trim()) parts.push(v.trim());
  };
  push("line1");
  push("line2");
  push("city");
  const region = [value.state, value.postal_code].filter(Boolean).join(" ");
  if (region) parts.push(region);
  push("country");
  push("name");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5 text-sm">
        {parts.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          parts.map((p, i) => <div key={i}>{p}</div>)
        )}
      </CardContent>
    </Card>
  );
}
