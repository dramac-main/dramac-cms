# PHASE-ECOM-53: Onboarding Wizard & Configuration

> **Priority**: 🟠 HIGH
> **Estimated Time**: 6-8 hours
> **Prerequisites**: PHASE-ECOM-50, PHASE-ECOM-51, PHASE-ECOM-52
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create a comprehensive onboarding wizard that guides users through initial store setup after the e-commerce module is installed. The wizard walks users through store basics, currency/tax settings, shipping configuration, payment setup, and optionally creating their first product, ensuring they have a fully configured store ready to accept orders.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] PHASE-ECOM-50, 51, 52 are complete
- [ ] Review existing settings components in `src/modules/ecommerce/components/settings/`
- [ ] Review settings actions in `src/modules/ecommerce/actions/settings-actions.ts`
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Onboarding Wizard Flow                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Module Installed → First Dashboard Visit → Show Onboarding Wizard      │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    Progress Indicator                              │ │
│  │  ● ─── ○ ─── ○ ─── ○ ─── ○ ─── ○                                 │ │
│  │  1     2     3     4     5     6                                  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Step 1: Store Basics                                                   │
│  ┌─────────────────────────┐                                           │
│  │ • Store Name            │                                           │
│  │ • Logo Upload           │                                           │
│  │ • Store Description     │                                           │
│  │ • Contact Email         │                                           │
│  └─────────────────────────┘                                           │
│                                                                         │
│  Step 2: Currency & Tax                                                 │
│  ┌─────────────────────────┐                                           │
│  │ • Currency Selection    │                                           │
│  │ • Tax Enabled Toggle    │                                           │
│  │ • Tax Rate              │                                           │
│  │ • Tax Display           │                                           │
│  └─────────────────────────┘                                           │
│                                                                         │
│  Step 3: Shipping                                                       │
│  ┌─────────────────────────┐                                           │
│  │ • Shipping Enabled      │                                           │
│  │ • Free Shipping Min     │                                           │
│  │ • Default Rate          │                                           │
│  │ • "Configure Later"     │                                           │
│  └─────────────────────────┘                                           │
│                                                                         │
│  Step 4: Payments                                                       │
│  ┌─────────────────────────┐                                           │
│  │ • Provider Selection    │                                           │
│  │ • Quick Connect         │                                           │
│  │ • Manual Orders Option  │                                           │
│  │ • "Skip for Now"        │                                           │
│  └─────────────────────────┘                                           │
│                                                                         │
│  Step 5: First Product (Optional)                                       │
│  ┌─────────────────────────┐                                           │
│  │ • Quick Product Form    │                                           │
│  │ • "Import Products"     │                                           │
│  │ • "Skip for Now"        │                                           │
│  └─────────────────────────┘                                           │
│                                                                         │
│  Step 6: Ready to Launch                                                │
│  ┌─────────────────────────┐                                           │
│  │ • Configuration Summary │                                           │
│  │ • Quick Links           │                                           │
│  │ • "Go to Dashboard"     │                                           │
│  └─────────────────────────┘                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/types/onboarding-types.ts` | Create | Onboarding type definitions |
| `src/modules/ecommerce/actions/onboarding-actions.ts` | Create | Server actions for onboarding |
| `src/modules/ecommerce/components/onboarding/OnboardingWizard.tsx` | Create | Main wizard component |
| `src/modules/ecommerce/components/onboarding/steps/StoreBasicsStep.tsx` | Create | Step 1 component |
| `src/modules/ecommerce/components/onboarding/steps/CurrencyTaxStep.tsx` | Create | Step 2 component |
| `src/modules/ecommerce/components/onboarding/steps/ShippingStep.tsx` | Create | Step 3 component |
| `src/modules/ecommerce/components/onboarding/steps/PaymentsStep.tsx` | Create | Step 4 component |
| `src/modules/ecommerce/components/onboarding/steps/FirstProductStep.tsx` | Create | Step 5 component |
| `src/modules/ecommerce/components/onboarding/steps/LaunchStep.tsx` | Create | Step 6 component |
| `src/modules/ecommerce/components/onboarding/index.ts` | Create | Export all onboarding components |
| `src/modules/ecommerce/components/ecommerce-dashboard.tsx` | Modify | Show onboarding on first visit |

---

## 📋 Implementation Tasks

### Task 53.1: Create Onboarding Type Definitions

**File**: `src/modules/ecommerce/types/onboarding-types.ts`
**Action**: Create

**Description**: Define types for the onboarding wizard.

```typescript
/**
 * E-Commerce Onboarding Type Definitions
 * 
 * PHASE-ECOM-53: Onboarding Wizard & Configuration
 * 
 * Types for the onboarding wizard and store setup.
 */

// ============================================================================
// ONBOARDING DATA TYPES
// ============================================================================

/**
 * Complete onboarding data collected across all steps
 */
export interface OnboardingData {
  // Step 1: Store Basics
  storeBasics: {
    storeName: string;
    storeDescription?: string;
    contactEmail: string;
    contactPhone?: string;
    businessAddress?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    logoUrl?: string;
  };

  // Step 2: Currency & Tax
  currencyTax: {
    currency: string;
    currencySymbol: string;
    currencyPosition: 'before' | 'after';
    thousandsSeparator: string;
    decimalSeparator: string;
    taxEnabled: boolean;
    taxRate: number;
    taxIncludedInPrice: boolean;
    taxDisplayText?: string;
  };

  // Step 3: Shipping
  shipping: {
    shippingEnabled: boolean;
    freeShippingEnabled: boolean;
    freeShippingThreshold?: number;
    defaultShippingRate?: number;
    shippingConfiguredLater: boolean;
  };

