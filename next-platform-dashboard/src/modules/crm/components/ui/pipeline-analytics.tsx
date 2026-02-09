/**
 * Pipeline Analytics Component
 * 
 * PHASE-UI-10B: CRM Pipeline & Deals View
 * 
 * Analytics widgets for pipeline conversion rates, velocity metrics,
 * and revenue forecasting.
 */
'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Clock,
  DollarSign,
  ArrowRight,
  Zap,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Deal, Pipeline, PipelineStage } from '../../types/crm-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

export interface PipelineAnalyticsProps {
  pipeline: Pipeline
  deals: Deal[]
  previousPeriodDeals?: Deal[]
  className?: string
}

interface StageMetrics {
  stage: PipelineStage
  dealCount: number
  totalValue: number
  weightedValue: number
  avgDaysInStage: number
  conversionRate: number
}

interface FunnelMetrics {
  stages: StageMetrics[]
  overallConversion: number
  avgCycleLength: number
  velocity: number
  forecast: {
    weighted: number
    bestCase: number
    worstCase: number
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: amount >= 1000000 ? 'compact' : 'standard',
  }).format(amount)
}

function formatDays(days: number): string {
  if (days < 1) return '< 1 day'
  if (days === 1) return '1 day'
  return `${Math.round(days)} days`
}

function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

