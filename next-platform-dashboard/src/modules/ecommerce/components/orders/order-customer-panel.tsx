/**
 * Order Customer Panel Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Displays customer, billing, and shipping information
 */
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Truck,
  ExternalLink
} from 'lucide-react'
import type { Order } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface OrderCustomerPanelProps {
  order: Order
  onViewCustomer?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderCustomerPanel({ order, onViewCustomer }: OrderCustomerPanelProps) {
  const billingAddress = order.billing_address as Record<string, string> | null
  const shippingAddress = order.shipping_address as Record<string, string> | null

  const formatAddress = (address: Record<string, string> | null) => {
    if (!address) return null
    
    return (
      <div className="text-sm space-y-0.5">
        {address.name && <div className="font-medium">{address.name}</div>}
        {(address.first_name || address.last_name) && (
          <div className="font-medium">{address.first_name} {address.last_name}</div>
        )}
        {address.company && <div>{address.company}</div>}
        <div>{address.address_line_1}</div>
        {address.address_line_2 && <div>{address.address_line_2}</div>}
        <div>
          {address.city}, {address.state} {address.postal_code}
        </div>
        <div>{address.country}</div>
        {address.phone && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            {address.phone}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Customer</CardTitle>
          {order.customer_id && onViewCustomer && (
            <Button variant="ghost" size="sm" onClick={onViewCustomer}>
              View Profile
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{order.customer_name}</span>
            {!order.customer_id && (
              <Badge variant="secondary" className="text-xs">Guest</Badge>
            )}
          </div>
          
          {order.customer_email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a 
                href={`mailto:${order.customer_email}`}
                className="hover:text-primary"
              >
                {order.customer_email}
              </a>
            </div>
          )}
          
          {order.customer_phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <a 
                href={`tel:${order.customer_phone}`}
                className="hover:text-primary"
              >
                {order.customer_phone}
              </a>
            </div>
          )}
        </div>

        <Separator />

        {/* Addresses */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Billing Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Billing Address
            </div>
            {billingAddress ? (
              formatAddress(billingAddress)
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No billing address
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Truck className="h-4 w-4" />
              Shipping Address
            </div>
            {shippingAddress ? (
              formatAddress(shippingAddress)
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No shipping address
              </div>
            )}
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Order Notes
              </div>
              <p className="text-sm bg-muted/50 p-3 rounded-md">
                {order.notes}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
