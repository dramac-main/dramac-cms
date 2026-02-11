/**
 * QuoteActionButtons - Actions for quote management
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Accept, reject, print, and share quote actions.
 */
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  CircleCheck, 
  CircleX, 
  Printer, 
  Share2, 
  Download,
  Copy,
  MessageSquare,
  Loader2
} from 'lucide-react'
import type { Quote, QuoteStatus } from '../../types/ecommerce-types'
import { isQuoteActionable, isQuoteFinal } from './QuoteStatusBadge'

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteActionButtonsProps {
  quote: Quote
  /** Callback when quote is accepted */
  onAccept?: (name: string, email?: string, signature?: string) => Promise<boolean>
  /** Callback when quote is rejected */
  onReject?: (reason?: string) => Promise<boolean>
  /** Callback for print action */
  onPrint?: () => void
  /** Callback for share action */
  onShare?: () => void
  /** Callback for download PDF */
  onDownload?: () => void
  /** Callback for requesting revision */
  onRequestRevision?: (message: string) => Promise<boolean>
  /** Display variant */
  variant?: 'default' | 'compact' | 'stacked'
  /** Show all actions or just primary */
  showAllActions?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteActionButtons({
  quote,
  onAccept,
  onReject,
  onPrint,
  onShare,
  onDownload,
  onRequestRevision,
  variant = 'default',
  showAllActions = true,
  className
}: QuoteActionButtonsProps) {
  const [isAcceptOpen, setIsAcceptOpen] = React.useState(false)
  const [isRejectOpen, setIsRejectOpen] = React.useState(false)
  const [isRevisionOpen, setIsRevisionOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  // Accept form state
  const [acceptName, setAcceptName] = React.useState('')
  const [acceptEmail, setAcceptEmail] = React.useState('')
  const [signature, setSignature] = React.useState('')

  // Reject form state
  const [rejectReason, setRejectReason] = React.useState('')

  // Revision form state
  const [revisionMessage, setRevisionMessage] = React.useState('')

  const canTakeAction = isQuoteActionable(quote.status)
  const isFinal = isQuoteFinal(quote.status)

  // Handle accept
  const handleAccept = async () => {
    if (!acceptName.trim()) return
    
    setIsLoading(true)
    try {
      const success = await onAccept?.(acceptName.trim(), acceptEmail.trim() || undefined, signature.trim() || undefined)
      if (success) {
        setIsAcceptOpen(false)
        setAcceptName('')
        setAcceptEmail('')
        setSignature('')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle reject
  const handleReject = async () => {
    setIsLoading(true)
    try {
      const success = await onReject?.(rejectReason.trim() || undefined)
      if (success) {
        setIsRejectOpen(false)
        setRejectReason('')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle revision request
  const handleRequestRevision = async () => {
    if (!revisionMessage.trim()) return
    
    setIsLoading(true)
    try {
      const success = await onRequestRevision?.(revisionMessage.trim())
      if (success) {
        setIsRevisionOpen(false)
        setRevisionMessage('')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Copy quote link
  const handleCopyLink = () => {
    if (quote.access_token) {
      const url = `${window.location.origin}/quote/${quote.access_token}`
      navigator.clipboard.writeText(url)
    }
  }

  // Button classes based on variant
  const buttonClass = variant === 'compact' ? 'h-8 text-xs' : ''
  
  const containerClass = cn(
    variant === 'stacked' && 'flex flex-col gap-2',
    variant !== 'stacked' && 'flex flex-wrap gap-2',
    className
  )

  return (
    <>
      <div className={containerClass}>
        {/* Primary actions - Accept/Reject */}
        {canTakeAction && onAccept && (
          <Button
            onClick={() => setIsAcceptOpen(true)}
            className={cn('bg-green-600 hover:bg-green-700', buttonClass)}
          >
            <CircleCheck className="mr-2 h-4 w-4" />
            Accept Quote
          </Button>
        )}

        {canTakeAction && onReject && (
          <Button
            variant="outline"
            onClick={() => setIsRejectOpen(true)}
            className={cn('text-red-600 border-red-300 hover:bg-red-50', buttonClass)}
          >
            <CircleX className="mr-2 h-4 w-4" />
            Decline
          </Button>
        )}

        {/* Request Revision */}
        {canTakeAction && onRequestRevision && showAllActions && (
          <Button
            variant="outline"
            onClick={() => setIsRevisionOpen(true)}
            className={buttonClass}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Request Changes
          </Button>
        )}

        {/* Secondary actions */}
        {showAllActions && (
          <>
            {onPrint && (
              <Button variant="outline" onClick={onPrint} className={buttonClass}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            )}

            {onDownload && (
              <Button variant="outline" onClick={onDownload} className={buttonClass}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}

            {onShare && (
              <Button variant="outline" onClick={onShare} className={buttonClass}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}

            {quote.access_token && (
              <Button variant="ghost" onClick={handleCopyLink} className={buttonClass}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            )}
          </>
        )}

        {/* Status message for final states */}
        {isFinal && (
          <p className="w-full text-sm text-gray-500">
            {quote.status === 'accepted' && 'This quote has been accepted.'}
            {quote.status === 'rejected' && 'This quote was declined.'}
            {quote.status === 'expired' && 'This quote has expired.'}
            {quote.status === 'converted' && 'This quote has been converted to an order.'}
          </p>
        )}
      </div>

      {/* Accept Dialog */}
      <Dialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quote</DialogTitle>
            <DialogDescription>
              By accepting this quote, you agree to the terms and pricing provided.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accept-name">Your Name *</Label>
              <Input
                id="accept-name"
                value={acceptName}
                onChange={(e) => setAcceptName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accept-email">Email (optional)</Label>
              <Input
                id="accept-email"
                type="email"
                value={acceptEmail}
                onChange={(e) => setAcceptEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Electronic Signature (optional)</Label>
              <Input
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your name as signature"
                className="font-script italic"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAccept} 
              disabled={!acceptName.trim() || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accept Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Quote</DialogTitle>
            <DialogDescription>
              Please let us know why you&apos;re declining this quote.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason (optional)</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Help us improve by sharing your feedback..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Decline Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revision Dialog */}
      <Dialog open={isRevisionOpen} onOpenChange={setIsRevisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Describe the changes you&apos;d like to see in the quote.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="revision-message">Your Message *</Label>
              <Textarea
                id="revision-message"
                value={revisionMessage}
                onChange={(e) => setRevisionMessage(e.target.value)}
                placeholder="Describe the changes you need..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRevisionOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestRevision} 
              disabled={!revisionMessage.trim() || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
