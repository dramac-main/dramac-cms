/**
 * Service Selector Block - Studio Component
 * 
 * Displays bookable services in grid, list, or card layout.
 * 50+ customization properties with full theme support.
 * 
 * @module booking
 */
'use client'

import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Clock, Coins, Star, Search, Filter, ChevronRight, Tag, Grid, List, Loader2 } from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'
import { useBookingServices } from '../../hooks/useBookingServices'
import type { Service } from '../../types/booking-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

export interface ServiceItem {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  currency: string
  category?: string
  image?: string
  rating?: number
  reviewCount?: number
  available?: boolean
  featured?: boolean
}

export interface ServiceSelectorBlockProps {
  // Content
  title?: string
  subtitle?: string
  showHeader?: boolean
  showSearch?: boolean
  showFilter?: boolean
  emptyMessage?: string
  searchPlaceholder?: string
  selectButtonText?: string
  selectedButtonText?: string
  durationLabel?: string
  priceLabel?: string
  showDescription?: boolean
  showDuration?: boolean
  showPrice?: boolean
  showRating?: boolean
  showImage?: boolean
  showCategory?: boolean
  showFeaturedBadge?: boolean
  featuredBadgeText?: string

  // Data
  siteId?: string
  serviceId?: string
  maxServices?: number
  filterByCategory?: string

  // Layout
  layout?: 'grid' | 'list' | 'cards' | 'compact'
  columns?: number
  mobileColumns?: number
  headerAlignment?: 'left' | 'center' | 'right'
  imagePosition?: 'top' | 'left' | 'right' | 'background'
  imageAspectRatio?: 'square' | 'landscape' | 'portrait'
  width?: string
  minHeight?: string
  padding?: string
  gap?: string
  cardPadding?: string

  // Style - Colors
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  headerBackgroundColor?: string
  headerTextColor?: string
  cardBackgroundColor?: string
  cardHoverBgColor?: string
  cardBorderColor?: string
  cardSelectedBgColor?: string
  cardSelectedBorderColor?: string
  buttonBackgroundColor?: string
  buttonTextColor?: string
  buttonHoverColor?: string
  priceColor?: string
  durationColor?: string
  ratingColor?: string
  categoryColor?: string
  categoryBgColor?: string
  searchBgColor?: string
  searchBorderColor?: string
  featuredBadgeBgColor?: string
  featuredBadgeTextColor?: string
  dividerColor?: string
  descriptionColor?: string

  // Typography
  titleFontSize?: string
  titleFontWeight?: string
  titleFontFamily?: string
  subtitleFontSize?: string
  serviceNameFontSize?: string
  serviceNameFontWeight?: string
  descriptionFontSize?: string
  priceFontSize?: string
  priceFontWeight?: string
  durationFontSize?: string
  buttonFontSize?: string
  buttonFontWeight?: string
  categoryFontSize?: string

  // Shape & Effects
  borderRadius?: string
  cardBorderRadius?: string
  buttonBorderRadius?: string
  imageBorderRadius?: string
  borderWidth?: string
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  cardShadow?: 'none' | 'sm' | 'md' | 'lg'
  hoverShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hoverScale?: boolean
  animateCards?: boolean

  // Accessibility
  ariaLabel?: string

  // Events
  className?: string
  onServiceSelect?: (service: ServiceItem) => void
}

// =============================================================================
// HELPERS
// =============================================================================

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1)',
}

const DEMO_SERVICES: ServiceItem[] = [
  { id: '1', name: 'Full Body Massage', description: 'Relaxing full body massage therapy to relieve stress and tension.', duration: 60, price: 85, currency: DEFAULT_CURRENCY, category: 'Massage', rating: 4.8, reviewCount: 124, available: true, featured: true },
  { id: '2', name: 'Deep Tissue Massage', description: 'Intensive massage targeting deep muscle layers for pain relief.', duration: 90, price: 120, currency: DEFAULT_CURRENCY, category: 'Massage', rating: 4.9, reviewCount: 89, available: true },
  { id: '3', name: 'Facial Treatment', description: 'Rejuvenating facial treatment with premium skincare products.', duration: 45, price: 65, currency: DEFAULT_CURRENCY, category: 'Skincare', rating: 4.7, reviewCount: 56, available: true },
  { id: '4', name: 'Hair Styling', description: 'Professional hair styling and consultation with expert stylists.', duration: 30, price: 45, currency: DEFAULT_CURRENCY, category: 'Hair', rating: 4.6, reviewCount: 201, available: true },
  { id: '5', name: 'Manicure & Pedicure', description: 'Complete nail care with polish and cuticle treatment.', duration: 75, price: 55, currency: DEFAULT_CURRENCY, category: 'Nails', rating: 4.5, reviewCount: 167, available: false },
  { id: '6', name: 'Aromatherapy Session', description: 'Essential oil therapy session for deep relaxation and healing.', duration: 60, price: 95, currency: DEFAULT_CURRENCY, category: 'Wellness', rating: 4.9, reviewCount: 43, available: true, featured: true },
]

