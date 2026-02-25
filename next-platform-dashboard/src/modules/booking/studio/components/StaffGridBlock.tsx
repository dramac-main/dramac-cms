/**
 * Staff Grid Block - Studio Component
 * 
 * Display staff members with bio, rating, services, and availability.
 * 50+ customization properties with full theme support.
 * 
 * @module booking
 */
'use client'

import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Star, Clock, Search, User, Award, MapPin, Calendar, ChevronRight, Filter, Loader2 } from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'
import { useBookingStaff } from '../../hooks/useBookingStaff'
import type { Staff } from '../../types/booking-types'

// =============================================================================
// TYPES
// =============================================================================

interface StaffMember {
  id: string
  name: string
  role: string
  bio?: string
  avatar?: string
  rating: number
  reviewCount: number
  specialties: string[]
  availability: string
  experience?: string
  location?: string
  bookable: boolean
}

export interface StaffGridBlockProps {
  // Content
  title?: string
  subtitle?: string
  showHeader?: boolean
  showSearch?: boolean
  showFilters?: boolean
  emptyMessage?: string
  searchPlaceholder?: string
  bookButtonText?: string
  viewProfileText?: string
  showBio?: boolean
  showRating?: boolean
  showReviewCount?: boolean
  showSpecialties?: boolean
  showAvailability?: boolean
  showExperience?: boolean
  showLocation?: boolean
  showBookButton?: boolean
  showAvatar?: boolean
  availableLabel?: string
  unavailableLabel?: string
  specialtiesLabel?: string

  // Data
  siteId?: string
  staffId?: string
  maxStaff?: number
  filterBySpecialty?: string
  sortBy?: 'name' | 'rating' | 'experience'

  // Layout
  layout?: 'grid' | 'list' | 'cards' | 'carousel'
  columns?: number
  mobileColumns?: number
  headerAlignment?: 'left' | 'center' | 'right'
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl'
  avatarShape?: 'circle' | 'rounded' | 'square'
  contentAlignment?: 'left' | 'center'
  width?: string
  minHeight?: string
  padding?: string
  gap?: string
  cardPadding?: string

  // Colors
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  headerBackgroundColor?: string
  headerTextColor?: string
  cardBackgroundColor?: string
  cardHoverBgColor?: string
  cardBorderColor?: string
  avatarBorderColor?: string
  avatarBgColor?: string
  nameColor?: string
  roleColor?: string
  bioColor?: string
  ratingColor?: string
  starColor?: string
  specialtyBgColor?: string
  specialtyTextColor?: string
  availableDotColor?: string
  unavailableDotColor?: string
  buttonBackgroundColor?: string
  buttonTextColor?: string
  buttonHoverColor?: string
  searchBgColor?: string
  searchBorderColor?: string
  borderColor?: string
  dividerColor?: string

  // Typography
  titleFontSize?: string
  titleFontWeight?: string
  titleFontFamily?: string
  subtitleFontSize?: string
  nameFontSize?: string
  nameFontWeight?: string
  roleFontSize?: string
  bioFontSize?: string
  ratingFontSize?: string
  specialtyFontSize?: string
  availabilityFontSize?: string
  buttonFontSize?: string
  buttonFontWeight?: string
  searchFontSize?: string

