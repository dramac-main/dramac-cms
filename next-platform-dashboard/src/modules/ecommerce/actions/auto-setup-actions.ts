/**
 * E-Commerce Auto-Setup Server Actions
 * 
 * PHASE-ECOM-51: Auto-Page Generation & Templates
 * 
 * Server actions for automatic page creation, navigation setup,
 * and default settings application.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  CreatePagesResult,
  DeletePagesResult,
  AddNavigationResult,
  RemoveNavigationResult,
  ApplySettingsResult,
  ClearSetupDataResult,
  DefaultStoreSettings,
  SiteNavigation,
  NavigationItem,
} from '../types/setup-types';
import {
  ecommercePageDefinitions,
  ecommerceDynamicRoutes,
} from '../lib/page-templates';

// ============================================================================
// HELPER FUNCTIONS
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
// PAGE CREATION
// ============================================================================

/**
 * Create all e-commerce pages for a site
 */
export async function createEcommercePages(
  siteId: string
): Promise<CreatePagesResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  
  const result: CreatePagesResult = {
    success: true,
    pages: [],
    errors: [],
  };
  
  // Get existing pages to avoid conflicts
  const { data: existingPages } = await db
    .from('pages')
    .select('slug')
    .eq('site_id', siteId);
  
  const existingSlugs = new Set(existingPages?.map((p: { slug: string }) => p.slug) || []);
  
  // Create static pages
  for (const pageDef of ecommercePageDefinitions) {
    // Skip if page already exists
    if (existingSlugs.has(pageDef.slug)) {
      console.log(`[AutoSetup] Page /${pageDef.slug} already exists, skipping`);
      continue;
    }
    
    try {
      const { data: page, error } = await db
        .from('pages')
        .insert({
          site_id: siteId,
          slug: pageDef.slug,
          title: pageDef.title,
          content: pageDef.content,
          meta_title: pageDef.metaTitle,
          meta_description: pageDef.metaDescription,
          status: pageDef.status,
          // Mark as module-created for cleanup
          metadata: {
            module_created: true,
            module_id: pageDef.moduleId,
            created_by: 'ecommerce-auto-setup',
          },
        })
        .select('id, slug, title')
        .single();
      
      if (error) {
        console.error(`[AutoSetup] Failed to create page /${pageDef.slug}:`, error);
        result.errors?.push(`Failed to create /${pageDef.slug}: ${error.message}`);
      } else {
        result.pages.push({
          id: page.id,
          slug: page.slug,
          title: page.title,
        });
        console.log(`[AutoSetup] Created page /${pageDef.slug}`);
      }
    } catch (err) {
      console.error(`[AutoSetup] Error creating page /${pageDef.slug}:`, err);
      result.errors?.push(`Error creating /${pageDef.slug}`);
    }
  }
  
  // Store dynamic route definitions in site settings
  // These are used by the router to handle /products/[slug] and /categories/[slug]
  try {
    await storeDynamicRouteDefinitions(siteId, ecommerceDynamicRoutes);
    console.log('[AutoSetup] Stored dynamic route definitions');
  } catch (err) {
    console.error('[AutoSetup] Failed to store dynamic routes:', err);
    result.errors?.push('Failed to store dynamic route definitions');
  }
  
  result.success = result.pages.length > 0 || (result.errors?.length || 0) === 0;
  
  return result;
}

/**
 * Store dynamic route definitions for a site
 */
async function storeDynamicRouteDefinitions(
  siteId: string,
  routes: typeof ecommerceDynamicRoutes
): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  
  // Get current site settings
  const { data: site } = await db
    .from('sites')
    .select('settings')
    .eq('id', siteId)
    .single();
  
  const currentSettings = site?.settings || {};
  
  // Add dynamic routes to settings
  const updatedSettings = {
    ...currentSettings,
    ecommerce_dynamic_routes: routes.map(r => ({
      pattern: r.slug,
      title: r.title,
      metaTitle: r.metaTitle,
      metaDescription: r.metaDescription,
      content: r.content,
    })),
  };
  
  await db
    .from('sites')
    .update({ settings: updatedSettings })
    .eq('id', siteId);
}

/**
 * Delete or mark pages created by a module
 */
