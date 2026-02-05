/**
 * Adjust Points Dialog Component
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Dialog for manually adjusting customer loyalty points
 */
'use client'

import { useState, useEffect } from 'react'
import { adjustLoyaltyPoints } from '../../actions/marketing-actions'
import type { LoyaltyPoints } from '../../types/marketing-types'
import { Loader2, Coins, Plus, Minus, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface AdjustPointsDialogProps {
  siteId: string
  member: LoyaltyPoints | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AdjustPointsDialog({ 
  siteId, 
  member, 
  open, 
  onOpenChange, 
  onSuccess 
}: AdjustPointsDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setAdjustmentType('add')
      setAmount('')
      setReason('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!member) return

    // Validation
    const numAmount = parseInt(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (adjustmentType === 'subtract' && numAmount > member.points_balance) {
      toast.error('Cannot subtract more points than the current balance')
      return
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for this adjustment')
      return
    }

    setIsSubmitting(true)

    try {
      const adjustedAmount = adjustmentType === 'add' ? numAmount : -numAmount
      
      const result = await adjustLoyaltyPoints(
        siteId,
        member.customer_id, 
        adjustedAmount, 
        reason.trim()
      )

      if (result.success) {
        toast.success(
          adjustmentType === 'add' 
            ? `Added ${numAmount.toLocaleString()} points`
            : `Subtracted ${numAmount.toLocaleString()} points`
        )
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to adjust points')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate new balance preview
  const numAmount = parseInt(amount) || 0
  const newBalance = member 
    ? member.points_balance + (adjustmentType === 'add' ? numAmount : -numAmount)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              Adjust Points
            </DialogTitle>
            <DialogDescription>
              {member?.customer ? `${member.customer.first_name || ''} ${member.customer.last_name || ''}`.trim() || member.customer.email : 'Customer'}
            </DialogDescription>
          </DialogHeader>

          {member && (
            <div className="py-4 space-y-4">
              {/* Current Balance */}
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Current Balance</div>
                <div className="text-3xl font-bold text-amber-600">
                  {member.points_balance.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>

              {/* Adjustment Type */}
              <div className="grid gap-2">
                <Label>Adjustment Type</Label>
                <Select 
                  value={adjustmentType} 
                  onValueChange={(v: 'add' | 'subtract') => setAdjustmentType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-green-500" />
                        Add Points
                      </span>
                    </SelectItem>
                    <SelectItem value="subtract">
                      <span className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-red-500" />
                        Subtract Points
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max={adjustmentType === 'subtract' ? member.points_balance : undefined}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter points amount"
                />
              </div>

              {/* Reason */}
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Customer service credit, Manual correction"
                  rows={2}
                />
              </div>

              {/* New Balance Preview */}
              {numAmount > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">New Balance</span>
                  <span className={`text-lg font-bold ${
                    newBalance < 0 ? 'text-destructive' : 'text-amber-600'
                  }`}>
                    {newBalance.toLocaleString()} points
                  </span>
                </div>
              )}

              {/* Warning for subtraction */}
              {adjustmentType === 'subtract' && numAmount > 0 && (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will permanently remove {numAmount.toLocaleString()} points from this customer's balance.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !amount || !reason.trim()}
              variant={adjustmentType === 'subtract' ? 'destructive' : 'default'}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {adjustmentType === 'add' ? 'Add Points' : 'Subtract Points'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
