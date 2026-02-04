/**
 * Product Data Table
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * Full-featured data table for products using TanStack Table
 */
'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Columns,
  Download,
  Upload
} from 'lucide-react'
import { createProductColumns } from './product-columns'
import { ProductFilters, defaultProductFilters } from '../filters/product-filters'
import { BulkActionsToolbar } from '../bulk/bulk-actions-toolbar'
import type { Product, Category, ProductTableFilters, BulkAction } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ProductDataTableProps {
  products: Product[]
  categories: Category[]
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDuplicate: (productId: string) => Promise<void>
  onArchive: (product: Product) => Promise<void>
  onDelete: (productId: string) => Promise<void>
  onInlineEdit: (productId: string, field: string, value: unknown) => Promise<void>
  onBulkAction: (action: BulkAction, productIds: string[], params?: Record<string, unknown>) => Promise<void>
  onExport: () => void
  onImport: () => void
  currency?: string
  isLoading?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductDataTable({
  products,
  categories,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onInlineEdit,
  onBulkAction,
  onExport,
  onImport,
  currency = 'USD',
  isLoading = false
}: ProductDataTableProps) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [filters, setFilters] = useState<ProductTableFilters>(defaultProductFilters)
  const [isBulkExecuting, setIsBulkExecuting] = useState(false)

  // Create columns
  const columns = useMemo(() => createProductColumns({
    onView,
    onEdit,
    onDuplicate,
    onArchive,
    onDelete,
    onInlineEdit,
    currency
  }), [onView, onEdit, onDuplicate, onArchive, onDelete, onInlineEdit, currency])

  // Filter products based on advanced filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase()
        if (
          !product.name.toLowerCase().includes(query) &&
          !product.sku?.toLowerCase().includes(query) &&
          !product.description?.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // Status filter
      if (filters.status !== 'all' && product.status !== filters.status) {
        return false
      }

      // Stock level filter
      if (filters.stockLevel !== 'all') {
        if (filters.stockLevel === 'out_of_stock' && product.quantity !== 0) return false
        if (filters.stockLevel === 'low_stock' && 
          !(product.track_inventory && product.quantity > 0 && product.quantity <= product.low_stock_threshold)) {
          return false
        }
        if (filters.stockLevel === 'in_stock' && 
          (product.quantity === 0 || (product.track_inventory && product.quantity <= product.low_stock_threshold))) {
          return false
        }
      }

      // Price filter
      if (filters.priceMin !== null && product.base_price < filters.priceMin * 100) return false
      if (filters.priceMax !== null && product.base_price > filters.priceMax * 100) return false

      // Date filter
      if (filters.dateFrom !== null) {
        const productDate = new Date(product.created_at)
        const fromDate = new Date(filters.dateFrom)
        if (productDate < fromDate) return false
      }
      if (filters.dateTo !== null) {
        const productDate = new Date(product.created_at)
        const toDate = new Date(filters.dateTo)
        if (productDate > toDate) return false
      }

      // Featured filter
      if (filters.featured !== null && product.is_featured !== filters.featured) return false

      return true
    })
  }, [products, filters])

  // Create table
  const table = useReactTable({
    data: filteredProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    },
    initialState: {
      pagination: { pageSize: 20 }
    }
  })

  // Get selected product IDs
  const selectedProductIds = useMemo(() => {
    return table.getSelectedRowModel().rows.map(row => row.original.id)
  }, [table.getSelectedRowModel().rows])

  // Handle bulk action
  const handleBulkAction = async (action: BulkAction, params?: Record<string, unknown>) => {
    setIsBulkExecuting(true)
    try {
      await onBulkAction(action, selectedProductIds, params)
      setRowSelection({}) // Clear selection after action
    } finally {
      setIsBulkExecuting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <ProductFilters
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filteredProducts.length} of {products.length} products
        </div>

        <div className="flex items-center gap-2">
          {/* Import/Export */}
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const labels: Record<string, string> = {
                    name: 'Product',
                    status: 'Status',
                    base_price: 'Price',
                    quantity: 'Inventory',
                    category: 'Category'
                  }
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {labels[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActionsToolbar
        selectedCount={selectedProductIds.length}
        onClearSelection={() => setRowSelection({})}
        onExecute={handleBulkAction}
        isExecuting={isBulkExecuting}
        categories={categories}
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
