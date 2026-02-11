/**
 * Create Company Dialog
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Dialog for creating new companies
 */
'use client'

import { useState } from 'react'
import { useCRM } from '../../context/crm-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { CompanyStatus, CompanyType } from '../../types/crm-types'

interface FormData {
  name: string
  domain: string
  industry: string
  account_type: CompanyType
  status: CompanyStatus
  employee_count: string
  annual_revenue: string
  phone: string
  website: string
  description: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  country: string
}

const initialFormData: FormData = {
  name: '',
  domain: '',
  industry: '',
  account_type: 'prospect',
  status: 'active',
  employee_count: '',
  annual_revenue: '',
  phone: '',
  website: '',
  description: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: ''
}

interface CreateCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (companyId: string) => void
}

export function CreateCompanyDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateCompanyDialogProps) {
  const { addCompany } = useCRM()
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData)
  }

  // Handle input change
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Company name is required')
      return
    }

    setIsSubmitting(true)
    
    try {
      const company = await addCompany({
        site_id: '', // Will be set by the action
        name: formData.name,
        domain: formData.domain || null,
        description: formData.description || null,
        industry: formData.industry && formData.industry !== 'not_specified' ? formData.industry : null,
        account_type: formData.account_type,
        status: formData.status,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
        annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
        phone: formData.phone || null,
        website: formData.website || null,
        address_line_1: formData.address_line_1 || null,
        address_line_2: formData.address_line_2 || null,
        city: formData.city || null,
        state: formData.state || null,
        postal_code: formData.postal_code || null,
        country: formData.country || null,
        custom_fields: {},
        tags: []
      })
      
      if (company) {
        toast.success('Company created successfully')
        resetForm()
        onOpenChange(false)
        onSuccess?.(company.id)
      }
    } catch (error) {
      console.error('Failed to create company:', error)
      toast.error('Failed to create company')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Company</DialogTitle>
          <DialogDescription>
            Add a new company to your CRM
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Company name"
              disabled={isSubmitting}
            />
          </div>
          
          {/* Domain & Website */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => handleChange('domain', e.target.value)}
                placeholder="company.co.zm"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://company.co.zm"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          {/* Industry & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(v) => handleChange('industry', v)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_specified">Not specified</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+260 21X XXX XXX"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_type">Type</Label>
              <Select
                value={formData.account_type}
                onValueChange={(v) => handleChange('account_type', v)}
                disabled={isSubmitting}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => handleChange('status', v)}
                disabled={isSubmitting}
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
            </div>
          </div>
          
          {/* Company Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_count">Employees</Label>
              <Input
                id="employee_count"
                type="number"
                value={formData.employee_count}
                onChange={(e) => handleChange('employee_count', e.target.value)}
                placeholder="50"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual_revenue">Annual Revenue</Label>
              <Input
                id="annual_revenue"
                type="number"
                value={formData.annual_revenue}
                onChange={(e) => handleChange('annual_revenue', e.target.value)}
                placeholder="1000000"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          {/* Address */}
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={formData.address_line_1}
              onChange={(e) => handleChange('address_line_1', e.target.value)}
              placeholder="Street address"
              disabled={isSubmitting}
            />
            <Input
              value={formData.address_line_2}
              onChange={(e) => handleChange('address_line_2', e.target.value)}
              placeholder="Apt, suite, etc. (optional)"
              disabled={isSubmitting}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City"
                disabled={isSubmitting}
              />
              <Input
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="State"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="ZIP / Postal code"
                disabled={isSubmitting}
              />
              <Input
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Country"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the company..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Company
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateCompanyDialog
