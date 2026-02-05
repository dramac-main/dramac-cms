# PHASE-ECOM-51: Auto-Page Generation & Templates

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 8-10 hours
> **Prerequisites**: PHASE-ECOM-50 (Installation Hooks)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Automatically create pre-configured e-commerce pages (Shop, Cart, Checkout, Product Detail, Category) when the module is installed. Each page uses DRAMAC Studio templates with real e-commerce components, providing users with a fully functional storefront immediately upon module installation.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] PHASE-ECOM-50 is complete (hook system working)
- [ ] Review existing Studio components in `src/modules/ecommerce/studio/components/`
- [ ] Review `src/types/studio.ts` for page data structure
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Auto-Page Generation Flow                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Installation Hook (ECOM-50)                                        │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────┐                                       │
│  │ createEcommercePages()  │                                       │
│  └───────────┬─────────────┘                                       │
│              │                                                      │
│    ┌─────────┴─────────┬─────────────┬─────────────┐              │
│    ▼                   ▼             ▼             ▼              │
│ ┌──────────┐    ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│ │ /shop    │    │ /cart    │  │/checkout │  │ /order-  │         │
│ │          │    │          │  │          │  │confirmed │         │
│ └────┬─────┘    └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│      │               │             │             │                 │
│      ▼               ▼             ▼             ▼                 │
│ ┌──────────────────────────────────────────────────────┐          │
│ │              Studio Page Templates                    │          │
│ │  (Pre-configured with e-commerce components)         │          │
│ └──────────────────────────────────────────────────────┘          │
│                                                                     │
│  Dynamic Routes (metadata only):                                    │
│  ┌──────────────────┐  ┌──────────────────┐                       │
│  │ /products/[slug] │  │/categories/[slug]│                       │
│  └──────────────────┘  └──────────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/lib/page-templates.ts` | Create | All page template definitions |
| `src/modules/ecommerce/lib/template-utils.ts` | Create | Helper functions for template generation |
| `src/modules/ecommerce/actions/auto-setup-actions.ts` | Create | Server actions for page creation |
| `src/modules/ecommerce/types/setup-types.ts` | Create | Type definitions for auto-setup |

---

## 📋 Implementation Tasks

### Task 51.1: Create Setup Type Definitions

**File**: `src/modules/ecommerce/types/setup-types.ts`
**Action**: Create

**Description**: Define types for the auto-setup system.

```typescript
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
```

---

### Task 51.2: Create Template Utilities

**File**: `src/modules/ecommerce/lib/template-utils.ts`
**Action**: Create

**Description**: Helper functions for generating page templates.

```typescript
/**
 * E-Commerce Template Utilities
 * 
 * PHASE-ECOM-51: Auto-Page Generation & Templates
 * 
 * Helper functions for generating Studio page content.
 */

import type { StudioPageData, StudioComponent } from '@/types/studio';

// ============================================================================
// ID GENERATION
// ============================================================================

let componentCounter = 0;

/**
 * Generate a unique component ID
 */