export async function deletePagesCreatedByModule(
  siteId: string,
  moduleId: string
): Promise<DeletePagesResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  
  const result: DeletePagesResult = {
    success: true,
    pagesRemoved: [],
    errors: [],
  };
  
  try {
    // Find pages created by this module
    // Using a raw filter since Supabase doesn't have native JSONB contains support via SDK
    const { data: allPages } = await db
      .from('pages')
      .select('id, slug, metadata')
      .eq('site_id', siteId);
    
    // Filter pages that have module_id in metadata
    const modulePages = (allPages || []).filter(
      (p: { metadata?: { module_id?: string } }) => 
        p.metadata?.module_id === moduleId
    );
    
    if (!modulePages || modulePages.length === 0) {
      return result;
    }
    
    // Option 2: Mark as orphaned (safer - preserves user changes)
    for (const page of modulePages) {
      const { error } = await db
        .from('pages')
        .update({
          metadata: {
            ...page.metadata,
            module_orphaned: true,
            module_removed_at: new Date().toISOString(),
          },
        })
        .eq('id', page.id);
      
      if (error) {
        result.errors?.push(`Failed to orphan page /${page.slug}`);
      } else {
        result.pagesRemoved.push(page.slug);
      }
    }
    
    // Remove dynamic route definitions
    await removeDynamicRouteDefinitions(siteId);
    
  } catch (err) {
    console.error('[AutoSetup] Error removing pages:', err);
    result.errors?.push('Error removing module pages');
    result.success = false;
  }
  
  return result;
}

/**
 * Remove dynamic route definitions from site settings
 */
async function removeDynamicRouteDefinitions(siteId: string): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  
  const { data: site } = await db
    .from('sites')
    .select('settings')
    .eq('id', siteId)
    .single();
  
  if (site?.settings?.ecommerce_dynamic_routes) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ecommerce_dynamic_routes, ...restSettings } = site.settings;
    
    await db
      .from('sites')
      .update({ settings: restSettings })
      .eq('id', siteId);
  }
}

// ============================================================================
// NAVIGATION SETUP
// ============================================================================

/**
 * Default e-commerce navigation items
 */
const ECOMMERCE_NAV_ITEMS: NavigationItem[] = [
  {
    id: 'ecom-shop',
    label: 'Shop',
    href: '/shop',
    icon: 'ShoppingBag',
    position: 'main',
    sortOrder: 100, // After Home, before Contact
    moduleId: 'ecommerce',
  },
  {
    id: 'ecom-cart',
    label: 'Cart',
    href: '/cart',
    icon: 'ShoppingCart',
    position: 'utility',
    sortOrder: 10,
    badge: '{{cartCount}}', // Dynamic badge
    moduleId: 'ecommerce',
  },
];

/**
 * E-commerce footer links
 */
const ECOMMERCE_FOOTER_ITEMS: NavigationItem[] = [
  {
    id: 'ecom-footer-shop',
    label: 'Shop All',
    href: '/shop',
    position: 'footer',
    sortOrder: 1,
    moduleId: 'ecommerce',
  },
  {
    id: 'ecom-footer-cart',
    label: 'My Cart',
    href: '/cart',
    position: 'footer',
    sortOrder: 2,
    moduleId: 'ecommerce',
  },
];

/**
 * Add e-commerce navigation items to a site
 */
