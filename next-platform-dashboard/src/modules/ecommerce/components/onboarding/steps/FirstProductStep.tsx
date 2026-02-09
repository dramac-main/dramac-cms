/**
 * FirstProductStep Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard - Step 5
 */

'use client';

import React from 'react';
import { Package, FileSpreadsheet, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepComponentProps } from '../../../types/onboarding-types';

export function FirstProductStep({
  data,
  onDataChange,
}: StepComponentProps) {
  const firstProduct = data.firstProduct || {
    name: '',
    price: 0,
    description: '',
    imageUrl: '',
    skipped: false,
  };

  const handleChange = <K extends keyof typeof firstProduct>(
    field: K,
    value: (typeof firstProduct)[K]
  ) => {
    onDataChange({
      firstProduct: {
        ...firstProduct,
        [field]: value,
      },
    });
  };

  const handleSkipToggle = () => {
    handleChange('skipped', !firstProduct.skipped);
  };

  // Get currency symbol from earlier step
  const currencySymbol = data.currencyTax?.currencySymbol || 'K';

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Add Your First Product
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Quick start by adding a product now, or skip and add later
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => handleChange('skipped', false)}
          className={cn(
            'p-4 border rounded-lg text-center transition-all',
            !firstProduct.skipped
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          )}
        >
          <Sparkles className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className="font-medium text-gray-900 dark:text-white text-sm">Add Product</p>
        </button>
        <button
          type="button"
          onClick={handleSkipToggle}
          className={cn(
            'p-4 border rounded-lg text-center transition-all',
            firstProduct.skipped
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          )}
        >
          <ArrowRight className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          <p className="font-medium text-gray-900 dark:text-white text-sm">Skip for Now</p>
        </button>
      </div>

      {/* Product Form (shown when not skipping) */}
      {!firstProduct.skipped && (
        <div className="space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={firstProduct.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Premium T-Shirt"
              className={cn(
                'w-full px-4 py-3 border rounded-lg transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                'text-gray-900 dark:text-white placeholder:text-gray-400'
              )}
            />
          </div>

          {/* Product Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={firstProduct.price || ''}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                placeholder="29.99"
                className={cn(
                  'w-full pl-8 pr-4 py-3 border rounded-lg transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                  'text-gray-900 dark:text-white placeholder:text-gray-400'
                )}
              />
            </div>
          </div>

          {/* Product Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={firstProduct.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your product..."
              rows={3}
              className={cn(
                'w-full px-4 py-3 border rounded-lg transition-colors resize-none',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                'text-gray-900 dark:text-white placeholder:text-gray-400'
              )}
            />
          </div>
        </div>
      )}

      {/* Skip Message */}
      {firstProduct.skipped && (
        <div className="text-center py-8">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No problem! You can add products later from the Products section.
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Tip:</strong> You can add more details like images, inventory, 
          and variants after completing the wizard.
        </p>
      </div>
    </div>
  );
}
