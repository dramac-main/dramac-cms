"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Minus,
  LucideIcon 
} from "lucide-react";

export interface StatCardWidgetProps {
  title: string;
  value: number | string;
  previousValue?: number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percentage' | 'compact';
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  description?: string;
  loading?: boolean;
  animated?: boolean;
  sparkline?: number[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'bordered';
}

const formatValue = (
  value: number | string,
  format?: StatCardWidgetProps['format'],
  prefix?: string,
  suffix?: string
): string => {
  if (typeof value === 'string') return `${prefix || ''}${value}${suffix || ''}`;
  
  let formatted: string;
  
  switch (format) {
    case 'currency':
      formatted = new Intl.NumberFormat(DEFAULT_LOCALE, {
        style: 'currency',
        currency: DEFAULT_CURRENCY,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
      break;
    case 'percentage':
      formatted = `${value.toFixed(1)}%`;
      break;
    case 'compact':
      formatted = new Intl.NumberFormat(DEFAULT_LOCALE, {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(value);
      break;
    case 'number':
    default:
      formatted = new Intl.NumberFormat(DEFAULT_LOCALE).format(value);
  }
  
  return `${prefix || ''}${formatted}${suffix || ''}`;
};

const TrendIndicator = ({ 
  direction, 
  value, 
  label,
  size = 'md' 
}: { 
  direction: 'up' | 'down' | 'neutral'; 
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };
  
  const colorClasses = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-muted-foreground',
  };
  
  const bgClasses = {
    up: 'bg-emerald-100 dark:bg-emerald-900/30',
    down: 'bg-rose-100 dark:bg-rose-900/30',
    neutral: 'bg-muted',
  };
  
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-0.5 rounded-full w-fit",
      bgClasses[direction]
    )}>
      <Icon className={cn(iconSizes[size], colorClasses[direction])} />
      <span className={cn(sizeClasses[size], "font-medium", colorClasses[direction])}>
        {Math.abs(value).toFixed(1)}%
      </span>
      {label && (
        <span className={cn(sizeClasses[size], "text-muted-foreground")}>
          {label}
        </span>
      )}
    </div>
  );
};

// Mini sparkline component
const MiniSparkline = ({ data, className }: { data: number[]; className?: string }) => {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 80;
  const stepX = width / (data.length - 1);
  
  const points = data.map((value, index) => ({
    x: index * stepX,
    y: height - ((value - min) / range) * height,
  }));
  
  const pathD = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  
  // Determine if trending up or down
  const isUp = data[data.length - 1] > data[0];
  const strokeColor = isUp ? '#10b981' : '#f43f5e';
  
  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={cn("overflow-visible", className)}
      style={{ width, height }}
    >
      <defs>
        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <path
        d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#sparklineGradient)"
      />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={strokeColor}
      />
    </svg>
  );
};

export function StatCardWidget({
  title,
  value,
  trend,
  prefix,
  suffix,
  format = 'number',
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  description,
  animated = true,
  sparkline,
  className,
  size = 'md',
  variant = 'default',
}: StatCardWidgetProps) {
  const formattedValue = formatValue(value, format, prefix, suffix);
  
  const sizeClasses = {
    sm: {
      value: 'text-xl font-bold',
      title: 'text-xs',
      icon: 'h-4 w-4',
      iconContainer: 'p-1.5',
    },
    md: {
      value: 'text-2xl font-bold',
      title: 'text-sm',
      icon: 'h-5 w-5',
      iconContainer: 'p-2',
    },
    lg: {
      value: 'text-3xl font-bold',
      title: 'text-base',
      icon: 'h-6 w-6',
      iconContainer: 'p-2.5',
    },
  };
  
  const variantClasses = {
    default: '',
    gradient: 'bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4',
    bordered: 'border-l-4 border-l-primary pl-4',
  };
  
  return (
    <div className={cn("flex flex-col gap-3", variantClasses[variant], className)}>
      {/* Header with title and icon */}
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-muted-foreground font-medium",
          sizeClasses[size].title
        )}>
          {title}
        </span>
        {Icon && (
          <div className={cn("rounded-lg", iconBg, sizeClasses[size].iconContainer)}>
            <Icon className={cn(sizeClasses[size].icon, iconColor)} />
          </div>
        )}
      </div>
      
      {/* Value */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          {animated ? (
            <motion.span
              className={sizeClasses[size].value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {formattedValue}
            </motion.span>
          ) : (
            <span className={sizeClasses[size].value}>{formattedValue}</span>
          )}
          
          {/* Trend indicator */}
          {trend && (
            <TrendIndicator
              direction={trend.direction}
              value={trend.value}
              label={trend.label}
              size={size}
            />
          )}
          
          {/* Description */}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        
        {/* Sparkline */}
        {sparkline && sparkline.length > 0 && (
          <MiniSparkline data={sparkline} />
        )}
      </div>
    </div>
  );
}

// Export TrendIndicator and MiniSparkline for use elsewhere
export { TrendIndicator, MiniSparkline };
