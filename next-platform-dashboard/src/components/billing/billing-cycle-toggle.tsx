/**
 * Billing Cycle Toggle Component
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * Toggle between monthly and yearly billing cycles on the pricing page.
 * Shows annual savings badge.
 * 
 * @see phases/enterprise-modules/PHASE-EM-59B-PADDLE-BILLING.md
 */

'use client';

import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface BillingCycleToggleProps {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
  savingsPercent?: number;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function BillingCycleToggle({ 
  value, 
  onChange, 
  savingsPercent = 17,
  className 
}: BillingCycleToggleProps) {
  return (
    <div className={cn("flex items-center justify-center gap-4 mb-8", className)}>
      <button
        className={cn(
          'px-4 py-2 rounded-lg transition-colors font-medium',
          value === 'monthly' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted hover:bg-muted/80'
        )}
        onClick={() => onChange('monthly')}
      >
        Monthly
      </button>
      <button
        className={cn(
          'px-4 py-2 rounded-lg transition-colors relative font-medium',
          value === 'yearly' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted hover:bg-muted/80'
        )}
        onClick={() => onChange('yearly')}
      >
        Yearly
        {savingsPercent > 0 && (
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            -{savingsPercent}%
          </span>
        )}
      </button>
    </div>
  );
}
