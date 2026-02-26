/**
 * ShippingStep Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard - Step 3
 */

'use client';

import React from 'react';
import { Truck, Gift, MapPin } from 'lucide-react';
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config';
import { cn } from '@/lib/utils';
import type { StepComponentProps } from '../../../types/onboarding-types';
import { Switch } from '../ui/Switch';

export function ShippingStep({
  data,
  onDataChange,
}: StepComponentProps) {
  const shipping = data.shipping || {
    shippingEnabled: true,
    defaultShippingRate: 0,
    freeShippingEnabled: false,
    freeShippingThreshold: 0,
    shippingConfiguredLater: false,
  };

  const handleChange = <K extends keyof typeof shipping>(
    field: K,
    value: (typeof shipping)[K]
  ) => {
    onDataChange({
      shipping: {
        ...shipping,
        [field]: value,
      },
    });
  };

  // Get currency symbol from previous step
  const currencySymbol = data.currencyTax?.currencySymbol || DEFAULT_CURRENCY_SYMBOL;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Shipping Configuration
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Set up how you want to handle shipping
        </p>
      </div>

      {/* Shipping Toggle */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable Shipping</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Charge for shipping on orders
              </p>
            </div>
          </div>
          <Switch
            checked={shipping.shippingEnabled}
            onCheckedChange={(checked) => handleChange('shippingEnabled', checked)}
            color="purple"
            aria-label="Enable shipping"
          />
        </div>
      </div>

      {/* Shipping Options (shown when enabled) */}
      {shipping.shippingEnabled && (
        <>
          {/* Default Shipping Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Shipping Rate
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shipping.defaultShippingRate || ''}
                onChange={(e) => handleChange('defaultShippingRate', parseFloat(e.target.value) || 0)}
                className={cn(
                  'w-full pl-10 pr-4 py-3 border rounded-lg transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                  'text-gray-900 dark:text-white'
                )}
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Applied to all orders unless free shipping applies
            </p>
          </div>

          {/* Free Shipping */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Free Shipping</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Offer free shipping above a threshold
                  </p>
                </div>
              </div>
              <Switch
                checked={shipping.freeShippingEnabled}
                onCheckedChange={(checked) => handleChange('freeShippingEnabled', checked)}
                color="green"
                aria-label="Enable free shipping"
              />
            </div>

            {/* Free Shipping Threshold */}
            {shipping.freeShippingEnabled && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Free Shipping Threshold
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shipping.freeShippingThreshold || ''}
                    onChange={(e) => handleChange('freeShippingThreshold', parseFloat(e.target.value) || 0)}
                    className={cn(
                      'w-full pl-10 pr-4 py-3 border rounded-lg transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                      'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                      'text-gray-900 dark:text-white'
                    )}
                    placeholder="50.00"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Orders above this amount qualify for free shipping
                </p>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg">
            <p className="text-sm text-primary dark:text-primary/80">
              <strong>Tip:</strong> You can set up advanced shipping zones and rates
              later in Settings → Shipping.
            </p>
          </div>
        </>
      )}

      {/* No Shipping Info */}
      {!shipping.shippingEnabled && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Shipping is disabled. Perfect for digital products or local pickup stores.
          </p>
        </div>
      )}
    </div>
  );
}
