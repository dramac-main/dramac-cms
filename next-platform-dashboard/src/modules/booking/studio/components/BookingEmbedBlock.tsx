/**
 * Booking Embed Block - Studio Component
 * 
 * Embeddable booking widget via iframe or inline display.
 * 50+ customization properties with full theme support.
 * 
 * @module booking
 */
'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Code, Eye, ExternalLink, Copy, Check, Calendar, Settings, Maximize2 } from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'

// =============================================================================
// TYPES
// =============================================================================

export interface BookingEmbedBlockProps {
  // Content
  title?: string
  subtitle?: string
  showHeader?: boolean
  previewLabel?: string
  codeLabel?: string
  copyButtonText?: string
  copiedText?: string
  openInNewTabText?: string
  noSiteMessage?: string
  noSiteDescription?: string
  connectButtonText?: string

  // Embed Settings
  siteId?: string
  embedUrl?: string
  embedType?: 'iframe' | 'popup' | 'inline'
  embedWidth?: string
  embedHeight?: string
  embedMinHeight?: string
  allowFullscreen?: boolean
  lazyLoad?: boolean
  showBorder?: boolean
  showToolbar?: boolean
  toolbarPosition?: 'top' | 'bottom'

  // Button Trigger (for popup mode)
  buttonText?: string
  buttonIcon?: boolean
  buttonSize?: 'sm' | 'md' | 'lg'

  // Layout
  headerAlignment?: 'left' | 'center' | 'right'
  width?: string
  minHeight?: string
  padding?: string
  gap?: string

  // Style - Colors
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
  headerBackgroundColor?: string
  headerTextColor?: string
  toolbarBackgroundColor?: string
  toolbarTextColor?: string
  tabActiveColor?: string
  tabInactiveColor?: string
  tabActiveBgColor?: string
  codeBackgroundColor?: string
  codeTextColor?: string
  buttonBackgroundColor?: string
  buttonTextColor?: string
  buttonHoverColor?: string
  embedBorderColor?: string
  embedBackgroundColor?: string
  borderColor?: string
  dividerColor?: string
  noSiteIconColor?: string
  copySuccessColor?: string

  // Typography
  titleFontSize?: string
  titleFontWeight?: string
  titleFontFamily?: string
  subtitleFontSize?: string
  codeFontSize?: string
  codeFontFamily?: string
  buttonFontSize?: string
  buttonFontWeight?: string
  tabFontSize?: string
  tabFontWeight?: string

  // Shape & Effects
  borderRadius?: string
  embedBorderRadius?: string
  buttonBorderRadius?: string
  tabBorderRadius?: string
  borderWidth?: string
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  embedShadow?: 'none' | 'sm' | 'md' | 'lg'
  animateTabs?: boolean

  // Accessibility
  ariaLabel?: string

  // Events
  className?: string
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

// =============================================================================
// COMPONENT
// =============================================================================

export function BookingEmbedBlock({
  // Content
  title = 'Booking Widget',
  subtitle = 'Embed this widget on your website or share the link.',
  showHeader = true,
  previewLabel = 'Preview',
  codeLabel = 'Embed Code',
  copyButtonText = 'Copy Code',
  copiedText = 'Copied!',
  openInNewTabText = 'Open in New Tab',
  noSiteMessage = 'No site connected',
  noSiteDescription = 'Connect a site to generate the embed code for your booking widget.',
  connectButtonText = 'Connect Site',

  // Embed Settings
  siteId,
  embedUrl,
  embedType = 'iframe',
  embedWidth = '100%',
  embedHeight = '600px',
  embedMinHeight = '400px',
  allowFullscreen = true,
  lazyLoad = true,
  showBorder = true,
  showToolbar = true,
  toolbarPosition = 'top',

  // Button Trigger
  buttonText = 'Book Now',
  buttonIcon = true,
  buttonSize = 'md',

  // Layout
  headerAlignment = 'left',
  width,
  minHeight,
  padding = '16px',
  gap = '12px',

  // Colors
  primaryColor = '#8B5CF6',
  backgroundColor,
  textColor,
  headerBackgroundColor,
  headerTextColor,
  toolbarBackgroundColor,
  toolbarTextColor,
  tabActiveColor,
  tabInactiveColor,
  tabActiveBgColor,
  codeBackgroundColor,
  codeTextColor,
  buttonBackgroundColor,
  buttonTextColor: btnTextColor = '#ffffff',
  buttonHoverColor,
  embedBorderColor,
  embedBackgroundColor,
  borderColor,
  dividerColor,
  noSiteIconColor,
  copySuccessColor = '#22c55e',

  // Typography
  titleFontSize = '18px',
  titleFontWeight = '600',
  titleFontFamily,
  subtitleFontSize = '14px',
  codeFontSize = '13px',
  codeFontFamily = 'monospace',
  buttonFontSize = '14px',
  buttonFontWeight = '500',
  tabFontSize = '13px',
  tabFontWeight = '500',

  // Shape & Effects
  borderRadius = '12px',
  embedBorderRadius = '8px',
  buttonBorderRadius = '8px',
  tabBorderRadius = '6px',
  borderWidth = '1px',
  shadow = 'sm',
  embedShadow = 'sm',
  animateTabs = true,

  // Accessibility
  ariaLabel = 'Booking Embed Widget',

  // Events
  className,
}: BookingEmbedBlockProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)

