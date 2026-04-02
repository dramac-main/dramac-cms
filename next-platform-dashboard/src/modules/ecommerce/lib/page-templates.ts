/**
 * E-Commerce Page Templates
 *
 * PHASE-ECOM-51: Auto-Page Generation & Templates
 *
 * Pre-configured page templates for automatic creation when
 * the e-commerce module is installed on a site.
 */

import type { StudioPageData } from "@/types/studio";
import type { PageDefinition } from "../types/setup-types";
import {
  createEmptyPage,
  createSection,
  createContainer,
  createHeading,
  createText,
  addProductGrid,
  addProductCatalog,
  addCategoryNav,
  addBreadcrumb,
  addCartPage,
  addCheckoutPage,
  addOrderConfirmation,
  addOrderTracking,
  addSearchBar,
  addFeaturedProducts,
  addValuePropositions,
  resetIdCounter,
  genId,
  addComponent,
} from "./template-utils";

// ============================================================================
// SHOP PAGE TEMPLATE
// ============================================================================

/**
 * Create the main shop page template
 * URL: /shop
 *
 * World-class e-commerce layout:
 * 1. Full-width hero banner with search and call-to-action
 * 2. Value propositions strip (free shipping, secure checkout, etc.)
 * 3. Featured products carousel (bestsellers / new arrivals)
 * 4. Category navigation with icons
 * 5. New arrivals section
 * 6. Full product catalog with filters, sorting, search, and pagination
 * 7. Newsletter signup CTA
 *
 * All colors intentionally left empty — branding system injects via CSS variables.
 */
export function createShopPageTemplate(): StudioPageData {
  resetIdCounter();
  const page = createEmptyPage("Shop");

  // ── 1. Hero Banner ───────────────────────────────────────
  // Full-width hero with gradient overlay, large heading, subtitle, and search
  const heroSection = createSection(page, {
    padding: "80px 24px 72px",
    backgroundColor: "", // Brand system handles this
  });

  const heroContainer = createContainer(page, heroSection, {
    alignItems: "center",
    gap: "24px",
  });

  createHeading(page, heroContainer, "Explore Our Collection", 1);
  createText(
    page,
    heroContainer,
    "Discover premium products curated just for you. Quality, style, and value — all in one place.",
    {
      fontSize: "18px",
      textAlign: "center",
      maxWidth: "600px",
    },
  );
  addSearchBar(page, heroContainer, {
    placeholder: "Search products, categories, brands...",
    showSuggestions: true,
  });

  // ── 2. Value Propositions Strip ──────────────────────────
  // Trust signals: free shipping, secure payments, easy returns, support
  const trustSection = createSection(page, {
    padding: "32px 24px",
  });

  addValuePropositions(page, trustSection);

  // ── 3. Featured Products (Bestsellers) ───────────────────
  const featuredSection = createSection(page, {
    padding: "56px 24px",
  });

  addFeaturedProducts(page, featuredSection, {
    title: "Bestsellers",
    limit: 8,
  });

  // ── 4. Category Navigation ───────────────────────────────
  const categorySection = createSection(page, {
    padding: "40px 24px",
    backgroundColor: "", // Brand system handles this
  });

  const categoryContainer = createContainer(page, categorySection, {
    alignItems: "center",
    gap: "24px",
  });

  createHeading(page, categoryContainer, "Shop by Category", 2);
  addCategoryNav(page, categoryContainer, {
    variant: "cards",
    showIcons: true,
    showCount: true,
  });

  // ── 5. New Arrivals Section ──────────────────────────────
  const newArrivalsSection = createSection(page, {
    padding: "56px 24px",
  });

  addFeaturedProducts(page, newArrivalsSection, {
    title: "New Arrivals",
    limit: 4,
  });

  // ── 6. Full Product Catalog ──────────────────────────────
  // Enhanced catalog with search, filters, sort, pagination, view modes
  const catalogSection = createSection(page, {
    padding: "56px 24px",
  });

  const catalogContainer = createContainer(page, catalogSection, {
    gap: "24px",
  });

  addBreadcrumb(page, catalogContainer, { showHome: true });
  createHeading(page, catalogContainer, "All Products", 2);
  addProductCatalog(page, catalogContainer, {
    columns: 4,
    showFilters: true,
    showSort: true,
    showSearch: true,
    productsPerPage: 12,
  });

  // ── 7. Newsletter / CTA Section ──────────────────────────
  const ctaSection = createSection(page, {
    padding: "64px 24px",
    backgroundColor: "", // Brand system handles this
  });

  const ctaContainer = createContainer(page, ctaSection, {
    alignItems: "center",
    gap: "16px",
  });

  createHeading(page, ctaContainer, "Stay in the Loop", 2);
  createText(
    page,
    ctaContainer,
    "Be the first to know about new arrivals, exclusive deals, and special offers.",
    {
      fontSize: "16px",
      textAlign: "center",
      maxWidth: "500px",
    },
  );

  return page;
}

