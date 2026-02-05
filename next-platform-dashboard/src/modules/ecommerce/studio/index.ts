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
 */

import type { ModuleStudioExports } from "@/types/studio-module";
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
export { CartDrawerBlock } from "./components/CartDrawerBlock";
export { MiniCartBlock } from "./components/MiniCartBlock";
export { CartPageBlock } from "./components/CartPageBlock";

// Re-export Checkout components (ECOM-23)
export { CheckoutStepIndicator } from "./components/CheckoutStepIndicator";
export { AddressForm, ShippingAddressForm, BillingAddressForm } from "./components/AddressForm";
export { ShippingMethodSelector } from "./components/ShippingMethodSelector";
export { PaymentMethodSelector } from "./components/PaymentMethodSelector";
export { OrderSummaryCard } from "./components/OrderSummaryCard";
export { CheckoutPageBlock } from "./components/CheckoutPageBlock";
export { OrderConfirmationBlock } from "./components/OrderConfirmationBlock";

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
