/**
 * Quote Template Selector Component
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * Dropdown to select a template when creating quotes
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Star, Loader2 } from 'lucide-react'
import { getQuoteTemplates } from '../../actions/quote-template-actions'
import type { QuoteTemplate } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteTemplateSelectorProps {
  siteId: string
  value?: string
  onSelect: (template: QuoteTemplate | null) => void
  disabled?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteTemplateSelector({
  siteId,
  value,
  onSelect,
  disabled = false
}: QuoteTemplateSelectorProps) {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true)
      try {
        const data = await getQuoteTemplates(siteId, true)
        setTemplates(data)
      } catch (error) {
        console.error('Error loading templates:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTemplates()
  }, [siteId])
  
  const handleChange = (templateId: string) => {
    if (templateId === 'none') {
      onSelect(null)
    } else {
      const template = templates.find(t => t.id === templateId)
      onSelect(template || null)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading templates...
      </div>
    )
  }
  
  if (templates.length === 0) {
    return null
  }

  return (
    <Select value={value || 'none'} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <SelectValue placeholder="Select a template (optional)" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No template</span>
        </SelectItem>
        {templates.map(template => (
          <SelectItem key={template.id} value={template.id}>
            <div className="flex items-center gap-2">
              <span>{template.name}</span>
              {template.is_default && (
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