export async function addEcommerceNavigation(
  siteId: string
): Promise<AddNavigationResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  
  const result: AddNavigationResult = {
    success: true,
    itemsAdded: [],
    errors: [],
  };
  
  try {
    // Get current site settings
    const { data: site, error: siteError } = await db
      .from('sites')
      .select('settings')
      .eq('id', siteId)
      .single();
    
    if (siteError) {
      result.success = false;
      result.errors?.push('Failed to fetch site settings');
      return result;
    }
    
    const currentSettings = site?.settings || {};
    const currentNav: SiteNavigation = currentSettings.navigation || {
      main: [],
      utility: [],
      footer: [],
    };
    
    // Add main navigation items
    for (const item of ECOMMERCE_NAV_ITEMS) {
      const navArray = item.position === 'main' ? currentNav.main : currentNav.utility;
      
      // Check if already exists
      if (navArray.some((n: NavigationItem) => n.id === item.id)) {
        continue;
      }
      
      // Insert at correct position based on sortOrder
      const insertIndex = navArray.findIndex((n: NavigationItem) => (n.sortOrder || 0) > item.sortOrder);
      if (insertIndex === -1) {
        navArray.push(item);
      } else {
        navArray.splice(insertIndex, 0, item);
      }
      
      result.itemsAdded.push(item.id);
    }
    
    // Add footer items
    for (const item of ECOMMERCE_FOOTER_ITEMS) {
      if (currentNav.footer.some((n: NavigationItem) => n.id === item.id)) {
        continue;
      }
      
      currentNav.footer.push(item);
      result.itemsAdded.push(item.id);
    }
    
    // Save updated navigation
    const { error: updateError } = await db
      .from('sites')
      .update({
        settings: {
          ...currentSettings,
          navigation: currentNav,
        },
      })
      .eq('id', siteId);
    
    if (updateError) {
      result.success = false;
      result.errors?.push('Failed to update site navigation');
    }
    
  } catch (err) {
    console.error('[AutoSetup] Error adding navigation:', err);
    result.success = false;
    result.errors?.push('Error adding navigation items');
  }
  
  return result;
}

/**
 * Remove e-commerce navigation items from a site
 */
export async function removeEcommerceNavigation(
  siteId: string
): Promise<RemoveNavigationResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  
  const result: RemoveNavigationResult = {
    success: true,
    itemsRemoved: [],
    errors: [],
  };
  
  try {
    const { data: site } = await db
      .from('sites')
      .select('settings')
      .eq('id', siteId)
      .single();
    
    if (!site?.settings?.navigation) {
      return result; // No navigation to modify
    }
    
    const nav: SiteNavigation = site.settings.navigation;
    const ecommerceIds = new Set([
      ...ECOMMERCE_NAV_ITEMS.map(i => i.id),
      ...ECOMMERCE_FOOTER_ITEMS.map(i => i.id),
    ]);
    
    // Filter out e-commerce items
    const filterNav = (items: NavigationItem[]): NavigationItem[] =>
      items.filter(item => {
        if (ecommerceIds.has(item.id) || item.moduleId === 'ecommerce') {
          result.itemsRemoved.push(item.id);
          return false;
        }
        return true;
      });
    
    const updatedNav: SiteNavigation = {
      main: filterNav(nav.main || []),
      utility: filterNav(nav.utility || []),
      footer: filterNav(nav.footer || []),
    };
    
    const { error } = await db
      .from('sites')
      .update({
        settings: {
          ...site.settings,
          navigation: updatedNav,
        },
      })
      .eq('id', siteId);
    
    if (error) {
      result.success = false;
      result.errors?.push('Failed to update site navigation');
    }
    
  } catch (err) {
    console.error('[AutoSetup] Error removing navigation:', err);
    result.success = false;
    result.errors?.push('Error removing navigation items');
  }
  
  return result;
}

// ============================================================================
// SETTINGS SETUP
// ============================================================================

/**
 * Default e-commerce store settings
 */
const DEFAULT_STORE_SETTINGS: DefaultStoreSettings = {
  storeName: 'My Store',
  currency: 'USD',
  currencySymbol: '$',
  currencyPosition: 'before',
  taxEnabled: false,
  taxRate: 0,
  taxIncluded: false,
  shippingEnabled: true,
  freeShippingThreshold: null,
  checkoutGuestEnabled: true,
  inventoryTrackingEnabled: true,
  lowStockThreshold: 10,
  onboardingCompleted: false,
  onboardingStep: 0,
};

/**
 * Apply default e-commerce settings to a site
 */
