/**
 * Order Detail Dialog Component
 *
 * Phase ECOM-04: Order Management Enhancement
 *
 * Full order detail view with all actions
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  MoreHorizontal,
  Printer,
  Mail,
  RefreshCw,
  FileText,
  Truck,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn, ensureAbsoluteUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderTimeline } from "./order-timeline";
import { OrderItemsTable } from "./order-items-table";
import { OrderCustomerPanel } from "./order-customer-panel";
import { InvoiceTemplate } from "./invoice-template";
import { RefundDialog } from "./refund-dialog";
import {
  getOrderDetail,
  updateOrderStatus,
  generateInvoiceNumber,
  sendOrderEmail,
  addOrderShipment,
  getPaymentProofUrl,
  updatePaymentProofStatus,
} from "../../actions/order-actions";
import type { OrderDetailData, OrderStatus } from "../../types/ecommerce-types";

import { useCurrencySafe } from "../../context/ecommerce-context";
import { ImageLightbox } from "@/modules/live-chat/components/shared/ImageLightbox";
// ============================================================================
// TYPES
// ============================================================================

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  siteId: string;
  userId: string;
  userName: string;
  storeName: string;
  storeAddress: string;
  storeEmail: string;
  storePhone?: string;
  storeLogo?: string;
  storePrimaryColor?: string;
  /** Fallback currency when rendered outside EcommerceProvider (e.g. live chat) */
  defaultCurrency?: string;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

import { ZAMBIA_CARRIERS } from "@/modules/ecommerce/lib/order-constants";

