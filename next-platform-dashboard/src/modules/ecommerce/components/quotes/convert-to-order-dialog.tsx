/**
 * Convert to Order Dialog Component
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Convert accepted quotes to orders.
 * Requires shipping address (pre-populated from customer's saved address if available).
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
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowRightCircle, 
  Loader2, 
  Package,
  FileText,
  CircleCheck,
  AlertCircle,
  MapPin,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { getQuote } from '../../actions/quote-actions'
import { convertQuoteToOrder } from '../../actions/quote-workflow-actions'
import { formatQuoteCurrency } from '../../lib/quote-utils'
import { QuoteStatusBadge } from './quote-status-badge'
import { getCountryList } from '../../lib/settings-utils'
import type { Quote } from '../../types/ecommerce-types'
import type { Address } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ConvertToOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quoteId: string
  siteId: string
  userId?: string
  userName?: string
  onConverted?: (orderId: string) => void
}

const EMPTY_ADDRESS: Partial<Address> = {
  first_name: '',
  last_name: '',
  address_line_1: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'ZM',
}

const COUNTRIES = getCountryList()

// Zambian provinces
const ZM_PROVINCES = [
  'Central', 'Copperbelt', 'Eastern', 'Luapula', 'Lusaka',
  'Muchinga', 'Northern', 'North-Western', 'Southern', 'Western',
]

// ============================================================================
// COMPONENT
// ============================================================================

export function ConvertToOrderDialog({
  open,
  onOpenChange,
  quoteId,
  siteId,
  userId,
  userName,
  onConverted
}: ConvertToOrderDialogProps) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConverting, setIsConverting] = useState(false)
  
  // Form state
  const [includeNotes, setIncludeNotes] = useState(true)
  const [customNotes, setCustomNotes] = useState('')
  
  // Address state
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>(EMPTY_ADDRESS)
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>(EMPTY_ADDRESS)
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [addressErrors, setAddressErrors] = useState<string[]>([])
  
  // Load quote data and pre-fill address from customer's saved address
  useEffect(() => {
    if (!open || !quoteId) return
    
    async function loadQuote() {
      setIsLoading(true)
      setAddressErrors([])
      try {
        const data = await getQuote(siteId, quoteId)
        setQuote(data)
        
        // Pre-fill address: quote address > customer defaults > name from quote
        if (data) {
          let prefilled: Partial<Address> | null = null
          
          // 1. Use address from quote if available
          if (data.shipping_address?.address_line_1) {
            prefilled = data.shipping_address
          } else if (data.billing_address?.address_line_1) {
            prefilled = data.billing_address
          }
          
          // 2. Try customer's saved addresses
          if (!prefilled && data.customer_id) {
            try {
              const { getCustomerDetail } = await import('../../actions/customer-actions')
              const customer = await getCustomerDetail(siteId, data.customer_id)
              if (customer?.addresses?.length) {
                const defaultShipping = customer.addresses.find(
                  (a: { is_default_shipping?: boolean }) => a.is_default_shipping
                )
                const defaultBilling = customer.addresses.find(
                  (a: { is_default_billing?: boolean }) => a.is_default_billing
                )
                const addr = defaultShipping || defaultBilling || customer.addresses[0]
                if (addr) {
                  prefilled = {
                    first_name: addr.first_name || '',
                    last_name: addr.last_name || '',
                    company: addr.company || '',
                    address_line_1: addr.address_line_1 || '',
                    address_line_2: addr.address_line_2 || '',
                    city: addr.city || '',
                    state: addr.state || '',
                    postal_code: addr.postal_code || '',
                    country: addr.country || 'ZM',
                    phone: addr.phone || '',
                  }
                  
                  // Also pre-fill billing if they have a default billing
                  if (defaultBilling && defaultBilling !== (defaultShipping || customer.addresses[0])) {
                    setBillingAddress({
                      first_name: defaultBilling.first_name || '',
                      last_name: defaultBilling.last_name || '',
                      company: defaultBilling.company || '',
                      address_line_1: defaultBilling.address_line_1 || '',
                      address_line_2: defaultBilling.address_line_2 || '',
                      city: defaultBilling.city || '',
                      state: defaultBilling.state || '',
                      postal_code: defaultBilling.postal_code || '',
                      country: defaultBilling.country || 'ZM',
                      phone: defaultBilling.phone || '',
                    })
                    setSameAsBilling(false)
                  }
                }
              }
            } catch {
              // Continue without customer addresses
            }
          }
          
          // 3. Fallback: use customer name from quote
          if (!prefilled) {
            const nameParts = (data.customer_name || '').trim().split(' ')
            prefilled = {
              ...EMPTY_ADDRESS,
              first_name: nameParts[0] || '',
              last_name: nameParts.slice(1).join(' ') || '',
              phone: data.customer_phone || '',
              company: data.customer_company || '',
            }
          }
          
          setShippingAddress(prefilled)
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
  
  // Validate address has required fields
  function validateAddress(addr: Partial<Address>): string[] {
    const errors: string[] = []
    if (!addr.first_name?.trim()) errors.push('First name is required')
    if (!addr.last_name?.trim()) errors.push('Last name is required')
    if (!addr.address_line_1?.trim()) errors.push('Address is required')
    if (!addr.city?.trim()) errors.push('City is required')
    if (!addr.state?.trim()) errors.push('State/Province is required')
    if (!addr.postal_code?.trim()) errors.push('Postal code is required')
    if (!addr.country?.trim()) errors.push('Country is required')
    return errors
  }
  
  // Handle convert
  const handleConvert = async () => {
    if (!quote) return
    
    // Validate shipping address
    const errors = validateAddress(shippingAddress)
    if (errors.length > 0) {
      setAddressErrors(errors)
      toast.error('Please fill in the required shipping address fields')
      return
    }
    
    // Validate billing address if different
    if (!sameAsBilling) {
      const billingErrors = validateAddress(billingAddress)
      if (billingErrors.length > 0) {
        setAddressErrors(billingErrors.map(e => `Billing: ${e}`))
        toast.error('Please fill in the required billing address fields')
        return
      }
    }
    
    setAddressErrors([])
    setIsConverting(true)
    try {
      const finalBilling = sameAsBilling ? shippingAddress : billingAddress
      
      const result = await convertQuoteToOrder({
        quote_id: quoteId,
        site_id: siteId,
        include_notes: includeNotes,
        custom_order_notes: customNotes || undefined,
        user_id: userId,
        user_name: userName,
        shipping_address: shippingAddress as Address,
        billing_address: finalBilling as Address,
      })
      
      if (result.success && result.order) {
        toast.success(`Order ${result.order.order_number} created successfully`)
        onConverted?.(result.order.id)
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to convert quote')
      }
    } catch (error) {
      console.error('Error converting quote:', error)
      toast.error('Failed to convert quote')
    } finally {
      setIsConverting(false)
    }
  }
  
  const canConvert = quote?.status === 'accepted'
  
  const handleAddressField = (
    setter: React.Dispatch<React.SetStateAction<Partial<Address>>>,
    field: keyof Address,
    value: string
  ) => {
    setter(prev => ({ ...prev, [field]: value }))
    if (addressErrors.length > 0) setAddressErrors([])
  }
  
  const isZambia = (shippingAddress.country || 'ZM') === 'ZM'
  const isBillingZambia = (billingAddress.country || 'ZM') === 'ZM'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightCircle className="h-5 w-5" />
            Convert to Order
          </DialogTitle>
          <DialogDescription>
            Create a new order from this accepted quote
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
        ) : !canConvert ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Cannot convert this quote</p>
                <p className="text-sm">Only accepted quotes can be converted to orders.</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{quote.quote_number}</span>
                <QuoteStatusBadge status={quote.status} size="sm" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quote Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="font-semibold">{quote.quote_number}</span>
                    <QuoteStatusBadge status={quote.status} size="sm" />
                  </div>
                  {quote.title && (
                    <p className="text-sm text-muted-foreground">{quote.title}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{quote.customer_name}</span>
                </div>
                {quote.items && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span>{quote.items.length}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatQuoteCurrency(quote.total, quote.currency)}</span>
                </div>
              </div>
            </div>
            
            {/* Acceptance Info */}
            {quote.responded_at && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                <CircleCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Quote Accepted
                  </p>
                  <p className="text-green-600 dark:text-green-400">
                    {quote.metadata?.accepted_by_name 
                      ? `By ${quote.metadata.accepted_by_name} on `
                      : 'On '
                    }
                    {format(new Date(quote.responded_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Shipping Address */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </h4>
              
              {addressErrors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                  <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                    {addressErrors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">First name *</Label>
                  <Input
                    value={shippingAddress.first_name || ''}
                    onChange={(e) => handleAddressField(setShippingAddress, 'first_name', e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Last name *</Label>
                  <Input
                    value={shippingAddress.last_name || ''}
                    onChange={(e) => handleAddressField(setShippingAddress, 'last_name', e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Address *</Label>
                <Input
                  value={shippingAddress.address_line_1 || ''}
                  onChange={(e) => handleAddressField(setShippingAddress, 'address_line_1', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Apartment, suite, etc. (optional)</Label>
                <Input
                  value={shippingAddress.address_line_2 || ''}
                  onChange={(e) => handleAddressField(setShippingAddress, 'address_line_2', e.target.value)}
                  placeholder="Apt 4B"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Country *</Label>
                <Select
                  value={shippingAddress.country || 'ZM'}
                  onValueChange={(value) => {
                    setShippingAddress(prev => ({ ...prev, country: value, state: '' }))
                    if (addressErrors.length > 0) setAddressErrors([])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">City *</Label>
                  <Input
                    value={shippingAddress.city || ''}
                    onChange={(e) => handleAddressField(setShippingAddress, 'city', e.target.value)}
                    placeholder="Lusaka"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isZambia ? 'Province *' : 'State *'}</Label>
                  {isZambia ? (
                    <Select
                      value={shippingAddress.state || ''}
                      onValueChange={(value) => handleAddressField(setShippingAddress, 'state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {ZM_PROVINCES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={shippingAddress.state || ''}
                      onChange={(e) => handleAddressField(setShippingAddress, 'state', e.target.value)}
                      placeholder="State"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Postal code *</Label>
                  <Input
                    value={shippingAddress.postal_code || ''}
                    onChange={(e) => handleAddressField(setShippingAddress, 'postal_code', e.target.value)}
                    placeholder="10101"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Phone (optional)</Label>
                <Input
                  value={shippingAddress.phone || ''}
                  onChange={(e) => handleAddressField(setShippingAddress, 'phone', e.target.value)}
                  placeholder="+260 97 123 4567"
                />
              </div>
              
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="sameAsBilling"
                  checked={sameAsBilling}
                  onCheckedChange={(checked) => setSameAsBilling(checked as boolean)}
                />
                <Label htmlFor="sameAsBilling" className="cursor-pointer text-sm">
                  Billing address same as shipping
                </Label>
              </div>
            </div>
            
            {/* Billing Address (if different) */}
            {!sameAsBilling && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Billing Address
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">First name *</Label>
                    <Input
                      value={billingAddress.first_name || ''}
                      onChange={(e) => handleAddressField(setBillingAddress, 'first_name', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Last name *</Label>
                    <Input
                      value={billingAddress.last_name || ''}
                      onChange={(e) => handleAddressField(setBillingAddress, 'last_name', e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Address *</Label>
                  <Input
                    value={billingAddress.address_line_1 || ''}
                    onChange={(e) => handleAddressField(setBillingAddress, 'address_line_1', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Apartment, suite, etc. (optional)</Label>
                  <Input
                    value={billingAddress.address_line_2 || ''}
                    onChange={(e) => handleAddressField(setBillingAddress, 'address_line_2', e.target.value)}
                    placeholder="Apt 4B"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Country *</Label>
                  <Select
                    value={billingAddress.country || 'ZM'}
                    onValueChange={(value) => {
                      setBillingAddress(prev => ({ ...prev, country: value, state: '' }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">City *</Label>
                    <Input
                      value={billingAddress.city || ''}
                      onChange={(e) => handleAddressField(setBillingAddress, 'city', e.target.value)}
                      placeholder="Lusaka"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{isBillingZambia ? 'Province *' : 'State *'}</Label>
                    {isBillingZambia ? (
                      <Select
                        value={billingAddress.state || ''}
                        onValueChange={(value) => handleAddressField(setBillingAddress, 'state', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Province" />
                        </SelectTrigger>
                        <SelectContent>
                          {ZM_PROVINCES.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={billingAddress.state || ''}
                        onChange={(e) => handleAddressField(setBillingAddress, 'state', e.target.value)}
                        placeholder="State"
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Postal code *</Label>
                    <Input
                      value={billingAddress.postal_code || ''}
                      onChange={(e) => handleAddressField(setBillingAddress, 'postal_code', e.target.value)}
                      placeholder="10101"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Phone (optional)</Label>
                  <Input
                    value={billingAddress.phone || ''}
                    onChange={(e) => handleAddressField(setBillingAddress, 'phone', e.target.value)}
                    placeholder="+260 97 123 4567"
                  />
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeNotes"
                  checked={includeNotes}
                  onCheckedChange={(checked) => setIncludeNotes(checked as boolean)}
                />
                <Label htmlFor="includeNotes" className="cursor-pointer">
                  Include quote notes in order
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customNotes">Additional Order Notes (optional)</Label>
                <Textarea
                  id="customNotes"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Add any additional notes for the order..."
                  rows={3}
                />
              </div>
            </div>
            
            {/* What will be created */}
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg p-4">
              <h4 className="font-medium text-primary dark:text-primary/80 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                New Order Will Include:
              </h4>
              <ul className="text-sm text-primary/80 dark:text-primary/70 space-y-1">
                <li>• All {quote.items?.length || 0} line items from the quote</li>
                <li>• Customer information: {quote.customer_name}</li>
                <li>• Pricing: {formatQuoteCurrency(quote.total, quote.currency)}</li>
                <li>• Order status: Pending</li>
                <li>• Payment status: Pending</li>
              </ul>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConvert} disabled={isConverting}>
                {isConverting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRightCircle className="h-4 w-4 mr-2" />
                )}
                Convert to Order
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
