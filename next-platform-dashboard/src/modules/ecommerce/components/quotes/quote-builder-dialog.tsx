/**
 * Quote Builder Dialog Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * Multi-tab dialog for creating/editing quotes
 */
'use client'

import { useState, useEffect } from 'react'
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@/lib/locale-config'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Loader2, 
  User, 
  Package, 
  Coins, 
  FileText,
  Save
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useEcommerce } from '../../context/ecommerce-context'
import { QuoteItemsEditor } from './quote-items-editor'
import { getCustomers } from '../../actions/customer-actions'
import { 
  createQuote, 
  updateQuote, 
  getQuote,
  addQuoteItem,
  updateQuoteItem,
  removeQuoteItem
} from '../../actions/quote-actions'
import { 
  formatQuoteCurrency, 
  calculateQuoteTotals,
  getDefaultExpiryDate 
} from '../../lib/quote-utils'
import type { 
  Quote, 
  QuoteItem, 
  QuoteInput, 
  QuoteUpdate,
  QuoteItemInput,
  Customer
} from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quoteId?: string // If provided, edit mode
  siteId: string
  agencyId: string
  userId?: string
  userName?: string
  onSaved?: (quote: Quote) => void
}

type Tab = 'customer' | 'items' | 'pricing' | 'content'

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteBuilderDialog({
  open,
  onOpenChange,
  quoteId,
  siteId,
  agencyId,
  userId,
  userName,
  onSaved
}: QuoteBuilderDialogProps) {
  const { products } = useEcommerce()
  const isEditMode = !!quoteId
  
  // State
  const [activeTab, setActiveTab] = useState<Tab>('customer')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  
  // Form state
  const [customerId, setCustomerId] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerCompany, setCustomerCompany] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [shippingAmount, setShippingAmount] = useState(0)
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const [validUntil, setValidUntil] = useState(
    format(getDefaultExpiryDate(30), 'yyyy-MM-dd')
  )
  
  const [title, setTitle] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [terms, setTerms] = useState('')
  const [notesToCustomer, setNotesToCustomer] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  // Load customers when dialog opens
  useEffect(() => {
    if (open && siteId) {
      loadCustomers()
    }
  }, [open, siteId])

  const loadCustomers = async () => {
    try {
      const result = await getCustomers(siteId)
      setCustomers(result)
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  // Reset form when dialog closes or opens
  useEffect(() => {
    if (!open) {
      resetForm()
      return
    }
    
    if (isEditMode && quoteId) {
      loadQuote()
    }
  }, [open, quoteId, isEditMode])
  
  const resetForm = () => {
    setActiveTab('customer')
    setQuote(null)
    setItems([])
    setCustomerId('')
    setCustomerEmail('')
    setCustomerName('')
    setCustomerCompany('')
    setCustomerPhone('')
    setDiscountType('percentage')
    setDiscountValue(0)
    setTaxRate(0)
    setShippingAmount(0)
    setCurrency(DEFAULT_CURRENCY)
    setValidUntil(format(getDefaultExpiryDate(30), 'yyyy-MM-dd'))
    setTitle('')
    setIntroduction('')
    setTerms('')
    setNotesToCustomer('')
    setInternalNotes('')
  }
  
  const loadQuote = async () => {
    if (!quoteId) return
    
    setIsLoading(true)
    try {
      const data = await getQuote(siteId, quoteId)
      if (data) {
        setQuote(data)
        setItems(data.items || [])
        
        // Populate form
        setCustomerId(data.customer_id || '')
        setCustomerEmail(data.customer_email)
        setCustomerName(data.customer_name)
        setCustomerCompany(data.customer_company || '')
        setCustomerPhone(data.customer_phone || '')
        setDiscountType(data.discount_type || 'percentage')
        setDiscountValue(data.discount_value || 0)
        setTaxRate(data.tax_rate || 0)
        setShippingAmount(data.shipping_amount || 0)
        setCurrency(data.currency)
        if (data.valid_until) {
          setValidUntil(format(new Date(data.valid_until), 'yyyy-MM-dd'))
        }
        setTitle(data.title || '')
        setIntroduction(data.introduction || '')
        setTerms(data.terms_and_conditions || '')
        setNotesToCustomer(data.notes_to_customer || '')
        setInternalNotes(data.internal_notes || '')
      }
    } catch (error) {
      console.error('Error loading quote:', error)
      toast.error('Failed to load quote')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle customer selection
  const handleCustomerSelect = (id: string) => {
    setCustomerId(id)
    
    if (id === 'new') {
      setCustomerEmail('')
      setCustomerName('')
      setCustomerCompany('')
      setCustomerPhone('')
    } else {
      const customer = customers.find(c => c.id === id)
      if (customer) {
        setCustomerEmail(customer.email)
        setCustomerName(`${customer.first_name} ${customer.last_name}`)
        setCustomerCompany('')
        setCustomerPhone(customer.phone || '')
      }
    }
  }
  
  // Handle item operations
  const handleAddItems = async (newItems: Partial<Omit<QuoteItemInput, 'quote_id'>>[]) => {
    if (isEditMode && quote) {
      // Add to existing quote
      for (const item of newItems) {
        const result = await addQuoteItem(siteId, {
          quote_id: quote.id,
          name: item.name || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          product_id: item.product_id,
          variant_id: item.variant_id,
          sku: item.sku,
          description: item.description,
          image_url: item.image_url,
          discount_percent: item.discount_percent,
          tax_rate: item.tax_rate,
          options: item.options,
          sort_order: item.sort_order
        }, userId, userName)
        
        if (result.success && result.item) {
          setItems(prev => [...prev, result.item!])
        }
      }
      
      // Reload quote to get updated totals
      await loadQuote()
    } else {
      // Add to local state (will be saved with quote)
      const tempItems: QuoteItem[] = newItems.map((item, index) => ({
        id: `temp-${Date.now()}-${index}`,
        quote_id: '',
        name: item.name || '',
        product_id: item.product_id || null,
        variant_id: item.variant_id || null,
        sku: item.sku || null,
        description: item.description || null,
        image_url: item.image_url || null,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        discount_percent: item.discount_percent || 0,
        tax_rate: item.tax_rate || 0,
        line_total: (item.quantity || 1) * (item.unit_price || 0),
        options: item.options || {},
        sort_order: items.length + index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      setItems(prev => [...prev, ...tempItems])
    }
  }
  
  const handleUpdateItem = async (itemId: string, updates: Partial<QuoteItem>) => {
    if (isEditMode && quote && !itemId.startsWith('temp-')) {
      // Convert null values to undefined for the API
      const cleanUpdates = {
        ...updates,
        product_id: updates.product_id ?? undefined,
        variant_id: updates.variant_id ?? undefined,
        sku: updates.sku ?? undefined,
        description: updates.description ?? undefined,
        image_url: updates.image_url ?? undefined
      }
      await updateQuoteItem(siteId, quote.id, itemId, cleanUpdates, userId, userName)
      await loadQuote()
    } else {
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ))
    }
  }
  
  const handleRemoveItem = async (itemId: string) => {
    if (isEditMode && quote && !itemId.startsWith('temp-')) {
      await removeQuoteItem(siteId, quote.id, itemId, userId, userName)
      await loadQuote()
    } else {
      setItems(prev => prev.filter(item => item.id !== itemId))
    }
  }
  
  // Calculate totals
  const totals = calculateQuoteTotals(
    items,
    { type: discountType, value: discountValue },
    shippingAmount,
    taxRate
  )
  
  // Save quote
  const handleSave = async () => {
    // Validation
    if (!customerEmail || !customerName) {
      toast.error('Customer email and name are required')
      setActiveTab('customer')
      return
    }
    
    if (items.length === 0) {
      toast.error('Add at least one item to the quote')
      setActiveTab('items')
      return
    }
    
    setIsSaving(true)
    try {
      if (isEditMode && quote) {
        // Update existing quote
        const updates: QuoteUpdate = {
          customer_id: customerId !== 'new' ? customerId : undefined,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_company: customerCompany || undefined,
          customer_phone: customerPhone || undefined,
          discount_type: discountType,
          discount_value: discountValue,
          tax_rate: taxRate,
          shipping_amount: shippingAmount,
          currency,
          valid_until: new Date(validUntil).toISOString(),
          title: title || undefined,
          introduction: introduction || undefined,
          terms_and_conditions: terms || undefined,
          notes_to_customer: notesToCustomer || undefined,
          internal_notes: internalNotes || undefined
        }
        
        const result = await updateQuote(siteId, quote.id, updates, userId, userName)
        
        if (result.success && result.quote) {
          toast.success('Quote updated successfully')
          onSaved?.(result.quote)
          onOpenChange(false)
        } else {
          toast.error(result.error || 'Failed to update quote')
        }
      } else {
        // Create new quote
        const input: QuoteInput = {
          site_id: siteId,
          agency_id: agencyId,
          customer_id: customerId !== 'new' ? customerId : undefined,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_company: customerCompany || undefined,
          customer_phone: customerPhone || undefined,
          discount_type: discountType,
          discount_value: discountValue,
          tax_rate: taxRate,
          shipping_amount: shippingAmount,
          currency,
          valid_until: new Date(validUntil).toISOString(),
          title: title || undefined,
          introduction: introduction || undefined,
          terms_and_conditions: terms || undefined,
          notes_to_customer: notesToCustomer || undefined,
          internal_notes: internalNotes || undefined
        }
        
        const result = await createQuote(input, userId, userName)
        
        if (result.success && result.quote) {
          // Add items to the quote
          for (const item of items) {
            await addQuoteItem(siteId, {
              quote_id: result.quote.id,
              product_id: item.product_id ?? undefined,
              variant_id: item.variant_id ?? undefined,
              name: item.name,
              sku: item.sku ?? undefined,
              description: item.description ?? undefined,
              image_url: item.image_url ?? undefined,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_percent: item.discount_percent,
              tax_rate: item.tax_rate,
              options: item.options
            }, userId, userName)
          }
          
          toast.success(`Quote ${result.quote.quote_number} created successfully`)
          onSaved?.(result.quote)
          onOpenChange(false)
        } else {
          toast.error(result.error || 'Failed to create quote')
        }
      }
    } catch (error) {
      console.error('Error saving quote:', error)
      toast.error('Failed to save quote')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit Quote ${quote?.quote_number || ''}` : 'Create New Quote'}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="customer" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Customer</span>
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Items</span>
                  {items.length > 0 && (
                    <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                      {items.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  <span className="hidden sm:inline">Pricing</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Customer Tab */}
              <TabsContent value="customer" className="flex-1 overflow-auto">
                <div className="space-y-4 p-1">
                  <div className="space-y-2">
                    <Label>Select Customer</Label>
                    <Select value={customerId} onValueChange={handleCustomerSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer or add new..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">+ Add New Customer</SelectItem>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.first_name} {customer.last_name} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Name *</Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={customerCompany}
                        onChange={(e) => setCustomerCompany(e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+260 97 1234567"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Items Tab */}
              <TabsContent value="items" className="flex-1 overflow-auto">
                <div className="p-1">
                  <QuoteItemsEditor
                    items={items}
                    currency={currency}
                    onAddItems={handleAddItems}
                    onUpdateItem={handleUpdateItem}
                    onRemoveItem={handleRemoveItem}
                  />
                </div>
              </TabsContent>
              
              {/* Pricing Tab */}
              <TabsContent value="pricing" className="flex-1 overflow-auto">
                <div className="space-y-6 p-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.code} - {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valid Until</Label>
                      <Input
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Type</Label>
                      <Select 
                        value={discountType} 
                        onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Value</Label>
                      <Input
                        type="number"
                        min="0"
                        step={discountType === 'percentage' ? '1' : '0.01'}
                        max={discountType === 'percentage' ? '100' : undefined}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Shipping Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingAmount}
                      onChange={(e) => setShippingAmount(Number(e.target.value))}
                    />
                  </div>
                  
                  {/* Totals Summary */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-medium mb-4">Quote Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatQuoteCurrency(totals.subtotal, currency)}</span>
                      </div>
                      {totals.itemsDiscountTotal > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Item Discounts</span>
                          <span>-{formatQuoteCurrency(totals.itemsDiscountTotal, currency)}</span>
                        </div>
                      )}
                      {totals.quoteDiscountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Quote Discount</span>
                          <span>-{formatQuoteCurrency(totals.quoteDiscountAmount, currency)}</span>
                        </div>
                      )}
                      {totals.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Tax ({taxRate}%)</span>
                          <span>{formatQuoteCurrency(totals.taxAmount, currency)}</span>
                        </div>
                      )}
                      {totals.shippingAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span>{formatQuoteCurrency(totals.shippingAmount, currency)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-semibold text-base">
                        <span>Total</span>
                        <span>{formatQuoteCurrency(totals.total, currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Content Tab */}
              <TabsContent value="content" className="flex-1 overflow-auto">
                <div className="space-y-4 p-1">
                  <div className="space-y-2">
                    <Label>Quote Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Website Development Proposal"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Introduction</Label>
                    <Textarea
                      value={introduction}
                      onChange={(e) => setIntroduction(e.target.value)}
                      placeholder="Introduction message shown at the top of the quote..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Terms & Conditions</Label>
                    <Textarea
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      placeholder="Terms and conditions for this quote..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Notes to Customer</Label>
                    <Textarea
                      value={notesToCustomer}
                      onChange={(e) => setNotesToCustomer(e.target.value)}
                      placeholder="Any additional notes visible to the customer..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Internal Notes (Not visible to customer)</Label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Internal notes for your team..."
                      rows={2}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isEditMode ? 'Update Quote' : 'Create Quote'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
