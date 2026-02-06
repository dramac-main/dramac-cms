/**
 * E-Commerce Module Installation Hook
 * 
 * PHASE-ECOM-50: Module Installation Hook System
 * 
 * Handles automatic site configuration when the e-commerce module
 * is installed, including page creation, navigation setup, and
 * default settings application.
 */

import type {
  ModuleInstallationHook,
  InstallHookResult,
  UninstallHookResult,
} from '@/lib/modules/hooks/types';
import { createEcommercePages, deletePagesCreatedByModule } from '../actions/auto-setup-actions';
import { addEcommerceNavigation, removeEcommerceNavigation } from '../actions/auto-setup-actions';
import { applyDefaultEcommerceSettings, clearEcommerceSetupData } from '../actions/auto-setup-actions';

// ============================================================================
// E-COMMERCE INSTALLATION HOOK
// ============================================================================

/**
 * E-commerce module installation hook
 * 
 * When the e-commerce module is installed on a site, this hook:
 * 1. Creates default e-commerce pages (Shop, Cart, Checkout, etc.)
 * 2. Adds navigation items (Shop link, Cart icon)
 * 3. Applies default store settings
 * 4. Optionally creates sample data for demo purposes
 */
export const ecommerceInstallationHook: ModuleInstallationHook = {
  moduleId: 'ecommerce',
  
  /**
   * Handle module installation
   */
  async onInstall(
    siteId: string,
    settings?: Record<string, unknown>
  ): Promise<InstallHookResult> {
    console.log(`[EcommerceHook] Installing e-commerce on site: ${siteId}`);
    
    const result: InstallHookResult = {
      success: true,
      pagesCreated: [],
      navItemsAdded: [],
      settingsApplied: {},
      errors: [],
    };
    
    // Extract hook options if provided
    const hookOptions = settings?.__hookOptions as {
      skipPageCreation?: boolean;
      skipNavigation?: boolean;
      skipSettings?: boolean;
      includeSampleData?: boolean;
    } | undefined;
    
    // 1. Create default e-commerce pages
    if (!hookOptions?.skipPageCreation) {
      try {
        const pagesResult = await createEcommercePages(siteId);
        
        if (pagesResult.success) {
          result.pagesCreated = pagesResult.pages.map(p => p.slug);
          console.log(
            `[EcommerceHook] Created ${result.pagesCreated.length} pages`
          );
        } else {
          result.errors?.push(...(pagesResult.errors || ['Failed to create pages']));
        }
      } catch (error) {
        console.error('[EcommerceHook] Page creation failed:', error);
        result.errors?.push(
          error instanceof Error ? error.message : 'Page creation failed'
        );
      }
    }
    
    // 2. Add navigation items
    if (!hookOptions?.skipNavigation) {
      try {
        const navResult = await addEcommerceNavigation(siteId);
        
        if (navResult.success) {
          result.navItemsAdded = navResult.itemsAdded;
          console.log(
            `[EcommerceHook] Added ${result.navItemsAdded.length} nav items`
          );
        } else {
          result.errors?.push('Failed to add navigation items');
        }
      } catch (error) {
        console.error('[EcommerceHook] Navigation setup failed:', error);
        result.errors?.push(
          error instanceof Error ? error.message : 'Navigation setup failed'
        );
      }
    }
    
    // 3. Apply default settings
    if (!hookOptions?.skipSettings) {
      try {
        const settingsResult = await applyDefaultEcommerceSettings(siteId, settings);
        
        if (settingsResult.success) {
          result.settingsApplied = settingsResult.settings;
          console.log('[EcommerceHook] Applied default settings');
        } else {
          result.errors?.push('Failed to apply default settings');
        }
      } catch (error) {
        console.error('[EcommerceHook] Settings application failed:', error);
        result.errors?.push(
          error instanceof Error ? error.message : 'Settings application failed'
        );
      }
    }
    
    // 4. Create sample data if requested
    if (hookOptions?.includeSampleData) {
      try {
        // Sample data creation would go here
        // This is handled by the onboarding wizard in PHASE-ECOM-53
        console.log('[EcommerceHook] Sample data creation delegated to onboarding');
      } catch (error) {
        console.error('[EcommerceHook] Sample data creation failed:', error);
        // Non-critical, don't add to errors
      }
    }
    
    // Determine overall success
    // We consider it successful if at least pages or nav were set up
    const hasCreations = 
      (result.pagesCreated?.length || 0) > 0 ||
      (result.navItemsAdded?.length || 0) > 0;
    
    result.success = hasCreations || (result.errors?.length || 0) === 0;
    
    console.log(`[EcommerceHook] Installation complete:`, {
      success: result.success,
      pages: result.pagesCreated?.length,
      nav: result.navItemsAdded?.length,
      errors: result.errors?.length,
    });
    
    return result;
  },
  
  /**
   * Handle module uninstallation
   */
  async onUninstall(siteId: string): Promise<UninstallHookResult> {
    console.log(`[EcommerceHook] Uninstalling e-commerce from site: ${siteId}`);
    
    const result: UninstallHookResult = {
      success: true,
      pagesRemoved: [],
      navItemsRemoved: [],
      settingsCleaned: [],
      errors: [],
    };
    
    // 1. Remove or mark pages as orphaned
    try {
      const pagesResult = await deletePagesCreatedByModule(siteId, 'ecommerce');
      
      if (pagesResult.success) {
        result.pagesRemoved = pagesResult.pagesRemoved;
        console.log(
          `[EcommerceHook] Removed/orphaned ${result.pagesRemoved.length} pages`
        );
      } else {
        result.errors?.push(...(pagesResult.errors || ['Failed to remove pages']));
      }
    } catch (error) {
      console.error('[EcommerceHook] Page removal failed:', error);
      result.errors?.push(
        error instanceof Error ? error.message : 'Page removal failed'
      );
    }
    
    // 2. Remove navigation items
    try {
      const navResult = await removeEcommerceNavigation(siteId);
      
      if (navResult.success) {
        result.navItemsRemoved = navResult.itemsRemoved;
        console.log(
          `[EcommerceHook] Removed ${result.navItemsRemoved.length} nav items`
        );
      } else {
        result.errors?.push('Failed to remove navigation items');
      }
    } catch (error) {
      console.error('[EcommerceHook] Navigation cleanup failed:', error);
      result.errors?.push(
        error instanceof Error ? error.message : 'Navigation cleanup failed'
      );
    }
    
    // 3. Clean up setup data (but NOT product data)
    try {
      const cleanupResult = await clearEcommerceSetupData(siteId);
      
      if (cleanupResult.success) {
        result.settingsCleaned = cleanupResult.settingsCleaned;
        console.log('[EcommerceHook] Cleaned up setup data');
      }
    } catch (error) {
      console.error('[EcommerceHook] Setup data cleanup failed:', error);
      // Non-critical
    }
    
    // NOTE: We intentionally do NOT delete:
    // - Products
    // - Categories
    // - Orders
    // - Customers
    // - Quotes
    // These are user data and should only be deleted explicitly by the user
    
    result.success = (result.errors?.length || 0) === 0;
    
    console.log(`[EcommerceHook] Uninstallation complete:`, {
      success: result.success,
      pagesRemoved: result.pagesRemoved?.length,
      navRemoved: result.navItemsRemoved?.length,
      errors: result.errors?.length,
    });
    
    return result;
  },
  
  /**
   * Handle module enable
   * 
   * This is called when an agency user enables the module on a site.
   * We treat enable like a fresh install - creating pages if they don't exist.
   */
  async onEnable(siteId: string): Promise<void> {
    console.log(`[EcommerceHook] Enabling e-commerce on site: ${siteId}`);
    
    // 1. Create pages if they don't exist (idempotent operation)
    try {
      const pagesResult = await createEcommercePages(siteId);
      if (pagesResult.pages.length > 0) {
        console.log(`[EcommerceHook] Created ${pagesResult.pages.length} pages on enable`);
      }
    } catch (error) {
      console.error('[EcommerceHook] Failed to create pages on enable:', error);
    }
    
    // 2. Re-add navigation items if they were removed
    try {
      await addEcommerceNavigation(siteId);
    } catch (error) {
      console.error('[EcommerceHook] Failed to restore navigation on enable:', error);
    }
    
    // 3. Apply default settings if not already set
    try {
      await applyDefaultEcommerceSettings(siteId);
    } catch (error) {
      console.error('[EcommerceHook] Failed to apply settings on enable:', error);
    }
  },
  
  /**
   * Handle module disable
   */
  async onDisable(siteId: string): Promise<void> {
    console.log(`[EcommerceHook] Disabling e-commerce on site: ${siteId}`);
    
    // Optionally hide navigation items
    // We don't remove pages since they might have SEO value
    try {
      await removeEcommerceNavigation(siteId);
    } catch (error) {
      console.error('[EcommerceHook] Failed to remove navigation on disable:', error);
    }
  },
};
