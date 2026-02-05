/**
 * QuoteRequestBlock - Quote request form
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Form for customers to submit quote requests.
 */
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Loader2, 
  CheckCircle,
  ShoppingBag,
  AlertCircle
} from 'lucide-react'
import { useStorefront } from '../../context/storefront-context'
import { useQuotations, QuoteBuilderItem, QuoteRequestData } from '../../hooks/useQuotations'
import { QuoteItemCard } from './QuoteItemCard'
import { QuotePriceBreakdown } from './QuotePriceBreakdown'

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteRequestBlockProps {
  /** Display variant */
  variant?: 'default' | 'compact' | 'sidebar'
  /** Pre-filled customer info */
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  companyName?: string
  /** Show item management in form */
  showItems?: boolean
  /** Show pricing summary */
  showPricing?: boolean
  /** Required fields */
  requirePhone?: boolean
  requireCompany?: boolean
  /** Success callback */
  onSuccess?: (quoteId: string) => void
  /** Custom title */
  title?: string
  /** Custom description */
  description?: string
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteRequestBlock({
  variant: variantProp = 'default',
  customerName: initialName = '',
  customerEmail: initialEmail = '',
  customerPhone: initialPhone = '',
  companyName: initialCompany = '',
  showItems = true,
  showPricing = true,
  requirePhone = false,
  requireCompany = false,
  onSuccess,
  title = 'Request a Quote',
  description = 'Fill out the form below and we\'ll send you a customized quote.',
  className
}: QuoteRequestBlockProps) {
  const { siteId, formatPrice, settings } = useStorefront()
  const agencyId = settings?.agency_id
  
  const {
    builderItems,
    updateBuilderItem,
    removeFromBuilder,
    builderCount,
    submitQuoteRequest,
    isSubmitting,
    submitError
  } = useQuotations(siteId, agencyId)

  const variant = variantProp || 'default'

  const [formData, setFormData] = React.useState<QuoteRequestData>({
    customer_name: initialName,
    customer_email: initialEmail,
    customer_phone: initialPhone,
    company_name: initialCompany,
    notes: ''
  })
  
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [validationErrors, setValidationErrors] = React.useState<Partial<Record<keyof QuoteRequestData, string>>>({})

  // Update field
  const updateField = (field: keyof QuoteRequestData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Validate form
  const validate = (): boolean => {
    const errors: Partial<Record<keyof QuoteRequestData, string>> = {}

    if (!formData.customer_name.trim()) {
      errors.customer_name = 'Name is required'
    }
    
    if (!formData.customer_email.trim()) {
      errors.customer_email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      errors.customer_email = 'Invalid email address'
    }

    if (requirePhone && !formData.customer_phone?.trim()) {
      errors.customer_phone = 'Phone number is required'
    }

    if (requireCompany && !formData.company_name?.trim()) {
      errors.company_name = 'Company name is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    const result = await submitQuoteRequest(formData)
    
    if (result) {
      setIsSubmitted(true)
      onSuccess?.(result.id)
    }
  }

  // Success state
  if (isSubmitted) {
    return (
      <Card className={cn('text-center', className)}>
        <CardContent className="pt-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Quote Request Submitted!</h3>
          <p className="mt-2 text-gray-600">
            We&apos;ve received your request and will send your quote to{' '}
            <strong>{formData.customer_email}</strong> shortly.
          </p>
        </CardContent>
      </Card>
    )
  }

  // No items warning
  if (builderCount === 0 && showItems) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Items Selected</h3>
            <p className="mt-2 text-gray-500">
              Add products to your quote request before submitting.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="Your Name *"
              value={formData.customer_name}
              onChange={(e) => updateField('customer_name', e.target.value)}
              className={validationErrors.customer_name ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email *"
              value={formData.customer_email}
              onChange={(e) => updateField('customer_email', e.target.value)}
              className={validationErrors.customer_email ? 'border-red-500' : ''}
            />
          </div>
        </div>
        
        <Textarea
          placeholder="Notes (optional)"
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={2}
        />

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
          ) : (
            <><FileText className="mr-2 h-4 w-4" /> Submit Quote Request</>
          )}
        </Button>
      </form>
    )
  }

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {showPricing && (
            <QuotePriceBreakdown
              builderItems={builderItems}
              formatPrice={formatPrice}
              variant="compact"
            />
          )}

          <form id="quote-form-sidebar" onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="Your Name *"
              value={formData.customer_name}
              onChange={(e) => updateField('customer_name', e.target.value)}
              className={validationErrors.customer_name ? 'border-red-500' : ''}
            />
            <Input
              type="email"
              placeholder="Email *"
              value={formData.customer_email}
              onChange={(e) => updateField('customer_email', e.target.value)}
              className={validationErrors.customer_email ? 'border-red-500' : ''}
            />
            <Textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={2}
            />
          </form>

          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            type="submit" 
            form="quote-form-sidebar"
            disabled={isSubmitting} 
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Request Quote
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form id="quote-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Items section */}
          {showItems && builderItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Items ({builderCount})</h4>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {builderItems.map((item) => (
                  <QuoteItemCard
                    key={`${item.product_id}-${item.variant_id || ''}`}
                    builderItem={item}
                    variant="editable"
                    formatPrice={formatPrice}
                    onQuantityChange={(qty) => updateBuilderItem(item.product_id, { quantity: qty })}
                    onNotesChange={(notes) => updateBuilderItem(item.product_id, { notes })}
                    onRequestedPriceChange={(price) => updateBuilderItem(item.product_id, { requested_price: price })}
                    onRemove={() => removeFromBuilder(item.product_id)}
                  />
                ))}
              </div>

              {showPricing && (
                <div className="border-t pt-3">
                  <QuotePriceBreakdown
                    builderItems={builderItems}
                    formatPrice={formatPrice}
                    variant="default"
                  />
                </div>
              )}
            </div>
          )}

          {/* Customer info */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Your Information</h4>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => updateField('customer_name', e.target.value)}
                  placeholder="Your full name"
                  className={validationErrors.customer_name ? 'border-red-500' : ''}
                />
                {validationErrors.customer_name && (
                  <p className="text-sm text-red-500">{validationErrors.customer_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_email">Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => updateField('customer_email', e.target.value)}
                  placeholder="you@example.com"
                  className={validationErrors.customer_email ? 'border-red-500' : ''}
                />
                {validationErrors.customer_email && (
                  <p className="text-sm text-red-500">{validationErrors.customer_email}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_phone">
                  Phone {requirePhone ? '*' : '(optional)'}
                </Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => updateField('customer_phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={validationErrors.customer_phone ? 'border-red-500' : ''}
                />
                {validationErrors.customer_phone && (
                  <p className="text-sm text-red-500">{validationErrors.customer_phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">
                  Company {requireCompany ? '*' : '(optional)'}
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => updateField('company_name', e.target.value)}
                  placeholder="Your company name"
                  className={validationErrors.company_name ? 'border-red-500' : ''}
                />
                {validationErrors.company_name && (
                  <p className="text-sm text-red-500">{validationErrors.company_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Any special requirements or questions..."
                rows={3}
              />
            </div>
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>

      <CardFooter className="flex justify-end gap-3">
        <Button type="submit" form="quote-form" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
          ) : (
            <><FileText className="mr-2 h-4 w-4" /> Submit Quote Request</>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