/**
 * Shop page definition
 */
export const shopPageDefinition: PageDefinition = {
  slug: "shop",
  title: "Shop",
  metaTitle: "Shop - Browse Our Products",
  metaDescription:
    "Browse our collection of products. Find the perfect items for you with easy filtering and search.",
  status: "published",
  content: createShopPageTemplate(),
  moduleCreated: true,
  moduleId: "ecommerce",
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
  const page = createEmptyPage("Shopping Cart");

  // Main Section
  const mainSection = createSection(page, {
    padding: "32px 24px",
  });

  const mainContainer = createContainer(page, mainSection, {
    gap: "24px",
  });

  addBreadcrumb(page, mainContainer, { showHome: true });
  createHeading(page, mainContainer, "Your Shopping Cart", 1);
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
  slug: "cart",
  title: "Shopping Cart",
  metaTitle: "Your Shopping Cart",
  metaDescription:
    "Review the items in your shopping cart and proceed to checkout.",
  status: "published",
  content: createCartPageTemplate(),
  moduleCreated: true,
  moduleId: "ecommerce",
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
  const page = createEmptyPage("Checkout");

  // Main Section
  const mainSection = createSection(page, {
    padding: "32px 24px",
  });

  const mainContainer = createContainer(page, mainSection, {
    gap: "24px",
  });

  addBreadcrumb(page, mainContainer, { showHome: true });
  createHeading(page, mainContainer, "Checkout", 1);
  addCheckoutPage(page, mainContainer, {
    steps: ["shipping", "payment", "review"],
    showOrderSummary: true,
    enableGuestCheckout: true,
  });

  return page;
}

/**
 * Checkout page definition
 */
export const checkoutPageDefinition: PageDefinition = {
  slug: "checkout",
  title: "Checkout",
  metaTitle: "Checkout - Complete Your Order",
  metaDescription:
    "Complete your order securely. Enter your shipping and payment details.",
  status: "published",
  content: createCheckoutPageTemplate(),
  moduleCreated: true,
  moduleId: "ecommerce",
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
  const page = createEmptyPage("Order Confirmed");

  // Main Section
  const mainSection = createSection(page, {
    padding: "64px 24px",
  });

  const mainContainer = createContainer(page, mainSection, {
    alignItems: "center",
    gap: "32px",
  });

  addOrderConfirmation(page, mainContainer);

  // Recommended Products Section
  const shopSection = createSection(page, {
    padding: "64px 24px",
  });

  addFeaturedProducts(page, shopSection, {
    title: "You Might Also Like",
    limit: 4,
  });

  return page;
}

/**
 * Order confirmation page definition
 */
