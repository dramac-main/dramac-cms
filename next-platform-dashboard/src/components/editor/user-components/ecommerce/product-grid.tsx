'use client';

/**
 * ProductGrid Component for Visual Editor (Craft.js)
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Displays a grid of products that can be dragged onto website pages.
 * Fetches products from the site's e-commerce module.
 */
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback } from 'react';
import { useNode } from '@craftjs/core';
import { useIsEditorEnabled } from '../../hooks/use-editor-mode';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingBag, Star, ShoppingCart, Loader2 } from 'lucide-react';
import type { Product } from '@/modules/ecommerce/types/ecommerce-types';

// ============================================================================
// TYPES
// ============================================================================

interface ProductGridProps {
  siteId?: string;
  columns?: 2 | 3 | 4;
  limit?: number;
  categoryFilter?: string;
  showPrices?: boolean;
  showAddToCart?: boolean;
  showRatings?: boolean;
  layout?: 'grid' | 'list';
  gap?: number;
  imageAspect?: 'square' | 'portrait' | 'landscape';
  cardStyle?: 'minimal' | 'bordered' | 'shadow';
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  priceColor?: string;
  backgroundColor?: string;
  padding?: number;
}

// ============================================================================
// DEFAULT PROPS
// ============================================================================

const defaultProps: ProductGridProps = {
  columns: 3,
  limit: 12,
  showPrices: true,
  showAddToCart: true,
  showRatings: false,
  layout: 'grid',
  gap: 24,
  imageAspect: 'square',
  cardStyle: 'bordered',
  buttonStyle: 'primary',
  priceColor: '#16a34a',
  backgroundColor: 'transparent',
  padding: 16,
};

// ============================================================================
// MOCK DATA FOR EDITOR PREVIEW
// ============================================================================

