/**
 * Countdown Timer Widget
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Displays countdown to flash sale end time.
 */
'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  endTime: string | Date
  onComplete?: () => void
  className?: string
  variant?: 'default' | 'compact' | 'large'
  showLabels?: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calculateTimeLeft(endTime: Date): TimeLeft {
  const total = endTime.getTime() - Date.now()
  
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }
  
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    total
  }
}

interface TimeUnitProps {
  value: number
  label: string
  showLabel: boolean
  variant: 'default' | 'compact' | 'large'
}

function TimeUnit({ value, label, showLabel, variant }: TimeUnitProps) {
  const sizeClasses = {
    default: 'w-14 h-14',
    compact: 'w-10 h-10',
    large: 'w-20 h-20'
  }
  
  const textClasses = {
    default: 'text-xl',
    compact: 'text-sm',
    large: 'text-3xl'
  }
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className={cn(
          'flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono font-bold',
          sizeClasses[variant],
          textClasses[variant]
        )}
      >
        {String(value).padStart(2, '0')}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground mt-1">{label}</span>
      )}
    </div>
  )
}

export function CountdownTimer({ 
  endTime, 
  onComplete,
  className,
  variant = 'default',
  showLabels = true
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => 
    calculateTimeLeft(new Date(endTime))
  )
  
  useEffect(() => {
    const end = new Date(endTime)
    
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(end)
      setTimeLeft(newTimeLeft)
      
      if (newTimeLeft.total <= 0) {
        clearInterval(timer)
        onComplete?.()
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [endTime, onComplete])
  
  if (timeLeft.total <= 0) {
    return (
      <div className={cn('text-center text-destructive font-semibold', className)}>
        Sale Ended
      </div>
    )
  }
  
  const separatorClasses = {
    default: 'text-xl',
    compact: 'text-sm',
    large: 'text-3xl'
  }
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {timeLeft.days > 0 && (
        <>
          <TimeUnit 
            value={timeLeft.days} 
            label="Days" 
            showLabel={showLabels}
            variant={variant}
          />
          <span className={cn('font-bold text-muted-foreground', separatorClasses[variant])}>:</span>
        </>
      )}
      <TimeUnit 
        value={timeLeft.hours} 
        label="Hours" 
        showLabel={showLabels}
        variant={variant}
      />
      <span className={cn('font-bold text-muted-foreground', separatorClasses[variant])}>:</span>
      <TimeUnit 
        value={timeLeft.minutes} 
        label="Mins" 
        showLabel={showLabels}
        variant={variant}
      />
      <span className={cn('font-bold text-muted-foreground', separatorClasses[variant])}>:</span>
      <TimeUnit 
        value={timeLeft.seconds} 
        label="Secs" 
        showLabel={showLabels}
        variant={variant}
      />
    </div>
  )
}

export default CountdownTimer
