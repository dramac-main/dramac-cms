/**
 * Switch Component
 * 
 * A properly styled toggle switch for the onboarding wizard.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'purple';
  className?: string;
  'aria-label'?: string;
}

const sizeClasses = {
  sm: {
    track: 'w-9 h-5',
    thumb: 'w-3.5 h-3.5',
    translate: 'translate-x-4',
    offset: 'left-0.5',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-4 h-4',
    translate: 'translate-x-5',
    offset: 'left-1',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-5 h-5',
    translate: 'translate-x-7',
    offset: 'left-1',
  },
};

const colorClasses = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-600',
};

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'md',
  color = 'blue',
  className,
  'aria-label': ariaLabel,
}: SwitchProps) {
  const sizes = sizeClasses[size];
  const activeColor = colorClasses[color];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        sizes.track,
        checked ? activeColor : 'bg-gray-200 dark:bg-gray-700',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
          'absolute top-1/2 -translate-y-1/2',
          sizes.thumb,
          sizes.offset,
          checked && sizes.translate
        )}
      />
    </button>
  );
}

export default Switch;
