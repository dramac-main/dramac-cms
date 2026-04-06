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

  // Suppress unused variable warnings — userId/userName kept for future use
  // (e.g., audit trail when status changes need to track who made the change)
  void userId;
  void userName;

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

  // Handle status change
  const handleStatusChange = useCallback(
    (newStatus: string) => {
      if (!booking) return;

      startTransition(async () => {
        const result = await updateBookingStatusFromChat(
          siteId,
          booking.id,
          newStatus,
        );
        if (result.error) {
          toast.error(result.error);
        } else {
          const config = STATUS_CONFIG[newStatus];
          toast.success(`Booking ${config?.label || newStatus}`);
          fetchBooking();
        }
      });
    },
    [booking, siteId, fetchBooking],
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

        {/* Service */}
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

        {/* Quick Status Actions */}
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
                    onClick={() => handleStatusChange("confirmed")}
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
                    onClick={() => handleStatusChange("completed")}
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
                    onClick={() => handleStatusChange("cancelled")}
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
                    onClick={() => handleStatusChange("no_show")}
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
      </CardContent>
    </Card>
  );
}
