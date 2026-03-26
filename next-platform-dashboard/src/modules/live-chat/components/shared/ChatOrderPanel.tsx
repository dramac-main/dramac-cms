"use client";

/**
 * ChatOrderPanel — In-chat order management for store owners
 *
 * Displayed in the conversation sidebar when a conversation has an
 * associated order (via metadata.order_number). Allows the store owner
 * to view order details, approve/reject payment proofs, and update
 * order status — all without leaving the chat.
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Package,
  CreditCard,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  FileText,
  Truck,
  RefreshCw,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/locale-config";
import {
  getOrderContextForChat,
  type ChatOrderContext,
} from "@/modules/live-chat/actions/chat-order-actions";
import { updateOrderStatus } from "@/modules/ecommerce/actions/order-actions";
import { updatePaymentProofStatus } from "@/modules/ecommerce/actions/order-actions";

// Valid status transitions (mirrors order-actions.ts)
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  partially_refunded: "Partially Refunded",
  refunded: "Refunded",
  failed: "Failed",
};

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "delivered":
    case "paid":
      return "default";
    case "confirmed":
    case "processing":
    case "shipped":
      return "secondary";
    case "cancelled":
    case "refunded":
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

function getProofStatusVariant(
  status: string | null,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved":
      return "default";
    case "pending":
      return "outline";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
}

interface ChatOrderPanelProps {
  siteId: string;
  orderNumber: string;
  userId: string;
  userName: string;
}

export function ChatOrderPanel({
  siteId,
  orderNumber,
  userId,
  userName,
}: ChatOrderPanelProps) {
  const [order, setOrder] = useState<ChatOrderContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrderContextForChat(siteId, orderNumber);
      if (!data) {
        setError("Order not found");
      }
      setOrder(data);
    } catch {
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [siteId, orderNumber]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Handle status change
  const handleStatusChange = useCallback(
    (newStatus: string) => {
      if (!order) return;
      startTransition(async () => {
        const result = await updateOrderStatus(
          siteId,
          order.id,
          newStatus as
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "refunded",
          userId,
          userName,
        );
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(
            `Order status updated to ${STATUS_LABELS[newStatus] || newStatus}`,
          );
          // Refresh order data
          fetchOrder();
        }
      });
    },
    [order, siteId, userId, userName, fetchOrder],
  );

  // Handle payment proof approval
  const handleProofApprove = useCallback(() => {
    if (!order) return;
    startTransition(async () => {
      const result = await updatePaymentProofStatus(
        siteId,
        order.id,
        "approved",
        userId,
        userName,
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Payment proof approved — customer notified");
        fetchOrder();
      }
    });
  }, [order, siteId, userId, userName, fetchOrder]);

  // Handle payment proof rejection
  const handleProofReject = useCallback(() => {
    if (!order) return;
    startTransition(async () => {
      const result = await updatePaymentProofStatus(
        siteId,
        order.id,
        "rejected",
        userId,
        userName,
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Payment proof rejected — customer notified");
        fetchOrder();
      }
    });
  }, [order, siteId, userId, userName, fetchOrder]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Order Context
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground ml-2">
            Loading order...
          </span>
        </CardContent>
      </Card>
    );
  }

  // Error / not found state
  if (error || !order) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Order Context
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4 space-y-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {error || "Order not found"}
          </p>
          <p className="text-xs text-muted-foreground">Ref: {orderNumber}</p>
        </CardContent>
      </Card>
    );
  }

  const nextStatuses = VALID_TRANSITIONS[order.status] || [];
  const isManualPayment =
    order.paymentProvider === "manual" ||
    order.paymentMethod === "bank_transfer" ||
    order.paymentMethod === "mobile_money";

  return (
    <Card className="border-primary/20 bg-primary/2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            Order {order.orderNumber}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchOrder}
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
          <Badge
            variant={getStatusVariant(order.status)}
            className="text-[10px]"
          >
            {STATUS_LABELS[order.status] || order.status}
          </Badge>
          <Badge
            variant={getStatusVariant(order.paymentStatus)}
            className="text-[10px]"
          >
            <CreditCard className="h-2.5 w-2.5 mr-0.5" />
            {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
          </Badge>
        </div>

        {/* Total + date */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">
              {formatCurrency(order.total / 100, order.currency)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Date</span>
            <span className="text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          {isManualPayment && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payment</span>
              <span className="text-muted-foreground capitalize">
                {(order.paymentMethod || "manual").replace(/_/g, " ")}
              </span>
            </div>
          )}
        </div>

        {/* Items summary */}
        {order.items.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Items ({order.items.length})
              </p>
              {order.items.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="truncate max-w-40">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="text-muted-foreground shrink-0 ml-1">
                    {formatCurrency(item.totalPrice / 100, order.currency)}
                  </span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-[10px] text-muted-foreground">
                  +{order.items.length - 3} more items
                </p>
              )}
            </div>
          </>
        )}

        {/* Tracking info */}
        {order.trackingNumber && (
          <>
            <Separator />
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Truck className="h-3 w-3" />
                <span>Tracking: {order.trackingNumber}</span>
              </div>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Track shipment <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </>
        )}

        {/* Payment Proof Section */}
        {isManualPayment && order.paymentProof?.hasProof && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Payment Proof
                </p>
                <Badge
                  variant={getProofStatusVariant(order.paymentProof.status)}
                  className="text-[10px]"
                >
                  {order.paymentProof.status === "approved"
                    ? "Approved"
                    : order.paymentProof.status === "rejected"
                      ? "Rejected"
                      : "Pending Review"}
                </Badge>
              </div>
              {order.paymentProof.fileName && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {order.paymentProof.fileName}
                </p>
              )}

              {/* Approve / Reject buttons — only when proof is pending */}
              {(!order.paymentProof.status ||
                order.paymentProof.status === "pending" ||
                order.paymentProof.status === "pending_review") && (
                <div className="flex gap-1.5">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        disabled={isPending}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Approve Payment Proof
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will mark the payment as verified and set the
                          order payment status to &ldquo;Paid&rdquo;. The
                          customer will be notified in chat and via email.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleProofApprove}>
                          Approve Payment
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        disabled={isPending}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Reject Payment Proof
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          The customer will be notified that their proof could
                          not be verified and asked to upload a new one.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleProofReject}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Reject Proof
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </>
        )}

        {/* Awaiting proof indicator — manual payment, no proof yet, unpaid */}
        {isManualPayment &&
          !order.paymentProof?.hasProof &&
          order.paymentStatus === "pending" && (
            <>
              <Separator />
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Awaiting payment proof upload</span>
              </div>
            </>
          )}

        {/* Status Change */}
        {nextStatuses.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Update Status
              </p>
              <Select onValueChange={handleStatusChange} disabled={isPending}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Change status..." />
                </SelectTrigger>
                <SelectContent>
                  {nextStatuses.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STATUS_LABELS[s] || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* View full order link */}
        <Separator />
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={() => {
            window.open(
              `/dashboard/sites/${siteId}/ecommerce?tab=orders&order=${order.id}`,
              "_blank",
            );
          }}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View Full Order
        </Button>
      </CardContent>
    </Card>
  );
}
