'use client'

/**
 * Composer Scheduling Panel Component
 * 
 * Phase UI-11B: Visual scheduling panel with time picker,
 * best time suggestions, and timezone selector
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ChevronDown,
  Globe,
  TrendingUp,
  Sun,
  Moon,
} from 'lucide-react'
import { format, addDays, setHours, setMinutes, isToday, isBefore } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ============================================================================
// TYPES
// ============================================================================

interface SuggestedTime {
  time: string // HH:mm format
  engagement: number // 0-100 score
  label?: string
}

interface ComposerSchedulingPanelProps {
  scheduledAt?: Date
  timezone: string
  onSchedule: (date: Date) => void
  onTimezoneChange: (tz: string) => void
  suggestedTimes?: SuggestedTime[]
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = (i % 2) * 30
  return {
    value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    label: formatTime(hour, minute),
  }
})

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}

// Default suggested times (would come from API in real app)
const DEFAULT_SUGGESTED_TIMES: SuggestedTime[] = [
  { time: '09:00', engagement: 85, label: 'Morning Peak' },
  { time: '12:00', engagement: 78, label: 'Lunch Break' },
  { time: '17:00', engagement: 92, label: 'Evening Peak' },
  { time: '20:00', engagement: 75, label: 'Night Activity' },
]

// ============================================================================
// HELPERS
// ============================================================================

function getTimeIcon(hour: number) {
  if (hour >= 6 && hour < 12) return Sun
  if (hour >= 12 && hour < 18) return Sun
  return Moon
}

function getEngagementColor(score: number): string {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-yellow-500'
  return 'text-orange-500'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ComposerSchedulingPanel({
  scheduledAt,
  timezone,
  onSchedule,
  onTimezoneChange,
  suggestedTimes = DEFAULT_SUGGESTED_TIMES,
  className,
}: ComposerSchedulingPanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(scheduledAt)
  const [selectedTime, setSelectedTime] = useState<string>(
    scheduledAt ? format(scheduledAt, 'HH:mm') : '12:00'
  )
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Quick schedule buttons
  const quickSchedules = useMemo(() => [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'Next Week', date: addDays(new Date(), 7) },
  ], [])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const scheduledDate = setMinutes(setHours(date, hours), minutes)
      onSchedule(scheduledDate)
    }
    setIsCalendarOpen(false)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number)
      const scheduledDate = setMinutes(setHours(selectedDate, hours), minutes)
      onSchedule(scheduledDate)
    }
  }

  const handleSuggestedTimeClick = (suggestedTime: SuggestedTime) => {
    const date = selectedDate || new Date()
    const [hours, minutes] = suggestedTime.time.split(':').map(Number)
    let scheduledDate = setMinutes(setHours(date, hours), minutes)
    
    // If the suggested time is in the past today, schedule for tomorrow
    if (isToday(date) && isBefore(scheduledDate, new Date())) {
      scheduledDate = addDays(scheduledDate, 1)
      setSelectedDate(scheduledDate)
    }
    
    setSelectedTime(suggestedTime.time)
    onSchedule(scheduledDate)
  }

  const handleQuickSchedule = (quickDate: Date) => {
    setSelectedDate(quickDate)
    const [hours, minutes] = selectedTime.split(':').map(Number)
    const scheduledDate = setMinutes(setHours(quickDate, hours), minutes)
    onSchedule(scheduledDate)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Suggested times */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Best Times to Post</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {suggestedTimes.map((suggestion, idx) => {
            const [hour] = suggestion.time.split(':').map(Number)
            const TimeIcon = getTimeIcon(hour)
            
            return (
              <motion.button
                key={suggestion.time}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg border',
                  'hover:bg-accent/50 hover:border-primary/30 transition-colors',
                  selectedTime === suggestion.time && 'border-primary bg-primary/10'
                )}
                onClick={() => handleSuggestedTimeClick(suggestion)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TimeIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">
                    {formatTime(hour, parseInt(suggestion.time.split(':')[1]))}
                  </p>
                  {suggestion.label && (
                    <p className="text-xs text-muted-foreground">{suggestion.label}</p>
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <TrendingUp className={cn('h-3 w-3', getEngagementColor(suggestion.engagement))} />
                      <span className={cn('text-xs font-medium', getEngagementColor(suggestion.engagement))}>
                        {suggestion.engagement}%
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Expected engagement score</TooltipContent>
                </Tooltip>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Quick schedule buttons */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Quick Schedule</p>
        <div className="flex gap-2">
          {quickSchedules.map((quick) => (
            <Button
              key={quick.label}
              variant={
                selectedDate && 
                format(selectedDate, 'yyyy-MM-dd') === format(quick.date, 'yyyy-MM-dd')
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              onClick={() => handleQuickSchedule(quick.date)}
            >
              {quick.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Date and time pickers */}
      <div className="grid grid-cols-2 gap-3">
        {/* Date picker */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Date</label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, 'MMM d, yyyy')
                ) : (
                  <span className="text-muted-foreground">Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                disabled={(date) => isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)))}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time picker */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Time</label>
          <Select value={selectedTime} onValueChange={handleTimeSelect}>
            <SelectTrigger>
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="h-[300px]">
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timezone selector */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Timezone</label>
        <Select value={timezone} onValueChange={onTimezoneChange}>
          <SelectTrigger>
            <Globe className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scheduled summary */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Scheduled for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      at {formatTime(
                        parseInt(selectedTime.split(':')[0]), 
                        parseInt(selectedTime.split(':')[1])
                      )} ({timezone.split('/')[1]?.replace('_', ' ') || timezone})
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEE')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
