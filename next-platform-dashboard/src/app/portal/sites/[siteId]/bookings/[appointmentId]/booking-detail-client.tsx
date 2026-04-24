"use client";

/**
 * Portal Bookings — detail client (Session 6A).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
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
  PortalAppointmentStatus,
  PortalBookingDetail,
} from "@/lib/portal/commerce-data-access";
import {
  formatPortalCurrency,
  formatPortalDate,
} from "@/lib/portal/format";
import { updateBookingStatusAction } from "../_actions";

const BOOKING_TRANSITIONS: Record<string, readonly PortalAppointmentStatus[]> = {
  pending: ["confirmed", "cancelled", "rescheduled"],
  confirmed: ["completed", "cancelled", "no_show", "rescheduled"],
  rescheduled: ["confirmed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

function toLocalInput(iso: string): string {
  // datetime-local expects "YYYY-MM-DDTHH:mm" in local tz
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BookingDetailClient({
  siteId,
  booking,
}: {
  siteId: string;
  booking: PortalBookingDetail;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newStatus, setNewStatus] =
    useState<PortalAppointmentStatus | "">("");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalInput(booking.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(booking.endsAt));

  const allowed = BOOKING_TRANSITIONS[booking.status] ?? [];

  function onApplyStatus() {
    if (!newStatus) return;
    if (newStatus === "rescheduled") {
      setRescheduleOpen(true);
      return;
    }
    if (newStatus === "cancelled" || newStatus === "no_show") {
      setReason("");
      setReasonOpen(true);
      return;
    }
    runUpdate(newStatus);
  }

  function runUpdate(
    status: PortalAppointmentStatus,
    extras: { reason?: string; startsAt?: string; endsAt?: string } = {},
  ) {
    startTransition(async () => {
      const res = await updateBookingStatusAction({
        siteId,
        appointmentId: booking.id,
        status,
        reason: extras.reason,
        startsAt: extras.startsAt
          ? new Date(extras.startsAt).toISOString()
          : undefined,
        endsAt: extras.endsAt
          ? new Date(extras.endsAt).toISOString()
          : undefined,
      });
      if (res.ok) {
        toast.success(`Booking marked ${status.replace(/_/g, " ")}`);
        setReasonOpen(false);
        setRescheduleOpen(false);
        setNewStatus("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/portal/sites/${siteId}/bookings`}>
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden /> Back to bookings
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">
            {booking.serviceName || "Booking"}
          </h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {formatPortalDate(booking.startsAt, { withTime: true })} –{" "}
            {formatPortalDate(booking.endsAt, { withTime: true })}
          </div>
          <div className="mt-2">
            <PortalStatusPill status={booking.status} />
          </div>
        </div>
        {allowed.length > 0 ? (
          <div className="flex items-center gap-2">
            <Select
              value={newStatus}
              onValueChange={(v) =>
                setNewStatus(v as PortalAppointmentStatus)
              }
            >
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                {allowed.map((s) => (
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
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="font-medium">{booking.customerName || "—"}</div>
              {booking.customerEmail ? (
                <div className="text-muted-foreground">
                  {booking.customerEmail}
                </div>
              ) : null}
              {booking.customerPhone ? (
                <div className="text-muted-foreground">
                  {booking.customerPhone}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {booking.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">
                {booking.notes}
              </CardContent>
            </Card>
          ) : null}

          {booking.internalNotes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">
                {booking.internalNotes}
              </CardContent>
            </Card>
          ) : null}

          {booking.customFields &&
          Object.keys(booking.customFields).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Custom fields</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {Object.entries(booking.customFields).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right wrap-break-word">
                        {typeof v === "string" ? v : JSON.stringify(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row
                label="Starts"
                value={formatPortalDate(booking.startsAt, { withTime: true })}
              />
              <Row
                label="Ends"
                value={formatPortalDate(booking.endsAt, { withTime: true })}
              />
              <Row label="Staff" value={booking.staffName || "—"} />
              <Row label="Service" value={booking.serviceName || "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row
                label="Status"
                value={booking.paymentStatus || "—"}
              />
              <Row
                label="Price"
                value={formatPortalCurrency(
                  booking.priceCents,
                  booking.currency,
                )}
              />
              {booking.paymentAmountCents > 0 ? (
                <Row
                  label="Paid"
                  value={formatPortalCurrency(
                    booking.paymentAmountCents,
                    booking.currency,
                  )}
                />
              ) : null}
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
            <Label htmlFor="bk-reason">Reason</Label>
            <Textarea
              id="bk-reason"
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
              disabled={isPending || reason.trim().length < 3 || !newStatus}
              onClick={() =>
                newStatus && runUpdate(newStatus, { reason })
              }
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule booking</DialogTitle>
            <DialogDescription>
              Pick new start and end times. The customer will be notified per
              site settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="bk-start">Starts at</Label>
              <Input
                id="bk-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bk-end">Ends at</Label>
              <Input
                id="bk-end"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bk-reschedule-reason">Reason (optional)</Label>
              <Textarea
                id="bk-reschedule-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={isPending || !startsAt || !endsAt}
              onClick={() =>
                runUpdate("rescheduled", {
                  startsAt,
                  endsAt,
                  reason: reason.trim() || undefined,
                })
              }
            >
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
