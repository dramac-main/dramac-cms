/**
 * CategoryCard - Category display component
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Displays category with image and product count.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ChevronRight, Folder } from 'lucide-react'
import type { Category } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface CategoryCardProps {
  category: Category & { product_count?: number }
  variant?: 'card' | 'row' | 'chip'
  showImage?: boolean
  showCount?: boolean
  showArrow?: boolean
  href?: string
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CategoryCard({
  category,
  variant = 'card',
  showImage = true,
  showCount = true,
  showArrow = false,
  href,
  className
}: CategoryCardProps) {
  const linkHref = href || `/shop/category/${category.slug}`
  const productCount = (category as Category & { product_count?: number }).product_count

  // Chip variant
  if (variant === 'chip') {
    return (
      <Link
        href={linkHref}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-4 py-2',
          'bg-background hover:bg-accent transition-colors',
          className
        )}
      >
        <span className="text-sm font-medium">{category.name}</span>
        {showCount && productCount !== undefined && (
          <span className="text-xs text-muted-foreground">
            ({productCount})
          </span>
        )}
      </Link>
    )
  }

  // Row variant
  if (variant === 'row') {
    return (
      <Link
        href={linkHref}
        className={cn(
          'flex items-center gap-4 p-3 rounded-lg',
          'hover:bg-accent transition-colors group',
          className
        )}
      >
        {showImage && (
          <div className="relative h-12 w-12 shrink-0 rounded-lg bg-muted overflow-hidden">
            {category.image_url ? (
              <Image
                src={category.image_url}
                alt={category.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Folder className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{category.name}</p>
          {category.description && (
            <p className="text-sm text-muted-foreground truncate">
              {category.description}
            </p>
          )}
        </div>
        {showCount && productCount !== undefined && (
          <span className="text-sm text-muted-foreground">
            {productCount} products
          </span>
        )}
        {showArrow && (
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        )}
      </Link>
    )
  }

  // Default card variant
  return (
    <Link
      href={linkHref}
      className={cn(
        'group block rounded-xl border overflow-hidden',
        'bg-background hover:border-primary/50 transition-colors',
        className
      )}
    >
      {showImage && (
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={category.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Folder className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold group-hover:text-primary transition-colors">
          {category.name}
        </h3>
        {showCount && productCount !== undefined && (
          <p className="text-sm text-muted-foreground mt-1">
            {productCount} products
          </p>
        )}
      </div>
    </Link>
  )
}
