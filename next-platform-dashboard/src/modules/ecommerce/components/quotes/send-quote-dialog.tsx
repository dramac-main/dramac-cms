/**
 * Send Quote Dialog Component
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Dialog for sending quotes to customers via email
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Loader2, 
  Mail, 
  User,
  ExternalLink,
  Copy,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getQuote } from '../../actions/quote-actions'
import { sendQuote, resendQuote } from '../../actions/quote-workflow-actions'
import { formatQuoteCurrency, isQuoteExpired, getQuotePortalUrl } from '../../lib/quote-utils'
import { QuoteStatusBadge } from './quote-status-badge'
import type { Quote } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface SendQuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quoteId: string
  siteId: string
  onSent?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SendQuoteDialog({
  open,
  onOpenChange,
  quoteId,
  siteId,
  onSent
}: SendQuoteDialogProps) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  
  // Form state
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [ccEmails, setCcEmails] = useState('')
  const [includePdf, setIncludePdf] = useState(true)
  
  // Load quote data
  useEffect(() => {
    if (!open || !quoteId) return
    
    async function loadQuote() {
      setIsLoading(true)
      try {
        const data = await getQuote(siteId, quoteId)
        setQuote(data)
        
        // Set default subject and message
        if (data) {
          setSubject(`Quote ${data.quote_number}${data.title ? ` - ${data.title}` : ''}`)
          setMessage(getDefaultMessage(data))
        }
      } catch (error) {
        console.error('Error loading quote:', error)
        toast.error('Failed to load quote')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadQuote()
  }, [open, quoteId, siteId])
  
  // Default message template
  const getDefaultMessage = (q: Quote): string => {
    return `Dear ${q.customer_name},

Please find attached your quote for your review.

Quote Number: ${q.quote_number}
Total: ${formatQuoteCurrency(q.total, q.currency)}
${q.valid_until ? `Valid Until: ${format(new Date(q.valid_until), 'MMMM d, yyyy')}` : ''}

You can view and accept this quote online by clicking the link below.

Please don't hesitate to contact us if you have any questions.

Best regards`
  }
  
  // Handle send
  const handleSend = async () => {
    if (!quote) return
    
    setIsSending(true)
    try {
      // Parse CC emails
      const ccList = ccEmails
        .split(/[,;]/)
        .map(e => e.trim())
        .filter(e => e && e.includes('@'))
      
      const isResend = ['sent', 'viewed'].includes(quote.status)
      
      let result
      if (isResend) {
        result = await resendQuote(siteId, quoteId, subject, message)
      } else {
        result = await sendQuote({
          quote_id: quoteId,
          site_id: siteId,
          subject,
          message,
          cc_emails: ccList.length > 0 ? ccList : undefined,
          include_pdf: includePdf
        })
      }
      
      if (result.success) {
        toast.success(isResend ? 'Quote resent successfully' : 'Quote sent successfully')
        onSent?.()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to send quote')
      }
    } catch (error) {
      console.error('Error sending quote:', error)
      toast.error('Failed to send quote')
    } finally {
      setIsSending(false)
    }
  }
  
  // Copy portal link
  const handleCopyLink = () => {
    if (!quote?.access_token) return
    
    const portalUrl = getQuotePortalUrl(quote.access_token)
    navigator.clipboard.writeText(portalUrl)
    toast.success('Portal link copied to clipboard')
  }
  
  // Check if expired
  const expired = quote?.valid_until ? isQuoteExpired(quote.valid_until) : false
  const isResend = quote && ['sent', 'viewed'].includes(quote.status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {isResend ? 'Resend Quote' : 'Send Quote'}
          </DialogTitle>
          <DialogDescription>
            {isResend 
              ? 'Send another copy of this quote to the customer'
              : 'Email this quote to the customer for review and approval'
            }
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !quote ? (
          <div className="text-center py-8 text-muted-foreground">
            Quote not found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quote Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{quote.quote_number}</span>
                    <QuoteStatusBadge status={quote.status} size="sm" />
                  </div>
                  {quote.title && (
                    <p className="text-sm text-muted-foreground">{quote.title}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatQuoteCurrency(quote.total, quote.currency)}</p>
                  {quote.valid_until && (
                    <p className={cn(
                      "text-xs",
                      expired ? "text-red-600" : "text-muted-foreground"
                    )}>
                      Valid until {format(new Date(quote.valid_until), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Expiry Warning */}
            {expired && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">This quote has expired</p>
                  <p className="text-sm">Consider extending the validity date before sending.</p>
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Recipient */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Recipient
              </Label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{quote.customer_name}</span>
                <span className="text-muted-foreground">&lt;{quote.customer_email}&gt;</span>
              </div>
            </div>
            
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Quote subject line..."
              />
            </div>
            
            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={6}
              />
            </div>
            
            {/* CC Emails */}
            <div className="space-y-2">
              <Label htmlFor="cc">CC (optional)</Label>
              <Input
                id="cc"
                value={ccEmails}
                onChange={(e) => setCcEmails(e.target.value)}
                placeholder="client@company.co.zm"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas
              </p>
            </div>
            
            {/* Options */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="includePdf"
                checked={includePdf}
                onCheckedChange={(checked) => setIncludePdf(checked as boolean)}
              />
              <Label htmlFor="includePdf" className="cursor-pointer">
                Attach PDF version
              </Label>
            </div>
            
            {/* Portal Link Preview */}
            {quote.access_token && (
              <div className="space-y-2">
                <Label>Customer Portal Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={getQuotePortalUrl(quote.access_token)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.open(`/quote/${quote.access_token}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={isSending || !subject}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isResend ? 'Resend Quote' : 'Send Quote'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
