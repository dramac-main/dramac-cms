/**
 * PaymentsStep Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard - Step 4
 */

'use client';

import React from 'react';
import { CreditCard, Check, ExternalLink } from 'lucide-react';
import { icons } from 'lucide-react';
import { resolveIconName } from '@/lib/utils/icon-map';
import { cn } from '@/lib/utils';
import type { StepComponentProps, PaymentProviderConfig } from '../../../types/onboarding-types';
import { Switch } from '../ui/Switch';

type ProviderType = PaymentProviderConfig['provider'];

const PAYMENT_PROVIDERS: {
  id: ProviderType;
  name: string;
  description: string;
  regions: string;
  icon: string;
  setupUrl?: string;
}[] = [
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    description: 'Accept cards, mobile money, bank transfers across Africa',
    regions: 'Africa',
    icon: 'CreditCard',
    setupUrl: 'https://flutterwave.com/us/',
  },
  {
    id: 'pesapal',
    name: 'Pesapal',
    description: 'M-Pesa, cards, and mobile payments in East Africa',
    regions: 'Kenya, Tanzania, Uganda',
    icon: 'Smartphone',
    setupUrl: 'https://www.pesapal.com/',
  },
  {
    id: 'paddle',
    name: 'Paddle',
    description: 'Global payments, tax compliance, subscription management',
    regions: 'Global',
    icon: 'Globe',
    setupUrl: 'https://www.paddle.com/',
  },
  {
    id: 'manual',
    name: 'Manual / Bank Transfer',
    description: 'Accept payments outside the platform',
    regions: 'Anywhere',
    icon: 'Landmark',
  },
];

export function PaymentsStep({
  data,
  onDataChange,
}: StepComponentProps) {
  const payments = data.payments || {
    paymentProviders: [],
    manualOrdersEnabled: false,
    paymentsConfiguredLater: false,
  };

  const handleProviderToggle = (providerId: ProviderType) => {
    const currentProviders = payments.paymentProviders || [];
    let newProviders: PaymentProviderConfig[];
    
    const existingIndex = currentProviders.findIndex(p => p.provider === providerId);
    
    if (existingIndex >= 0) {
      // Remove provider
      newProviders = currentProviders.filter(p => p.provider !== providerId);
    } else {
      // Add provider
      const newProvider: PaymentProviderConfig = {
        provider: providerId,
        enabled: true,
        configured: false,
      };
      newProviders = [...currentProviders, newProvider];
    }
    
    onDataChange({
      payments: {
        ...payments,
        paymentProviders: newProviders,
        manualOrdersEnabled: newProviders.some(p => p.provider === 'manual'),
      },
    });
  };

  const isProviderSelected = (providerId: ProviderType) => {
    return payments.paymentProviders?.some(p => p.provider === providerId) || false;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment Methods
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Choose how you want to accept payments
        </p>
      </div>

      {/* Configure Later Toggle */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">Configure Later</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Skip payment setup and configure later
            </p>
          </div>
          <Switch
            checked={payments.paymentsConfiguredLater}
            onCheckedChange={(checked) => onDataChange({
              payments: {
                ...payments,
                paymentsConfiguredLater: checked,
              },
            })}
            color="yellow"
            aria-label="Configure payments later"
          />
        </div>
      </div>

      {/* Payment Providers Grid */}
      {!payments.paymentsConfiguredLater && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Payment Providers
          </label>
          
          {PAYMENT_PROVIDERS.map((provider) => {
            const isSelected = isProviderSelected(provider.id);
            
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleProviderToggle(provider.id)}
                className={cn(
                  'w-full p-4 border rounded-lg text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{(() => { const Ic = (icons as Record<string, React.ComponentType<{className?: string}>>)[resolveIconName(provider.icon)]; return Ic ? <Ic className="h-5 w-5" /> : null; })()}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {provider.name}
                        {provider.setupUrl && (
                          <a
                            href={provider.setupUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {provider.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {provider.regions}
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Count */}
      {!payments.paymentsConfiguredLater && (payments.paymentProviders?.length || 0) > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {payments.paymentProviders?.length} payment method(s) selected
        </p>
      )}

      {/* Info Box */}
      <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg">
        <p className="text-sm text-primary dark:text-primary/80">
          <strong>Note:</strong> You&apos;ll need to configure API keys for each provider
          in Settings → Payments after completing the wizard.
        </p>
      </div>
    </div>
  );
}
