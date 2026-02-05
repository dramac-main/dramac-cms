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
} from '../types/onboarding-types';
import { updateSettings } from './settings-actions';

// ============================================================================
// HELPER FUNCTION: Get E-commerce Module UUID
// ============================================================================

/**
 * Get the e-commerce module's UUID from its slug
 * The modules_v2 table has slug='ecommerce', but site_module_installations uses the UUID
 */
async function getEcommerceModuleUuid(): Promise<string | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  
  // Try modules_v2 first
  const { data: moduleData } = await db
    .from('modules_v2')
    .select('id')
    .eq('slug', 'ecommerce')
    .single();
  
  if (moduleData?.id) {
    return moduleData.id;
  }
  
  // Fallback to module_source
  const { data: sourceModule } = await db
    .from('module_source')
    .select('id')
    .eq('slug', 'ecommerce')
    .single();
  
  return sourceModule?.id || null;
}

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
    // Get the e-commerce module UUID
    const moduleUuid = await getEcommerceModuleUuid();
    
    if (!moduleUuid) {
      return { success: false, status: null, error: 'E-commerce module not found in database' };
    }
    
    // Get module installation settings using UUID
    const { data: installation, error } = await db
      .from('site_module_installations')
      .select('settings')
      .eq('site_id', siteId)
      .eq('module_id', moduleUuid)
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
    // Get the e-commerce module UUID
    const moduleUuid = await getEcommerceModuleUuid();
    
    if (!moduleUuid) {
      return { success: false, error: 'E-commerce module not found in database' };
    }
    
    // Get current installation settings using UUID
    const { data: installation, error: fetchError } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', moduleUuid)
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
    // Get the e-commerce module UUID
    const moduleUuid = await getEcommerceModuleUuid();
    
    if (!moduleUuid) {
      return { success: false, error: 'E-commerce module not found in database' };
    }
    
    const { data: installation, error: fetchError } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', moduleUuid)
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
    // Get the e-commerce module UUID
    const moduleUuid = await getEcommerceModuleUuid();
    
    if (!moduleUuid) {
      return { success: false, error: 'E-commerce module not found in database' };
    }
    
    const { data: installation, error: fetchError } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', moduleUuid)
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
    // Get the e-commerce module UUID
    const moduleUuid = await getEcommerceModuleUuid();
    
    if (!moduleUuid) {
      return { success: false, error: 'E-commerce module not found in database' };
    }
    
    const { data: installation, error: fetchError } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', moduleUuid)
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
  const supabase = await createClient();
  
  // Get the site's agency_id
  const { data: site } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single();
  
  const agencyId = site?.agency_id;
  
  if (!agencyId) {
    console.error('[Onboarding] Could not find agency_id for site:', siteId);
    return;
  }
  
  try {
    switch (step) {
      case 1: // Store Basics
        if (data.storeBasics) {
          await updateSettings(siteId, agencyId, 'general', {
            store_name: data.storeBasics.storeName,
            store_description: data.storeBasics.storeDescription,
            store_email: data.storeBasics.contactEmail,
            store_phone: data.storeBasics.contactPhone,
            store_address: data.storeBasics.businessAddress,
            logo_url: data.storeBasics.logoUrl,
          });
        }
        break;

      case 2: // Currency & Tax
        if (data.currencyTax) {
          await updateSettings(siteId, agencyId, 'currency', {
            default_currency: data.currencyTax.currency,
            currency_symbol: data.currencyTax.currencySymbol,
            currency_position: data.currencyTax.currencyPosition,
            thousand_separator: data.currencyTax.thousandsSeparator,
            decimal_separator: data.currencyTax.decimalSeparator,
          });
          await updateSettings(siteId, agencyId, 'tax', {
            tax_enabled: data.currencyTax.taxEnabled,
            default_tax_rate: data.currencyTax.taxRate,
            prices_include_tax: data.currencyTax.taxIncludedInPrice,
          });
        }
        break;

      case 3: // Shipping
        if (data.shipping) {
          await updateSettings(siteId, agencyId, 'shipping', {
            enable_shipping: data.shipping.shippingEnabled,
            free_shipping_enabled: data.shipping.freeShippingEnabled,
            free_shipping_threshold: data.shipping.freeShippingThreshold,
            default_shipping_rate: data.shipping.defaultShippingRate,
          });
        }
        break;

      case 4: // Payments
        if (data.payments) {
          await updateSettings(siteId, agencyId, 'payments', {
            accepted_methods: data.payments.paymentProviders.map(p => p.provider),
            manual_orders_enabled: data.payments.manualOrdersEnabled,
          });
        }
        break;

      case 5: // First Product
        // Product creation handled separately if user creates one
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