export function genId(prefix: string = 'comp'): string {
  componentCounter++;
  return `${prefix}_${Date.now()}_${componentCounter}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Reset the component counter (for testing)
 */
export function resetIdCounter(): void {
  componentCounter = 0;
}

// ============================================================================
// PAGE BUILDER
// ============================================================================

/**
 * Create a new empty page data structure
 */
export function createEmptyPage(title?: string): StudioPageData {
  return {
    version: '1.0',
    root: {
      id: 'root',
      type: 'Root',
      props: {
        title: title || 'Untitled Page',
        styles: {
          backgroundColor: '#ffffff',
          maxWidth: '1280px',
          padding: '0',
        },
      },
      children: [],
    },
    components: {},
  };
}

/**
 * Add a component to the page
 */
export function addComponent(
  page: StudioPageData,
  component: Omit<StudioComponent, 'id'>,
  parentId?: string
): string {
  const id = genId(component.type.toLowerCase());
  
  const fullComponent: StudioComponent = {
    ...component,
    id,
    parentId: parentId || 'root',
  };
  
  page.components[id] = fullComponent;
  
  // Add to parent's children
  if (parentId && page.components[parentId]) {
    const parent = page.components[parentId];
    parent.children = parent.children || [];
    parent.children.push(id);
  } else {
    // Add to root
    page.root.children.push(id);
  }
  
  return id;
}

/**
 * Create a section wrapper component
 */
export function createSection(
  page: StudioPageData,
  props: {
    padding?: string;
    backgroundColor?: string;
    maxWidth?: string;
  } = {}
): string {
  return addComponent(page, {
    type: 'Section',
    props: {
      padding: props.padding || '48px 24px',
      backgroundColor: props.backgroundColor || 'transparent',
      maxWidth: props.maxWidth || '1280px',
      margin: '0 auto',
    },
  });
}

/**
 * Create a container component
 */
export function createContainer(
  page: StudioPageData,
  parentId: string,
  props: {
    display?: string;
    flexDirection?: string;
    gap?: string;
    alignItems?: string;
    justifyContent?: string;
  } = {}
): string {
  return addComponent(page, {
    type: 'Container',
    props: {
      display: props.display || 'flex',
      flexDirection: props.flexDirection || 'column',
      gap: props.gap || '24px',
      alignItems: props.alignItems || 'stretch',
      justifyContent: props.justifyContent || 'flex-start',
      width: '100%',
    },
  }, parentId);
}

/**
 * Create a text/heading component
 */
export function createHeading(
  page: StudioPageData,
  parentId: string,
  text: string,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 2
): string {
  return addComponent(page, {
    type: 'Heading',
    props: {
      text,
      level,
      fontSize: level === 1 ? '36px' : level === 2 ? '28px' : '22px',
      fontWeight: '700',
      color: '#111827',
      marginBottom: '16px',
    },
  }, parentId);
}

// ============================================================================
// E-COMMERCE COMPONENT HELPERS
// ============================================================================

/**
 * Add a ProductGrid component
 */
export function addProductGrid(
  page: StudioPageData,
  parentId: string,
  props: {
    columns?: { mobile: number; tablet: number; desktop: number };
    showFilters?: boolean;
    showSort?: boolean;
    productsPerPage?: number;
    categoryFilter?: string;
  } = {}
): string {
  return addComponent(page, {
    type: 'ProductGridBlock',
    props: {
      columns: props.columns || { mobile: 2, tablet: 3, desktop: 4 },
      showFilters: props.showFilters ?? true,
      showSort: props.showSort ?? true,
      productsPerPage: props.productsPerPage || 12,
      categoryFilter: props.categoryFilter || null,
      gap: '24px',
      showPagination: true,
    },
  }, parentId);
}

/**
 * Add a CategoryNav component
 */
export function addCategoryNav(
  page: StudioPageData,
  parentId: string,
  props: {
    layout?: 'horizontal' | 'vertical';
    showIcons?: boolean;
    showCount?: boolean;
  } = {}
): string {
  return addComponent(page, {
    type: 'CategoryNavBlock',
    props: {
      layout: props.layout || 'horizontal',
      showIcons: props.showIcons ?? true,
      showCount: props.showCount ?? true,
      gap: '16px',
    },
  }, parentId);
}

/**
 * Add a Breadcrumb component
 */
export function addBreadcrumb(
  page: StudioPageData,
  parentId: string,
  props: {
    showHome?: boolean;
    separator?: string;
  } = {}
): string {
  return addComponent(page, {
    type: 'BreadcrumbBlock',
    props: {
      showHome: props.showHome ?? true,
      separator: props.separator || '/',
      homeLabel: 'Home',
    },
  }, parentId);
}

/**
 * Add a CartPage component
 */
export function addCartPage(
  page: StudioPageData,
  parentId: string,
  props: {
    showRecommendations?: boolean;
    showCouponInput?: boolean;
  } = {}
): string {
  return addComponent(page, {
    type: 'CartPageBlock',
    props: {
      showRecommendations: props.showRecommendations ?? true,
      showCouponInput: props.showCouponInput ?? true,
      emptyCartMessage: 'Your cart is empty',
      emptyCartAction: 'Continue Shopping',
      emptyCartHref: '/shop',
    },
  }, parentId);
}

/**
 * Add a CheckoutPage component
 */
export function addCheckoutPage(
  page: StudioPageData,
  parentId: string,
  props: {
    steps?: string[];
    showOrderSummary?: boolean;
    enableGuestCheckout?: boolean;
  } = {}
): string {
  return addComponent(page, {
    type: 'CheckoutPageBlock',
    props: {
      steps: props.steps || ['shipping', 'payment', 'review'],
      showOrderSummary: props.showOrderSummary ?? true,
      enableGuestCheckout: props.enableGuestCheckout ?? true,
      showExpressCheckout: true,
    },
  }, parentId);
}

/**
 * Add an OrderConfirmation component
 */
export function addOrderConfirmation(
  page: StudioPageData,
  parentId: string
): string {
  return addComponent(page, {
    type: 'OrderConfirmationBlock',
    props: {
      showOrderDetails: true,
      showShippingInfo: true,
      showNextSteps: true,
      continueShoppingHref: '/shop',
      trackOrderEnabled: true,
    },
  }, parentId);
}

/**
 * Add a SearchBar component
 */
export function addSearchBar(
  page: StudioPageData,
  parentId: string,
  props: {
    placeholder?: string;
    showSuggestions?: boolean;
  } = {}
): string {
  return addComponent(page, {
    type: 'SearchBarBlock',
    props: {
      placeholder: props.placeholder || 'Search products...',
      showSuggestions: props.showSuggestions ?? true,
      showRecentSearches: true,
    },
  }, parentId);
}

/**
 * Add a FilterSidebar component
 */
export function addFilterSidebar(
  page: StudioPageData,
  parentId: string
): string {
  return addComponent(page, {
    type: 'FilterSidebarBlock',
    props: {
      showPriceFilter: true,
      showCategoryFilter: true,
      showStockFilter: true,
      showRatingFilter: true,
      collapsible: true,
    },
  }, parentId);
}

/**
 * Add a FeaturedProducts component
 */
export function addFeaturedProducts(
  page: StudioPageData,
  parentId: string,
  props: {
    title?: string;
    limit?: number;
  } = {}
): string {
  return addComponent(page, {
    type: 'FeaturedProductsBlock',
    props: {
      title: props.title || 'Featured Products',
      limit: props.limit || 4,
      columns: { mobile: 2, tablet: 3, desktop: 4 },
      showViewAll: true,
      viewAllHref: '/shop',
    },
  }, parentId);
}
```

---

### Task 51.3: Create Page Templates

**File**: `src/modules/ecommerce/lib/page-templates.ts`
**Action**: Create

**Description**: Define all e-commerce page templates using Studio format.

```typescript
/**
 * E-Commerce Page Templates
 * 
 * PHASE-ECOM-51: Auto-Page Generation & Templates
 * 
 * Pre-configured page templates for automatic creation when
 * the e-commerce module is installed on a site.
 */

import type { StudioPageData } from '@/types/studio';
import type { PageDefinition } from '../types/setup-types';
import {
  createEmptyPage,
  createSection,
  createContainer,
  createHeading,
  addProductGrid,
  addCategoryNav,
  addBreadcrumb,
  addCartPage,
  addCheckoutPage,
  addOrderConfirmation,
  addSearchBar,
  addFeaturedProducts,
  resetIdCounter,
} from './template-utils';

// ============================================================================
// SHOP PAGE TEMPLATE
// ============================================================================

/**
 * Create the main shop page template
 * URL: /shop
 */
export function createShopPageTemplate(): StudioPageData {
  resetIdCounter();
  const page = createEmptyPage('Shop');
  
  // Hero Section with Search
  const heroSection = createSection(page, {
    padding: '32px 24px',
    backgroundColor: '#f9fafb',
  });
  
  const heroContainer = createContainer(page, heroSection, {
    alignItems: 'center',
    gap: '24px',
  });
  
  createHeading(page, heroContainer, 'Shop Our Products', 1);
  addSearchBar(page, heroContainer, {
    placeholder: 'Search for products...',
    showSuggestions: true,
  });
  
  // Category Navigation
  const categorySection = createSection(page, {
    padding: '24px',
  });
  
  addCategoryNav(page, categorySection, {
    layout: 'horizontal',
    showIcons: true,
    showCount: true,
  });
  
  // Main Product Grid Section
  const mainSection = createSection(page, {
    padding: '32px 24px',
  });
  
  const mainContainer = createContainer(page, mainSection, {
    gap: '32px',
  });
  
  addBreadcrumb(page, mainContainer, { showHome: true });
  addProductGrid(page, mainContainer, {
    columns: { mobile: 2, tablet: 3, desktop: 4 },
    showFilters: true,
    showSort: true,
    productsPerPage: 12,
  });
  
  return page;
}

/**
 * Shop page definition
 */
export const shopPageDefinition: PageDefinition = {
  slug: 'shop',
  title: 'Shop',
  metaTitle: 'Shop - Browse Our Products',
  metaDescription: 'Browse our collection of products. Find the perfect items for you with easy filtering and search.',
  status: 'published',
  content: createShopPageTemplate(),
  moduleCreated: true,
  moduleId: 'ecommerce',
};

// ============================================================================
// CART PAGE TEMPLATE
// ============================================================================

/**
 * Create the cart page template
 * URL: /cart
 */
export function createCartPageTemplate(): StudioPageData {
  resetIdCounter();
  const page = createEmptyPage('Shopping Cart');
  
  // Main Section
  const mainSection = createSection(page, {
    padding: '32px 24px',
  });
  
  const mainContainer = createContainer(page, mainSection, {
    gap: '24px',
  });
  
  addBreadcrumb(page, mainContainer, { showHome: true });
  createHeading(page, mainContainer, 'Your Shopping Cart', 1);
  addCartPage(page, mainContainer, {
    showRecommendations: true,
    showCouponInput: true,
  });
  
  return page;
}

/**
 * Cart page definition
 */
export const cartPageDefinition: PageDefinition = {
  slug: 'cart',
  title: 'Shopping Cart',
  metaTitle: 'Your Shopping Cart',
  metaDescription: 'Review the items in your shopping cart and proceed to checkout.',
  status: 'published',
  content: createCartPageTemplate(),
  moduleCreated: true,
  moduleId: 'ecommerce',
};

// ============================================================================
// CHECKOUT PAGE TEMPLATE
// ============================================================================

/**
 * Create the checkout page template
 * URL: /checkout
 */
export function createCheckoutPageTemplate(): StudioPageData {
  resetIdCounter();
  const page = createEmptyPage('Checkout');
  
  // Main Section
  const mainSection = createSection(page, {
    padding: '32px 24px',
    backgroundColor: '#f9fafb',
  });
  
  const mainContainer = createContainer(page, mainSection, {
    gap: '24px',
    maxWidth: '1024px',
  });
  
  addBreadcrumb(page, mainContainer, { showHome: true });
  createHeading(page, mainContainer, 'Checkout', 1);
  addCheckoutPage(page, mainContainer, {
    steps: ['shipping', 'payment', 'review'],
    showOrderSummary: true,
    enableGuestCheckout: true,
  });
  
  return page;
}

/**
 * Checkout page definition
 */
export const checkoutPageDefinition: PageDefinition = {
  slug: 'checkout',
  title: 'Checkout',
  metaTitle: 'Checkout - Complete Your Order',
  metaDescription: 'Complete your order securely. Enter your shipping and payment details.',
  status: 'published',
  content: createCheckoutPageTemplate(),
  moduleCreated: true,
  moduleId: 'ecommerce',
};

// ============================================================================
// ORDER CONFIRMATION PAGE TEMPLATE
// ============================================================================

/**
 * Create the order confirmation page template
 * URL: /order-confirmation
 */
export function createOrderConfirmationTemplate(): StudioPageData {
  resetIdCounter();
  const page = createEmptyPage('Order Confirmed');
  
  // Main Section
  const mainSection = createSection(page, {
    padding: '48px 24px',
    backgroundColor: '#f0fdf4', // Light green background
  });
  
  const mainContainer = createContainer(page, mainSection, {
    alignItems: 'center',
    gap: '32px',
    maxWidth: '800px',
  });
  
  addOrderConfirmation(page, mainContainer);
  
  // Continue Shopping Section
  const shopSection = createSection(page, {
    padding: '48px 24px',
  });
  
  const shopContainer = createContainer(page, shopSection, {
    gap: '24px',
  });
  
  createHeading(page, shopContainer, 'Continue Shopping', 2);
  addFeaturedProducts(page, shopContainer, {
    title: 'You Might Also Like',
    limit: 4,
  });
  
  return page;
}

/**
 * Order confirmation page definition
 */
export const orderConfirmationPageDefinition: PageDefinition = {
  slug: 'order-confirmation',
  title: 'Order Confirmed',
  metaTitle: 'Order Confirmed - Thank You!',
  metaDescription: 'Your order has been confirmed. Thank you for your purchase!',
  status: 'published',
  content: createOrderConfirmationTemplate(),
  moduleCreated: true,
  moduleId: 'ecommerce',
};

// ============================================================================
// PRODUCT DETAIL PAGE TEMPLATE (Dynamic)
// ============================================================================

/**
 * Create the product detail page template
 * URL: /products/[slug]
 * 
 * Note: This is a template for dynamic pages. The actual product data
 * is loaded at runtime based on the slug parameter.
 */
export function createProductDetailTemplate(): StudioPageData {
  resetIdCounter();
  const page = createEmptyPage('Product Detail');
  
  // Breadcrumb Section
  const breadcrumbSection = createSection(page, {
    padding: '16px 24px',
  });
  
  addBreadcrumb(page, breadcrumbSection, { showHome: true });
  
  // Product Detail Section
  const productSection = createSection(page, {
    padding: '32px 24px',
  });
  
  // Product detail component with gallery, info, add to cart
  const productContainer = createContainer(page, productSection, {
    display: 'grid',
    gap: '48px',
  });
  
  // The ProductDetailBlock handles the full product display
  // It reads the product slug from the URL and fetches data
  page.components[`productdetail_${Date.now()}`] = {
    id: `productdetail_${Date.now()}`,
    type: 'ProductDetailBlock',
    props: {
      showGallery: true,
      showVariants: true,
      showQuantity: true,
      showAddToCart: true,
      showWishlist: true,
      showShare: true,
      showDescription: true,
      showSpecifications: true,
      showReviews: true,
      galleryPosition: 'left',
      stickyAddToCart: true,
    },
    parentId: productContainer,
  };
  page.root.children.push(`productdetail_${Date.now()}`);
  
  // Related Products Section
  const relatedSection = createSection(page, {
    padding: '48px 24px',
    backgroundColor: '#f9fafb',
  });
  
  addFeaturedProducts(page, relatedSection, {
    title: 'Related Products',
    limit: 4,
  });
  
  return page;
}

/**
 * Product detail page definition (dynamic route metadata)
 */
export const productDetailPageDefinition: PageDefinition = {
  slug: 'products/[slug]',
  title: 'Product Detail',
  metaTitle: '{{product.name}} - Shop',
  metaDescription: '{{product.description}}',
  status: 'published',
  content: createProductDetailTemplate(),
  moduleCreated: true,
  moduleId: 'ecommerce',
};

// ============================================================================
// CATEGORY PAGE TEMPLATE (Dynamic)
// ============================================================================

/**
 * Create the category page template
 * URL: /categories/[slug]
 */
export function createCategoryPageTemplate(): StudioPageData {
  resetIdCounter();
  const page = createEmptyPage('Category');
  
  // Hero Section with Category Info
  const heroSection = createSection(page, {
    padding: '32px 24px',
    backgroundColor: '#f9fafb',
  });
  
  const heroContainer = createContainer(page, heroSection, {
    alignItems: 'center',
    gap: '16px',
  });
  
  // CategoryHeroBlock reads category from URL slug
  page.components[`categoryhero_${Date.now()}`] = {
    id: `categoryhero_${Date.now()}`,
    type: 'CategoryHeroBlock',
    props: {
      showImage: true,
      showDescription: true,
      showProductCount: true,
    },
    parentId: heroContainer,
  };
  page.root.children.push(`categoryhero_${Date.now()}`);
  
  // Products Section
  const productsSection = createSection(page, {
    padding: '32px 24px',
  });
  
  const productsContainer = createContainer(page, productsSection, {
    gap: '24px',
  });
  
  addBreadcrumb(page, productsContainer, { showHome: true });
  
  // ProductGrid with category filter from URL
  addProductGrid(page, productsContainer, {
    columns: { mobile: 2, tablet: 3, desktop: 4 },
    showFilters: true,
    showSort: true,
    productsPerPage: 12,
    categoryFilter: '{{category.slug}}', // Dynamic from URL
  });
  
  return page;
}

/**
 * Category page definition (dynamic route metadata)
 */
export const categoryPageDefinition: PageDefinition = {
  slug: 'categories/[slug]',
  title: 'Category',
  metaTitle: '{{category.name}} - Shop by Category',
  metaDescription: 'Browse {{category.name}} products. {{category.description}}',
  status: 'published',
  content: createCategoryPageTemplate(),
  moduleCreated: true,
  moduleId: 'ecommerce',
};

// ============================================================================
// ALL PAGE DEFINITIONS
// ============================================================================

/**
 * All e-commerce page definitions for auto-creation
 */
export const ecommercePageDefinitions: PageDefinition[] = [
  shopPageDefinition,
  cartPageDefinition,
  checkoutPageDefinition,
  orderConfirmationPageDefinition,
];

/**
 * Dynamic route definitions (stored as metadata, not actual pages)
 */
export const ecommerceDynamicRoutes: PageDefinition[] = [
  productDetailPageDefinition,
  categoryPageDefinition,
];

/**
 * Get all page definitions including dynamic routes
 */
export function getAllPageDefinitions(): PageDefinition[] {
  return [...ecommercePageDefinitions, ...ecommerceDynamicRoutes];
}

/**
 * Get static page definitions only (no dynamic routes)
 */
export function getStaticPageDefinitions(): PageDefinition[] {
  return ecommercePageDefinitions;
}
```

---

### Task 51.4: Create Auto-Setup Server Actions

**File**: `src/modules/ecommerce/actions/auto-setup-actions.ts`
**Action**: Create

**Description**: Server actions for creating pages, navigation, and settings.

```typescript
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
    const { data: modulesPages } = await db
      .from('pages')
      .select('id, slug, metadata')
      .eq('site_id', siteId)
      .contains('metadata', { module_id: moduleId });
    
    if (!modulesPages || modulesPages.length === 0) {
      return result;
    }
    
    // Option 1: Delete the pages entirely
    // const { error } = await db
    //   .from('pages')
    //   .delete()
    //   .in('id', modulesPages.map(p => p.id));
    
    // Option 2: Mark as orphaned (safer - preserves user changes)
    for (const page of modulesPages) {
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
      if (navArray.some(n => n.id === item.id)) {
        continue;
      }
      
      // Insert at correct position based on sortOrder
      const insertIndex = navArray.findIndex(n => (n.sortOrder || 0) > item.sortOrder);
      if (insertIndex === -1) {
        navArray.push(item);
      } else {
        navArray.splice(insertIndex, 0, item);
      }
      
      result.itemsAdded.push(item.id);
    }
    
    // Add footer items
    for (const item of ECOMMERCE_FOOTER_ITEMS) {
      if (currentNav.footer.some(n => n.id === item.id)) {
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
    // Get the module installation to update its settings
    const { data: installation } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', 'ecommerce')
      .single();
    
    if (!installation) {
      result.success = false;
      result.errors?.push('E-commerce module not installed');
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
    // Get the module installation
    const { data: installation } = await db
      .from('site_module_installations')
      .select('id, settings')
      .eq('site_id', siteId)
      .eq('module_id', 'ecommerce')
      .single();
    
    if (installation?.settings) {
      // Remove auto-setup markers but keep user settings
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
  
  // Check module settings
  const { data: installation } = await db
    .from('site_module_installations')
    .select('settings')
    .eq('site_id', siteId)
    .eq('module_id', 'ecommerce')
    .single();
  
  return {
    pagesCreated: pagesCheck.exists,
    navigationAdded: hasShopNav && hasCartNav,
    settingsApplied: installation?.settings?._autoSetupApplied || false,
    onboardingCompleted: installation?.settings?.onboardingCompleted || false,
  };
}
```

---

## 🗄️ Database Migrations

No new database tables required. Uses existing tables:
- `pages` - For storing created pages
- `sites` - For navigation settings and dynamic route definitions
- `site_module_installations` - For module settings

**Note**: The `pages` table should support a `metadata` JSONB column. If not present, add this migration:

```sql
-- migrations/ecom-51-pages-metadata.sql

-- Add metadata column to pages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE pages ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add index for module_id lookups in metadata
CREATE INDEX IF NOT EXISTS idx_pages_metadata_module_id 
  ON pages ((metadata->>'module_id'));

COMMENT ON COLUMN pages.metadata IS 'Page metadata including module_created flag and module_id for auto-created pages';
```

---

## 🔧 Type Definitions

All types are defined in Task 51.1 (`src/modules/ecommerce/types/setup-types.ts`).

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] Page template tests:
  - [ ] `createShopPageTemplate()` returns valid StudioPageData
  - [ ] `createCartPageTemplate()` returns valid StudioPageData
  - [ ] `createCheckoutPageTemplate()` returns valid StudioPageData
  - [ ] `createOrderConfirmationTemplate()` returns valid StudioPageData