  const resolvedUrl = embedUrl || (siteId ? `https://book.dramac.app/${siteId}` : '')
  const btnBg = buttonBackgroundColor || primaryColor
  const activeTabColor = tabActiveColor || primaryColor
  const activeTabBg = tabActiveBgColor || `${primaryColor}10`
  const inactiveTab = tabInactiveColor || undefined
  const noSiteIcon = noSiteIconColor || primaryColor

  const embedCode = resolvedUrl
    ? `<iframe\n  src="${resolvedUrl}"\n  width="${embedWidth}"\n  height="${embedHeight}"\n  frameborder="0"\n  allow="payment"\n  style="border-radius: ${embedBorderRadius}; border: ${showBorder ? `1px solid ${embedBorderColor || '#e5e7eb'}` : 'none'};"\n  ${allowFullscreen ? 'allowfullscreen' : ''}\n  ${lazyLoad ? 'loading="lazy"' : ''}\n></iframe>`
    : ''

  const popupCode = resolvedUrl
    ? `<script>\n  function openBooking() {\n    window.open('${resolvedUrl}', 'booking', 'width=500,height=700');\n  }\n</script>\n<button onclick="openBooking()"\n  style="padding: 12px 24px; background: ${primaryColor}; color: #fff; border: none; border-radius: ${buttonBorderRadius}; cursor: pointer; font-size: ${buttonFontSize};">\n  ${buttonText}\n</button>`
    : ''

