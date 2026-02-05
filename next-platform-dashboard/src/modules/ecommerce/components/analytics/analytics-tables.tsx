'use client'

/**
 * Analytics Tables Components
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * Data table components for product and customer analytics.
 */

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { 
  ProductPerformance, 
  CategoryPerformance,
  CustomerLifetimeValue 
} from '../../types/analytics-types'
import { formatCurrency, formatNumber, toCSV, downloadCSV } from '../../lib/analytics-utils'

// ============================================================================
// PRODUCT PERFORMANCE TABLE
// ============================================================================

interface ProductPerformanceTableProps {
  data: ProductPerformance[] | null
  isLoading?: boolean
  className?: string
}

type SortKey = 'revenue' | 'quantity_sold' | 'views' | 'conversion_rate'
type SortDirection = 'asc' | 'desc'

export function ProductPerformanceTable({
  data,
  isLoading = false,
  className
}: ProductPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 10
  
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }
  
  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />
  }
  
  const filteredData = data?.filter(p => 
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  ) ?? []
  
  const sortedData = [...filteredData].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1
    return ((a[sortKey] || 0) - (b[sortKey] || 0)) * multiplier
  })
  
  const paginatedData = sortedData.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(sortedData.length / pageSize)
  
  const handleExport = () => {
    const csv = toCSV(sortedData as unknown as Record<string, unknown>[], [
      { key: 'product_name', label: 'Product' },
      { key: 'sku', label: 'SKU' },
      { key: 'quantity_sold', label: 'Units Sold' },
      { key: 'revenue', label: 'Revenue (cents)' },
      { key: 'views', label: 'Views' },
      { key: 'conversion_rate', label: 'Conversion Rate' }
    ])
    downloadCSV(csv, `product-performance-${new Date().toISOString().slice(0, 10)}.csv`)
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Product Performance</CardTitle>
            <CardDescription>
              {sortedData.length} products
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                className="pl-8 w-[200px]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Product</TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold"
                        onClick={() => handleSort('quantity_sold')}
                      >
                        Units Sold
                        <SortIcon column="quantity_sold" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold"
                        onClick={() => handleSort('revenue')}
                      >
                        Revenue
                        <SortIcon column="revenue" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold"
                        onClick={() => handleSort('views')}
                      >
                        Views
                        <SortIcon column="views" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold"
                        onClick={() => handleSort('conversion_rate')}
                      >
                        Conv. Rate
                        <SortIcon column="conversion_rate" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.product_name}</p>
                            {product.sku && (
                              <p className="text-sm text-muted-foreground">{product.sku}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatNumber(product.quantity_sold)}</TableCell>
                        <TableCell>{formatCurrency(product.revenue)}</TableCell>
                        <TableCell>{formatNumber(product.views)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            product.conversion_rate > 5 ? 'default' : 
                            product.conversion_rate > 2 ? 'secondary' : 
                            'outline'
                          }>
                            {product.conversion_rate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sortedData.length)} of {sortedData.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// CATEGORY PERFORMANCE TABLE
// ============================================================================

interface CategoryPerformanceTableProps {
  data: CategoryPerformance[] | null
  isLoading?: boolean
  className?: string
}

export function CategoryPerformanceTable({
  data,
  isLoading = false,
  className
}: CategoryPerformanceTableProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Category Performance</CardTitle>
        <CardDescription>
          Revenue by product category
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data || data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No category data available
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((category) => (
                    <TableRow key={category.category_id}>
                      <TableCell className="font-medium">{category.category_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(category.revenue)}</TableCell>
                      <TableCell className="text-right">{formatNumber(category.quantity_sold)}</TableCell>
                      <TableCell className="text-right">{category.products_count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min(category.percentage_of_revenue, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm w-12 text-right">
                            {category.percentage_of_revenue.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// CUSTOMER LIFETIME VALUE TABLE
// ============================================================================

interface CustomerLTVTableProps {
  data: CustomerLifetimeValue[] | null
  isLoading?: boolean
  className?: string
}

export function CustomerLTVTable({
  data,
  isLoading = false,
  className
}: CustomerLTVTableProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Top Customers by Lifetime Value</CardTitle>
        <CardDescription>
          Highest value customers across all time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">AOV</TableHead>
                  <TableHead className="text-right">Predicted CLV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data || data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No customer data available
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((customer, index) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{customer.customer_email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(customer.total_revenue)}
                      </TableCell>
                      <TableCell className="text-right">{customer.total_orders}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(customer.average_order_value)}
                      </TableCell>
                      <TableCell className="text-right text-green-600 dark:text-green-400">
                        {formatCurrency(customer.predicted_ltv)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// EXPORT
// ============================================================================

export {
  type ProductPerformanceTableProps,
  type CategoryPerformanceTableProps,
  type CustomerLTVTableProps
}
