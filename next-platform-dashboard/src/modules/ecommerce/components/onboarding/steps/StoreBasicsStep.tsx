/**
 * StoreBasicsStep Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard - Step 1
 */

'use client';

import React from 'react';
import { Store, Mail, Phone, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepComponentProps } from '../../../types/onboarding-types';

export function StoreBasicsStep({
  data,
  onDataChange,
}: StepComponentProps) {
  const storeBasics = data.storeBasics || {
    storeName: '',
    contactEmail: '',
    storeDescription: '',
    contactPhone: '',
  };

  const handleChange = (
    field: keyof typeof storeBasics,
    value: string
  ) => {
    onDataChange({
      storeBasics: {
        ...storeBasics,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Let&apos;s set up your store
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Start with the basics - you can always change these later
        </p>
      </div>

      {/* Store Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Store Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={storeBasics.storeName}
          onChange={(e) => handleChange('storeName', e.target.value)}
          placeholder="My Awesome Store"
          className={cn(
            'w-full px-4 py-3 border rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
            'text-gray-900 dark:text-white'
          )}
          required
        />
      </div>

      {/* Store Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Store Description
        </label>
        <textarea
          value={storeBasics.storeDescription || ''}
          onChange={(e) => handleChange('storeDescription', e.target.value)}
          placeholder="Tell customers what your store is about..."
          rows={3}
          className={cn(
            'w-full px-4 py-3 border rounded-lg transition-colors resize-none',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
            'text-gray-900 dark:text-white'
          )}
        />
      </div>

      {/* Contact Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Contact Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            value={storeBasics.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
            placeholder="store@example.com"
            className={cn(
              'w-full pl-11 pr-4 py-3 border rounded-lg transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
              'text-gray-900 dark:text-white'
            )}
            required
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Order notifications will be sent to this email
        </p>
      </div>

      {/* Contact Phone (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Contact Phone
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            value={storeBasics.contactPhone || ''}
            onChange={(e) => handleChange('contactPhone', e.target.value)}
            placeholder="+1 (555) 000-0000"
            className={cn(
              'w-full pl-11 pr-4 py-3 border rounded-lg transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
              'text-gray-900 dark:text-white'
            )}
          />
        </div>
      </div>

      {/* Logo Upload Placeholder */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Store Logo
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            PNG, JPG or SVG (max 2MB)
          </p>
        </div>
      </div>
    </div>
  );
}
