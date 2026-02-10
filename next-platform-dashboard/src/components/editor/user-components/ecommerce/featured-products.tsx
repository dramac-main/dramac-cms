'use client';

/**
 * FeaturedProducts Component for Visual Editor (Craft.js)
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * A section showcasing featured products with optional title and "View All" button.
 * Great for homepages and landing pages.
 */
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ShoppingBag, Star, ShoppingCart, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/modules/ecommerce/types/ecommerce-types';

// ============================================================================
// TYPES
// ============================================================================

interface FeaturedProductsProps {
  siteId?: string;
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  limit?: number;
  columns?: 3 | 4 | 5;
  showViewAll?: boolean;
  viewAllText?: string;
  viewAllLink?: string;
  layout?: 'grid' | 'carousel';
  showNavigation?: boolean;
  autoPlay?: boolean;
  showPrices?: boolean;
  showAddToCart?: boolean;
  cardStyle?: 'minimal' | 'bordered' | 'shadow';
  gap?: number;
  titleAlign?: 'left' | 'center' | 'right';
  primaryColor?: string;
  backgroundColor?: string;
  paddingY?: number;
  paddingX?: number;
}

// ============================================================================
// DEFAULT PROPS
// ============================================================================

const defaultProps: FeaturedProductsProps = {
  title: 'Featured Products',
  subtitle: 'Check out our best-selling items',
  showTitle: true,
  limit: 4,
  columns: 4,
  showViewAll: true,
  viewAllText: 'View All Products',
  viewAllLink: '/products',
  layout: 'grid',
  showNavigation: true,
  autoPlay: false,
  showPrices: true,
  showAddToCart: true,
  cardStyle: 'bordered',
  gap: 24,
  titleAlign: 'center',
  primaryColor: '#2563eb',
  backgroundColor: '#f9fafb',
  paddingY: 64,
  paddingX: 24,
};

// ============================================================================
// MOCK DATA
// ============================================================================

