/**
 * Customers View Component
 * 
 * Phase ECOM-05: Customer Management System
 * 
 * Main view for managing customers with search, filters, and stats
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Loader2, Users, UserPlus, Download, Upload, Search, Filter, X, TrendingUp, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { CustomerTable } from '../customers/customer-table'
import { CustomerDetailDialog } from '../customers/customer-detail-dialog'
import { CreateCustomerDialog } from '../customers/create-customer-dialog'
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
import { 
  getCustomers, 
  getCustomerStats,
  exportCustomers,
  importCustomers
} from '../../actions/customer-actions'
import type { 
  Customer, 
  CustomerTableFilters, 
  CustomerStatus,
  CustomerStats,
  Order
} from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface CustomersViewProps {
  siteId: string
  agencyId: string
  userId: string
  userName: string
  onViewOrder?: (order: Order) => void
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency
  }).format(amount / 100)
}

// Default filter state
const defaultFilters: CustomerTableFilters = {
  search: '',
  status: 'all',
  group: 'all',
  hasOrders: null,
  minSpent: null,
  maxSpent: null,
  dateFrom: null,
  dateTo: null,
  acceptsMarketing: null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomersView({
  siteId,
  agencyId,
  userId,
  userName,
  onViewOrder
}: CustomersViewProps) {
  // Data state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // UI state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Filter state
  const [filters, setFilters] = useState<CustomerTableFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Load customers
  const loadCustomers = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getCustomers(siteId, filters)
      
      setCustomers(result)
      setTotalCount(result.length)
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, filters, page])

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const statsData = await getCustomerStats(siteId)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [siteId])

  // Initial load
  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Handle search with debounce effect via form submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadCustomers()
  }

  // Handle filter change
  const handleFilterChange = (key: keyof CustomerTableFilters, value: string | boolean | null) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setPage(1)
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters(defaultFilters)
    setPage(1)
  }

  // Handle customer click
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id)
    setIsDetailOpen(true)
  }

  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsExporting(true)
    try {
      const result = await exportCustomers(siteId, {
        format,
        includeFields: ['first_name', 'last_name', 'email', 'phone', 'status'],
        includeAddresses: true,
        includeOrderStats: true
      })
      
      // Create and download file
      const blob = new Blob(
        [result.data],
        { type: format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success(`Exported ${totalCount} customers`)
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Failed to export customers')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      
      // Parse CSV
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const customersData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const row: Record<string, string> = {}
        headers.forEach((header, i) => {
          row[header] = values[i] || ''
        })
        return {
          email: row.email,
          first_name: row.first_name || row.firstname || '',
          last_name: row.last_name || row.lastname || '',
          phone: row.phone || undefined,
          tags: row.tags || undefined
        }
      }).filter(c => c.email)

      const result = await importCustomers(siteId, agencyId, customersData)
      
      toast.success(`Imported ${result.imported} customers, updated ${result.updated}`)
      if (result.skipped > 0) {
        toast.warning(`${result.skipped} rows skipped`)
      }
      
      // Reload
      loadCustomers()
      loadStats()
    } catch (error) {
      console.error('Error importing:', error)
      toast.error('Failed to import customers')
    } finally {
      setIsImporting(false)
      // Reset input
      e.target.value = ''
    }
  }

  // Check if any filters are active
  const hasActiveFilters = filters.search || 
    filters.status !== 'all' || 
    filters.group !== 'all' ||
    filters.hasOrders !== null ||
    filters.acceptsMarketing !== null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage your customer relationships and data
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Import */}
          <Button variant="outline" disabled={isImporting} asChild>
            <label className="cursor-pointer">
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
                disabled={isImporting}
              />
            </label>
          </Button>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Customer - placeholder */}
          <Button onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.newThisMonth ?? 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.active.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats ? Math.round((stats.active / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.withOrders.toLocaleString() ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats ? Math.round((stats.withOrders / stats.total) * 100) : 0}% conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-muted-foreground">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.totalRevenue) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              From all customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>

            {/* Has Orders Filter */}
            <Select
              value={filters.hasOrders === null ? 'all' : filters.hasOrders ? 'yes' : 'no'}
              onValueChange={(value) => 
                handleFilterChange('hasOrders', value === 'all' ? null : value === 'yes')
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Has Orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Has Orders</SelectItem>
                <SelectItem value="no">No Orders</SelectItem>
              </SelectContent>
            </Select>

            {/* Marketing Filter */}
            <Select
              value={filters.acceptsMarketing === null ? 'all' : filters.acceptsMarketing ? 'yes' : 'no'}
              onValueChange={(value) => 
                handleFilterChange('acceptsMarketing', value === 'all' ? null : value === 'yes')
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Marketing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Subscribed</SelectItem>
                <SelectItem value="no">Not Subscribed</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        siteId={siteId}
        onViewCustomer={handleViewCustomer}
        onCustomersChange={loadCustomers}
      />

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount} customers
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page * pageSize >= totalCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Customer Detail Dialog */}
      <CustomerDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        customerId={selectedCustomerId || ''}
        siteId={siteId}
        userId={userId}
        userName={userName}
        onViewOrder={onViewOrder}
      />

      {/* Create Customer Dialog */}
      <CreateCustomerDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        siteId={siteId}
        agencyId={agencyId}
        onSuccess={() => {
          loadCustomers()
          loadStats()
        }}
      />
    </div>
  )
}