const statusConfig: Record<OrderStatus, { label: string; className: string }> =
  {
    pending: {
      label: "Pending",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    confirmed: {
      label: "Confirmed",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    processing: {
      label: "Processing",
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    shipped: {
      label: "Shipped",
      className:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
    delivered: {
      label: "Delivered",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    refunded: {
      label: "Refunded",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    },
  };

const statuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderDetailDialog({
  open,
  onOpenChange,
  orderId,
  siteId,
  userId,
  userName,
  storeName,
  storeAddress,
  storeEmail,
  storePhone,
  storeLogo,
  storePrimaryColor,
  defaultCurrency,
}: OrderDetailDialogProps) {
  const { currency: storeCurrency } = useCurrencySafe(defaultCurrency);
  const formatCurrency = (amount: number, currency?: string) => {
    const cur = currency || storeCurrency;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
    }).format(amount / 100);
  };
  const [orderData, setOrderData] = useState<OrderDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");

  // Shipping dialog state
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [shippingCarrierCustom, setShippingCarrierCustom] = useState("");
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState("");
  const [shippingTrackingUrl, setShippingTrackingUrl] = useState("");
  const [isSubmittingShipment, setIsSubmittingShipment] = useState(false);

  // Payment proof state
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofData, setProofData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [isApprovingProof, setIsApprovingProof] = useState(false);

  const invoiceRef = useRef<HTMLDivElement>(null);

  // Load order data
  useEffect(() => {
    if (!open || !orderId) return;

    async function loadOrder() {
      setIsLoading(true);
      try {
        const data = await getOrderDetail(siteId, orderId);
        setOrderData(data);

        if (data) {
          const invNum = await generateInvoiceNumber(siteId, orderId);
          setInvoiceNumber(invNum);

          // Load payment proof if it exists
          const isManualPayment =
            data.payment_provider === "manual" ||
            data.payment_provider === "bank_transfer";
          if (isManualPayment || data.metadata?.payment_proof) {
            const result = await getPaymentProofUrl(orderId, siteId);
            if (result.url) {
              setProofUrl(result.url);
              setProofData(result.proof || null);
            }
          }
        }
      } catch (error) {
        console.error("Error loading order:", error);
        toast.error("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [open, orderId, siteId]);

  // Print invoice handler
  const handlePrintInvoice = useCallback(() => {
    if (!invoiceRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print the invoice");
      return;
    }

    const invoiceHtml = invoiceRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { padding: 8px; text-align: left; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${invoiceHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [invoiceNumber]);

  // Status change handler — intercept "shipped" to show shipping dialog
  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!orderData) return;

    // If changing to shipped, open shipping dialog to collect tracking info
    if (newStatus === "shipped") {
      setShippingCarrier("");
      setShippingTrackingNumber("");
      setShippingTrackingUrl("");
      setShowShippingDialog(true);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const result = await updateOrderStatus(
        siteId,
        orderId,
        newStatus,
        userId,
        userName,
      );

      if (result.success) {
        toast.success(`Order status updated to ${newStatus}`);
        // Refresh order data
        const data = await getOrderDetail(siteId, orderId);
        setOrderData(data);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Submit shipment handler (called from shipping dialog)
  const handleSubmitShipment = async () => {
    const actualCarrier =
      shippingCarrier === "other"
        ? shippingCarrierCustom.trim()
        : shippingCarrier.trim();
    if (!actualCarrier || !shippingTrackingNumber.trim()) {
      toast.error("Courier and tracking number are required");
      return;
    }

    setIsSubmittingShipment(true);
    try {
      const result = await addOrderShipment(
        siteId,
        orderId,
        {
          carrier: actualCarrier,
          tracking_number: shippingTrackingNumber.trim(),
          tracking_url: shippingTrackingUrl.trim()
            ? ensureAbsoluteUrl(shippingTrackingUrl)
            : undefined,
        },
        userId,
        userName,
      );

      if (result) {
        toast.success("Shipment created and customer notified");
        setShowShippingDialog(false);
        setShippingCarrier("");
        setShippingCarrierCustom("");
        setShippingTrackingNumber("");
        setShippingTrackingUrl("");
        // Refresh order data
        const data = await getOrderDetail(siteId, orderId);
        setOrderData(data);
      } else {
        toast.error("Failed to create shipment");
      }
    } catch (error) {
      console.error("Error creating shipment:", error);
      toast.error("Failed to create shipment");
    } finally {
      setIsSubmittingShipment(false);
    }
  };

  // Payment proof approve/reject handler
  const handlePaymentProofAction = async (action: "approved" | "rejected") => {
    setIsApprovingProof(true);
    try {
      const result = await updatePaymentProofStatus(
        siteId,
        orderId,
        action,
        userId,
        userName,
      );
      if (result.success) {
        toast.success(`Payment proof ${action}`);
        const data = await getOrderDetail(siteId, orderId);
        setOrderData(data);
        // Re-fetch proof data
        const proofResult = await getPaymentProofUrl(orderId, siteId);
        if (proofResult.proof) setProofData(proofResult.proof);
      } else {
        toast.error(result.error || `Failed to ${action} payment proof`);
      }
    } catch (error) {
      console.error("Error updating payment proof:", error);
      toast.error("Failed to update payment proof");
    } finally {
      setIsApprovingProof(false);
    }
  };

  // Send email handler
  const handleSendEmail = async (
    type: "confirmation" | "shipped" | "delivered",
  ) => {
    try {
      await sendOrderEmail(orderId, type, userId, userName);
      toast.success("Email sent successfully");
      // Refresh to show new timeline event
      const data = await getOrderDetail(siteId, orderId);
      setOrderData(data);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    }
  };

  if (isLoading || !orderData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statusInfo = statusConfig[orderData.status];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl">
                  Order #{orderData.order_number}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(orderData.created_at), "PPpp")}
                </p>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-2">
                <Badge className={cn("text-sm", statusInfo.className)}>
                  {statusInfo.label}
                </Badge>

                <Select
                  value={orderData.status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusConfig[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePrintInvoice}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePrintInvoice}>
                      <FileText className="h-4 w-4 mr-2" />
                      Print Packing Slip
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleSendEmail("confirmation")}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Confirmation
                    </DropdownMenuItem>
                    {orderData.status === "shipped" && (
                      <DropdownMenuItem
                        onClick={() => handleSendEmail("shipped")}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Send Shipping Update
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowRefundDialog(true)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Process Refund
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="invoice">Invoice</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-4">
              {/* Summary Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(orderData.total, orderData.currency)}
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Items</div>
                  <div className="text-2xl font-bold">
                    {orderData.items?.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    ) || 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Payment</div>
                  <div className="text-xl font-bold capitalize">
                    {orderData.payment_status}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-lg border">
                <OrderItemsTable
                  items={orderData.items || []}
                  subtotal={orderData.subtotal}
                  shipping={
                    orderData.shipping_total || orderData.shipping_amount
                  }
                  tax={orderData.tax_total || orderData.tax_amount}
                  discount={
                    orderData.discount_total || orderData.discount_amount
                  }
                  total={orderData.total}
                />
              </div>

              {/* Customer Panel */}
              <OrderCustomerPanel order={orderData} />

              {/* Payment Proof Section — only shown for manual/bank_transfer orders */}
              {(orderData.payment_provider === "manual" ||
                orderData.payment_provider === "bank_transfer" ||
                !!orderData.metadata?.payment_proof) && (
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Payment Proof
                  </h3>
                  {proofUrl ? (
                    <div className="space-y-3">
                      <ImageLightbox
                        src={proofUrl}
                        alt="Payment proof"
                        contentType={proofData?.content_type as string}
                        fileName={String(
                          proofData?.file_name || "Payment proof",
                        )}
                        thumbnailMaxHeight="max-h-64"
                        className="w-full"
                      />
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {proofData?.file_name ? (
                            <p>File: {String(proofData.file_name)}</p>
                          ) : null}
                          {proofData?.uploaded_at ? (
                            <p>
                              Uploaded:{" "}
                              {format(
                                new Date(String(proofData.uploaded_at)),
                                "PPp",
                              )}
                            </p>
                          ) : null}
                          {proofData?.status ? (
                            <Badge
                              className={cn(
                                "text-xs mt-1",
                                proofData.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : proofData.status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700",
                              )}
                            >
                              {String(proofData.status)
                                .charAt(0)
                                .toUpperCase() +
                                String(proofData.status).slice(1)}
                            </Badge>
                          ) : null}
                        </div>
                        {(!proofData?.status ||
                          proofData.status === "pending" ||
                          proofData.status === "uploaded" ||
                          proofData.status === "pending_review") && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() =>
                                handlePaymentProofAction("approved")
                              }
                              disabled={isApprovingProof}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() =>
                                handlePaymentProofAction("rejected")
                              }
                              disabled={isApprovingProof}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No payment proof uploaded yet.
                    </p>
                  )}
                </div>
              )}

              {/* Shipping / Tracking Info — shown when order has tracking */}
              {(orderData.tracking_number ||
                (orderData.shipments && orderData.shipments.length > 0)) && (
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Shipping Information
                  </h3>
                  {orderData.shipments?.map(
                    (s: {
                      id: string;
                      carrier: string;
                      tracking_number: string;
                      tracking_url?: string;
                      status: string;
                      shipped_at?: string;
                    }) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-sm py-1"
                      >
                        <div>
                          <span className="font-medium">{s.carrier}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            — {s.tracking_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {s.status}
                          </Badge>
                          {s.tracking_url && (
                            <a
                              href={ensureAbsoluteUrl(s.tracking_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                            >
                              Track <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                  {orderData.tracking_number &&
                    (!orderData.shipments ||
                      orderData.shipments.length === 0) && (
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          Tracking:{" "}
                          <span className="font-medium">
                            {orderData.tracking_number}
                          </span>
                        </span>
                        {orderData.tracking_url && (
                          <a
                            href={ensureAbsoluteUrl(orderData.tracking_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                          >
                            Track <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <OrderTimeline events={orderData.timeline} />
            </TabsContent>

            <TabsContent value="invoice" className="mt-4">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={handlePrintInvoice}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <InvoiceTemplate
                    ref={invoiceRef}
                    data={{
                      order: orderData,
                      store: {
                        name: storeName,
                        address: storeAddress,
                        email: storeEmail,
                        phone: storePhone,
                        logo: storeLogo,
                        primaryColor: storePrimaryColor,
                      },
                      invoice_number: invoiceNumber,
                      invoice_date: orderData.created_at,
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <RefundDialog
        open={showRefundDialog}
        onOpenChange={setShowRefundDialog}
        order={orderData}
        siteId={siteId}
        userId={userId}
        userName={userName}
        onSuccess={async () => {
          const data = await getOrderDetail(siteId, orderId);
          setOrderData(data);
        }}
      />

      {/* Shipping Dialog — collect tracking info before marking as shipped */}
      <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Ship Order #{orderData.order_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="shipping-carrier">Courier *</Label>
              <Select
                value={shippingCarrier}
                onValueChange={(val) => {
                  setShippingCarrier(val);
                  if (val !== "other") setShippingCarrierCustom("");
                }}
              >
                <SelectTrigger id="shipping-carrier">
                  <SelectValue placeholder="Select a courier..." />
                </SelectTrigger>
                <SelectContent>
                  {ZAMBIA_CARRIERS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {shippingCarrier === "other" && (
                <Input
                  placeholder="Enter your carrier name..."
                  value={shippingCarrierCustom}
                  onChange={(e) => setShippingCarrierCustom(e.target.value)}
                  className="mt-2"
                  autoFocus
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-tracking">Tracking Number *</Label>
              <Input
                id="shipping-tracking"
                placeholder="Enter tracking number"
                value={shippingTrackingNumber}
                onChange={(e) => setShippingTrackingNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-url">Tracking URL (optional)</Label>
              <Input
                id="shipping-url"
                placeholder="https://tracking.example.com/..."
                value={shippingTrackingUrl}
                onChange={(e) => setShippingTrackingUrl(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowShippingDialog(false)}
                disabled={isSubmittingShipment}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitShipment}
                disabled={
                  isSubmittingShipment ||
                  !shippingTrackingNumber.trim() ||
                  (shippingCarrier === "other"
                    ? !shippingCarrierCustom.trim()
                    : !shippingCarrier)
                }
              >
                {isSubmittingShipment ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Truck className="h-4 w-4 mr-2" />
                )}
                Mark as Shipped
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
