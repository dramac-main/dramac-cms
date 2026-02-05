/**
 * E-Commerce Product Quick View - Modal Component
 * 
 * Displays a product in a modal for quick viewing without leaving the current page.
 * Includes image gallery, variant selection, and add to cart functionality.
 */

"use client";

import React, { useState, useCallback, useMemo } from "react";
import { X, Minus, Plus, Heart, Share2, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant, ProductOption } from "../../types/ecommerce-types";
import { useStorefrontProduct } from "../../hooks/useStorefrontProduct";
import { useStorefrontCart } from "../../hooks/useStorefrontCart";
import { useStorefrontWishlist } from "../../hooks/useStorefrontWishlist";
import { useStorefront } from "../../context/storefront-context";
import { ProductPriceDisplay } from "./ProductPriceDisplay";
import { ProductStockBadge } from "./ProductStockBadge";
import { ProductRatingDisplay } from "./ProductRatingDisplay";
import { ProductImageGallery, type ProductImage } from "./ProductImageGallery";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// =============================================================================
// TYPES
// =============================================================================

interface ProductQuickViewProps {
  productId: string;
  siteId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewFullDetails?: (productId: string) => void;
}

interface VariantOption {
  name: string;
  values: string[];
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProductQuickView({
  productId,
  siteId,
  open,
  onOpenChange,
  onViewFullDetails,
}: ProductQuickViewProps) {
  // Context
  const storefront = useStorefront();
  const effectiveSiteId = siteId || storefront?.siteId || "";
  
  // Hooks for data
  const { product, variants, isLoading, error } = useStorefrontProduct(
    effectiveSiteId,
    productId
  );
  const { addItem, isUpdating: cartLoading } = useStorefrontCart(effectiveSiteId);
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useStorefrontWishlist(effectiveSiteId);
  
  // Local state
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Check if in wishlist
  const inWishlist = isInWishlist(productId);
  
  const trackInventory = product?.track_inventory ?? false;
  
  // Get variant options (if product has variants)
  const variantOptions: VariantOption[] = useMemo(() => {
    if (!variants || variants.length === 0) return [];
    
    const optionsMap: Record<string, Set<string>> = {};
    
    variants.forEach(variant => {
      if (variant.options) {
        Object.entries(variant.options).forEach(([key, value]) => {
          if (!optionsMap[key]) {
            optionsMap[key] = new Set();
          }
          optionsMap[key].add(value as string);
        });
      }
    });
    
    return Object.entries(optionsMap).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [variants]);
  
  // Find selected variant based on options - MUST be before price/stock memos
  const selectedVariant = useMemo((): ProductVariant | null => {
    if (!variants || variants.length === 0 || Object.keys(selectedOptions).length === 0) {
      return null;
    }
    
    return variants.find(variant => {
      if (!variant.options) return false;
      return Object.entries(selectedOptions).every(
        ([key, value]) => variant.options?.[key] === value
      );
    }) || null;
  }, [variants, selectedOptions]);
  
  // Get product properties with correct field names - AFTER selectedVariant
  const currentPrice = useMemo(() => {
    const variantPrice = selectedVariant?.price;
    return variantPrice ?? product?.base_price ?? 0;
  }, [product, selectedVariant]);
  
  const compareAtPrice = useMemo(() => {
    return selectedVariant?.compare_at_price ?? product?.compare_at_price;
  }, [product, selectedVariant]);
  
  const currentStock = useMemo(() => {
    return selectedVariant?.quantity ?? product?.quantity ?? 0;
  }, [product, selectedVariant]);
  
  // Product images - convert string array to ProductImage array
  const images: ProductImage[] = useMemo(() => {
    if (!product?.images || product.images.length === 0) return [];
    return product.images.map((url, index) => ({
      url,
      alt: `${product.name} ${index + 1}`
    }));
  }, [product]);
  
  // Handlers
  const handleQuantityChange = useCallback((delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(prev + delta, currentStock || 99)));
  }, [currentStock]);
  