  // Step 4: Payments
  payments: {
    paymentProviders: PaymentProviderConfig[];
    manualOrdersEnabled: boolean;
    paymentsConfiguredLater: boolean;
  };

  // Step 5: First Product (optional)
  firstProduct?: {
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    skipped: boolean;
  };
}

/**
 * Payment provider configuration
 */
export interface PaymentProviderConfig {
  provider: 'flutterwave' | 'pesapal' | 'paddle' | 'stripe' | 'manual';
  enabled: boolean;
  configured: boolean;
  credentials?: Record<string, string>;
}

// ============================================================================
// ONBOARDING STATE TYPES
// ============================================================================

/**
 * Onboarding status tracking
 */
export interface OnboardingStatus {
  completed: boolean;
  currentStep: number;
  stepStatuses: StepStatus[];
  startedAt?: string;
  completedAt?: string;
}

/**
 * Individual step status
 */
export interface StepStatus {
  stepNumber: number;
  stepId: string;
  completed: boolean;
  skipped: boolean;
  data?: Partial<OnboardingData>;
}

/**
 * Step definition for the wizard
 */
export interface OnboardingStep {
  id: string;
  number: number;
  title: string;
  description: string;
  required: boolean;
  canSkip: boolean;
  estimatedTime?: string;
}

// ============================================================================
// WIZARD COMPONENT PROPS
// ============================================================================

/**
 * Props for the main OnboardingWizard component
 */
export interface OnboardingWizardProps {
  siteId: string;
  onComplete: () => void;
  onSkip?: () => void;
  initialStep?: number;
  className?: string;
}

/**
 * Common props for step components
 */
export interface StepComponentProps {
  siteId: string;
  data: Partial<OnboardingData>;
  onDataChange: (stepData: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Result of saving onboarding step
 */
export interface SaveOnboardingStepResult {
  success: boolean;
  error?: string;
}

/**
 * Result of completing onboarding
 */
export interface CompleteOnboardingResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Result of getting onboarding status
 */
export interface GetOnboardingStatusResult {
  success: boolean;
  status: OnboardingStatus | null;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Available currencies
 */
export const AVAILABLE_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
] as const;

/**
 * Onboarding steps definition
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'store-basics',
    number: 1,
    title: 'Store Basics',
    description: 'Set up your store name, logo, and contact information',
    required: true,
    canSkip: false,
    estimatedTime: '2 min',
  },
  {
    id: 'currency-tax',
    number: 2,
    title: 'Currency & Tax',
    description: 'Configure your pricing currency and tax settings',
    required: true,
    canSkip: false,
    estimatedTime: '1 min',
  },
  {
    id: 'shipping',
    number: 3,
    title: 'Shipping',
    description: 'Set up shipping options and rates',
    required: false,
    canSkip: true,
    estimatedTime: '2 min',
  },
  {
    id: 'payments',
    number: 4,
    title: 'Payments',
    description: 'Connect a payment provider to accept orders',
    required: false,
    canSkip: true,
    estimatedTime: '3 min',
  },
  {
    id: 'first-product',
    number: 5,
    title: 'First Product',
    description: 'Add your first product to the store',
    required: false,
    canSkip: true,
    estimatedTime: '2 min',
  },
  {
    id: 'launch',
    number: 6,
    title: 'Ready to Launch',
    description: 'Review your setup and launch your store',
    required: true,
    canSkip: false,
    estimatedTime: '1 min',
  },
];

/**
 * Default onboarding data
 */
export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  storeBasics: {
    storeName: '',
    contactEmail: '',
  },
  currencyTax: {
    currency: 'USD',
    currencySymbol: '$',
    currencyPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    taxEnabled: false,
    taxRate: 0,
    taxIncludedInPrice: false,
  },
  shipping: {
    shippingEnabled: true,
    freeShippingEnabled: false,
    shippingConfiguredLater: false,
  },
  payments: {
    paymentProviders: [],
    manualOrdersEnabled: true,
    paymentsConfiguredLater: false,
  },
};
```

---

### Task 53.2: Create Onboarding Server Actions

**File**: `src/modules/ecommerce/actions/onboarding-actions.ts`
**Action**: Create

**Description**: Server actions for managing onboarding state.

```typescript
/**
 * E-Commerce Onboarding Server Actions
 * 
 * PHASE-ECOM-53: Onboarding Wizard & Configuration
 * 
 * Server actions for saving and retrieving onboarding progress.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  OnboardingData,
  OnboardingStatus,
  SaveOnboardingStepResult,
  CompleteOnboardingResult,
  GetOnboardingStatusResult,
  DEFAULT_ONBOARDING_DATA,
} from '../types/onboarding-types';
import { updateStoreSettings, getStoreSettings } from './settings-actions';
import { createProduct } from './ecommerce-actions';

// ============================================================================
// GET ONBOARDING STATUS
// ============================================================================

/**
 * Get the current onboarding status for a site
 */
export async function getOnboardingStatus(
  siteId: string
): Promise<GetOnboardingStatusResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    // Get module installation settings
    const { data: installation, error } = await db
      .from('site_module_installations')
      .select('settings')
      .eq('site_id', siteId)
      .eq('module_id', 'ecommerce')
      .single();

    if (error) {
      return { success: false, status: null, error: error.message };
    }

    const settings = installation?.settings || {};

    const status: OnboardingStatus = {
      completed: settings.onboarding_completed || false,
      currentStep: settings.onboarding_step || 1,
      stepStatuses: settings.onboarding_step_statuses || [],
      startedAt: settings.onboarding_started_at,
      completedAt: settings.onboarding_completed_at,
    };

