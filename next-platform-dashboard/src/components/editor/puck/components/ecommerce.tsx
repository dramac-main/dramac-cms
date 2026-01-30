/**
 * Puck E-commerce Components
 * 
 * E-commerce components for product displays.
 */

import type { ProductGridProps, ProductCardProps } from "@/types/puck";
import { cn } from "@/lib/utils";
import { Star, ShoppingCart, Heart, Eye, Tag } from "lucide-react";

/**
 * Product Grid Component
 * Display multiple products in a grid layout.
 */
export function ProductGridRender({
  columns = 4,
  gap = "md",
  products = [],
  showPrices = true,
  showRatings = true,
  showAddToCart = true,
}: ProductGridProps) {
  const columnClasses: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  const gapClasses: Record<string, string> = {
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
  };

  // Demo products if none provided
  const displayProducts = (products || []).length > 0 ? products : [
    {
      name: "Product 1",
      image: "/placeholder-product.jpg",
      price: 29.99,
      description: "A wonderful product description",
      rating: 4.5,
    },
    {
      name: "Product 2",
      image: "/placeholder-product.jpg",
      price: 49.99,
      salePrice: 39.99,
      description: "Another amazing product",
      rating: 5,
    },
    {
      name: "Product 3",
      image: "/placeholder-product.jpg",
      price: 19.99,
      description: "Best value for money",
      rating: 4,
    },
    {
      name: "Product 4",
      image: "/placeholder-product.jpg",
      price: 79.99,
      description: "Premium quality item",
      rating: 4.5,
    },
  ];

  return (
    <div
      className={cn(
        "grid w-full",
        columnClasses[columns || 4],
        gapClasses[gap || "md"]
      )}
    >
      {displayProducts.map((product, index) => (
        <ProductCard
          key={index}
          product={product}
          showPrices={showPrices}
          showRatings={showRatings}
          showAddToCart={showAddToCart}
        />
      ))}
    </div>
  );
}

/**
 * Product Card (internal component for grid)
 */
function ProductCard({
  product,
  showPrices,
  showRatings,
  showAddToCart,
}: {
  product: {
    name: string;
    image?: string;
    price?: number;
    salePrice?: number;
    description?: string;
    rating?: number;
    href?: string;
  };
  showPrices?: boolean;
  showRatings?: boolean;
  showAddToCart?: boolean;
}) {
  const hasDiscount = product.salePrice && product.salePrice < (product.price || 0);
  
  return (
    <div className="group relative bg-card rounded-lg border border-border overflow-hidden transition-shadow hover:shadow-lg">
      {/* Product Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Sale Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Sale
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            aria-label="Add to wishlist"
          >
            <Heart className="w-4 h-4" />
          </button>
          <button
            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            aria-label="Quick view"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <a
          href={product.href || "#"}
          className="block font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
        >
          {product.name}
        </a>
        
        {product.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
        )}
        
        {/* Rating */}
        {showRatings && product.rating && (
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < Math.floor(product.rating || 0)
                    ? "text-yellow-400 fill-yellow-400"
                    : i < (product.rating || 0)
                    ? "text-yellow-400 fill-yellow-400/50"
                    : "text-muted-foreground"
                )}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              ({product.rating})
            </span>
          </div>
        )}
        
        {/* Price and Cart */}
        <div className="flex items-center justify-between mt-3">
          {showPrices && (
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="font-bold text-destructive">
                    ${product.salePrice?.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.price?.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="font-bold">
                  ${product.price?.toFixed(2) || "0.00"}
                </span>
              )}
            </div>
          )}
          
          {showAddToCart && (
            <button
              className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Product Card Component (standalone)
 * Single product card display.
 */
export function ProductCardRender({
  name = "Product Name",
  image,
  price = 0,
  salePrice,
  description,
  rating,
  href = "#",
  showQuickView = true,
  showWishlist = true,
}: ProductCardProps) {
  const hasDiscount = salePrice && salePrice < price;
  
  return (
    <div className="group relative w-full max-w-sm bg-card rounded-lg border border-border overflow-hidden transition-shadow hover:shadow-lg">
      {/* Product Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Sale Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {Math.round((1 - salePrice / price) * 100)}% OFF
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {showWishlist && (
            <button
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm"
              aria-label="Add to wishlist"
            >
              <Heart className="w-4 h-4" />
            </button>
          )}
          {showQuickView && (
            <button
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm"
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <a
          href={href}
          className="block font-semibold text-lg text-foreground hover:text-primary transition-colors"
        >
          {name}
        </a>
        
        {description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {description}
          </p>
        )}
        
        {/* Rating */}
        {rating !== undefined && rating !== null && (
          <div className="flex items-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < Math.floor(rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : i < rating
                    ? "text-yellow-400 fill-yellow-400/50"
                    : "text-muted-foreground"
                )}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-1">
              ({rating.toFixed(1)})
            </span>
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center gap-2 mt-3">
          {hasDiscount ? (
            <>
              <span className="text-xl font-bold text-destructive">
                ${salePrice.toFixed(2)}
              </span>
              <span className="text-muted-foreground line-through">
                ${price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-xl font-bold">
              ${price.toFixed(2)}
            </span>
          )}
        </div>
        
        {/* Add to Cart Button */}
        <button className="w-full mt-4 px-4 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
