"use client";

/**
 * ChatBookingPanel — In-chat booking management for agents
 *
 * Displayed in the conversation sidebar when a conversation has an
 * associated booking (via metadata.booking_id). Allows the agent to
 * view booking details, update status, and manage payment — all
 * without leaving the chat.
 *
 * Pattern follows ChatOrderPanel.tsx exactly.
 */

import { useState, useEffect, useCallback, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  User,
  CreditCard,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CalendarCheck,
  CircleCheck,
  CircleX,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/locale-config";
import {
  getBookingContextForChat,
  updateBookingStatusFromChat,
  updateBookingPaymentFromChat,
  type ChatBookingContext,
} from "@/modules/live-chat/actions/chat-booking-actions";

// =============================================================================
// STATUS HELPERS
// =============================================================================

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    color: string;
  }
> = {
  pending: { label: "Pending", variant: "outline", color: "bg-yellow-500" },
  confirmed: { label: "Confirmed", variant: "secondary", color: "bg-blue-500" },
  completed: { label: "Completed", variant: "default", color: "bg-green-500" },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    color: "bg-red-500",
  },
  no_show: { label: "No Show", variant: "outline", color: "bg-gray-500" },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#eab308" },
  paid: { label: "Paid", color: "#22c55e" },
  refunded: { label: "Refunded", color: "#ef4444" },
  not_required: { label: "Not Required", color: "#9ca3af" },
};

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

interface ChatBookingPanelProps {
  siteId: string;
  bookingId: string;
  userId: string;
  userName: string;
}

