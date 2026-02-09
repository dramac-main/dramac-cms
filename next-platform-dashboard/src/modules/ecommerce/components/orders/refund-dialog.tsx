/**
 * Refund Dialog Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Dialog for creating and processing refunds
 */
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createRefund } from '../../actions/order-actions'
import type { Order, OrderItem } from '../../types/ecommerce-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

interface RefundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  siteId: string
  userId: string
  userName: string
  onSuccess: () => void
}

interface RefundItemState {
  order_item_id: string
  product_name: string
  quantity: number
  max_quantity: number
  unit_price: number
  selected: boolean
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency
  }).format(amount / 100)
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RefundDialog({
  open,
  onOpenChange,
  order,
  siteId,
  userId,
  userName,
  onSuccess
}: RefundDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [reason, setReason] = useState('')
  const [refundMethod, setRefundMethod] = useState<'original_payment' | 'store_credit' | 'other'>('original_payment')
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [customAmount, setCustomAmount] = useState('')
  
  // Initialize item states
  const [items, setItems] = useState<RefundItemState[]>(() => 
    (order.items || []).map((item: OrderItem) => ({
      order_item_id: item.id,
      product_name: item.product_name,
      quantity: item.quantity,
      max_quantity: item.quantity,
      unit_price: item.unit_price,
      selected: true
    }))
  )

  // Calculate totals
  const selectedAmount = items
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)

  const totalRefundAmount = refundType === 'full' 
    ? order.total 
    : (customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount)

  const maxRefundAmount = order.total // In production, subtract already refunded amount

  // Toggle item selection
  const toggleItem = (itemId: string) => {
    setItems(items.map(item => 
      item.order_item_id === itemId 
        ? { ...item, selected: !item.selected }
        : item
    ))
  }

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    setItems(items.map(item => 
      item.order_item_id === itemId 
        ? { ...item, quantity: Math.min(Math.max(1, quantity), item.max_quantity) }
        : item
    ))
  }

  // Handle refund submission
  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund')
      return
    }

    if (totalRefundAmount <= 0) {
      toast.error('Refund amount must be greater than 0')
      return
    }

    if (totalRefundAmount > maxRefundAmount) {
      toast.error('Refund amount cannot exceed order total')
      return
    }

    setIsProcessing(true)

    try {
      const refundData = {
        amount: totalRefundAmount,
        reason,
        refund_method: refundMethod,
        items: refundType === 'partial' 
          ? items
              .filter(item => item.selected)
              .map(item => ({
                order_item_id: item.order_item_id,
                quantity: item.quantity,
                amount: item.unit_price * item.quantity
              }))
          : undefined
      }

      const result = await createRefund(siteId, order.id, refundData, userId, userName)
      
      if (result) {
        toast.success('Refund request created successfully')
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error('Failed to create refund request')
      }
    } catch (error) {
      console.error('Error creating refund:', error)
      toast.error('Failed to create refund request')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Refund</DialogTitle>
          <DialogDescription>
            Process a refund for order #{order.order_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Refund Type */}
          <div className="space-y-2">
            <Label>Refund Type</Label>
            <Select
              value={refundType}
              onValueChange={(value) => setRefundType(value as 'full' | 'partial')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Refund ({formatCurrency(order.total)})</SelectItem>
                <SelectItem value="partial">Partial Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Partial Refund Items */}
          {refundType === 'partial' && (
            <div className="space-y-2">
              <Label>Select Items to Refund</Label>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.order_item_id}>
                        <TableCell>
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => toggleItem(item.order_item_id)}
                          />
                        </TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            max={item.max_quantity}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.order_item_id, parseInt(e.target.value))}
                            disabled={!item.selected}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2 pt-2">
                <Label>Or enter custom amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={maxRefundAmount / 100}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Refund Method */}
          <div className="space-y-2">
            <Label>Refund Method</Label>
            <Select
              value={refundMethod}
              onValueChange={(value) => setRefundMethod(value as typeof refundMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original_payment">Original Payment Method</SelectItem>
                <SelectItem value="store_credit">Store Credit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Refund *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for this refund..."
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex justify-between items-center">
              <span className="font-medium">Refund Amount:</span>
              <span className="text-xl font-bold">
                {formatCurrency(totalRefundAmount)}
              </span>
            </div>
          </div>

          {/* Warning */}
          {totalRefundAmount > 0 && (
            <div className="flex gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This action will create a refund request. The refund will need to be 
                processed manually through your payment provider.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isProcessing || totalRefundAmount <= 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Create Refund (${formatCurrency(totalRefundAmount)})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
