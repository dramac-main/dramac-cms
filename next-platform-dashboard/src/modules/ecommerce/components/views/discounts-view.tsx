/**
 * Discounts View Component
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Displays discount codes and coupons
 */
'use client'

import { useState, useMemo } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import { EditDiscountDialog } from '../dialogs/edit-discount-dialog'
import type { Discount, DiscountType } from '../../types/ecommerce-types'
import { 
  Percent, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  CircleCheck,
  CircleX,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { DEFAULT_LOCALE, formatCurrency } from '@/lib/locale-config'
interface DiscountsViewProps {
  searchQuery?: string
  onCreateDiscount?: () => void
}

const discountTypeLabels: Record<DiscountType, string> = {
  percentage: 'Percentage Off',
  fixed_amount: 'Fixed Amount',
  free_shipping: 'Free Shipping',
}

export function DiscountsView({ searchQuery = '', onCreateDiscount }: DiscountsViewProps) {
  const { discounts, isLoading, removeDiscount, editDiscount } = useEcommerce()
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Filter discounts
  const filteredDiscounts = useMemo(() => {
    if (!searchQuery) return discounts
    
    const query = searchQuery.toLowerCase()
    return discounts.filter(d => 
      d.code.toLowerCase().includes(query) ||
      d.description?.toLowerCase().includes(query)
    )
  }, [discounts, searchQuery])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Discount code copied!')
  }

  const handleToggleActive = async (discount: Discount) => {
    await editDiscount(discount.id, { is_active: !discount.is_active })
  }

  const handleDeleteDiscount = async (discountId: string) => {
    if (confirm('Are you sure you want to delete this discount?')) {
      await removeDiscount(discountId)
    }
  }

  const formatValue = (discount: Discount) => {
    switch (discount.type) {
      case 'percentage':
        return `${discount.value}%`
      case 'fixed_amount':
        return formatCurrency(discount.value / 100)
      case 'free_shipping':
        return 'Free Shipping'
    }
  }

  const isExpired = (discount: Discount) => {
    if (!discount.ends_at) return false
    return new Date(discount.ends_at) < new Date()
  }

  const isUpcoming = (discount: Discount) => {
    return new Date(discount.starts_at) > new Date()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(DEFAULT_LOCALE, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
      <div className="flex items-center justify-end">
        <Button onClick={onCreateDiscount}>
          <Plus className="h-4 w-4 mr-2" />
          Add Discount
        </Button>
      </div>

      {/* Discounts Table */}
      {filteredDiscounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Percent className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No discounts found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Create discount codes to offer special deals'}
          </p>
          {!searchQuery && (
            <Button onClick={onCreateDiscount}>
              <Plus className="h-4 w-4 mr-2" />
              Add Discount
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiscounts.map(discount => {
                const expired = isExpired(discount)
                const upcoming = isUpcoming(discount)
                
                return (
                  <TableRow key={discount.id} className={cn(expired && 'opacity-60')}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-primary">
                          {discount.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyCode(discount.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {discount.description && (
                        <p className="text-sm text-muted-foreground">{discount.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{discountTypeLabels[discount.type]}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">{formatValue(discount)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {discount.usage_count}
                        {discount.usage_limit && ` / ${discount.usage_limit}`}
                        {!discount.usage_limit && ' uses'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(discount.starts_at)}
                        {discount.ends_at && ` - ${formatDate(discount.ends_at)}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {expired ? (
                        <Badge variant="secondary">Expired</Badge>
                      ) : upcoming ? (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Upcoming
                        </Badge>
                      ) : discount.is_active ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCopyCode(discount.code)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Code
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingDiscount(discount)
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(discount)}>
                            {discount.is_active ? (
                              <>
                                <CircleX className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CircleCheck className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteDiscount(discount.id)}
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

      <EditDiscountDialog 
        discount={editingDiscount}
        open={showEditDialog} 
        onOpenChange={setShowEditDialog}
      />
    </div>
  )
}