const mockFeaturedProducts: Product[] = [
  {
    id: '1',
    site_id: '',
    agency_id: '',
    name: 'Wireless Earbuds Pro',
    slug: 'wireless-earbuds-pro',
    description: 'Premium wireless earbuds with ANC',
    short_description: 'Premium ANC earbuds',
    base_price: 14999,
    compare_at_price: 19999,
    cost_price: null,
    tax_class: 'standard',
    is_taxable: true,
    sku: 'WE-PRO-001',
    barcode: null,
    track_inventory: true,
    quantity: 45,
    low_stock_threshold: 5,
    weight: null,
    weight_unit: 'kg',
    status: 'active',
    is_featured: true,
    seo_title: null,
    seo_description: null,
    images: ['https://placehold.co/300x300/1e40af/ffffff?text=Earbuds'],
    metadata: {},
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    site_id: '',
    agency_id: '',
    name: 'Smart Watch Series X',
    slug: 'smart-watch-series-x',
    description: 'Advanced fitness tracking',
    short_description: 'Advanced smartwatch',
    base_price: 29999,
    compare_at_price: null,
    cost_price: null,
    tax_class: 'standard',
    is_taxable: true,
    sku: 'SW-X-001',
    barcode: null,
    track_inventory: true,
    quantity: 30,
    low_stock_threshold: 5,
    weight: null,
    weight_unit: 'kg',
    status: 'active',
    is_featured: true,
    seo_title: null,
    seo_description: null,
    images: ['https://placehold.co/300x300/059669/ffffff?text=Watch'],
    metadata: {},
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    site_id: '',
    agency_id: '',
    name: 'Leather Laptop Bag',
    slug: 'leather-laptop-bag',
    description: 'Premium leather bag',
    short_description: 'Premium leather bag',
    base_price: 8999,
    compare_at_price: 11999,
    cost_price: null,
    tax_class: 'standard',
    is_taxable: true,
    sku: 'LB-001',
    barcode: null,
    track_inventory: true,
    quantity: 20,
    low_stock_threshold: 5,
    weight: null,
    weight_unit: 'kg',
    status: 'active',
    is_featured: true,
    seo_title: null,
    seo_description: null,
    images: ['https://placehold.co/300x300/92400e/ffffff?text=Bag'],
    metadata: {},
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    site_id: '',
    agency_id: '',
    name: 'Portable Charger 20K',
    slug: 'portable-charger-20k',
    description: '20000mAh fast charging',
    short_description: '20000mAh power bank',
    base_price: 4999,
    compare_at_price: null,
    cost_price: null,
    tax_class: 'standard',
    is_taxable: true,
    sku: 'PC-20K-001',
    barcode: null,
    track_inventory: true,
    quantity: 100,
    low_stock_threshold: 10,
    weight: null,
    weight_unit: 'kg',
    status: 'active',
    is_featured: true,
    seo_title: null,
    seo_description: null,
    images: ['https://placehold.co/300x300/7c3aed/ffffff?text=Charger'],
    metadata: {},
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPrice(cents: number): string {
  return `${DEFAULT_CURRENCY_SYMBOL}${(cents / 100).toFixed(2)}`;
}

function getCardStyles(style: string): string {
  switch (style) {
    case 'bordered': return 'border border-gray-200';
    case 'shadow': return 'shadow-md';
    default: return '';
  }
}

// ============================================================================
// FEATURED PRODUCTS COMPONENT
// ============================================================================

export function FeaturedProducts(props: FeaturedProductsProps) {
  const mergedProps = { ...defaultProps, ...props };
  const {
    _siteId,
    title,
    subtitle,
    showTitle,
    limit,
    columns,
    showViewAll,
    viewAllText,
    viewAllLink,
    layout,
    showNavigation,
    _autoPlay,
    showPrices,
    showAddToCart,
    cardStyle,
    gap,
    titleAlign,
    primaryColor,
    backgroundColor,
    paddingY,
    paddingX,
  } = { ...mergedProps, _siteId: mergedProps.siteId, _autoPlay: mergedProps.autoPlay };

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const [products] = useState<Product[]>(mockFeaturedProducts);
  const [currentSlide, setCurrentSlide] = useState(0);

  const displayProducts = products.slice(0, limit);

  // Carousel navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displayProducts.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displayProducts.length) % displayProducts.length);
  };

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`featured-products-component ${selected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        backgroundColor,
        paddingTop: `${paddingY}px`,
        paddingBottom: `${paddingY}px`,
        paddingLeft: `${paddingX}px`,
        paddingRight: `${paddingX}px`,
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {showTitle && (
          <div
            className="mb-10"
            style={{ textAlign: titleAlign }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            {subtitle && (
              <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        {/* Products Grid/Carousel */}
        {layout === 'grid' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: `${gap}px`,
            }}
          >
            {displayProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-xl overflow-hidden transition-transform hover:-translate-y-1 ${getCardStyles(cardStyle!)}`}
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  {product.is_featured && (
                    <div className="absolute top-3 left-3">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}
                  {product.compare_at_price && product.compare_at_price > product.base_price && (
                    <div
                      className="absolute top-3 right-3 px-2 py-1 text-xs font-bold text-white rounded"
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      Sale
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate mb-1">
                    {product.name}
                  </h3>
                  
                  {showPrices && (
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="font-bold text-lg"
                        style={{ color: primaryColor }}
                      >
                        {formatPrice(product.base_price)}
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.base_price && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                  )}

                  {showAddToCart && (
                    <button
                      className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Carousel Layout
          <div className="relative">
            {showNavigation && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-700" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="h-6 w-6 text-gray-700" />
                </button>
              </>
            )}
            
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300"
                style={{
                  transform: `translateX(-${currentSlide * (100 / columns!)}%)`,
                  gap: `${gap}px`,
                }}
              >
                {displayProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`shrink-0 bg-white rounded-xl overflow-hidden ${getCardStyles(cardStyle!)}`}
                    style={{ width: `calc(${100 / columns!}% - ${gap! * (columns! - 1) / columns!}px)` }}
                  >
                    <div className="relative aspect-square bg-gray-100">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 truncate mb-1">
                        {product.name}
                      </h3>
                      {showPrices && (
                        <span
                          className="font-bold text-lg"
                          style={{ color: primaryColor }}
                        >
                          {formatPrice(product.base_price)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View All Button */}
        {showViewAll && (
          <div
            className="mt-10"
            style={{ textAlign: titleAlign }}
          >
            <a
              href={viewAllLink}
              className="inline-flex items-center gap-2 font-semibold transition-colors hover:opacity-80"
              style={{ color: primaryColor }}
            >
              {viewAllText}
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// SETTINGS PANEL
// ============================================================================

function FeaturedProductsSettings() {
  const {
    actions: { setProp },
    title,
    subtitle,
    showTitle,
    limit,
    columns,
    showViewAll,
    viewAllText,
    viewAllLink,
    layout,
    showPrices,
    showAddToCart,
    cardStyle,
    gap,
    titleAlign,
    primaryColor,
    backgroundColor,
    paddingY,
    paddingX,
  } = useNode((node) => ({
    title: node.data.props.title,
    subtitle: node.data.props.subtitle,
    showTitle: node.data.props.showTitle,
    limit: node.data.props.limit,
    columns: node.data.props.columns,
    showViewAll: node.data.props.showViewAll,
    viewAllText: node.data.props.viewAllText,
    viewAllLink: node.data.props.viewAllLink,
    layout: node.data.props.layout,
    showPrices: node.data.props.showPrices,
    showAddToCart: node.data.props.showAddToCart,
    cardStyle: node.data.props.cardStyle,
    gap: node.data.props.gap,
    titleAlign: node.data.props.titleAlign,
    primaryColor: node.data.props.primaryColor,
    backgroundColor: node.data.props.backgroundColor,
    paddingY: node.data.props.paddingY,
    paddingX: node.data.props.paddingX,
  }));

  return (
    <div className="space-y-4 p-4">
      <div className="text-sm font-medium text-gray-900 border-b pb-2">
        Featured Products Settings
      </div>

      {/* Title Section */}
      <div className="flex items-center justify-between">
        <span className="text-sm">Show Title</span>
        <Switch
          checked={showTitle}
          onCheckedChange={(checked) => setProp((props: FeaturedProductsProps) => (props.showTitle = checked))}
        />
      </div>

      {showTitle && (
        <>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setProp((props: FeaturedProductsProps) => (props.title = e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Textarea
              value={subtitle}
              onChange={(e) => setProp((props: FeaturedProductsProps) => (props.subtitle = e.target.value))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Title Alignment</Label>
            <Select
              value={titleAlign}
              onValueChange={(value) => setProp((props: FeaturedProductsProps) => (props.titleAlign = value as 'left' | 'center' | 'right'))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Layout */}
      <div className="space-y-2">
        <Label>Layout</Label>
        <Select
          value={layout}
          onValueChange={(value) => setProp((props: FeaturedProductsProps) => (props.layout = value as 'grid' | 'carousel'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="carousel">Carousel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Columns */}
      <div className="space-y-2">
        <Label>Columns: {columns}</Label>
        <Slider
          value={[columns || 4]}
          onValueChange={([value]) => setProp((props: FeaturedProductsProps) => (props.columns = value as 3 | 4 | 5))}
          min={3}
          max={5}
          step={1}
        />
      </div>

      {/* Products Limit */}
      <div className="space-y-2">
        <Label>Products to Show</Label>
        <Input
          type="number"
          value={limit}
          onChange={(e) => setProp((props: FeaturedProductsProps) => (props.limit = parseInt(e.target.value) || 4))}
          min={1}
          max={12}
        />
      </div>

      {/* Gap */}
      <div className="space-y-2">
        <Label>Spacing: {gap}px</Label>
        <Slider
          value={[gap || 24]}
          onValueChange={([value]) => setProp((props: FeaturedProductsProps) => (props.gap = value))}
          min={8}
          max={48}
          step={4}
        />
      </div>

      {/* Card Style */}
      <div className="space-y-2">
        <Label>Card Style</Label>
        <Select
          value={cardStyle}
          onValueChange={(value) => setProp((props: FeaturedProductsProps) => (props.cardStyle = value as 'minimal' | 'bordered' | 'shadow'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="bordered">Bordered</SelectItem>
            <SelectItem value="shadow">Shadow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Display Options */}
      <div className="space-y-3">
        <Label>Display Options</Label>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Show Prices</span>
          <Switch
            checked={showPrices}
            onCheckedChange={(checked) => setProp((props: FeaturedProductsProps) => (props.showPrices = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Add to Cart</span>
          <Switch
            checked={showAddToCart}
            onCheckedChange={(checked) => setProp((props: FeaturedProductsProps) => (props.showAddToCart = checked))}
          />
        </div>
      </div>

      {/* View All Section */}
      <div className="flex items-center justify-between">
        <span className="text-sm">Show View All Button</span>
        <Switch
          checked={showViewAll}
          onCheckedChange={(checked) => setProp((props: FeaturedProductsProps) => (props.showViewAll = checked))}
        />
      </div>

      {showViewAll && (
        <>
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input
              value={viewAllText}
              onChange={(e) => setProp((props: FeaturedProductsProps) => (props.viewAllText = e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Button Link</Label>
            <Input
              value={viewAllLink}
              onChange={(e) => setProp((props: FeaturedProductsProps) => (props.viewAllLink = e.target.value))}
            />
          </div>
        </>
      )}

      {/* Colors */}
      <div className="space-y-3">
        <Label>Colors</Label>
        
        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Primary Color</span>
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setProp((props: FeaturedProductsProps) => (props.primaryColor = e.target.value))}
            className="w-8 h-8 rounded border cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Background</span>
          <input
            type="color"
            value={backgroundColor === 'transparent' ? '#f9fafb' : backgroundColor}
            onChange={(e) => setProp((props: FeaturedProductsProps) => (props.backgroundColor = e.target.value))}
            className="w-8 h-8 rounded border cursor-pointer"
          />
        </div>
      </div>

      {/* Padding */}
      <div className="space-y-2">
        <Label>Vertical Padding: {paddingY}px</Label>
        <Slider
          value={[paddingY || 64]}
          onValueChange={([value]) => setProp((props: FeaturedProductsProps) => (props.paddingY = value))}
          min={16}
          max={128}
          step={8}
        />
      </div>

      <div className="space-y-2">
        <Label>Horizontal Padding: {paddingX}px</Label>
        <Slider
          value={[paddingX || 24]}
          onValueChange={([value]) => setProp((props: FeaturedProductsProps) => (props.paddingX = value))}
          min={0}
          max={64}
          step={8}
        />
      </div>
    </div>
  );
}

// ============================================================================
// CRAFT.JS CONFIGURATION
// ============================================================================

FeaturedProducts.craft = {
  displayName: 'FeaturedProducts',
  props: defaultProps,
  related: {
    settings: FeaturedProductsSettings,
  },
};
