/**
 * Quote Table Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * TanStack Table for displaying quotes with sorting and selection
 */
'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  RowSelectionState,
  ColumnDef
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy,
  Send,
  Trash2, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { QuoteStatusBadge } from './quote-status-badge'
import { 
  formatQuoteCurrency, 
  isQuoteExpired, 
  calculateDaysUntilExpiry,
  getExpiryWarningLevel 
} from '../../lib/quote-utils'
import { deleteQuote, duplicateQuote } from '../../actions/quote-actions'
import type { QuoteSummary, QuoteStatus } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteTableProps {
  quotes: QuoteSummary[]
  siteId: string
  isLoading?: boolean
  onViewQuote: (quoteId: string) => void
  onEditQuote: (quoteId: string) => void
  onSendQuote?: (quoteId: string) => void
  onQuotesChange?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteTable({
  quotes,
  siteId,
  isLoading = false,
  onViewQuote,
  onEditQuote,
  onSendQuote,
  onQuotesChange
}: QuoteTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  
  // Handle actions
  const handleDuplicate = async (quoteId: string) => {
    const result = await duplicateQuote(siteId, quoteId)
    if (result.success) {
      toast.success(`Quote duplicated as ${result.quote?.quote_number}`)
      onQuotesChange?.()
    } else {
      toast.error(result.error || 'Failed to duplicate quote')
    }
  }
  
  const handleDelete = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return
    
    const result = await deleteQuote(siteId, quoteId)
    if (result.success) {
      toast.success('Quote deleted')
      onQuotesChange?.()
    } else {
      toast.error(result.error || 'Failed to delete quote')
    }
  }

  // Column definitions
  const columns = useMemo<ColumnDef<QuoteSummary>[]>(() => [
    // Checkbox
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      size: 40
    },
    // Quote Number
    {
      accessorKey: 'quote_number',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Quote #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <button
          onClick={() => onViewQuote(row.original.id)}
          className="font-medium text-primary hover:underline"
        >
          {row.original.quote_number}
        </button>
      )
    },
    // Customer
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customer_name}</p>
          {row.original.customer_company && (
            <p className="text-xs text-muted-foreground">
              {row.original.customer_company}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {row.original.customer_email}
          </p>
        </div>
      )
    },
    // Status
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <QuoteStatusBadge status={row.original.status} />
      )
    },
    // Total
    {
      accessorKey: 'total',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatQuoteCurrency(row.original.total, row.original.currency)}
        </span>
      )
    },
    // Valid Until
    {
      accessorKey: 'valid_until',
      header: 'Valid Until',
      cell: ({ row }) => {
        const validUntil = row.original.valid_until
        if (!validUntil) return <span className="text-muted-foreground">No expiry</span>
        
        const warningLevel = getExpiryWarningLevel(validUntil)
        const daysLeft = calculateDaysUntilExpiry(validUntil)
        
        return (
          <div className="flex items-center gap-2">
            <span className={cn(
              warningLevel === 'expired' && 'text-red-600',
              warningLevel === 'critical' && 'text-red-500',
              warningLevel === 'warning' && 'text-amber-600'
            )}>
              {format(new Date(validUntil), 'MMM d, yyyy')}
            </span>
            {warningLevel === 'expired' && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            {warningLevel === 'critical' && daysLeft !== null && (
              <span className="text-xs text-red-500">
                ({daysLeft === 0 ? 'Today' : `${daysLeft}d`})
              </span>
            )}
            {warningLevel === 'warning' && daysLeft !== null && (
              <span className="text-xs text-amber-600">
                ({daysLeft}d)
              </span>
            )}
          </div>
        )
      }
    },
    // Items Count
    {
      accessorKey: 'items_count',
      header: 'Items',
      cell: ({ row }) => (
        <span>{row.original.items_count}</span>
      )
    },
    // Created
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.created_at), 'MMM d, yyyy')}
        </span>
      )
    },
    // Actions
    {
      id: 'actions',
      cell: ({ row }) => {
        const quote = row.original
        const canEdit = ['draft', 'pending_approval'].includes(quote.status)
        const canSend = ['draft', 'pending_approval'].includes(quote.status)
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewQuote(quote.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEditQuote(quote.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canSend && onSendQuote && (
                <DropdownMenuItem onClick={() => onSendQuote(quote.id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Quote
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleDuplicate(quote.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(quote.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ], [siteId, onViewQuote, onEditQuote, onSendQuote, onQuotesChange])

  // Table instance
  const table = useReactTable({
    data: quotes,
    columns,
    state: {
      sorting,
      rowSelection
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-4">
      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedCount} quote{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRowSelection({})}
          >
            Clear Selection
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              const selectedIndices = Object.keys(rowSelection).map(Number)
              for (const idx of selectedIndices) {
                const quote = quotes[idx]
                if (quote) {
                  await handleDelete(quote.id)
                }
              }
              setRowSelection({})
            }}
          >
            Delete Selected
          </Button>
        </div>
      )}
      
      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  No quotes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {quotes.length} quote(s)
        </div>
        <div className="flex items-center space-x-2">
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
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
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
  )
}
