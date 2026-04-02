/**
 * E-Commerce Product Card - Studio Block (Enhanced with Real Data)
 *
 * Displays a product from the store catalog with real-time data fetching.
 * Supports card, horizontal, and minimal layout variants.
 * Integrates with cart and wishlist functionality.
 */

"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentDefinition, ResponsiveValue } from "@/types/studio";
import type { Product } from "../../types/ecommerce-types";
import {
  ShoppingBag,
  Star,
  Heart,
  Eye,
  Loader2,
  AlertCircle,
  FileText,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStorefrontProduct } from "../../hooks/useStorefrontProduct";
import { useStorefrontCart } from "../../hooks/useStorefrontCart";
import { useStorefrontWishlist } from "../../hooks/useStorefrontWishlist";
import { useStorefront } from "../../context/storefront-context";
import { ProductPriceDisplay } from "./ProductPriceDisplay";
import { ProductStockBadge } from "./ProductStockBadge";
import { ProductRatingDisplay } from "./ProductRatingDisplay";
import { normalizeProductImages } from "../../lib/image-utils";

// =============================================================================
// TYPES
// =============================================================================

interface ProductCardProps {
  // Product selection
  productId: string | null;
  siteId?: string;
  _siteId?: string | null; // Studio canvas passes this
  // Pre-fetched product data — when provided, skips the individual product fetch
  // (used by grid components to avoid N+1 queries)
  productData?: Product | null;

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
  status: "active" | "draft" | "archived";
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
  productData,
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
  const router = useRouter();
  // Use _siteId from Studio canvas, then siteId prop, then context
  const effectiveSiteId = _siteId || siteId || storefront?.siteId;
  // Quotation mode
  const quotationModeEnabled = storefront?.quotationModeEnabled ?? false;
  const quotationButtonLabel =
    storefront?.quotationButtonLabel || "Request a Quote";
  const quotationHidePrices = storefront?.quotationHidePrices ?? false;
  // Effective price visibility: hide if prop says so OR if quotation mode hides prices
  const effectiveShowPrice = showPrice && !quotationHidePrices;

  // Hooks for real data — skip fetch when productData is already provided (N+1 fix)
  const needsFetch = !productData && !!effectiveSiteId;
  const {
    product: fetchedProduct,
    isLoading: fetchLoading,
    error: fetchError,
  } = useStorefrontProduct(
    needsFetch ? effectiveSiteId || "" : "",
    needsFetch ? productId || "" : "",
  );
  const {
    addItem,
    isUpdating: cartLoading,
    cart,
  } = useStorefrontCart(effectiveSiteId || "");
  const {
    isInWishlist,
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
  } = useStorefrontWishlist(effectiveSiteId || "");

  // When productData is provided, use it directly (no loading/error state)
  const isLoading = productData ? false : fetchLoading;
  const error = productData ? null : fetchError;

  // Local state
  const [addingToCart, setAddingToCart] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if product is already in cart
  const isProductInCart = useMemo(() => {
    if (!productId || !cart?.items?.length) return false;
    return cart.items.some((item) => item.product_id === productId);
  }, [productId, cart?.items]);

  // Use pre-fetched data, then hook data, then demo
  const product = !effectiveSiteId
    ? DEMO_PRODUCT
    : productData || fetchedProduct || DEMO_PRODUCT;
  const isDemo = !effectiveSiteId;
  const inWishlist = productId ? isInWishlist(productId) : false;

  // Access product properties with fallbacks
  const productPrice =
    (product as DemoProduct).base_price ?? (product as Product).base_price ?? 0;
  const productCompareAt =
    (product as DemoProduct).compare_at_price ??
    (product as Product).compare_at_price;
  const productQuantity =
    (product as DemoProduct).quantity ?? (product as Product).quantity ?? 0;
  const productImages = normalizeProductImages((product as Product).images);
  const productRating =
    (product as DemoProduct).rating || (product as any).average_rating || 0;
  const productReviewCount =
    (product as DemoProduct).reviewCount || (product as any).review_count || 0;

