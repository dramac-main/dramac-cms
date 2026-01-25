/**
 * Products View Component
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Displays the product catalog with filtering and management
 */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useMemo } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import type { Product, ProductStatus } from '../../types/ecommerce-types'
import { EditProductDialog } from '../dialogs/edit-product-dialog'
import { ViewProductDialog } from '../dialogs/view-product-dialog'
import { toast } from 'sonner'
import { 
  Package, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  Archive,
  ImageOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ProductsViewProps {
  searchQuery?: string
  onCreateProduct?: () => void
}

export function ProductsView({ searchQuery = '', onCreateProduct }: ProductsViewProps) {
  const { products, categories, isLoading, removeProduct, editProduct, copyProduct } = useEcommerce()
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Status filter
      if (statusFilter !== 'all' && product.status !== statusFilter) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !product.name.toLowerCase().includes(query) &&
          !product.sku?.toLowerCase().includes(query) &&
          !product.description?.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      
      return true
    })
  }, [products, statusFilter, searchQuery])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId])
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await removeProduct(productId)
    }
  }

  const handleArchiveProduct = async (product: Product) => {
    await editProduct(product.id, { status: 'archived' })
  }

  const handleDuplicateProduct = async (productId: string) => {
    try {
      const duplicated = await copyProduct(productId)
      toast.success(`Product duplicated: ${duplicated.name}`)
    } catch (error) {
      console.error('Error duplicating product:', error)
      toast.error('Failed to duplicate product')
    }
  }

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product)
    setShowViewDialog(true)
  }

  const getStatusBadge = (status: ProductStatus) => {
    const config = {
      active: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      draft: { label: 'Draft', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      archived: { label: 'Archived', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
    }
    return config[status]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProductStatus | 'all')}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedProducts.length > 0 && (
            <Button variant="outline" size="sm">
              <Archive className="h-4 w-4 mr-2" />
              Archive ({selectedProducts.length})
            </Button>
          )}
          <Button onClick={onCreateProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search or filters' : 'Get started by adding your first product'}
          </p>
          {!searchQuery && (
            <Button onClick={onCreateProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(product => {
                const statusBadge = getStatusBadge(product.status)
                return (
                  <TableRow 
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewProduct(product)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.short_description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.short_description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm text-muted-foreground">
                        {product.sku || '—'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-normal', statusBadge.className)}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-medium">${(product.base_price / 100).toFixed(2)}</p>
                        {product.compare_at_price && (
                          <p className="text-sm text-muted-foreground line-through">
                            ${(product.compare_at_price / 100).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.track_inventory ? (
                        <span className={cn(
                          'font-medium',
                          product.quantity <= product.low_stock_threshold && 'text-red-500'
                        )}>
                          {product.quantity}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">∞</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewProduct(product)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingProduct(product)
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicateProduct(product.id)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleArchiveProduct(product)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ViewProductDialog 
        product={viewingProduct}
        open={showViewDialog} 
        onOpenChange={setShowViewDialog}
        onEdit={() => {
          setShowViewDialog(false)
          setEditingProduct(viewingProduct)
          setShowEditDialog(true)
        }}
      />

      <ViewProductDialog 
        product={viewingProduct}
        open={showViewDialog} 
        onOpenChange={setShowViewDialog}
        onEdit={() => {
          setShowViewDialog(false)
          setEditingProduct(viewingProduct)
          setShowEditDialog(true)
        }}
      />

      <EditProductDialog 
        product={editingProduct}
        open={showEditDialog} 
        onOpenChange={setShowEditDialog}
      />
    </div>
  )
}