  const handleCopy = async () => {
    const code = embedType === 'popup' ? popupCode : embedCode
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const btnSizes = { sm: '8px 16px', md: '10px 20px', lg: '14px 28px' }

  // No site connected state
  if (!siteId && !embedUrl) {
    return (
      <div
        className={cn('booking-embed-block', className)}
        style={{
          backgroundColor: backgroundColor || undefined,
          color: textColor || undefined,
          borderRadius,
          border: `${borderWidth} solid ${borderColor || '#e5e7eb'}`,
          boxShadow: SHADOW_MAP[shadow] || 'none',
          width: width || '100%',
          padding: '40px 20px',
          textAlign: 'center',
          fontFamily: titleFontFamily || undefined,
        }}
        role="region"
        aria-label={ariaLabel}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%', backgroundColor: `${noSiteIcon}10`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <Calendar style={{ width: 28, height: 28, color: noSiteIcon, opacity: 0.6 }} />
        </div>
        <h3 style={{ fontWeight: titleFontWeight, fontSize: titleFontSize, margin: '0 0 8px' }}>{noSiteMessage}</h3>
        <p style={{ fontSize: subtitleFontSize, opacity: 0.6, margin: '0 0 20px', lineHeight: 1.5 }}>{noSiteDescription}</p>
        <button style={{
          padding: btnSizes[buttonSize], borderRadius: buttonBorderRadius,
          backgroundColor: btnBg, color: btnTextColor,
          border: 'none', fontSize: buttonFontSize, fontWeight: buttonFontWeight, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: '8px',
        }}>
          <Settings style={{ width: 16, height: 16 }} />
          {connectButtonText}
        </button>
      </div>
    )
  }

  const toolbar = showToolbar && (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: `8px ${padding}`,
      backgroundColor: toolbarBackgroundColor || undefined,
      color: toolbarTextColor || undefined,
      borderBottom: toolbarPosition === 'top' ? `1px solid ${dividerColor || borderColor || '#e5e7eb'}` : undefined,
      borderTop: toolbarPosition === 'bottom' ? `1px solid ${dividerColor || borderColor || '#e5e7eb'}` : undefined,
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {[{ id: 'preview' as const, label: previewLabel, icon: <Eye style={{ width: 14, height: 14 }} /> },
          { id: 'code' as const, label: codeLabel, icon: <Code style={{ width: 14, height: 14 }} /> }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 12px', borderRadius: tabBorderRadius,
              backgroundColor: activeTab === tab.id ? activeTabBg : 'transparent',
              color: activeTab === tab.id ? activeTabColor : inactiveTab,
              border: 'none', fontSize: tabFontSize, fontWeight: activeTab === tab.id ? '600' : tabFontWeight,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: animateTabs ? 'all 0.15s ease' : 'none',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {activeTab === 'code' && (
          <button onClick={handleCopy}
            style={{
              padding: '6px 12px', borderRadius: tabBorderRadius,
              backgroundColor: copied ? `${copySuccessColor}10` : 'transparent',
              color: copied ? copySuccessColor : undefined,
              border: `1px solid ${copied ? copySuccessColor : (borderColor || '#e5e7eb')}`,
              fontSize: tabFontSize, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
            {copied ? copiedText : copyButtonText}
          </button>
        )}
        <button onClick={() => window.open(resolvedUrl, '_blank')}
          style={{
            padding: '6px 12px', borderRadius: tabBorderRadius,
            backgroundColor: 'transparent', color: undefined,
            border: `1px solid ${borderColor || '#e5e7eb'}`,
            fontSize: tabFontSize, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          <ExternalLink style={{ width: 14, height: 14 }} /> {openInNewTabText}
        </button>
      </div>
    </div>
  )

  return (
    <div
      className={cn('booking-embed-block', className)}
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
          {subtitle && <p style={{ fontSize: subtitleFontSize, opacity: 0.7, marginTop: '4px', marginBottom: 0 }}>{subtitle}</p>}
        </div>
      )}

      {/* Toolbar (top) */}
      {toolbarPosition === 'top' && toolbar}

      {/* Content */}
      <div style={{ padding }}>
        {activeTab === 'preview' ? (
          embedType === 'popup' ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '14px', opacity: 0.6, marginBottom: '16px' }}>Click the button below to preview the popup booking widget.</p>
              <button
                onClick={() => window.open(resolvedUrl, 'booking', 'width=500,height=700')}
                style={{
                  padding: btnSizes[buttonSize], borderRadius: buttonBorderRadius,
                  backgroundColor: btnBg, color: btnTextColor,
                  border: 'none', fontSize: buttonFontSize, fontWeight: buttonFontWeight, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                }}
              >
                {buttonIcon && <Calendar style={{ width: 18, height: 18 }} />}
                {buttonText}
              </button>
            </div>
          ) : (
            <div style={{
              borderRadius: embedBorderRadius,
              border: showBorder ? `1px solid ${embedBorderColor || '#e5e7eb'}` : 'none',
              boxShadow: SHADOW_MAP[embedShadow] || 'none',
              overflow: 'hidden',
              backgroundColor: embedBackgroundColor || '#f9fafb',
            }}>
              <iframe
                src={resolvedUrl}
                width={embedWidth}
                height={embedHeight}
                style={{ border: 'none', display: 'block', minHeight: embedMinHeight, borderRadius: embedBorderRadius }}
                allow="payment"
                allowFullScreen={allowFullscreen}
                loading={lazyLoad ? 'lazy' : undefined}
                title="Booking Widget"
              />
            </div>
          )
        ) : (
          <div style={{
            borderRadius: embedBorderRadius,
            backgroundColor: codeBackgroundColor || '#1e1e1e',
            color: codeTextColor || '#d4d4d4',
            padding: '16px',
            fontSize: codeFontSize,
            fontFamily: codeFontFamily,
            overflow: 'auto',
            maxHeight: '400px',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {embedType === 'popup' ? popupCode : embedCode}
          </div>
        )}
      </div>

      {/* Toolbar (bottom) */}
      {toolbarPosition === 'bottom' && toolbar}
    </div>
  )
}

// =============================================================================
// STUDIO DEFINITION — 50+ fields with field groups
// =============================================================================

export const bookingEmbedDefinition: ComponentDefinition = {
  type: 'BookingEmbed',
  label: 'Booking Embed',
  description: 'Embeddable booking widget with preview and embed code — 50+ customization options',
  category: 'interactive',
  icon: 'Code',
  keywords: ['booking', 'embed', 'iframe', 'widget', 'popup', 'code', 'integration'],
  defaultProps: {
    title: 'Booking Widget',
    subtitle: 'Embed this widget on your website or share the link.',
    showHeader: true,
    embedType: 'iframe',
    embedWidth: '100%',
    embedHeight: '600px',
    embedMinHeight: '400px',
    allowFullscreen: true,
    lazyLoad: true,
    showBorder: true,
    showToolbar: true,
    toolbarPosition: 'top',
    buttonText: 'Book Now',
    buttonIcon: true,
    buttonSize: 'md',
    headerAlignment: 'left',
    primaryColor: '#8B5CF6',
    buttonTextColor: '#ffffff',
    copySuccessColor: '#22c55e',
    borderRadius: '12px',
    embedBorderRadius: '8px',
    buttonBorderRadius: '8px',
    tabBorderRadius: '6px',
    borderWidth: '1px',
    shadow: 'sm',
    embedShadow: 'sm',
    animateTabs: true,
    titleFontSize: '18px',
    titleFontWeight: '600',
    codeFontFamily: 'monospace',
    padding: '16px',
    gap: '12px',
  },
  fields: {
    // Content (11)
    title: { type: 'text', label: 'Title' },
    subtitle: { type: 'text', label: 'Subtitle' },
    showHeader: { type: 'toggle', label: 'Show Header' },
    previewLabel: { type: 'text', label: 'Preview Tab Label' },
    codeLabel: { type: 'text', label: 'Code Tab Label' },
    copyButtonText: { type: 'text', label: 'Copy Button Text' },
    copiedText: { type: 'text', label: 'Copied Text' },
    openInNewTabText: { type: 'text', label: 'Open in New Tab Text' },
    noSiteMessage: { type: 'text', label: 'No Site Message' },
    noSiteDescription: { type: 'text', label: 'No Site Description' },
    connectButtonText: { type: 'text', label: 'Connect Button Text' },

    // Embed Settings (11)
    siteId: { type: 'text', label: 'Site ID' },
    embedUrl: { type: 'text', label: 'Custom Embed URL' },
    embedType: { type: 'select', label: 'Embed Type', options: [{ label: 'iFrame', value: 'iframe' }, { label: 'Popup', value: 'popup' }, { label: 'Inline', value: 'inline' }] },
    embedWidth: { type: 'text', label: 'Embed Width' },
    embedHeight: { type: 'text', label: 'Embed Height' },
    embedMinHeight: { type: 'text', label: 'Embed Min Height' },
    allowFullscreen: { type: 'toggle', label: 'Allow Fullscreen' },
    lazyLoad: { type: 'toggle', label: 'Lazy Load' },
    showBorder: { type: 'toggle', label: 'Show Embed Border' },
    showToolbar: { type: 'toggle', label: 'Show Toolbar' },
    toolbarPosition: { type: 'select', label: 'Toolbar Position', options: [{ label: 'Top', value: 'top' }, { label: 'Bottom', value: 'bottom' }] },

    // Button Trigger (3)
    buttonText: { type: 'text', label: 'Popup Button Text' },
    buttonIcon: { type: 'toggle', label: 'Show Button Icon' },
    buttonSize: { type: 'select', label: 'Button Size', options: [{ label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }] },

    // Layout (5)
    headerAlignment: { type: 'select', label: 'Header Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }] },
    width: { type: 'text', label: 'Width' },
    minHeight: { type: 'text', label: 'Min Height' },
    padding: { type: 'text', label: 'Padding' },
    gap: { type: 'text', label: 'Gap' },

    // Colors (21)
    primaryColor: { type: 'color', label: 'Primary Color' },
    backgroundColor: { type: 'color', label: 'Background' },
    textColor: { type: 'color', label: 'Text Color' },
    headerBackgroundColor: { type: 'color', label: 'Header Background' },
    headerTextColor: { type: 'color', label: 'Header Text' },
    toolbarBackgroundColor: { type: 'color', label: 'Toolbar Background' },
    toolbarTextColor: { type: 'color', label: 'Toolbar Text' },
    tabActiveColor: { type: 'color', label: 'Active Tab Color' },
    tabInactiveColor: { type: 'color', label: 'Inactive Tab Color' },
    tabActiveBgColor: { type: 'color', label: 'Active Tab Background' },
    codeBackgroundColor: { type: 'color', label: 'Code Background' },
    codeTextColor: { type: 'color', label: 'Code Text' },
    buttonBackgroundColor: { type: 'color', label: 'Button Background' },
    buttonTextColor: { type: 'color', label: 'Button Text' },
    buttonHoverColor: { type: 'color', label: 'Button Hover' },
    embedBorderColor: { type: 'color', label: 'Embed Border' },
    embedBackgroundColor: { type: 'color', label: 'Embed Background' },
    borderColor: { type: 'color', label: 'Border Color' },
    dividerColor: { type: 'color', label: 'Divider Color' },
    noSiteIconColor: { type: 'color', label: 'No-Site Icon Color' },
    copySuccessColor: { type: 'color', label: 'Copy Success Color' },

    // Typography (10)
    titleFontSize: { type: 'text', label: 'Title Font Size' },
    titleFontWeight: { type: 'select', label: 'Title Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    titleFontFamily: { type: 'text', label: 'Font Family' },
    subtitleFontSize: { type: 'text', label: 'Subtitle Font Size' },
    codeFontSize: { type: 'text', label: 'Code Font Size' },
    codeFontFamily: { type: 'text', label: 'Code Font Family' },
    buttonFontSize: { type: 'text', label: 'Button Font Size' },
    buttonFontWeight: { type: 'select', label: 'Button Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    tabFontSize: { type: 'text', label: 'Tab Font Size' },
    tabFontWeight: { type: 'select', label: 'Tab Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }] },

    // Shape & Effects (8)
    borderRadius: { type: 'text', label: 'Container Radius' },
    embedBorderRadius: { type: 'text', label: 'Embed Radius' },
    buttonBorderRadius: { type: 'text', label: 'Button Radius' },
    tabBorderRadius: { type: 'text', label: 'Tab Radius' },
    borderWidth: { type: 'text', label: 'Border Width' },
    shadow: { type: 'select', label: 'Container Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }] },
    embedShadow: { type: 'select', label: 'Embed Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }] },
    animateTabs: { type: 'toggle', label: 'Animate Tabs' },

    // Accessibility (1)
    ariaLabel: { type: 'text', label: 'ARIA Label' },
  },
  fieldGroups: [
    { id: 'content', label: 'Content', icon: 'Type', fields: ['title', 'subtitle', 'showHeader', 'previewLabel', 'codeLabel', 'copyButtonText', 'copiedText', 'openInNewTabText', 'noSiteMessage', 'noSiteDescription', 'connectButtonText'], defaultExpanded: true },
    { id: 'embedSettings', label: 'Embed Settings', icon: 'Code', fields: ['siteId', 'embedUrl', 'embedType', 'embedWidth', 'embedHeight', 'embedMinHeight', 'allowFullscreen', 'lazyLoad', 'showBorder', 'showToolbar', 'toolbarPosition'], defaultExpanded: true },
    { id: 'buttonTrigger', label: 'Popup Button', icon: 'MousePointerClick', fields: ['buttonText', 'buttonIcon', 'buttonSize'], defaultExpanded: false },
    { id: 'layout', label: 'Layout', icon: 'Layout', fields: ['headerAlignment', 'width', 'minHeight', 'padding', 'gap'], defaultExpanded: false },
    { id: 'colors', label: 'Colors', icon: 'Palette', fields: ['primaryColor', 'backgroundColor', 'textColor', 'headerBackgroundColor', 'headerTextColor', 'toolbarBackgroundColor', 'toolbarTextColor', 'tabActiveColor', 'tabInactiveColor', 'tabActiveBgColor', 'codeBackgroundColor', 'codeTextColor', 'buttonBackgroundColor', 'buttonTextColor', 'buttonHoverColor', 'embedBorderColor', 'embedBackgroundColor', 'borderColor', 'dividerColor', 'noSiteIconColor', 'copySuccessColor'], defaultExpanded: false },
    { id: 'typography', label: 'Typography', icon: 'ALargeSmall', fields: ['titleFontSize', 'titleFontWeight', 'titleFontFamily', 'subtitleFontSize', 'codeFontSize', 'codeFontFamily', 'buttonFontSize', 'buttonFontWeight', 'tabFontSize', 'tabFontWeight'], defaultExpanded: false },
    { id: 'shape', label: 'Shape & Effects', icon: 'Square', fields: ['borderRadius', 'embedBorderRadius', 'buttonBorderRadius', 'tabBorderRadius', 'borderWidth', 'shadow', 'embedShadow', 'animateTabs'], defaultExpanded: false },
    { id: 'accessibility', label: 'Accessibility', icon: 'Accessibility', fields: ['ariaLabel'], defaultExpanded: false },
  ],
  ai: {
    description: 'Embeddable booking widget with preview and code — 50+ customization options',
    canModify: ['title', 'subtitle', 'embedType', 'embedWidth', 'embedHeight', 'showToolbar', 'primaryColor', 'backgroundColor', 'borderRadius', 'shadow', 'buttonText'],
    suggestions: ['Switch to popup mode', 'Make full width', 'Change to dark code theme', 'Hide toolbar', 'Change button text'],
  },
  render: BookingEmbedBlock,
}

export default BookingEmbedBlock