const mockProducts: Product[] = [
  {
    id: '1',
    site_id: '',
    agency_id: '',
    name: 'Sample Product 1',
    slug: 'sample-product-1',
    description: 'A great product for your needs',
    short_description: 'Great product',
    base_price: 2999,
    compare_at_price: 3999,
    cost_price: null,
    tax_class: 'standard',
    is_taxable: true,
    sku: 'SKU001',
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
    images: ['https://placehold.co/400x400/e2e8f0/475569?text=Product+1'],
    metadata: {},
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    site_id: '',
    agency_id: '',
    name: 'Sample Product 2',
    slug: 'sample-product-2',
    description: 'Another excellent choice',
    short_description: 'Excellent choice',
    base_price: 4999,
    compare_at_price: null,
    cost_price: null,
    tax_class: 'standard',
    is_taxable: true,
    sku: 'SKU002',
    barcode: null,
    track_inventory: true,
    quantity: 25,
    low_stock_threshold: 5,
    weight: null,
    weight_unit: 'kg',
    status: 'active',
    is_featured: false,
    seo_title: null,
    seo_description: null,
    images: ['https://placehold.co/400x400/e2e8f0/475569?text=Product+2'],
    metadata: {},
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    site_id: '',
    agency_id: '',
    name: 'Sample Product 3',
    slug: 'sample-product-3',
    description: 'Premium quality item',
    short_description: 'Premium quality',
    base_price: 7999,
    compare_at_price: 9999,
    cost_price: null,
    tax_class: 'standard',
    is_taxable: true,
    sku: 'SKU003',
    barcode: null,
    track_inventory: true,
    quantity: 10,
    low_stock_threshold: 5,
    weight: null,
    weight_unit: 'kg',
    status: 'active',
    is_featured: true,
    seo_title: null,
    seo_description: null,
    images: ['https://placehold.co/400x400/e2e8f0/475569?text=Product+3'],
    metadata: {},
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    site_id: '',
    agency_id: '',
    name: 'Sample Product 4',
    slug: 'sample-product-4',
    description: 'Best value for money',
    short_description: 'Best value',
    base_price: 1999,
    compare_at_price: 2499,
    cost_price: null,
    tax_class: 'standard',
    is_taxable: true,
    sku: 'SKU004',
    barcode: null,
    track_inventory: true,
    quantity: 100,
    low_stock_threshold: 5,
    weight: null,
    weight_unit: 'kg',
    status: 'active',
    is_featured: false,
    seo_title: null,
    seo_description: null,
    images: ['https://placehold.co/400x400/e2e8f0/475569?text=Product+4'],
    metadata: {},
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    site_id: '',
    agency_id: '',
    name: 'Sample Product 5',
    slug: 'sample-product-5',
    description: 'Customer favorite',
    short_description: 'Customer favorite',
    base_price: 5499,
    compare_at_price: null,
    cost_price: null,
    tax_class: 'standard',
    is_taxable: true,
    sku: 'SKU005',
    barcode: null,
    track_inventory: true,
    quantity: 35,
    low_stock_threshold: 5,
    weight: null,
    weight_unit: 'kg',
    status: 'active',
    is_featured: true,
    seo_title: null,
    seo_description: null,
    images: ['https://placehold.co/400x400/e2e8f0/475569?text=Product+5'],
    metadata: {},
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    site_id: '',
    agency_id: '',
    name: 'Sample Product 6',
    slug: 'sample-product-6',
    description: 'New arrival',
    short_description: 'New arrival',
    base_price: 3499,
    compare_at_price: 4499,
    cost_price: null,
    tax_class: 'standard',
    is_taxable: true,
    sku: 'SKU006',
    barcode: null,
    track_inventory: true,
    quantity: 45,
    low_stock_threshold: 5,
    weight: null,
    weight_unit: 'kg',
    status: 'active',
    is_featured: false,
    seo_title: null,
    seo_description: null,
    images: ['https://placehold.co/400x400/e2e8f0/475569?text=Product+6'],
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
  return `$${(cents / 100).toFixed(2)}`;
}

function getImageAspectRatio(aspect: string): string {
  switch (aspect) {
    case 'portrait': return '3/4';
    case 'landscape': return '4/3';
    default: return '1/1';
  }
}

function getCardStyles(style: string): string {
  switch (style) {
    case 'bordered': return 'border border-gray-200 rounded-lg';
    case 'shadow': return 'shadow-md rounded-lg';
    default: return '';
  }
}

function getButtonStyles(style: string, priceColor: string): React.CSSProperties {
  switch (style) {
    case 'primary':
      return { backgroundColor: priceColor, color: 'white', border: 'none' };
    case 'secondary':
      return { backgroundColor: '#f3f4f6', color: '#374151', border: 'none' };
    default:
      return { backgroundColor: 'transparent', color: priceColor, border: `1px solid ${priceColor}` };
  }
}

// ============================================================================
// PRODUCT GRID COMPONENT
// ============================================================================

export function ProductGrid(props: ProductGridProps) {
  let nodeHookResult;
  try {
    nodeHookResult = useNode((node) => ({
      selected: node.events.selected,
    }));
  } catch (error) {
    console.error('[ProductGrid] useNode failed:', error);
    // Fallback render without Craft.js hooks
    return (
      <div style={{ padding: '20px', border: '2px solid red', background: '#ffe6e6' }}>
        <p style={{ color: 'red', fontWeight: 'bold' }}>ProductGrid Error</p>
        <p>Failed to initialize editor hooks: {String(error)}</p>
      </div>
    );
  }

  const {
    connectors: { connect, drag },
    selected,
  } = nodeHookResult;

  const mergedProps = { ...defaultProps, ...props };
  const {
    siteId,
    columns,
    limit,
    categoryFilter,
    showPrices,
    showAddToCart,
    showRatings,
    layout,
    gap,
    imageAspect,
    cardStyle,
    buttonStyle,
    priceColor,
    backgroundColor,
    padding,
  } = mergedProps;

  const isEditorEnabled = useIsEditorEnabled();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real products from API when in published mode
  const fetchProducts = useCallback(async () => {
    if (!siteId || isEditorEnabled) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/modules/ecommerce/products?siteId=${siteId}&limit=${limit}${categoryFilter ? `&category=${categoryFilter}` : ''}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('[ProductGrid] Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [siteId, limit, categoryFilter, isEditorEnabled]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const displayProducts = products.slice(0, limit);

  return (
    <div
      ref={(ref) => { 
        if (ref) {
          connect(drag(ref)); 
        }
      }}
      style={{
        backgroundColor,
        padding: `${padding}px`,
        minHeight: '200px',
      }}
      className={`product-grid-component ${selected ? 'ring-2 ring-blue-500' : ''}`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <ShoppingBag className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No products yet</p>
          <p className="text-sm">Add products in the E-Commerce dashboard</p>
        </div>
      ) : layout === 'grid' ? (
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
              className={`product-card overflow-hidden ${getCardStyles(cardStyle!)}`}
            >
              {/* Product Image */}
              <div
                className="relative bg-gray-100 overflow-hidden"
                style={{ aspectRatio: getImageAspectRatio(imageAspect!) }}
              >
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                {/* Sale Badge */}
                {product.compare_at_price && product.compare_at_price > product.base_price && (
                  <div
                    className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold text-white rounded"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    Sale
                  </div>
                )}
                {/* Featured Badge */}
                {product.is_featured && (
                  <div className="absolute top-2 right-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate mb-1">
                  {product.name}
                </h3>
                
                {product.short_description && (
                  <p className="text-sm text-gray-500 truncate mb-2">
                    {product.short_description}
                  </p>
                )}

                {showRatings && (
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">(24)</span>
                  </div>
                )}

                {showPrices && (
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="font-bold text-lg"
                      style={{ color: priceColor }}
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
                    className="w-full py-2 px-4 rounded-md text-sm font-medium transition-colors hover:opacity-90 flex items-center justify-center gap-2"
                    style={getButtonStyles(buttonStyle!, priceColor!)}
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
        // List Layout
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className={`product-card flex gap-4 ${getCardStyles(cardStyle!)}`}
              style={{ padding: cardStyle !== 'minimal' ? '16px' : '0' }}
            >
              {/* Product Image */}
              <div
                className="relative bg-gray-100 overflow-hidden rounded-lg shrink-0"
                style={{ width: '150px', height: '150px' }}
              >
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-lg mb-1">
                  {product.name}
                </h3>
                
                {product.description && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {showPrices && (
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="font-bold text-xl"
                      style={{ color: priceColor }}
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
                    className="py-2 px-6 rounded-md text-sm font-medium transition-colors hover:opacity-90 flex items-center gap-2"
                    style={getButtonStyles(buttonStyle!, priceColor!)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SETTINGS PANEL
// ============================================================================

function ProductGridSettings() {
  const {
    actions: { setProp },
    columns,
    limit,
    showPrices,
    showAddToCart,
    showRatings,
    layout,
    gap,
    imageAspect,
    cardStyle,
    buttonStyle,
    priceColor,
    backgroundColor,
    padding,
  } = useNode((node) => ({
    columns: node.data.props.columns,
    limit: node.data.props.limit,
    showPrices: node.data.props.showPrices,
    showAddToCart: node.data.props.showAddToCart,
    showRatings: node.data.props.showRatings,
    layout: node.data.props.layout,
    gap: node.data.props.gap,
    imageAspect: node.data.props.imageAspect,
    cardStyle: node.data.props.cardStyle,
    buttonStyle: node.data.props.buttonStyle,
    priceColor: node.data.props.priceColor,
    backgroundColor: node.data.props.backgroundColor,
    padding: node.data.props.padding,
  }));

  return (
    <div className="space-y-4 p-4">
      <div className="text-sm font-medium text-gray-900 border-b pb-2">
        Product Grid Settings
      </div>

      {/* Layout */}
      <div className="space-y-2">
        <Label>Layout</Label>
        <Select
          value={layout}
          onValueChange={(value) => setProp((props: ProductGridProps) => (props.layout = value as 'grid' | 'list'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="list">List</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Columns (only for grid layout) */}
      {layout === 'grid' && (
        <div className="space-y-2">
          <Label>Columns: {columns}</Label>
          <Slider
            value={[columns]}
            onValueChange={([value]) => setProp((props: ProductGridProps) => (props.columns = value as 2 | 3 | 4))}
            min={2}
            max={4}
            step={1}
          />
        </div>
      )}

      {/* Products Limit */}
      <div className="space-y-2">
        <Label>Products to Show</Label>
        <Input
          type="number"
          value={limit}
          onChange={(e) => setProp((props: ProductGridProps) => (props.limit = parseInt(e.target.value) || 12))}
          min={1}
          max={50}
        />
      </div>

      {/* Gap */}
      <div className="space-y-2">
        <Label>Spacing: {gap}px</Label>
        <Slider
          value={[gap]}
          onValueChange={([value]) => setProp((props: ProductGridProps) => (props.gap = value))}
          min={8}
          max={48}
          step={4}
        />
      </div>

      {/* Image Aspect Ratio */}
      <div className="space-y-2">
        <Label>Image Aspect</Label>
        <Select
          value={imageAspect}
          onValueChange={(value) => setProp((props: ProductGridProps) => (props.imageAspect = value as 'square' | 'portrait' | 'landscape'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="square">Square (1:1)</SelectItem>
            <SelectItem value="portrait">Portrait (3:4)</SelectItem>
            <SelectItem value="landscape">Landscape (4:3)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Card Style */}
      <div className="space-y-2">
        <Label>Card Style</Label>
        <Select
          value={cardStyle}
          onValueChange={(value) => setProp((props: ProductGridProps) => (props.cardStyle = value as 'minimal' | 'bordered' | 'shadow'))}
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
            onCheckedChange={(checked) => setProp((props: ProductGridProps) => (props.showPrices = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Add to Cart</span>
          <Switch
            checked={showAddToCart}
            onCheckedChange={(checked) => setProp((props: ProductGridProps) => (props.showAddToCart = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Ratings</span>
          <Switch
            checked={showRatings}
            onCheckedChange={(checked) => setProp((props: ProductGridProps) => (props.showRatings = checked))}
          />
        </div>
      </div>

      {/* Button Style */}
      {showAddToCart && (
        <div className="space-y-2">
          <Label>Button Style</Label>
          <Select
            value={buttonStyle}
            onValueChange={(value) => setProp((props: ProductGridProps) => (props.buttonStyle = value as 'primary' | 'secondary' | 'outline'))}
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

      {/* Colors */}
      <div className="space-y-3">
        <Label>Colors</Label>
        
        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Price Color</span>
          <input
            type="color"
            value={priceColor}
            onChange={(e) => setProp((props: ProductGridProps) => (props.priceColor = e.target.value))}
            className="w-8 h-8 rounded border cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Background</span>
          <input
            type="color"
            value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
            onChange={(e) => setProp((props: ProductGridProps) => (props.backgroundColor = e.target.value))}
            className="w-8 h-8 rounded border cursor-pointer"
          />
        </div>
      </div>

      {/* Padding */}
      <div className="space-y-2">
        <Label>Padding: {padding}px</Label>
        <Slider
          value={[padding]}
          onValueChange={([value]) => setProp((props: ProductGridProps) => (props.padding = value))}
          min={0}
          max={64}
          step={4}
        />
      </div>
    </div>
  );
}

// ============================================================================
// CRAFT.JS CONFIGURATION
// ============================================================================

ProductGrid.craft = {
  displayName: 'ProductGrid',
  props: defaultProps,
  related: {
    settings: ProductGridSettings,
  },
};
