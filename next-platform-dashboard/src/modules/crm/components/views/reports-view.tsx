/**
 * Reports View
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * CRM analytics and reporting dashboard
 */
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useCRM } from '../../context/crm-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Deal, Contact, Company, Activity as CRMActivity } from '../../types/crm-types'

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: {
    value: number
    positive: boolean
  }
  className?: string
}

function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center text-xs",
              trend.positive ? "text-green-500" : "text-red-500"
            )}>
              {trend.positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SIMPLE BAR CHART COMPONENT
// ============================================================================

interface BarChartData {
  label: string
  value: number
  color?: string
}

function SimpleBarChart({ data, maxValue }: { data: BarChartData[], maxValue?: number }) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="text-muted-foreground">{item.value}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all",
                item.color || "bg-primary"
              )}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// PIPELINE FUNNEL
// ============================================================================

interface PipelineFunnelProps {
  stages: Array<{ name: string; count: number; value: number }>
}

function PipelineFunnel({ stages }: PipelineFunnelProps) {
  const maxCount = Math.max(...stages.map(s => s.count), 1)
  
  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const width = Math.max(((stages.length - i) / stages.length) * 100, 40)
        return (
          <div 
            key={stage.name}
            className="relative"
            style={{ 
              width: `${width}%`,
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            <div className="bg-primary/20 rounded-lg p-3 text-center border border-primary/30">
              <div className="font-medium text-sm">{stage.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stage.count} deals • {formatCurrency(stage.value)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// ACTIVITY BREAKDOWN
// ============================================================================

interface ActivityBreakdownProps {
  activities: CRMActivity[]
}

function ActivityBreakdown({ activities }: ActivityBreakdownProps) {
  const breakdown = useMemo(() => {
    const counts = {
      call: 0,
      email: 0,
      meeting: 0,
      task: 0,
      note: 0,
      sms: 0,
      chat: 0
    }
    
    activities.forEach(a => {
      counts[a.activity_type]++
    })
    
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1) + 's',
        value: count,
        color: {
          call: 'bg-blue-500',
          email: 'bg-purple-500',
          meeting: 'bg-orange-500',
          task: 'bg-green-500',
          note: 'bg-gray-500',
          sms: 'bg-pink-500',
          chat: 'bg-cyan-500'
        }[type]
      }))
  }, [activities])

  return <SimpleBarChart data={breakdown} />
}

// ============================================================================
// RECENT DEALS TABLE
// ============================================================================

interface RecentDealsProps {
  deals: Deal[]
}

function RecentDeals({ deals }: RecentDealsProps) {
  const recentDeals = useMemo(() => {
    return [...deals]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
  }, [deals])

  return (
    <div className="space-y-4">
      {recentDeals.map(deal => (
        <div key={deal.id} className="flex items-center justify-between">
          <div>
            <div className="font-medium">{deal.name}</div>
            <div className="text-sm text-muted-foreground">
              {deal.company?.name || deal.contact?.email || 'No contact'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(deal.amount || 0)}</div>
            <Badge variant={
              deal.status === 'won' ? 'default' :
              deal.status === 'lost' ? 'destructive' :
              'secondary'
            }>
              {deal.status}
            </Badge>
          </div>
        </div>
      ))}
      
      {recentDeals.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          No deals yet
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReportsView() {
  const { deals, contacts, companies, activities, pipelines, isLoading } = useCRM()
  
  // State
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all')

  // Calculate date filter
  const dateFilter = useMemo(() => {
    const now = new Date()
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return startDate
  }, [dateRange])

  // Filtered data
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const createdAt = new Date(deal.created_at)
      if (createdAt < dateFilter) return false
      if (selectedPipeline !== 'all' && deal.pipeline_id !== selectedPipeline) return false
      return true
    })
  }, [deals, dateFilter, selectedPipeline])

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalDeals = filteredDeals.length
    const totalValue = filteredDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    const wonDeals = filteredDeals.filter(d => d.status === 'won')
    const lostDeals = filteredDeals.filter(d => d.status === 'lost')
    const openDeals = filteredDeals.filter(d => d.status === 'open')
    
    const wonValue = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    const lostValue = lostDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    const openValue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    
    const winRate = totalDeals > 0 
      ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100 || 0
      : 0
    
    const avgDealValue = totalDeals > 0 ? totalValue / totalDeals : 0
    
    // Calculate weighted pipeline value
    const weightedValue = openDeals.reduce((sum, d) => sum + ((d.amount || 0) * d.probability / 100), 0)
    
    // Activity metrics
    const periodActivities = activities.filter(a => new Date(a.created_at) >= dateFilter)
    const completedTasks = periodActivities.filter(a => a.activity_type === 'task' && a.task_completed)
    
    return {
      totalDeals,
      totalValue,
      wonValue,
      lostValue,
      openValue,
      openDeals: openDeals.length,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
      winRate,
      avgDealValue,
      weightedValue,
      totalActivities: periodActivities.length,
      completedTasks: completedTasks.length,
      newContacts: contacts.filter(c => new Date(c.created_at) >= dateFilter).length,
      newCompanies: companies.filter(c => new Date(c.created_at) >= dateFilter).length
    }
  }, [filteredDeals, activities, contacts, companies, dateFilter])

  // Pipeline stage breakdown
  const stageBreakdown = useMemo(() => {
    const stages = new Map<string, { name: string; count: number; value: number; position: number }>()
    
    filteredDeals.filter(d => d.status === 'open').forEach(deal => {
      if (deal.stage) {
        const key = deal.stage.id
        if (!stages.has(key)) {
          stages.set(key, {
            name: deal.stage.name,
            count: 0,
            value: 0,
            position: deal.stage.position
          })
        }
        const stage = stages.get(key)!
        stage.count++
        stage.value += (deal.amount || 0)
      }
    })
    
    return Array.from(stages.values()).sort((a, b) => a.position - b.position)
  }, [filteredDeals])

  // Lead source breakdown
  const sourceBreakdown = useMemo(() => {
    const sources = new Map<string, number>()
    
    contacts.filter(c => new Date(c.created_at) >= dateFilter).forEach(contact => {
      const source = contact.source || 'Unknown'
      sources.set(source, (sources.get(source) || 0) + 1)
    })
    
    return Array.from(sources.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }))
  }, [contacts, dateFilter])

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">Track your CRM performance</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Pipeline filter */}
          <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Pipeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pipelines</SelectItem>
              {pipelines.map(pipeline => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Date range */}
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(metrics.wonValue)}
          description={`${metrics.wonDeals} deals won`}
          icon={DollarSign}
          trend={{ value: 12.5, positive: true }}
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(metrics.openValue)}
          description={`${metrics.openDeals} open deals`}
          icon={TrendingUp}
        />
        <StatCard
          title="Win Rate"
          value={formatPercent(metrics.winRate)}
          description="Closed deals"
          icon={Target}
          trend={{ value: 2.3, positive: true }}
        />
        <StatCard
          title="Avg Deal Value"
          value={formatCurrency(metrics.avgDealValue)}
          description="All deals"
          icon={BarChart3}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="New Contacts"
          value={metrics.newContacts}
          icon={Users}
          className="bg-blue-50/50 dark:bg-blue-950/20"
        />
        <StatCard
          title="New Companies"
          value={metrics.newCompanies}
          icon={Building2}
          className="bg-purple-50/50 dark:bg-purple-950/20"
        />
        <StatCard
          title="Activities Logged"
          value={metrics.totalActivities}
          icon={Activity}
          className="bg-green-50/50 dark:bg-green-950/20"
        />
        <StatCard
          title="Tasks Completed"
          value={metrics.completedTasks}
          icon={CheckCircle2}
          className="bg-orange-50/50 dark:bg-orange-950/20"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Pipeline Funnel
            </CardTitle>
            <CardDescription>Deals by stage</CardDescription>
          </CardHeader>
          <CardContent>
            {stageBreakdown.length > 0 ? (
              <PipelineFunnel stages={stageBreakdown} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No open deals in pipeline
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Deal Outcomes
            </CardTitle>
            <CardDescription>Won vs Lost deals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Won Deals</div>
                    <div className="text-sm text-muted-foreground">{metrics.wonDeals} deals</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">{formatCurrency(metrics.wonValue)}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium">Lost Deals</div>
                    <div className="text-sm text-muted-foreground">{metrics.lostDeals} deals</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-red-600">{formatCurrency(metrics.lostValue)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Open Deals</div>
                    <div className="text-sm text-muted-foreground">{metrics.openDeals} deals</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">{formatCurrency(metrics.openValue)}</div>
                  <div className="text-xs text-muted-foreground">
                    Weighted: {formatCurrency(metrics.weightedValue)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lead Sources
            </CardTitle>
            <CardDescription>Where contacts come from</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceBreakdown.length > 0 ? (
              <SimpleBarChart data={sourceBreakdown} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No lead source data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Breakdown
            </CardTitle>
            <CardDescription>Activities by type</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <ActivityBreakdown activities={activities.filter(a => new Date(a.created_at) >= dateFilter)} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activities logged
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Deals
            </CardTitle>
            <CardDescription>Latest deal activity</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentDeals deals={filteredDeals} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ReportsView
