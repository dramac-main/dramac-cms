/**
 * OrderConfirmationBlock - Order confirmation page component
 *
 * Phase ECOM-23: Checkout Components
 *
 * Displays order confirmation details after successful checkout.
 */
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Package,
  Truck,
  CreditCard,
  Mail,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Clock,
  Banknote,
  AlertTriangle,
  Info,
  Upload,
  MessageSquare,
  FileText,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useStorefront } from "../../context/storefront-context";
import {
  getPublicOrderById,
  uploadPaymentProof,
  getOrderPaymentProofStatus,
} from "../../actions/public-ecommerce-actions";

// ============================================================================
// TYPES
// ============================================================================

interface OrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface OrderAddress {
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  payment_status?: string;
  payment_provider?: string;
  email: string;
  shipping_address: OrderAddress;
  billing_address: OrderAddress;
  shipping_method?: string;
  payment_method?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping_amount: number;
  tax_amount: number;
  total: number;
  created_at: string;
  estimated_delivery?: string;
  tracking_number?: string;
  tracking_url?: string;
}

interface OrderConfirmationBlockProps {
  order?: OrderData;
  orderId?: string;
  isLoading?: boolean;
  error?: string;
  formatPrice: (price: number) => string;
  shopLink?: string;
  trackingLink?: string;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderConfirmationBlock({
  order: orderProp,
  orderId: orderIdProp,
  isLoading: isLoadingProp = false,
  error: errorProp,
  formatPrice: formatPriceProp,
  shopLink = "/shop",
  trackingLink = "/order-tracking",
  className,
}: OrderConfirmationBlockProps) {
  const searchParams = useSearchParams();
  const storefront = useStorefront();
  const [fetchedOrder, setFetchedOrder] = React.useState<OrderData | null>(
    null,
  );
  const [fetchLoading, setFetchLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [proofFile, setProofFile] = React.useState<File | null>(null);
  const [proofPreview, setProofPreview] = React.useState<string | null>(null);
  const [proofUploading, setProofUploading] = React.useState(false);
  const [proofStatus, setProofStatus] = React.useState<{
    hasProof: boolean;
    status?: string;
    fileName?: string;
  }>({ hasProof: false });
  const [proofError, setProofError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Resolve orderId from prop or URL query param
  const resolvedOrderId = orderIdProp || searchParams.get("order") || "";
  const formatPrice = formatPriceProp || storefront.formatPrice;

  // Self-fetch order data when not provided via props
  React.useEffect(() => {
    if (orderProp || !resolvedOrderId || !storefront.siteId) return;
    let cancelled = false;
    setFetchLoading(true);
    getPublicOrderById(storefront.siteId, resolvedOrderId)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setFetchError("Order not found");
          return;
        }
        const { order: o, items } = result;
        setFetchedOrder({
          id: o.id,
          order_number: o.order_number,
          status: o.status,
          payment_status: o.payment_status || "pending",
          payment_provider: (o.payment_provider as string) || undefined,
          email: o.customer_email || "",
          shipping_address:
            (o.shipping_address as unknown as OrderAddress) ||
            ({} as OrderAddress),
          billing_address:
            (o.billing_address as unknown as OrderAddress) ||
            ({} as OrderAddress),
          shipping_method: (o.metadata as Record<string, unknown>)
            ?.shipping_method_name as string | undefined,
          payment_method: o.payment_provider || undefined,
          items: items.map((item: Record<string, unknown>) => ({
            id: item.id as string,
            product_name: (item.product_name as string) || "Product",
            product_image: item.product_image as string | undefined,
            variant_name: item.variant_name as string | undefined,
            quantity: (item.quantity as number) || 1,
            unit_price: (item.unit_price as number) || 0,
            line_total:
              (item.total_price as number) ||
              ((item.unit_price as number) || 0) *
                ((item.quantity as number) || 1),
          })),
          subtotal: o.subtotal || 0,
          discount: o.discount_amount || 0,
          shipping_amount: o.shipping_amount || 0,
          tax_amount: o.tax_amount || 0,
          total: o.total || 0,
          created_at: o.created_at,
        });
      })
      .catch(() => {
        if (!cancelled) setFetchError("Failed to load order details");
      })
      .finally(() => {
        if (!cancelled) setFetchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderProp, resolvedOrderId, storefront.siteId]);

  const order = orderProp || fetchedOrder;
  const isLoading = isLoadingProp || fetchLoading;
  const error = errorProp || fetchError;

  const copyOrderNumber = async () => {
    if (order?.order_number) {
      await navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Copy any text with a field-specific indicator
  const copyText = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Check payment proof status on mount
  React.useEffect(() => {
    if (!order?.id || !storefront.siteId) return;
    getOrderPaymentProofStatus(storefront.siteId, order.id).then(
      setProofStatus,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, storefront.siteId]);

  // Handle proof file selection
  const handleProofFileChange = (file: File | null) => {
    setProofError(null);
    // Revoke any previous object URL to prevent memory leak
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
    }
    if (!file) {
      setProofFile(null);
      setProofPreview(null);
      return;
    }
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      setProofError("Please upload an image (JPEG, PNG, WebP) or PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setProofError("File too large. Maximum 10 MB.");
      return;
    }
    setProofFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    } else {
      setProofPreview(null);
    }
  };

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      if (proofPreview) {
        URL.revokeObjectURL(proofPreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Upload proof
  const handleProofUpload = async () => {
    if (!proofFile || !order || !storefront.siteId) return;
    setProofUploading(true);
    setProofError(null);
    try {
      const arrayBuffer = await proofFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );
      const result = await uploadPaymentProof({
        siteId: storefront.siteId,
        orderId: order.id,
        orderNumber: order.order_number,
        fileName: proofFile.name,
        fileBase64: base64,
        contentType: proofFile.type,
      });
      if (!result.success) {
        setProofError(result.error || "Upload failed");
      } else {
        setProofStatus({
          hasProof: true,
          status: "pending_review",
          fileName: proofFile.name,
        });
        setProofFile(null);
        setProofPreview(null);
      }
    } catch {
      setProofError("Upload failed. Please try again.");
    } finally {
      setProofUploading(false);
    }
  };

  // Generate pre-formatted payment message for chat/WhatsApp
  const generatePaymentMessage = () => {
    if (!order) return "";
    const total = formatPrice(order.total);
    return `Hi, I've made payment for order ${order.order_number}, total ${total}. Please confirm receipt. Thank you!`;
  };

  // Open the live chat widget with order context via postMessage
  const openChatWithOrderContext = React.useCallback(() => {
    if (!order) return;
    const isManual =
      order.payment_provider === "manual" || order.payment_method === "manual";
    // Send to parent window — the embed script's message listener picks this up,
    // opens the chat container, and forwards order context to the iframe widget
    window.postMessage(
      {
        type: "dramac-chat-open",
        orderContext: {
          orderNumber: order.order_number,
          total: order.total,
          email: order.email,
          paymentProvider: order.payment_provider || order.payment_method,
          isManualPayment: isManual,
        },
      },
      "*",
    );
  }, [order]);

  // Auto-open chat widget after order loads (with a brief delay for UX)
  // Use localStorage key per order so refresh doesn't re-trigger auto-open
  React.useEffect(() => {
    if (!order) return;
    const storageKey = `dramac_chat_auto_opened_${order.order_number}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
    const timer = setTimeout(() => {
      openChatWithOrderContext();
    }, 3000); // 3 second delay so user can see the confirmation first
    return () => clearTimeout(timer);
  }, [order, openChatWithOrderContext]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("py-12", className)}>
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className={cn("py-12", className)}>
        <div className="container max-w-4xl mx-auto px-4">
          <Card className="text-center py-12">
            <CardContent>
              <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
              <p className="text-muted-foreground mb-6">
                {error || "We couldn't find the order you're looking for."}
              </p>
              <Button asChild>
                <Link href={shopLink}>Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isManualPayment =
    order.payment_provider === "manual" || order.payment_method === "manual";
  const isPaymentPending =
    order.payment_status === "pending" || !order.payment_status;
  const isAwaitingPayment = isManualPayment && isPaymentPending;

  // Get manual payment instructions from store settings
  const manualInstructions = storefront.settings?.manual_payment_instructions;

  // Format payment method name for display
  const paymentMethodLabel = (() => {
    const method = order.payment_provider || order.payment_method;
    if (!method) return "Not specified";
    const labels: Record<string, string> = {
      manual: "Bank Transfer / Manual Payment",
      paddle: "Card Payment (Paddle)",
      flutterwave: "Flutterwave",
      pesapal: "Pesapal",
      dpo: "DPO Pay",
    };
    return labels[method] || method;
  })();

  // Payment status badge
  const paymentStatusBadge = (() => {
    const status = order.payment_status || "pending";
    if (status === "paid" || status === "completed") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Paid
        </Badge>
      );
    }
    if (status === "pending") {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          Awaiting Payment
        </Badge>
      );
    }
    if (status === "failed") {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Payment Failed
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  })();

  return (
    <div className={cn("py-6 sm:py-8 md:py-12", className)}>
      <div className="container max-w-4xl mx-auto px-4">
        {/* Success Header — different for paid vs awaiting payment */}
        <div className="text-center mb-6 sm:mb-8">
          {isAwaitingPayment ? (
            <>
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                Order Received — Payment Pending
              </h1>
              <p className="text-muted-foreground mb-4">
                Your order has been placed and is awaiting payment. Our chat
                assistant will guide you through the payment process — check the
                chat in the bottom corner.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                Thank you for your order!
              </h1>
              <p className="text-muted-foreground mb-4">
                Your order has been placed successfully.
              </p>
            </>
          )}

          {/* Order Number */}
          <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
            <span className="text-sm text-muted-foreground">Order #</span>
            <span className="font-mono font-semibold">
              {order.order_number}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={copyOrderNumber}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Manual Payment Instructions — enhanced with copy buttons */}
        {isAwaitingPayment && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                <Banknote className="h-5 w-5 text-amber-600" />
                Payment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Reference — prominent copyable */}
              <div className="flex items-center justify-between bg-white rounded-lg border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Payment Reference
                  </p>
                  <p className="font-mono font-bold text-lg">
                    {order.order_number}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(order.order_number, "ref")}
                  className="shrink-0"
                >
                  {copiedField === "ref" ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* Amount to pay — copyable */}
              <div className="flex items-center justify-between bg-white rounded-lg border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Amount to Pay</p>
                  <p className="font-bold text-lg">
                    {formatPrice(order.total)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(formatPrice(order.total), "amount")}
                  className="shrink-0"
                >
                  {copiedField === "amount" ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* Payment instructions text with per-line copy */}
              {manualInstructions ? (
                <div className="bg-white rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    Where to Send Payment
                  </p>
                  <div className="space-y-1.5">
                    {manualInstructions
                      .split("\n")
                      .filter((line: string) => line.trim())
                      .map((line: string, i: number) => {
                        // Detect lines with copyable content (phone numbers, account numbers)
                        const hasCopyable = /(\+?\d[\d\s-]{6,}|\d{5,})/.test(
                          line,
                        );
                        const copyValue = line
                          .match(/(\+?\d[\d\s-]{6,}|\d{5,})/)?.[0]
                          ?.replace(/\s/g, "");
                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex items-center justify-between text-sm py-1",
                              hasCopyable &&
                                "bg-amber-50/50 rounded px-2 -mx-2",
                            )}
                          >
                            <span className="text-amber-900">{line}</span>
                            {hasCopyable && copyValue && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 ml-2"
                                onClick={() => copyText(copyValue, `line-${i}`)}
                              >
                                {copiedField === `line-${i}` ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-amber-800">
                  Please contact the store to arrange payment. Use order number{" "}
                  <strong>{order.order_number}</strong> as the payment
                  reference.
                </p>
              )}

              <div className="text-xs text-amber-700 border-t border-amber-200 pt-3">
                <strong>Important:</strong> Your order will be processed once
                payment is confirmed. Always use{" "}
                <strong>{order.order_number}</strong> as your payment reference.
              </div>
              <div className="text-xs text-amber-700 flex items-center gap-1.5 mt-2">
                <MessageSquare className="h-3 w-3" />
                Your chat assistant is also walking you through these payment
                steps.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Proof Upload — only for awaiting payment */}
        {isAwaitingPayment && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Payment Proof
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proofStatus.hasProof ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Payment proof uploaded
                    </p>
                    <p className="text-xs text-green-700">
                      {proofStatus.fileName} —{" "}
                      {proofStatus.status === "pending_review"
                        ? "Under review"
                        : proofStatus.status === "verified"
                          ? "Verified"
                          : proofStatus.status}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Upload a screenshot or photo of your payment confirmation to
                    speed up verification.
                  </p>

                  {/* Drop zone / file input */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-3 sm:p-6 text-center cursor-pointer transition-colors",
                      proofFile
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50",
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file) handleProofFileChange(file);
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        handleProofFileChange(e.target.files?.[0] || null)
                      }
                    />
                    {proofFile ? (
                      <div className="space-y-2">
                        {proofPreview && (
                          <Image
                            src={proofPreview}
                            alt="Payment proof preview"
                            width={200}
                            height={200}
                            className="mx-auto rounded-md object-contain max-h-40"
                          />
                        )}
                        {!proofPreview && (
                          <FileText className="h-10 w-10 mx-auto text-primary" />
                        )}
                        <p className="text-sm font-medium">{proofFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(proofFile.size / 1024 / 1024).toFixed(1)} MB — Click
                          to change
                        </p>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">
                          Drop file here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPEG, PNG, WebP, or PDF — Max 10 MB
                        </p>
                      </>
                    )}
                  </div>

                  {proofError && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {proofError}
                    </div>
                  )}

                  {proofFile && (
                    <Button
                      onClick={handleProofUpload}
                      disabled={proofUploading}
                      className="w-full"
                    >
                      {proofUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Payment Proof
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* What Happens Next — compact summary */}
        {isAwaitingPayment && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                What Happens Next
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-800">
                  <Check className="h-3.5 w-3.5" />
                  <span>Order Placed</span>
                </div>
                <span className="text-muted-foreground self-center">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                  <Banknote className="h-3.5 w-3.5" />
                  <span>Send Payment</span>
                </div>
                <span className="text-muted-foreground self-center">→</span>
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                    proofStatus.hasProof
                      ? "bg-green-100 text-green-800"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Proof</span>
                </div>
                <span className="text-muted-foreground self-center">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Confirmed</span>
                </div>
                <span className="text-muted-foreground self-center">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Shipped</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Email Notice */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <p className="text-sm">
                A confirmation email has been sent to{" "}
                <strong>{order.email}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Shipping Address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {order.shipping_address.first_name}{" "}
                {order.shipping_address.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shipping_address.address_line_1}
                {order.shipping_address.address_line_2 && (
                  <>, {order.shipping_address.address_line_2}</>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shipping_address.city}, {order.shipping_address.state}{" "}
                {order.shipping_address.postal_code}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shipping_address.country}
              </p>

              {order.shipping_method && (
                <p className="text-sm mt-3 pt-3 border-t">
                  <span className="text-muted-foreground">Method: </span>
                  {order.shipping_method}
                </p>
              )}

              {order.estimated_delivery && (
                <p className="text-sm text-green-600">
                  Estimated delivery: {order.estimated_delivery}
                </p>
              )}

              {/* Tracking Info */}
              {order.tracking_number && (
                <div className="mt-3 pt-3 border-t space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Tracking: </span>
                    <span className="font-medium">{order.tracking_number}</span>
                  </p>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      Track your shipment →
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Status</span>
                {paymentStatusBadge}
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Method</span>
                <span className="text-sm font-medium">
                  {paymentMethodLabel}
                </span>
              </div>
              <Separator className="my-3" />
              <p className="text-sm">
                {order.billing_address.first_name}{" "}
                {order.billing_address.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.billing_address.address_line_1}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.billing_address.city}, {order.billing_address.state}{" "}
                {order.billing_address.postal_code}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Items
              <Badge variant="secondary" className="ml-auto">
                {order.items.length}{" "}
                {order.items.length === 1 ? "item" : "items"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 sm:gap-4">
                  {/* Image */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium truncate">
                      {item.product_name}
                    </p>
                    {item.variant_name && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {item.variant_name}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatPrice(item.unit_price)} × {item.quantity}
                    </p>
                  </div>

                  {/* Line Total */}
                  <div className="text-sm sm:text-base font-medium">
                    {formatPrice(item.line_total)}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount</span>
                  <span className="text-green-600">
                    -{formatPrice(order.discount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {order.shipping_amount > 0
                    ? formatPrice(order.shipping_amount)
                    : "Free"}
                </span>
              </div>

              {order.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(order.tax_amount)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href={trackingLink}>
              <Truck className="h-4 w-4 mr-2" />
              Track Order
            </Link>
          </Button>

          <Button variant="outline" onClick={openChatWithOrderContext}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Need Help? Chat with Us
          </Button>

          <Button asChild>
            <Link href={shopLink}>
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