export const orderConfirmationPageDefinition: PageDefinition = {
  slug: "order-confirmation",
  title: "Order Confirmed",
  metaTitle: "Order Confirmed - Thank You!",
  metaDescription:
    "Your order has been confirmed. Thank you for your purchase!",
  status: "published",
  content: createOrderConfirmationTemplate(),
  moduleCreated: true,
  moduleId: "ecommerce",
};

// ============================================================================
// ORDER TRACKING PAGE TEMPLATE
// ============================================================================

/**
 * Create the order tracking page template
 * URL: /order-tracking
 */
export function createOrderTrackingTemplate(): StudioPageData {
  resetIdCounter();
  const page = createEmptyPage("Track Your Order");

  // Main Section
  const mainSection = createSection(page, {
    padding: "64px 24px",
  });

  const mainContainer = createContainer(page, mainSection, {
    alignItems: "center",
    gap: "32px",
  });

  addOrderTracking(page, mainContainer);

  return page;
}

/**
 * Order tracking page definition
 */
export const orderTrackingPageDefinition: PageDefinition = {
  slug: "order-tracking",
  title: "Track Your Order",
  metaTitle: "Track Your Order",
  metaDescription:
    "Look up your order status by entering your email and order number.",
  status: "published",
  content: createOrderTrackingTemplate(),
  moduleCreated: true,
  moduleId: "ecommerce",
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
  const page = createEmptyPage("Product Detail");

  // Breadcrumb Section
  const breadcrumbSection = createSection(page, {
    padding: "16px 24px",
  });

  addBreadcrumb(page, breadcrumbSection, { showHome: true });

  // Product Detail Section
  const productSection = createSection(page, {
    padding: "32px 24px",
  });

  // Product detail component with gallery, info, add to cart
  const productContainer = createContainer(page, productSection, {
    display: "grid",
    gap: "48px",
  });

  // The ProductDetailBlock handles the full product display
  // It reads the product slug from the URL and fetches data
  const productDetailId = genId("productdetail");
  page.components[productDetailId] = {
    id: productDetailId,
    type: "ProductDetailBlock",
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
      galleryPosition: "left",
      stickyAddToCart: true,
    },
    parentId: productContainer,
  };
  page.root.children.push(productDetailId);

  // Related Products Section
  const relatedSection = createSection(page, {
    padding: "48px 24px",
  });

  addFeaturedProducts(page, relatedSection, {
    title: "Related Products",
    limit: 4,
  });

  return page;
}

/**
 * Product detail page definition (dynamic route metadata)
 */
export const productDetailPageDefinition: PageDefinition = {
  slug: "products/[slug]",
  title: "Product Detail",
  metaTitle: "{{product.name}} - Shop",
  metaDescription: "{{product.description}}",
  status: "published",
  content: createProductDetailTemplate(),
  moduleCreated: true,
  moduleId: "ecommerce",
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
  const page = createEmptyPage("Category");

  // Hero Section with Category Info
  const heroSection = createSection(page, {
    padding: "32px 24px",
  });

  const heroContainer = createContainer(page, heroSection, {
    alignItems: "center",
    gap: "16px",
  });

  // CategoryHeroBlock reads category from URL slug
  const categoryHeroId = genId("categoryhero");
  page.components[categoryHeroId] = {
    id: categoryHeroId,
    type: "CategoryHeroBlock",
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
    padding: "32px 24px",
  });

  const productsContainer = createContainer(page, productsSection, {
    gap: "24px",
  });

  addBreadcrumb(page, productsContainer, { showHome: true });

  // ProductGrid with category filter from URL
  addProductGrid(page, productsContainer, {
    columns: { mobile: 2, tablet: 3, desktop: 4 },
    showFilters: true,
    showSort: true,
    productsPerPage: 12,
    categoryFilter: "{{category.slug}}", // Dynamic from URL
  });

  return page;
}

/**
 * Category page definition (dynamic route metadata)
 */
