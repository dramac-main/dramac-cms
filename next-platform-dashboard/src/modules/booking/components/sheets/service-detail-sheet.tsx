/**
 * Service Detail Sheet Component
 * 
 * Phase EM-51: Booking Module
 * Displays detailed service information in a slide-out panel
 */
'use client'

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
import { Switch } from '@/components/ui/switch'
import { useBooking } from '../../context/booking-context'
import {
  Clock,
  DollarSign,
  Tag,
  Edit,
  Trash2,
  Timer,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Service } from '../../types/booking-types'
import { toast } from 'sonner'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
interface ServiceDetailSheetProps {
  service: Service | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (service: Service) => void
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`
}

function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function ServiceDetailSheet({
  service,
  open,
  onOpenChange,
  onEdit,
}: ServiceDetailSheetProps) {
  const { staff, appointments, editService, removeService } = useBooking()
  
  if (!service) return null
  
  // Get staff who offer this service
  const serviceStaff = staff.filter(
    (s) => s.is_active && s.services?.some((srv) => srv.id === service.id)
  )
  
  // Get appointment stats for this service
  const serviceAppointments = appointments.filter((a) => a.service_id === service.id)
  const completedCount = serviceAppointments.filter((a) => a.status === 'completed').length
  const upcomingCount = serviceAppointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  ).length
  
  const handleToggleStatus = async () => {
    try {
      await editService(service.id, { is_active: !service.is_active })
      toast.success(`Service ${service.is_active ? 'deactivated' : 'activated'}`)
    } catch {
      toast.error('Failed to update service status')
    }
  }
  
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${service.name}"? This cannot be undone.`)) {
      return
    }
    
    try {
      await removeService(service.id)
      toast.success('Service deleted')
      onOpenChange(false)
    } catch {
      toast.error('Failed to delete service')
    }
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{service.name}</SheetTitle>
            <Badge
              variant={service.is_active ? 'default' : 'secondary'}
              className={cn(
                'ml-2',
                service.is_active && 'bg-green-500',
                !service.is_active && 'bg-gray-400'
              )}
            >
              {service.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {service.description && (
            <SheetDescription>{service.description}</SheetDescription>
          )}
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium">Service Status</p>
              <p className="text-sm text-muted-foreground">
                {service.is_active ? 'Available for booking' : 'Hidden from bookings'}
              </p>
            </div>
            <Switch
              checked={service.is_active}
              onCheckedChange={handleToggleStatus}
            />
          </div>
          
          <Separator />
          
          {/* Price & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Price</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(service.price ?? 0, service.currency)}</p>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Duration</span>
              </div>
              <p className="text-xl font-bold">{formatDuration(service.duration_minutes)}</p>
            </div>
          </div>
          
          {/* Buffer Times */}
          {((service.buffer_before_minutes || 0) + (service.buffer_after_minutes || 0)) > 0 && (
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Timer className="h-4 w-4" />
                <span className="text-sm font-medium">Buffer Times</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Before</p>
                  <p className="font-medium">{service.buffer_before_minutes || 0} min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">After</p>
                  <p className="font-medium">{service.buffer_after_minutes || 0} min</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Category */}
          {service.category && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category
                </h4>
                <Badge variant="outline" className="text-sm">
                  {service.category}
                </Badge>
              </div>
            </>
          )}
          
          <Separator />
          
          {/* Staff */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff Members ({serviceStaff.length})
            </h4>
            {serviceStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground">No staff assigned to this service</p>
            ) : (
              <div className="space-y-2">
                {serviceStaff.map((staffMember) => (
                  <div
                    key={staffMember.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{staffMember.name}</p>
                      {staffMember.email && (
                        <p className="text-sm text-muted-foreground">{staffMember.email}</p>
                      )}
                    </div>
                    <Badge variant={staffMember.is_active ? 'default' : 'secondary'}>
                      {staffMember.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Stats */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingCount}</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(service)} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit Service
              </Button>
            )}
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
