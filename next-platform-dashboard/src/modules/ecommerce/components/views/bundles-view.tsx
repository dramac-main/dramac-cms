/**
 * Bundles View Component
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Displays product bundles management
 */
'use client'

import { useState, useMemo } from 'react'
import { useBundles } from '../../hooks/use-marketing'
import { BundleDialog } from '../dialogs/bundle-dialog'
import type { Bundle } from '../../types/marketing-types'
import { 
  Package, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Boxes,
  DollarSign,
  TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { formatCurrency } from '@/lib/locale-config'

interface BundlesViewProps {
  siteId: string
  searchQuery?: string
}

export function BundlesView({ siteId, searchQuery = '' }: BundlesViewProps) {
  const { bundles, isLoading, error, remove: deleteBundle, refresh: refreshBundles } = useBundles(siteId)
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  // Filter bundles
  const filteredBundles = useMemo(() => {
    if (!searchQuery) return bundles
    
    const query = searchQuery.toLowerCase()
    return bundles.filter(b => 
      b.name.toLowerCase().includes(query) ||
      b.description?.toLowerCase().includes(query) ||
      b.sku?.toLowerCase().includes(query)
    )
  }, [bundles, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const active = bundles.filter((b: Bundle) => b.is_active)
    const totalSavings = bundles.reduce((sum: number, b: Bundle) => sum + b.savings, 0)
    
    return {
      total: bundles.length,
      active: active.length,
      totalSavings,
    }
  }, [bundles])

  const handleCreateBundle = () => {
    setSelectedBundle(null)
    setShowDialog(true)
  }

  const handleEditBundle = (bundle: Bundle) => {
    setSelectedBundle(bundle)
    setShowDialog(true)
  }

  const handleDeleteBundle = async (bundleId: string) => {
    if (confirm('Are you sure you want to delete this bundle?')) {
      const success = await deleteBundle(bundleId)
      if (success) {
        toast.success('Bundle deleted')
      } else {
        toast.error('Failed to delete bundle')
      }
    }
  }

  const calculateSavings = (bundle: Bundle) => {
    if (!bundle.original_total || !bundle.bundle_price) return null
    const savings = bundle.original_total - bundle.bundle_price
    const percentage = Math.round((savings / bundle.original_total) * 100)
    return { amount: savings, percentage }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">Error loading bundles</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => refreshBundles()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bundles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bundles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings Offered</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalSavings / 100)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <Button onClick={handleCreateBundle}>
          <Plus className="h-4 w-4 mr-2" />
          Create Bundle
        </Button>
      </div>

      {/* Bundles Table */}
      {filteredBundles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No bundles found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery 
              ? 'Try adjusting your search' 
              : 'Create product bundles to offer grouped discounts'}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateBundle}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bundle</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Regular Price</TableHead>
                <TableHead>Bundle Price</TableHead>
                <TableHead>Savings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBundles.map((bundle) => {
                const savings = calculateSavings(bundle)
                
                return (
                  <TableRow key={bundle.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bundle.name}</div>
                        {bundle.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {bundle.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {bundle.sku ? (
                        <code className="px-2 py-1 bg-muted rounded text-xs">{bundle.sku}</code>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                        {bundle.items?.length || 0} items
                      </div>
                    </TableCell>
                    <TableCell>
                      {bundle.original_total ? (
                        <span className="text-muted-foreground line-through">
                          {formatCurrency(bundle.original_total / 100)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {bundle.bundle_price ? formatCurrency(bundle.bundle_price / 100) : '—'}
                    </TableCell>
                    <TableCell>
                      {savings ? (
                        <Badge className="gap-1 bg-green-500/10 text-green-600">
                          <TrendingDown className="h-3 w-3" />
                          {savings.percentage}% off
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {bundle.is_active ? (
                        <Badge className="gap-1 bg-green-500/10 text-green-500">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditBundle(bundle)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBundle(bundle.id)}
                            className="text-destructive"
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

      {/* Bundle Dialog */}
      <BundleDialog
        siteId={siteId}
        bundle={selectedBundle}
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={() => {
          setShowDialog(false)
          refreshBundles()
        }}
      />
    </div>
  )
}