export const categoryPageDefinition: PageDefinition = {
  slug: "categories/[slug]",
  title: "Category",
  metaTitle: "{{category.name}} - Shop by Category",
  metaDescription:
    "Browse {{category.name}} products. {{category.description}}",
  status: "published",
  content: createCategoryPageTemplate(),
  moduleCreated: true,
  moduleId: "ecommerce",
};

// ============================================================================
// QUOTE REQUEST PAGE TEMPLATE
// ============================================================================

/**
 * Create the quote request page template
 * URL: /quotes
 *
 * This page is created on-demand when quotation mode is enabled
 * in settings, and removed when quotation mode is disabled.
 * The QuoteRequestBlock handles the full quote submission flow.
 */
export function createQuoteRequestTemplate(): StudioPageData {
  resetIdCounter();
  const page = createEmptyPage("Submit Your Quote");

  // Header Section
  const headerSection = createSection(page, {
    padding: "32px 24px",
  });

  const headerContainer = createContainer(page, headerSection, {
    alignItems: "center",
    gap: "16px",
  });

  createHeading(page, headerContainer, "Submit Your Quote", 1);

  // Quote Form Section
  const formSection = createSection(page, {
    padding: "32px 24px",
  });

  const formContainer = createContainer(page, formSection, {
    gap: "24px",
  });

  addBreadcrumb(page, formContainer, { showHome: true });

  addComponent(
    page,
    {
      type: "EcommerceQuoteRequest",
      props: {
        showNotes: true,
        requirePhone: false,
      },
    },
    formContainer,
  );

  return page;
}

/**
 * Quote request page definition
 */
export const quotePageDefinition: PageDefinition = {
  slug: "quotes",
  title: "Submit Your Quote",
  metaTitle: "Submit Your Quote",
  metaDescription:
    "Submit a quote request for our products and services. We will get back to you with competitive pricing.",
  status: "published",
  content: createQuoteRequestTemplate(),
  moduleCreated: true,
  moduleId: "ecommerce",
};

// ============================================================================
// CATEGORIES BROWSE PAGE TEMPLATE
// ============================================================================

/**
 * Create the categories browse page template
 * URL: /categories
 *
 * Full-page browsable category grid with search, layout toggle,
 * subcategory chips, and responsive columns.
 * Uses the EcommerceCategoriesPage studio component.
 */
export function createCategoriesBrowseTemplate(): StudioPageData {
  resetIdCounter();
  const page = createEmptyPage("Categories");

  // Single section wrapping the EcommerceCategoriesPage component
  const mainSection = createSection(page, {
    padding: "0",
  });

  const categoriesBlockId = genId("categoriespage");
  page.components[categoriesBlockId] = {
    id: categoriesBlockId,
    type: "EcommerceCategoriesPage",
    props: {},
    parentId: mainSection,
  };
  page.root.children.push(categoriesBlockId);

  return page;
}

/**
 * Categories browse page definition
 */
export const categoriesBrowsePageDefinition: PageDefinition = {
  slug: "categories",
  title: "Categories",
  metaTitle: "Browse Categories",
  metaDescription:
    "Browse all product categories. Find exactly what you need by exploring our organized collection.",
  status: "published",
  content: createCategoriesBrowseTemplate(),
  moduleCreated: true,
  moduleId: "ecommerce",
};

// ============================================================================
// ALL PAGE DEFINITIONS
// ============================================================================

/**
 * Core e-commerce page definitions - always created on activation
 * NOTE: quotePageDefinition is NOT included here. It is created/deleted
 * dynamically when quotation mode is toggled on/off in settings.
 */
export const ecommercePageDefinitions: PageDefinition[] = [
  shopPageDefinition,
  cartPageDefinition,
  checkoutPageDefinition,
  orderConfirmationPageDefinition,
  categoriesBrowsePageDefinition,
];

/**
 * Optional page definitions - created on-demand based on settings
 */
// quotePageDefinition is already exported via its const declaration above

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
