/**
 * E-Commerce Auto-Setup Type Definitions
 * 
 * PHASE-ECOM-51: Auto-Page Generation & Templates
 * 
 * Types for automatic page creation and site configuration.
 */

import type { StudioPageData, StudioComponent } from '@/types/studio';

// ============================================================================
// PAGE CREATION TYPES
// ============================================================================

/**
 * Result of creating e-commerce pages
 */
export interface CreatePagesResult {
  success: boolean;
  pages: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
  errors?: string[];
}

/**
 * Result of deleting module-created pages
 */
export interface DeletePagesResult {
  success: boolean;
  pagesRemoved: string[];
  errors?: string[];
}

/**
 * Page definition for creation
 */
export interface PageDefinition {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  status: 'draft' | 'published';
  content: StudioPageData;
  moduleCreated: boolean;
  moduleId: string;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

/**
 * Result of adding navigation items
 */
export interface AddNavigationResult {
  success: boolean;
  itemsAdded: string[];
  errors?: string[];
}

/**
 * Result of removing navigation items
 */
export interface RemoveNavigationResult {
  success: boolean;
  itemsRemoved: string[];
  errors?: string[];
}

/**
 * Navigation item definition
 */
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  position: 'main' | 'utility' | 'footer';
  sortOrder: number;
  badge?: string;
  moduleId?: string;
}

/**
 * Site navigation structure
 */
export interface SiteNavigation {
  main: NavigationItem[];
  utility: NavigationItem[];
  footer: NavigationItem[];
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

/**
 * Result of applying default settings
 */
export interface ApplySettingsResult {
  success: boolean;
  settings: Record<string, unknown>;
  errors?: string[];
}

/**
 * Result of clearing setup data
 */
export interface ClearSetupDataResult {
  success: boolean;
  settingsCleaned: string[];
  errors?: string[];
}

/**
 * Default e-commerce store settings
 */
export interface DefaultStoreSettings {
  storeName: string;
  currency: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  taxEnabled: boolean;
  taxRate: number;
  taxIncluded: boolean;
  shippingEnabled: boolean;
  freeShippingThreshold: number | null;
  checkoutGuestEnabled: boolean;
  inventoryTrackingEnabled: boolean;
  lowStockThreshold: number;
  onboardingCompleted: boolean;
  onboardingStep: number;
}

// ============================================================================
// DYNAMIC ROUTE TYPES
// ============================================================================

/**
 * Dynamic route definition for products/categories
 */
export interface DynamicRouteDefinition {
  pattern: string;
  pageType: 'product' | 'category';
  template: StudioPageData;
}

/**
 * Result of creating dynamic routes
 */
export interface CreateDynamicRoutesResult {
  success: boolean;
  routes: string[];
  errors?: string[];
}

// ============================================================================
// COMPONENT TEMPLATE TYPES
// ============================================================================

/**
 * Helper type for creating Studio components in templates
 */
export interface ComponentTemplate {
  type: string;
  props: Record<string, unknown>;
  children?: ComponentTemplate[];
}

/**
 * Generates a unique component ID
 */
export function generateComponentId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Converts component template to StudioComponent format
 */
export function templateToComponent(
  template: ComponentTemplate,
  parentId?: string
): { component: StudioComponent; children: StudioComponent[] } {
  const id = generateComponentId();
  const childComponents: StudioComponent[] = [];
  const childIds: string[] = [];

  if (template.children) {
    for (const childTemplate of template.children) {
      const result = templateToComponent(childTemplate, id);
      childIds.push(result.component.id);
      childComponents.push(result.component, ...result.children);
    }
  }

  const component: StudioComponent = {
    id,
    type: template.type,
    props: template.props,
    children: childIds.length > 0 ? childIds : undefined,
    parentId,
  };

  return { component, children: childComponents };
}
