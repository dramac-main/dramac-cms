'use client';

/**
 * CartWidget Component for Visual Editor (Craft.js)
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * A mini cart widget that shows cart icon with item count.
 * Can be placed in navigation bars or floating on the page.
 */
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingCart, ShoppingBag, X, Minus, Plus, Trash2 } from 'lucide-react';
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config';

// ============================================================================
// TYPES
// ============================================================================

interface CartWidgetProps {
  siteId?: string;
  position?: 'inline' | 'fixed-right' | 'fixed-left';
  showCount?: boolean;
  showTotal?: boolean;
  iconStyle?: 'cart' | 'bag';
  iconSize?: number;
  badgeColor?: string;
  textColor?: string;
  backgroundColor?: string;
  hoverEffect?: boolean;
  showDropdown?: boolean;
}

// ============================================================================
// DEFAULT PROPS
// ============================================================================

const defaultProps: CartWidgetProps = {
  position: 'inline',
  showCount: true,
  showTotal: true,
  iconStyle: 'cart',
  iconSize: 24,
  badgeColor: '#ef4444',
  textColor: '#1f2937',
  backgroundColor: 'transparent',
  hoverEffect: true,
  showDropdown: true,
};

// ============================================================================
// MOCK DATA
// ============================================================================

const mockCartItems = [
  {
    id: '1',
    name: 'Wireless Headphones',
    price: 9999,
    quantity: 1,
    image: 'https://placehold.co/80x80/e2e8f0/475569?text=Item+1',
  },
  {
    id: '2',
    name: 'Phone Case',
    price: 2499,
    quantity: 2,
    image: 'https://placehold.co/80x80/e2e8f0/475569?text=Item+2',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPrice(cents: number): string {
  return `${DEFAULT_CURRENCY_SYMBOL}${(cents / 100).toFixed(2)}`;
}

// ============================================================================
// CART WIDGET COMPONENT
// ============================================================================

export function CartWidget(props: CartWidgetProps) {
  const mergedProps = { ...defaultProps, ...props };
  const {
    _siteId,
    position,
    showCount,
    showTotal,
    iconStyle,
    iconSize,
    badgeColor,
    textColor,
    backgroundColor,
    hoverEffect,
    showDropdown,
  } = { ...mergedProps, _siteId: mergedProps.siteId };

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const [isOpen, setIsOpen] = useState(false);
  const [cartItems] = useState(mockCartItems);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const Icon = iconStyle === 'bag' ? ShoppingBag : ShoppingCart;

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'fixed-right':
        return { position: 'fixed', top: '20px', right: '20px', zIndex: 1000 };
      case 'fixed-left':
        return { position: 'fixed', top: '20px', left: '20px', zIndex: 1000 };
      default:
        return { position: 'relative', display: 'inline-block' };
    }
  };

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`cart-widget-component ${selected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
      style={getPositionStyles()}
    >
      {/* Cart Button */}
      <button
        className={`relative p-3 rounded-full transition-all ${hoverEffect ? 'hover:scale-110' : ''}`}
        style={{
          backgroundColor,
          color: textColor,
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icon style={{ width: iconSize, height: iconSize }} />
        
        {/* Badge */}
        {showCount && itemCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 flex items-center justify-center text-xs font-bold text-white rounded-full"
            style={{ backgroundColor: badgeColor }}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {/* Total Display (optional) */}
      {showTotal && (
        <span
          className="ml-2 font-medium text-sm"
          style={{ color: textColor }}
        >
          {formatPrice(totalPrice)}
        </span>
      )}

      {/* Dropdown Cart Preview */}
      {showDropdown && isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Shopping Cart</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500">{itemCount} items</p>
          </div>

          {/* Cart Items */}
          <div className="max-h-64 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="divide-y">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-4 flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">
                          {item.quantity}
                        </span>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button className="p-1 hover:bg-red-100 rounded ml-auto text-red-500">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">Subtotal</span>
                <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  View Cart
                </button>
                <button
                  className="py-2 px-4 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: badgeColor }}
                >
                  Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SETTINGS PANEL
// ============================================================================

function CartWidgetSettings() {
  const {
    actions: { setProp },
    position,
    showCount,
    showTotal,
    iconStyle,
    iconSize,
    badgeColor,
    textColor,
    backgroundColor,
    hoverEffect,
    showDropdown,
  } = useNode((node) => ({
    position: node.data.props.position,
    showCount: node.data.props.showCount,
    showTotal: node.data.props.showTotal,
    iconStyle: node.data.props.iconStyle,
    iconSize: node.data.props.iconSize,
    badgeColor: node.data.props.badgeColor,
    textColor: node.data.props.textColor,
    backgroundColor: node.data.props.backgroundColor,
    hoverEffect: node.data.props.hoverEffect,
    showDropdown: node.data.props.showDropdown,
  }));

  return (
    <div className="space-y-4 p-4">
      <div className="text-sm font-medium text-gray-900 border-b pb-2">
        Cart Widget Settings
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label>Position</Label>
        <Select
          value={position}
          onValueChange={(value) => setProp((props: CartWidgetProps) => (props.position = value as 'inline' | 'fixed-right' | 'fixed-left'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inline">Inline (in navbar)</SelectItem>
            <SelectItem value="fixed-right">Fixed Right</SelectItem>
            <SelectItem value="fixed-left">Fixed Left</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Icon Style */}
      <div className="space-y-2">
        <Label>Icon Style</Label>
        <Select
          value={iconStyle}
          onValueChange={(value) => setProp((props: CartWidgetProps) => (props.iconStyle = value as 'cart' | 'bag'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cart">Shopping Cart</SelectItem>
            <SelectItem value="bag">Shopping Bag</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Icon Size */}
      <div className="space-y-2">
        <Label>Icon Size: {iconSize}px</Label>
        <Input
          type="number"
          value={iconSize}
          onChange={(e) => setProp((props: CartWidgetProps) => (props.iconSize = parseInt(e.target.value) || 24))}
          min={16}
          max={48}
        />
      </div>

      {/* Display Options */}
      <div className="space-y-3">
        <Label>Display Options</Label>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Show Item Count</span>
          <Switch
            checked={showCount}
            onCheckedChange={(checked) => setProp((props: CartWidgetProps) => (props.showCount = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Total Price</span>
          <Switch
            checked={showTotal}
            onCheckedChange={(checked) => setProp((props: CartWidgetProps) => (props.showTotal = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Hover Effect</span>
          <Switch
            checked={hoverEffect}
            onCheckedChange={(checked) => setProp((props: CartWidgetProps) => (props.hoverEffect = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Dropdown Preview</span>
          <Switch
            checked={showDropdown}
            onCheckedChange={(checked) => setProp((props: CartWidgetProps) => (props.showDropdown = checked))}
          />
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <Label>Colors</Label>
        
        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Badge Color</span>
          <input
            type="color"
            value={badgeColor}
            onChange={(e) => setProp((props: CartWidgetProps) => (props.badgeColor = e.target.value))}
            className="w-8 h-8 rounded border cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Icon Color</span>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setProp((props: CartWidgetProps) => (props.textColor = e.target.value))}
            className="w-8 h-8 rounded border cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Background</span>
          <input
            type="color"
            value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
            onChange={(e) => setProp((props: CartWidgetProps) => (props.backgroundColor = e.target.value))}
            className="w-8 h-8 rounded border cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CRAFT.JS CONFIGURATION
// ============================================================================

CartWidget.craft = {
  displayName: 'CartWidget',
  props: defaultProps,
  related: {
    settings: CartWidgetSettings,
  },
};