  // Shape & Effects
  borderRadius?: string
  cardBorderRadius?: string
  avatarBorderRadius?: string
  buttonBorderRadius?: string
  specialtyBorderRadius?: string
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
  onStaffSelect?: (staff: StaffMember) => void
  onBookClick?: (staff: StaffMember) => void
}

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_STAFF: StaffMember[] = [
  {
    id: '1', name: 'Sarah Johnson', role: 'Senior Therapist', bio: 'Certified massage therapist with over 10 years of experience in deep tissue and Swedish massage techniques.',
    rating: 4.9, reviewCount: 124, specialties: ['Deep Tissue', 'Swedish', 'Hot Stone'], availability: 'Mon-Fri, 9AM-5PM',
    experience: '10+ years', location: 'Main Studio', bookable: true,
  },
  {
    id: '2', name: 'Michael Chen', role: 'Massage Specialist', bio: 'Expert in sports massage and rehabilitation therapy. Former physiotherapist turned wellness professional.',
    rating: 4.8, reviewCount: 89, specialties: ['Sports Massage', 'Rehabilitation', 'Cupping'], availability: 'Tue-Sat, 10AM-6PM',
    experience: '8 years', location: 'Main Studio', bookable: true,
  },
  {
    id: '3', name: 'Emma Williams', role: 'Skincare Expert', bio: 'Licensed esthetician specializing in anti-aging treatments and organic skincare solutions.',
    rating: 4.7, reviewCount: 67, specialties: ['Facials', 'Anti-Aging', 'Organic Skincare'], availability: 'Wed-Sun, 9AM-4PM',
    experience: '6 years', location: 'Downtown', bookable: true,
  },
  {
    id: '4', name: 'David Park', role: 'Hair Stylist', bio: 'Award-winning hair stylist with expertise in cutting-edge techniques and color correction.',
    rating: 4.6, reviewCount: 201, specialties: ['Color', 'Cuts', 'Styling'], availability: 'Mon-Fri, 10AM-7PM',
    experience: '12 years', location: 'Main Studio', bookable: false,
  },
]

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

const AVATAR_SIZES = { sm: 40, md: 56, lg: 72, xl: 96 }

// =============================================================================
// COMPONENT
// =============================================================================

