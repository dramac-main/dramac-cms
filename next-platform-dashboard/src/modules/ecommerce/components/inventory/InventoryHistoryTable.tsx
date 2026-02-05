/**
 * Inventory History Table
 * 
 * Phase ECOM-40B: Inventory Management UI
 * 
 * TanStack Table showing stock movement history with filters.
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Truck,
  Trash2,
  AlertTriangle,
  Package,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getStockHistory } from '../../actions/inventory-actions'
import type { InventoryMovement, InventoryMovementType } from '../../types/inventory-types'

// Movement type display config
const movementTypeConfig: Record<InventoryMovementType, {
  label: string
  icon: typeof ArrowUp
  color: string
  bgColor: string
}> = {
  restock: {
    label: 'Restock',
    icon: ArrowUp,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  adjustment: {
    label: 'Adjustment',
    icon: RotateCcw,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  sale: {
    label: 'Sale',
    icon: ArrowDown,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  return: {
    label: 'Return',
    icon: Truck,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30'
  },
  transfer: {
    label: 'Transfer',
    icon: Truck,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  },
  damage: {
    label: 'Damage',
    icon: Trash2,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  reserved: {
    label: 'Reserved',
    icon: Package,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  unreserved: {
    label: 'Unreserved',
    icon: Package,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30'
  }
}

interface InventoryHistoryTableProps {
  siteId: string
  productId?: string
  className?: string
}

export function InventoryHistoryTable({
  siteId,
  productId,
  className
}: InventoryHistoryTableProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [_searchQuery, setSearchQuery] = useState('')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  const fetchHistory = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    
    try {
      const result = await getStockHistory(siteId, productId, {
        type: typeFilter !== 'all' ? typeFilter as InventoryMovementType : undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize
      })
      
      setMovements(result.movements)
      setTotal(result.total)
    } catch (error) {
      console.error('Error fetching inventory history:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, productId, typeFilter, page, pageSize])

  // Define columns
  const columns: ColumnDef<InventoryMovement>[] = useMemo(() => [
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="font-medium">
            {format(new Date(row.original.created_at), 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(row.original.created_at), 'h:mm a')}
          </p>
        </div>
      )
    },
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }) => {
        const product = row.original.product
        const variant = row.original.variant
        
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden">
              {product?.images?.[0] ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {product?.name ?? 'Unknown Product'}
              </p>
              {variant && (
                <p className="text-xs text-muted-foreground">
                  {Object.values(variant.options).join(' / ')}
                </p>
              )}
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const config = movementTypeConfig[row.original.type]
        const Icon = config.icon
        
        return (
          <Badge variant="secondary" className={cn("gap-1", config.bgColor, config.color)}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'quantity',
      header: 'Change',
      cell: ({ row }) => {
        const qty = row.original.quantity
        const isPositive = qty > 0
        
        return (
          <span className={cn(
            "font-mono font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? '+' : ''}{qty}
          </span>
        )
      }
    },
    {
      accessorKey: 'previous_stock',
      header: 'Before',
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground">
          {row.original.previous_stock}
        </span>
      )
    },
    {
      accessorKey: 'new_stock',
      header: 'After',
      cell: ({ row }) => (
        <span className={cn(
          "font-mono font-medium",
          row.original.new_stock === 0 && "text-red-600"
        )}>
          {row.original.new_stock}
        </span>
      )
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
          {row.original.reason || '-'}
        </span>
      )
    }
  ], [])

  const table = useReactTable({
    data: movements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize)
  })

  const totalPages = Math.ceil(total / pageSize)

  // Export to CSV
  const handleExport = () => {
    const headers = ['Date', 'Product', 'SKU', 'Type', 'Change', 'Before', 'After', 'Reason']
    const rows = movements.map(m => [
      format(new Date(m.created_at), 'yyyy-MM-dd HH:mm:ss'),
      m.product?.name ?? 'Unknown',
      m.product?.sku ?? '',
      m.type,
      m.quantity,
      m.previous_stock,
      m.new_stock,
      m.reason ?? ''
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Type filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(movementTypeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchHistory(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8 mb-2" />
                    <p>No inventory movements found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} entries
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || totalPages === 0}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
