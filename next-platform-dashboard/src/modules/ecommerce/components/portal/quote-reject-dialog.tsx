/**
 * Quote Reject Dialog Component
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Dialog for customer to reject/decline a quote
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, CircleX } from 'lucide-react'
import { toast } from 'sonner'
import { rejectQuote } from '../../actions/quote-workflow-actions'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteRejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  onRejected: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteRejectDialog({
  open,
  onOpenChange,
  token,
  onRejected
}: QuoteRejectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason('')
    }
    onOpenChange(newOpen)
  }

  // Submit handler
  const handleReject = async () => {
    setLoading(true)
    
    try {
      const result = await rejectQuote({
        token,
        rejection_reason: reason.trim() || undefined
      })
      
      if (result.success) {
        toast.success('Quote declined')
        onRejected()
      } else {
        toast.error(result.error || 'Failed to decline quote')
      }
    } catch (error) {
      console.error('Error rejecting quote:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <CircleX className="h-5 w-5" />
            Decline Quote
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to decline this quote? You can optionally 
            provide a reason to help us improve our offerings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Let us know why you're declining this quote..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Your feedback helps us provide better quotes in the future.
            </p>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? 'Declining...' : 'Decline Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
