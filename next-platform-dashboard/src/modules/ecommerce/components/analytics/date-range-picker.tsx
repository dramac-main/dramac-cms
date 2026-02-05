'use client'

/**
 * Date Range Picker Component
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * Date range selector with presets and custom range support.
 */

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DateRangePreset, GroupByPeriod } from '../../types/analytics-types'
import { getPresetLabel, formatDateRange, getDateRangeFromPreset } from '../../lib/analytics-utils'

// ============================================================================
// DATE RANGE PICKER
// ============================================================================

interface DateRangePickerProps {
  preset: DateRangePreset
  startDate?: Date
  endDate?: Date
  onPresetChange: (preset: DateRangePreset) => void
  onCustomRangeChange: (start: string, end: string) => void
  className?: string
}

const presets: DateRangePreset[] = [
  'today',
  'yesterday',
  'last_7_days',
  'last_30_days',
  'last_90_days',
  'this_month',
  'last_month',
  'this_quarter',
  'last_quarter',
  'this_year',
  'last_year'
]

export function DateRangePicker({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onCustomRangeChange,
  className
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customStart, setCustomStart] = useState<Date | undefined>(startDate)
  const [customEnd, setCustomEnd] = useState<Date | undefined>(endDate)
  
  const currentRange = preset !== 'custom' 
    ? getDateRangeFromPreset(preset)
    : { start: startDate?.toISOString() || '', end: endDate?.toISOString() || '' }
  
  const displayText = preset !== 'custom'
    ? getPresetLabel(preset)
    : formatDateRange(currentRange)
  
  const handlePresetSelect = (value: string) => {
    if (value === 'custom') {
      // Don't close, show calendar
    } else {
      onPresetChange(value as DateRangePreset)
      setIsOpen(false)
    }
  }
  
  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onCustomRangeChange(
        customStart.toISOString(),
        customEnd.toISOString()
      )
      setIsOpen(false)
    }
  }
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal min-w-[200px]',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets list */}
          <div className="border-r p-2 space-y-1 min-w-[150px]">
            {presets.map((p) => (
              <Button
                key={p}
                variant={preset === p ? 'secondary' : 'ghost'}
                className="w-full justify-start text-sm"
                onClick={() => handlePresetSelect(p)}
              >
                {getPresetLabel(p)}
              </Button>
            ))}
            <div className="border-t my-2" />
            <Button
              variant={preset === 'custom' ? 'secondary' : 'ghost'}
              className="w-full justify-start text-sm"
              onClick={() => handlePresetSelect('custom')}
            >
              Custom Range
            </Button>
          </div>
          
          {/* Custom calendar */}
          {preset === 'custom' && (
            <div className="p-2">
              <div className="flex gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                  <Calendar
                    mode="single"
                    selected={customStart}
                    onSelect={setCustomStart}
                    initialFocus
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">End Date</p>
                  <Calendar
                    mode="single"
                    selected={customEnd}
                    onSelect={setCustomEnd}
                    disabled={(date) => customStart ? date < customStart : false}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// GROUP BY SELECTOR
// ============================================================================

interface GroupBySelectorProps {
  value: GroupByPeriod
  onChange: (value: GroupByPeriod) => void
  className?: string
}

const groupByOptions: { value: GroupByPeriod; label: string }[] = [
  { value: 'hour', label: 'Hourly' },
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' }
]

export function GroupBySelector({
  value,
  onChange,
  className
}: GroupBySelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as GroupByPeriod)}>
      <SelectTrigger className={cn('w-[130px]', className)}>
        <SelectValue placeholder="Group by" />
      </SelectTrigger>
      <SelectContent>
        {groupByOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ============================================================================
// ANALYTICS TOOLBAR
// ============================================================================

interface AnalyticsToolbarProps {
  preset: DateRangePreset
  groupBy: GroupByPeriod
  onPresetChange: (preset: DateRangePreset) => void
  onCustomRangeChange: (start: string, end: string) => void
  onGroupByChange: (groupBy: GroupByPeriod) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

export function AnalyticsToolbar({
  preset,
  groupBy,
  onPresetChange,
  onCustomRangeChange,
  onGroupByChange,
  onRefresh,
  isRefreshing,
  className
}: AnalyticsToolbarProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <DateRangePicker
        preset={preset}
        onPresetChange={onPresetChange}
        onCustomRangeChange={onCustomRangeChange}
      />
      <GroupBySelector
        value={groupBy}
        onChange={onGroupByChange}
      />
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// EXPORT
// ============================================================================

export {
  type DateRangePickerProps,
  type GroupBySelectorProps,
  type AnalyticsToolbarProps
}
