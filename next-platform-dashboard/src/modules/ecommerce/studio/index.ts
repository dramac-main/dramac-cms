/**
 * E-Commerce Module - Studio Integration
 * 
 * Exports Studio components and custom fields for the visual editor.
 * These components appear in the Studio component library when
 * the E-Commerce module is installed on a site.
 * 
 * Phase ECOM-21: Product Display Components
 * Phase ECOM-22: Cart Components  
 * Phase ECOM-23: Checkout Components
 * Phase ECOM-24: Navigation & Discovery Components
 * Phase ECOM-25: Quotation Frontend Components
 */

import type { ModuleStudioExports } from "@/types/studio-module";
import type { ComponentDefinition } from "@/types/studio";
import { ProductCardBlock, productCardDefinition } from "./components/product-card-block";
import { ProductGridBlock, productGridDefinition } from "./components/product-grid-block";
import { 
  ProductGridBlock as EnhancedProductGridBlock, 
  productGridDefinition as enhancedProductGridDefinition 
} from "./components/ProductGridBlock";
import { 
  FeaturedProductsBlock, 
  featuredProductsDefinition 
} from "./components/FeaturedProductsBlock";
import { ProductQuickView, useProductQuickView } from "./components/ProductQuickView";
import { 
  ProductSelectorField, 
  productSelectorFieldDefinition 
} from "./fields/product-selector-field";
import { 
  CategorySelectorField, 
  categorySelectorFieldDefinition 
} from "./fields/category-selector-field";

// Cart components (ECOM-22)
import { CartPageBlock } from "./components/CartPageBlock";
import { CartDrawerBlock } from "./components/CartDrawerBlock";
import { MiniCartBlock } from "./components/MiniCartBlock";

// Checkout components (ECOM-23)
import { CheckoutPageBlock } from "./components/CheckoutPageBlock";
import { OrderConfirmationBlock } from "./components/OrderConfirmationBlock";

// Navigation & Discovery components (ECOM-24)
import { CategoryNavBlock } from "./components/CategoryNavBlock";
import { SearchBarBlock } from "./components/SearchBarBlock";
import { FilterSidebarBlock } from "./components/FilterSidebarBlock";
import { BreadcrumbBlock } from "./components/BreadcrumbBlock";
import { ProductSortBlock } from "./components/ProductSortBlock";

// Quotation components (ECOM-25)
import { QuoteRequestBlock } from "./components/QuoteRequestBlock";
import { QuoteListBlock } from "./components/QuoteListBlock";
import { QuoteDetailBlock } from "./components/QuoteDetailBlock";

// Review components (ECOM-60)
import { ReviewFormBlock, reviewFormDefinition } from "./components/ReviewFormBlock";
import { ReviewListBlock, reviewListDefinition } from "./components/ReviewListBlock";

// Re-export utility components for external use (ECOM-21)
export { ProductPriceDisplay } from "./components/ProductPriceDisplay";
export { ProductStockBadge } from "./components/ProductStockBadge";
export { ProductRatingDisplay } from "./components/ProductRatingDisplay";
export { ProductImageGallery } from "./components/ProductImageGallery";
export { ProductQuickView, useProductQuickView };

// Re-export Cart components (ECOM-22)
export { CartQuantitySelector } from "./components/CartQuantitySelector";
export { CartEmptyState } from "./components/CartEmptyState";
export { CartItemCard } from "./components/CartItemCard";
export { CartDiscountInput } from "./components/CartDiscountInput";
export { CartSummaryCard } from "./components/CartSummaryCard";
export { CartDrawerBlock, CartPageBlock, MiniCartBlock };

// Re-export Checkout components (ECOM-23)
export { CheckoutStepIndicator } from "./components/CheckoutStepIndicator";
export { AddressForm, ShippingAddressForm, BillingAddressForm } from "./components/AddressForm";
export { ShippingMethodSelector } from "./components/ShippingMethodSelector";
export { PaymentMethodSelector } from "./components/PaymentMethodSelector";
export { OrderSummaryCard } from "./components/OrderSummaryCard";
export { CheckoutPageBlock, OrderConfirmationBlock };