  const handleOptionChange = useCallback((optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
  }, []);
  
  const handleAddToCart = useCallback(async () => {
    if (!productId) return;
    
    setAddingToCart(true);
    try {
      await addItem(
        productId,
        selectedVariant?.id || null,
        quantity
      );
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setAddingToCart(false);
    }
  }, [productId, quantity, selectedVariant, addItem]);
  
  const handleWishlistToggle = useCallback(() => {
    if (inWishlist) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  }, [productId, inWishlist, addToWishlist, removeFromWishlist]);
  
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || "Product",
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [product]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">
          {isLoading ? "Loading product..." : product?.name || "Product Quick View"}
        </DialogTitle>
        
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center h-96 text-center p-6">
            <p className="text-destructive mb-4">Failed to load product</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
        
        {/* Product content */}
        {product && !isLoading && (
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Image gallery */}
            <div className="space-y-4">
              <ProductImageGallery
                images={images}
                productName={product.name}
                aspectRatio="square"
                showThumbnails
                enableZoom
              />
              
              {/* Sale badge */}
              {compareAtPrice && currentPrice < compareAtPrice && (
                <Badge variant="destructive" className="absolute top-8 left-8">
                  Sale
                </Badge>
              )}
            </div>
            
            {/* Product info */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold">{product.name}</h2>
              </div>
              
              {/* Price */}
              <ProductPriceDisplay
                price={currentPrice}
                compareAtPrice={compareAtPrice}
                size="lg"
                showSavingsBadge
              />
              
              {/* Stock status */}
              <ProductStockBadge
                stockQuantity={currentStock}
                trackInventory={trackInventory}
              />
              
              {/* Short description */}
              {product.description && (
                <p className="text-muted-foreground line-clamp-3">
                  {product.description}
                </p>
              )}
              
              <Separator />
              
              {/* Variant options */}
              {variantOptions.length > 0 && (
                <div className="space-y-4">
                  {variantOptions.map((option) => (
                    <div key={option.name}>
                      <Label className="text-sm font-medium">{option.name}</Label>
                      <Select
                        value={selectedOptions[option.name] || ""}
                        onValueChange={(value) => handleOptionChange(option.name, value)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder={`Select ${option.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {option.values.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Quantity selector */}
              <div>
                <Label className="text-sm font-medium">Quantity</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={trackInventory && quantity >= currentStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Add to cart */}
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={
                    addingToCart || 
                    cartLoading || 
                    (trackInventory && currentStock <= 0) ||
                    (variantOptions.length > 0 && Object.keys(selectedOptions).length < variantOptions.length)
                  }
                >
                  {addingToCart ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : trackInventory && currentStock <= 0 ? (
                    "Out of Stock"
                  ) : (
                    "Add to Cart"
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleWishlistToggle}
                  className={cn(inWishlist && "text-red-500")}
                >
                  <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} />
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              
              {/* View full details link */}
              {onViewFullDetails && (
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => {
                    onViewFullDetails(productId);
                    onOpenChange(false);
                  }}
                >
                  View Full Details
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// HOOK FOR MANAGING QUICK VIEW STATE
// =============================================================================

export function useProductQuickView() {
  const [quickViewState, setQuickViewState] = useState<{
    open: boolean;
    productId: string | null;
  }>({
    open: false,
    productId: null,
  });
  
  const openQuickView = useCallback((productId: string) => {
    setQuickViewState({ open: true, productId });
  }, []);
  
  const closeQuickView = useCallback(() => {
    setQuickViewState(prev => ({ ...prev, open: false }));
  }, []);
  
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      closeQuickView();
    }
  }, [closeQuickView]);
  
  return {
    isOpen: quickViewState.open,
    productId: quickViewState.productId,
    openQuickView,
    closeQuickView,
    handleOpenChange,
  };
}
