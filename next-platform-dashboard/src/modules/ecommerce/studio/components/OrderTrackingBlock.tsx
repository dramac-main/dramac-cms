/**
 * OrderTrackingBlock - Order tracking / lookup page component
 *
 * Allows customers to find their order by email + order number.
 * After lookup, redirects to the order confirmation page.
 */
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Package,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Mail,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useStorefront } from "../../context/storefront-context";
import { getPublicOrderByLookup } from "../../actions/public-ecommerce-actions";

interface OrderTrackingBlockProps {
  shopLink?: string;
  className?: string;
}

export function OrderTrackingBlock({
  shopLink = "/shop",
  className,
}: OrderTrackingBlockProps) {
  const storefront = useStorefront();
  const [email, setEmail] = React.useState("");
  const [orderNumber, setOrderNumber] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [foundOrderId, setFoundOrderId] = React.useState<string | null>(null);

  // Check localStorage for recent order on mount
  React.useEffect(() => {
    if (!storefront.siteId) return;
    try {
      const stored = localStorage.getItem(
        `ecom_last_order_${storefront.siteId}`,
      );
      if (stored) {
        const data = JSON.parse(stored);
        if (data?.orderId && data?.orderNumber) {
          setFoundOrderId(data.orderId);
        }
      }
    } catch {
      // ignore
    }
  }, [storefront.siteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFoundOrderId(null);

    if (!email.trim() || !orderNumber.trim()) {
      setError("Please enter both your email and order number.");
      return;
    }

    if (!storefront.siteId) {
      setError("Store not found. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const result = await getPublicOrderByLookup(
        storefront.siteId,
        email.trim(),
        orderNumber.trim(),
      );

      if (result) {
        setFoundOrderId(result.order.id);
      } else {
        setError(
          "No order found. Please check your email address and order number and try again.",
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("py-6 sm:py-8 md:py-12", className)}>
      <div className="container max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
            Track Your Order
          </h1>
          <p className="text-muted-foreground">
            Enter your email address and order number to view your order
            details.
          </p>
        </div>

        {/* Recent order quick link */}
        {foundOrderId && !email && !orderNumber && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm font-medium">You have a recent order</p>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/order-confirmation?order=${foundOrderId}`}>
                    View Order
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lookup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Find Your Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="tracking-email"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="tracking-email"
                  type="email"
                  placeholder="The email you used at checkout"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="tracking-order-number"
                  className="flex items-center gap-2"
                >
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Order Number
                </Label>
                <Input
                  id="tracking-order-number"
                  type="text"
                  placeholder="e.g. ORD-ABC123"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  You can find this in your order confirmation email.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Found order — show link */}
              {foundOrderId && (email || orderNumber) && (
                <Alert className="border-green-200 bg-green-50">
                  <Package className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-green-800 font-medium">
                        Order found!
                      </span>
                      <Button size="sm" asChild>
                        <Link
                          href={`/order-confirmation?order=${foundOrderId}`}
                        >
                          View Order Details
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Looking up order...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find My Order
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Continue Shopping */}
        <div className="text-center mt-6">
          <Button variant="ghost" asChild>
            <Link href={shopLink}>Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
