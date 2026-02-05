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
    type: 'EcommerceProductGrid',
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
