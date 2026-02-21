/**
 * Store Templates View
 * 
 * Phase ECOM-62: Pre-built Store Templates
 * 
 * Dashboard view for selecting and applying store templates.
 * Provides a guided experience for new stores.
 */

'use client'

import React from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import { StoreTemplateSelector } from '../onboarding/StoreTemplateSelector'

export function TemplatesView() {
  const { siteId } = useEcommerce()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Store Templates</h2>
        <p className="text-muted-foreground">
          Choose a pre-built template to quickly set up your store with categories, sample products, and optimized settings.
        </p>
      </div>

      {/* Template Selector */}
      <div className="max-w-4xl">
        <StoreTemplateSelector
          siteId={siteId}
          onApplied={() => {
            // Could refresh the page or navigate
            console.log('Template applied successfully')
          }}
        />
      </div>
    </div>
  )
}

export default TemplatesView