export function ChatBookingPanel({
  siteId,
  bookingId,
  userId,
  userName,
}: ChatBookingPanelProps) {
  const [booking, setBooking] = useState<ChatBookingContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Suppress unused variable warning — userId kept for future use
  void userId;

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBookingContextForChat(siteId, bookingId);
      if (!data) {
        setError("Booking not found");
      }
      setBooking(data);
    } catch {
      setError("Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [siteId, bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Handle confirmed status change (called from dialog)
  const executeStatusChange = useCallback(
    (newStatus: string) => {
      if (!booking) return;

      const opts: { cancellationReason?: string; agentName?: string } = {};
      if (newStatus === "cancelled" && cancelReason.trim()) {
        opts.cancellationReason = cancelReason.trim();
      }
      opts.agentName = userName;

      startTransition(async () => {
        const result = await updateBookingStatusFromChat(
          siteId,
          booking.id,
          newStatus,
          opts,
        );
        if (result.error) {
          toast.error(result.error);
        } else {
          const config = STATUS_CONFIG[newStatus];
          toast.success(`Booking ${config?.label || newStatus}`);
          fetchBooking();
        }
        setConfirmAction(null);
        setCancelReason("");
      });
    },
    [booking, siteId, fetchBooking, cancelReason, userName],
  );

  // Handle payment status change
  const handlePaymentChange = useCallback(
    (newStatus: string) => {
      if (!booking) return;

      startTransition(async () => {
        const result = await updateBookingPaymentFromChat(
          siteId,
          booking.id,
          newStatus,
        );
        if (result.error) {
          toast.error(result.error);
        } else {
          const config = PAYMENT_CONFIG[newStatus];
          toast.success(`Payment marked as ${config?.label || newStatus}`);
          fetchBooking();
        }
      });
    },
    [booking, siteId, fetchBooking],
  );

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5" />
            Booking Context
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground ml-2">
            Loading booking...
          </span>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5" />
            Booking Context
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4 space-y-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {error || "Booking not found"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const paymentConfig =
    PAYMENT_CONFIG[booking.paymentStatus] || PAYMENT_CONFIG.pending;
  const nextStatuses = VALID_STATUS_TRANSITIONS[booking.status] || [];
  const isPast = new Date(booking.endTime) < new Date();
  const paymentRequired = booking.requirePayment;
  const paymentUnpaid =
    paymentRequired &&
    booking.paymentStatus !== "paid" &&
    booking.paymentStatus !== "not_required";

  // Dialog content helpers
  function getDialogConfig(action: string) {
    const price =
      booking!.service &&
      formatCurrency(booking!.service.price, booking!.service.currency);

    const summary = (
      <div className="text-sm space-y-1.5 mt-2 bg-muted/50 p-3 rounded-md">
        {booking!.service && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{booking!.service.name}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">{formatDate(booking!.startTime)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Time</span>
          <span className="font-medium">
            {formatTime(booking!.startTime)} – {formatTime(booking!.endTime)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Customer</span>
          <span className="font-medium">{booking!.customerName}</span>
        </div>
        {booking!.staff && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Staff</span>
            <span className="font-medium">{booking!.staff.name}</span>
          </div>
        )}
        {price && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price</span>
            <span className="font-medium">{price}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment</span>
          <Badge variant="outline" className="text-[10px] h-5">
            <div
              className="h-2 w-2 rounded-full mr-1"
              style={{ backgroundColor: paymentConfig.color }}
            />
            {paymentConfig.label}
          </Badge>
        </div>
      </div>
    );

    switch (action) {
      case "confirmed":
        return {
          title: "Confirm Booking",
          description:
            "Are you sure you want to confirm this booking? The customer will expect to attend at the scheduled time.",
          actionLabel: "Confirm Booking",
          variant: "default" as const,
          extra: summary,
        };
      case "completed":
        return {
          title: "Complete Booking",
          description: paymentUnpaid
            ? "Payment has NOT been received for this booking. Are you sure you want to mark it as completed without payment?"
            : "Mark this booking as completed. This action cannot be undone.",
          actionLabel: paymentUnpaid
            ? "Complete Without Payment"
            : "Complete Booking",
          variant: (paymentUnpaid ? "destructive" : "default") as
            | "destructive"
            | "default",
          extra: (
            <>
              {paymentUnpaid && (
                <div className="flex items-start gap-2 p-2.5 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 mt-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium">Payment Outstanding</p>
                    <p className="mt-0.5 text-muted-foreground">
                      This booking requires payment ({price || "amount not set"}
                      ) but the current payment status is &ldquo;
                      {paymentConfig.label}&rdquo;. Completing without payment
                      may result in lost revenue.
                    </p>
                  </div>
                </div>
              )}
              {summary}
            </>
          ),
        };
      case "cancelled":
        return {
          title: "Cancel Booking",
          description:
            "This will cancel the booking. Please provide a reason for the cancellation.",
          actionLabel: "Cancel Booking",
          variant: "destructive" as const,
          extra: (
            <>
              {summary}
              <div className="mt-3 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Cancellation Reason
                </label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer requested cancellation, scheduling conflict..."
                  className="min-h-[60px] text-sm"
                />
              </div>
            </>
          ),
        };
      case "no_show":
        return {
          title: "Mark as No Show",
          description:
            "The customer did not attend the appointment. This action cannot be undone.",
          actionLabel: "Mark No Show",
          variant: "destructive" as const,
          extra: summary,
        };
      default:
        return {
          title: "Update Status",
          description: "Are you sure?",
          actionLabel: "Confirm",
          variant: "default" as const,
          extra: summary,
        };
    }
  }

  const dialogConfig = confirmAction ? getDialogConfig(confirmAction) : null;

  return (
    <Card className="border-primary/20 bg-primary/2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5" />
            Booking
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchBooking}
            disabled={isPending}
          >
            <RefreshCw
              className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={statusConfig.variant} className="text-[10px]">
            {statusConfig.label}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            <CreditCard className="h-2.5 w-2.5 mr-0.5" />
            {paymentConfig.label}
          </Badge>
          {isPast &&
            booking.status !== "completed" &&
            booking.status !== "cancelled" && (
              <Badge
                variant="outline"
                className="text-[10px] text-orange-600 border-orange-300"
              >
                Past Due
              </Badge>
            )}
        </div>

        {/* Service + Price */}
        {booking.service && (
          <div className="space-y-1">
            <p className="text-sm font-medium">{booking.service.name}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {booking.service.durationMinutes} min
              </span>
              <span className="font-medium text-foreground">
                {formatCurrency(
                  booking.service.price,
                  booking.service.currency,
                )}
              </span>
            </div>
          </div>
        )}

        {/* Payment Amount (when payment is required) */}
        {paymentRequired && booking.paymentAmount != null && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">
                Payment Amount
              </p>
              <p className="text-sm font-medium">
                {formatCurrency(
                  booking.paymentAmount,
                  booking.service?.currency || "USD",
                )}
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{
                borderColor: paymentConfig.color,
                color: paymentConfig.color,
              }}
            >
              {paymentConfig.label}
            </Badge>
          </div>
        )}

        {/* Payment Required Warning */}
        {paymentUnpaid &&
          booking.status !== "completed" &&
          booking.status !== "cancelled" && (
            <div className="flex items-start gap-2 p-2 rounded-md bg-yellow-500/10 border border-yellow-500/30">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-yellow-700 dark:text-yellow-400">
                Payment required but not yet received
              </p>
            </div>
          )}

        <Separator />

        {/* Date & Time */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(booking.startTime)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
            </span>
          </div>
        </div>

        {/* Customer */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{booking.customerName}</span>
          </div>
          {booking.customerEmail && (
            <p className="text-[10px] text-muted-foreground pl-4.5">
              {booking.customerEmail}
            </p>
          )}
          {booking.customerPhone && (
            <p className="text-[10px] text-muted-foreground pl-4.5">
              {booking.customerPhone}
            </p>
          )}
        </div>

        {/* Staff */}
        {booking.staff && (
          <>
            <Separator />
            <div className="flex items-center gap-1.5 text-xs">
              <User className="h-3 w-3 text-muted-foreground" />
              <span>
                Staff: <span className="font-medium">{booking.staff.name}</span>
              </span>
            </div>
          </>
        )}

        {/* Customer Notes */}
        {booking.customerNotes && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">
                Customer Notes
              </p>
              <p className="text-xs bg-muted/50 p-2 rounded">
                {booking.customerNotes}
              </p>
            </div>
          </>
        )}

        {/* Cancellation Info */}
        {booking.status === "cancelled" && booking.cancellationReason && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-red-500">
                Cancellation Reason
              </p>
              <p className="text-xs">{booking.cancellationReason}</p>
              {booking.cancelledBy && (
                <p className="text-[10px] text-muted-foreground">
                  Cancelled by {booking.cancelledBy}
                  {booking.cancelledAt &&
                    ` on ${formatDate(booking.cancelledAt)}`}
                </p>
              )}
            </div>
          </>
        )}

        {/* Payment Status Change */}
        {booking.status !== "cancelled" && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Payment
              </p>
              <Select
                value={booking.paymentStatus}
                onValueChange={handlePaymentChange}
                disabled={isPending}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value} className="text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Quick Status Actions (with confirmation dialogs) */}
        {nextStatuses.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Update Status
              </p>
              <div className="flex flex-wrap gap-1.5">
                {nextStatuses.includes("confirmed") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => setConfirmAction("confirmed")}
                    disabled={isPending}
                  >
                    <CircleCheck className="h-3 w-3 mr-1 text-blue-500" />
                    Confirm
                  </Button>
                )}
                {nextStatuses.includes("completed") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => setConfirmAction("completed")}
                    disabled={isPending}
                  >
                    <CircleCheck className="h-3 w-3 mr-1 text-green-500" />
                    Complete
                  </Button>
                )}
                {nextStatuses.includes("cancelled") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => {
                      setCancelReason("");
                      setConfirmAction("cancelled");
                    }}
                    disabled={isPending}
                  >
                    <CircleX className="h-3 w-3 mr-1 text-red-500" />
                    Cancel
                  </Button>
                )}
                {nextStatuses.includes("no_show") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => setConfirmAction("no_show")}
                    disabled={isPending}
                  >
                    <AlertCircle className="h-3 w-3 mr-1 text-gray-500" />
                    No Show
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog
          open={!!confirmAction}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmAction(null);
              setCancelReason("");
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogConfig?.title}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <p>{dialogConfig?.description}</p>
                  {dialogConfig?.extra}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                Go Back
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  confirmAction && executeStatusChange(confirmAction)
                }
                disabled={isPending}
                className={
                  dialogConfig?.variant === "destructive"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : ""
                }
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : null}
                {dialogConfig?.actionLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
