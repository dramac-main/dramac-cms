/**
 * MobileVariantSelector - Bottom sheet variant picker
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * A mobile-optimized variant selector that uses bottom sheets
 * for selection, supports color swatches, size grids, and
 * maintains clear selection states.
 */
'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ChevronRight, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import type { ProductVariant as BaseProductVariant } from '../../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface VariantOption {
  name: string // e.g., "Color", "Size"
  values: string[] // e.g., ["Red", "Blue", "Green"]
  type?: 'color' | 'size' | 'text' // Display type
}

export interface ProductVariant extends BaseProductVariant {
  // Extending base variant with any additional fields
}

export interface MobileVariantSelectorProps {
  options: VariantOption[]
  variants: ProductVariant[]
  selectedOptions: Record<string, string>
  onOptionChange: (optionName: string, value: string) => void
  onVariantSelect?: (variant: ProductVariant | null) => void
  showStock?: boolean
  showPrice?: boolean
  disabled?: boolean
  className?: string
}

export interface VariantOptionSheetProps {
  option: VariantOption
  variants: ProductVariant[]
  selectedValue: string | undefined
  selectedOptions: Record<string, string>
  onSelect: (value: string) => void
  onClose: () => void
  isOpen: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  black: '#171717',
  white: '#ffffff',
  gray: '#6b7280',
  grey: '#6b7280',
  brown: '#92400e',
  navy: '#1e3a5a',
  beige: '#f5f5dc',
  cream: '#fffdd0',
  gold: '#ffd700',
  silver: '#c0c0c0',
}

// ============================================================================
// HELPERS
// ============================================================================

function getColorHex(colorName: string): string | null {
  if (!colorName) return null
  const normalized = colorName.toLowerCase().trim()
  return COLOR_MAP[normalized] || null
}

function isOptionAvailable(
  optionName: string,
  value: string,
  variants: ProductVariant[],
  selectedOptions: Record<string, string>
): boolean {
  // Check if any variant with this option value is available
  return variants.some((variant) => {
    if (!variant.is_active || (variant.quantity !== null && variant.quantity <= 0)) {
      return false
    }
    
    // Check if this option value matches
    if (variant.options?.[optionName] !== value) {
      return false
    }
    
    // Check if other selected options also match
    for (const [key, val] of Object.entries(selectedOptions)) {
      if (key !== optionName && variant.options?.[key] !== val) {
        return false
      }
    }
    
    return true
  })
}

