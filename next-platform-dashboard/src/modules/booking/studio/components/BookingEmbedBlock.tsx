/**
 * Booking Embed Block - Studio Component
 * 
 * Renders an embeddable booking widget via iframe on Studio pages.
 * This is the component users drag onto pages to embed the booking system.
 */
'use client'

import React, { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Calendar, Code, ExternalLink, Monitor, Smartphone, Tablet } from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'

// =============================================================================
// TYPES
// =============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

type WidgetType = 'full' | 'calendar-only' | 'button-popup'

export interface BookingEmbedBlockProps {
  siteId?: string
  widgetType?: WidgetType
  embedHeight?: ResponsiveValue<string>
  primaryColor?: string
  borderRadius?: ResponsiveValue<string>
  showHeader?: boolean
  showServiceSelector?: boolean
  showStaffSelector?: boolean
  buttonText?: string
  className?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BookingEmbedBlock({
  siteId,
  widgetType = 'full',
  embedHeight,
  primaryColor = '#8B5CF6',
  borderRadius,
  showHeader = true,
  showServiceSelector = true,
  showStaffSelector = true,
  buttonText = 'Book Now',
  className,
}: BookingEmbedBlockProps) {
  const [previewMode, setPreviewMode] = useState<'embed' | 'preview'>('preview')

  // Resolve responsive height
  const resolvedHeight = typeof embedHeight === 'object'
    ? embedHeight?.desktop || '600px'
    : embedHeight || '600px'

  // Build embed URL
  const embedUrl = useMemo(() => {
    if (!siteId) return null
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const params = new URLSearchParams({
      type: widgetType,
      color: primaryColor.replace('#', ''),
    })

    if (!showHeader) params.append('hideHeader', '1')
    if (!showServiceSelector) params.append('hideServices', '1')
    if (!showStaffSelector) params.append('hideStaff', '1')
    if (widgetType === 'button-popup') {
      params.append('buttonText', buttonText)
    }

    return `${baseUrl}/embed/booking/${siteId}?${params.toString()}`
  }, [siteId, widgetType, primaryColor, showHeader, showServiceSelector, showStaffSelector, buttonText])

  const resolvedRadius = typeof borderRadius === 'object'
    ? borderRadius?.desktop || '12px'
    : borderRadius || '12px'

  // Button popup mode
  if (widgetType === 'button-popup') {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <button
          style={{
            backgroundColor: primaryColor,
            color: '#fff',
            borderRadius: resolvedRadius,
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <Calendar style={{ width: 18, height: 18 }} />
          {buttonText}
        </button>
        {!siteId && (
          <p style={{ 
            position: 'absolute', 
            bottom: 8, 
            fontSize: '12px', 
            color: '#9CA3AF' 
          }}>
            Button will open booking popup when published
          </p>
        )}
      </div>
    )
  }

  // No siteId — show placeholder
  if (!siteId || !embedUrl) {
    return (
      <div
        className={cn('relative', className)}
        style={{ borderRadius: resolvedRadius, overflow: 'hidden' }}
      >
        <div
          style={{
            height: resolvedHeight,
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            border: '2px dashed #c4b5fd',
            borderRadius: resolvedRadius,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar style={{ width: 32, height: 32, color: '#fff' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 600, color: '#4c1d95', margin: 0 }}>
              Booking Widget
            </p>
            <p style={{ fontSize: '14px', color: '#7c3aed', marginTop: 4 }}>
              Connect a site to display the booking embed
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            {['Full Widget', 'Calendar Only', 'Popup Button'].map((label, i) => (
              <span
                key={i}
                style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  background: i === 0 ? primaryColor : '#e9d5ff',
                  color: i === 0 ? '#fff' : '#6d28d9',
                  fontWeight: 500,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // With siteId — show embed preview or iframe
  return (
    <div
      className={cn('relative', className)}
      style={{ borderRadius: resolvedRadius, overflow: 'hidden' }}
    >
      {/* Toggle bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '13px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280' }}>
          <Code style={{ width: 14, height: 14 }} />
          <span>Booking Embed</span>
          <span style={{ 
            padding: '1px 6px', 
            borderRadius: 4, 
            background: '#dbeafe', 
            color: '#1d4ed8',
            fontSize: '11px',
            fontWeight: 500,
          }}>
            {widgetType === 'full' ? 'Full Widget' : 'Calendar Only'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setPreviewMode('preview')}
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '12px',
              background: previewMode === 'preview' ? primaryColor : 'transparent',
              color: previewMode === 'preview' ? '#fff' : '#6b7280',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Preview
          </button>
          <button
            onClick={() => setPreviewMode('embed')}
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '12px',
              background: previewMode === 'embed' ? primaryColor : 'transparent',
              color: previewMode === 'embed' ? '#fff' : '#6b7280',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Code
          </button>
        </div>
      </div>

      {previewMode === 'preview' ? (
        <iframe
          src={embedUrl}
          style={{
            width: '100%',
            height: resolvedHeight,
            border: 'none',
          }}
          title="Booking Widget Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      ) : (
        <div
          style={{
            height: resolvedHeight,
            background: '#1e1e2e',
            padding: '16px',
            overflow: 'auto',
          }}
        >
          <pre
            style={{
              color: '#a6e3a1',
              fontSize: '13px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}
          >
            {`<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="${resolvedHeight}"\n  frameborder="0"\n  allow="payment"\n  title="Booking Widget"\n></iframe>`}
          </pre>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COMPONENT DEFINITION
// =============================================================================

export const bookingEmbedDefinition: ComponentDefinition = {
  type: 'booking-embed',
  label: 'Booking Embed',
  description: 'Embed a booking widget on your page for customers to book appointments',
  icon: 'Code',
  category: 'interactive',
  keywords: ['booking', 'embed', 'widget', 'appointment', 'iframe', 'schedule', 'calendar'],
  defaultProps: {
    widgetType: 'full',
    primaryColor: '#8B5CF6',
    showHeader: true,
    showServiceSelector: true,
    showStaffSelector: true,
    buttonText: 'Book Now',
    embedHeight: { mobile: '500px', tablet: '600px', desktop: '700px' },
    borderRadius: { mobile: '8px', tablet: '12px', desktop: '12px' },
  },
  fields: {
    widgetType: {
      type: 'select',
      label: 'Widget Type',
      description: 'Choose the booking widget layout',
      options: [
        { label: 'Full Widget', value: 'full' },
        { label: 'Calendar Only', value: 'calendar-only' },
        { label: 'Button Popup', value: 'button-popup' },
      ],
    },
    showHeader: {
      type: 'toggle',
      label: 'Show Header',
      description: 'Display the widget header with title',
    },
    showServiceSelector: {
      type: 'toggle',
      label: 'Show Service Selector',
      description: 'Allow customers to choose a service',
    },
    showStaffSelector: {
      type: 'toggle',
      label: 'Show Staff Selector',
      description: 'Allow customers to choose a staff member',
    },
    buttonText: {
      type: 'text',
      label: 'Button Text',
      description: 'Text for the popup button (button-popup mode)',
    },
    primaryColor: {
      type: 'color',
      label: 'Primary Color',
      description: 'Accent color for the booking widget',
    },
    embedHeight: {
      type: 'spacing',
      label: 'Widget Height',
      description: 'Height of the embedded widget',
      responsive: true,
    },
    borderRadius: {
      type: 'spacing',
      label: 'Border Radius',
      description: 'Corner roundness',
    },
  },
  ai: {
    description: 'Embeddable booking widget that lets customers book appointments directly on the page',
    canModify: ['widgetType', 'showHeader', 'showServiceSelector', 'showStaffSelector', 'primaryColor', 'borderRadius', 'buttonText'],
    suggestions: [
      'Show only the calendar',
      'Use a popup button instead',
      'Change to brand colors',
      'Hide the staff selector',
    ],
  },
  render: BookingEmbedBlock,
}

export default BookingEmbedBlock
