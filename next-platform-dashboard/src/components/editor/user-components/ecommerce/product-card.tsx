'use client';

/**
 * ProductCard Component for Visual Editor (Craft.js)
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Displays a single product card that can be dragged onto website pages.
 * Can be configured to show a specific product or pull from featured products.
 */
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react';
import { useNode } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingBag, Star, ShoppingCart, Heart } from 'lucide-react';
import type { Product } from '@/modules/ecommerce/types/ecommerce-types';

// ============================================================================
// TYPES
// ============================================================================

interface ProductCardProps {
  siteId?: string;
  productId?: string;
  productSlug?: string;
  showDescription?: boolean;
  showPrice?: boolean;
  showComparePrice?: boolean;
  showAddToCart?: boolean;
  showWishlist?: boolean;
  showBadges?: boolean;
  imagePosition?: 'top' | 'left' | 'right';
  cardStyle?: 'minimal' | 'bordered' | 'shadow' | 'elevated';
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  priceColor?: string;
  borderRadius?: number;
  imageHeight?: number;
}

// ============================================================================
// DEFAULT PROPS
// ============================================================================

const defaultProps: ProductCardProps = {
  showDescription: true,
  showPrice: true,
  showComparePrice: true,
  showAddToCart: true,
  showWishlist: false,
  showBadges: true,
  imagePosition: 'top',
  cardStyle: 'bordered',
  buttonStyle: 'primary',
  priceColor: '#16a34a',
  borderRadius: 12,
  imageHeight: 280,
};

// ============================================================================
// MOCK DATA
// ============================================================================

