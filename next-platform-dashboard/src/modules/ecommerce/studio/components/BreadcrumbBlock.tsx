/**
 * BreadcrumbBlock - Navigation breadcrumbs
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Displays navigation trail for current page.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronRight, Home } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbBlockProps {
  // Items
  items?: BreadcrumbItem[]
  autoGenerate?: boolean
  
  // Display
  showHome?: boolean
  homeLabel?: string
  homeHref?: string
  separator?: 'chevron' | 'slash' | 'arrow'
  variant?: ResponsiveValue<'default' | 'compact'>
  
  // Current page
  currentLabel?: string
  
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return (value as { mobile?: T; tablet?: T; desktop?: T }).desktop ?? 
           (value as { mobile?: T; tablet?: T; desktop?: T }).tablet ?? 
           (value as { mobile?: T; tablet?: T; desktop?: T }).mobile ?? 
           defaultValue
  }
  return value as T
}

// Generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  let path = ''
  for (const segment of segments) {
    path += `/${segment}`
    
    // Format label (capitalize, replace dashes)
    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())

    breadcrumbs.push({ label, href: path })
  }

  // Remove href from last item (current page)
  if (breadcrumbs.length > 0) {
    delete breadcrumbs[breadcrumbs.length - 1].href
  }

  return breadcrumbs
}

// ============================================================================
// SEPARATOR COMPONENTS
// ============================================================================

const separators = {
  chevron: <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />,
  slash: <span className="text-muted-foreground mx-2">/</span>,
  arrow: <span className="text-muted-foreground mx-2">→</span>
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BreadcrumbBlock({
  items: propItems,
  autoGenerate = true,
  showHome = true,
  homeLabel = 'Home',
  homeHref = '/',
  separator = 'chevron',
  variant = 'default',
  currentLabel,
  className
}: BreadcrumbBlockProps) {
  const pathname = usePathname()
  const variantValue = getResponsiveValue(variant, 'default')

  // Get breadcrumb items
  const items = React.useMemo(() => {
    if (propItems && propItems.length > 0) {
      return propItems
    }

    if (autoGenerate && pathname) {
      const generated = generateBreadcrumbs(pathname)
      
      // Override current page label if provided
      if (currentLabel && generated.length > 0) {
        generated[generated.length - 1].label = currentLabel
      }

      return generated
    }

    return []
  }, [propItems, autoGenerate, pathname, currentLabel])

  // Build full breadcrumb list with home
  const fullItems = React.useMemo(() => {
    if (showHome) {
      return [{ label: homeLabel, href: homeHref }, ...items]
    }
    return items
  }, [showHome, homeLabel, homeHref, items])

  if (fullItems.length === 0) return null

  const SeparatorElement = separators[separator]

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn(
        'flex items-center flex-wrap',
        variantValue === 'compact' && 'text-sm'
      )}>
        {fullItems.map((item, index) => {
          const isFirst = index === 0
          const isLast = index === fullItems.length - 1
          const isHome = isFirst && showHome

          return (
            <li key={index} className="flex items-center">
              {/* Separator */}
              {!isFirst && SeparatorElement}

              {/* Item */}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1 hover:text-primary transition-colors',
                    'text-muted-foreground hover:underline'
                  )}
                >
                  {isHome && <Home className="h-4 w-4" />}
                  <span className={cn(isHome && variantValue === 'compact' && 'sr-only')}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span className={cn(
                  'flex items-center gap-1',
                  isLast ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}>
                  {isHome && <Home className="h-4 w-4" />}
                  <span className={cn(isHome && variantValue === 'compact' && 'sr-only')}>
                    {item.label}
                  </span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const breadcrumbBlockConfig = {
  type: 'breadcrumb',
  label: 'Breadcrumbs',
  category: 'navigation',
  icon: 'ChevronRight',
  defaultProps: {
    autoGenerate: true,
    showHome: true,
    homeLabel: 'Home',
    homeHref: '/',
    separator: 'chevron',
    variant: 'default'
  },
  fields: [
    {
      name: 'autoGenerate',
      label: 'Auto Generate from URL',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showHome',
      label: 'Show Home Link',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'homeLabel',
      label: 'Home Label',
      type: 'text',
      defaultValue: 'Home'
    },
    {
      name: 'separator',
      label: 'Separator Style',
      type: 'select',
      options: [
        { value: 'chevron', label: 'Chevron (>)' },
        { value: 'slash', label: 'Slash (/)' },
        { value: 'arrow', label: 'Arrow (→)' }
      ]
    },
    {
      name: 'variant',
      label: 'Size',
      type: 'select',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'compact', label: 'Compact' }
      ],
      responsive: true
    },
    {
      name: 'currentLabel',
      label: 'Current Page Label',
      type: 'text',
      description: 'Override auto-generated current page name'
    }
  ],
  ai: {
    suggestable: true,
    description: 'Navigation breadcrumb trail',
    contextHints: ['breadcrumbs', 'navigation', 'path', 'trail']
  }
}
