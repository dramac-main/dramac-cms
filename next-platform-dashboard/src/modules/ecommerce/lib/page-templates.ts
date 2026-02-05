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
  genId,
  addComponent,
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
  const productDetailId = genId('productdetail');
  page.components[productDetailId] = {
    id: productDetailId,
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
  page.root.children.push(productDetailId);
  
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
  const categoryHeroId = genId('categoryhero');
  page.components[categoryHeroId] = {
    id: categoryHeroId,
    type: 'CategoryHeroBlock',
    props: {
      showImage: true,
      showDescription: true,
      showProductCount: true,
    },
    parentId: heroContainer,
  };
  page.root.children.push(categoryHeroId);
  
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
