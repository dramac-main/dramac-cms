/**
 * CollapsibleProductDetails - Accordion product information
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * Collapsible accordion sections for product details, specifications,
 * shipping info, and reviews. Optimized for mobile with smooth
 * animations and accessible controls.
 */
'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  Package, 
  Truck, 
  RotateCcw, 
  Shield,
  FileText,
  Star,
  Info,
  Ruler,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductDetailSection {
  id: string
  title: string
  icon?: React.ReactNode
  content: React.ReactNode
  defaultOpen?: boolean
}

export interface CollapsibleProductDetailsProps {
  sections?: ProductDetailSection[]
  description?: string | null
  specifications?: Record<string, string | number | boolean>
  shippingInfo?: string | null
  returnPolicy?: string | null
  warranty?: string | null
  allowMultipleOpen?: boolean
  className?: string
}

export interface CollapsibleSectionProps {
  id: string
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  isOpen: boolean
  onToggle: (id: string) => void
}

// ============================================================================
// DEFAULT ICONS
// ============================================================================

const DEFAULT_ICONS: Record<string, React.ReactNode> = {
  description: <FileText className="h-5 w-5" />,
  specifications: <Ruler className="h-5 w-5" />,
  shipping: <Truck className="h-5 w-5" />,
  returns: <RotateCcw className="h-5 w-5" />,
  warranty: <Shield className="h-5 w-5" />,
  details: <Info className="h-5 w-5" />,
  features: <CheckCircle2 className="h-5 w-5" />,
  reviews: <Star className="h-5 w-5" />,
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

export function CollapsibleSection({
  id,
  title,
  icon,
  children,
  isOpen,
  onToggle,
}: CollapsibleSectionProps) {
  const haptic = useHapticFeedback()

  const handleToggle = useCallback(() => {
    haptic.trigger('selection')
    onToggle(id)
  }, [id, onToggle, haptic])

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Header button */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between p-4',
          'min-h-[56px] text-left',
          'hover:bg-muted/50 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        aria-expanded={isOpen}
        aria-controls={`section-content-${id}`}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-muted-foreground">
              {icon}
            </span>
          )}
          <span className="font-medium">{title}</span>
        </div>
        
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`section-content-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// CONTENT RENDERERS
// ============================================================================

function DescriptionContent({ description }: { description: string }) {
  return (
    <div 
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: description }}
    />
  )
}

function SpecificationsContent({ 
  specifications 
}: { 
  specifications: Record<string, string | number | boolean> 
}) {
  return (
    <dl className="space-y-2">
      {Object.entries(specifications).map(([key, value]) => (
        <div key={key} className="flex justify-between items-start gap-4">
          <dt className="text-muted-foreground text-sm flex-shrink-0">
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </dt>
          <dd className="text-sm font-medium text-right">
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function ShippingContent({ shippingInfo }: { shippingInfo: string }) {
  return (
    <div className="space-y-3">
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: shippingInfo }}
      />
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Package className="h-4 w-4" />
        <span>Free shipping on orders over $50</span>
      </div>
    </div>
  )
}

function ReturnPolicyContent({ returnPolicy }: { returnPolicy: string }) {
  return (
    <div 
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: returnPolicy }}
    />
  )
}

function WarrantyContent({ warranty }: { warranty: string }) {
  return (
    <div className="flex items-start gap-3">
      <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: warranty }}
      />
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CollapsibleProductDetails({
  sections: customSections,
  description,
  specifications,
  shippingInfo,
  returnPolicy,
  warranty,
  allowMultipleOpen = false,
  className,
}: CollapsibleProductDetailsProps) {
  // Build sections from props or use custom sections
  const defaultSections: ProductDetailSection[] = []
  
  if (description) {
    defaultSections.push({
      id: 'description',
      title: 'Description',
      icon: DEFAULT_ICONS.description,
      content: <DescriptionContent description={description} />,
      defaultOpen: true,
    })
  }
  
  if (specifications && Object.keys(specifications).length > 0) {
    defaultSections.push({
      id: 'specifications',
      title: 'Specifications',
      icon: DEFAULT_ICONS.specifications,
      content: <SpecificationsContent specifications={specifications} />,
    })
  }
  
  if (shippingInfo) {
    defaultSections.push({
      id: 'shipping',
      title: 'Shipping Information',
      icon: DEFAULT_ICONS.shipping,
      content: <ShippingContent shippingInfo={shippingInfo} />,
    })
  }
  
  if (returnPolicy) {
    defaultSections.push({
      id: 'returns',
      title: 'Return Policy',
      icon: DEFAULT_ICONS.returns,
      content: <ReturnPolicyContent returnPolicy={returnPolicy} />,
    })
  }
  
  if (warranty) {
    defaultSections.push({
      id: 'warranty',
      title: 'Warranty',
      icon: DEFAULT_ICONS.warranty,
      content: <WarrantyContent warranty={warranty} />,
    })
  }

  const sections = customSections || defaultSections

  // Initialize open state
  const initialOpenState = sections.reduce((acc, section) => {
    acc[section.id] = section.defaultOpen || false
    return acc
  }, {} as Record<string, boolean>)

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(initialOpenState)

  // Handle toggle
  const handleToggle = useCallback(
    (id: string) => {
      setOpenSections((prev) => {
        if (allowMultipleOpen) {
          // Toggle individual section
          return { ...prev, [id]: !prev[id] }
        } else {
          // Only allow one section open at a time
          const newState: Record<string, boolean> = {}
          for (const key of Object.keys(prev)) {
            newState[key] = key === id ? !prev[id] : false
          }
          return newState
        }
      })
    },
    [allowMultipleOpen]
  )

  if (sections.length === 0) {
    return null
  }

  return (
    <div className={cn('border rounded-xl overflow-hidden', className)}>
      {sections.map((section) => (
        <CollapsibleSection
          key={section.id}
          id={section.id}
          title={section.title}
          icon={section.icon}
          isOpen={openSections[section.id] || false}
          onToggle={handleToggle}
        >
          {section.content}
        </CollapsibleSection>
      ))}
    </div>
  )
}

export default CollapsibleProductDetails
