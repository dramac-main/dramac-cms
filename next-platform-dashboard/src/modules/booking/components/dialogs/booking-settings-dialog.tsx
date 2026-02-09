/**
 * Booking Settings Dialog
 * 
 * Phase EM-51: Booking Module
 */
'use client'

import { useState, useEffect } from 'react'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBooking } from '../../context/booking-context'
import { updateSettings } from '../../actions/booking-actions'
import { toast } from 'sonner'
import type { BookingSettingsUpdate } from '../../types/booking-types'

import { DEFAULT_TIMEZONE, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@/lib/locale-config'
// Common timezones
const TIMEZONES = [
  { value: 'Africa/Lusaka', label: 'Lusaka (Zambia)' },
  { value: 'Africa/Harare', label: 'Harare (Zimbabwe)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (South Africa)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (Kenya)' },
  { value: 'Africa/Lagos', label: 'Lagos (Nigeria)' },
  { value: 'Africa/Cairo', label: 'Cairo (Egypt)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (UK)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (Japan)' },
  { value: 'Australia/Sydney', label: 'Sydney (Australia)' },
]

interface BookingSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookingSettingsDialog({ open, onOpenChange }: BookingSettingsDialogProps) {
  const { siteId, settings, refreshAll } = useBooking()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [businessName, setBusinessName] = useState('')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE)
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h')
  const [slotInterval, setSlotInterval] = useState(30)
  const [minBookingNotice, setMinBookingNotice] = useState(24)
  const [maxBookingAdvance, setMaxBookingAdvance] = useState(90)
  const [cancellationNotice, setCancellationNotice] = useState(24)
  const [autoConfirm, setAutoConfirm] = useState(false)
  const [confirmationEmailEnabled, setConfirmationEmailEnabled] = useState(true)
  const [autoCreateCrmContact, setAutoCreateCrmContact] = useState(true)
  const [accentColor, setAccentColor] = useState('#3B82F6')
  const [notificationEmail, setNotificationEmail] = useState('')
  
  // Load settings when dialog opens
  useEffect(() => {
    if (open && settings) {
      setBusinessName(settings.business_name || '')
      setCurrency(settings.currency || DEFAULT_CURRENCY)
      setTimezone(settings.timezone || DEFAULT_TIMEZONE)
      setTimeFormat(settings.time_format || '12h')
      setSlotInterval(settings.slot_interval_minutes || 30)
      setMinBookingNotice(settings.min_booking_notice_hours || 24)
      setMaxBookingAdvance(settings.max_booking_advance_days || 90)
      setCancellationNotice(settings.cancellation_notice_hours || 24)
      setAutoConfirm(settings.auto_confirm || false)
      setConfirmationEmailEnabled(settings.confirmation_email_enabled ?? true)
      setAutoCreateCrmContact(settings.auto_create_crm_contact ?? true)
      setAccentColor(settings.accent_color || '#3B82F6')
      setNotificationEmail(settings.notification_email || '')
    }
  }, [open, settings])
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const updates: BookingSettingsUpdate = {
        business_name: businessName.trim() || undefined,
        currency,
        timezone,
        time_format: timeFormat,
        slot_interval_minutes: slotInterval,
        min_booking_notice_hours: minBookingNotice,
        max_booking_advance_days: maxBookingAdvance,
        cancellation_notice_hours: cancellationNotice,
        auto_confirm: autoConfirm,
        confirmation_email_enabled: confirmationEmailEnabled,
        auto_create_crm_contact: autoCreateCrmContact,
        accent_color: accentColor,
        notification_email: notificationEmail.trim() || undefined
      }
      
      await updateSettings(siteId, updates)
      await refreshAll()
      
      toast.success('Settings saved successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Booking Settings</DialogTitle>
          <DialogDescription>
            Configure your booking system preferences.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="booking">Booking Rules</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <div className="py-4 max-h-[50vh] overflow-y-auto">
            <TabsContent value="general" className="space-y-4 mt-0">
              {/* Business Name */}
              <div className="grid gap-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Your Business Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              
              {/* Currency */}
              <div className="grid gap-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Timezone */}
              <div className="grid gap-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Time Format */}
              <div className="grid gap-2">
                <Label>Time Format</Label>
                <Select value={timeFormat} onValueChange={(v) => setTimeFormat(v as '12h' | '24h')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Accent Color */}
              <div className="grid gap-2">
                <Label>Accent Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="booking" className="space-y-4 mt-0">
              {/* Slot Interval */}
              <div className="grid gap-2">
                <Label>Time Slot Interval</Label>
                <Select value={slotInterval.toString()} onValueChange={(v) => setSlotInterval(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The increment between available time slots
                </p>
              </div>
              
              {/* Min Booking Notice */}
              <div className="grid gap-2">
                <Label htmlFor="minNotice">Minimum Booking Notice (hours)</Label>
                <Input
                  id="minNotice"
                  type="number"
                  min={0}
                  max={168}
                  value={minBookingNotice}
                  onChange={(e) => setMinBookingNotice(parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  How far in advance customers must book
                </p>
              </div>
              
              {/* Max Booking Advance */}
              <div className="grid gap-2">
                <Label htmlFor="maxAdvance">Maximum Advance Booking (days)</Label>
                <Input
                  id="maxAdvance"
                  type="number"
                  min={1}
                  max={365}
                  value={maxBookingAdvance}
                  onChange={(e) => setMaxBookingAdvance(parseInt(e.target.value) || 90)}
                />
                <p className="text-sm text-muted-foreground">
                  How far in the future customers can book
                </p>
              </div>
              
              {/* Cancellation Notice */}
              <div className="grid gap-2">
                <Label htmlFor="cancelNotice">Cancellation Notice (hours)</Label>
                <Input
                  id="cancelNotice"
                  type="number"
                  min={0}
                  max={168}
                  value={cancellationNotice}
                  onChange={(e) => setCancellationNotice(parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  Minimum notice required for cancellations
                </p>
              </div>
              
              {/* Auto Confirm */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Confirm Bookings</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically confirm new bookings
                  </p>
                </div>
                <Switch
                  checked={autoConfirm}
                  onCheckedChange={setAutoConfirm}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4 mt-0">
              {/* Confirmation Email */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Send Confirmation Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Email customers when bookings are confirmed
                  </p>
                </div>
                <Switch
                  checked={confirmationEmailEnabled}
                  onCheckedChange={setConfirmationEmailEnabled}
                />
              </div>
              
              {/* CRM Integration */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Create CRM Contact</Label>
                  <p className="text-sm text-muted-foreground">
                    Create CRM contact for new customers
                  </p>
                </div>
                <Switch
                  checked={autoCreateCrmContact}
                  onCheckedChange={setAutoCreateCrmContact}
                />
              </div>
              
              {/* Notification Email */}
              <div className="grid gap-2">
                <Label htmlFor="notificationEmail">Notification Email</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  placeholder="notifications@example.com"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Receive booking notifications at this email
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