- [ ] Page creation tests:
  - [ ] `createEcommercePages()` creates all expected pages
  - [ ] Pages are not duplicated if they already exist
  - [ ] Pages have correct metadata marking them as module-created
- [ ] Navigation tests:
  - [ ] `addEcommerceNavigation()` adds Shop and Cart links
  - [ ] Navigation items respect sortOrder
  - [ ] `removeEcommerceNavigation()` removes only e-commerce items
- [ ] Settings tests:
  - [ ] `applyDefaultEcommerceSettings()` sets correct defaults
  - [ ] Custom initial settings override defaults
- [ ] Integration test:
  - [ ] Install e-commerce module on test site
  - [ ] Verify /shop page is created and accessible
  - [ ] Verify /cart page is created and accessible
  - [ ] Verify /checkout page is created and accessible

---

## 🔄 Rollback Plan

If issues occur:

1. **Delete created pages**:
   ```sql
   DELETE FROM pages 
   WHERE site_id = 'YOUR_SITE_ID' 
   AND metadata->>'module_id' = 'ecommerce';
   ```

2. **Remove navigation items**:
   - Call `removeEcommerceNavigation(siteId)`

3. **Clear settings**:
   - Call `clearEcommerceSetupData(siteId)`

4. **Verify clean state**:
   ```bash
   npx tsc --noEmit
   ```

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add PHASE-ECOM-51 completion note
- `progress.md`: Update Wave 6 section

---

## ✨ Success Criteria

- [ ] Shop page template is complete with ProductGrid, CategoryNav, SearchBar
- [ ] Cart page template is complete with CartPageBlock
- [ ] Checkout page template is complete with CheckoutPageBlock
- [ ] Order confirmation page template is complete
- [ ] Dynamic route definitions are stored for products/categories
- [ ] All pages are created in database with correct content
- [ ] Pages are marked with module metadata for cleanup
- [ ] Navigation items are added in correct positions
- [ ] Default store settings are applied
- [ ] Setup status can be queried for any site
- [ ] All TypeScript compiles without errors

---

## 📚 Related Phases

- **PHASE-ECOM-50**: Installation Hooks (triggers page creation)
- **PHASE-ECOM-52**: Navigation & Widget Auto-Setup (cart icon widget)
- **PHASE-ECOM-53**: Onboarding Wizard (guides user through first-time setup)

This phase creates the actual page content that users will see immediately after module installation.
