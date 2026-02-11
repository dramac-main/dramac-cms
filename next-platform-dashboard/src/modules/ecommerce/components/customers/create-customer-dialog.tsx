/**
 * Create Customer Dialog
 * 
 * Phase ECOM-05: Customer Management System
 * 
 * Dialog for creating new customers
 */
'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { createCustomer } from '../../actions/customer-actions'
import type { CustomerStatus } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface CreateCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  agencyId: string
  onSuccess?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateCustomerDialog({ 
  open, 
  onOpenChange,
  siteId,
  agencyId,
  onSuccess
}: CreateCustomerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Basic Info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<CustomerStatus>('active')
  
  // Marketing
  const [acceptsMarketing, setAcceptsMarketing] = useState(false)
  
  // Address (optional)
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('US')
  
  // Notes
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setStatus('active')
    setAcceptsMarketing(false)
    setAddressLine1('')
    setAddressLine2('')
    setCity('')
    setState('')
    setPostalCode('')
    setCountry('US')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!firstName.trim()) {
      toast.error('First name is required')
      return
    }
    
    if (!lastName.trim()) {
      toast.error('Last name is required')
      return
    }
    
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      await createCustomer(siteId, agencyId, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        status,
        is_guest: status === 'guest',
        email_verified: false,
        accepts_marketing: acceptsMarketing,
        tags: [],
        metadata: notes ? { initial_notes: notes } : {}
      })

      toast.success('Customer created successfully')
      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to create customer')
      }
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Create a new customer record for your store
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Basic Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+260 97 1234567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CustomerStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Marketing Preferences */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Marketing Preferences</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="acceptsMarketing">Email Marketing</Label>
                <p className="text-sm text-muted-foreground">
                  Customer agrees to receive marketing emails
                </p>
              </div>
              <Switch
                id="acceptsMarketing"
                checked={acceptsMarketing}
                onCheckedChange={setAcceptsMarketing}
              />
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Notes</h4>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this customer..."
                rows={3}
              />
            </div>
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
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Customer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
