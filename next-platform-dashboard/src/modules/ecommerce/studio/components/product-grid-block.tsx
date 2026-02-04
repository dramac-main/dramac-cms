/**
 * E-Commerce Product Grid - Studio Block
 * 
 * Displays a grid of products from the store catalog.
 * Supports responsive columns and different product sources.
 * Fetches real data in preview/production mode, shows demo data in editor.
 */

"use client";

import React, { useEffect, useState } from "react";
import type { ComponentDefinition, ResponsiveValue } from "@/types/studio";
import { ShoppingBag, Loader2 } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  rating?: number;
}

interface ProductGridProps {
  // Grid settings
  columns: ResponsiveValue<number>;
  gap: ResponsiveValue<string>;
  
  // Product source
  source: "category" | "featured" | "new" | "sale" | "custom";
  categoryId: string | null;
  productIds: string[];
  limit: number;
  
  // Display options
  showPrice: boolean;
  showRating: boolean;
  cardVariant: "card" | "minimal";
  
  // Editor context props (passed by canvas)
  _isEditor?: boolean;
  _siteId?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProductGridBlock({
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = { mobile: "16px" },
  source = "featured",
  categoryId: _categoryId,
  productIds: _productIds = [],
  limit = 8,
  showRating: _showRating = true,
  showPrice = true,
  cardVariant = "card",
  _isEditor = false,
  _siteId,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(!_isEditor);
  const [error, setError] = useState<string | null>(null);
  
  // Demo products for editor preview - use deterministic values
  const demoProducts: Product[] = Array.from({ length: limit }, (_, i) => ({
    id: `demo-${i + 1}`,
    name: `Product ${i + 1}`,
    price: 49.99 + i * 10,
    image: undefined,
    rating: 4 + (i % 10) * 0.1,
  }));
  
  // Fetch real products when not in editor
  useEffect(() => {
    if (_isEditor) {
      setProducts(demoProducts);
      setIsLoading(false);
      return;
    }
    
    // Fetch real data
    async function fetchProducts() {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          source,
          limit: String(limit),
        });
        if (_siteId) params.append("siteId", _siteId);
        if (_categoryId) params.append("categoryId", _categoryId);
        
        const response = await fetch(`/api/modules/ecommerce/products?${params}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("[ProductGrid] Error fetching products:", err);
        setError("Failed to load products");
        // Fallback to demo data on error
        setProducts(demoProducts);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProducts();
  }, [_isEditor, _siteId, source, _categoryId, limit]);
  
  // Use products (real or demo)
  const displayProducts = products.length > 0 ? products : demoProducts;

  // Get responsive values
  const columnsValue = typeof columns === "object" ? columns : { mobile: columns };
  const gapValue = typeof gap === "object" ? gap.mobile : gap;

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columnsValue.mobile || 2}, 1fr)`,
    gap: gapValue,
  };

  return (
    <div className="product-grid-wrapper">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>{error}</p>
        </div>
      )}
      
      {/* Product Grid */}
      {!isLoading && (
        <div 
          className="product-grid"
          style={gridStyle}
        >
          {displayProducts.map((product) => (
            <div 
              key={product.id}
              className={`${cardVariant === "minimal" ? "" : "bg-card border rounded-lg overflow-hidden"} group`}
            >
              <div className="aspect-square relative overflow-hidden bg-muted rounded-lg">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className={cardVariant === "minimal" ? "mt-3" : "p-4"}>
                <h3 className="font-medium truncate">{product.name}</h3>
                {showPrice && (
                  <p className="text-primary font-semibold mt-1">
                    ${product.price.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Responsive CSS */}
      <style jsx>{`
        @media (min-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(${columnsValue.tablet || columnsValue.mobile || 2}, 1fr);
            gap: ${typeof gap === "object" && gap.tablet ? gap.tablet : gapValue};
          }
        }
        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(${columnsValue.desktop || columnsValue.tablet || columnsValue.mobile || 2}, 1fr);
            gap: ${typeof gap === "object" && gap.desktop ? gap.desktop : (typeof gap === "object" && gap.tablet ? gap.tablet : gapValue)};
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// DEFINITION
// =============================================================================

export const productGridDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceProductGrid",
  label: "Product Grid",
  description: "Display a grid of products from your catalog",
  category: "ecommerce",
  icon: "LayoutGrid",
  
  fields: {
    columns: {
      type: "number",
      label: "Columns",
      defaultValue: 4,
      min: 1,
      max: 6,
      responsive: true,
    },
    gap: {
      type: "text",
      label: "Gap",
      defaultValue: "16px",
      responsive: true,
    },
    source: {
      type: "select",
      label: "Product Source",
      options: [
        { label: "Featured Products", value: "featured" },
        { label: "New Arrivals", value: "new" },
        { label: "On Sale", value: "sale" },
        { label: "From Category", value: "category" },
        { label: "Custom Selection", value: "custom" },
      ],
      defaultValue: "featured",
    },
    categoryId: {
      type: "text",
      label: "Category ID",
      description: "Required when source is 'From Category'",
      placeholder: "e.g., cat_12345",
    },
    limit: {
      type: "number",
      label: "Product Limit",
      defaultValue: 8,
      min: 1,
      max: 24,
    },
    showPrice: {
      type: "toggle",
      label: "Show Price",
      defaultValue: true,
    },
    showRating: {
      type: "toggle",
      label: "Show Rating",
      defaultValue: true,
    },
    cardVariant: {
      type: "select",
      label: "Card Style",
      options: [
        { label: "Card", value: "card" },
        { label: "Minimal", value: "minimal" },
      ],
      defaultValue: "card",
    },
  },
  
  defaultProps: {
    columns: { mobile: 2, tablet: 3, desktop: 4 },
    gap: { mobile: "16px" },
    source: "featured",
    categoryId: null,
    productIds: [],
    limit: 8,
    showPrice: true,
    showRating: true,
    cardVariant: "card",
  },
  
  ai: {
    description: "Grid displaying multiple products from the e-commerce catalog",
    canModify: ["columns", "limit", "showPrice", "showRating", "cardVariant", "source"],
    suggestions: [
      "Show 4 columns",
      "Display 12 products",
      "Hide ratings",
      "Use minimal card style",
    ],
  },
  
  keywords: ["products", "grid", "catalog", "shop", "store", "ecommerce", "collection", "gallery"],
};
