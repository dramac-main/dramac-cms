/**
 * ProductSortBlock - Product sorting dropdown
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Dropdown for sorting product listings.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ArrowUpDown, Check } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { SORT_OPTIONS, type SortOption } from '@/modules/ecommerce/hooks/useProductFilters'

// ============================================================================
// TYPES
// ============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

export interface ProductSortBlockProps {
  // State
  value?: string
  onChange?: (value: string) => void
  
  // Display
  variant?: ResponsiveValue<'select' | 'dropdown' | 'buttons'>
  showLabel?: boolean
  label?: string
  
  // Options
  options?: SortOption[]
  
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

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductSortBlock({
  value = 'featured',
  onChange,
  variant = 'select',
  showLabel = true,
  label = 'Sort by',
  options = SORT_OPTIONS,
  className
}: ProductSortBlockProps) {
  const variantValue = getResponsiveValue(variant, 'select')
  const selectedOption = options.find(o => o.value === value) || options[0]

  const handleChange = (newValue: string) => {
    onChange?.(newValue)
  }

  // Buttons variant
  if (variantValue === 'buttons') {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        {showLabel && (
          <span className="text-sm text-muted-foreground">{label}:</span>
        )}
        {options.map(option => (
          <Button
            key={option.value}
            variant={value === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    )
  }

  // Dropdown variant
  if (variantValue === 'dropdown') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showLabel && (
          <span className="text-sm text-muted-foreground">{label}:</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {selectedOption.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {options.map(option => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleChange(option.value)}
                className="flex items-center justify-between"
              >
                {option.label}
                {value === option.value && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Default select variant
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{label}:</span>
      )}
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const productSortBlockConfig = {
  type: 'product-sort',
  label: 'Product Sort',
  category: 'e-commerce',
  icon: 'ArrowUpDown',
  defaultProps: {
    value: 'featured',
    variant: 'select',
    showLabel: true,
    label: 'Sort by'
  },
  fields: [
    {
      name: 'variant',
      label: 'Style',
      type: 'select',
      options: [
        { value: 'select', label: 'Select Dropdown' },
        { value: 'dropdown', label: 'Button Dropdown' },
        { value: 'buttons', label: 'Button Group' }
      ],
      responsive: true
    },
    {
      name: 'showLabel',
      label: 'Show Label',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'label',
      label: 'Label Text',
      type: 'text',
      defaultValue: 'Sort by'
    }
  ],
  ai: {
    suggestable: true,
    description: 'Product sorting dropdown',
    contextHints: ['sort', 'order', 'arrange', 'sorting']
  }
}
