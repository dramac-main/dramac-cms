/**
 * Staff Detail Sheet Component
 * 
 * Phase EM-51: Booking Module
 * Displays detailed staff member information in a slide-out panel
 */
'use client'

import { useMemo } from 'react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBooking } from '../../context/booking-context'
import {
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Staff } from '../../types/booking-types'
import { toast } from 'sonner'

interface StaffDetailSheetProps {
  staffMember: Staff | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (staff: Staff) => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function StaffDetailSheet({
  staffMember,
  open,
  onOpenChange,
  onEdit,
}: StaffDetailSheetProps) {
  const { appointments, services, editStaff, removeStaff } = useBooking()
  
  // Get staff's services - ALWAYS call hooks in same order
  const staffServices = useMemo(() => {
    return staffMember?.services || []
  }, [staffMember?.services])
  
  // Get appointment stats for this staff
  const staffAppointments = useMemo(() => {
    if (!staffMember) return []
    return appointments.filter((a) => a.staff_id === staffMember.id)
  }, [appointments, staffMember])
  
  // Calculate stats
  const { completedCount, upcomingCount, totalCount, completionRate } = useMemo(() => {
    const completed = staffAppointments.filter((a) => a.status === 'completed').length
    const upcoming = staffAppointments.filter(
      (a) => a.status === 'confirmed' || a.status === 'pending'
    ).length
    const total = staffAppointments.length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return {
      completedCount: completed,
      upcomingCount: upcoming,
      totalCount: total,
      completionRate: rate
    }
  }, [staffAppointments])
  
  if (!staffMember) return null
  
  const handleToggleStatus = async () => {
    try {
      await editStaff(staffMember.id, { is_active: !staffMember.is_active })
      toast.success(`Staff member ${staffMember.is_active ? 'deactivated' : 'activated'}`)
    } catch {
      toast.error('Failed to update staff status')
    }
  }
  
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${staffMember.name}"? This cannot be undone.`)) {
      return
    }
    
    try {
      await removeStaff(staffMember.id)
      toast.success('Staff member deleted')
      onOpenChange(false)
    } catch {
      toast.error('Failed to delete staff member')
    }
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={staffMember.avatar_url || undefined} alt={staffMember.name} />
              <AvatarFallback className="text-lg">{getInitials(staffMember.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle>{staffMember.name}</SheetTitle>
                <Badge
                  variant={staffMember.is_active ? 'default' : 'secondary'}
                  className={cn(
                    staffMember.is_active && 'bg-green-500',
                    !staffMember.is_active && 'bg-gray-400'
                  )}
                >
                  {staffMember.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {staffMember.bio && (
                <SheetDescription className="mt-1">{staffMember.bio}</SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium">Staff Status</p>
              <p className="text-sm text-muted-foreground">
                {staffMember.is_active ? 'Available for bookings' : 'Not accepting bookings'}
              </p>
            </div>
            <Switch
              checked={staffMember.is_active}
              onCheckedChange={handleToggleStatus}
            />
          </div>
          
          <Separator />
          
          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Contact Information</h4>
            <div className="space-y-2">
              {staffMember.email ? (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${staffMember.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {staffMember.email}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No email provided</p>
              )}
              {staffMember.phone ? (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${staffMember.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {staffMember.phone}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No phone provided</p>
              )}
              {staffMember.timezone && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{staffMember.timezone}</span>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Services */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Services ({staffServices.length})
            </h4>
            {staffServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services assigned</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {staffServices.map((srv) => (
                  <Badge key={srv.id} variant="secondary">
                    {srv.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Performance Stats */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Performance
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
            
            {/* Completion Rate */}
            <div className="p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Completion Rate</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    completionRate >= 80 ? 'bg-green-500' :
                    completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Working Hours */}
          {staffMember.working_hours && Object.keys(staffMember.working_hours).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Working Hours
                </h4>
                <div className="space-y-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const hours = staffMember.working_hours?.[day as keyof typeof staffMember.working_hours]
                    if (!hours || !hours.enabled) return null
                    return (
                      <div key={day} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{day}</span>
                        <span className="text-muted-foreground">
                          {hours.start} - {hours.end}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
          
          <Separator />
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(staffMember)} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit Staff
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