function getVariantStock(
  optionName: string,
  value: string,
  variants: ProductVariant[],
  selectedOptions: Record<string, string>
): number {
  let totalStock = 0
  
  for (const variant of variants) {
    if (variant.options?.[optionName] !== value) continue
    
    // Check other selected options
    let matches = true
    for (const [key, val] of Object.entries(selectedOptions)) {
      if (key !== optionName && variant.options?.[key] !== val) {
        matches = false
        break
      }
    }
    
    if (matches && variant.is_active && variant.quantity !== null) {
      totalStock += variant.quantity
    }
  }
  
  return totalStock
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function VariantOptionSheet({
  option,
  variants,
  selectedValue,
  selectedOptions,
  onSelect,
  onClose,
  isOpen,
}: VariantOptionSheetProps) {
  const haptic = useHapticFeedback()

  const handleSelect = useCallback(
    (value: string) => {
      haptic.trigger('selection')
      onSelect(value)
      onClose()
    },
    [onSelect, onClose, haptic]
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[70vh] overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 rounded-full bg-muted" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b">
              <h3 className="font-semibold text-lg">Select {option.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Options */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {option.type === 'color' ? (
                // Color swatches
                <div className="grid grid-cols-4 gap-4">
                  {option.values.map((value) => {
                    const colorHex = getColorHex(value)
                    const isSelected = selectedValue === value
                    const isAvailable = isOptionAvailable(
                      option.name,
                      value,
                      variants,
                      selectedOptions
                    )

                    return (
                      <button
                        key={value}
                        onClick={() => isAvailable && handleSelect(value)}
                        disabled={!isAvailable}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                          'min-h-[80px]',
                          isSelected && 'bg-primary/10 ring-2 ring-primary',
                          !isAvailable && 'opacity-50'
                        )}
                      >
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full border-2 flex items-center justify-center',
                            isSelected ? 'border-primary' : 'border-border',
                            !colorHex && 'bg-gradient-to-br from-primary to-secondary'
                          )}
                          style={colorHex ? { backgroundColor: colorHex } : undefined}
                        >
                          {isSelected && (
                            <Check
                              className={cn(
                                'h-5 w-5',
                                colorHex === '#ffffff' || colorHex === '#ffd700'
                                  ? 'text-black'
                                  : 'text-white'
                              )}
                            />
                          )}
                          {!isAvailable && !isSelected && (
                            <div className="w-full h-0.5 bg-muted-foreground rotate-45" />
                          )}
                        </div>
                        <span className="text-xs font-medium text-center">{value}</span>
                      </button>
                    )
                  })}
                </div>
              ) : option.type === 'size' ? (
                // Size grid
                <div className="grid grid-cols-4 gap-2">
                  {option.values.map((value) => {
                    const isSelected = selectedValue === value
                    const isAvailable = isOptionAvailable(
                      option.name,
                      value,
                      variants,
                      selectedOptions
                    )
                    const stock = getVariantStock(
                      option.name,
                      value,
                      variants,
                      selectedOptions
                    )

                    return (
                      <button
                        key={value}
                        onClick={() => isAvailable && handleSelect(value)}
                        disabled={!isAvailable}
                        className={cn(
                          'relative h-14 rounded-lg border-2 font-medium transition-all',
                          'min-h-[44px]',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50',
                          !isAvailable && 'opacity-50 line-through'
                        )}
                      >
                        {value}
                        {stock > 0 && stock <= 3 && isAvailable && (
                          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                            {stock}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                // Text list
                <div className="space-y-2">
                  {option.values.map((value) => {
                    const isSelected = selectedValue === value
                    const isAvailable = isOptionAvailable(
                      option.name,
                      value,
                      variants,
                      selectedOptions
                    )

                    return (
                      <button
                        key={value}
                        onClick={() => isAvailable && handleSelect(value)}
                        disabled={!isAvailable}
                        className={cn(
                          'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all',
                          'min-h-[56px]',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50',
                          !isAvailable && 'opacity-50'
                        )}
                      >
                        <span className="font-medium">{value}</span>
                        {isSelected && <Check className="h-5 w-5 text-primary" />}
                        {!isAvailable && <span className="text-muted-foreground text-sm">Out of stock</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MobileVariantSelector({
  options,
  variants,
  selectedOptions,
  onOptionChange,
  onVariantSelect,
  showStock = true,
  showPrice = true,
  disabled = false,
  className,
}: MobileVariantSelectorProps) {
  const haptic = useHapticFeedback()
  const [activeSheet, setActiveSheet] = useState<string | null>(null)

  // Find selected variant
  const selectedVariant = useMemo(() => {
    if (Object.keys(selectedOptions).length !== options.length) {
      return null
    }
    
    return variants.find((variant) => {
      if (!variant.options) return false
      
      for (const [key, value] of Object.entries(selectedOptions)) {
        if (variant.options[key] !== value) return false
      }
      return true
    }) || null
  }, [variants, selectedOptions, options.length])

  // Notify parent of selected variant
  useEffect(() => {
    onVariantSelect?.(selectedVariant)
  }, [selectedVariant, onVariantSelect])

  // Open option sheet
  const openSheet = useCallback(
    (optionName: string) => {
      if (disabled) return
      haptic.trigger('selection')
      setActiveSheet(optionName)
    },
    [disabled, haptic]
  )

  // Handle option selection
  const handleOptionSelect = useCallback(
    (optionName: string, value: string) => {
      onOptionChange(optionName, value)
      setActiveSheet(null)
    },
    [onOptionChange]
  )

  return (
    <div className={cn('space-y-3', className)}>
      {options.map((option) => {
        const selectedValue = selectedOptions[option.name]
        const colorHex = option.type === 'color' && selectedValue 
          ? getColorHex(selectedValue) 
          : null

        return (
          <React.Fragment key={option.name}>
            {/* Option trigger button */}
            <button
              onClick={() => openSheet(option.name)}
              disabled={disabled}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all',
                'min-h-[56px]',
                selectedValue ? 'border-primary/50' : 'border-border',
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Color swatch preview */}
                {option.type === 'color' && selectedValue && (
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={colorHex ? { backgroundColor: colorHex } : undefined}
                  />
                )}
                
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">{option.name}</div>
                  <div className="font-medium">
                    {selectedValue || `Select ${option.name}`}
                  </div>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Option sheet */}
            <VariantOptionSheet
              option={option}
              variants={variants}
              selectedValue={selectedValue}
              selectedOptions={selectedOptions}
              onSelect={(value) => handleOptionSelect(option.name, value)}
              onClose={() => setActiveSheet(null)}
              isOpen={activeSheet === option.name}
            />
          </React.Fragment>
        )
      })}

      {/* Selected variant info */}
      {selectedVariant && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-muted/50 space-y-2"
        >
          {showPrice && selectedVariant.price !== null && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                ${selectedVariant.price.toFixed(2)}
              </span>
            </div>
          )}
          
          {showStock && (
            <div className="flex items-center gap-2">
              {selectedVariant.quantity !== null && selectedVariant.quantity > 0 ? (
                <Badge variant={selectedVariant.quantity <= 5 ? 'destructive' : 'secondary'}>
                  {selectedVariant.quantity <= 5
                    ? `Only ${selectedVariant.quantity} left`
                    : 'In Stock'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Out of Stock
                </Badge>
              )}
            </div>
          )}
          
          {selectedVariant.sku && (
            <div className="text-xs text-muted-foreground">
              SKU: {selectedVariant.sku}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default MobileVariantSelector
