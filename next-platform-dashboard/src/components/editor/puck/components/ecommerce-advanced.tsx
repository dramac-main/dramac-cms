/**
 * Puck Advanced E-Commerce Components (PHASE-ED-03C)
 * 
 * Advanced e-commerce components for product pages, cart experiences,
 * and conversion optimization.
 */

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Star,
  Heart,
  ShoppingCart,
  Truck,
  Clock,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
  Ruler,
  Eye,
  Plus,
  Minus,
} from "lucide-react";
import type {
  ProductShowcaseProps,
  ProductTabsProps,
  ProductReviewsProps,
  ShippingCalculatorProps,
  SizeGuideProps,
  WishlistButtonProps,
  RecentlyViewedProps,
  RelatedProductsProps,
  ProductBundleProps,
  StockIndicatorProps,
} from "@/types/puck";

// ============================================
// PRODUCT SHOWCASE COMPONENT
// ============================================

export function ProductShowcaseRender({
  images = [],
  name = "Product Name",
  price = 99.99,
  salePrice,
  rating = 4.5,
  reviewCount = 128,
  description = "Product description goes here.",
  badges = [],
  showThumbnails = true,
  thumbnailPosition = "bottom",
  zoomOnHover = true,
}: ProductShowcaseProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const displayImages = images.length > 0 ? images : [{ src: "/placeholder-product.svg", alt: "Product" }];

  return (
    <div className={cn("grid gap-8", thumbnailPosition === "left" ? "md:grid-cols-[80px_1fr_1fr]" : "md:grid-cols-2")}>
      {/* Thumbnails (Left position) */}
      {showThumbnails && thumbnailPosition === "left" && (
        <div className="hidden md:flex flex-col gap-2">
          {displayImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "w-16 h-16 rounded border overflow-hidden transition-all",
                selectedImage === index ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
              )}
            >
              <img src={img.src} alt={img.alt || ""} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div className="relative">
        <div
          className={cn(
            "aspect-square rounded-lg overflow-hidden bg-muted",
            zoomOnHover && "cursor-zoom-in"
          )}
          onMouseEnter={() => zoomOnHover && setIsZoomed(true)}
          onMouseLeave={() => zoomOnHover && setIsZoomed(false)}
        >
          <img
            src={displayImages[selectedImage]?.src}
            alt={displayImages[selectedImage]?.alt || name}
            className={cn(
              "w-full h-full object-cover transition-transform duration-300",
              isZoomed && "scale-150"
            )}
          />
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {badges.map((badge, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-semibold rounded"
                style={{ backgroundColor: badge.color || "#ef4444", color: "#fff" }}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImage((prev) => (prev - 1 + displayImages.length) % displayImages.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedImage((prev) => (prev + 1) % displayImages.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Thumbnails (Bottom position) */}
        {showThumbnails && thumbnailPosition === "bottom" && displayImages.length > 1 && (
          <div className="flex gap-2 mt-4 justify-center">
            {displayImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "w-16 h-16 rounded border overflow-hidden transition-all",
                  selectedImage === index ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                )}
              >
                <img src={img.src} alt={img.alt || ""} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{name}</h1>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-5 h-5",
                  i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {rating} ({reviewCount} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">
            ${salePrice ? salePrice.toFixed(2) : price.toFixed(2)}
          </span>
          {salePrice && (
            <span className="text-xl text-muted-foreground line-through">${price.toFixed(2)}</span>
          )}
          {salePrice && (
            <span className="text-sm font-semibold text-green-600">
              Save ${(price - salePrice).toFixed(2)}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-muted-foreground">{description}</p>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>
          <button className="p-3 border rounded-lg hover:bg-muted transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PRODUCT TABS COMPONENT
// ============================================

export function ProductTabsRender({
  tabs = [],
  defaultTab = 0,
  variant = "underline",
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const defaultTabs = [
    { id: "description", label: "Description", content: "Product description content goes here." },
    { id: "specs", label: "Specifications", content: "Product specifications content goes here." },
    { id: "reviews", label: "Reviews", content: "Customer reviews content goes here." },
  ];

  const displayTabs = tabs.length > 0 ? tabs : defaultTabs;

  const variantStyles: Record<string, { container: string; tab: string; activeTab: string }> = {
    underline: {
      container: "border-b",
      tab: "pb-3 px-4 text-muted-foreground hover:text-foreground transition-colors",
      activeTab: "pb-3 px-4 text-foreground border-b-2 border-primary -mb-px",
    },
    pills: {
      container: "gap-2",
      tab: "px-4 py-2 rounded-full text-muted-foreground hover:bg-muted transition-colors",
      activeTab: "px-4 py-2 rounded-full bg-primary text-primary-foreground",
    },
    boxed: {
      container: "bg-muted p-1 rounded-lg",
      tab: "px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors",
      activeTab: "px-4 py-2 rounded-md bg-background shadow text-foreground",
    },
  };

  const styles = variantStyles[variant || "underline"];

  return (
    <div>
      {/* Tab Headers */}
      <div className={cn("flex", styles.container)}>
        {displayTabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(index)}
            className={activeTab === index ? styles.activeTab : styles.tab}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6">
        <div className="prose prose-sm max-w-none">
          {displayTabs[activeTab]?.content}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PRODUCT REVIEWS COMPONENT
// ============================================

export function ProductReviewsRender({
  reviews = [],
  averageRating = 4.5,
  totalReviews = 128,
  ratingDistribution = { 5: 65, 4: 25, 3: 7, 2: 2, 1: 1 },
  showWriteReview = true,
  showFilters = true,
}: ProductReviewsProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const defaultReviews = [
    {
      id: "1",
      author: "John D.",
      rating: 5,
      date: "2026-01-15",
      title: "Excellent product!",
      content: "This exceeded my expectations. Great quality and fast shipping.",
      verified: true,
    },
    {
      id: "2",
      author: "Sarah M.",
      rating: 4,
      date: "2026-01-10",
      title: "Good but could be better",
      content: "Overall happy with the purchase. Minor improvements could be made.",
      verified: true,
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;
  const filteredReviews = selectedRating
    ? displayReviews.filter((r) => r.rating === selectedRating)
    : displayReviews;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Average Rating */}
        <div className="text-center p-6 bg-muted rounded-lg">
          <div className="text-5xl font-bold mb-2">{averageRating}</div>
          <div className="flex justify-center mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-6 h-6",
                  i < Math.floor(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <p className="text-muted-foreground">Based on {totalReviews} reviews</p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const percentage = ratingDistribution[rating as keyof typeof ratingDistribution] || 0;
            return (
              <button
                key={rating}
                onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors",
                  selectedRating === rating && "bg-muted"
                )}
              >
                <span className="w-8 text-sm">{rating}★</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-sm text-muted-foreground">{percentage}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Write Review Button */}
      {showWriteReview && (
        <button className="w-full md:w-auto px-6 py-3 border rounded-lg hover:bg-muted transition-colors">
          Write a Review
        </button>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedRating(null)}
            className={cn(
              "px-3 py-1 text-sm rounded-full border transition-colors",
              !selectedRating && "bg-primary text-primary-foreground border-primary"
            )}
          >
            All Reviews
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setSelectedRating(rating)}
              className={cn(
                "px-3 py-1 text-sm rounded-full border transition-colors",
                selectedRating === rating && "bg-primary text-primary-foreground border-primary"
              )}
            >
              {rating}★
            </button>
          ))}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <div key={review.id} className="p-6 border rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{review.author}</span>
                  {review.verified && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">{review.date}</span>
                </div>
              </div>
            </div>
            {review.title && <h4 className="font-semibold mb-2">{review.title}</h4>}
            <p className="text-muted-foreground">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// SHIPPING CALCULATOR COMPONENT
// ============================================

export function ShippingCalculatorRender({
  methods = [],
  defaultCountry = "US",
  showEstimate = true,
  freeShippingThreshold,
  currentTotal = 0,
}: ShippingCalculatorProps) {
  const [country, setCountry] = useState(defaultCountry);
  const [zipCode, setZipCode] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(0);

  const defaultMethods = [
    { name: "Standard Shipping", price: 5.99, estimate: "5-7 business days" },
    { name: "Express Shipping", price: 12.99, estimate: "2-3 business days" },
    { name: "Next Day Delivery", price: 24.99, estimate: "1 business day" },
  ];

  const displayMethods = methods.length > 0 ? methods : defaultMethods;
  const remainingForFree = freeShippingThreshold ? freeShippingThreshold - currentTotal : 0;

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Shipping Options</h3>
      </div>

      {/* Free Shipping Progress */}
      {freeShippingThreshold && remainingForFree > 0 && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
          <p className="text-green-700 dark:text-green-300">
            Add ${remainingForFree.toFixed(2)} more for FREE shipping!
          </p>
          <div className="mt-2 h-2 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(currentTotal / freeShippingThreshold) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Location Input */}
      <div className="grid grid-cols-2 gap-3">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="p-2 border rounded-lg bg-background"
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="UK">United Kingdom</option>
          <option value="AU">Australia</option>
        </select>
        <input
          type="text"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          placeholder="ZIP Code"
          className="p-2 border rounded-lg bg-background"
        />
      </div>

      {/* Shipping Methods */}
      <div className="space-y-2">
        {displayMethods.map((method, index) => (
          <button
            key={index}
            onClick={() => setSelectedMethod(index)}
            className={cn(
              "w-full flex items-center justify-between p-4 border rounded-lg transition-all",
              selectedMethod === index ? "border-primary bg-primary/5" : "hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-colors",
                  selectedMethod === index ? "border-primary bg-primary" : "border-muted-foreground"
                )}
              />
              <div className="text-left">
                <p className="font-medium">{method.name}</p>
                {showEstimate && method.estimate && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {method.estimate}
                  </p>
                )}
              </div>
            </div>
            <span className="font-semibold">${method.price.toFixed(2)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// SIZE GUIDE COMPONENT
// ============================================

export function SizeGuideRender({
  title = "Size Guide",
  sizes = [],
  measurements = [],
  unit = "inches",
  showToggle = true,
}: SizeGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayUnit, setDisplayUnit] = useState(unit);

  const defaultSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const defaultMeasurements = [
    { name: "Chest", values: [32, 34, 36, 38, 40, 42] },
    { name: "Waist", values: [26, 28, 30, 32, 34, 36] },
    { name: "Hips", values: [34, 36, 38, 40, 42, 44] },
  ];

  const displaySizes = sizes.length > 0 ? sizes : defaultSizes;
  const displayMeasurements = measurements.length > 0 ? measurements : defaultMeasurements;

  const convertToCm = (inches: number) => Math.round(inches * 2.54);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <Ruler className="w-4 h-4" />
        {title}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
          <div
            className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{title}</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {showToggle && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setDisplayUnit("inches")}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm",
                    displayUnit === "inches" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  Inches
                </button>
                <button
                  onClick={() => setDisplayUnit("cm")}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm",
                    displayUnit === "cm" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  Centimeters
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Measurement</th>
                    {displaySizes.map((size) => (
                      <th key={size} className="p-3 font-semibold text-center">{size}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayMeasurements.map((measurement, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 font-medium">{measurement.name}</td>
                      {measurement.values.map((value, i) => (
                        <td key={i} className="p-3 text-center">
                          {displayUnit === "cm" ? convertToCm(value) : value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// WISHLIST BUTTON COMPONENT
// ============================================

export function WishlistButtonRender({
  isInWishlist = false,
  variant = "icon",
  size = "md",
  showCount = false,
  count = 0,
}: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist);

  const sizeMap: Record<string, { icon: string; button: string }> = {
    sm: { icon: "w-4 h-4", button: "p-2 text-sm" },
    md: { icon: "w-5 h-5", button: "p-3" },
    lg: { icon: "w-6 h-6", button: "p-4 text-lg" },
  };

  if (variant === "icon") {
    return (
      <button
        onClick={() => setIsWishlisted(!isWishlisted)}
        className={cn(
          "rounded-lg border transition-colors relative",
          sizeMap[size || "md"].button,
          isWishlisted
            ? "bg-red-50 border-red-200 text-red-500"
            : "hover:bg-muted"
        )}
      >
        <Heart
          className={cn(
            sizeMap[size || "md"].icon,
            isWishlisted && "fill-current"
          )}
        />
        {showCount && count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => setIsWishlisted(!isWishlisted)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
        isWishlisted
          ? "bg-red-50 border-red-200 text-red-500"
          : "hover:bg-muted"
      )}
    >
      <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
      {isWishlisted ? "In Wishlist" : "Add to Wishlist"}
    </button>
  );
}

// ============================================
// RECENTLY VIEWED COMPONENT
// ============================================

export function RecentlyViewedRender({
  title = "Recently Viewed",
  products = [],
  columns = 4,
  showPrice = true,
}: RecentlyViewedProps) {
  const defaultProducts: RecentlyViewedProps['products'] = [
    { id: "1", name: "Product 1", image: "/placeholder-product.svg", price: 29.99, href: "#" },
    { id: "2", name: "Product 2", image: "/placeholder-product.svg", price: 39.99, href: "#" },
    { id: "3", name: "Product 3", image: "/placeholder-product.svg", price: 49.99, href: "#" },
    { id: "4", name: "Product 4", image: "/placeholder-product.svg", price: 59.99, href: "#" },
  ];

  const displayProducts = products.length > 0 ? products : defaultProducts;

  const columnMap: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className={cn("grid gap-4", columnMap[columns || 4])}>
        {displayProducts.map((product) => (
          <a
            key={product.id}
            href={product.href || "#"}
            className="group"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
              <img
                src={product.image || "/placeholder-product.svg"}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <h4 className="font-medium truncate group-hover:text-primary transition-colors">
              {product.name}
            </h4>
            {showPrice && product.price && (
              <p className="text-muted-foreground">${product.price.toFixed(2)}</p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

// ============================================
// RELATED PRODUCTS COMPONENT
// ============================================

export function RelatedProductsRender({
  title = "You May Also Like",
  products = [],
  columns = 4,
  showRating = true,
  showAddToCart = true,
}: RelatedProductsProps) {
  const defaultProducts: RelatedProductsProps['products'] = [
    { id: "1", name: "Related Product 1", image: "/placeholder-product.svg", price: 29.99, rating: 4.5, href: "#" },
    { id: "2", name: "Related Product 2", image: "/placeholder-product.svg", price: 39.99, rating: 4.2, href: "#" },
    { id: "3", name: "Related Product 3", image: "/placeholder-product.svg", price: 49.99, rating: 4.8, href: "#" },
    { id: "4", name: "Related Product 4", image: "/placeholder-product.svg", price: 59.99, rating: 4.0, href: "#" },
  ];

  const displayProducts = products.length > 0 ? products : defaultProducts;

  const columnMap: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className={cn("grid gap-4", columnMap[columns || 4])}>
        {displayProducts.map((product) => (
          <div key={product.id} className="group border rounded-lg overflow-hidden">
            <a href={product.href || "#"} className="block">
              <div className="aspect-square bg-muted overflow-hidden">
                <img
                  src={product.image || "/placeholder-product.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            </a>
            <div className="p-4">
              <a href={product.href || "#"}>
                <h4 className="font-medium mb-1 group-hover:text-primary transition-colors truncate">
                  {product.name}
                </h4>
              </a>
              {showRating && product.rating && (
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-muted-foreground">{product.rating}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-semibold">${product.price.toFixed(2)}</span>
                {showAddToCart && (
                  <button className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// PRODUCT BUNDLE COMPONENT
// ============================================

export function ProductBundleRender({
  title = "Frequently Bought Together",
  products = [],
  bundlePrice,
  originalPrice,
  savings,
  showAddBundle = true,
}: ProductBundleProps) {
  const defaultProducts = [
    { id: "1", name: "Main Product", image: "/placeholder-product.svg", price: 49.99 },
    { id: "2", name: "Accessory 1", image: "/placeholder-product.svg", price: 19.99 },
    { id: "3", name: "Accessory 2", image: "/placeholder-product.svg", price: 14.99 },
  ];

  const displayProducts = products.length > 0 ? products : defaultProducts;
  const calculatedOriginal = originalPrice || displayProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const calculatedBundle = bundlePrice || calculatedOriginal * 0.85;
  const calculatedSavings = savings || calculatedOriginal - calculatedBundle;

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="flex items-center gap-4 flex-wrap mb-6">
        {displayProducts.map((product, index) => (
          <React.Fragment key={product.id}>
            <div className="text-center">
              <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden mb-2">
                <img
                  src={product.image || "/placeholder-product.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm font-medium truncate max-w-[96px]">{product.name}</p>
              <p className="text-sm text-muted-foreground">${product.price?.toFixed(2)}</p>
            </div>
            {index < displayProducts.length - 1 && (
              <Plus className="w-6 h-6 text-muted-foreground" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground line-through">${calculatedOriginal.toFixed(2)}</p>
          <p className="text-2xl font-bold">${calculatedBundle.toFixed(2)}</p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Save ${calculatedSavings.toFixed(2)}
          </p>
        </div>
        {showAddBundle && (
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Package className="w-5 h-5" />
            Add Bundle
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// STOCK INDICATOR COMPONENT
// ============================================

export function StockIndicatorRender({
  status = "in_stock",
  quantity,
  lowStockThreshold = 10,
  showQuantity = true,
  variant = "badge",
}: StockIndicatorProps) {
  const statusConfig: Record<string, { label: string; color: string; icon: typeof Check }> = {
    in_stock: { label: "In Stock", color: "text-green-600 bg-green-50", icon: Check },
    low_stock: { label: "Low Stock", color: "text-yellow-600 bg-yellow-50", icon: AlertTriangle },
    out_of_stock: { label: "Out of Stock", color: "text-red-600 bg-red-50", icon: X },
    pre_order: { label: "Pre-Order", color: "text-blue-600 bg-blue-50", icon: Clock },
  };

  const effectiveStatus = quantity !== undefined
    ? quantity === 0
      ? "out_of_stock"
      : quantity <= lowStockThreshold
        ? "low_stock"
        : "in_stock"
    : status;

  const config = statusConfig[effectiveStatus] || statusConfig.in_stock;
  const StatusIcon = config.icon;

  if (variant === "text") {
    return (
      <span className={cn("text-sm font-medium", config.color.split(" ")[0])}>
        {config.label}
        {showQuantity && quantity !== undefined && quantity > 0 && ` (${quantity} left)`}
      </span>
    );
  }

  if (variant === "dot") {
    return (
      <span className="flex items-center gap-2 text-sm">
        <span
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            effectiveStatus === "in_stock" && "bg-green-500",
            effectiveStatus === "low_stock" && "bg-yellow-500",
            effectiveStatus === "out_of_stock" && "bg-red-500",
            effectiveStatus === "pre_order" && "bg-blue-500"
          )}
        />
        {config.label}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium", config.color)}>
      <StatusIcon className="w-4 h-4" />
      {config.label}
      {showQuantity && quantity !== undefined && quantity > 0 && ` (${quantity})`}
    </span>
  );
}
