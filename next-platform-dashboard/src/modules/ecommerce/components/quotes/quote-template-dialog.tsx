/**
 * Quote Template Dialog Component
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * Create/edit quote templates
 */
'use client'

import { useState, useEffect } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, FileText, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { 
  createQuoteTemplate, 
  updateQuoteTemplate 
} from '../../actions/quote-template-actions'
import type { QuoteTemplate, QuoteTemplateInput } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: QuoteTemplate | null
  siteId: string
  agencyId: string
  onSaved?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteTemplateDialog({
  open,
  onOpenChange,
  template,
  siteId,
  agencyId,
  onSaved
}: QuoteTemplateDialogProps) {
  const isEdit = !!template
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isActive, setIsActive] = useState(true)
  
  const [titleTemplate, setTitleTemplate] = useState('')
  const [introductionTemplate, setIntroductionTemplate] = useState('')
  const [termsAndConditions, setTermsAndConditions] = useState('')
  const [notesTemplate, setNotesTemplate] = useState('')
  
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [validityDays, setValidityDays] = useState(30)
  const [currency, setCurrency] = useState('USD')
  
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [showLogo, setShowLogo] = useState(true)
  
  // Load template data
  useEffect(() => {
    if (open && template) {
      setName(template.name)
      setDescription(template.description || '')
      setIsDefault(template.is_default)
      setIsActive(template.is_active)
      setTitleTemplate(template.default_title || '')
      setIntroductionTemplate(template.default_introduction || '')
      setTermsAndConditions(template.default_terms || '')
      setNotesTemplate(template.default_notes || '')
      setDiscountType(template.default_discount_type || 'percentage')
      setDiscountValue(template.default_discount_value)
      setTaxRate(0) // Not in existing interface
      setValidityDays(template.default_validity_days)
      setCurrency('USD') // Not in existing interface
      setPrimaryColor('#3b82f6') // Not in existing interface
      setShowLogo(true) // Not in existing interface
    } else if (open) {
      // Reset form for new template
      setName('')
      setDescription('')
      setIsDefault(false)
      setIsActive(true)
      setTitleTemplate('')
      setIntroductionTemplate('')
      setTermsAndConditions('')
      setNotesTemplate('')
      setDiscountType('percentage')
      setDiscountValue(0)
      setTaxRate(0)
      setValidityDays(30)
      setCurrency('USD')
      setPrimaryColor('#2563eb')
      setShowLogo(true)
    }
  }, [open, template])
  
  // Save handler
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required')
      return
    }
    
    setIsSaving(true)
    try {
      const input: QuoteTemplateInput = {
        site_id: siteId,
        agency_id: agencyId,
        name: name.trim(),
        description: description.trim() || undefined,
        is_default: isDefault,
        is_active: isActive,
        default_title: titleTemplate.trim() || undefined,
        default_introduction: introductionTemplate.trim() || undefined,
        default_terms: termsAndConditions.trim() || undefined,
        default_notes: notesTemplate.trim() || undefined,
        default_discount_type: discountType,
        default_discount_value: discountValue,
        default_validity_days: validityDays,
        items: []
      }
      
      let result
      if (isEdit && template) {
        result = await updateQuoteTemplate(siteId, template.id, input)
      } else {
        result = await createQuoteTemplate(input)
      }
      
      if (result.success) {
        toast.success(isEdit ? 'Template updated' : 'Template created')
        onSaved?.()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4 overflow-auto flex-1 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Quote"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe when to use this template..."
                rows={2}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Default Template</Label>
                <p className="text-sm text-muted-foreground">
                  Use this template by default for new quotes
                </p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Make this template available for use
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </TabsContent>
          
          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4 overflow-auto flex-1 mt-4">
            <div className="space-y-2">
              <Label htmlFor="titleTemplate">Default Quote Title</Label>
              <Input
                id="titleTemplate"
                value={titleTemplate}
                onChange={(e) => setTitleTemplate(e.target.value)}
                placeholder="e.g., Service Proposal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="introductionTemplate">Introduction</Label>
              <Textarea
                id="introductionTemplate"
                value={introductionTemplate}
                onChange={(e) => setIntroductionTemplate(e.target.value)}
                placeholder="Default introduction text..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
              <Textarea
                id="termsAndConditions"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Default terms and conditions..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notesTemplate">Notes Template</Label>
              <Textarea
                id="notesTemplate"
                value={notesTemplate}
                onChange={(e) => setNotesTemplate(e.target.value)}
                placeholder="Default notes to customer..."
                rows={2}
              />
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 overflow-auto flex-1 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                    <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                    <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Validity (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
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
                    <SelectItem value="percentage">Percentage</SelectItem>
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
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-16 rounded border cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#2563eb"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Company Logo</Label>
                <p className="text-sm text-muted-foreground">
                  Display logo on quote PDFs
                </p>
              </div>
              <Switch checked={showLogo} onCheckedChange={setShowLogo} />
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEdit ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
