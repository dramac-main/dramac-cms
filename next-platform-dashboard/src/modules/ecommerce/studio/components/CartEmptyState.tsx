/**
 * CartEmptyState - Empty cart display component
 * 
 * Phase ECOM-22: Cart Components
 * 
 * Shows a friendly message when the cart is empty.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// ============================================================================
// TYPES
// ============================================================================

interface CartEmptyStateProps {
  title?: string
  description?: string
  shopLink?: string
  shopLinkText?: string
  showIcon?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartEmptyState({
  title = 'Your cart is empty',
  description = 'Looks like you haven\'t added any items to your cart yet.',
  shopLink = '/shop',
  shopLinkText = 'Continue Shopping',
  showIcon = true,
  className
}: CartEmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {showIcon && (
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      
      {shopLink && (
        <Button asChild>
          <Link href={shopLink}>
            {shopLinkText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}