// Re-export Navigation & Discovery components (ECOM-24)
export { CategoryCard } from "./components/CategoryCard";
export { CategoryNavBlock, SearchBarBlock, FilterSidebarBlock, BreadcrumbBlock, ProductSortBlock };
export { ActiveFilters } from "./components/ActiveFilters";

// Re-export Quotation components (ECOM-25)
export { QuoteStatusBadge, getQuoteStatusLabel, getQuoteStatusColor, isQuoteActionable, isQuoteFinal } from "./components/QuoteStatusBadge";
export { QuoteItemCard } from "./components/QuoteItemCard";
export { QuotePriceBreakdown, QuoteSavingsDisplay } from "./components/QuotePriceBreakdown";
export { QuoteActionButtons } from "./components/QuoteActionButtons";
export { QuoteRequestBlock, QuoteListBlock, QuoteDetailBlock };

// Re-export Review components (ECOM-60)
export { ReviewFormBlock, ReviewListBlock };

// =============================================================================
// BLOCK DEFINITIONS (ECOM-22/23/24/25)
// =============================================================================

const cartPageDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceCartPage",
  label: "Shopping Cart",
  description: "Full shopping cart page with items, quantities, and order summary",
  category: "ecommerce",
  icon: "ShoppingCart",
  fields: {
    showContinueShopping: { type: "toggle", label: "Show Continue Shopping", defaultValue: true },
    showDiscountInput: { type: "toggle", label: "Show Discount Code Input", defaultValue: true },
    checkoutUrl: { type: "text", label: "Checkout URL", defaultValue: "/checkout" },
  },
  defaultProps: { showContinueShopping: true, showDiscountInput: true, checkoutUrl: "/checkout" },
};

const cartDrawerDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceCartDrawer",
  label: "Cart Drawer",
  description: "Slide-out cart drawer overlay",
  category: "ecommerce",
  icon: "ShoppingCart",
  fields: {
    position: { type: "select", label: "Position", options: [{ label: "Right", value: "right" }, { label: "Left", value: "left" }], defaultValue: "right" },
  },
  defaultProps: { position: "right" },
};

const miniCartDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceMiniCart",
  label: "Mini Cart",
  description: "Compact floating cart widget with item count badge",
  category: "ecommerce",
  icon: "ShoppingBag",
  fields: {
    position: { type: "select", label: "Position", options: [{ label: "Top Right", value: "top-right" }, { label: "Bottom Right", value: "bottom-right" }], defaultValue: "top-right" },
    showItemCount: { type: "toggle", label: "Show Item Count", defaultValue: true },
  },
  defaultProps: { position: "top-right", showItemCount: true },
};

const checkoutPageDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceCheckoutPage",
  label: "Checkout Page",
  description: "Multi-step checkout with shipping, billing, and payment",
  category: "ecommerce",
  icon: "CreditCard",
  fields: {
    enableGuestCheckout: { type: "toggle", label: "Enable Guest Checkout", defaultValue: true },
    showOrderSummary: { type: "toggle", label: "Show Order Summary", defaultValue: true },
  },
  defaultProps: { enableGuestCheckout: true, showOrderSummary: true },
};

const orderConfirmationDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceOrderConfirmation",
  label: "Order Confirmation",
  description: "Order success page shown after payment",
  category: "ecommerce",
  icon: "CheckCircle",
  fields: {
    showContinueShopping: { type: "toggle", label: "Show Continue Shopping", defaultValue: true },
  },
  defaultProps: { showContinueShopping: true },
};

const categoryNavDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceCategoryNav",
  label: "Category Navigation",
  description: "Browse product categories as tree, grid, or list",
  category: "ecommerce",
  icon: "FolderTree",
  fields: {
    variant: { type: "select", label: "Display Style", options: [{ label: "Tree Menu", value: "tree" }, { label: "Grid Cards", value: "grid" }, { label: "List", value: "list" }, { label: "Chips/Tags", value: "cards" }], defaultValue: "tree" },
    showProductCount: { type: "toggle", label: "Show Product Count", defaultValue: true },
    showImages: { type: "toggle", label: "Show Images", defaultValue: true },
    showSubcategories: { type: "toggle", label: "Show Subcategories", defaultValue: true },
    title: { type: "text", label: "Title", defaultValue: "Categories" },
    showTitle: { type: "toggle", label: "Show Title", defaultValue: true },
  },
  defaultProps: { variant: "tree", showProductCount: true, showImages: true, showSubcategories: true, title: "Categories", showTitle: true },
};

const searchBarDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceSearchBar",
  label: "Product Search",
  description: "Search bar with live suggestions and results",
  category: "ecommerce",
  icon: "Search",
  fields: {
    placeholder: { type: "text", label: "Placeholder Text", defaultValue: "Search products..." },
    showSuggestions: { type: "toggle", label: "Show Suggestions", defaultValue: true },
    maxSuggestions: { type: "number", label: "Max Suggestions", defaultValue: 5 },
  },
  defaultProps: { placeholder: "Search products...", showSuggestions: true, maxSuggestions: 5 },
};

const filterSidebarDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceFilterSidebar",
  label: "Product Filters",
  description: "Sidebar with price, category, and attribute filters",
  category: "ecommerce",
  icon: "SlidersHorizontal",
  fields: {
    showPriceFilter: { type: "toggle", label: "Show Price Filter", defaultValue: true },
    showCategoryFilter: { type: "toggle", label: "Show Category Filter", defaultValue: true },
    showStockFilter: { type: "toggle", label: "Show Stock Filter", defaultValue: true },
    collapsible: { type: "toggle", label: "Collapsible Sections", defaultValue: true },
  },
  defaultProps: { showPriceFilter: true, showCategoryFilter: true, showStockFilter: true, collapsible: true },
};

const breadcrumbDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceBreadcrumb",
  label: "Breadcrumb Navigation",
  description: "Breadcrumb trail for product/category pages",
  category: "ecommerce",
  icon: "ChevronRight",
  fields: {
    showHome: { type: "toggle", label: "Show Home Link", defaultValue: true },
    separator: { type: "select", label: "Separator", options: [{ label: "Chevron", value: "chevron" }, { label: "Slash", value: "slash" }, { label: "Arrow", value: "arrow" }], defaultValue: "chevron" },
  },
  defaultProps: { showHome: true, separator: "chevron" },
};

const productSortDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceProductSort",
  label: "Product Sort",
  description: "Dropdown to sort products by price, name, date, etc.",
  category: "ecommerce",
  icon: "ArrowUpDown",
  fields: {
    defaultSort: { type: "select", label: "Default Sort", options: [{ label: "Newest", value: "newest" }, { label: "Price: Low to High", value: "price-asc" }, { label: "Price: High to Low", value: "price-desc" }, { label: "Name A-Z", value: "name-asc" }], defaultValue: "newest" },
  },
  defaultProps: { defaultSort: "newest" },
};

const quoteRequestDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceQuoteRequest",
  label: "Quote Request Form",
  description: "Form for customers to request product quotes",
  category: "ecommerce",
  icon: "FileText",
  fields: {
    showNotes: { type: "toggle", label: "Show Notes Field", defaultValue: true },
    requirePhone: { type: "toggle", label: "Require Phone Number", defaultValue: false },
  },
  defaultProps: { showNotes: true, requirePhone: false },
};

const quoteListDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceQuoteList",
  label: "Quote List",
  description: "Display list of customer quotes with status",
  category: "ecommerce",
  icon: "List",
  fields: {
    variant: { type: "select", label: "Layout", options: [{ label: "Cards", value: "card" }, { label: "List", value: "list" }, { label: "Table", value: "table" }], defaultValue: "card" },
  },
  defaultProps: { variant: "card" },
};

const quoteDetailDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceQuoteDetail",
  label: "Quote Detail",
  description: "Detailed view of a single quote with items and actions",
  category: "ecommerce",
  icon: "FileText",
  fields: {},
  defaultProps: {},
};

// =============================================================================
// STUDIO COMPONENTS
// =============================================================================

