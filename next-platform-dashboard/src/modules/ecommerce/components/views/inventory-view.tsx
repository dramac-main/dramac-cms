/**
 * Inventory View Component
 * 
 * Phase ECOM-40B: Inventory Management UI
 * 
 * Main inventory dashboard with stock levels, alerts, and history.
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Plus,
  Settings,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { StockAlertWidget } from '../widgets/StockAlertWidget'
import { StockAdjustmentDialog } from '../inventory/StockAdjustmentDialog'
import { InventoryHistoryTable } from '../inventory/InventoryHistoryTable'
import { 
  getInventoryReport, 
  getStockValuation,
  getStockAlerts 
} from '../../actions/inventory-actions'
import type { InventoryReport, StockValuation, AlertedProduct } from '../../types/inventory-types'
import type { Product } from '../../types/ecommerce-types'

interface InventoryViewProps {
  siteId: string
  agencyId: string
}

export function InventoryView({ siteId }: InventoryViewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<InventoryReport | null>(null)
  const [valuation, setValuation] = useState<StockValuation | null>(null)
  const [alerts, setAlerts] = useState<AlertedProduct[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  
  // Dialog state
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [reportData, valuationData, alertData] = await Promise.all([
        getInventoryReport(siteId),
        getStockValuation(siteId),
        getStockAlerts(siteId, 'all')
      ])
      
      setReport(reportData)
      setValuation(valuationData)
      setAlerts(alertData.filter(a => a.alert_level !== 'ok'))
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-muted-foreground">
            Manage stock levels and track inventory movements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {report?.summary.total_products ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {report?.summary.total_quantity ?? 0} units
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inventory Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(valuation?.total_cost ?? 0)}
                </p>
                <p className="text-sm text-green-600">
                  {formatCurrency(valuation?.potential_profit ?? 0)} potential profit
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {(report?.summary.low_stock_count ?? 0) + (report?.summary.critical_stock_count ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {report?.summary.critical_stock_count ?? 0} critical
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <TrendingDown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Out of Stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {report?.summary.out_of_stock_count ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  products unavailable
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stock Alerts Widget */}
            <StockAlertWidget
              siteId={siteId}
              onViewAll={() => setActiveTab('alerts')}
              onProductClick={(productId) => {
                // Navigate to product or open adjustment
                console.log('Product clicked:', productId)
              }}
              className="lg:col-span-1"
            />

            {/* Quick Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Stock Distribution</CardTitle>
                <CardDescription>Products by stock level</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Stock level bars */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>In Stock</span>
                      <span className="font-medium text-green-600">
                        {report?.summary.in_stock_count ?? 0}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ 
                          width: `${((report?.summary.in_stock_count ?? 0) / (report?.summary.total_products || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Low Stock</span>
                      <span className="font-medium text-yellow-600">
                        {report?.summary.low_stock_count ?? 0}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full transition-all"
                        style={{ 
                          width: `${((report?.summary.low_stock_count ?? 0) / (report?.summary.total_products || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Critical Stock</span>
                      <span className="font-medium text-orange-600">
                        {report?.summary.critical_stock_count ?? 0}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ 
                          width: `${((report?.summary.critical_stock_count ?? 0) / (report?.summary.total_products || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Out of Stock</span>
                      <span className="font-medium text-red-600">
                        {report?.summary.out_of_stock_count ?? 0}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ 
                          width: `${((report?.summary.out_of_stock_count ?? 0) / (report?.summary.total_products || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Stock Alerts</CardTitle>
                  <CardDescription>
                    Products that need attention
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Alerts
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div
                      key={`${alert.product_id}-${alert.variant_id}`}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        alert.alert_level === 'out' && "bg-red-50 dark:bg-red-900/20",
                        alert.alert_level === 'critical' && "bg-orange-50 dark:bg-orange-900/20",
                        alert.alert_level === 'low' && "bg-yellow-50 dark:bg-yellow-900/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                          {alert.image_url ? (
                            <img 
                              src={alert.image_url}
                              alt={alert.product_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{alert.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.sku ? `SKU: ${alert.sku}` : 'No SKU'} • 
                            {alert.current_stock} in stock
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          alert.alert_level === 'out' ? 'destructive' :
                          alert.alert_level === 'critical' ? 'default' :
                          'secondary'
                        }>
                          {alert.alert_level === 'out' ? 'Out of Stock' :
                           alert.alert_level === 'critical' ? 'Critical' :
                           'Low Stock'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" />
                          Restock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-green-500 mb-2" />
                  <p className="font-medium">All stock levels healthy</p>
                  <p className="text-sm text-muted-foreground">
                    No products below threshold
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory History</CardTitle>
              <CardDescription>
                All stock movements and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryHistoryTable siteId={siteId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Valuation Tab */}
        <TabsContent value="valuation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Cost Value</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(valuation?.total_cost ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Retail Value</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(valuation?.total_value ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Potential Profit</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(valuation?.potential_profit ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* By Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Value by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {valuation?.by_category && valuation.by_category.length > 0 ? (
                <div className="space-y-3">
                  {valuation.by_category.map(cat => (
                    <div key={cat.category_id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{cat.category_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cat.quantity} units
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(cat.value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No category data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      {selectedProduct && (
        <StockAdjustmentDialog
          open={adjustmentDialogOpen}
          onOpenChange={setAdjustmentDialogOpen}
          siteId={siteId}
          product={selectedProduct}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}
