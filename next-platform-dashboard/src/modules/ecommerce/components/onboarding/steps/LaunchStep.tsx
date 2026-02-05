/**
 * LaunchStep Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard - Step 6 (Final)
 */

'use client';

import React from 'react';
import { 
  Rocket, 
  CheckCircle2, 
  Circle, 
  Store, 
  DollarSign, 
  Truck, 
  CreditCard, 
  Package,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepComponentProps } from '../../../types/onboarding-types';

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isComplete: boolean;
  link?: string;
}

export function LaunchStep({
  data,
}: StepComponentProps) {
  // Build checklist based on data
  const checklist: ChecklistItem[] = [
    {
      id: 'store-basics',
      label: 'Store basics configured',
      icon: <Store className="w-4 h-4" />,
      isComplete: Boolean(data.storeBasics?.storeName),
    },
    {
      id: 'currency',
      label: 'Currency & tax settings',
      icon: <DollarSign className="w-4 h-4" />,
      isComplete: Boolean(data.currencyTax?.currency),
    },
    {
      id: 'shipping',
      label: 'Shipping configuration',
      icon: <Truck className="w-4 h-4" />,
      isComplete: data.shipping?.shippingEnabled !== undefined,
    },
    {
      id: 'payments',
      label: 'Payment methods selected',
      icon: <CreditCard className="w-4 h-4" />,
      isComplete: (data.payments?.paymentProviders?.length || 0) > 0 || data.payments?.paymentsConfiguredLater === true,
    },
    {
      id: 'product',
      label: 'First product added',
      icon: <Package className="w-4 h-4" />,
      isComplete: Boolean(data.firstProduct?.name) || data.firstProduct?.skipped === true,
    },
  ];

  const completedCount = checklist.filter(item => item.isComplete).length;
  const completionPercentage = Math.round((completedCount / checklist.length) * 100);

  // Get currency symbol
  const currencySymbol = data.currencyTax?.currencySymbol || '$';

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ready to Launch! 🎉
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Review your setup and start selling
        </p>
      </div>

      {/* Completion Progress */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Setup Progress
          </span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {checklist.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg transition-colors',
              item.isComplete
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-gray-50 dark:bg-gray-800/50'
            )}
          >
            {item.isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            )}
            <span className={cn(
              'flex-1 text-sm',
              item.isComplete
                ? 'text-green-700 dark:text-green-300'
                : 'text-gray-500 dark:text-gray-400'
            )}>
              {item.label}
            </span>
            <span className="text-gray-400">{item.icon}</span>
          </div>
        ))}
      </div>

      {/* Configuration Summary */}
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Configuration Summary
        </h4>
        <div className="space-y-2 text-sm">
          {data.storeBasics?.storeName && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Store Name</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data.storeBasics.storeName}
              </span>
            </div>
          )}
          {data.currencyTax?.currency && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Currency</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data.currencyTax.currency} ({currencySymbol})
              </span>
            </div>
          )}
          {data.shipping?.shippingEnabled !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Shipping</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data.shipping.shippingEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          )}
          {(data.payments?.paymentProviders?.length || 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Payment Methods</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data.payments?.paymentProviders?.length} selected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          Recommended Next Steps
        </h4>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Configure payment provider API keys in Settings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Add more products to your catalog</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Set up shipping zones for accurate delivery rates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Customize your storefront appearance</span>
          </li>
        </ul>
      </div>

      {/* Launch Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Click <strong>&quot;Complete Setup&quot;</strong> to save your configuration and start selling!
      </div>
    </div>
  );
}