export const studioComponents: ModuleStudioExports["studioComponents"] = {
  EcommerceProductCard: {
    ...productCardDefinition,
    render: ProductCardBlock,
    // Update productId field to use custom product selector
    fields: {
      ...productCardDefinition.fields,
      productId: {
        type: "custom" as const,
        customType: "ecommerce:product-selector",
        label: "Product",
        description: "Select a product from your catalog",
      },
    },
  },
  EcommerceProductGrid: {
    ...productGridDefinition,
    render: ProductGridBlock,
    // Update categoryId field to use custom category selector
    fields: {
      ...productGridDefinition.fields,
      categoryId: {
        type: "custom" as const,
        customType: "ecommerce:category-selector",
        label: "Category",
        description: "Filter products by category",
      },
    },
  },
  // Enhanced Product Grid with real-time data and advanced filtering
  EcommerceProductCatalog: {
    ...enhancedProductGridDefinition,
    type: "EcommerceProductCatalog",
    label: "Product Catalog",
    description: "Full-featured product catalog with filters, sorting, and pagination",
    render: EnhancedProductGridBlock,
    fields: {
      ...enhancedProductGridDefinition.fields,
      categoryId: {
        type: "custom" as const,
        customType: "ecommerce:category-selector",
        label: "Category",
        description: "Filter products by category",
      },
    },
  },
  // Featured Products carousel/grid
  EcommerceFeaturedProducts: {
    ...featuredProductsDefinition,
    render: FeaturedProductsBlock,
    fields: {
      ...featuredProductsDefinition.fields,
      categoryId: {
        type: "custom" as const,
        customType: "ecommerce:category-selector",
        label: "Category",
        description: "Filter products by category (when source is 'category')",
      },
    },
  },

  // Cart Components (ECOM-22)
  EcommerceCartPage: {
    ...cartPageDefinition,
    render: CartPageBlock,
  },
  EcommerceCartDrawer: {
    ...cartDrawerDefinition,
    render: CartDrawerBlock,
  },
  EcommerceMiniCart: {
    ...miniCartDefinition,
    render: MiniCartBlock,
  },

  // Checkout Components (ECOM-23)
  EcommerceCheckoutPage: {
    ...checkoutPageDefinition,
    render: CheckoutPageBlock,
  },
  EcommerceOrderConfirmation: {
    ...orderConfirmationDefinition,
    render: OrderConfirmationBlock,
  },

  // Navigation & Discovery Components (ECOM-24)
  EcommerceCategoryNav: {
    ...categoryNavDefinition,
    render: CategoryNavBlock,
  },
  EcommerceSearchBar: {
    ...searchBarDefinition,
    render: SearchBarBlock,
  },
  EcommerceFilterSidebar: {
    ...filterSidebarDefinition,
    render: FilterSidebarBlock,
  },
  EcommerceBreadcrumb: {
    ...breadcrumbDefinition,
    render: BreadcrumbBlock,
  },
  EcommerceProductSort: {
    ...productSortDefinition,
    render: ProductSortBlock,
  },

  // Quotation Components (ECOM-25)
  EcommerceQuoteRequest: {
    ...quoteRequestDefinition,
    render: QuoteRequestBlock,
  },
  EcommerceQuoteList: {
    ...quoteListDefinition,
    render: QuoteListBlock,
  },
  EcommerceQuoteDetail: {
    ...quoteDetailDefinition,
    render: QuoteDetailBlock,
  },

  // Review Components (ECOM-60)
  EcommerceReviewForm: {
    ...reviewFormDefinition,
    render: ReviewFormBlock,
  },
  EcommerceReviewList: {
    ...reviewListDefinition,
    render: ReviewListBlock,
  },
};

// =============================================================================
// CUSTOM FIELDS (Phase 15)
// =============================================================================

export const studioFields: ModuleStudioExports["studioFields"] = {
  "product-selector": ProductSelectorField,
  "category-selector": CategorySelectorField,
};

// Also export field definitions for registration
export const studioFieldDefinitions = [
  productSelectorFieldDefinition,
  categorySelectorFieldDefinition,
];

// =============================================================================
// METADATA
// =============================================================================

export const studioMetadata: ModuleStudioExports["studioMetadata"] = {
  name: "E-Commerce",
  icon: "ShoppingCart",
  category: "ecommerce",
};

// Export as default for compatibility
export default {
  studioComponents,
  studioFields,
  studioMetadata,
} as ModuleStudioExports;