// =============================================================================
// COMPONENT
// =============================================================================

export function ServiceSelectorBlock({
  // Content
  title = 'Select a Service',
  subtitle,
  showHeader = true,
  showSearch = true,
  showFilter = false,
  emptyMessage = 'No services available at this time.',
  searchPlaceholder = 'Search services...',
  selectButtonText = 'Select',
  selectedButtonText = 'Selected',
  durationLabel = 'min',
  showDescription = true,
  showDuration = true,
  showPrice = true,
  showRating = true,
  showImage = false,
  showCategory = true,
  showFeaturedBadge = true,
  featuredBadgeText = 'Popular',

  // Data
  siteId,
  serviceId,
  maxServices = 20,
  filterByCategory,

  // Layout
  layout = 'cards',
  columns = 2,
  mobileColumns = 1,
  headerAlignment = 'left',
  imagePosition = 'top',
  width,
  minHeight,
  padding = '16px',
  gap = '12px',
  cardPadding = '16px',

  // Colors
  primaryColor = '#8B5CF6',
  secondaryColor,
  backgroundColor,
  textColor,
  headerBackgroundColor,
  headerTextColor,
  cardBackgroundColor,
  cardHoverBgColor,
  cardBorderColor,
  cardSelectedBgColor,
  cardSelectedBorderColor,
  buttonBackgroundColor,
  buttonTextColor = '#ffffff',
  buttonHoverColor,
  priceColor,
  durationColor,
  ratingColor = '#f59e0b',
  categoryColor,
  categoryBgColor,
  searchBgColor,
  searchBorderColor,
  featuredBadgeBgColor,
  featuredBadgeTextColor = '#ffffff',
  dividerColor,
  descriptionColor,

  // Typography
  titleFontSize = '18px',
  titleFontWeight = '600',
  titleFontFamily,
  subtitleFontSize,
  serviceNameFontSize = '15px',
  serviceNameFontWeight = '600',
  descriptionFontSize = '13px',
  priceFontSize = '16px',
  priceFontWeight = '700',
  durationFontSize = '13px',
  buttonFontSize = '13px',
  buttonFontWeight = '500',
  categoryFontSize = '11px',

  // Shape & Effects
  borderRadius = '12px',
  cardBorderRadius = '10px',
  buttonBorderRadius = '8px',
  imageBorderRadius,
  imageAspectRatio = 'landscape',
  borderWidth = '1px',
  shadow = 'none',
  cardShadow = 'sm',
  hoverShadow = 'md',
  hoverScale = true,
  animateCards = true,

  // Accessibility
  ariaLabel = 'Service Selection',

  // Events
  className,
  onServiceSelect,
}: ServiceSelectorBlockProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(serviceId || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(filterByCategory || null)

  // Fetch real data when siteId is available
  const { services: realServices, isLoading } = useBookingServices(siteId || '')

  // Map DB services to display format — demo only when no siteId (Studio editor)
  const dataServices: ServiceItem[] = useMemo(() => {
    if (!siteId) return DEMO_SERVICES
    return realServices.map((s: Service) => ({
      id: s.id,
      name: s.name,
      description: s.description || undefined,
      duration: s.duration_minutes,
      price: s.price,
      currency: s.currency || DEFAULT_CURRENCY,
      category: s.category || undefined,
      image: s.image_url || undefined,
      available: s.is_active,
      featured: false,
    }))
  }, [siteId, realServices])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(dataServices.map(s => s.category).filter(Boolean))
    return Array.from(cats) as string[]
  }, [dataServices])

  // Filter services
  const filteredServices = useMemo(() => {
    let services = dataServices
    if (activeCategory) {
      services = services.filter(s => s.category === activeCategory)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      services = services.filter(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q))
    }
    return services.slice(0, maxServices)
  }, [dataServices, searchQuery, activeCategory, maxServices])

  const handleSelect = (service: ServiceItem) => {
    if (service.available === false) return // Don't allow selecting unavailable services
    setSelectedServiceId(service.id)
    onServiceSelect?.(service)
  }

  const formatPrice = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency }).format(price)
    } catch {
      return `${currency} ${price}`
    }
  }

  const btnBg = buttonBackgroundColor || primaryColor
  const selectedBorder = cardSelectedBorderColor || primaryColor
  const selectedBg = cardSelectedBgColor || `${primaryColor}08`
  const badgeBg = featuredBadgeBgColor || primaryColor

  const isGrid = layout === 'grid' || layout === 'cards'

  // Loading state when fetching real data
  if (siteId && isLoading) {
    return (
      <div className={cn('service-selector-block', className)} style={{ backgroundColor: backgroundColor || undefined, borderRadius, border: `${borderWidth} solid ${cardBorderColor || '#e5e7eb'}`, padding, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="region" aria-label={ariaLabel}>
        <div style={{ textAlign: 'center', opacity: 0.6 }}>
          <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '14px', margin: 0 }}>Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('service-selector-block', className)}
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
        borderRadius,
        border: `${borderWidth} solid ${cardBorderColor || '#e5e7eb'}`,
        boxShadow: SHADOW_MAP[shadow] || 'none',
        width: width || '100%',
        minHeight: minHeight || undefined,
        fontFamily: titleFontFamily || undefined,
        overflow: 'hidden',
      }}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Header */}
      {showHeader && (
        <div style={{
          padding,
          backgroundColor: headerBackgroundColor || undefined,
          color: headerTextColor || textColor || undefined,
          borderBottom: `1px solid ${dividerColor || cardBorderColor || '#e5e7eb'}`,
          textAlign: headerAlignment,
        }}>
          <h3 style={{ fontWeight: titleFontWeight, fontSize: titleFontSize, margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: subtitleFontSize || '14px', opacity: 0.7, marginTop: '4px', marginBottom: 0 }}>{subtitle}</p>}
        </div>
      )}

      <div style={{ padding }}>
        {/* Search & Filter Bar */}
        {(showSearch || showFilter) && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {showSearch && (
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, opacity: 0.4 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  style={{
                    width: '100%', padding: '8px 8px 8px 32px', borderRadius: buttonBorderRadius,
                    border: `1px solid ${searchBorderColor || cardBorderColor || '#e5e7eb'}`,
                    backgroundColor: searchBgColor || 'transparent', fontSize: '14px', outline: 'none',
                  }}
                  aria-label="Search services"
                />
              </div>
            )}
            {showFilter && categories.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={() => setActiveCategory(null)}
                  style={{
                    padding: '6px 12px', borderRadius: '9999px', fontSize: categoryFontSize, fontWeight: 500,
                    border: `1px solid ${!activeCategory ? primaryColor : (cardBorderColor || '#e5e7eb')}`,
                    backgroundColor: !activeCategory ? primaryColor : 'transparent',
                    color: !activeCategory ? '#fff' : undefined, cursor: 'pointer',
                  }}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '6px 12px', borderRadius: '9999px', fontSize: categoryFontSize, fontWeight: 500,
                      border: `1px solid ${activeCategory === cat ? primaryColor : (cardBorderColor || '#e5e7eb')}`,
                      backgroundColor: activeCategory === cat ? primaryColor : (categoryBgColor || 'transparent'),
                      color: activeCategory === cat ? '#fff' : (categoryColor || undefined), cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Services */}
        {filteredServices.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: '14px', opacity: 0.6, padding: '32px 0', margin: 0 }}>{emptyMessage}</p>
        ) : (
          <div style={{
            display: isGrid ? 'grid' : 'flex',
            gridTemplateColumns: isGrid ? `repeat(${columns}, 1fr)` : undefined,
            flexDirection: !isGrid ? 'column' : undefined,
            gap,
          }}>
            {filteredServices.map((service) => {
              const isActive = selectedServiceId === service.id
              return (
                <div
                  key={service.id}
                  onClick={() => handleSelect(service)}
                  style={{
                    padding: cardPadding,
                    borderRadius: cardBorderRadius,
                    border: `${isActive ? '2px' : borderWidth} solid ${isActive ? selectedBorder : (cardBorderColor || '#e5e7eb')}`,
                    backgroundColor: isActive ? selectedBg : (cardBackgroundColor || undefined),
                    boxShadow: SHADOW_MAP[cardShadow] || 'none',
                    cursor: service.available === false ? 'not-allowed' : 'pointer',
                    transition: animateCards ? 'all 0.2s ease' : 'none',
                    transform: hoverScale ? undefined : undefined,
                    position: 'relative',
                    opacity: service.available === false ? 0.5 : 1,
                    display: layout === 'list' ? 'flex' : 'block',
                    alignItems: layout === 'list' ? 'center' : undefined,
                    gap: layout === 'list' ? '16px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (animateCards) {
                      (e.currentTarget as HTMLElement).style.boxShadow = SHADOW_MAP[hoverShadow] || SHADOW_MAP.md
                      if (hoverScale) (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'
                      if (cardHoverBgColor) (e.currentTarget as HTMLElement).style.backgroundColor = cardHoverBgColor
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (animateCards) {
                      (e.currentTarget as HTMLElement).style.boxShadow = SHADOW_MAP[cardShadow] || 'none'
                      if (hoverScale) (e.currentTarget as HTMLElement).style.transform = 'none'
                      ;(e.currentTarget as HTMLElement).style.backgroundColor = isActive ? selectedBg : (cardBackgroundColor || '')
                    }
                  }}
                  role="button"
                  aria-pressed={isActive}
                  aria-label={`Select ${service.name}`}
                  aria-disabled={service.available === false}
                >
                  {/* Service Image */}
                  {showImage && service.image && (
                    <div style={{
                      paddingTop: imageAspectRatio === 'square' ? '100%' : imageAspectRatio === 'landscape' ? '56.25%' : '75%',
                      position: 'relative', borderRadius: `${imageBorderRadius || cardBorderRadius} ${imageBorderRadius || cardBorderRadius} 0 0`,
                      overflow: 'hidden', marginBottom: '12px', marginTop: layout === 'list' ? 0 : `-${cardPadding}`,
                      marginLeft: layout === 'list' ? `-${cardPadding}` : `-${cardPadding}`,
                      marginRight: layout === 'list' ? '0' : `-${cardPadding}`,
                      width: layout === 'list' ? '120px' : `calc(100% + 2 * ${cardPadding})`,
                      flexShrink: 0,
                    }}>
                      <img src={service.image} alt={service.name} loading="lazy" style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        objectFit: 'cover',
                      }} />
                    </div>
                  )}

                  {/* Unavailable overlay */}
                  {service.available === false && (
                    <div style={{
                      position: 'absolute', top: '8px', left: '8px',
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                      backgroundColor: '#ef4444', color: '#ffffff',
                    }}>
                      Unavailable
                    </div>
                  )}
                  {/* Featured Badge */}
                  {showFeaturedBadge && service.featured && (
                    <span style={{
                      position: 'absolute', top: '8px', right: '8px',
                      padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 600,
                      backgroundColor: badgeBg, color: featuredBadgeTextColor,
                    }}>
                      {featuredBadgeText}
                    </span>
                  )}

                  {/* Category */}
                  {showCategory && service.category && layout !== 'list' && (
                    <span style={{
                      display: 'inline-block', fontSize: categoryFontSize, fontWeight: 500,
                      padding: '2px 8px', borderRadius: '4px', marginBottom: '8px',
                      backgroundColor: categoryBgColor || `${primaryColor}10`, color: categoryColor || primaryColor,
                    }}>
                      {service.category}
                    </span>
                  )}

                  <div style={{ flex: 1 }}>
                    {/* Service Name */}
                    <h4 style={{ fontWeight: serviceNameFontWeight, fontSize: serviceNameFontSize, margin: '0 0 4px 0' }}>
                      {service.name}
                    </h4>

                    {/* Description */}
                    {showDescription && service.description && (
                      <p style={{ fontSize: descriptionFontSize, opacity: 0.7, margin: '0 0 8px 0', color: descriptionColor || undefined, lineHeight: 1.4 }}>
                        {service.description}
                      </p>
                    )}

                    {/* Meta Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {showDuration && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: durationFontSize, color: durationColor || undefined, opacity: 0.7 }}>
                          <Clock style={{ width: 14, height: 14 }} />
                          {service.duration} {durationLabel}
                        </span>
                      )}
                      {showRating && service.rating && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: durationFontSize }}>
                          <Star style={{ width: 14, height: 14, fill: ratingColor, color: ratingColor }} />
                          <span style={{ color: ratingColor, fontWeight: 500 }}>{service.rating}</span>
                          {service.reviewCount && <span style={{ opacity: 0.5 }}>({service.reviewCount})</span>}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price + Select */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: layout === 'list' ? 0 : '12px', gap: '8px' }}>
                    {showPrice && (
                      <span style={{ fontWeight: priceFontWeight, fontSize: priceFontSize, color: priceColor || primaryColor }}>
                        {formatPrice(service.price, service.currency)}
                      </span>
                    )}
                    <button
                      style={{
                        padding: '6px 16px', borderRadius: buttonBorderRadius,
                        backgroundColor: isActive ? `${primaryColor}20` : btnBg,
                        color: isActive ? primaryColor : buttonTextColor,
                        border: isActive ? `1px solid ${primaryColor}` : '1px solid transparent',
                        fontSize: buttonFontSize, fontWeight: buttonFontWeight, cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isActive ? selectedButtonText : selectButtonText}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// STUDIO DEFINITION — 50+ fields with field groups
// =============================================================================

export const serviceSelectorDefinition: ComponentDefinition = {
  type: 'BookingServiceSelector',
  label: 'Service Selector',
  description: 'Display bookable services in grid, list, or card layout — 50+ customization options. Use on services pages for booking-enabled businesses.',
  category: 'interactive',
  icon: 'Tag',
  keywords: ['booking', 'service', 'selector', 'menu', 'price', 'catalog', 'appointment'],
  defaultProps: {
    title: 'Select a Service',
    showHeader: true,
    showSearch: true,
    showFilter: false,
    showDescription: true,
    showDuration: true,
    showPrice: true,
    showRating: true,
    showImage: false,
    showCategory: true,
    showFeaturedBadge: true,
    featuredBadgeText: 'Popular',
    layout: 'cards',
    columns: 2,
    mobileColumns: 1,
    headerAlignment: 'left',
    primaryColor: '#8B5CF6',
    buttonTextColor: '#ffffff',
    featuredBadgeTextColor: '#ffffff',
    ratingColor: '#f59e0b',
    borderRadius: '12px',
    cardBorderRadius: '10px',
    buttonBorderRadius: '8px',
    borderWidth: '1px',
    shadow: 'none',
    cardShadow: 'sm',
    hoverShadow: 'md',
    hoverScale: true,
    animateCards: true,
    titleFontSize: '18px',
    titleFontWeight: '600',
    serviceNameFontSize: '15px',
    serviceNameFontWeight: '600',
    priceFontSize: '16px',
    priceFontWeight: '700',
    padding: '16px',
    gap: '12px',
    cardPadding: '16px',
  },
  fields: {
    // Content (18)
    title: { type: 'text', label: 'Title' },
    subtitle: { type: 'text', label: 'Subtitle' },
    showHeader: { type: 'toggle', label: 'Show Header' },
    showSearch: { type: 'toggle', label: 'Show Search Bar' },
    showFilter: { type: 'toggle', label: 'Show Category Filter' },
    emptyMessage: { type: 'text', label: 'Empty Message' },
    searchPlaceholder: { type: 'text', label: 'Search Placeholder' },
    selectButtonText: { type: 'text', label: 'Select Button Text' },
    selectedButtonText: { type: 'text', label: 'Selected Button Text' },
    durationLabel: { type: 'text', label: 'Duration Label' },
    showDescription: { type: 'toggle', label: 'Show Description' },
    showDuration: { type: 'toggle', label: 'Show Duration' },
    showPrice: { type: 'toggle', label: 'Show Price' },
    showRating: { type: 'toggle', label: 'Show Rating' },
    showImage: { type: 'toggle', label: 'Show Image' },
    showCategory: { type: 'toggle', label: 'Show Category' },
    showFeaturedBadge: { type: 'toggle', label: 'Show Featured Badge' },
    featuredBadgeText: { type: 'text', label: 'Featured Badge Text' },

    // Data (3)
    serviceId: { type: 'custom', customType: 'booking:service-selector', label: 'Pre-Selected Service' },
    maxServices: { type: 'number', label: 'Max Services Shown', min: 1, max: 50 },
    filterByCategory: { type: 'text', label: 'Filter by Category' },

    // Layout (10)
    layout: { type: 'select', label: 'Layout', options: [{ label: 'Grid', value: 'grid' }, { label: 'List', value: 'list' }, { label: 'Cards', value: 'cards' }, { label: 'Compact', value: 'compact' }] },
    columns: { type: 'number', label: 'Columns', min: 1, max: 6 },
    mobileColumns: { type: 'number', label: 'Mobile Columns', min: 1, max: 3 },
    headerAlignment: { type: 'select', label: 'Header Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }] },
    imagePosition: { type: 'select', label: 'Image Position', options: [{ label: 'Top', value: 'top' }, { label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }, { label: 'Background', value: 'background' }] },
    width: { type: 'text', label: 'Width' },
    minHeight: { type: 'text', label: 'Min Height' },
    padding: { type: 'text', label: 'Padding' },
    gap: { type: 'text', label: 'Gap' },
    cardPadding: { type: 'text', label: 'Card Padding' },

    // Colors (25)
    primaryColor: { type: 'color', label: 'Primary Color' },
    secondaryColor: { type: 'color', label: 'Secondary Color' },
    backgroundColor: { type: 'color', label: 'Background Color' },
    textColor: { type: 'color', label: 'Text Color' },
    headerBackgroundColor: { type: 'color', label: 'Header Background' },
    headerTextColor: { type: 'color', label: 'Header Text' },
    cardBackgroundColor: { type: 'color', label: 'Card Background' },
    cardHoverBgColor: { type: 'color', label: 'Card Hover Background' },
    cardBorderColor: { type: 'color', label: 'Card Border Color' },
    cardSelectedBgColor: { type: 'color', label: 'Selected Card Background' },
    cardSelectedBorderColor: { type: 'color', label: 'Selected Card Border' },
    buttonBackgroundColor: { type: 'color', label: 'Button Background' },
    buttonTextColor: { type: 'color', label: 'Button Text' },
    buttonHoverColor: { type: 'color', label: 'Button Hover' },
    priceColor: { type: 'color', label: 'Price Color' },
    durationColor: { type: 'color', label: 'Duration Color' },
    ratingColor: { type: 'color', label: 'Rating Color' },
    categoryColor: { type: 'color', label: 'Category Text' },
    categoryBgColor: { type: 'color', label: 'Category Background' },
    searchBgColor: { type: 'color', label: 'Search Background' },
    searchBorderColor: { type: 'color', label: 'Search Border' },
    featuredBadgeBgColor: { type: 'color', label: 'Featured Badge Background' },
    featuredBadgeTextColor: { type: 'color', label: 'Featured Badge Text' },
    dividerColor: { type: 'color', label: 'Divider Color' },
    descriptionColor: { type: 'color', label: 'Description Color' },

    // Typography (13)
    titleFontSize: { type: 'text', label: 'Title Font Size' },
    titleFontWeight: { type: 'select', label: 'Title Font Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    titleFontFamily: { type: 'text', label: 'Title Font Family' },
    subtitleFontSize: { type: 'text', label: 'Subtitle Font Size' },
    serviceNameFontSize: { type: 'text', label: 'Service Name Font Size' },
    serviceNameFontWeight: { type: 'select', label: 'Service Name Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    descriptionFontSize: { type: 'text', label: 'Description Font Size' },
    priceFontSize: { type: 'text', label: 'Price Font Size' },
    priceFontWeight: { type: 'select', label: 'Price Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }, { label: 'Extra Bold', value: '800' }] },
    durationFontSize: { type: 'text', label: 'Duration Font Size' },
    buttonFontSize: { type: 'text', label: 'Button Font Size' },
    buttonFontWeight: { type: 'select', label: 'Button Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    categoryFontSize: { type: 'text', label: 'Category Font Size' },

    // Shape & Effects (10)
    borderRadius: { type: 'text', label: 'Container Radius' },
    cardBorderRadius: { type: 'text', label: 'Card Radius' },
    buttonBorderRadius: { type: 'text', label: 'Button Radius' },
    imageBorderRadius: { type: 'text', label: 'Image Radius' },
    borderWidth: { type: 'text', label: 'Border Width' },
    shadow: { type: 'select', label: 'Container Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }] },
    cardShadow: { type: 'select', label: 'Card Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }] },
    hoverShadow: { type: 'select', label: 'Hover Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }] },
    hoverScale: { type: 'toggle', label: 'Hover Scale' },
    animateCards: { type: 'toggle', label: 'Animate Cards' },

    // Accessibility (1)
    ariaLabel: { type: 'text', label: 'ARIA Label' },
  },
  fieldGroups: [
    { id: 'content', label: 'Content', icon: 'Type', fields: ['title', 'subtitle', 'showHeader', 'showSearch', 'showFilter', 'emptyMessage', 'searchPlaceholder', 'selectButtonText', 'selectedButtonText', 'durationLabel', 'showDescription', 'showDuration', 'showPrice', 'showRating', 'showImage', 'showCategory', 'showFeaturedBadge', 'featuredBadgeText'], defaultExpanded: true },
    { id: 'data', label: 'Data Connection', icon: 'Database', fields: ['serviceId', 'maxServices', 'filterByCategory'], defaultExpanded: true },
    { id: 'layout', label: 'Layout', icon: 'Layout', fields: ['layout', 'columns', 'mobileColumns', 'headerAlignment', 'imagePosition', 'width', 'minHeight', 'padding', 'gap', 'cardPadding'], defaultExpanded: false },
    { id: 'colors', label: 'Colors', icon: 'Palette', fields: ['primaryColor', 'secondaryColor', 'backgroundColor', 'textColor', 'headerBackgroundColor', 'headerTextColor', 'cardBackgroundColor', 'cardHoverBgColor', 'cardBorderColor', 'cardSelectedBgColor', 'cardSelectedBorderColor', 'buttonBackgroundColor', 'buttonTextColor', 'buttonHoverColor', 'priceColor', 'durationColor', 'ratingColor', 'categoryColor', 'categoryBgColor', 'searchBgColor', 'searchBorderColor', 'featuredBadgeBgColor', 'featuredBadgeTextColor', 'dividerColor', 'descriptionColor'], defaultExpanded: false },
    { id: 'typography', label: 'Typography', icon: 'ALargeSmall', fields: ['titleFontSize', 'titleFontWeight', 'titleFontFamily', 'subtitleFontSize', 'serviceNameFontSize', 'serviceNameFontWeight', 'descriptionFontSize', 'priceFontSize', 'priceFontWeight', 'durationFontSize', 'buttonFontSize', 'buttonFontWeight', 'categoryFontSize'], defaultExpanded: false },
    { id: 'shape', label: 'Shape & Effects', icon: 'Square', fields: ['borderRadius', 'cardBorderRadius', 'buttonBorderRadius', 'imageBorderRadius', 'borderWidth', 'shadow', 'cardShadow', 'hoverShadow', 'hoverScale', 'animateCards'], defaultExpanded: false },
    { id: 'accessibility', label: 'Accessibility', icon: 'Accessibility', fields: ['ariaLabel'], defaultExpanded: false },
  ],
  ai: {
    description: 'Service selection catalog with prices, ratings, and categories — 50+ properties',
    canModify: ['title', 'subtitle', 'layout', 'columns', 'primaryColor', 'backgroundColor', 'showSearch', 'showFilter', 'showRating', 'showPrice', 'cardBorderRadius', 'cardShadow'],
    suggestions: ['Show as list', 'Make 3 columns', 'Hide ratings', 'Change to brand colors', 'Enable search and filters'],
  },
  render: ServiceSelectorBlock,
}

export default ServiceSelectorBlock