  // Calculate sale percentage
  const salePercentage =
    productCompareAt && productPrice < productCompareAt
      ? Math.round(((productCompareAt - productPrice) / productCompareAt) * 100)
      : 0;

  // Handle add to cart (or add to quote in quotation mode)
  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!productId || isDemo) return;

      setAddingToCart(true);
      try {
        const success = await addItem(productId, null, 1);
        if (success) {
          toast.success(quotationModeEnabled ? "Added to quote" : "Added to cart", {
            description: product?.name
              ? `${product.name} added to your ${quotationModeEnabled ? "quote" : "cart"}`
              : `Item added to your ${quotationModeEnabled ? "quote" : "cart"}`,
            duration: 3000,
          });
          // Note: cart-updated event is already dispatched by useStorefrontCart.addItem()
        } else {
          toast.error(quotationModeEnabled ? "Failed to add item to quote" : "Failed to add item to cart");
        }
      } catch (err) {
        console.error("Failed to add to cart:", err);
        toast.error(quotationModeEnabled ? "Failed to add item to quote" : "Failed to add item to cart");
      } finally {
        setAddingToCart(false);
      }
    },
    [
      productId,
      addItem,
      isDemo,
      quotationModeEnabled,
      product?.name,
    ],
  );

  // Handle wishlist toggle
  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!productId || isDemo) return;

      if (inWishlist) {
        removeFromWishlist(productId);
      } else {
        addToWishlist(productId);
      }
    },
    [productId, inWishlist, addToWishlist, removeFromWishlist, isDemo],
  );

  // Handle quick view
  const handleQuickView = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (productId && onQuickView) {
        onQuickView(productId);
      }
    },
    [productId, onQuickView],
  );

  // Handle card click — navigate to product detail page
  const handleCardClick = useCallback(() => {
    if (productId && onProductClick) {
      onProductClick(productId);
    } else if (productId && !isDemo && product) {
      // Auto-navigate to product detail page
      const slug = (product as Product).slug || productId;
      router.push(`/products/${slug}`);
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

  // Get responsive values (guard against null — typeof null === "object")
  const paddingValue =
    padding && typeof padding === "object" ? padding.mobile : padding;
  const borderRadiusValue =
    borderRadius && typeof borderRadius === "object"
      ? borderRadius.mobile
      : borderRadius;

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
        <div
          className={cn(
            "bg-muted flex items-center justify-center",
            aspectClasses[imageAspect],
          )}
        >
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Failed to load product
          </p>
        </div>
      </div>
    );
  }

  // Overlay buttons (wishlist, quick view)
  const OverlayButtons = () => (
    <div className="absolute top-2 right-2 flex flex-col gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
      {showWishlistButton && (
        <button
          onClick={handleWishlistToggle}
          className={cn(
            "p-2 rounded-full bg-card/90 backdrop-blur-sm shadow-sm transition-colors",
            inWishlist
              ? "text-destructive"
              : "text-muted-foreground hover:text-destructive",
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
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const slug = (product as Product).slug || productId;
          const url = `${window.location.origin}/products/${slug}`;
          const text = encodeURIComponent(`Check out ${product.name}`);
          window.open(
            `https://wa.me/?text=${text}%20${encodeURIComponent(url)}`,
            "_blank",
            "noopener",
          );
        }}
        className="p-2 rounded-full bg-card/90 backdrop-blur-sm shadow-sm text-muted-foreground hover:text-success transition-colors"
        title="Share on WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </button>
    </div>
  );

  // Sale badge
  const SaleBadge = () =>
    showSaleBadge && salePercentage > 0 ? (
      <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded z-10">
        -{salePercentage}%
      </div>
    ) : null;

  // Product image — uses next/image for Supabase-hosted images, falls back to <img> for others
  const isSupabaseImage =
    primaryImage?.includes(".supabase.co/") ||
    primaryImage?.includes("unsplash.com");

  const ProductImage = ({ className }: { className?: string }) =>
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
          className={cn(
            "w-full h-full object-cover",
            hoverClasses[hoverEffect],
            className,
          )}
          onError={() => setImageError(true)}
          loading="lazy"
          decoding="async"
        />
      )
    ) : (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
      </div>
    );

  // Add to cart / request quote button
  const AddToCartButton = ({ fullWidth = false }: { fullWidth?: boolean }) => {
    // If product is already in cart, show "View Cart" / "View Quote" button
    if (isProductInCart && !quotationModeEnabled) {
      return (
        <Link
          href="/cart"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "px-4 py-2 min-h-[44px] rounded-md text-sm font-medium",
            "transition-colors flex items-center justify-center gap-2",
            "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
            fullWidth && "w-full",
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          View Cart
        </Link>
      );
    }

    if (isProductInCart && quotationModeEnabled) {
      return (
        <Link
          href="/cart"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "px-4 py-2 min-h-[44px] rounded-md text-sm font-medium",
            "transition-colors flex items-center justify-center gap-2",
            "bg-warning/20 hover:bg-warning/30 text-warning-foreground",
            fullWidth && "w-full",
          )}
        >
          <FileText className="h-4 w-4" />
          View Quote Items
        </Link>
      );
    }

    return (
      <button
        onClick={handleAddToCart}
        disabled={addingToCart || cartLoading || isDemo}
        className={cn(
          "px-4 py-2 min-h-[44px] rounded-md text-sm font-medium",
          "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2",
          quotationModeEnabled
            ? "bg-warning hover:bg-warning/90 text-warning-foreground"
            : "bg-primary hover:bg-primary/90 text-primary-foreground",
          fullWidth && "w-full",
        )}
      >
        {addingToCart ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {quotationModeEnabled ? "Adding..." : "Adding..."}
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
  };

  // MINIMAL variant
  if (variant === "minimal") {
    return (
      <div
        className={cn("group cursor-pointer", cardHoverClasses[hoverEffect])}
        style={{ padding: paddingValue, borderRadius: borderRadiusValue }}
        onClick={handleCardClick}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-lg bg-muted",
            aspectClasses[imageAspect],
          )}
        >
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
          cardHoverClasses[hoverEffect],
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
          cardHoverClasses[hoverEffect],
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
        cardHoverClasses[hoverEffect],
      )}
      style={{ borderRadius: borderRadiusValue }}
      onClick={handleCardClick}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          aspectClasses[imageAspect],
        )}
      >
        <SaleBadge />
        <OverlayButtons />
        <ProductImage />
      </div>

      <div className="p-2.5 sm:p-3 md:p-4" style={{ padding: undefined }}>
        <h3 className="font-medium text-sm sm:text-base line-clamp-2 leading-tight">
          {product.name}
        </h3>

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
            className="mt-1 sm:mt-2"
          />
        )}

        {effectiveShowPrice && (
          <div className="mt-1.5 sm:mt-2">
            <ProductPriceDisplay
              price={productPrice}
              compareAtPrice={productCompareAt}
              size="sm"
            />
          </div>
        )}

        {showButton && (
          <div className="mt-2 sm:mt-3">
            <AddToCartButton fullWidth />
          </div>
        )}
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
  description:
    "Display a product with image, title, price, and interactive cart/wishlist features",
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
    description:
      "Interactive product card with real-time cart/wishlist integration and customizable display options",
    canModify: [
      "showPrice",
      "showRating",
      "showButton",
      "showWishlistButton",
      "showQuickView",
      "showStockBadge",
      "showSaleBadge",
      "buttonText",
      "variant",
      "imageAspect",
      "hoverEffect",
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

  keywords: [
    "product",
    "shop",
    "buy",
    "cart",
    "ecommerce",
    "store",
    "item",
    "wishlist",
  ],
};