export function StaffGridBlock({
  // Content
  title = 'Our Team',
  subtitle = 'Meet our expert team members.',
  showHeader = true,
  showSearch = false,
  showFilters = false,
  emptyMessage = 'No team members available.',
  searchPlaceholder = 'Search team...',
  bookButtonText = 'Book Now',
  viewProfileText = 'View Profile',
  showBio = true,
  showRating = true,
  showReviewCount = true,
  showSpecialties = true,
  showAvailability = true,
  showExperience = false,
  showLocation = false,
  showBookButton = true,
  showAvatar = true,
  availableLabel = 'Available',
  unavailableLabel = 'Unavailable',
  specialtiesLabel = 'Specialties',

  // Data
  siteId,
  staffId,
  maxStaff = 20,
  filterBySpecialty,
  sortBy = 'name',

  // Layout
  layout = 'grid',
  columns = 3,
  mobileColumns = 1,
  headerAlignment = 'center',
  avatarSize = 'lg',
  avatarShape = 'circle',
  contentAlignment = 'center',
  width,
  minHeight,
  padding = '20px',
  gap = '16px',
  cardPadding = '20px',

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
  avatarBorderColor,
  avatarBgColor,
  nameColor,
  roleColor,
  bioColor,
  ratingColor,
  starColor = '#f59e0b',
  specialtyBgColor,
  specialtyTextColor,
  availableDotColor = '#22c55e',
  unavailableDotColor = '#ef4444',
  buttonBackgroundColor,
  buttonTextColor: btnTextColor = '#ffffff',
  buttonHoverColor,
  searchBgColor,
  searchBorderColor,
  borderColor,
  dividerColor,

  // Typography
  titleFontSize = '22px',
  titleFontWeight = '700',
  titleFontFamily,
  subtitleFontSize = '15px',
  nameFontSize = '16px',
  nameFontWeight = '600',
  roleFontSize = '13px',
  bioFontSize = '13px',
  ratingFontSize = '13px',
  specialtyFontSize = '11px',
  availabilityFontSize = '12px',
  buttonFontSize = '13px',
  buttonFontWeight = '500',
  searchFontSize = '14px',

  // Shape & Effects
  borderRadius = '12px',
  cardBorderRadius = '12px',
  avatarBorderRadius,
  buttonBorderRadius = '8px',
  specialtyBorderRadius = '9999px',
  borderWidth = '1px',
  shadow = 'none',
  cardShadow = 'sm',
  hoverShadow = 'md',
  hoverScale = true,
  animateCards = true,

  // Accessibility
  ariaLabel = 'Staff Team Grid',

  // Events
  className,
  onStaffSelect,
  onBookClick,
}: StaffGridBlockProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(filterBySpecialty || null)

  // Fetch real staff data when siteId is available
  const { staff: realStaff, isLoading } = useBookingStaff(siteId || '')

  // Map DB staff to display format — demo only when no siteId (Studio editor)
  const dataStaff: StaffMember[] = useMemo(() => {
    if (!siteId) return DEMO_STAFF
    return realStaff.map((s: Staff) => ({
      id: s.id,
      name: s.name,
      role: s.bio?.split('.')[0] || 'Team Member',
      bio: s.bio || undefined,
      avatar: s.avatar_url || undefined,
      rating: 0, // Real rating will come from review system when connected
      reviewCount: 0,
      specialties: s.services?.map(svc => svc.name) || [],
      availability: s.accept_bookings ? 'Available' : 'Unavailable',
      experience: undefined,
      location: undefined,
      bookable: s.accept_bookings && s.is_active,
    }))
  }, [siteId, realStaff])

  const allSpecialties = useMemo(() => {
    const s = new Set<string>()
    dataStaff.forEach(staff => staff.specialties.forEach(sp => s.add(sp)))
    return Array.from(s)
  }, [dataStaff])

  const filteredStaff = useMemo(() => {
    let staff = dataStaff
    if (activeSpecialty) staff = staff.filter(s => s.specialties.includes(activeSpecialty))
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      staff = staff.filter(s => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.specialties.some(sp => sp.toLowerCase().includes(q)))
    }
    if (sortBy === 'rating') staff = [...staff].sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'name') staff = [...staff].sort((a, b) => a.name.localeCompare(b.name))
    return staff.slice(0, maxStaff)
  }, [dataStaff, searchQuery, activeSpecialty, maxStaff, sortBy])

  const btnBg = buttonBackgroundColor || primaryColor
  const avSize = AVATAR_SIZES[avatarSize]
  const avBorderRadius = avatarBorderRadius || (avatarShape === 'circle' ? '50%' : avatarShape === 'rounded' ? '12px' : '4px')
  const specBg = specialtyBgColor || `${primaryColor}10`
  const specText = specialtyTextColor || primaryColor
  const isGrid = layout === 'grid' || layout === 'cards'
  const isList = layout === 'list'

  // Loading state when fetching real data
  if (siteId && isLoading) {
    return (
      <div className={cn('staff-grid-block', className)} style={{ backgroundColor: backgroundColor || undefined, borderRadius, border: `${borderWidth} solid ${borderColor || '#e5e7eb'}`, padding, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="region" aria-label={ariaLabel}>
        <div style={{ textAlign: 'center', opacity: 0.6 }}>
          <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '14px', margin: 0 }}>Loading team members...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('staff-grid-block', className)}
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
        borderRadius,
        border: `${borderWidth} solid ${borderColor || '#e5e7eb'}`,
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
          borderBottom: `1px solid ${dividerColor || borderColor || '#e5e7eb'}`,
          textAlign: headerAlignment,
        }}>
          <h3 style={{ fontWeight: titleFontWeight, fontSize: titleFontSize, margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: subtitleFontSize, opacity: 0.7, marginTop: '6px', marginBottom: 0 }}>{subtitle}</p>}
        </div>
      )}

      <div style={{ padding }}>
        {/* Search & Filters */}
        {(showSearch || showFilters) && (
          <div style={{ marginBottom: '16px' }}>
            {showSearch && (
              <div style={{ position: 'relative', marginBottom: showFilters ? '8px' : 0 }}>
                <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, opacity: 0.4 }} />
                <input
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  style={{
                    width: '100%', padding: '9px 12px 9px 34px', borderRadius: buttonBorderRadius,
                    border: `1px solid ${searchBorderColor || borderColor || '#e5e7eb'}`,
                    backgroundColor: searchBgColor || 'transparent', fontSize: searchFontSize, outline: 'none',
                  }}
                  aria-label="Search staff"
                />
              </div>
            )}
            {showFilters && allSpecialties.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveSpecialty(null)} style={{
                  padding: '4px 12px', borderRadius: specialtyBorderRadius, fontSize: specialtyFontSize, fontWeight: 500,
                  border: `1px solid ${!activeSpecialty ? primaryColor : (borderColor || '#e5e7eb')}`,
                  backgroundColor: !activeSpecialty ? primaryColor : 'transparent',
                  color: !activeSpecialty ? '#fff' : undefined, cursor: 'pointer',
                }}>All</button>
                {allSpecialties.map(sp => (
                  <button key={sp} onClick={() => setActiveSpecialty(sp)} style={{
                    padding: '4px 12px', borderRadius: specialtyBorderRadius, fontSize: specialtyFontSize, fontWeight: 500,
                    border: `1px solid ${activeSpecialty === sp ? primaryColor : (borderColor || '#e5e7eb')}`,
                    backgroundColor: activeSpecialty === sp ? primaryColor : 'transparent',
                    color: activeSpecialty === sp ? '#fff' : undefined, cursor: 'pointer',
                  }}>{sp}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Staff Grid/List */}
        {filteredStaff.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: '14px', opacity: 0.6, padding: '32px 0', margin: 0 }}>{emptyMessage}</p>
        ) : (
          <div style={{
            display: isGrid ? 'grid' : 'flex',
            gridTemplateColumns: isGrid ? `repeat(${columns}, 1fr)` : undefined,
            flexDirection: isList ? 'column' : undefined,
            gap,
          }}>
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                onClick={() => onStaffSelect?.(staff)}
                style={{
                  padding: cardPadding,
                  borderRadius: cardBorderRadius,
                  border: `${borderWidth} solid ${cardBorderColor || '#e5e7eb'}`,
                  backgroundColor: cardBackgroundColor || undefined,
                  boxShadow: SHADOW_MAP[cardShadow] || 'none',
                  textAlign: contentAlignment,
                  cursor: 'pointer',
                  transition: animateCards ? 'all 0.2s ease' : 'none',
                  display: isList ? 'flex' : 'block',
                  alignItems: isList ? 'center' : undefined,
                  gap: isList ? '16px' : undefined,
                }}
                onMouseEnter={(e) => {
                  if (animateCards) {
                    (e.currentTarget as HTMLElement).style.boxShadow = SHADOW_MAP[hoverShadow] || SHADOW_MAP.md
                    if (hoverScale) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                    if (cardHoverBgColor) (e.currentTarget as HTMLElement).style.backgroundColor = cardHoverBgColor
                  }
                }}
                onMouseLeave={(e) => {
                  if (animateCards) {
                    (e.currentTarget as HTMLElement).style.boxShadow = SHADOW_MAP[cardShadow] || 'none'
                    if (hoverScale) (e.currentTarget as HTMLElement).style.transform = 'none'
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = cardBackgroundColor || ''
                  }
                }}
              >
                {/* Avatar */}
                {showAvatar && (
                  <div style={{
                    width: avSize, height: avSize, borderRadius: avBorderRadius,
                    backgroundColor: avatarBgColor || `${primaryColor}12`,
                    border: `2px solid ${avatarBorderColor || `${primaryColor}30`}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: !isList && contentAlignment === 'center' ? '0 auto 12px' : isList ? 0 : '0 0 12px',
                    color: primaryColor, fontWeight: 700, fontSize: `${avSize * 0.4}px`,
                    flexShrink: 0, overflow: 'hidden',
                  }}>
                    {staff.avatar ? (
                      <img src={staff.avatar} alt={staff.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      staff.name.split(' ').map(n => n[0]).join('')
                    )}
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  {/* Name & Role */}
                  <h4 style={{ fontWeight: nameFontWeight, fontSize: nameFontSize, margin: '0 0 2px', color: nameColor || undefined }}>
                    {staff.name}
                  </h4>
                  <p style={{ fontSize: roleFontSize, color: roleColor || undefined, opacity: 0.6, margin: '0 0 8px' }}>
                    {staff.role}
                  </p>

                  {/* Rating — only show when there are reviews */}
                  {showRating && staff.rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', justifyContent: contentAlignment === 'center' && !isList ? 'center' : undefined }}>
                      <Star style={{ width: 14, height: 14, fill: starColor, color: starColor }} />
                      <span style={{ fontWeight: 600, fontSize: ratingFontSize, color: ratingColor || undefined }}>{staff.rating.toFixed(1)}</span>
                      {showReviewCount && <span style={{ fontSize: ratingFontSize, opacity: 0.5 }}>({staff.reviewCount} reviews)</span>}
                    </div>
                  )}

                  {/* Bio */}
                  {showBio && staff.bio && !isList && (
                    <p style={{ fontSize: bioFontSize, color: bioColor || undefined, opacity: 0.7, margin: '0 0 10px', lineHeight: 1.5 }}>
                      {staff.bio}
                    </p>
                  )}

                  {/* Specialties */}
                  {showSpecialties && staff.specialties.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px', justifyContent: contentAlignment === 'center' && !isList ? 'center' : undefined }}>
                      {staff.specialties.map(sp => (
                        <span key={sp} style={{
                          padding: '2px 8px', borderRadius: specialtyBorderRadius, fontSize: specialtyFontSize, fontWeight: 500,
                          backgroundColor: specBg, color: specText,
                        }}>{sp}</span>
                      ))}
                    </div>
                  )}

                  {/* Availability */}
                  {showAvailability && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: showBookButton ? '10px' : 0, justifyContent: contentAlignment === 'center' && !isList ? 'center' : undefined }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        backgroundColor: staff.bookable ? availableDotColor : unavailableDotColor,
                        display: 'inline-block',
                      }} />
                      <span style={{ fontSize: availabilityFontSize, opacity: 0.6 }}>
                        {staff.bookable ? `${availableLabel} · ${staff.availability}` : unavailableLabel}
                      </span>
                    </div>
                  )}

                  {/* Experience & Location */}
                  {(showExperience || showLocation) && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: showBookButton ? '10px' : 0, fontSize: '12px', opacity: 0.6, justifyContent: contentAlignment === 'center' && !isList ? 'center' : undefined }}>
                      {showExperience && staff.experience && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Award style={{ width: 12, height: 12 }} /> {staff.experience}
                        </span>
                      )}
                      {showLocation && staff.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin style={{ width: 12, height: 12 }} /> {staff.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Book Button */}
                {showBookButton && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onBookClick?.(staff) }}
                    disabled={!staff.bookable}
                    style={{
                      padding: '8px 16px', borderRadius: buttonBorderRadius,
                      backgroundColor: staff.bookable ? btnBg : '#e5e7eb',
                      color: staff.bookable ? btnTextColor : '#9ca3af',
                      border: 'none', fontSize: buttonFontSize, fontWeight: buttonFontWeight,
                      cursor: staff.bookable ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      width: isList ? 'auto' : '100%', justifyContent: 'center',
                      marginTop: isList ? 0 : undefined,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (staff.bookable && buttonHoverColor) (e.target as HTMLElement).style.backgroundColor = buttonHoverColor }}
                    onMouseLeave={(e) => { if (staff.bookable) (e.target as HTMLElement).style.backgroundColor = btnBg }}
                  >
                    <Calendar style={{ width: 14, height: 14 }} />
                    {staff.bookable ? bookButtonText : unavailableLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// STUDIO DEFINITION — 50+ fields with field groups
// =============================================================================

export const staffGridDefinition: ComponentDefinition = {
  type: 'BookingStaffGrid',
  label: 'Staff Grid',
  description: 'Display team members with bio, rating, specialties, and book button — 50+ customization options. Use instead of generic Team component for booking-enabled businesses.',
  category: 'content',
  icon: 'Users',
  keywords: ['staff', 'team', 'grid', 'members', 'booking', 'professionals', 'therapist', 'employees'],
  defaultProps: {
    title: 'Our Team',
    subtitle: 'Meet our expert team members.',
    showHeader: true,
    showSearch: false,
    showFilters: false,
    showBio: true,
    showRating: true,
    showReviewCount: true,
    showSpecialties: true,
    showAvailability: true,
    showExperience: false,
    showLocation: false,
    showBookButton: true,
    showAvatar: true,
    layout: 'grid',
    columns: 3,
    mobileColumns: 1,
    headerAlignment: 'center',
    avatarSize: 'lg',
    avatarShape: 'circle',
    contentAlignment: 'center',
    sortBy: 'name',
    primaryColor: '#8B5CF6',
    buttonTextColor: '#ffffff',
    starColor: '#f59e0b',
    availableDotColor: '#22c55e',
    unavailableDotColor: '#ef4444',
    borderRadius: '12px',
    cardBorderRadius: '12px',
    buttonBorderRadius: '8px',
    specialtyBorderRadius: '9999px',
    borderWidth: '1px',
    shadow: 'none',
    cardShadow: 'sm',
    hoverShadow: 'md',
    hoverScale: true,
    animateCards: true,
    titleFontSize: '22px',
    titleFontWeight: '700',
    nameFontSize: '16px',
    nameFontWeight: '600',
    padding: '20px',
    gap: '16px',
    cardPadding: '20px',
  },
  fields: {
    // Content (21)
    title: { type: 'text', label: 'Title' },
    subtitle: { type: 'text', label: 'Subtitle' },
    showHeader: { type: 'toggle', label: 'Show Header' },
    showSearch: { type: 'toggle', label: 'Show Search' },
    showFilters: { type: 'toggle', label: 'Show Specialty Filters' },
    emptyMessage: { type: 'text', label: 'Empty Message' },
    searchPlaceholder: { type: 'text', label: 'Search Placeholder' },
    bookButtonText: { type: 'text', label: 'Book Button Text' },
    viewProfileText: { type: 'text', label: 'View Profile Text' },
    showBio: { type: 'toggle', label: 'Show Bio' },
    showRating: { type: 'toggle', label: 'Show Rating' },
    showReviewCount: { type: 'toggle', label: 'Show Review Count' },
    showSpecialties: { type: 'toggle', label: 'Show Specialties' },
    showAvailability: { type: 'toggle', label: 'Show Availability' },
    showExperience: { type: 'toggle', label: 'Show Experience' },
    showLocation: { type: 'toggle', label: 'Show Location' },
    showBookButton: { type: 'toggle', label: 'Show Book Button' },
    showAvatar: { type: 'toggle', label: 'Show Avatar' },
    availableLabel: { type: 'text', label: 'Available Label' },
    unavailableLabel: { type: 'text', label: 'Unavailable Label' },
    specialtiesLabel: { type: 'text', label: 'Specialties Label' },

    // Data (4)
    staffId: { type: 'custom', customType: 'booking:staff-selector', label: 'Highlight Staff' },
    maxStaff: { type: 'number', label: 'Max Staff Shown', min: 1, max: 50 },
    filterBySpecialty: { type: 'text', label: 'Filter by Specialty' },
    sortBy: { type: 'select', label: 'Sort By', options: [{ label: 'Name', value: 'name' }, { label: 'Rating', value: 'rating' }, { label: 'Experience', value: 'experience' }] },

    // Layout (11)
    layout: { type: 'select', label: 'Layout', options: [{ label: 'Grid', value: 'grid' }, { label: 'List', value: 'list' }, { label: 'Cards', value: 'cards' }, { label: 'Carousel', value: 'carousel' }] },
    columns: { type: 'number', label: 'Columns', min: 1, max: 6 },
    mobileColumns: { type: 'number', label: 'Mobile Columns', min: 1, max: 3 },
    headerAlignment: { type: 'select', label: 'Header Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }] },
    avatarSize: { type: 'select', label: 'Avatar Size', options: [{ label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }] },
    avatarShape: { type: 'select', label: 'Avatar Shape', options: [{ label: 'Circle', value: 'circle' }, { label: 'Rounded', value: 'rounded' }, { label: 'Square', value: 'square' }] },
    contentAlignment: { type: 'select', label: 'Content Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }] },
    width: { type: 'text', label: 'Width' },
    padding: { type: 'text', label: 'Padding' },
    gap: { type: 'text', label: 'Gap' },
    cardPadding: { type: 'text', label: 'Card Padding' },

    // Colors (27)
    primaryColor: { type: 'color', label: 'Primary Color' },
    secondaryColor: { type: 'color', label: 'Secondary Color' },
    backgroundColor: { type: 'color', label: 'Background' },
    textColor: { type: 'color', label: 'Text Color' },
    headerBackgroundColor: { type: 'color', label: 'Header Background' },
    headerTextColor: { type: 'color', label: 'Header Text' },
    cardBackgroundColor: { type: 'color', label: 'Card Background' },
    cardHoverBgColor: { type: 'color', label: 'Card Hover Background' },
    cardBorderColor: { type: 'color', label: 'Card Border' },
    avatarBorderColor: { type: 'color', label: 'Avatar Border' },
    avatarBgColor: { type: 'color', label: 'Avatar Background' },
    nameColor: { type: 'color', label: 'Name Color' },
    roleColor: { type: 'color', label: 'Role Color' },
    bioColor: { type: 'color', label: 'Bio Color' },
    ratingColor: { type: 'color', label: 'Rating Text Color' },
    starColor: { type: 'color', label: 'Star Color' },
    specialtyBgColor: { type: 'color', label: 'Specialty Background' },
    specialtyTextColor: { type: 'color', label: 'Specialty Text' },
    availableDotColor: { type: 'color', label: 'Available Dot Color' },
    unavailableDotColor: { type: 'color', label: 'Unavailable Dot Color' },
    buttonBackgroundColor: { type: 'color', label: 'Button Background' },
    buttonTextColor: { type: 'color', label: 'Button Text' },
    buttonHoverColor: { type: 'color', label: 'Button Hover' },
    searchBgColor: { type: 'color', label: 'Search Background' },
    searchBorderColor: { type: 'color', label: 'Search Border' },
    borderColor: { type: 'color', label: 'Border Color' },
    dividerColor: { type: 'color', label: 'Divider Color' },

    // Typography (14)
    titleFontSize: { type: 'text', label: 'Title Font Size' },
    titleFontWeight: { type: 'select', label: 'Title Weight', options: [{ label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }, { label: 'Extra Bold', value: '800' }] },
    titleFontFamily: { type: 'text', label: 'Font Family' },
    subtitleFontSize: { type: 'text', label: 'Subtitle Font Size' },
    nameFontSize: { type: 'text', label: 'Name Font Size' },
    nameFontWeight: { type: 'select', label: 'Name Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    roleFontSize: { type: 'text', label: 'Role Font Size' },
    bioFontSize: { type: 'text', label: 'Bio Font Size' },
    ratingFontSize: { type: 'text', label: 'Rating Font Size' },
    specialtyFontSize: { type: 'text', label: 'Specialty Font Size' },
    availabilityFontSize: { type: 'text', label: 'Availability Font Size' },
    buttonFontSize: { type: 'text', label: 'Button Font Size' },
    buttonFontWeight: { type: 'select', label: 'Button Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    searchFontSize: { type: 'text', label: 'Search Font Size' },

    // Shape & Effects (11)
    borderRadius: { type: 'text', label: 'Container Radius' },
    cardBorderRadius: { type: 'text', label: 'Card Radius' },
    avatarBorderRadius: { type: 'text', label: 'Avatar Radius' },
    buttonBorderRadius: { type: 'text', label: 'Button Radius' },
    specialtyBorderRadius: { type: 'text', label: 'Specialty Pill Radius' },
    borderWidth: { type: 'text', label: 'Border Width' },
    shadow: { type: 'select', label: 'Container Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }] },
    cardShadow: { type: 'select', label: 'Card Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }] },
    hoverShadow: { type: 'select', label: 'Hover Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }] },
    hoverScale: { type: 'toggle', label: 'Hover Lift' },
    animateCards: { type: 'toggle', label: 'Animate Cards' },

    // Accessibility (1)
    ariaLabel: { type: 'text', label: 'ARIA Label' },
  },
  fieldGroups: [
    { id: 'content', label: 'Content', icon: 'Type', fields: ['title', 'subtitle', 'showHeader', 'showSearch', 'showFilters', 'emptyMessage', 'searchPlaceholder', 'bookButtonText', 'viewProfileText', 'showBio', 'showRating', 'showReviewCount', 'showSpecialties', 'showAvailability', 'showExperience', 'showLocation', 'showBookButton', 'showAvatar', 'availableLabel', 'unavailableLabel', 'specialtiesLabel'], defaultExpanded: true },
    { id: 'data', label: 'Data Connection', icon: 'Database', fields: ['staffId', 'maxStaff', 'filterBySpecialty', 'sortBy'], defaultExpanded: true },
    { id: 'layout', label: 'Layout', icon: 'Layout', fields: ['layout', 'columns', 'mobileColumns', 'headerAlignment', 'avatarSize', 'avatarShape', 'contentAlignment', 'width', 'padding', 'gap', 'cardPadding'], defaultExpanded: false },
    { id: 'colors', label: 'Colors', icon: 'Palette', fields: ['primaryColor', 'secondaryColor', 'backgroundColor', 'textColor', 'headerBackgroundColor', 'headerTextColor', 'cardBackgroundColor', 'cardHoverBgColor', 'cardBorderColor', 'avatarBorderColor', 'avatarBgColor', 'nameColor', 'roleColor', 'bioColor', 'ratingColor', 'starColor', 'specialtyBgColor', 'specialtyTextColor', 'availableDotColor', 'unavailableDotColor', 'buttonBackgroundColor', 'buttonTextColor', 'buttonHoverColor', 'searchBgColor', 'searchBorderColor', 'borderColor', 'dividerColor'], defaultExpanded: false },
    { id: 'typography', label: 'Typography', icon: 'ALargeSmall', fields: ['titleFontSize', 'titleFontWeight', 'titleFontFamily', 'subtitleFontSize', 'nameFontSize', 'nameFontWeight', 'roleFontSize', 'bioFontSize', 'ratingFontSize', 'specialtyFontSize', 'availabilityFontSize', 'buttonFontSize', 'buttonFontWeight', 'searchFontSize'], defaultExpanded: false },
    { id: 'shape', label: 'Shape & Effects', icon: 'Square', fields: ['borderRadius', 'cardBorderRadius', 'avatarBorderRadius', 'buttonBorderRadius', 'specialtyBorderRadius', 'borderWidth', 'shadow', 'cardShadow', 'hoverShadow', 'hoverScale', 'animateCards'], defaultExpanded: false },
    { id: 'accessibility', label: 'Accessibility', icon: 'Accessibility', fields: ['ariaLabel'], defaultExpanded: false },
  ],
  ai: {
    description: 'Staff team grid with ratings, specialties, and booking — 50+ properties',
    canModify: ['title', 'subtitle', 'layout', 'columns', 'avatarSize', 'avatarShape', 'primaryColor', 'backgroundColor', 'showBio', 'showRating', 'showSpecialties', 'showBookButton', 'contentAlignment'],
    suggestions: ['Show as list', 'Make 2 columns', 'Use square avatars', 'Hide bio', 'Enable search and filters', 'Sort by rating'],
  },
  render: StaffGridBlock,
}

export default StaffGridBlock