    return { success: true, status, error: undefined };
  } catch (err) {
    console.error('[Onboarding] Error getting status:', err);
    return {
      success: false,
      status: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ============================================================================
// SAVE ONBOARDING STEP
// ============================================================================

/**
 * Save progress for an onboarding step
 */
export async function saveOnboardingStep(
  siteId: string,
  step: number,
  data: Partial<OnboardingData>
): Promise<SaveOnboardingStepResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    // Get current installation settings
    const { data: installation, error: fetchError } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', 'ecommerce')
      .single();

    if (fetchError || !installation) {
      return { success: false, error: 'E-commerce module not installed' };
    }

    const currentSettings = installation.settings || {};
    const currentOnboardingData = currentSettings.onboarding_data || {};

    // Merge step data into onboarding data
    const updatedOnboardingData = {
      ...currentOnboardingData,
      ...data,
    };

    // Update step statuses
    const stepStatuses = currentSettings.onboarding_step_statuses || [];
    const stepIndex = stepStatuses.findIndex(
      (s: { stepNumber: number }) => s.stepNumber === step
    );
    
    const stepStatus = {
      stepNumber: step,
      stepId: getStepIdFromNumber(step),
      completed: true,
      skipped: false,
      data,
    };

    if (stepIndex >= 0) {
      stepStatuses[stepIndex] = stepStatus;
    } else {
      stepStatuses.push(stepStatus);
    }

    // Update settings
    const updatedSettings = {
      ...currentSettings,
      onboarding_step: Math.max(step + 1, currentSettings.onboarding_step || 1),
      onboarding_data: updatedOnboardingData,
      onboarding_step_statuses: stepStatuses,
      onboarding_started_at: currentSettings.onboarding_started_at || new Date().toISOString(),
    };

    const { error: updateError } = await db
      .from('site_module_installations')
      .update({ settings: updatedSettings })
      .eq('id', installation.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Apply step-specific settings to the store
    await applyStepSettings(siteId, step, data);

    return { success: true };
  } catch (err) {
    console.error('[Onboarding] Error saving step:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Skip an onboarding step
 */
export async function skipOnboardingStep(
  siteId: string,
  step: number
): Promise<SaveOnboardingStepResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    const { data: installation, error: fetchError } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', 'ecommerce')
      .single();

    if (fetchError || !installation) {
      return { success: false, error: 'E-commerce module not installed' };
    }

    const currentSettings = installation.settings || {};
    const stepStatuses = currentSettings.onboarding_step_statuses || [];

    // Mark step as skipped
    const stepStatus = {
      stepNumber: step,
      stepId: getStepIdFromNumber(step),
      completed: false,
      skipped: true,
    };

    const stepIndex = stepStatuses.findIndex(
      (s: { stepNumber: number }) => s.stepNumber === step
    );

    if (stepIndex >= 0) {
      stepStatuses[stepIndex] = stepStatus;
    } else {
      stepStatuses.push(stepStatus);
    }

    const updatedSettings = {
      ...currentSettings,
      onboarding_step: Math.max(step + 1, currentSettings.onboarding_step || 1),
      onboarding_step_statuses: stepStatuses,
    };

    const { error: updateError } = await db
      .from('site_module_installations')
      .update({ settings: updatedSettings })
      .eq('id', installation.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[Onboarding] Error skipping step:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ============================================================================
// COMPLETE ONBOARDING
// ============================================================================

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(
  siteId: string,
  finalData: Partial<OnboardingData>
): Promise<CompleteOnboardingResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    const { data: installation, error: fetchError } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', 'ecommerce')
      .single();

    if (fetchError || !installation) {
      return { success: false, error: 'E-commerce module not installed' };
    }

    const currentSettings = installation.settings || {};
    const onboardingData = {
      ...currentSettings.onboarding_data,
      ...finalData,
    };

    // Mark as completed
    const updatedSettings = {
      ...currentSettings,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      onboarding_data: onboardingData,
      // Apply final settings from onboarding
      ...convertOnboardingToStoreSettings(onboardingData),
    };

    const { error: updateError } = await db
      .from('site_module_installations')
      .update({ settings: updatedSettings })
      .eq('id', installation.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    console.log(`[Onboarding] Completed for site ${siteId}`);

    return { 
      success: true, 
      redirectTo: `/dashboard/sites/${siteId}/modules/ecommerce`,
    };
  } catch (err) {
    console.error('[Onboarding] Error completing:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Skip the entire onboarding process
 */
export async function skipOnboarding(
  siteId: string
): Promise<CompleteOnboardingResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    const { data: installation, error: fetchError } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', 'ecommerce')
      .single();

    if (fetchError || !installation) {
      return { success: false, error: 'E-commerce module not installed' };
    }

    const currentSettings = installation.settings || {};

    const updatedSettings = {
      ...currentSettings,
      onboarding_completed: true,
      onboarding_skipped: true,
      onboarding_completed_at: new Date().toISOString(),
    };

    const { error: updateError } = await db
      .from('site_module_installations')
      .update({ settings: updatedSettings })
      .eq('id', installation.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { 
      success: true,
      redirectTo: `/dashboard/sites/${siteId}/modules/ecommerce`,
    };
  } catch (err) {
    console.error('[Onboarding] Error skipping:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get step ID from step number
 */
function getStepIdFromNumber(step: number): string {
  const stepIds = [
    'store-basics',
    'currency-tax',
    'shipping',
    'payments',
    'first-product',
    'launch',
  ];
  return stepIds[step - 1] || 'unknown';
}

/**
 * Apply step-specific settings to the store
 */
async function applyStepSettings(
  siteId: string,
  step: number,
  data: Partial<OnboardingData>
): Promise<void> {
  try {
    switch (step) {
      case 1: // Store Basics
        if (data.storeBasics) {
          await updateStoreSettings(siteId, {
            store_name: data.storeBasics.storeName,
            store_description: data.storeBasics.storeDescription,
            contact_email: data.storeBasics.contactEmail,
            contact_phone: data.storeBasics.contactPhone,
            business_address: data.storeBasics.businessAddress,
            logo_url: data.storeBasics.logoUrl,
          });
        }
        break;

      case 2: // Currency & Tax
        if (data.currencyTax) {
          await updateStoreSettings(siteId, {
            currency: data.currencyTax.currency,
            currency_symbol: data.currencyTax.currencySymbol,
            currency_position: data.currencyTax.currencyPosition,
            tax_enabled: data.currencyTax.taxEnabled,
            tax_rate: data.currencyTax.taxRate,
            tax_included: data.currencyTax.taxIncludedInPrice,
          });
        }
        break;

      case 3: // Shipping
        if (data.shipping) {
          await updateStoreSettings(siteId, {
            shipping_enabled: data.shipping.shippingEnabled,
            free_shipping_enabled: data.shipping.freeShippingEnabled,
            free_shipping_threshold: data.shipping.freeShippingThreshold,
            default_shipping_rate: data.shipping.defaultShippingRate,
          });
        }
        break;

      case 4: // Payments
        if (data.payments) {
          await updateStoreSettings(siteId, {
            payment_providers: data.payments.paymentProviders,
            manual_orders_enabled: data.payments.manualOrdersEnabled,
          });
        }
        break;

      case 5: // First Product
        if (data.firstProduct && !data.firstProduct.skipped) {
          // Create the first product
          // Note: This uses the existing product creation action
          // We'd need the agency_id here, which should come from the site
        }
        break;
    }
  } catch (err) {
    console.error(`[Onboarding] Error applying step ${step} settings:`, err);
    // Don't throw - settings application is best-effort
  }
}

/**
 * Convert onboarding data to store settings format
 */
function convertOnboardingToStoreSettings(
  data: Partial<OnboardingData>
): Record<string, unknown> {
  const settings: Record<string, unknown> = {};

  if (data.storeBasics) {
    settings.store_name = data.storeBasics.storeName;
    settings.store_description = data.storeBasics.storeDescription;
    settings.contact_email = data.storeBasics.contactEmail;
    settings.logo_url = data.storeBasics.logoUrl;
  }

  if (data.currencyTax) {
    settings.currency = data.currencyTax.currency;
    settings.currency_symbol = data.currencyTax.currencySymbol;
    settings.currency_position = data.currencyTax.currencyPosition;
    settings.tax_enabled = data.currencyTax.taxEnabled;
    settings.tax_rate = data.currencyTax.taxRate;
    settings.tax_included = data.currencyTax.taxIncludedInPrice;
  }

  if (data.shipping) {
    settings.shipping_enabled = data.shipping.shippingEnabled;
    settings.free_shipping_enabled = data.shipping.freeShippingEnabled;
    settings.free_shipping_threshold = data.shipping.freeShippingThreshold;
  }

  if (data.payments) {
    settings.manual_orders_enabled = data.payments.manualOrdersEnabled;
    settings.payment_providers_configured = data.payments.paymentProviders.filter(
      p => p.configured
    ).length > 0;
  }

  return settings;
}
```

---

### Task 53.3: Create Main Onboarding Wizard Component

**File**: `src/modules/ecommerce/components/onboarding/OnboardingWizard.tsx`
**Action**: Create

**Description**: The main wizard container component.

```typescript
/**
 * OnboardingWizard Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard & Configuration
 * 
 * Main wizard component that orchestrates the onboarding flow.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  OnboardingWizardProps,
  OnboardingData,
  OnboardingStep,
} from '../../types/onboarding-types';
import {
  ONBOARDING_STEPS,
  DEFAULT_ONBOARDING_DATA,
} from '../../types/onboarding-types';
import {
  getOnboardingStatus,
  saveOnboardingStep,
  skipOnboardingStep,
  completeOnboarding,
  skipOnboarding,
} from '../../actions/onboarding-actions';

// Step components
import { StoreBasicsStep } from './steps/StoreBasicsStep';
import { CurrencyTaxStep } from './steps/CurrencyTaxStep';
import { ShippingStep } from './steps/ShippingStep';
import { PaymentsStep } from './steps/PaymentsStep';
import { FirstProductStep } from './steps/FirstProductStep';
import { LaunchStep } from './steps/LaunchStep';

// ============================================================================
// COMPONENT
// ============================================================================

export function OnboardingWizard({
  siteId,
  onComplete,
  onSkip,
  initialStep = 1,
  className,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [data, setData] = useState<Partial<OnboardingData>>(DEFAULT_ONBOARDING_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing onboarding data on mount
  useEffect(() => {
    async function loadStatus() {
      try {
        const result = await getOnboardingStatus(siteId);
        if (result.success && result.status) {
          setCurrentStep(result.status.currentStep);
          // Merge any existing data
        }
      } catch (err) {
        console.error('Failed to load onboarding status:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStatus();
  }, [siteId]);

  // Handle data change from step components
  const handleDataChange = useCallback((stepData: Partial<OnboardingData>) => {
    setData(prev => ({
      ...prev,
      ...stepData,
    }));
  }, []);

  // Handle next step
  const handleNext = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Save current step data
      const result = await saveOnboardingStep(siteId, currentStep, data);
      
      if (!result.success) {
        setError(result.error || 'Failed to save step');
        setIsSaving(false);
        return;
      }

      if (currentStep < ONBOARDING_STEPS.length) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Complete onboarding
        const completeResult = await completeOnboarding(siteId, data);
        if (completeResult.success) {
          onComplete();
        } else {
          setError(completeResult.error || 'Failed to complete onboarding');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  }, [siteId, currentStep, data, onComplete]);

  // Handle back
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Handle skip step
  const handleSkipStep = useCallback(async () => {
    setIsSaving(true);

    try {
      await skipOnboardingStep(siteId, currentStep);
      
      if (currentStep < ONBOARDING_STEPS.length) {
        setCurrentStep(prev => prev + 1);
      }
    } catch (err) {
      setError('Failed to skip step');
    } finally {
      setIsSaving(false);
    }
  }, [siteId, currentStep]);

  // Handle skip all
  const handleSkipAll = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to skip the setup wizard? You can configure these settings later from the Settings page.'
    );

    if (!confirmed) return;

    setIsSaving(true);

    try {
      const result = await skipOnboarding(siteId);
      if (result.success) {
        onSkip?.();
        onComplete();
      } else {
        setError(result.error || 'Failed to skip onboarding');
      }
    } catch (err) {
      setError('Failed to skip onboarding');
    } finally {
      setIsSaving(false);
    }
  }, [siteId, onSkip, onComplete]);

  // Get current step definition
  const stepDef = ONBOARDING_STEPS[currentStep - 1];
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === ONBOARDING_STEPS.length;

  // Render step component
  const renderStep = () => {
    const commonProps = {
      siteId,
      data,
      onDataChange: handleDataChange,
      onNext: handleNext,
      onBack: handleBack,
      onSkip: stepDef?.canSkip ? handleSkipStep : undefined,
      isFirstStep,
      isLastStep,
    };

    switch (currentStep) {
      case 1:
        return <StoreBasicsStep {...commonProps} />;
      case 2:
        return <CurrencyTaxStep {...commonProps} />;
      case 3:
        return <ShippingStep {...commonProps} />;
      case 4:
        return <PaymentsStep {...commonProps} />;
      case 5:
        return <FirstProductStep {...commonProps} />;
      case 6:
        return <LaunchStep {...commonProps} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
        className
      )}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Set Up Your Store
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Step {currentStep} of {ONBOARDING_STEPS.length}: {stepDef?.title}
              </p>
            </div>
            <button
              onClick={handleSkipAll}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Skip setup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex items-center gap-2">
            {ONBOARDING_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                    index + 1 < currentStep
                      ? 'bg-green-500 text-white'
                      : index + 1 === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {index + 1 < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-1 rounded-full transition-colors',
                      index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div>
            {!isFirstStep && (
              <button
                onClick={handleBack}
                disabled={isSaving}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {stepDef?.canSkip && (
              <button
                onClick={handleSkipStep}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Skip
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
                'bg-blue-600 text-white hover:bg-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : isLastStep ? (
                <>
                  Complete Setup
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;
```

---

### Task 53.4: Create Step Components

**File**: `src/modules/ecommerce/components/onboarding/steps/StoreBasicsStep.tsx`
**Action**: Create

```typescript
/**
 * StoreBasicsStep Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard - Step 1
 */

'use client';

import React, { useState } from 'react';
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
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Let's set up your store
        </h3>
        <p className="text-gray-500 mt-1">
          Start with the basics - you can always change these later
        </p>
      </div>

      {/* Store Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
            'placeholder:text-gray-400'
          )}
          required
        />
      </div>

      {/* Store Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
            'placeholder:text-gray-400'
          )}
        />
      </div>

      {/* Contact Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
              'placeholder:text-gray-400'
            )}
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Order notifications will be sent to this email
        </p>
      </div>

      {/* Contact Phone (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
              'placeholder:text-gray-400'
            )}
          />
        </div>
      </div>

      {/* Logo Upload Placeholder */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Store Logo
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors cursor-pointer">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PNG, JPG or SVG (max 2MB)
          </p>
        </div>
      </div>
    </div>
  );
}
```

**File**: `src/modules/ecommerce/components/onboarding/steps/CurrencyTaxStep.tsx`
**Action**: Create

```typescript
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

export function CurrencyTaxStep({
  data,
  onDataChange,
}: StepComponentProps) {
  const currencyTax = data.currencyTax || {
    currency: 'USD',
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
    value: typeof currencyTax[K]
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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Currency & Tax Settings
        </h3>
        <p className="text-gray-500 mt-1">
          Choose how prices are displayed in your store
        </p>
      </div>

      {/* Currency Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Store Currency
        </label>
        <select
          value={currencyTax.currency}
          onChange={(e) => handleChange('currency', e.target.value)}
          className={cn(
            'w-full px-4 py-3 border rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Currency Symbol Position
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleChange('currencyPosition', 'before')}
            className={cn(
              'px-4 py-3 border rounded-lg transition-colors text-center',
              currencyTax.currencyPosition === 'before'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <span className="font-medium">{currencyTax.currencySymbol}99.00</span>
            <span className="block text-xs text-gray-500 mt-1">Before price</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('currencyPosition', 'after')}
            className={cn(
              'px-4 py-3 border rounded-lg transition-colors text-center',
              currencyTax.currencyPosition === 'after'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <span className="font-medium">99.00{currencyTax.currencySymbol}</span>
            <span className="block text-xs text-gray-500 mt-1">After price</span>
          </button>
        </div>
      </div>

      {/* Tax Toggle */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Enable Tax</p>
              <p className="text-sm text-gray-500">Add tax to your products</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleChange('taxEnabled', !currencyTax.taxEnabled)}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors',
              currencyTax.taxEnabled ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow',
                currencyTax.taxEnabled ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Tax Options (shown when enabled) */}
        {currencyTax.taxEnabled && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
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
              <label htmlFor="taxIncluded" className="text-sm text-gray-700">
                Prices include tax
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**File**: `src/modules/ecommerce/components/onboarding/steps/ShippingStep.tsx`
**Action**: Create

```typescript
/**
 * ShippingStep Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard - Step 3
 */

'use client';

import React from 'react';
import { Truck, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepComponentProps } from '../../../types/onboarding-types';

export function ShippingStep({
  data,
  onDataChange,
}: StepComponentProps) {
  const shipping = data.shipping || {
    shippingEnabled: true,
    freeShippingEnabled: false,
    freeShippingThreshold: undefined,
    defaultShippingRate: undefined,
    shippingConfiguredLater: false,
  };

  const handleChange = <K extends keyof typeof shipping>(
    field: K,
    value: typeof shipping[K]
  ) => {
    onDataChange({
      shipping: {
        ...shipping,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Shipping Configuration
        </h3>
        <p className="text-gray-500 mt-1">
          Set up basic shipping options for your store
        </p>
      </div>

      {/* Shipping Toggle */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Enable Shipping</p>
            <p className="text-sm text-gray-500">
              Charge shipping fees on orders
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('shippingEnabled', !shipping.shippingEnabled)}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors',
              shipping.shippingEnabled ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow',
                shipping.shippingEnabled ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      {shipping.shippingEnabled && (
        <>
          {/* Default Shipping Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Shipping Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {data.currencyTax?.currencySymbol || '$'}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shipping.defaultShippingRate || ''}
                onChange={(e) => handleChange('defaultShippingRate', parseFloat(e.target.value) || undefined)}
                placeholder="5.00"
                className={cn(
                  'w-full pl-8 pr-4 py-3 border rounded-lg transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                )}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This will be applied to all orders by default
            </p>
          </div>

          {/* Free Shipping */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">Free Shipping</p>
                  <p className="text-sm text-gray-500">
                    Offer free shipping above a minimum order
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('freeShippingEnabled', !shipping.freeShippingEnabled)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  shipping.freeShippingEnabled ? 'bg-green-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow',
                    shipping.freeShippingEnabled ? 'translate-x-7' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {shipping.freeShippingEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {data.currencyTax?.currencySymbol || '$'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shipping.freeShippingThreshold || ''}
                    onChange={(e) => handleChange('freeShippingThreshold', parseFloat(e.target.value) || undefined)}
                    placeholder="50.00"
                    className={cn(
                      'w-full pl-8 pr-4 py-3 border rounded-lg transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Configure Later Option */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Need more options?</strong> You can configure advanced shipping zones, 
          rates per region, and weight-based shipping in Settings after completing setup.
        </p>
      </div>
    </div>
  );
}
```

**File**: `src/modules/ecommerce/components/onboarding/steps/PaymentsStep.tsx`
**Action**: Create

```typescript
/**
 * PaymentsStep Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard - Step 4
 */

'use client';

import React from 'react';
import { CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepComponentProps, PaymentProviderConfig } from '../../../types/onboarding-types';

const PAYMENT_PROVIDERS = [
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    description: 'Accept cards, mobile money, bank transfers',
    regions: ['Africa'],
    logo: '/images/payments/flutterwave.svg',
  },
  {
    id: 'pesapal',
    name: 'Pesapal',
    description: 'Mobile money and card payments for East Africa',
    regions: ['East Africa'],
    logo: '/images/payments/pesapal.svg',
  },
  {
    id: 'paddle',
    name: 'Paddle',
    description: 'Global payments with tax handling',
    regions: ['Global'],
    logo: '/images/payments/paddle.svg',
  },
  {
    id: 'manual',
    name: 'Manual / Cash on Delivery',
    description: 'Accept orders without online payment',
    regions: ['All'],
    logo: null,
  },
] as const;

export function PaymentsStep({
  data,
  onDataChange,
}: StepComponentProps) {
  const payments = data.payments || {
    paymentProviders: [],
    manualOrdersEnabled: true,
    paymentsConfiguredLater: false,
  };

  const toggleProvider = (providerId: string) => {
    const existing = payments.paymentProviders.find(p => p.provider === providerId);
    
    let updated: PaymentProviderConfig[];
    
    if (existing) {
      updated = payments.paymentProviders.filter(p => p.provider !== providerId);
    } else {
      updated = [
        ...payments.paymentProviders,
        {
          provider: providerId as PaymentProviderConfig['provider'],
          enabled: true,
          configured: providerId === 'manual', // Manual is always configured
        },
      ];
    }
    
    onDataChange({
      payments: {
        ...payments,
        paymentProviders: updated,
        manualOrdersEnabled: updated.some(p => p.provider === 'manual'),
      },
    });
  };

  const isProviderSelected = (providerId: string) => {
    return payments.paymentProviders.some(p => p.provider === providerId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Payment Methods
        </h3>
        <p className="text-gray-500 mt-1">
          Choose how customers can pay for orders
        </p>
      </div>

      {/* Payment Providers */}
      <div className="space-y-3">
        {PAYMENT_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => toggleProvider(provider.id)}
            className={cn(
              'w-full p-4 border rounded-lg transition-all text-left',
              'hover:border-gray-300',
              isProviderSelected(provider.id)
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                : 'border-gray-200'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {provider.logo ? (
                  <div className="w-10 h-10 bg-white rounded border flex items-center justify-center">
                    <img
                      src={provider.logo}
                      alt={provider.name}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{provider.name}</p>
                  <p className="text-sm text-gray-500">{provider.description}</p>
                </div>
              </div>
              
              {isProviderSelected(provider.id) ? (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
            </div>

            {/* Configuration hint for selected providers */}
            {isProviderSelected(provider.id) && provider.id !== 'manual' && (
              <div className="mt-3 pt-3 border-t border-blue-100">
                <p className="text-sm text-blue-700 flex items-center gap-1">
                  <ArrowRight className="w-4 h-4" />
                  You'll configure API keys in Settings after setup
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Tip:</strong> Select "Manual / Cash on Delivery" if you want to 
          start accepting orders right away without setting up a payment gateway. 
          You can add online payments later.
        </p>
      </div>

      {/* No selection warning */}
      {payments.paymentProviders.length === 0 && (
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            Select at least one payment method to accept orders
          </p>
        </div>
      )}
    </div>
  );
}
```

**File**: `src/modules/ecommerce/components/onboarding/steps/FirstProductStep.tsx`
**Action**: Create

```typescript
/**
 * FirstProductStep Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard - Step 5
 */

'use client';

import React, { useState } from 'react';
import { Package, Upload, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepComponentProps } from '../../../types/onboarding-types';

export function FirstProductStep({
  data,
  onDataChange,
  onSkip,
}: StepComponentProps) {
  const [mode, setMode] = useState<'create' | 'import' | null>(null);
  
  const firstProduct = data.firstProduct || {
    name: '',
    price: 0,
    description: '',
    imageUrl: '',
    skipped: false,
  };

  const handleChange = <K extends keyof typeof firstProduct>(
    field: K,
    value: typeof firstProduct[K]
  ) => {
    onDataChange({
      firstProduct: {
        ...firstProduct,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Add Your First Product
        </h3>
        <p className="text-gray-500 mt-1">
          Get started with a product or import your catalog
        </p>
      </div>

      {/* Mode Selection */}
      {!mode && (
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMode('create')}
            className="p-6 border-2 border-dashed rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors text-center"
          >
            <Package className="w-8 h-8 text-teal-500 mx-auto mb-3" />
            <p className="font-medium text-gray-900">Create Product</p>
            <p className="text-sm text-gray-500 mt-1">Add a single product</p>
          </button>
          
          <button
            type="button"
            onClick={() => setMode('import')}
            className="p-6 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <FileSpreadsheet className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <p className="font-medium text-gray-900">Import Products</p>
            <p className="text-sm text-gray-500 mt-1">Upload from CSV</p>
          </button>
        </div>
      )}

      {/* Create Mode */}
      {mode === 'create' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMode(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to options
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstProduct.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Classic T-Shirt"
              className={cn(
                'w-full px-4 py-3 border rounded-lg transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {data.currencyTax?.currencySymbol || '$'}
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
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={firstProduct.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your product..."
              rows={3}
              className={cn(
                'w-full px-4 py-3 border rounded-lg transition-colors resize-none',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click to upload</p>
            </div>
          </div>
        </div>
      )}

      {/* Import Mode */}
      {mode === 'import' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMode(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to options
          </button>

          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="font-medium text-gray-900 mb-1">Drop your CSV file here</p>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose File
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>CSV Format:</strong> Your file should include columns for 
              Name, Price, Description, SKU, and Image URL.{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Download template
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Skip Option */}
      {onSkip && (
        <div className="text-center pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              handleChange('skipped', true);
              onSkip();
            }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Skip - I'll add products later
          </button>
        </div>
      )}
    </div>
  );
}
```

**File**: `src/modules/ecommerce/components/onboarding/steps/LaunchStep.tsx`
**Action**: Create

```typescript
/**
 * LaunchStep Component
 * 
 * PHASE-ECOM-53: Onboarding Wizard - Step 6
 */

'use client';

import React from 'react';
import { Rocket, CheckCircle, ArrowRight, Settings, Package, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepComponentProps } from '../../../types/onboarding-types';

export function LaunchStep({
  data,
}: StepComponentProps) {
  // Calculate completion status
  const completionItems = [
    {
      label: 'Store basics configured',
      completed: !!data.storeBasics?.storeName && !!data.storeBasics?.contactEmail,
      icon: Settings,
    },
    {
      label: 'Currency & tax settings',
      completed: !!data.currencyTax?.currency,
      icon: Settings,
    },
    {
      label: 'Shipping configured',
      completed: data.shipping?.shippingEnabled !== undefined,
      icon: Package,
    },
    {
      label: 'Payment method selected',
      completed: (data.payments?.paymentProviders?.length || 0) > 0,
      icon: CreditCard,
    },
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const completionPercent = Math.round((completedCount / completionItems.length) * 100);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Rocket className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">
          You're Ready to Launch! 🎉
        </h3>
        <p className="text-gray-500 mt-2">
          Your store is configured and ready to start selling
        </p>
      </div>

      {/* Progress Summary */}
      <div className="bg-green-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium text-green-800">Setup Progress</span>
          <span className="text-2xl font-bold text-green-600">{completionPercent}%</span>
        </div>
        <div className="w-full bg-green-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Completion Checklist */}
      <div className="space-y-3">
        {completionItems.map((item, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg transition-colors',
              item.completed ? 'bg-green-50' : 'bg-gray-50'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                item.completed ? 'bg-green-500' : 'bg-gray-300'
              )}
            >
              {item.completed ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <item.icon className="w-4 h-4 text-white" />
              )}
            </div>
            <span
              className={cn(
                'font-medium',
                item.completed ? 'text-green-800' : 'text-gray-500'
              )}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Store Summary */}
      {data.storeBasics?.storeName && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Store Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Store Name</span>
              <p className="font-medium text-gray-900">{data.storeBasics.storeName}</p>
            </div>
            <div>
              <span className="text-gray-500">Currency</span>
              <p className="font-medium text-gray-900">
                {data.currencyTax?.currency} ({data.currencyTax?.currencySymbol})
              </p>
            </div>
            <div>
              <span className="text-gray-500">Contact</span>
              <p className="font-medium text-gray-900">{data.storeBasics.contactEmail}</p>
            </div>
            <div>
              <span className="text-gray-500">Tax</span>
              <p className="font-medium text-gray-900">
                {data.currencyTax?.taxEnabled 
                  ? `${data.currencyTax.taxRate}%` 
                  : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-3">What's Next?</h4>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm text-blue-800">
            <ArrowRight className="w-4 h-4" />
            Add your products to the catalog
          </li>
          <li className="flex items-center gap-2 text-sm text-blue-800">
            <ArrowRight className="w-4 h-4" />
            Configure payment provider API keys
          </li>
          <li className="flex items-center gap-2 text-sm text-blue-800">
            <ArrowRight className="w-4 h-4" />
            Set up shipping zones for different regions
          </li>
          <li className="flex items-center gap-2 text-sm text-blue-800">
            <ArrowRight className="w-4 h-4" />
            Preview your store pages
          </li>
        </ul>
      </div>
    </div>
  );
}
```

---

### Task 53.5: Create Onboarding Index Export

**File**: `src/modules/ecommerce/components/onboarding/index.ts`
**Action**: Create

```typescript
/**
 * E-Commerce Onboarding Components Index
 * 
 * PHASE-ECOM-53: Onboarding Wizard & Configuration
 */

export { OnboardingWizard, default } from './OnboardingWizard';
export { StoreBasicsStep } from './steps/StoreBasicsStep';
export { CurrencyTaxStep } from './steps/CurrencyTaxStep';
export { ShippingStep } from './steps/ShippingStep';
export { PaymentsStep } from './steps/PaymentsStep';
export { FirstProductStep } from './steps/FirstProductStep';
export { LaunchStep } from './steps/LaunchStep';
```

---

## 🗄️ Database Migrations

No new database tables required. Onboarding state is stored in `site_module_installations.settings`.

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] Onboarding status tests:
  - [ ] `getOnboardingStatus()` returns correct initial state
  - [ ] `saveOnboardingStep()` persists data correctly
  - [ ] `skipOnboardingStep()` marks step as skipped
  - [ ] `completeOnboarding()` marks wizard as done
- [ ] Wizard component tests:
  - [ ] Renders on first dashboard visit
  - [ ] Progress bar shows correct step
  - [ ] Navigation between steps works
  - [ ] Data persists across steps
  - [ ] Skip button works for optional steps
  - [ ] Complete button finishes wizard
- [ ] Step component tests:
  - [ ] Each step validates required fields
  - [ ] Data changes propagate correctly
  - [ ] Mobile responsive layout
- [ ] Integration test:
  - [ ] Install module, verify wizard shows
  - [ ] Complete wizard, verify settings applied
  - [ ] Revisit dashboard, verify wizard doesn't show

---

## 🔄 Rollback Plan

If issues occur:

1. **Skip onboarding in module settings**:
   ```sql
   UPDATE site_module_installations 
   SET settings = settings || '{"onboarding_completed": true}'
   WHERE module_id = 'ecommerce';
   ```

2. **Revert dashboard changes**:
   - Remove onboarding condition from ecommerce-dashboard.tsx

3. **Verify clean state**:
   ```bash
   npx tsc --noEmit
   ```

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add PHASE-ECOM-53 completion note
- `progress.md`: Mark Wave 6 as complete

---

## ✨ Success Criteria

- [ ] Onboarding wizard displays on first dashboard visit
- [ ] All 6 steps render correctly with proper data binding
- [ ] Step data persists to database
- [ ] Currency/tax settings apply to store
- [ ] Shipping settings apply correctly
- [ ] Payment provider selection works
- [ ] First product creation optional but functional
- [ ] Launch step shows configuration summary
- [ ] Wizard can be skipped entirely
- [ ] Dashboard loads normally after completion
- [ ] All TypeScript compiles without errors

---

## 📚 Related Phases

- **PHASE-ECOM-50**: Installation Hooks (triggers onboarding check)
- **PHASE-ECOM-51**: Auto-Page Generation (pages created before onboarding)
- **PHASE-ECOM-52**: Navigation Setup (navigation added before onboarding)

This phase completes Wave 6 by providing the guided setup experience that helps users configure their store after module installation.

---

## 🎉 Wave 6 Complete!

With PHASE-ECOM-53 complete, the E-Commerce Module is now feature-complete with:

1. ✅ **Automatic page creation** on module install
2. ✅ **Navigation auto-setup** with cart icon widget
3. ✅ **Hook system** for install/uninstall lifecycle
4. ✅ **Onboarding wizard** for guided configuration

Users can now:
1. Install the e-commerce module
2. See pages automatically created (/shop, /cart, /checkout)
3. See cart icon in header
4. Be guided through store configuration
5. Start selling immediately!
