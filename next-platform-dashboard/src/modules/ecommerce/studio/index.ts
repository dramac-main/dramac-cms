/**
 * E-Commerce Module - Studio Integration
 * 
 * Exports Studio components and custom fields for the visual editor.
 * These components appear in the Studio component library when
 * the E-Commerce module is installed on a site.
 */

import type { ModuleStudioExports } from "@/types/studio-module";
import { ProductCardBlock, productCardDefinition } from "./components/product-card-block";
import { ProductGridBlock, productGridDefinition } from "./components/product-grid-block";
import { 
  ProductSelectorField, 
  productSelectorFieldDefinition 
} from "./fields/product-selector-field";
import { 
  CategorySelectorField, 
  categorySelectorFieldDefinition 
} from "./fields/category-selector-field";

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
