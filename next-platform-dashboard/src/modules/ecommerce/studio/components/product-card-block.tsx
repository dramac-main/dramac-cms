/**
 * E-Commerce Product Card - Studio Block (Enhanced with Real Data)
 * 
 * Displays a product from the store catalog with real-time data fetching.
 * Supports card, horizontal, and minimal layout variants.
 * Integrates with cart and wishlist functionality.
 */

"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import type { ComponentDefinition, ResponsiveValue } from "@/types/studio";
import type { Product } from "../../types/ecommerce-types";
import { ShoppingBag, Star, Heart, Eye, Loader2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStorefrontProduct } from "../../hooks/useStorefrontProduct";
import { useStorefrontCart } from "../../hooks/useStorefrontCart";
import { useStorefrontWishlist } from "../../hooks/useStorefrontWishlist";
import { useStorefront } from "../../context/storefront-context";
import { ProductPriceDisplay } from "./ProductPriceDisplay";
import { ProductStockBadge } from "./ProductStockBadge";
import { ProductRatingDisplay } from "./ProductRatingDisplay";

// =============================================================================
// TYPES
// =============================================================================

interface ProductCardProps {
  // Product selection
  productId: string | null;
  siteId?: string;
  _siteId?: string | null; // Studio canvas passes this
  
  // Display options
  showPrice: boolean;
  showRating: boolean;
  showButton: boolean;
  showWishlistButton: boolean;
  showQuickView: boolean;
  showStockBadge: boolean;
  showSaleBadge: boolean;
  buttonText: string;
  
  // Layout
  variant: "card" | "horizontal" | "minimal" | "compact";
  imageAspect: "square" | "portrait" | "landscape";
  
  // Hover effects
  hoverEffect: "none" | "zoom" | "lift" | "shadow";
  
  // Responsive
  padding: ResponsiveValue<string>;
  borderRadius: ResponsiveValue<string>;
  
  // Events (for quick view modal)
  onQuickView?: (productId: string) => void;
  onProductClick?: (productId: string) => void;
}

// Demo product for editor preview
interface DemoProduct {
  id: string;
  name: string;
  base_price: number;
  compare_at_price: number | null;
  images: string[];
  rating?: number;
  reviewCount?: number;
  quantity: number;
  track_inventory: boolean;
  status: 'active' | 'draft' | 'archived';
}

