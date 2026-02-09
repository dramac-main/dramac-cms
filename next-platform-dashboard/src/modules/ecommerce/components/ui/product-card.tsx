"use client"

/**
 * E-Commerce Product Card Component
 * 
 * PHASE-UI-14: E-Commerce Module UI Enhancement
 * Enhanced product display with hover effects and quick actions
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  MoreHorizontal,
  Edit,
  Copy,
  Archive,
  Trash2,
  Eye,
  ExternalLink,
  Package,
  AlertTriangle,
  ImageOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Product, ProductStatus } from "../../types/ecommerce-types"

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

export interface ProductCardProps {
  /** Product data */
  product: Product
  /** Click handler */
  onClick?: () => void
  /** Edit handler */
  onEdit?: () => void
  /** Duplicate handler */
  onDuplicate?: () => void
  /** Archive handler */
  onArchive?: () => void
  /** Delete handler */
  onDelete?: () => void
  /** View handler */
  onView?: () => void
  /** Selected state */
  selected?: boolean
  /** Select handler */
  onSelect?: (selected: boolean) => void
  /** Display variant */
  variant?: 'grid' | 'list'
  /** Currency code */
  currency?: string
  /** Additional class names */
  className?: string
  /** Animation delay */
  animationDelay?: number
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  active: { 
    label: 'Active', 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  draft: { 
    label: 'Draft', 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
  },
  archived: { 
    label: 'Archived', 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' 
  },
}

// =============================================================================
// FORMAT HELPERS
// =============================================================================

function formatPrice(price: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
  }).format(price)
}

// =============================================================================
// SKELETON
// =============================================================================

export function ProductCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'list' }) {
  if (variant === 'list') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Skeleton className="aspect-square rounded-t-lg" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// STOCK INDICATOR
// =============================================================================

function StockIndicator({ 
  quantity, 
  lowStockThreshold,
  trackInventory 
}: { 
  quantity: number
  lowStockThreshold: number
  trackInventory: boolean
}) {
  if (!trackInventory) {
    return (
      <span className="text-xs text-muted-foreground">
        Not tracked
      </span>
    )
  }

  if (quantity <= 0) {
    return (
      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
        <AlertTriangle className="h-3 w-3" />
        <span className="text-xs font-medium">Out of stock</span>
      </div>
    )
  }

  if (quantity <= lowStockThreshold) {
    return (
      <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
        <AlertTriangle className="h-3 w-3" />
        <span className="text-xs font-medium">{quantity} left</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
      <Package className="h-3 w-3" />
      <span className="text-xs font-medium">{quantity} in stock</span>
    </div>
  )
}

// =============================================================================
// PRODUCT IMAGE
// =============================================================================

function ProductImage({ 
  src, 
  alt,
  className 
}: { 
  src?: string | null
  alt: string
  className?: string
}) {
  const [error, setError] = React.useState(false)

  if (!src || error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted",
        className
      )}>
        <ImageOff className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setError(true)}
    />
  )
}

// =============================================================================
// GRID CARD
// =============================================================================

function ProductGridCard({
  product,
  onClick,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onView,
  selected,
  onSelect,
  currency = DEFAULT_CURRENCY,
  className,
  animationDelay = 0,
}: ProductCardProps) {
  const status = statusConfig[product.status]
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price
  const primaryImage = product.images?.[0] || null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      whileHover={{ y: -4 }}
    >
      <Card 
        className={cn(
          "group overflow-hidden cursor-pointer transition-shadow hover:shadow-lg",
          selected && "ring-2 ring-primary",
          className
        )}
        onClick={onClick}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <ProductImage 
            src={primaryImage} 
            alt={product.name}
            className="h-full w-full transition-transform group-hover:scale-105"
          />
          
          {/* Status Badge */}
          <Badge 
            className={cn(
              "absolute top-2 left-2 text-xs",
              status.className
            )}
          >
            {status.label}
          </Badge>

          {/* Featured Badge */}
          {product.is_featured && (
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
              Featured
            </Badge>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <TooltipProvider>
              {onView && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="secondary"
                      onClick={(e) => { e.stopPropagation(); onView() }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View product</TooltipContent>
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="secondary"
                      onClick={(e) => { e.stopPropagation(); onEdit() }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit product</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Name */}
            <h3 className="font-semibold truncate">{product.name}</h3>
            
            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
            )}

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                {formatPrice(product.base_price, currency)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price!, currency)}
                </span>
              )}
            </div>

            {/* Stock */}
            <StockIndicator 
              quantity={product.quantity}
              lowStockThreshold={product.low_stock_threshold}
              trackInventory={product.track_inventory}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            {onSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => { 
                  e.stopPropagation()
                  onSelect(e.target.checked) 
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="ml-auto">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onArchive && product.status !== 'archived' && (
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// LIST CARD
// =============================================================================

function ProductListCard({
  product,
  onClick,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onView,
  selected,
  onSelect,
  currency = DEFAULT_CURRENCY,
  className,
  animationDelay = 0,
}: ProductCardProps) {
  const status = statusConfig[product.status]
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price
  const primaryImage = product.images?.[0] || null

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
    >
      <Card 
        className={cn(
          "group cursor-pointer transition-shadow hover:shadow-md",
          selected && "ring-2 ring-primary",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Checkbox */}
            {onSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => { 
                  e.stopPropagation()
                  onSelect(e.target.checked) 
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
            )}

            {/* Image */}
            <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <ProductImage 
                src={primaryImage} 
                alt={product.name}
                className="h-full w-full"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <Badge className={cn("text-xs", status.className)}>
                  {status.label}
                </Badge>
                {product.is_featured && (
                  <Badge variant="secondary" className="text-xs">
                    Featured
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {product.sku ? `SKU: ${product.sku}` : 'No SKU'}
              </p>
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <div className="font-bold">
                {formatPrice(product.base_price, currency)}
              </div>
              {hasDiscount && (
                <div className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price!, currency)}
                </div>
              )}
            </div>

            {/* Stock */}
            <div className="flex-shrink-0 w-24">
              <StockIndicator 
                quantity={product.quantity}
                lowStockThreshold={product.low_stock_threshold}
                trackInventory={product.track_inventory}
              />
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onArchive && product.status !== 'archived' && (
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export function ProductCard(props: ProductCardProps) {
  if (props.variant === 'list') {
    return <ProductListCard {...props} />
  }
  return <ProductGridCard {...props} />
}