function calculateMetrics(pipeline: Pipeline, deals: Deal[]): FunnelMetrics {
  const stages = pipeline.stages || []
  const openStages = stages.filter(s => s.stage_type === 'open')
  const wonStage = stages.find(s => s.stage_type === 'won')
  const lostStage = stages.find(s => s.stage_type === 'lost')
  
  const openDeals = deals.filter(d => d.status === 'open')
  const wonDeals = deals.filter(d => d.status === 'won')
  const lostDeals = deals.filter(d => d.status === 'lost')
  const closedDeals = [...wonDeals, ...lostDeals]
  
  // Stage metrics
  const stageMetrics: StageMetrics[] = openStages.map(stage => {
    const stageDeals = openDeals.filter(d => d.stage_id === stage.id)
    const totalValue = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    const weightedValue = stageDeals.reduce((sum, d) => sum + (d.weighted_value || 0), 0)
    
    // Calculate average days in stage (mock calculation)
    const avgDaysInStage = stageDeals.length > 0 
      ? stageDeals.reduce((sum, d) => {
          const created = new Date(d.created_at)
          const now = new Date()
          return sum + Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        }, 0) / stageDeals.length
      : 0
    
    // Conversion rate (percentage that moved to next stage)
    const conversionRate = stage.probability || 0
    
    return {
      stage,
      dealCount: stageDeals.length,
      totalValue,
      weightedValue,
      avgDaysInStage,
      conversionRate,
    }
  })
  
  // Overall metrics
  const totalDeals = deals.length
  const overallConversion = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0
  
  // Average cycle length (days from created to closed)
  const avgCycleLength = closedDeals.length > 0
    ? closedDeals.reduce((sum, d) => {
        const created = new Date(d.created_at)
        const closed = d.actual_close_date ? new Date(d.actual_close_date) : new Date()
        return sum + Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      }, 0) / closedDeals.length
    : 0
  
  // Velocity (deals closed per month)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentClosedDeals = closedDeals.filter(d => 
    d.actual_close_date && new Date(d.actual_close_date) >= thirtyDaysAgo
  )
  const velocity = recentClosedDeals.length
  
  // Forecast
  const totalWeightedValue = stageMetrics.reduce((sum, m) => sum + m.weightedValue, 0)
  const totalOpenValue = stageMetrics.reduce((sum, m) => sum + m.totalValue, 0)
  
  return {
    stages: stageMetrics,
    overallConversion,
    avgCycleLength,
    velocity,
    forecast: {
      weighted: totalWeightedValue,
      bestCase: totalOpenValue,
      worstCase: totalWeightedValue * 0.5,
    },
  }
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ConversionFunnel({ metrics }: { metrics: FunnelMetrics }) {
  const maxValue = Math.max(...metrics.stages.map(s => s.totalValue), 1)
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Conversion Funnel
        </CardTitle>
        <CardDescription>Pipeline value by stage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.stages.map((stageMetric, index) => (
          <div key={stageMetric.stage.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: stageMetric.stage.color }}
                />
                <span>{stageMetric.stage.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {stageMetric.dealCount}
                </Badge>
              </div>
              <span className="font-medium">{formatCurrency(stageMetric.totalValue)}</span>
            </div>
            <div className="relative">
              <Progress 
                value={(stageMetric.totalValue / maxValue) * 100} 
                className="h-2"
              />
              {index < metrics.stages.length - 1 && (
                <div className="absolute -right-2 top-1/2 -translate-y-1/2">
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stageMetric.stage.probability}% probability</span>
              <span>{formatDays(stageMetric.avgDaysInStage)} avg</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function VelocityMetrics({ metrics }: { metrics: FunnelMetrics }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Pipeline Velocity
        </CardTitle>
        <CardDescription>Speed of deal progression</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock className="h-3 w-3" />
              Avg. Cycle Length
            </div>
            <p className="text-2xl font-bold">{formatDays(metrics.avgCycleLength)}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Zap className="h-3 w-3" />
              Deals/Month
            </div>
            <p className="text-2xl font-bold">{metrics.velocity}</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Target className="h-3 w-3" />
            Win Rate
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{formatPercentage(metrics.overallConversion)}</p>
            <Badge 
              variant={metrics.overallConversion >= 20 ? "success" : "secondary"}
              className={cn(
                metrics.overallConversion >= 20 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                  : ""
              )}
            >
              {metrics.overallConversion >= 20 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {metrics.overallConversion >= 20 ? "Healthy" : "Needs attention"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ForecastWidget({ metrics }: { metrics: FunnelMetrics }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Revenue Forecast
        </CardTitle>
        <CardDescription>Projected pipeline revenue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Weighted Forecast</span>
                    <span className="font-bold text-primary">{formatCurrency(metrics.forecast.weighted)}</span>
                  </div>
                  <Progress value={70} className="h-2 bg-primary/20" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Expected value based on stage probabilities</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Best Case</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(metrics.forecast.bestCase)}</span>
                  </div>
                  <Progress 
                    value={100} 
                    className="h-2"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>If all deals close successfully</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Conservative</span>
                    <span className="font-medium text-amber-600">{formatCurrency(metrics.forecast.worstCase)}</span>
                  </div>
                  <Progress 
                    value={35} 
                    className="h-2"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Conservative estimate (50% of weighted)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  )
}

function StageBreakdown({ metrics }: { metrics: FunnelMetrics }) {
  const totalDeals = metrics.stages.reduce((sum, s) => sum + s.dealCount, 0)
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          Stage Breakdown
        </CardTitle>
        <CardDescription>Deal distribution across stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {metrics.stages.map((stageMetric) => {
            const percentage = totalDeals > 0 
              ? (stageMetric.dealCount / totalDeals) * 100 
              : 0
              
            return (
              <div key={stageMetric.stage.id} className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: stageMetric.stage.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{stageMetric.stage.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {stageMetric.dealCount} ({formatPercentage(percentage)})
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-1.5 mt-1"
                    style={{ 
                      backgroundColor: `${stageMetric.stage.color}20`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PipelineAnalytics({
  pipeline,
  deals,
  previousPeriodDeals,
  className,
}: PipelineAnalyticsProps) {
  const metrics = useMemo(() => calculateMetrics(pipeline, deals), [pipeline, deals])
  
  const previousMetrics = useMemo(() => {
    if (!previousPeriodDeals) return null
    return calculateMetrics(pipeline, previousPeriodDeals)
  }, [pipeline, previousPeriodDeals])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}
    >
      <ConversionFunnel metrics={metrics} />
      <VelocityMetrics metrics={metrics} />
      <ForecastWidget metrics={metrics} />
      <StageBreakdown metrics={metrics} />
    </motion.div>
  )
}

export default PipelineAnalytics
