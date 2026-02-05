/**
 * Marketing View Component
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Main tabbed dashboard for all marketing features
 */
'use client'

import { useState } from 'react'
import { FlashSalesView } from './flash-sales-view'
import { GiftCardsView } from './gift-cards-view'
import { BundlesView } from './bundles-view'
import { LoyaltyView } from './loyalty-view'
import { useMarketingStats } from '../../hooks/use-marketing'
import { 
  Megaphone, 
  Zap, 
  Package, 
  Gift, 
  Star,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MarketingViewProps {
  siteId: string
  searchQuery?: string
}

export function MarketingView({ siteId, searchQuery = '' }: MarketingViewProps) {
  const [activeTab, setActiveTab] = useState('flash-sales')
  const { stats, isLoading: loadingStats } = useMarketingStats(siteId)

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Megaphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketing</h2>
          <p className="text-muted-foreground">
            Flash sales, bundles, gift cards, and loyalty programs
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      {stats && !loadingStats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('flash-sales')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flash Sales</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.flash_sales.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.flash_sales.active} active
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('bundles')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bundles</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bundles.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.bundles.active} active
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('gift-cards')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gift Cards</CardTitle>
              <Gift className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.gift_cards.outstanding_balance)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.gift_cards.active_cards} active cards
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('loyalty')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Program</CardTitle>
              <Star className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.loyalty.total_members}</div>
              <p className="text-xs text-muted-foreground">
                {stats.loyalty.total_points_issued.toLocaleString()} points issued
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="flash-sales" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Flash Sales</span>
          </TabsTrigger>
          <TabsTrigger value="bundles" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Bundles</span>
          </TabsTrigger>
          <TabsTrigger value="gift-cards" className="gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Gift Cards</span>
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Loyalty</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flash-sales" className="mt-6">
          <FlashSalesView siteId={siteId} searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="bundles" className="mt-6">
          <BundlesView siteId={siteId} searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="gift-cards" className="mt-6">
          <GiftCardsView siteId={siteId} searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="loyalty" className="mt-6">
          <LoyaltyView siteId={siteId} searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
