/**
 * Module Installation Hook Types
 * 
 * PHASE-ECOM-50: Module Installation Hook System
 * 
 * Type definitions for the module hook system that enables
 * automatic site configuration when modules are installed.
 */

// ============================================================================
// HOOK RESULT TYPES
// ============================================================================

/**
 * Result returned from an installation hook
 */
export interface InstallHookResult {
  /** Whether the hook executed successfully */
  success: boolean;
  
  /** List of page slugs created by the hook */
  pagesCreated?: string[];
  
  /** List of navigation item IDs added */
  navItemsAdded?: string[];
  
  /** Settings that were applied */
  settingsApplied?: Record<string, unknown>;
  
  /** Any errors that occurred during hook execution */
  errors?: string[];
  
  /** Additional metadata from the hook */
  metadata?: Record<string, unknown>;
}

/**
 * Result returned from an uninstallation hook
 */
export interface UninstallHookResult {
  /** Whether the hook executed successfully */
  success: boolean;
  
  /** List of page slugs removed or marked as orphaned */
  pagesRemoved?: string[];
  
  /** List of navigation item IDs removed */
  navItemsRemoved?: string[];
  
  /** Settings that were cleaned up */
  settingsCleaned?: string[];
  
  /** Any errors that occurred during hook execution */
  errors?: string[];
  
  /** Additional metadata from the hook */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

/**
 * Module installation hook interface
 * 
 * Modules implement this interface to define behavior when
 * they are installed, uninstalled, enabled, or disabled on a site.
 */
export interface ModuleInstallationHook {
  /** Module ID this hook is for */
  moduleId: string;
  
  /**
   * Called after the module is installed on a site.
   * Use this to create pages, add navigation, apply settings.
   * 
   * @param siteId - The ID of the site the module was installed on
   * @param settings - Optional initial settings passed during installation
   * @returns Result object with details of what was created
   */
  onInstall: (
    siteId: string,
    settings?: Record<string, unknown>
  ) => Promise<InstallHookResult>;
  
  /**
   * Called before the module is uninstalled from a site.
   * Use this to clean up pages, navigation, settings.
   * 
   * NOTE: Module data tables are NOT deleted by default.
   * Users must explicitly delete data if they want to remove it.
   * 
   * @param siteId - The ID of the site the module is being uninstalled from
   * @returns Result object with details of what was cleaned up
   */
  onUninstall: (siteId: string) => Promise<UninstallHookResult>;
  
  /**
   * Called when the module is enabled on a site.
   * The module remains installed but was previously disabled.
   * 
   * @param siteId - The ID of the site
   */
  onEnable?: (siteId: string) => Promise<void>;
  
  /**
   * Called when the module is disabled on a site.
   * The module remains installed but becomes inactive.
   * 
   * @param siteId - The ID of the site
   */
  onDisable?: (siteId: string) => Promise<void>;
}

// ============================================================================
// HOOK OPTIONS
// ============================================================================

/**
 * Options for hook execution
 */
export interface HookExecutionOptions {
  /** Skip page creation even if hook defines pages */
  skipPageCreation?: boolean;
  
  /** Skip navigation modification even if hook defines nav items */
  skipNavigation?: boolean;
  
  /** Skip settings application */
  skipSettings?: boolean;
  
  /** Include sample/demo data */
  includeSampleData?: boolean;
  
  /** Custom data to pass to the hook */
  customData?: Record<string, unknown>;
}

// ============================================================================
// PAGE TEMPLATE TYPES
// ============================================================================

/**
 * Page template definition for auto-creation
 */
export interface PageTemplate {
  /** URL slug for the page */
  slug: string;
  
  /** Page title */
  title: string;
  
  /** SEO meta title */
  metaTitle?: string;
  
  /** SEO meta description */
  metaDescription?: string;
  
  /** Page status after creation */
  status?: 'draft' | 'published';
  
  /** DRAMAC Studio content structure */
  content: StudioPageTemplate;
  
  /** Whether this is a dynamic route (e.g., /products/[slug]) */
  isDynamic?: boolean;
  
  /** Dynamic route pattern */
  dynamicPattern?: string;
}

/**
 * Studio page template content structure
 */
export interface StudioPageTemplate {
  /** Schema version */
  version: '1.0';
  
  /** Root configuration */
  root: {
    id: 'root';
    type: 'Root';
    props: {
      title?: string;
      description?: string;
      styles?: {
        backgroundColor?: string;
        maxWidth?: string;
        padding?: string;
      };
    };
    children: string[];
  };
  
  /** Components indexed by ID */
  components: Record<string, StudioComponentTemplate>;
}

/**
 * Studio component template structure
 */
export interface StudioComponentTemplate {
  /** Component unique ID */
  id: string;
  
  /** Component type (matches registry) */
  type: string;
  
  /** Component properties */
  props: Record<string, unknown>;
  
  /** Child component IDs */
  children?: string[];
  
  /** Parent component ID */
  parentId?: string;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

/**
 * Navigation item definition for auto-addition
 */
export interface NavigationItemTemplate {
  /** Unique identifier for the nav item */
  id: string;
  
  /** Display label */
  label: string;
  
  /** Link href */
  href: string;
  
  /** Optional icon name (Lucide icon) */
  icon?: string;
  
  /** Position in navigation */
  position: 'main' | 'utility' | 'footer';
  
  /** Sort order within position */
  sortOrder?: number;
  
  /** Child navigation items */
  children?: NavigationItemTemplate[];
  
  /** Dynamic badge (e.g., cart count) */
  badge?: string;
  
  /** CSS class for styling */
  className?: string;
}

// ============================================================================
// SAMPLE DATA TYPES
// ============================================================================

/**
 * Sample data definition for optional demo content
 */
export interface SampleDataDefinition {
  /** Sample categories to create */
  categories?: Array<{
    name: string;
    slug: string;
    description?: string;
  }>;
  
  /** Sample products to create */
  products?: Array<{
    name: string;
    slug: string;
    description?: string;
    price: number;
    images?: string[];
    categorySlug?: string;
  }>;
}
