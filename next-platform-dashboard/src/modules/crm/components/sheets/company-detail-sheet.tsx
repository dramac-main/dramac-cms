/**
 * Company Detail Sheet
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Slide-over sheet showing company details with edit capability
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCRM } from '../../context/crm-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Loader2, 
  Pencil, 
  Save, 
  X,
  Globe,
  Phone,
  Users,
  DollarSign,
  MapPin,
  Building2,
  ExternalLink,
  User
} from 'lucide-react'
import type { CompanyUpdate, CompanyStatus, CompanyType, Contact } from '../../types/crm-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
interface CompanyDetailSheetProps {
  companyId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatCurrency(value: number | null | undefined): string {
  if (!value) return '-'
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Contact card within company
function ContactCard({ contact }: { contact: Contact }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
      <Avatar className="h-10 w-10">
        <AvatarFallback>
          {contact.first_name?.[0]}{contact.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">
          {contact.first_name} {contact.last_name}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {contact.job_title || contact.email}
        </div>
      </div>
    </div>
  )
}

export function CompanyDetailSheet({
  companyId,
  open,
  onOpenChange
}: CompanyDetailSheetProps) {
  const { companies, contacts, deals, editCompany, removeCompany } = useCRM()
  
  // State
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<CompanyUpdate>({})
  
  // Get company
  const company = companies.find(c => c.id === companyId)
  
  // Get related contacts and deals
  const companyContacts = useMemo(() => 
    contacts.filter(c => c.company_id === companyId),
    [contacts, companyId]
  )
  
  const companyDeals = useMemo(() =>
    deals.filter(d => d.company_id === companyId),
    [deals, companyId]
  )
  
  // Initialize form data when company changes
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        account_type: company.account_type,
        status: company.status,
        employee_count: company.employee_count,
        annual_revenue: company.annual_revenue,
        phone: company.phone,
        website: company.website,
        description: company.description,
        address_line_1: company.address_line_1,
        address_line_2: company.address_line_2,
        city: company.city,
        state: company.state,
        postal_code: company.postal_code,
        country: company.country
      })
    }
  }, [company])
  
  // Reset editing state when sheet closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
    }
  }, [open])
  
  // Handle field change
  const handleChange = (field: keyof CompanyUpdate, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  // Handle save
  const handleSave = async () => {
    if (!companyId) return
    
    setIsSaving(true)
    try {
      await editCompany(companyId, formData)
      toast.success('Company updated')
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update company:', error)
      toast.error('Failed to update company')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle delete
  const handleDelete = async () => {
    if (!companyId) return
    
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return
    }
    
    try {
      await removeCompany(companyId)
      toast.success('Company deleted')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete company:', error)
      toast.error('Failed to delete company')
    }
  }
  
  if (!company) {
    return null
  }
  
  const initials = company.name.slice(0, 2).toUpperCase()
  const statusColors = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    archived: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }
  
  const typeColors = {
    prospect: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    customer: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    partner: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    vendor: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    competitor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary/10">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">{company.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  {company.industry && <span className="capitalize">{company.industry}</span>}
                  {company.domain && (
                    <a 
                      href={`https://${company.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {company.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </SheetDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {company.account_type && (
                <Badge className={typeColors[company.account_type] || 'bg-gray-100 text-gray-800'}>
                  {company.account_type}
                </Badge>
              )}
              <Badge className={statusColors[company.status]}>
                {company.status}
              </Badge>
            </div>
          </div>
        </SheetHeader>
        
        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="contacts" className="flex-1">
              Contacts ({companyContacts.length})
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex-1">
              Deals ({companyDeals.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4 space-y-4">
            {/* Edit/Save buttons */}
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            
            {/* Company Info */}
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label>Company Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                ) : (
                  <div className="text-sm">{company.name}</div>
                )}
              </div>
              
              <Separator />
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      value={formData.website || ''}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="Website"
                      className="flex-1"
                    />
                  ) : (
                    company.website ? (
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {company.website}
                      </a>
                    ) : <span className="text-sm">-</span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="Phone"
                      className="flex-1"
                    />
                  ) : (
                    <span className="text-sm">{company.phone || '-'}</span>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Company Size */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Employees
                  </Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={formData.employee_count || ''}
                      onChange={(e) => handleChange('employee_count', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  ) : (
                    <div className="text-sm">{company.employee_count || '-'}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Annual Revenue
                  </Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={formData.annual_revenue || ''}
                      onChange={(e) => handleChange('annual_revenue', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  ) : (
                    <div className="text-sm">{formatCurrency(company.annual_revenue)}</div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  {isEditing ? (
                    <Select
                      value={formData.account_type || ''}
                      onValueChange={(v) => handleChange('account_type', v as CompanyType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="competitor">Competitor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    company.account_type ? (
                      <Badge className={typeColors[company.account_type] || 'bg-gray-100 text-gray-800'}>
                        {company.account_type}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  {isEditing ? (
                    <Select
                      value={formData.status}
                      onValueChange={(v) => handleChange('status', v as CompanyStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={statusColors[company.status]}>
                      {company.status}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Address */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={formData.address_line_1 || ''}
                      onChange={(e) => handleChange('address_line_1', e.target.value)}
                      placeholder="Street address"
                    />
                    <Input
                      value={formData.address_line_2 || ''}
                      onChange={(e) => handleChange('address_line_2', e.target.value)}
                      placeholder="Apt, suite, etc."
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={formData.city || ''}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="City"
                      />
                      <Input
                        value={formData.state || ''}
                        onChange={(e) => handleChange('state', e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={formData.postal_code || ''}
                        onChange={(e) => handleChange('postal_code', e.target.value)}
                        placeholder="Postal code"
                      />
                      <Input
                        value={formData.country || ''}
                        onChange={(e) => handleChange('country', e.target.value)}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {company.address_line_1 ? (
                      <>
                        {company.address_line_1}<br />
                        {company.address_line_2 && <>{company.address_line_2}<br /></>}
                        {company.city}, {company.state} {company.postal_code}<br />
                        {company.country}
                      </>
                    ) : (
                      'No address'
                    )}
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {company.description || 'No description'}
                  </div>
                )}
              </div>
              
              {/* Metadata */}
              <div className="text-xs text-muted-foreground space-y-1 pt-4">
                <div>Created: {new Date(company.created_at).toLocaleString()}</div>
                <div>Updated: {new Date(company.updated_at).toLocaleString()}</div>
              </div>
              
              {/* Delete button */}
              <div className="pt-4">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete}
                >
                  Delete Company
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="contacts" className="mt-4">
            {companyContacts.length > 0 ? (
              <div className="space-y-2">
                {companyContacts.map(contact => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No contacts at this company
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="deals" className="mt-4">
            {companyDeals.length > 0 ? (
              <div className="space-y-2">
                {companyDeals.map(deal => (
                  <div 
                    key={deal.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                  >
                    <div>
                      <div className="font-medium text-sm">{deal.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.stage?.name || 'No stage'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(deal.amount || 0)}</div>
                      <Badge variant={
                        deal.status === 'won' ? 'default' :
                        deal.status === 'lost' ? 'destructive' :
                        'secondary'
                      }>
                        {deal.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No deals with this company
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

export default CompanyDetailSheet
