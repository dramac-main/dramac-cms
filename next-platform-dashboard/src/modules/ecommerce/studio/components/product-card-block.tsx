/**
 * E-Commerce Product Card - Studio Block
 * 
 * Displays a product from the store catalog.
 * Supports card, horizontal, and minimal layout variants.
 */

"use client";

import React from "react";
import type { ComponentDefinition, ResponsiveValue } from "@/types/studio";
import { ShoppingBag, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface ProductCardProps {
  // Product selection
  productId: string | null;
  productData?: {
    name: string;
    price: number;
    image?: string;
    rating?: number;
    reviewCount?: number;
  };
  
  // Display options
  showPrice: boolean;
  showRating: boolean;
  showButton: boolean;
  buttonText: string;
  
  // Layout
  variant: "card" | "horizontal" | "minimal";
  imageAspect: "square" | "portrait" | "landscape";
  
  // Responsive
  padding: ResponsiveValue<string>;
  borderRadius: ResponsiveValue<string>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProductCardBlock({
  productId,
  productData,
  showPrice = true,
  showRating = true,
  showButton = true,
  buttonText = "Add to Cart",
  variant = "card",
  imageAspect = "square",
  padding = { mobile: "16px" },
  borderRadius = { mobile: "8px" },
}: ProductCardProps) {
  // Demo data for editor preview
  const product = productData || {
    name: productId ? "Loading product..." : "Select a product",
    price: 99.99,
    image: undefined,
    rating: 4.5,
    reviewCount: 128,
  };

  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };

  // Get responsive padding value
  const paddingValue = typeof padding === "object" ? padding.mobile : padding;
  const borderRadiusValue = typeof borderRadius === "object" ? borderRadius.mobile : borderRadius;

  if (variant === "minimal") {
    return (
      <div 
        className="group cursor-pointer"
        style={{ 
          padding: paddingValue,
          borderRadius: borderRadiusValue,
        }}
      >
        <div className={cn("relative overflow-hidden rounded-lg bg-muted", aspectClasses[imageAspect])}>
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
        <div className="mt-3">
          <h3 className="font-medium truncate">{product.name}</h3>
          {showPrice && (
            <p className="text-primary font-semibold mt-1">
              ${product.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div 
        className="flex gap-4 bg-card border rounded-lg overflow-hidden"
        style={{ padding: paddingValue }}
      >
        <div className="w-32 h-32 flex-shrink-0 bg-muted rounded-md overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="font-medium">{product.name}</h3>
          {showRating && product.rating && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>
          )}
          <div className="flex items-center gap-4 mt-2">
            {showPrice && (
              <p className="text-lg font-semibold text-primary">
                ${product.price.toFixed(2)}
              </p>
            )}
            {showButton && (
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                {buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div 
      className="bg-card border rounded-lg overflow-hidden group"
      style={{ borderRadius: borderRadiusValue }}
    >
      <div className={cn("relative overflow-hidden bg-muted", aspectClasses[imageAspect])}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>
      <div style={{ padding: paddingValue }}>
        <h3 className="font-medium truncate">{product.name}</h3>
        
        {showRating && product.rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{product.rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-3">
          {showPrice && (
            <p className="text-lg font-semibold text-primary">
              ${product.price.toFixed(2)}
            </p>
          )}
          {showButton && (
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DEFINITION
// =============================================================================

export const productCardDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceProductCard",
  label: "Product Card",
  description: "Display a product with image, title, price, and buy button",
  category: "ecommerce",
  icon: "ShoppingBag",
  
  fields: {
    productId: {
      type: "text",
      label: "Product ID",
      description: "Enter a product ID or leave empty for demo",
      placeholder: "e.g., prod_12345",
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
    showButton: {
      type: "toggle",
      label: "Show Button",
      defaultValue: true,
    },
    buttonText: {
      type: "text",
      label: "Button Text",
      defaultValue: "Add to Cart",
    },
    variant: {
      type: "select",
      label: "Layout",
      options: [
        { label: "Card", value: "card" },
        { label: "Horizontal", value: "horizontal" },
        { label: "Minimal", value: "minimal" },
      ],
      defaultValue: "card",
    },
    imageAspect: {
      type: "select",
      label: "Image Aspect",
      options: [
        { label: "Square", value: "square" },
        { label: "Portrait", value: "portrait" },
        { label: "Landscape", value: "landscape" },
      ],
      defaultValue: "square",
    },
    padding: {
      type: "text",
      label: "Padding",
      defaultValue: "16px",
      responsive: true,
    },
    borderRadius: {
      type: "text",
      label: "Border Radius",
      defaultValue: "8px",
      responsive: true,
    },
  },
  
  defaultProps: {
    productId: null,
    showPrice: true,
    showRating: true,
    showButton: true,
    buttonText: "Add to Cart",
    variant: "card",
    imageAspect: "square",
    padding: { mobile: "16px" },
    borderRadius: { mobile: "8px" },
  },
  
  ai: {
    description: "Product card displaying an e-commerce product with customizable display options",
    canModify: ["showPrice", "showRating", "showButton", "buttonText", "variant", "imageAspect"],
    suggestions: [
      "Hide the price",
      "Use horizontal layout",
      "Change button to 'Buy Now'",
      "Make it minimal",
    ],
  },
  
  keywords: ["product", "shop", "buy", "cart", "ecommerce", "store", "item"],
};
