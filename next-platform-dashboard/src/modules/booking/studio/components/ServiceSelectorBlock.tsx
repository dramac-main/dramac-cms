/**
 * Service Selector Block - Studio Component
 * 
 * Display services in a grid/list for booking selection.
 * Visitors can browse and select services before booking.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Clock, DollarSign, Users, Check, ChevronRight } from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'

// =============================================================================
// TYPES
// =============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

export interface ServiceSelectorBlockProps {
  siteId?: string
  categoryFilter?: string
  layout?: 'grid' | 'list' | 'cards'
  columns?: ResponsiveValue<number>
  showPrice?: boolean
  showDuration?: boolean
  showDescription?: boolean
  showCapacity?: boolean
  primaryColor?: string
  borderRadius?: ResponsiveValue<string>
  className?: string
  onServiceSelect?: (serviceId: string) => void
  selectedServiceId?: string
}

interface Service {
  id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  currency: string
  max_attendees: number
  color: string
  image_url?: string
  category?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ServiceSelectorBlock({
  siteId,
  categoryFilter,
  layout = 'cards',
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  showPrice = true,
  showDuration = true,
  showDescription = true,
  showCapacity = false,
  primaryColor = '#8B5CF6',
  borderRadius,
  className,
  onServiceSelect,
  selectedServiceId,
}: ServiceSelectorBlockProps) {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(selectedServiceId || null)
  
  // Fetch services
  useEffect(() => {
    if (!siteId) {
      // Demo data for editor preview
      setServices([
        {
          id: '1',
          name: 'Consultation',
          description: 'Initial consultation to discuss your needs and goals.',
          duration_minutes: 30,
          price: 5000, // in cents
          currency: 'ZMW',
          max_attendees: 1,
          color: '#3B82F6',
          category: 'General',
        },
        {
          id: '2',
          name: 'Full Session',
          description: 'Complete service session with personalized attention.',
          duration_minutes: 60,
          price: 15000,
          currency: 'ZMW',
          max_attendees: 1,
          color: '#10B981',
          category: 'Premium',
        },
        {
          id: '3',
          name: 'Group Workshop',
          description: 'Interactive group session for team building.',
          duration_minutes: 120,
          price: 25000,
          currency: 'ZMW',
          max_attendees: 10,
          color: '#F59E0B',
          category: 'Groups',
        },
      ])
      setIsLoading(false)
      return
    }
    
    // Fetch from API
    const fetchServices = async () => {
      try {
        const response = await fetch(`/api/modules/booking/services?siteId=${siteId}`)
        if (response.ok) {
          const data = await response.json()
          setServices(data.services || [])
        }
      } catch (error) {
        console.error('Failed to fetch services:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchServices()
  }, [siteId])
  
  // Handle selection
  const handleSelect = (serviceId: string) => {
    setSelectedId(serviceId)
    onServiceSelect?.(serviceId)
  }
  
  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  
  // Format price
  const formatPrice = (price: number, currency: string): string => {
    const amount = price / 100
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }
  
  // Get column classes
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

  // Filter by category
  const filteredServices = categoryFilter
    ? services.filter(s => s.category?.toLowerCase() === categoryFilter.toLowerCase())
    : services

  if (isLoading) {
    return (
      <div className={cn("service-selector-block", className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border rounded-lg p-4 animate-pulse"
              style={{ borderRadius: radius }}
            >
              <div className="h-6 bg-muted rounded mb-3 w-3/4" />
              <div className="h-4 bg-muted rounded mb-2 w-full" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (filteredServices.length === 0) {
    return (
      <div className={cn("service-selector-block", className)}>
        <div 
          className="text-center py-12 px-4 bg-card border rounded-lg"
          style={{ borderRadius: radius }}
        >
          <p className="text-muted-foreground">No services available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("service-selector-block", className)}>
      {/* Grid Layout */}
      {layout === 'grid' && (
        <div className={cn("grid gap-4", getGridCols())}>
          {filteredServices.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelect(service.id)}
              className={cn(
                "text-left bg-card border-2 p-4 transition-all hover:shadow-md",
                selectedId === service.id ? 'ring-2' : 'hover:border-muted-foreground/30'
              )}
              style={{ 
                borderRadius: radius,
                borderColor: selectedId === service.id ? primaryColor : undefined,
                boxShadow: selectedId === service.id ? `0 0 0 2px ${primaryColor}` : undefined,
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: service.color }}
                />
                {selectedId === service.id && (
                  <Check className="h-5 w-5" style={{ color: primaryColor }} />
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
              
              {showDescription && service.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {service.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {showDuration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(service.duration_minutes)}
                  </span>
                )}
                {showPrice && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    {formatPrice(service.price, service.currency)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* List Layout */}
      {layout === 'list' && (
        <div className="space-y-2">
          {filteredServices.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelect(service.id)}
              className={cn(
                "w-full text-left bg-card border-2 p-4 flex items-center justify-between transition-all hover:shadow-sm",
                selectedId === service.id && 'ring-2'
              )}
              style={{ 
                borderRadius: radius,
                borderColor: selectedId === service.id ? primaryColor : undefined,
                boxShadow: selectedId === service.id ? `0 0 0 2px ${primaryColor}` : undefined,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-2 h-12 rounded-full"
                  style={{ backgroundColor: service.color }}
                />
                <div>
                  <h3 className="font-semibold">{service.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {showDuration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(service.duration_minutes)}
                      </span>
                    )}
                    {showCapacity && service.max_attendees > 1 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Up to {service.max_attendees}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {showPrice && (
                  <span className="font-semibold">
                    {formatPrice(service.price, service.currency)}
                  </span>
                )}
                {selectedId === service.id ? (
                  <Check className="h-5 w-5" style={{ color: primaryColor }} />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Cards Layout */}
      {layout === 'cards' && (
        <div className={cn("grid gap-6", getGridCols())}>
          {filteredServices.map((service) => (
            <div
              key={service.id}
              onClick={() => handleSelect(service.id)}
              className={cn(
                "bg-card border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                selectedId === service.id && 'ring-2'
              )}
              style={{ 
                borderRadius: radius,
                borderColor: selectedId === service.id ? primaryColor : undefined,
                boxShadow: selectedId === service.id ? `0 0 0 2px ${primaryColor}` : undefined,
              }}
            >
              {/* Color Bar */}
              <div
                className="h-2"
                style={{ backgroundColor: service.color }}
              />
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  {selectedId === service.id && (
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                
                {showDescription && service.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {service.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {showDuration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(service.duration_minutes)}
                      </span>
                    )}
                    {showCapacity && service.max_attendees > 1 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {service.max_attendees}
                      </span>
                    )}
                  </div>
                  
                  {showPrice && (
                    <span className="font-bold text-lg">
                      {formatPrice(service.price, service.currency)}
                    </span>
                  )}
                </div>
              </div>
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

export const serviceSelectorDefinition: Omit<ComponentDefinition, 'module' | 'render'> & { render?: React.ComponentType<ServiceSelectorBlockProps> } = {
  type: 'ServiceSelectorBlock',
  label: 'Service Selector',
  description: 'Display bookable services in grid, list, or card format',
  category: 'interactive',
  icon: 'Briefcase',
  defaultProps: {
    layout: 'cards',
    columns: { mobile: 1, tablet: 2, desktop: 3 },
    showPrice: true,
    showDuration: true,
    showDescription: true,
    showCapacity: false,
    primaryColor: '#8B5CF6',
    borderRadius: { mobile: '8px', tablet: '12px', desktop: '12px' },
  },
  fields: {
    categoryFilter: {
      type: 'text',
      label: 'Category Filter',
      description: 'Only show services from this category',
    },
    layout: {
      type: 'select',
      label: 'Layout',
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'list', label: 'List' },
        { value: 'cards', label: 'Cards' },
      ],
    },
    columns: {
      type: 'number',
      responsive: true,
      label: 'Columns',
      description: 'Number of columns in grid/cards layout',
      min: 1,
      max: 4,
    },
    showPrice: {
      type: 'toggle',
      label: 'Show Price',
    },
    showDuration: {
      type: 'toggle',
      label: 'Show Duration',
    },
    showDescription: {
      type: 'toggle',
      label: 'Show Description',
    },
    showCapacity: {
      type: 'toggle',
      label: 'Show Capacity',
      description: 'Show max attendees for group services',
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
    description: 'Service selection grid for booking widget',
    canModify: ['layout', 'columns', 'showPrice', 'showDuration', 'showDescription', 'primaryColor', 'borderRadius'],
    suggestions: [
      'Make it compact',
      'Show as list',
      'Emphasize pricing',
      'Hide descriptions',
    ],
  },
  render: ServiceSelectorBlock,
}

export default ServiceSelectorBlock
