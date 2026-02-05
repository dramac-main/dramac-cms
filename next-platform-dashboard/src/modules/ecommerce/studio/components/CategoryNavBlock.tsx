/**
 * CategoryNavBlock - Category navigation menu
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Displays category tree for navigation.
 */
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { useStorefrontCategories } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { CategoryCard } from './CategoryCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { Category } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

export interface CategoryNavBlockProps {
  // Display
  variant?: ResponsiveValue<'tree' | 'grid' | 'list' | 'cards'>
  columns?: ResponsiveValue<2 | 3 | 4 | 6>
  
  // Content
  title?: string
  showTitle?: boolean
  showProductCount?: boolean
  showImages?: boolean
  showSubcategories?: boolean
  maxDepth?: number
  
  // Behavior
  expandable?: boolean
  defaultExpanded?: boolean
  parentCategory?: string // Filter to children of this category
  
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

// Build category tree
interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
  product_count?: number
}

function buildTree(categories: Category[], parentId: string | null = null): CategoryWithChildren[] {
  return categories
    .filter(cat => cat.parent_id === parentId)
    .map(cat => ({
      ...cat,
      children: buildTree(categories, cat.id)
    }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

// ============================================================================
// TREE ITEM COMPONENT
// ============================================================================

interface TreeItemProps {
  category: CategoryWithChildren
  depth: number
  maxDepth: number
  showCount: boolean
  expandable: boolean
  defaultExpanded: boolean
}

function TreeItem({ 
  category, 
  depth, 
  maxDepth, 
  showCount, 
  expandable,
  defaultExpanded 
}: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const hasChildren = category.children && category.children.length > 0
  const canExpand = expandable && hasChildren && depth < maxDepth

  return (
    <div>
      <Link
        href={`/shop/category/${category.slug}`}
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg',
          'hover:bg-accent transition-colors group',
          depth > 0 && 'ml-4'
        )}
        onClick={(e) => {
          if (canExpand) {
            e.preventDefault()
            setIsExpanded(!isExpanded)
          }
        }}
      >
        {canExpand ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )
        ) : hasChildren ? (
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}
        
        <span className="flex-1 font-medium group-hover:text-primary transition-colors">
          {category.name}
        </span>
        
        {showCount && category.product_count !== undefined && (
          <span className="text-sm text-muted-foreground">
            {category.product_count}
          </span>
        )}
      </Link>

      {canExpand && isExpanded && category.children && (
        <div className="mt-1">
          {category.children.map(child => (
            <TreeItem
              key={child.id}
              category={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              showCount={showCount}
              expandable={expandable}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CategoryNavBlock({
  variant = 'tree',
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  title = 'Categories',
  showTitle = true,
  showProductCount = true,
  showImages = true,
  showSubcategories = true,
  maxDepth = 3,
  expandable = true,
  defaultExpanded = false,
  parentCategory,
  className
}: CategoryNavBlockProps) {
  const { siteId } = useStorefront()
  const { categories, isLoading } = useStorefrontCategories(siteId)
  
  const variantValue = getResponsiveValue(variant, 'tree')
  const columnsValue = getResponsiveValue(columns, 4)

  // Filter and build tree
  const displayCategories = React.useMemo(() => {
    let filtered = categories
    
    if (parentCategory) {
      const parent = categories.find((c: Category) => c.id === parentCategory || c.slug === parentCategory)
      if (parent) {
        filtered = categories.filter((c: Category) => c.parent_id === parent.id)
      }
    } else if (!showSubcategories) {
      filtered = categories.filter((c: Category) => !c.parent_id)
    }

    if (variantValue === 'tree') {
      return buildTree(filtered, parentCategory || null)
    }
    
    return filtered as CategoryWithChildren[]
  }, [categories, parentCategory, showSubcategories, variantValue])

  if (isLoading) {
    return (
      <div className={className}>
        {showTitle && <Skeleton className="h-6 w-32 mb-4" />}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Grid columns class
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
  }[columnsValue]

  return (
    <div className={className}>
      {showTitle && title && (
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
      )}

      {/* Tree variant */}
      {variantValue === 'tree' && (
        <nav className="space-y-1">
          {displayCategories.map((category) => (
            <TreeItem
              key={category.id}
              category={category}
              depth={0}
              maxDepth={maxDepth}
              showCount={showProductCount}
              expandable={expandable}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </nav>
      )}

      {/* Grid variant */}
      {variantValue === 'grid' && (
        <div className={cn('grid gap-4', gridClass)}>
          {displayCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              variant="card"
              showImage={showImages}
              showCount={showProductCount}
            />
          ))}
        </div>
      )}

      {/* List variant */}
      {variantValue === 'list' && (
        <div className="space-y-2">
          {displayCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              variant="row"
              showImage={showImages}
              showCount={showProductCount}
              showArrow
            />
          ))}
        </div>
      )}

      {/* Cards (chips) variant */}
      {variantValue === 'cards' && (
        <div className="flex flex-wrap gap-2">
          {displayCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              variant="chip"
              showCount={showProductCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const categoryNavBlockConfig = {
  type: 'category-nav',
  label: 'Category Navigation',
  category: 'e-commerce',
  icon: 'FolderTree',
  defaultProps: {
    variant: 'tree',
    columns: { mobile: 2, tablet: 3, desktop: 4 },
    title: 'Categories',
    showTitle: true,
    showProductCount: true,
    showImages: true,
    showSubcategories: true,
    maxDepth: 3,
    expandable: true,
    defaultExpanded: false
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      defaultValue: 'Categories'
    },
    {
      name: 'showTitle',
      label: 'Show Title',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'variant',
      label: 'Display Style',
      type: 'select',
      options: [
        { value: 'tree', label: 'Tree Menu' },
        { value: 'grid', label: 'Grid Cards' },
        { value: 'list', label: 'List' },
        { value: 'cards', label: 'Chips/Tags' }
      ],
      responsive: true
    },
    {
      name: 'columns',
      label: 'Grid Columns',
      type: 'select',
      options: [
        { value: 2, label: '2 Columns' },
        { value: 3, label: '3 Columns' },
        { value: 4, label: '4 Columns' },
        { value: 6, label: '6 Columns' }
      ],
      responsive: true,
      showWhen: { variant: 'grid' }
    },
    {
      name: 'showProductCount',
      label: 'Show Product Count',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showImages',
      label: 'Show Category Images',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'expandable',
      label: 'Expandable Tree',
      type: 'toggle',
      defaultValue: true,
      showWhen: { variant: 'tree' }
    }
  ],
  ai: {
    suggestable: true,
    description: 'Category navigation menu for e-commerce',
    contextHints: ['categories', 'navigation', 'menu', 'browse']
  }
}
