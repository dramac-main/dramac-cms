"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { TimeRange } from "@/types/dashboard-widgets";

export interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  options?: TimeRange[];
  className?: string;
  size?: 'sm' | 'default';
  showIcon?: boolean;
}

const timeRangeLabels: Record<TimeRange, string> = {
  '24h': 'Last 24 Hours',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  'custom': 'Custom Range',
};

const timeRangeShortLabels: Record<TimeRange, string> = {
  '24h': '24h',
  '7d': '7d',
  '30d': '30d',
  '90d': '90d',
  'custom': 'Custom',
};

export function TimeRangeSelector({
  value,
  onChange,
  options = ['24h', '7d', '30d', '90d'],
  className,
  size = 'default',
  showIcon = true,
}: TimeRangeSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={cn("justify-between min-w-[120px]", className)}
        >
          <span className="flex items-center gap-2">
            {showIcon && <Calendar className="h-4 w-4 text-muted-foreground" />}
            <span>{timeRangeShortLabels[value]}</span>
          </span>
          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onChange(option)}
            className="flex items-center justify-between"
          >
            <span>{timeRangeLabels[option]}</span>
            {value === option && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Quick toggle buttons for time ranges
export interface TimeRangeButtonsProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  options?: TimeRange[];
  className?: string;
  size?: 'sm' | 'default';
}

export function TimeRangeButtons({
  value,
  onChange,
  options = ['24h', '7d', '30d', '90d'],
  className,
  size = 'sm',
}: TimeRangeButtonsProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      {options.map((option) => (
        <Button
          key={option}
          variant={value === option ? "secondary" : "ghost"}
          size={size}
          onClick={() => onChange(option)}
          className={cn(
            "px-3",
            value === option && "bg-background shadow-sm"
          )}
        >
          {timeRangeShortLabels[option]}
        </Button>
      ))}
    </div>
  );
}
