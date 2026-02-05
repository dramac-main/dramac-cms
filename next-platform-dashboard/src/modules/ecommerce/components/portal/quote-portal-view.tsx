/**
 * Quote Portal View Component
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Customer-facing view for quotes
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Building,
  Mail,
  Phone,
  Download,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { QuoteAcceptForm } from './quote-accept-form'
import { QuoteRejectDialog } from './quote-reject-dialog'
import { formatQuoteCurrency, isQuoteExpired, calculateDaysUntilExpiry } from '../../lib/quote-utils'
import type { Quote } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuotePortalViewProps {
  quote: Quote
  token: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuotePortalView({ quote, token }: QuotePortalViewProps) {
  const [showAcceptForm, setShowAcceptForm] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(quote.status)
  
  const expired = quote.valid_until ? isQuoteExpired(quote.valid_until) : false
  const daysUntilExpiry = quote.valid_until ? calculateDaysUntilExpiry(quote.valid_until) : null
  
  const canRespond = ['sent', 'viewed'].includes(currentStatus) && !expired
  const isAccepted = currentStatus === 'accepted'
  const isRejected = currentStatus === 'rejected'
  const isExpired = currentStatus === 'expired' || expired
  
  // Handle acceptance/rejection
  const handleAccepted = () => {
    setCurrentStatus('accepted')
    setShowAcceptForm(false)
  }
  
  const handleRejected = () => {
    setCurrentStatus('rejected')
    setShowRejectDialog(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      {/* Status Banner */}
      {isAccepted && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-300">Quote Accepted</p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Thank you! We will process your order shortly.
            </p>
          </div>
        </div>
      )}
      
      {isRejected && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-3">
          <XCircle className="h-6 w-6 text-red-600" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-300">Quote Declined</p>
            <p className="text-sm text-red-600 dark:text-red-400">
              This quote has been declined. Contact us if you change your mind.
            </p>
          </div>
        </div>
      )}
      
      {isExpired && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-300">Quote Expired</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              This quote has expired. Please contact us for an updated quote.
            </p>
          </div>
        </div>
      )}
      
      {/* Main Card */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl mb-1">
                {quote.title || `Quote ${quote.quote_number}`}
              </CardTitle>
              <p className="text-muted-foreground">
                Quote #{quote.quote_number}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold">
                {formatQuoteCurrency(quote.total, quote.currency)}
              </div>
              {quote.valid_until && !isExpired && daysUntilExpiry !== null && (
                <p className={cn(
                  "text-sm mt-1",
                  daysUntilExpiry <= 3 ? "text-amber-600" : "text-muted-foreground"
                )}>
                  <Clock className="h-3 w-3 inline mr-1" />
                  Valid for {daysUntilExpiry} more day{daysUntilExpiry !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Introduction */}
          {quote.introduction && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <p className="whitespace-pre-wrap">{quote.introduction}</p>
            </div>
          )}
          
          {/* Quote Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quote Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quote Number</span>
                  <span>{quote.quote_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(new Date(quote.created_at), 'MMMM d, yyyy')}</span>
                </div>
                {quote.valid_until && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid Until</span>
                    <span className={expired ? 'text-red-600' : ''}>
                      {format(new Date(quote.valid_until), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Prepared For
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{quote.customer_name}</p>
                {quote.customer_company && (
                  <p className="text-muted-foreground">{quote.customer_company}</p>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{quote.customer_email}</span>
                </div>
                {quote.customer_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{quote.customer_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Line Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Item</th>
                    <th className="text-right p-3 font-medium w-20">Qty</th>
                    <th className="text-right p-3 font-medium w-28">Price</th>
                    <th className="text-right p-3 font-medium w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items?.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">
                        {formatQuoteCurrency(item.unit_price, quote.currency)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatQuoteCurrency(item.line_total, quote.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatQuoteCurrency(quote.subtotal, quote.currency)}</span>
              </div>
              {quote.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatQuoteCurrency(quote.discount_amount, quote.currency)}</span>
                </div>
              )}
              {quote.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatQuoteCurrency(quote.tax_amount, quote.currency)}</span>
                </div>
              )}
              {quote.shipping_amount > 0 && (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatQuoteCurrency(quote.shipping_amount, quote.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatQuoteCurrency(quote.total, quote.currency)}</span>
              </div>
            </div>
          </div>
          
          {/* Notes to Customer */}
          {quote.notes_to_customer && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Notes</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap">
                {quote.notes_to_customer}
              </p>
            </div>
          )}
          
          {/* Terms & Conditions */}
          {quote.terms_and_conditions && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Terms & Conditions</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-muted/30 rounded-lg max-h-48 overflow-auto">
                {quote.terms_and_conditions}
              </div>
            </div>
          )}
          
          <Separator className="my-6" />
          
          {/* Action Buttons */}
          {canRespond && !showAcceptForm && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1"
                size="lg"
                onClick={() => setShowAcceptForm(true)}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Accept Quote
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="h-5 w-5 mr-2" />
                Decline
              </Button>
            </div>
          )}
          
          {/* Accept Form */}
          {showAcceptForm && (
            <QuoteAcceptForm
              token={token}
              quoteName={quote.customer_name}
              onAccepted={handleAccepted}
              onCancel={() => setShowAcceptForm(false)}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Download PDF Button */}
      <div className="text-center">
        <Button variant="outline" disabled>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <p className="text-xs text-muted-foreground mt-2">PDF download coming soon</p>
      </div>
      
      {/* Reject Dialog */}
      <QuoteRejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        token={token}
        onRejected={handleRejected}
      />
    </div>
  )
}
