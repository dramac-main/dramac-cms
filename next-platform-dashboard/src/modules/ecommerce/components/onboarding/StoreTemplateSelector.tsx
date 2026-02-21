/**
 * StoreTemplateSelector Component
 * 
 * Phase ECOM-62: Pre-built Store Templates
 * 
 * Template selection UI showing available store presets.
 * Can be used standalone from the dashboard or embedded in the onboarding wizard.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Shirt,
  Smartphone,
  Apple,
  Download,
  Check,
  Loader2,
  Tag,
  Package,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getAvailableTemplates,
  applyStoreTemplate,
  getSiteTemplateStatus,
} from '../../actions/store-template-actions'

// ============================================================================
// TYPES
// ============================================================================

interface TemplateInfo {
  id: string
  name: string
  description: string
  icon: string
  industry: string
  tags: string[]
  color: string
  features: string[]
  categoryCount: number
  productCount: number
}

interface StoreTemplateSelectorProps {
  siteId: string
  onApplied?: (templateId: string) => void
  onSkip?: () => void
  className?: string
  compact?: boolean
}

// ============================================================================
// ICON RESOLVER
// ============================================================================

const ICON_MAP: Record<string, React.ReactNode> = {
  Shirt: <Shirt className="h-6 w-6" />,
  Smartphone: <Smartphone className="h-6 w-6" />,
  Apple: <Apple className="h-6 w-6" />,
  Download: <Download className="h-6 w-6" />,
}

function getTemplateIcon(iconName: string) {
  return ICON_MAP[iconName] || <Package className="h-6 w-6" />
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StoreTemplateSelector({
  siteId,
  onApplied,
  onSkip,
  className,
  compact = false,
}: StoreTemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingTemplate, setExistingTemplate] = useState<string | null>(null)

  // Load templates and check if one is already applied
  useEffect(() => {
    async function load() {
      try {
        const [templateList, status] = await Promise.all([
          getAvailableTemplates(),
          getSiteTemplateStatus(siteId),
        ])
        setTemplates(templateList)
        if (status.hasTemplate) {
          setExistingTemplate(status.templateId)
        }
      } catch (err) {
        console.error('Failed to load templates:', err)
        setError('Failed to load store templates')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [siteId])

  // Apply selected template
  const handleApply = useCallback(async () => {
    if (!selectedId) return

    setIsApplying(true)
    setError(null)

    try {
      const result = await applyStoreTemplate(siteId, selectedId)

      if (result.success) {
        setApplied(true)
        onApplied?.(selectedId)
      } else {
        setError(
          result.errors.length > 0
            ? `Some items failed: ${result.errors.join(', ')}`
            : 'Failed to apply template'
        )
      }
    } catch (err) {
      console.error('Failed to apply template:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsApplying(false)
    }
  }, [siteId, selectedId, onApplied])

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
      </div>
    )
  }

  // Already applied state
  if (existingTemplate && !applied) {
    const appliedTpl = templates.find(t => t.id === existingTemplate)
    return (
      <div className={cn('space-y-4', className)}>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800 dark:text-green-300">
              Template Applied: {appliedTpl?.name || existingTemplate}
            </span>
          </div>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            This store already has a template applied. Your categories and products are set up.
          </p>
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Continue →
          </button>
        )}
      </div>
    )
  }

  // Success state
  if (applied) {
    const appliedTpl = templates.find(t => t.id === selectedId)
    return (
      <div className={cn('space-y-4', className)}>
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
            {appliedTpl?.name} Template Applied!
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            Your store has been set up with categories, sample products, and optimized settings.
          </p>
        </div>
      </div>
    )
  }

  // Template selection
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      {!compact && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold">Choose a Store Template</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Start with a pre-built template to get categories, sample products, and settings configured instantly.
          </p>
        </div>
      )}

      {/* Template Grid */}
      <div className={cn(
        'grid gap-4',
        compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
      )}>
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedId === template.id}
            onSelect={() => setSelectedId(template.id)}
            compact={compact}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground"
            disabled={isApplying}
          >
            Skip — I&apos;ll set up manually
          </button>
        )}
        <div className="ml-auto">
          <button
            onClick={handleApply}
            disabled={!selectedId || isApplying}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors',
              selectedId && !isApplying
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Applying Template...
              </>
            ) : (
              <>
                Apply Template
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TEMPLATE CARD
// ============================================================================

function TemplateCard({
  template,
  isSelected,
  onSelect,
  compact,
}: {
  template: TemplateInfo
  isSelected: boolean
  onSelect: () => void
  compact: boolean
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col rounded-xl border-2 p-5 text-left transition-all hover:shadow-md',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/40'
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Icon + Name */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${template.color}20`, color: template.color }}
        >
          {getTemplateIcon(template.icon)}
        </div>
        <div>
          <h4 className="font-semibold text-sm">{template.name}</h4>
          <span className="text-xs text-muted-foreground">{template.industry}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {template.description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Tag className="h-3 w-3" />
          {template.categoryCount} categories
        </span>
        <span className="inline-flex items-center gap-1">
          <Package className="h-3 w-3" />
          {template.productCount} products
        </span>
      </div>

      {/* Features (only in non-compact mode) */}
      {!compact && template.features.length > 0 && (
        <ul className="space-y-1">
          {template.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-green-500 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      )}
    </button>
  )
}

export default StoreTemplateSelector