const DEMO_PRODUCT: DemoProduct = {
  id: "demo-product",
  name: "Sample Product",
  base_price: 99.99,
  compare_at_price: 129.99,
  images: [],
  rating: 4.5,
  reviewCount: 128,
  quantity: 25,
  track_inventory: true,
  status: "active",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ProductCardBlock({
  productId,
  siteId,
  _siteId,
  showPrice = true,
  showRating = true,
  showButton = true,
  showWishlistButton = true,
  showQuickView = false,
  showStockBadge = false,
  showSaleBadge = true,
  buttonText = "Add to Cart",
  variant = "card",
  imageAspect = "square",
  hoverEffect = "zoom",
  padding = { mobile: "16px" },
  borderRadius = { mobile: "8px" },
  onQuickView,
  onProductClick,
}: ProductCardProps) {
  // Context
  const storefront = useStorefront();
  // Use _siteId from Studio canvas, then siteId prop, then context
  const effectiveSiteId = _siteId || siteId || storefront?.siteId;
  // Quotation mode
  const quotationModeEnabled = storefront?.quotationModeEnabled ?? false
  const quotationButtonLabel = storefront?.quotationButtonLabel || 'Request a Quote'
  const quotationHidePrices = storefront?.quotationHidePrices ?? false
  // Effective price visibility: hide if prop says so OR if quotation mode hides prices
  const effectiveShowPrice = showPrice && !quotationHidePrices
  
  // Hooks for real data
  const { product: fetchedProduct, isLoading, error } = useStorefrontProduct(
    effectiveSiteId || "",
    productId || ""
  );
  const { addItem, isUpdating: cartLoading } = useStorefrontCart(effectiveSiteId || "");
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useStorefrontWishlist(effectiveSiteId || "");
  
  // Local state
  const [addingToCart, setAddingToCart] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Use fetched product or demo data - only show demo in editor when no site connected
  const product = !effectiveSiteId ? DEMO_PRODUCT : (fetchedProduct || DEMO_PRODUCT);
  const isDemo = !effectiveSiteId;
  const inWishlist = productId ? isInWishlist(productId) : false;
  
  // Access product properties with fallbacks
  const productPrice = (product as DemoProduct).base_price ?? (product as Product).base_price ?? 0;
  const productCompareAt = (product as DemoProduct).compare_at_price ?? (product as Product).compare_at_price;
  const productQuantity = (product as DemoProduct).quantity ?? (product as Product).quantity ?? 0;
  const productImages = (product as Product).images || [];
  const productRating = (product as DemoProduct).rating;
  const productReviewCount = (product as DemoProduct).reviewCount;
  
  // Calculate sale percentage
  const salePercentage = productCompareAt && productPrice < productCompareAt
    ? Math.round(((productCompareAt - productPrice) / productCompareAt) * 100)
    : 0;
  
  // Handle add to cart (or request quote in quotation mode)
  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!productId || isDemo) return;

    // In quotation mode: navigate to quote request page instead of adding to cart
    if (quotationModeEnabled) {
      const quotesUrl = storefront?.quotationRedirectUrl || '/quotes'
      window.location.href = `${quotesUrl}?product=${productId}`
      return
    }
    
    setAddingToCart(true);
    try {
      await addItem(productId, null, 1);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setAddingToCart(false);
    }
  }, [productId, addItem, isDemo, quotationModeEnabled, storefront?.quotationRedirectUrl]);
  
  // Handle wishlist toggle
  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!productId || isDemo) return;
    
    if (inWishlist) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  }, [productId, inWishlist, addToWishlist, removeFromWishlist, isDemo]);
  
  // Handle quick view
  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (productId && onQuickView) {
      onQuickView(productId);
    }
  }, [productId, onQuickView]);
  
  // Handle card click — navigate to product detail page
  const handleCardClick = useCallback(() => {
    if (productId && onProductClick) {
      onProductClick(productId);
    } else if (productId && !isDemo && product) {
      // Auto-navigate to product detail page
      const slug = (product as Product).slug || productId;
      window.location.href = `/products/${slug}`;
    }
  }, [productId, onProductClick, product, isDemo]);

  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };
  
  const hoverClasses = {
    none: "",
    zoom: "transition-transform group-hover:scale-105",
    lift: "",
    shadow: "",
  };
  
  const cardHoverClasses = {
    none: "",
    zoom: "",
    lift: "transition-transform hover:-translate-y-1",
    shadow: "transition-shadow hover:shadow-lg",
  };

  // Get responsive values
  const paddingValue = typeof padding === "object" ? padding.mobile : padding;
  const borderRadiusValue = typeof borderRadius === "object" ? borderRadius.mobile : borderRadius;
  
  // Primary image
  const primaryImage = productImages[0] || undefined;

  // Loading state
  if (isLoading && productId) {
    return (
      <div 
        className="bg-card border rounded-lg overflow-hidden animate-pulse"
        style={{ borderRadius: borderRadiusValue }}
      >
        <div className={cn("bg-muted", aspectClasses[imageAspect])} />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }
  
  // Error state
  if (error && productId) {
    return (
      <div 
        className="bg-card border rounded-lg overflow-hidden"
        style={{ borderRadius: borderRadiusValue }}
      >
        <div className={cn("bg-muted flex items-center justify-center", aspectClasses[imageAspect])}>
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Failed to load product</p>
        </div>
      </div>
    );
  }

  // Overlay buttons (wishlist, quick view)
  const OverlayButtons = () => (
    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      {showWishlistButton && (
        <button
          onClick={handleWishlistToggle}
          className={cn(
            "p-2 rounded-full bg-card/90 backdrop-blur-sm shadow-sm transition-colors",
            inWishlist ? "text-red-500" : "text-muted-foreground hover:text-red-500"
          )}
          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
        </button>
      )}
      {showQuickView && onQuickView && (
        <button
          onClick={handleQuickView}
          className="p-2 rounded-full bg-card/90 backdrop-blur-sm shadow-sm text-muted-foreground hover:text-foreground transition-colors"
          title="Quick view"
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
    </div>
  );
  
  // Sale badge
  const SaleBadge = () => showSaleBadge && salePercentage > 0 ? (
    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded z-10">
      -{salePercentage}%
    </div>
  ) : null;
  
  // Product image — uses next/image for Supabase-hosted images, falls back to <img> for others
  const isSupabaseImage = primaryImage?.includes('.supabase.co/') || primaryImage?.includes('unsplash.com');
  
  const ProductImage = ({ className }: { className?: string }) => (
    primaryImage && !imageError ? (
      isSupabaseImage ? (
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn("object-cover", hoverClasses[hoverEffect], className)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <img
          src={primaryImage}
          alt={product.name}
          className={cn("w-full h-full object-cover", hoverClasses[hoverEffect], className)}
          onError={() => setImageError(true)}
          loading="lazy"
          decoding="async"
        />
      )
    ) : (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
      </div>
    )
  );
  
  // Add to cart / request quote button
  const AddToCartButton = ({ fullWidth = false }: { fullWidth?: boolean }) => (
    <button
      onClick={handleAddToCart}
      disabled={addingToCart || cartLoading || isDemo}
      className={cn(
        "px-4 py-2 rounded-md text-sm font-medium",
        "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2",
        quotationModeEnabled
          ? "bg-orange-500 hover:bg-orange-600 text-white"
          : "bg-primary hover:bg-primary/90 text-primary-foreground",
        fullWidth && "w-full"
      )}
    >
      {addingToCart ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {quotationModeEnabled ? 'Requesting...' : 'Adding...'}
        </>
      ) : quotationModeEnabled ? (
        <>
          <FileText className="h-4 w-4" />
          {quotationButtonLabel}
        </>
      ) : (
        buttonText
      )}
    </button>
  );

  // MINIMAL variant
  if (variant === "minimal") {
    return (
      <div 
        className={cn("group cursor-pointer", cardHoverClasses[hoverEffect])}
        style={{ padding: paddingValue, borderRadius: borderRadiusValue }}
        onClick={handleCardClick}
      >
        <div className={cn("relative overflow-hidden rounded-lg bg-muted", aspectClasses[imageAspect])}>
          <SaleBadge />
          <OverlayButtons />
          <ProductImage />
        </div>
        <div className="mt-3">
          <h3 className="font-medium truncate">{product.name}</h3>
          {effectiveShowPrice && (
            <ProductPriceDisplay
              price={productPrice}
              compareAtPrice={productCompareAt}
              className="mt-1"
            />
          )}
        </div>
      </div>
    );
  }
  
  // COMPACT variant
  if (variant === "compact") {
    return (
      <div 
        className={cn(
          "flex gap-3 p-2 bg-card border rounded-lg group cursor-pointer",
          cardHoverClasses[hoverEffect]
        )}
        style={{ borderRadius: borderRadiusValue }}
        onClick={handleCardClick}
      >
        <div className="w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden relative">
          <SaleBadge />
          <ProductImage />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{product.name}</h3>
          {effectiveShowPrice && (
            <ProductPriceDisplay
              price={productPrice}
              compareAtPrice={productCompareAt}
              className="mt-0.5"
            />
          )}
        </div>
      </div>
    );
  }

  // HORIZONTAL variant
  if (variant === "horizontal") {
    return (
      <div 
        className={cn(
          "flex gap-4 bg-card border rounded-lg overflow-hidden group",
          cardHoverClasses[hoverEffect]
        )}
        style={{ padding: paddingValue, borderRadius: borderRadiusValue }}
        onClick={handleCardClick}
      >
        <div className="w-32 h-32 flex-shrink-0 bg-muted rounded-md overflow-hidden relative">
          <SaleBadge />
          <ProductImage />
        </div>
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <h3 className="font-medium truncate">{product.name}</h3>
          
          {showRating && productRating !== undefined && (
            <ProductRatingDisplay
              rating={productRating}
              reviewCount={productReviewCount}
              className="mt-1"
            />
          )}
          
          {showStockBadge && (
            <ProductStockBadge
              stockQuantity={productQuantity}
              trackInventory={product.track_inventory}
              className="mt-1"
            />
          )}
          
          <div className="flex items-center gap-4 mt-2">
            {effectiveShowPrice && (
              <ProductPriceDisplay
                price={productPrice}
                compareAtPrice={productCompareAt}
              />
            )}
            {showButton && <AddToCartButton />}
          </div>
        </div>
        <OverlayButtons />
      </div>
    );
  }

  // Default CARD variant
  return (
    <div 
      className={cn(
        "bg-card border rounded-lg overflow-hidden group cursor-pointer",
        cardHoverClasses[hoverEffect]
      )}
      style={{ borderRadius: borderRadiusValue }}
      onClick={handleCardClick}
    >
      <div className={cn("relative overflow-hidden bg-muted", aspectClasses[imageAspect])}>
        <SaleBadge />
        <OverlayButtons />
        <ProductImage />
      </div>
      
      <div style={{ padding: paddingValue }}>
        <h3 className="font-medium truncate">{product.name}</h3>
        
        {showRating && productRating !== undefined && (
          <ProductRatingDisplay
            rating={productRating}
            reviewCount={productReviewCount}
            showCount
            className="mt-1"
          />
        )}
        
        {showStockBadge && (
          <ProductStockBadge
            stockQuantity={productQuantity}
            trackInventory={product.track_inventory}
            className="mt-2"
          />
        )}
        
        <div className="flex items-center justify-between mt-3 gap-2">
          {effectiveShowPrice && (
            <ProductPriceDisplay
              price={productPrice}
              compareAtPrice={productCompareAt}
            />
          )}
          {showButton && <AddToCartButton />}
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
  description: "Display a product with image, title, price, and interactive cart/wishlist features",
  category: "ecommerce",
  icon: "ShoppingBag",
  
  fields: {
    productId: {
      type: "text",
      label: "Product ID",
      description: "Enter a product ID or leave empty for demo",
      placeholder: "e.g., prod_12345",
    },
    siteId: {
      type: "text",
      label: "Site ID",
      description: "Optional site ID (uses context if not set)",
      placeholder: "Auto-detected from context",
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
      label: "Show Add to Cart",
      defaultValue: true,
    },
    showWishlistButton: {
      type: "toggle",
      label: "Show Wishlist Button",
      defaultValue: true,
    },
    showQuickView: {
      type: "toggle",
      label: "Show Quick View",
      defaultValue: false,
    },
    showStockBadge: {
      type: "toggle",
      label: "Show Stock Badge",
      defaultValue: false,
    },
    showSaleBadge: {
      type: "toggle",
      label: "Show Sale Badge",
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
        { label: "Compact", value: "compact" },
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
    hoverEffect: {
      type: "select",
      label: "Hover Effect",
      options: [
        { label: "None", value: "none" },
        { label: "Zoom Image", value: "zoom" },
        { label: "Lift Card", value: "lift" },
        { label: "Shadow", value: "shadow" },
      ],
      defaultValue: "zoom",
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
    siteId: undefined,
    showPrice: true,
    showRating: true,
    showButton: true,
    showWishlistButton: true,
    showQuickView: false,
    showStockBadge: false,
    showSaleBadge: true,
    buttonText: "Add to Cart",
    variant: "card",
    imageAspect: "square",
    hoverEffect: "zoom",
    padding: { mobile: "16px" },
    borderRadius: { mobile: "8px" },
  },
  
  ai: {
    description: "Interactive product card with real-time cart/wishlist integration and customizable display options",
    canModify: [
      "showPrice", "showRating", "showButton", "showWishlistButton", 
      "showQuickView", "showStockBadge", "showSaleBadge", 
      "buttonText", "variant", "imageAspect", "hoverEffect"
    ],
    suggestions: [
      "Hide the price",
      "Use horizontal layout",
      "Change button to 'Buy Now'",
      "Make it minimal",
      "Show stock badge",
      "Enable quick view",
      "Use lift hover effect",
    ],
  },
  
  keywords: ["product", "shop", "buy", "cart", "ecommerce", "store", "item", "wishlist"],
};
