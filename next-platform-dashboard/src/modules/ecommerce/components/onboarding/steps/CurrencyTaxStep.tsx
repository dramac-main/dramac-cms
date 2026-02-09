/**
 * CurrencyTaxStep Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard - Step 2
 */

'use client';

import React from 'react';
import { DollarSign, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepComponentProps } from '../../../types/onboarding-types';
import { AVAILABLE_CURRENCIES } from '../../../types/onboarding-types';
import { Switch } from '../ui/Switch';

import { DEFAULT_CURRENCY } from '@/lib/locale-config'
export function CurrencyTaxStep({
  data,
  onDataChange,
}: StepComponentProps) {
  const currencyTax = data.currencyTax || {
    currency: DEFAULT_CURRENCY,
    currencySymbol: '$',
    currencyPosition: 'before' as const,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    taxEnabled: false,
    taxRate: 0,
    taxIncludedInPrice: false,
  };

  const handleChange = <K extends keyof typeof currencyTax>(
    field: K,
    value: (typeof currencyTax)[K]
  ) => {
    const updates: Partial<typeof currencyTax> = { [field]: value };
    
    // Auto-update symbol when currency changes
    if (field === 'currency') {
      const currency = AVAILABLE_CURRENCIES.find(c => c.code === value);
      if (currency) {
        updates.currencySymbol = currency.symbol;
      }
    }
    
    onDataChange({
      currencyTax: {
        ...currencyTax,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Currency & Tax Settings
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Choose how prices are displayed in your store
        </p>
      </div>

      {/* Currency Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Store Currency
        </label>
        <select
          value={currencyTax.currency}
          onChange={(e) => handleChange('currency', e.target.value)}
          className={cn(
            'w-full px-4 py-3 border rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
            'text-gray-900 dark:text-white'
          )}
        >
          {AVAILABLE_CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} - {currency.name} ({currency.code})
            </option>
          ))}
        </select>
      </div>

      {/* Currency Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Currency Symbol Position
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleChange('currencyPosition', 'before')}
            className={cn(
              'px-4 py-3 border rounded-lg transition-colors text-center',
              currencyTax.currencyPosition === 'before'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <span className="font-medium text-gray-900 dark:text-white">{currencyTax.currencySymbol}99.00</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">Before price</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('currencyPosition', 'after')}
            className={cn(
              'px-4 py-3 border rounded-lg transition-colors text-center',
              currencyTax.currencyPosition === 'after'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <span className="font-medium text-gray-900 dark:text-white">99.00{currencyTax.currencySymbol}</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">After price</span>
          </button>
        </div>
      </div>

      {/* Tax Toggle */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable Tax</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add tax to your products</p>
            </div>
          </div>
          <Switch
            checked={currencyTax.taxEnabled}
            onCheckedChange={(checked) => handleChange('taxEnabled', checked)}
            aria-label="Enable tax"
          />
        </div>

        {/* Tax Options (shown when enabled) */}
        {currencyTax.taxEnabled && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={currencyTax.taxRate}
                onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                className={cn(
                  'w-full px-4 py-3 border rounded-lg transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                  'text-gray-900 dark:text-white'
                )}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="taxIncluded"
                checked={currencyTax.taxIncludedInPrice}
                onChange={(e) => handleChange('taxIncludedInPrice', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="taxIncluded" className="text-sm text-gray-700 dark:text-gray-300">
                Prices include tax
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