const mockProduct: Product = {
  id: 'sample-1',
  site_id: '',
  agency_id: '',
  name: 'Premium Wireless Headphones',
  slug: 'premium-wireless-headphones',
  description: 'Experience crystal-clear audio with our premium wireless headphones. Features active noise cancellation, 30-hour battery life, and ultra-comfortable ear cushions.',
  short_description: 'Premium sound, all-day comfort',
  base_price: 19999,
  compare_at_price: 24999,
  cost_price: null,
  tax_class: 'standard',
  is_taxable: true,
  sku: 'WH-PRO-001',
  barcode: null,
  track_inventory: true,
  quantity: 50,
  low_stock_threshold: 5,
  weight: null,
  weight_unit: 'kg',
  status: 'active',
  is_featured: true,
  seo_title: null,
  seo_description: null,
  images: ['https://placehold.co/400x400/1e293b/f8fafc?text=Headphones'],
  metadata: {},
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPrice(cents: number): string {
  return `${DEFAULT_CURRENCY_SYMBOL}${(cents / 100).toFixed(2)}`;
}

function getCardStyles(style: string, borderRadius: number): React.CSSProperties {
  const base: React.CSSProperties = { borderRadius: `${borderRadius}px`, overflow: 'hidden' };
  switch (style) {
    case 'bordered':
      return { ...base, border: '1px solid #e5e7eb' };
    case 'shadow':
      return { ...base, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' };
    case 'elevated':
      return { ...base, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6' };
    default:
      return base;
  }
}

function getButtonStyles(style: string, priceColor: string): React.CSSProperties {
  switch (style) {
    case 'primary':
      return { backgroundColor: priceColor, color: 'white', border: 'none' };
    case 'secondary':
      return { backgroundColor: '#f3f4f6', color: '#374151', border: 'none' };
    default:
      return { backgroundColor: 'transparent', color: priceColor, border: `2px solid ${priceColor}` };
  }
}

// ============================================================================
// PRODUCT CARD COMPONENT
// ============================================================================

export function ProductCard(props: ProductCardProps) {
  const mergedProps = { ...defaultProps, ...props };
  const {
    siteId,
    productId,
    productSlug,
    showDescription,
    showPrice,
    showComparePrice,
    showAddToCart,
    showWishlist,
    showBadges,
    imagePosition,
    cardStyle,
    buttonStyle,
    priceColor,
    borderRadius,
    imageHeight,
  } = mergedProps;

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const [product, setProduct] = useState<Product>(mockProduct);

  // In production, fetch real product
  useEffect(() => {
    if (siteId && (productId || productSlug) && typeof window !== 'undefined') {
      const isEditor = document.querySelector('[data-craftjs-root]');
      if (!isEditor) {
        const endpoint = productId
          ? `/api/modules/ecommerce/products/${productId}?siteId=${siteId}`
          : `/api/modules/ecommerce/products/slug/${productSlug}?siteId=${siteId}`;
        fetch(endpoint)
          .then(res => res.json())
          .then(data => {
            if (data.product) setProduct(data.product);
          })
          .catch(console.error);
      }
    }
  }, [siteId, productId, productSlug]);

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.base_price / product.compare_at_price!) * 100)
    : 0;

  const isHorizontal = imagePosition === 'left' || imagePosition === 'right';

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`product-card-component bg-white ${selected ? 'ring-2 ring-blue-500' : ''}`}
      style={getCardStyles(cardStyle!, borderRadius!)}
    >
      <div
        className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${imagePosition === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {/* Product Image */}
        <div
          className={`relative bg-gray-100 ${isHorizontal ? 'w-1/2' : 'w-full'}`}
          style={{ height: isHorizontal ? 'auto' : `${imageHeight}px`, minHeight: isHorizontal ? '200px' : undefined }}
        >
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-gray-300" />
            </div>
          )}

          {/* Badges */}
          {showBadges && (
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {hasDiscount && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                  -{discountPercent}%
                </span>
              )}
              {product.is_featured && (
                <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Featured
                </span>
              )}
              {product.quantity <= product.low_stock_threshold && product.quantity > 0 && (
                <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                  Low Stock
                </span>
              )}
            </div>
          )}

          {/* Wishlist Button */}
          {showWishlist && (
            <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
              <Heart className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className={`p-5 ${isHorizontal ? 'w-1/2 flex flex-col justify-center' : ''}`}>
          <h3 className="font-semibold text-lg text-gray-900 mb-2">
            {product.name}
          </h3>

          {showDescription && product.short_description && (
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
              {product.short_description}
            </p>
          )}

          {showPrice && (
            <div className="flex items-baseline gap-3 mb-4">
              <span
                className="font-bold text-2xl"
                style={{ color: priceColor }}
              >
                {formatPrice(product.base_price)}
              </span>
              {showComparePrice && hasDiscount && (
                <span className="text-gray-400 line-through text-lg">
                  {formatPrice(product.compare_at_price!)}
                </span>
              )}
            </div>
          )}

          {showAddToCart && (
            <button
              className="w-full py-3 px-6 rounded-lg font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={getButtonStyles(buttonStyle!, priceColor!)}
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SETTINGS PANEL
// ============================================================================

function ProductCardSettings() {
  const {
    actions: { setProp },
    productId,
    showDescription,
    showPrice,
    showComparePrice,
    showAddToCart,
    showWishlist,
    showBadges,
    imagePosition,
    cardStyle,
    buttonStyle,
    priceColor,
    borderRadius,
    imageHeight,
  } = useNode((node) => ({
    productId: node.data.props.productId,
    showDescription: node.data.props.showDescription,
    showPrice: node.data.props.showPrice,
    showComparePrice: node.data.props.showComparePrice,
    showAddToCart: node.data.props.showAddToCart,
    showWishlist: node.data.props.showWishlist,
    showBadges: node.data.props.showBadges,
    imagePosition: node.data.props.imagePosition,
    cardStyle: node.data.props.cardStyle,
    buttonStyle: node.data.props.buttonStyle,
    priceColor: node.data.props.priceColor,
    borderRadius: node.data.props.borderRadius,
    imageHeight: node.data.props.imageHeight,
  }));

  return (
    <div className="space-y-4 p-4">
      <div className="text-sm font-medium text-gray-900 border-b pb-2">
        Product Card Settings
      </div>

      {/* Product Selection */}
      <div className="space-y-2">
        <Label>Product ID</Label>
        <Input
          value={productId || ''}
          onChange={(e) => setProp((props: ProductCardProps) => (props.productId = e.target.value))}
          placeholder="Enter product ID or leave empty for demo"
        />
        <p className="text-xs text-gray-500">Leave empty to show sample product</p>
      </div>

      {/* Image Position */}
      <div className="space-y-2">
        <Label>Image Position</Label>
        <Select
          value={imagePosition}
          onValueChange={(value) => setProp((props: ProductCardProps) => (props.imagePosition = value as 'top' | 'left' | 'right'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Card Style */}
      <div className="space-y-2">
        <Label>Card Style</Label>
        <Select
          value={cardStyle}
          onValueChange={(value) => setProp((props: ProductCardProps) => (props.cardStyle = value as 'minimal' | 'bordered' | 'shadow' | 'elevated'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="bordered">Bordered</SelectItem>
            <SelectItem value="shadow">Shadow</SelectItem>
            <SelectItem value="elevated">Elevated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Image Height */}
      {imagePosition === 'top' && (
        <div className="space-y-2">
          <Label>Image Height: {imageHeight}px</Label>
          <Input
            type="number"
            value={imageHeight}
            onChange={(e) => setProp((props: ProductCardProps) => (props.imageHeight = parseInt(e.target.value) || 280))}
            min={100}
            max={500}
          />
        </div>
      )}

      {/* Border Radius */}
      <div className="space-y-2">
        <Label>Border Radius: {borderRadius}px</Label>
        <Input
          type="number"
          value={borderRadius}
          onChange={(e) => setProp((props: ProductCardProps) => (props.borderRadius = parseInt(e.target.value) || 12))}
          min={0}
          max={32}
        />
      </div>

      {/* Display Options */}
      <div className="space-y-3">
        <Label>Display Options</Label>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Show Description</span>
          <Switch
            checked={showDescription}
            onCheckedChange={(checked) => setProp((props: ProductCardProps) => (props.showDescription = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Price</span>
          <Switch
            checked={showPrice}
            onCheckedChange={(checked) => setProp((props: ProductCardProps) => (props.showPrice = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Compare Price</span>
          <Switch
            checked={showComparePrice}
            onCheckedChange={(checked) => setProp((props: ProductCardProps) => (props.showComparePrice = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Add to Cart</span>
          <Switch
            checked={showAddToCart}
            onCheckedChange={(checked) => setProp((props: ProductCardProps) => (props.showAddToCart = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Wishlist</span>
          <Switch
            checked={showWishlist}
            onCheckedChange={(checked) => setProp((props: ProductCardProps) => (props.showWishlist = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Badges</span>
          <Switch
            checked={showBadges}
            onCheckedChange={(checked) => setProp((props: ProductCardProps) => (props.showBadges = checked))}
          />
        </div>
      </div>

      {/* Button Style */}
      {showAddToCart && (
        <div className="space-y-2">
          <Label>Button Style</Label>
          <Select
            value={buttonStyle}
            onValueChange={(value) => setProp((props: ProductCardProps) => (props.buttonStyle = value as 'primary' | 'secondary' | 'outline'))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary (Filled)</SelectItem>
              <SelectItem value="secondary">Secondary (Gray)</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Price Color */}
      <div className="space-y-2">
        <Label>Price Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={priceColor}
            onChange={(e) => setProp((props: ProductCardProps) => (props.priceColor = e.target.value))}
            className="w-10 h-10 rounded border cursor-pointer"
          />
          <Input
            value={priceColor}
            onChange={(e) => setProp((props: ProductCardProps) => (props.priceColor = e.target.value))}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CRAFT.JS CONFIGURATION
// ============================================================================

ProductCard.craft = {
  displayName: 'ProductCard',
  props: defaultProps,
  related: {
    settings: ProductCardSettings,
  },
};
