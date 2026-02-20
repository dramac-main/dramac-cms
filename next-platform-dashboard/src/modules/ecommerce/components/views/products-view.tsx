/**
 * Products View Component
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * Enhanced product management with data table, bulk actions, import/export
 */
'use client'

import { useState, useCallback } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import { useCurrency } from '../../context/ecommerce-context'
import { ProductDataTable } from '../tables/product-data-table'
import { EditProductDialog } from '../dialogs/edit-product-dialog'
import { ViewProductDialog } from '../dialogs/view-product-dialog'
import { ImportProductsDialog } from '../dialogs/import-products-dialog'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'
import type { Product, BulkAction } from '../../types/ecommerce-types'
import { 
  executeBulkAction, 
  duplicateProductAction,
  updateProductField,
  exportProducts 
} from '../../actions/product-import-export'

// ============================================================================
// TYPES
// ============================================================================

interface ProductsViewProps {
  onCreateProduct?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductsView({ onCreateProduct }: ProductsViewProps) {
  const { 
    products, 
    categories, 
    isLoading, 
    refresh,
    removeProduct, 
    editProduct,
    siteId,
    agencyId
  } = useEcommerce()
  const { currency } = useCurrency()

  // Dialog states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  // Handlers
  const handleView = useCallback((product: Product) => {
    setViewingProduct(product)
    setShowViewDialog(true)
  }, [])

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product)
    setShowEditDialog(true)
  }, [])

  const handleDuplicate = useCallback(async (productId: string) => {
    try {
      const duplicated = await duplicateProductAction(siteId, productId)
      toast.success(`Product duplicated: ${duplicated.name}`)
      refresh()
    } catch (error) {
      console.error('Error duplicating product:', error)
      toast.error('Failed to duplicate product')
    }
  }, [siteId, refresh])

  const handleArchive = useCallback(async (product: Product) => {
    try {
      await editProduct(product.id, { status: 'archived' })
      toast.success('Product archived')
    } catch (error) {
      console.error('Error archiving product:', error)
      toast.error('Failed to archive product')
    }
  }, [editProduct])

  const handleDelete = useCallback(async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await removeProduct(productId)
      toast.success('Product deleted')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }, [removeProduct])

  const handleInlineEdit = useCallback(async (
    productId: string, 
    field: string, 
    value: unknown
  ) => {
    try {
      const result = await updateProductField(siteId, productId, field, value)
      if (result.success) {
        toast.success('Updated successfully')
        refresh()
      } else {
        toast.error(result.error || 'Failed to update')
      }
    } catch (error) {
      console.error('Error updating field:', error)
      toast.error('Failed to update')
    }
  }, [siteId, refresh])

  const handleBulkAction = useCallback(async (
    action: BulkAction,
    productIds: string[],
    params?: Record<string, unknown>
  ) => {
    try {
      const result = await executeBulkAction(siteId, productIds, action, params)
      
      if (result.success) {
        toast.success(`${result.affected} products updated`)
        refresh()
      } else {
        toast.error(result.errors.join(', '))
      }
    } catch (error) {
      console.error('Error executing bulk action:', error)
      toast.error('Bulk action failed')
    }
  }, [siteId, refresh])

  const handleExport = useCallback(async () => {
    try {
      const { data, filename } = await exportProducts(siteId, {
        format: 'csv',
        includeFields: ['name', 'sku', 'description', 'base_price', 'compare_at_price', 'quantity', 'status'],
        includeVariants: false,
        includeImages: true
      })

      // Download file
      const blob = new Blob([data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Products exported successfully')
    } catch (error) {
      console.error('Error exporting products:', error)
      toast.error('Failed to export products')
    }
  }, [siteId])

  const handleImport = useCallback(() => {
    setShowImportDialog(true)
  }, [])

  const handleImportSuccess = useCallback(() => {
    toast.success('Products imported successfully')
    refresh()
  }, [refresh])

  // Empty state
  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <div className="p-4 rounded-full bg-muted">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium">No products yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Get started by adding your first product
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCreateProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button variant="outline" onClick={handleImport}>
            Import from CSV
          </Button>
        </div>

        <ImportProductsDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          siteId={siteId}
          agencyId={agencyId}
          onSuccess={handleImportSuccess}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Button onClick={onCreateProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Data Table */}
      <ProductDataTable
        products={products}
        categories={categories}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onInlineEdit={handleInlineEdit}
        onBulkAction={handleBulkAction}
        onExport={handleExport}
        onImport={handleImport}
        currency={currency}
        isLoading={isLoading}
      />

      {/* Dialogs */}
      {editingProduct && (
        <EditProductDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          product={editingProduct}
        />
      )}

      {viewingProduct && (
        <ViewProductDialog
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          product={viewingProduct}
        />
      )}

      <ImportProductsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        siteId={siteId}
        agencyId={agencyId}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}
