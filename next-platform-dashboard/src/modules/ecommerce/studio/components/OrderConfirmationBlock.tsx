/**
 * OrderConfirmationBlock - Order confirmation page component
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * Displays order confirmation details after successful checkout.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  CreditCard,
  Mail,
  ArrowRight,
  Loader2,
  Copy,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'

// ============================================================================
// TYPES
// ============================================================================

interface OrderItem {
  id: string
  product_name: string
  product_image?: string
  variant_name?: string
  quantity: number
  unit_price: number
  line_total: number
}

interface OrderAddress {
  first_name: string
  last_name: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

interface OrderData {
  id: string
  order_number: string
  status: string
  email: string
  shipping_address: OrderAddress
  billing_address: OrderAddress
  shipping_method?: string
  payment_method?: string
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping_amount: number
  tax_amount: number
  total: number
  created_at: string
  estimated_delivery?: string
}

interface OrderConfirmationBlockProps {
  order?: OrderData
  orderId?: string
  isLoading?: boolean
  error?: string
  formatPrice: (price: number) => string
  shopLink?: string
  trackingLink?: string
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderConfirmationBlock({
  order,
  orderId,
  isLoading = false,
  error,
  formatPrice,
  shopLink = '/shop',
  trackingLink,
  className
}: OrderConfirmationBlockProps) {
  const [copied, setCopied] = React.useState(false)

  const copyOrderNumber = async () => {
    if (order?.order_number) {
      await navigator.clipboard.writeText(order.order_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('py-12', className)}>
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !order) {
    return (
      <div className={cn('py-12', className)}>
        <div className="container max-w-4xl mx-auto px-4">
          <Card className="text-center py-12">
            <CardContent>
              <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
              <p className="text-muted-foreground mb-6">
                {error || 'We couldn\'t find the order you\'re looking for.'}
              </p>
              <Button asChild>
                <Link href={shopLink}>Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('py-8 md:py-12', className)}>
      <div className="container max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Thank you for your order!
          </h1>
          
          <p className="text-muted-foreground mb-4">
            Your order has been placed successfully.
          </p>

          {/* Order Number */}
          <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
            <span className="text-sm text-muted-foreground">Order #</span>
            <span className="font-mono font-semibold">{order.order_number}</span>
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

        {/* Confirmation Email Notice */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <p className="text-sm">
                A confirmation email has been sent to{' '}
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
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shipping_address.address_line_1}
                {order.shipping_address.address_line_2 && (
                  <>, {order.shipping_address.address_line_2}</>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shipping_address.city}, {order.shipping_address.state}{' '}
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
              <p className="text-sm">
                {order.billing_address.first_name} {order.billing_address.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.billing_address.address_line_1}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.billing_address.city}, {order.billing_address.state}{' '}
                {order.billing_address.postal_code}
              </p>
              
              {order.payment_method && (
                <p className="text-sm mt-3 pt-3 border-t">
                  <span className="text-muted-foreground">Method: </span>
                  {order.payment_method}
                </p>
              )}
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
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {/* Image */}
                  <div className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
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
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-sm text-muted-foreground">
                        {item.variant_name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.unit_price)} × {item.quantity}
                    </p>
                  </div>

                  {/* Line Total */}
                  <div className="font-medium">
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
                  <span className="text-green-600">-{formatPrice(order.discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {order.shipping_amount > 0 
                    ? formatPrice(order.shipping_amount) 
                    : 'Free'}
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
                <span className="text-xl font-bold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {trackingLink && (
            <Button variant="outline" asChild>
              <Link href={trackingLink}>
                <Truck className="h-4 w-4 mr-2" />
                Track Order
              </Link>
            </Button>
          )}
          
          <Button asChild>
            <Link href={shopLink}>
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
