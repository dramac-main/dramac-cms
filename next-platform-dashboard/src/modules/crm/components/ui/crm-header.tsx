/**
 * CRM Header Component
 * 
 * PHASE-UI-10A: CRM Module UI Overhaul
 * 
 * Enhanced header for the CRM module with time selectors, export actions,
 * and breadcrumb navigation.
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { 
  Calendar as CalendarIcon,
  Upload,
  RefreshCw,
  MoreHorizontal,
  Settings,
  FileSpreadsheet,
  FileJson,
  ChevronRight,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// =============================================================================
// TYPES
// =============================================================================

export type TimeRange = '24h' | '7d' | '30d' | '90d' | '365d' | 'custom'

export interface CRMHeaderProps {
  title: string
  description?: string
  entityCount?: number
  entityLabel?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  timeRange?: TimeRange
  onTimeRangeChange?: (range: TimeRange) => void
  customDateRange?: { from: Date; to: Date }
  onCustomDateRangeChange?: (range: { from: Date; to: Date }) => void
  onRefresh?: () => void
  onExport?: (format: 'csv' | 'json') => void
  onImport?: () => void
  onSettings?: () => void
  isRefreshing?: boolean
  showTimeSelector?: boolean
  showExportImport?: boolean
  children?: React.ReactNode
}

// =============================================================================
// TIME RANGE OPTIONS
// =============================================================================

const timeRangeOptions: Array<{ value: TimeRange; label: string }> = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '365d', label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
]

// =============================================================================
// BREADCRUMB COMPONENT
// =============================================================================

interface BreadcrumbProps {
  items: Array<{ label: string; href?: string }>
}

function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
      <Home className="h-3.5 w-3.5" />
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {item.href ? (
            <a 
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CRMHeader({
  title,
  description,
  entityCount,
  entityLabel = 'items',
  breadcrumbs,
  timeRange,
  onTimeRangeChange,
  customDateRange,
  onCustomDateRangeChange,
  onRefresh,
  onExport,
  onImport,
  onSettings,
  isRefreshing = false,
  showTimeSelector = true,
  showExportImport = true,
  children,
}: CRMHeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: customDateRange?.from,
    to: customDateRange?.to,
  })

  const handleTimeRangeChange = (value: TimeRange) => {
    if (value === 'custom') {
      setShowDatePicker(true)
    } else {
      onTimeRangeChange?.(value)
    }
  }

  const handleDateRangeSelect = () => {
    if (dateRange.from && dateRange.to) {
      onCustomDateRangeChange?.({ from: dateRange.from, to: dateRange.to })
      onTimeRangeChange?.('custom')
      setShowDatePicker(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb items={breadcrumbs} />
        )}

        {/* Main Header Row */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {entityCount !== undefined && (
                <Badge variant="secondary" className="font-normal">
                  {entityCount.toLocaleString()} {entityLabel}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            {showTimeSelector && onTimeRangeChange && (
              <div className="flex items-center gap-2">
                <Select 
                  value={timeRange || '30d'} 
                  onValueChange={(v) => handleTimeRangeChange(v as TimeRange)}
                >
                  <SelectTrigger className="w-40">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Custom Date Range Popover */}
                {timeRange === 'custom' && (
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        {dateRange.from && dateRange.to ? (
                          <>
                            {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                          </>
                        ) : (
                          'Pick dates'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <div className="p-4">
                        <Calendar
                          mode="range"
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                          numberOfMonths={2}
                        />
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowDatePicker(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleDateRangeSelect}
                            disabled={!dateRange.from || !dateRange.to}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}

            {/* Refresh Button */}
            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            )}

            {/* Export/Import Menu */}
            {showExportImport && (onExport || onImport) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onExport && (
                    <>
                      <DropdownMenuItem onClick={() => onExport('csv')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onExport('json')}>
                        <FileJson className="h-4 w-4 mr-2" />
                        Export as JSON
                      </DropdownMenuItem>
                    </>
                  )}
                  {onExport && onImport && <DropdownMenuSeparator />}
                  {onImport && (
                    <DropdownMenuItem onClick={onImport}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </DropdownMenuItem>
                  )}
                  {onSettings && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onSettings}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Custom Actions */}
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default CRMHeader
