/**
 * Staff Card Block - Studio Component
 * 
 * Display staff members in an attractive card format.
 * Useful for showing team members and their specialties.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { User, Mail, Phone, Clock, Star, ChevronRight } from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'

// =============================================================================
// TYPES
// =============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

export interface StaffGridBlockProps {
  siteId?: string
  layout?: 'grid' | 'list' | 'carousel'
  columns?: ResponsiveValue<number>
  showBio?: boolean
  showContact?: boolean
  showServices?: boolean
  showAvailability?: boolean
  primaryColor?: string
  borderRadius?: ResponsiveValue<string>
  className?: string
  onStaffSelect?: (staffId: string) => void
  selectedStaffId?: string
}

interface Staff {
  id: string
  name: string
  email?: string
  phone?: string
  avatar_url?: string
  bio?: string
  services?: Array<{ id: string; name: string; color: string }>
  accept_bookings: boolean
  is_active: boolean
}

// =============================================================================
// COMPONENT
// =============================================================================

export function StaffGridBlock({
  siteId,
  layout = 'grid',
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  showBio = true,
  showContact = false,
  showServices = true,
  showAvailability = false,
  primaryColor = '#8B5CF6',
  borderRadius,
  className,
  onStaffSelect,
  selectedStaffId,
}: StaffGridBlockProps) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(selectedStaffId || null)
  
  // Fetch staff
  useEffect(() => {
    if (!siteId) {
      // Demo data for editor preview
      setStaff([
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah@example.com',
          phone: '+260 97X XXX XXX',
          avatar_url: undefined,
          bio: 'Experienced professional with over 10 years in the field. Specializes in personalized care.',
          services: [
            { id: '1', name: 'Consultation', color: '#3B82F6' },
            { id: '2', name: 'Full Session', color: '#10B981' },
          ],
          accept_bookings: true,
          is_active: true,
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'michael@example.com',
          bio: 'Passionate about helping clients achieve their goals through dedicated support.',
          services: [
            { id: '2', name: 'Full Session', color: '#10B981' },
            { id: '3', name: 'Workshop', color: '#F59E0B' },
          ],
          accept_bookings: true,
          is_active: true,
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          email: 'emily@example.com',
          bio: 'Certified expert with a focus on innovative techniques and client satisfaction.',
          services: [
            { id: '1', name: 'Consultation', color: '#3B82F6' },
          ],
          accept_bookings: true,
          is_active: true,
        },
      ])
      setIsLoading(false)
      return
    }
    
    // Fetch from API
    const fetchStaff = async () => {
      try {
        const response = await fetch(`/api/modules/booking/staff?siteId=${siteId}`)
        if (response.ok) {
          const data = await response.json()
          setStaff((data.staff || []).filter((s: Staff) => s.is_active && s.accept_bookings))
        }
      } catch (error) {
        console.error('Failed to fetch staff:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStaff()
  }, [siteId])
  
  // Handle selection
  const handleSelect = (staffId: string) => {
    setSelectedId(staffId)
    onStaffSelect?.(staffId)
  }
  
  // Get initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  // Get grid columns class
  const getGridCols = () => {
    const cols = typeof columns === 'object' ? columns : { mobile: columns, tablet: columns, desktop: columns }
    return cn(
      `grid-cols-${cols.mobile}`,
      `sm:grid-cols-${cols.tablet || cols.mobile}`,
      `lg:grid-cols-${cols.desktop || cols.tablet || cols.mobile}`
    )
  }
  
  // Responsive border radius
  const radius = typeof borderRadius === 'object' 
    ? borderRadius.mobile 
    : borderRadius || '12px'

  if (isLoading) {
    return (
      <div className={cn("staff-grid-block", className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border rounded-lg p-6 animate-pulse"
              style={{ borderRadius: radius }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (staff.length === 0) {
    return (
      <div className={cn("staff-grid-block", className)}>
        <div 
          className="text-center py-12 px-4 bg-card border rounded-lg"
          style={{ borderRadius: radius }}
        >
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No staff members available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("staff-grid-block", className)}>
      {/* Grid Layout */}
      {layout === 'grid' && (
        <div className={cn("grid gap-6", getGridCols())}>
          {staff.map((member) => (
            <div
              key={member.id}
              onClick={() => handleSelect(member.id)}
              className={cn(
                "bg-card border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                selectedId === member.id && 'ring-2'
              )}
              style={{ 
                borderRadius: radius,
                borderColor: selectedId === member.id ? primaryColor : undefined,
                boxShadow: selectedId === member.id ? `0 0 0 2px ${primaryColor}` : undefined,
              }}
            >
              <div className="p-6">
                {/* Avatar & Name */}
                <div className="flex items-center gap-4 mb-4">
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-semibold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {getInitials(member.name)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    {showAvailability && member.accept_bookings && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Accepting bookings
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Bio */}
                {showBio && member.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {member.bio}
                  </p>
                )}
                
                {/* Contact */}
                {showContact && (member.email || member.phone) && (
                  <div className="space-y-1 mb-4 text-sm">
                    {member.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Services */}
                {showServices && member.services && member.services.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {member.services.slice(0, 3).map((service) => (
                      <span
                        key={service.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: service.color }}
                        />
                        {service.name}
                      </span>
                    ))}
                    {member.services.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs text-muted-foreground">
                        +{member.services.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Selection Indicator */}
              {selectedId === member.id && (
                <div 
                  className="px-6 py-3 text-sm font-medium text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* List Layout */}
      {layout === 'list' && (
        <div className="space-y-3">
          {staff.map((member) => (
            <div
              key={member.id}
              onClick={() => handleSelect(member.id)}
              className={cn(
                "bg-card border-2 p-4 flex items-center gap-4 cursor-pointer transition-all hover:shadow-sm",
                selectedId === member.id && 'ring-2'
              )}
              style={{ 
                borderRadius: radius,
                borderColor: selectedId === member.id ? primaryColor : undefined,
                boxShadow: selectedId === member.id ? `0 0 0 2px ${primaryColor}` : undefined,
              }}
            >
              {/* Avatar */}
              {member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatar_url}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {getInitials(member.name)}
                </div>
              )}
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{member.name}</h3>
                {showBio && member.bio && (
                  <p className="text-sm text-muted-foreground truncate">
                    {member.bio}
                  </p>
                )}
              </div>
              
              {/* Services Count */}
              {showServices && member.services && (
                <span className="text-sm text-muted-foreground shrink-0">
                  {member.services.length} service{member.services.length !== 1 ? 's' : ''}
                </span>
              )}
              
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// STUDIO DEFINITION
// =============================================================================

export const staffGridDefinition: Omit<ComponentDefinition, 'module' | 'render'> & { render?: React.ComponentType<StaffGridBlockProps> } = {
  type: 'StaffGridBlock',
  label: 'Staff Grid',
  description: 'Display team members with their services and availability',
  category: 'interactive',
  icon: 'Users',
  defaultProps: {
    layout: 'grid',
    columns: { mobile: 1, tablet: 2, desktop: 3 },
    showBio: true,
    showContact: false,
    showServices: true,
    showAvailability: false,
    primaryColor: '#8B5CF6',
    borderRadius: { mobile: '8px', tablet: '12px', desktop: '12px' },
  },
  fields: {
    layout: {
      type: 'select',
      label: 'Layout',
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'list', label: 'List' },
      ],
    },
    columns: {
      type: 'number',
      responsive: true,
      label: 'Columns',
      description: 'Number of columns (grid layout only)',
      min: 1,
      max: 4,
    },
    showBio: {
      type: 'toggle',
      label: 'Show Bio',
    },
    showContact: {
      type: 'toggle',
      label: 'Show Contact Info',
    },
    showServices: {
      type: 'toggle',
      label: 'Show Services',
    },
    showAvailability: {
      type: 'toggle',
      label: 'Show Availability Status',
    },
    primaryColor: {
      type: 'color',
      label: 'Primary Color',
    },
    borderRadius: {
      type: 'spacing',
      label: 'Border Radius',
    },
  },
  ai: {
    description: 'Staff member display grid for booking',
    canModify: ['layout', 'columns', 'showBio', 'showContact', 'showServices', 'primaryColor', 'borderRadius'],
    suggestions: [
      'Show as compact list',
      'Hide contact info',
      'Emphasize services',
    ],
  },
  render: StaffGridBlock,
}

export default StaffGridBlock
