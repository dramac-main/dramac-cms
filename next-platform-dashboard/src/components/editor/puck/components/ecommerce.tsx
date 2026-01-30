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
      image: "/placeholder-product.svg",
      price: 29.99,
      description: "A wonderful product description",
      rating: 4.5,
    },
    {
      name: "Product 2",
      image: "/placeholder-product.svg",
      price: 49.99,
      salePrice: 39.99,
      description: "Another amazing product",
      rating: 5,
    },
    {
      name: "Product 3",
      image: "/placeholder-product.svg",
      price: 19.99,
      description: "Best value for money",
      rating: 4,
    },
    {
      name: "Product 4",
      image: "/placeholder-product.svg",
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

/**
 * Product Categories Component
 * Display product categories grid
 */
export interface ProductCategoriesProps {
  title?: string;
  subtitle?: string;
  categories?: Array<{
    name: string;
    image?: string;
    href?: string;
    productCount?: number;
  }>;
  columns?: 2 | 3 | 4;
  layout?: "grid" | "carousel";
  showProductCount?: boolean;
}

export function ProductCategoriesRender({
  title = "Shop by Category",
  subtitle = "Browse our collections",
  categories = [],
  columns = 4,
  showProductCount = true,
}: ProductCategoriesProps) {
  const columnClasses: Record<number, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  const displayCategories = categories.length > 0 ? categories : [
    { name: "Electronics", image: "/placeholder-product.svg", href: "#", productCount: 145 },
    { name: "Clothing", image: "/placeholder-product.svg", href: "#", productCount: 230 },
    { name: "Home & Garden", image: "/placeholder-product.svg", href: "#", productCount: 89 },
    { name: "Sports", image: "/placeholder-product.svg", href: "#", productCount: 67 },
  ];

  return (
    <div className="w-full py-8">
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && <h2 className="text-2xl font-bold text-foreground">{title}</h2>}
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
      )}
      
      <div className={cn("grid gap-4", columnClasses[columns])}>
        {displayCategories.map((category, index) => (
          <a
            key={index}
            href={category.href || "#"}
            className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
          >
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="font-semibold text-lg">{category.name}</h3>
              {showProductCount && category.productCount && (
                <p className="text-sm text-white/80">{category.productCount} products</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Cart Summary Component
 * Display shopping cart summary
 */
export interface CartSummaryProps {
  showItemCount?: boolean;
  showSubtotal?: boolean;
  checkoutButtonText?: string;
  emptyCartText?: string;
  backgroundColor?: string;
}

export function CartSummaryRender({
  showItemCount = true,
  showSubtotal = true,
  checkoutButtonText = "Checkout",
  emptyCartText = "Your cart is empty",
  backgroundColor,
}: CartSummaryProps) {
  // Demo cart items
  const cartItems = [
    { name: "Product 1", price: 29.99, quantity: 2 },
    { name: "Product 2", price: 49.99, quantity: 1 },
  ];
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div 
      className="w-full max-w-md bg-card border border-border rounded-lg p-6"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Shopping Cart
        </h3>
        {showItemCount && (
          <span className="bg-primary text-primary-foreground text-sm font-medium px-2 py-0.5 rounded-full">
            {itemCount}
          </span>
        )}
      </div>
      
      {cartItems.length > 0 ? (
        <>
          <div className="space-y-3 mb-4">
            {cartItems.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.name} <span className="text-muted-foreground">x{item.quantity}</span>
                </span>
                <span className="font-medium text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          {showSubtotal && (
            <div className="border-t border-border pt-4 mb-4">
              <div className="flex justify-between font-semibold">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          <button className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
            {checkoutButtonText}
          </button>
        </>
      ) : (
        <p className="text-center text-muted-foreground py-8">{emptyCartText}</p>
      )}
    </div>
  );
}

/**
 * Product Filters Component
 * Filter sidebar for product listings
 */
export interface ProductFiltersProps {
  showPriceFilter?: boolean;
  showCategoryFilter?: boolean;
  showRatingFilter?: boolean;
  showSortOptions?: boolean;
  priceRanges?: Array<{ label: string; min: number; max: number }>;
  categories?: string[];
}

export function ProductFiltersRender({
  showPriceFilter = true,
  showCategoryFilter = true,
  showRatingFilter = true,
  showSortOptions = true,
  priceRanges = [],
  categories = [],
}: ProductFiltersProps) {
  const defaultPriceRanges = priceRanges.length > 0 ? priceRanges : [
    { label: "Under $25", min: 0, max: 25 },
    { label: "$25 - $50", min: 25, max: 50 },
    { label: "$50 - $100", min: 50, max: 100 },
    { label: "Over $100", min: 100, max: 999999 },
  ];

  const defaultCategories = categories.length > 0 ? categories : [
    "Electronics", "Clothing", "Home", "Sports", "Toys"
  ];

  return (
    <div className="w-full max-w-xs bg-card border border-border rounded-lg p-4 space-y-6">
      {showSortOptions && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Sort By</h4>
          <select className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground">
            <option>Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest</option>
            <option>Best Selling</option>
          </select>
        </div>
      )}
      
      {showCategoryFilter && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Category</h4>
          <div className="space-y-2">
            {defaultCategories.map((category, index) => (
              <label key={index} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-foreground">{category}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {showPriceFilter && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Price Range</h4>
          <div className="space-y-2">
            {defaultPriceRanges.map((range, index) => (
              <label key={index} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="price" className="border-border" />
                <span className="text-foreground">{range.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {showRatingFilter && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Rating</h4>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">& Up</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
        Apply Filters
      </button>
    </div>
  );
}

/**
 * Product Quick View Component
 * Quick view modal for products
 */
export interface ProductQuickViewProps {
  productName?: string;
  productImage?: string;
  price?: number;
  salePrice?: number;
  description?: string;
  rating?: number;
  showQuantitySelector?: boolean;
  showSizeSelector?: boolean;
  sizes?: string[];
}

export function ProductQuickViewRender({
  productName = "Product Name",
  productImage,
  price = 99.99,
  salePrice,
  description = "This is a detailed product description that explains all the features and benefits of this amazing product.",
  rating = 4.5,
  showQuantitySelector = true,
  showSizeSelector = true,
  sizes = ["XS", "S", "M", "L", "XL"],
}: ProductQuickViewProps) {
  const hasDiscount = salePrice && salePrice < price;

  return (
    <div className="w-full max-w-4xl bg-card rounded-lg border border-border overflow-hidden">
      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* Product Image */}
        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
          {productImage ? (
            <img src={productImage} alt={productName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/40" />
            </div>
          )}
        </div>
        
        {/* Product Details */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-foreground">{productName}</h2>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-5 h-5",
                  i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                )}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-2">({rating})</span>
          </div>
          
          {/* Price */}
          <div className="flex items-center gap-3 mt-4">
            {hasDiscount ? (
              <>
                <span className="text-2xl font-bold text-destructive">${salePrice.toFixed(2)}</span>
                <span className="text-lg text-muted-foreground line-through">${price.toFixed(2)}</span>
                <span className="bg-destructive/10 text-destructive text-sm px-2 py-1 rounded">
                  Save {Math.round((1 - salePrice / price) * 100)}%
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-foreground">${price.toFixed(2)}</span>
            )}
          </div>
          
          {/* Description */}
          <p className="text-muted-foreground mt-4">{description}</p>
          
          {/* Size Selector */}
          {showSizeSelector && (
            <div className="mt-6">
              <h4 className="font-medium text-foreground mb-2">Size</h4>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    className="px-4 py-2 border border-border rounded-md hover:border-primary hover:bg-primary/10 transition-colors text-foreground"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4 mt-6">
            {showQuantitySelector && (
              <div className="flex items-center border border-border rounded-md">
                <button className="px-3 py-2 hover:bg-muted transition-colors">-</button>
                <span className="px-4 py-2 border-x border-border">1</span>
                <button className="px-3 py-2 hover:bg-muted transition-colors">+</button>
              </div>
            )}
            <button className="flex-1 px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
          </div>
          
          {/* Wishlist */}
          <button className="mt-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Heart className="w-5 h-5" />
            Add to Wishlist
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Featured Products Component
 * Showcase featured/promotional products
 */
export interface FeaturedProductsProps {
  title?: string;
  subtitle?: string;
  layout?: "banner" | "carousel" | "grid";
  products?: Array<{
    name: string;
    image?: string;
    price?: number;
    salePrice?: number;
    badge?: string;
    href?: string;
  }>;
  showBadges?: boolean;
}

export function FeaturedProductsRender({
  title = "Featured Products",
  subtitle = "Discover our top picks",
  layout = "grid",
  products = [],
  showBadges = true,
}: FeaturedProductsProps) {
  const displayProducts = products.length > 0 ? products : [
    { name: "Premium Headphones", image: "/placeholder-product.svg", price: 299.99, salePrice: 249.99, badge: "Hot", href: "#" },
    { name: "Smart Watch", image: "/placeholder-product.svg", price: 399.99, badge: "New", href: "#" },
    { name: "Wireless Earbuds", image: "/placeholder-product.svg", price: 149.99, salePrice: 99.99, badge: "Sale", href: "#" },
  ];

  const getBadgeColor = (badge?: string) => {
    switch (badge?.toLowerCase()) {
      case "hot": return "bg-orange-500";
      case "new": return "bg-green-500";
      case "sale": return "bg-red-500";
      default: return "bg-primary";
    }
  };

  return (
    <div className="w-full py-8">
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && <h2 className="text-2xl font-bold text-foreground">{title}</h2>}
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayProducts.map((product, index) => (
          <a
            key={index}
            href={product.href || "#"}
            className="group relative bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Badge */}
            {showBadges && product.badge && (
              <div className={cn(
                "absolute top-3 left-3 z-10 text-white text-xs font-bold px-2 py-1 rounded",
                getBadgeColor(product.badge)
              )}>
                {product.badge}
              </div>
            )}
            
            {/* Image */}
            <div className="aspect-[4/3] bg-muted overflow-hidden">
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
            </div>
            
            {/* Info */}
            <div className="p-4">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                {product.salePrice && product.salePrice < (product.price || 0) ? (
                  <>
                    <span className="font-bold text-destructive">${product.salePrice.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground line-through">${product.price?.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="font-bold text-foreground">${product.price?.toFixed(2) || "0.00"}</span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Shopping Cart Icon with Count
 */
export interface CartIconProps {
  count?: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export function CartIconRender({
  count = 3,
  showCount = true,
  size = "md",
  variant = "default",
}: CartIconProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-transparent text-foreground hover:bg-muted",
    ghost: "bg-transparent text-foreground hover:bg-muted",
  };

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center rounded-full transition-colors",
        sizeClasses[size],
        variantClasses[variant]
      )}
    >
      <ShoppingCart className={iconSizes[size]} />
      {showCount && count > 0 && (
        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

