/**
 * Flash Sales View Component
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Displays flash sales/promotions management
 */
'use client'

import { useState, useMemo } from 'react'
import { useFlashSales } from '../../hooks/use-marketing'
import { FlashSaleDialog } from '../dialogs/flash-sale-dialog'
import type { FlashSale } from '../../types/marketing-types'
import { CountdownTimer } from '../widgets/countdown-timer'
import { 
  Zap, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Calendar,
  TrendingUp
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FlashSalesViewProps {
  siteId: string
  searchQuery?: string
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  scheduled: { label: 'Scheduled', icon: Calendar, color: 'bg-blue-500/10 text-blue-500' },
  active: { label: 'Active', icon: Play, color: 'bg-green-500/10 text-green-500' },
  paused: { label: 'Paused', icon: Pause, color: 'bg-yellow-500/10 text-yellow-500' },
  ended: { label: 'Ended', icon: CheckCircle, color: 'bg-gray-500/10 text-gray-500' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-500/10 text-red-500' },
}

export function FlashSalesView({ siteId, searchQuery = '' }: FlashSalesViewProps) {
  const { sales: flashSales, isLoading, error, remove: deleteFlashSale, refresh: refreshFlashSales } = useFlashSales(siteId)
  const [selectedSale, setSelectedSale] = useState<FlashSale | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // Filter flash sales by status and search
  const filteredSales = useMemo(() => {
    let filtered = flashSales

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter((s: FlashSale) => s.status === activeTab)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((s: FlashSale) => 
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [flashSales, activeTab, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: flashSales.length,
      active: flashSales.filter((s: FlashSale) => s.status === 'active').length,
      scheduled: flashSales.filter((s: FlashSale) => s.status === 'scheduled').length,
      ended: flashSales.filter((s: FlashSale) => s.status === 'ended').length,
    }
  }, [flashSales])

  const handleCreateSale = () => {
    setSelectedSale(null)
    setShowDialog(true)
  }

  const handleEditSale = (sale: FlashSale) => {
    setSelectedSale(sale)
    setShowDialog(true)
  }

  const handleDeleteSale = async (saleId: string) => {
    if (confirm('Are you sure you want to delete this flash sale?')) {
      const success = await deleteFlashSale(saleId)
      if (success) {
        toast.success('Flash sale deleted')
      } else {
        toast.error('Failed to delete flash sale')
      }
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
  }

  const getTimeStatus = (sale: FlashSale) => {
    const now = new Date()
    const start = new Date(sale.starts_at)
    const end = new Date(sale.ends_at)

    if (sale.status === 'active' && end > now) {
      return { type: 'countdown', date: end, label: 'Ends in' }
    }
    if (sale.status === 'scheduled' && start > now) {
      return { type: 'countdown', date: start, label: 'Starts in' }
    }
    return null
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
        <h3 className="text-lg font-semibold">Error loading flash sales</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => refreshFlashSales()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ended</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ended}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({stats.scheduled})</TabsTrigger>
            <TabsTrigger value="ended">Ended ({stats.ended})</TabsTrigger>
          </TabsList>
          <Button onClick={handleCreateSale}>
            <Plus className="h-4 w-4 mr-2" />
            Create Flash Sale
          </Button>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          {filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No flash sales found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search' 
                  : 'Create limited-time promotions to drive sales'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateSale}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Flash Sale
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSales.map((sale: FlashSale) => {
                const status = statusConfig[sale.status]
                const timeStatus = getTimeStatus(sale)

                return (
                  <Card key={sale.id} className="relative overflow-hidden">
                    {/* Status banner for active sales */}
                    {sale.status === 'active' && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
                    )}
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{sale.name}</CardTitle>
                          {sale.description && (
                            <CardDescription className="line-clamp-2">
                              {sale.description}
                            </CardDescription>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSale(sale)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSale(sale.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Status and discount */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn('gap-1', status.color)}>
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {sale.discount_type === 'percentage' 
                            ? `${sale.discount_value}% off`
                            : `$${(sale.discount_value / 100).toFixed(2)} off`
                          }
                        </Badge>
                      </div>

                      {/* Time info */}
                      <div className="text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDateRange(sale.starts_at, sale.ends_at)}
                      </div>

                      {/* Countdown timer */}
                      {timeStatus && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground mb-2">
                            {timeStatus.label}
                          </div>
                          <CountdownTimer 
                            endTime={timeStatus.date} 
                            variant="compact"
                            onComplete={() => refreshFlashSales()}
                          />
                        </div>
                      )}

                      {/* Products count */}
                      {sale.products && sale.products.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground pt-2 border-t">
                          <Package className="h-3 w-3" />
                          {sale.products.length} product{sale.products.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Flash Sale Dialog */}
      <FlashSaleDialog
        siteId={siteId}
        flashSale={selectedSale}
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={() => {
          setShowDialog(false)
          refreshFlashSales()
        }}
      />
    </div>
  )
}
