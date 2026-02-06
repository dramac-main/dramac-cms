/**
 * Settings View Component
 * 
 * Booking module settings management
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useBooking } from '../../context/booking-context'
import { updateSettings } from '../../actions/booking-actions'
import { 
  Settings, 
  Clock, 
  Bell, 
  Palette, 
  CreditCard,
  Globe,
  Mail,
  Loader2,
  Save,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import type { BookingSettings, BookingSettingsUpdate } from '../../types/booking-types'

// =============================================================================
// TYPES
// =============================================================================

interface SettingsViewProps {
  className?: string
}

// =============================================================================
// TIMEZONES
// =============================================================================

const AFRICAN_TIMEZONES = [
  { value: 'Africa/Lusaka', label: 'Lusaka (CAT)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
  { value: 'Africa/Cairo', label: 'Cairo (EET)' },
  { value: 'Africa/Casablanca', label: 'Casablanca (WET)' },
  { value: 'Africa/Harare', label: 'Harare (CAT)' },
  { value: 'Africa/Maputo', label: 'Maputo (CAT)' },
]

const OTHER_TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
]

// =============================================================================
// COMPONENT
// =============================================================================

export function SettingsView({ className }: SettingsViewProps) {
  const { siteId, settings, refreshAll } = useBooking()
  
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<Partial<BookingSettingsUpdate>>({
    business_name: '',
    timezone: 'Africa/Lusaka',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    min_booking_notice_hours: 2,
    max_booking_advance_days: 60,
    cancellation_notice_hours: 24,
    slot_interval_minutes: 30,
    auto_confirm: false,
    confirmation_email_enabled: true,
    reminder_hours: [24, 2],
    accent_color: '#8B5CF6',
    require_payment: false,
    auto_create_crm_contact: true,
    notification_email: '',
  })
  
  // Load settings
  useEffect(() => {
    if (settings) {
      setFormData({
        business_name: settings.business_name || '',
        timezone: settings.timezone || 'Africa/Lusaka',
        date_format: settings.date_format || 'DD/MM/YYYY',
        time_format: settings.time_format || '24h',
        min_booking_notice_hours: settings.min_booking_notice_hours || 2,
        max_booking_advance_days: settings.max_booking_advance_days || 60,
        cancellation_notice_hours: settings.cancellation_notice_hours || 24,
        slot_interval_minutes: settings.slot_interval_minutes || 30,
        auto_confirm: settings.auto_confirm ?? false,
        confirmation_email_enabled: settings.confirmation_email_enabled ?? true,
        reminder_hours: settings.reminder_hours || [24, 2],
        accent_color: settings.accent_color || '#8B5CF6',
        require_payment: settings.require_payment ?? false,
        auto_create_crm_contact: settings.auto_create_crm_contact ?? true,
        notification_email: settings.notification_email || '',
      })
    }
  }, [settings])
  
  // Handle change
  const handleChange = (field: keyof BookingSettingsUpdate, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }
  
  // Save settings
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings(siteId, formData)
      await refreshAll()
      setHasChanges(false)
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <div className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Booking Settings
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your booking system preferences
            </p>
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general" className="gap-2">
              <Globe className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="booking" className="gap-2">
              <Clock className="h-4 w-4" />
              Booking Rules
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic configuration for your booking system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name || ''}
                      onChange={(e) => handleChange('business_name', e.target.value)}
                      placeholder="Your Business Name"
                    />
                    <p className="text-xs text-muted-foreground">
                      Displayed in booking confirmations and reminders
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notification_email">Notification Email</Label>
                    <Input
                      id="notification_email"
                      type="email"
                      value={formData.notification_email || ''}
                      onChange={(e) => handleChange('notification_email', e.target.value)}
                      placeholder="bookings@yourbusiness.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Where to receive booking notifications
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => handleChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header-africa" disabled className="font-semibold">
                          Africa
                        </SelectItem>
                        {AFRICAN_TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="header-other" disabled className="font-semibold">
                          Other
                        </SelectItem>
                        {OTHER_TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time_format">Time Format</Label>
                    <Select
                      value={formData.time_format}
                      onValueChange={(value) => handleChange('time_format', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24-hour (14:00)</SelectItem>
                        <SelectItem value="12h">12-hour (2:00 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date_format">Date Format</Label>
                  <Select
                    value={formData.date_format}
                    onValueChange={(value) => handleChange('date_format', value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">CRM Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create CRM contacts for new customers
                    </p>
                  </div>
                  <Switch
                    checked={formData.auto_create_crm_contact}
                    onCheckedChange={(checked) => handleChange('auto_create_crm_contact', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Booking Rules */}
          <TabsContent value="booking">
            <Card>
              <CardHeader>
                <CardTitle>Booking Rules</CardTitle>
                <CardDescription>
                  Set limits and requirements for bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="slot_interval">Time Slot Interval</Label>
                    <Select
                      value={String(formData.slot_interval_minutes)}
                      onValueChange={(value) => handleChange('slot_interval_minutes', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Interval between available time slots
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min_notice">Minimum Booking Notice</Label>
                    <Select
                      value={String(formData.min_booking_notice_hours)}
                      onValueChange={(value) => handleChange('min_booking_notice_hours', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="12">12 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="48">48 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How far in advance bookings must be made
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="max_advance">Maximum Advance Booking</Label>
                    <Select
                      value={String(formData.max_booking_advance_days)}
                      onValueChange={(value) => handleChange('max_booking_advance_days', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">1 week</SelectItem>
                        <SelectItem value="14">2 weeks</SelectItem>
                        <SelectItem value="30">1 month</SelectItem>
                        <SelectItem value="60">2 months</SelectItem>
                        <SelectItem value="90">3 months</SelectItem>
                        <SelectItem value="180">6 months</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How far in the future customers can book
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cancellation_notice">Cancellation Notice</Label>
                    <Select
                      value={String(formData.cancellation_notice_hours)}
                      onValueChange={(value) => handleChange('cancellation_notice_hours', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="12">12 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="48">48 hours</SelectItem>
                        <SelectItem value="72">72 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Minimum notice required to cancel without penalty
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Auto-Confirm Bookings</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically confirm bookings without manual review
                    </p>
                  </div>
                  <Switch
                    checked={formData.auto_confirm}
                    onCheckedChange={(checked) => handleChange('auto_confirm', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure email notifications and reminders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Confirmation Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Send confirmation email when booking is made
                    </p>
                  </div>
                  <Switch
                    checked={formData.confirmation_email_enabled}
                    onCheckedChange={(checked) => handleChange('confirmation_email_enabled', checked)}
                  />
                </div>
                
                <div className="space-y-4">
                  <Label>Reminder Schedule</Label>
                  <p className="text-sm text-muted-foreground">
                    When to send appointment reminders to customers
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { hours: 48, label: '48 hours before' },
                      { hours: 24, label: '24 hours before' },
                      { hours: 12, label: '12 hours before' },
                      { hours: 2, label: '2 hours before' },
                      { hours: 1, label: '1 hour before' },
                    ].map(({ hours, label }) => (
                      <button
                        key={hours}
                        onClick={() => {
                          const current = formData.reminder_hours || []
                          const newHours = current.includes(hours)
                            ? current.filter(h => h !== hours)
                            : [...current, hours].sort((a, b) => b - a)
                          handleChange('reminder_hours', newHours)
                        }}
                        className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                          formData.reminder_hours?.includes(hours)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'hover:border-muted-foreground/50'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {formData.reminder_hours?.includes(hours) && (
                            <Check className="h-4 w-4" />
                          )}
                          {label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Appearance */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Widget Appearance</CardTitle>
                <CardDescription>
                  Customize the look of your booking widget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => handleChange('accent_color', e.target.value)}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={formData.accent_color}
                      onChange={(e) => handleChange('accent_color', e.target.value)}
                      className="w-32 font-mono"
                      placeholder="#8B5CF6"
                    />
                    <div className="flex gap-2">
                      {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'].map((color) => (
                        <button
                          key={color}
                          onClick={() => handleChange('accent_color', color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.accent_color === color ? 'border-foreground' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for buttons, highlights, and selected states
                  </p>
                </div>
                
                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="p-6 border rounded-lg bg-muted/30">
                    <div className="max-w-md mx-auto">
                      <div 
                        className="p-4 rounded-lg text-white text-center font-semibold"
                        style={{ backgroundColor: formData.accent_color }}
                      >
                        Book Now
                      </div>
                      <div className="mt-4 flex justify-center gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-medium"
                            style={{ 
                              borderColor: i === 2 ? formData.accent_color : undefined,
                              backgroundColor: i === 2 ? `${formData.accent_color}10` : undefined,
                            }}
                          >
                            {i}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payments */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure payment requirements for bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Require Payment</Label>
                    <p className="text-sm text-muted-foreground">
                      Require payment or deposit when booking
                    </p>
                  </div>
                  <Switch
                    checked={formData.require_payment}
                    onCheckedChange={(checked) => handleChange('require_payment', checked)}
                  />
                </div>
                
                {formData.require_payment && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Payment integration coming soon. For now, bookings will be created with &quot;Payment Pending&quot; status.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default SettingsView
