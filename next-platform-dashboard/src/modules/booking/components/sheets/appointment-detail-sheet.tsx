/**
 * Appointment Detail Sheet Component
 * 
 * Phase EM-51: Booking Module
 * Displays detailed appointment information in a slide-out panel
 */
'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBooking } from '../../context/booking-context'
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  DollarSign,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Save,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Appointment, AppointmentStatus, PaymentStatus } from '../../types/booking-types'
import { PAYMENT_STATUS_CONFIG } from '../../types/booking-types'
import { toast } from 'sonner'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
interface AppointmentDetailSheetProps {
  appointment: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (appointment: Appointment) => void
}

const STATUS_OPTIONS: { value: AppointmentStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  { value: 'no_show', label: 'No Show', color: 'bg-gray-500' },
]

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(DEFAULT_LOCALE, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(timestamp: string, format: '12h' | '24h' = '12h'): string {
  const date = new Date(timestamp)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
  const period = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${h}:${minutes.toString().padStart(2, '0')} ${period}`
}

function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function AppointmentDetailSheet({
  appointment,
  open,
  onOpenChange,
  onEdit,
}: AppointmentDetailSheetProps) {
  const { staff, services, settings, editAppointment, removeAppointment } = useBooking()
  const [isEditing, setIsEditing] = useState(false)
  const [editedStatus, setEditedStatus] = useState<AppointmentStatus | null>(null)
  const [editedNotes, setEditedNotes] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)
  
  if (!appointment) return null
  
  // Get related data
  const service = services.find((s) => s.id === appointment.service_id)
  const staffMember = appointment.staff_id
    ? staff.find((s) => s.id === appointment.staff_id)
    : null
  
  const handleStartEdit = () => {
    setEditedStatus(appointment.status)
    setEditedNotes(appointment.customer_notes || '')
    setIsEditing(true)
  }
  
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedStatus(null)
    setEditedNotes('')
  }
  
  const handleSave = async () => {
    if (!appointment) return
    
    setIsSaving(true)
    try {
      const updates: Partial<Appointment> = {}
      
      if (editedStatus && editedStatus !== appointment.status) {
        updates.status = editedStatus
      }
      if (editedNotes !== (appointment.customer_notes || '')) {
        updates.customer_notes = editedNotes
      }
      
      if (Object.keys(updates).length > 0) {
        await editAppointment(appointment.id, updates)
        toast.success('Appointment updated')
      }
      
      setIsEditing(false)
    } catch {
      toast.error('Failed to update appointment')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this appointment?')) return
    
    try {
      await removeAppointment(appointment.id)
      toast.success('Appointment deleted')
      onOpenChange(false)
    } catch {
      toast.error('Failed to delete appointment')
    }
  }
  
  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    try {
      await editAppointment(appointment.id, { status: newStatus })
      toast.success(`Appointment ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
    setIsUpdatingPayment(true)
    try {
      await editAppointment(appointment.id, { payment_status: newStatus })
      toast.success(`Payment marked as ${PAYMENT_STATUS_CONFIG[newStatus]?.label || newStatus}`)
    } catch {
      toast.error('Failed to update payment status')
    } finally {
      setIsUpdatingPayment(false)
    }
  }
  
  const statusOption = STATUS_OPTIONS.find((s) => s.value === appointment.status)
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Appointment Details</SheetTitle>
            <Badge
              variant="outline"
              className={cn(
                'ml-2',
                appointment.status === 'confirmed' && 'border-blue-500 bg-blue-500/10 text-blue-700',
                appointment.status === 'pending' && 'border-yellow-500 bg-yellow-500/10 text-yellow-700',
                appointment.status === 'completed' && 'border-green-500 bg-green-500/10 text-green-700',
                appointment.status === 'cancelled' && 'border-red-500 bg-red-500/10 text-red-700',
                appointment.status === 'no_show' && 'border-gray-500 bg-gray-500/10 text-gray-700'
              )}
            >
              {appointment.status === 'no_show' ? 'No Show' : appointment.status}
            </Badge>
          </div>
          <SheetDescription>
            Booked on {new Date(appointment.created_at).toLocaleDateString()}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Date & Time */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Date & Time</h4>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{formatDate(appointment.start_time)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(appointment.start_time, settings?.time_format)} - {formatTime(appointment.end_time, settings?.time_format)}
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Customer Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Customer</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{appointment.customer_name}</span>
              </div>
              {appointment.customer_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${appointment.customer_email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {appointment.customer_email}
                  </a>
                </div>
              )}
              {appointment.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${appointment.customer_phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {appointment.customer_phone}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Service */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Service</h4>
            {service ? (
              <div className="p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{service.name}</span>
                  <span className="font-medium">{formatCurrency(service.price, service.currency)}</span>
                </div>
                {service.description && (
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.duration_minutes} min
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Service not found</p>
            )}
          </div>
          
          <Separator />
          
          {/* Staff */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Staff Member</h4>
            {staffMember ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{staffMember.name}</p>
                  {staffMember.email && (
                    <p className="text-sm text-muted-foreground">{staffMember.email}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No staff assigned</p>
            )}
          </div>
          
          <Separator />
          
          {/* Payment */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment
            </h4>
            <div className="p-3 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <span>Amount</span>
                <span className="font-medium">
                  {formatCurrency(appointment.payment_amount ?? (service?.price ?? 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Select
                  value={appointment.payment_status || 'pending'}
                  onValueChange={(v) => handlePaymentStatusChange(v as PaymentStatus)}
                  disabled={isUpdatingPayment}
                >
                  <SelectTrigger className="w-[160px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {(appointment.customer_notes || isEditing) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes
                </h4>
                {isEditing ? (
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add notes..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {appointment.customer_notes || 'No notes'}
                  </p>
                )}
              </div>
            </>
          )}
          
          {/* Status Change (Quick Actions) */}
          {!isEditing && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {appointment.status !== 'confirmed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('confirmed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1 text-blue-500" />
                      Confirm
                    </Button>
                  )}
                  {appointment.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('completed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      Complete
                    </Button>
                  )}
                  {appointment.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('cancelled')}
                    >
                      <XCircle className="h-4 w-4 mr-1 text-red-500" />
                      Cancel
                    </Button>
                  )}
                  {appointment.status !== 'no_show' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('no_show')}
                    >
                      <AlertCircle className="h-4 w-4 mr-1 text-gray-500" />
                      No Show
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Status Edit */}
          {isEditing && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                <Select
                  value={editedStatus || appointment.status}
                  onValueChange={(v) => setEditedStatus(v as AppointmentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2 w-2 rounded-full', opt.color)} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          <Separator />
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleStartEdit} className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {onEdit && (
                  <Button variant="outline" onClick={() => onEdit(appointment)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Full Edit
                  </Button>
                )}
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
