/**
 * Order Items Table Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Table showing order line items with product details
 */
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { ImageOff } from 'lucide-react'
import type { OrderItem } from '../../types/ecommerce-types'

import { useCurrency } from '../../context/ecommerce-context'
// ============================================================================
// TYPES
// ============================================================================

interface OrderItemsTableProps {
  items: OrderItem[]
  showSubtotals?: boolean
  subtotal?: number
  shipping?: number
  tax?: number
  discount?: number
  total?: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderItemsTable({
  items,
  showSubtotals = true,
  subtotal,
  shipping,
  tax,
  discount,
  total
}: OrderItemsTableProps) {
  const { formatPrice: formatCurrency } = useCurrency()
  // Calculate subtotal if not provided
  const calculatedSubtotal = subtotal ?? items.reduce((sum, item) => {
    return sum + (item.unit_price * item.quantity)
  }, 0)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Image</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-center">Qty</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                {(item.product_image || item.image_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product_image || item.image_url || ''}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="font-medium">{item.product_name}</div>
                {item.variant_name && (
                  <div className="text-sm text-muted-foreground">
                    {item.variant_name}
                  </div>
                )}
                {(item.sku || item.product_sku) && (
                  <div className="text-xs text-muted-foreground font-mono">
                    SKU: {item.sku || item.product_sku}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(item.unit_price)}
            </TableCell>
            <TableCell className="text-center">
              {item.quantity}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(item.unit_price * item.quantity)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      {showSubtotals && (
        <TableFooter className="bg-transparent">
          <TableRow>
            <TableCell colSpan={4} className="text-right">
              Subtotal
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(calculatedSubtotal)}
            </TableCell>
          </TableRow>
          
          {(shipping !== undefined && shipping > 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-right">
                Shipping
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(shipping)}
              </TableCell>
            </TableRow>
          )}

          {(tax !== undefined && tax > 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-right">
                Tax
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(tax)}
              </TableCell>
            </TableRow>
          )}

          {(discount !== undefined && discount > 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-right text-green-600">
                Discount
              </TableCell>
              <TableCell className="text-right text-green-600">
                -{formatCurrency(discount)}
              </TableCell>
            </TableRow>
          )}

          {(total !== undefined) && (
            <TableRow className="bg-muted/50">
              <TableCell colSpan={4} className="text-right font-bold">
                Total
              </TableCell>
              <TableCell className="text-right font-bold text-lg">
                {formatCurrency(total)}
              </TableCell>
            </TableRow>
          )}
        </TableFooter>
      )}
    </Table>
  )
}