export async function applyDefaultEcommerceSettings(
  siteId: string,
  initialSettings?: Record<string, unknown>
): Promise<ApplySettingsResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  
  const result: ApplySettingsResult = {
    success: true,
    settings: {},
    errors: [],
  };
  
  try {
    // Get the e-commerce module's UUID from its slug
    const moduleUuid = await getEcommerceModuleUuid();
    
    if (!moduleUuid) {
      result.success = false;
      result.errors?.push('E-commerce module not found in database');
      return result;
    }
    
    // Get the module installation to update its settings using the UUID
    const { data: installation } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', moduleUuid)
      .single();
    
    if (!installation) {
      result.success = false;
      result.errors?.push('E-commerce module not installed on this site');
      return result;
    }
    
    // Merge defaults with initial settings
    const mergedSettings = {
      ...DEFAULT_STORE_SETTINGS,
      ...(installation.settings || {}),
      ...(initialSettings || {}),
      // Mark as auto-configured
      _autoSetupApplied: true,
      _autoSetupDate: new Date().toISOString(),
    };
    
    const { error } = await db
      .from('site_module_installations')
      .update({ settings: mergedSettings })
      .eq('id', installation.id);
    
    if (error) {
      result.success = false;
      result.errors?.push('Failed to apply settings');
    } else {
      result.settings = mergedSettings;
    }
    
  } catch (err) {
    console.error('[AutoSetup] Error applying settings:', err);
    result.success = false;
    result.errors?.push('Error applying default settings');
  }
  
  return result;
}

/**
 * Clear e-commerce setup data (but NOT product data)
 */
export async function clearEcommerceSetupData(
  siteId: string
): Promise<ClearSetupDataResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  
  const result: ClearSetupDataResult = {
    success: true,
    settingsCleaned: [],
    errors: [],
  };
  
  try {
    // Get the e-commerce module's UUID
    const moduleUuid = await getEcommerceModuleUuid();
    
    if (!moduleUuid) {
      return result; // Module not found, nothing to clean
    }
    
    // Get the module installation
    const { data: installation } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', moduleUuid)
      .single();
    
    if (installation?.settings) {
      // Remove auto-setup markers but keep user settings
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _autoSetupApplied, _autoSetupDate, ...restSettings } = installation.settings;
      
      await db
        .from('site_module_installations')
        .update({
          settings: {
            ...restSettings,
            onboardingCompleted: false,
            onboardingStep: 0,
          },
        })
        .eq('id', installation.id);
      
      result.settingsCleaned.push('_autoSetupApplied', '_autoSetupDate', 'onboarding');
    }
    
  } catch (err) {
    console.error('[AutoSetup] Error clearing setup data:', err);
    result.success = false;
    result.errors?.push('Error clearing setup data');
  }
  
  return result;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if e-commerce pages exist for a site
 */
export async function checkEcommercePagesExist(
  siteId: string
): Promise<{ exists: boolean; pages: string[] }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  
  const expectedSlugs = ecommercePageDefinitions.map(p => p.slug);
  
  const { data: pages } = await db
    .from('pages')
    .select('slug')
    .eq('site_id', siteId)
    .in('slug', expectedSlugs);
  
  const existingSlugs = pages?.map((p: { slug: string }) => p.slug) || [];
  
  return {
    exists: existingSlugs.length > 0,
    pages: existingSlugs,
  };
}

/**
 * Get e-commerce setup status for a site
 */
export async function getEcommerceSetupStatus(siteId: string): Promise<{
  pagesCreated: boolean;
  navigationAdded: boolean;
  settingsApplied: boolean;
  onboardingCompleted: boolean;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  
  // Check pages
  const pagesCheck = await checkEcommercePagesExist(siteId);
  
  // Check navigation
  const { data: site } = await db
    .from('sites')
    .select('settings')
    .eq('id', siteId)
    .single();
  
  const nav = site?.settings?.navigation;
  const hasShopNav = nav?.main?.some((n: NavigationItem) => n.id === 'ecom-shop');
  const hasCartNav = nav?.utility?.some((n: NavigationItem) => n.id === 'ecom-cart');
  
  // Get the e-commerce module's UUID
  const moduleUuid = await getEcommerceModuleUuid();
  
  // Check module settings using the UUID
  let settingsApplied = false;
  let onboardingCompleted = false;
  
  if (moduleUuid) {
    const { data: installation } = await db
      .from('site_module_installations')
      .select('settings')
      .eq('site_id', siteId)
      .eq('module_id', moduleUuid)
      .single();
    
    settingsApplied = installation?.settings?._autoSetupApplied || false;
    onboardingCompleted = installation?.settings?.onboardingCompleted || false;
  }
  
  return {
    pagesCreated: pagesCheck.exists,
    navigationAdded: hasShopNav && hasCartNav,
    settingsApplied,
    onboardingCompleted,
  };
}
