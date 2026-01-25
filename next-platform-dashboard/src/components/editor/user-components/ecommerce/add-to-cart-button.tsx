'use client';

/**
 * AddToCartButton Component for Visual Editor (Craft.js)
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * A standalone add-to-cart button that can be placed anywhere on the page.
 * Useful for custom product layouts or promotional sections.
 */

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
import { ShoppingCart, Plus, Minus, Check, Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface AddToCartButtonProps {
  siteId?: string;
  productId?: string;
  variantId?: string;
  quantity?: number;
  showQuantitySelector?: boolean;
  showPrice?: boolean;
  price?: number;
  buttonText?: string;
  addedText?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showIcon?: boolean;
  iconPosition?: 'left' | 'right';
  primaryColor?: string;
  borderRadius?: number;
  animation?: 'none' | 'pulse' | 'bounce';
}

// ============================================================================
// DEFAULT PROPS
// ============================================================================

const defaultProps: AddToCartButtonProps = {
  quantity: 1,
  showQuantitySelector: false,
  showPrice: false,
  price: 2999,
  buttonText: 'Add to Cart',
  addedText: 'Added!',
  buttonStyle: 'primary',
  size: 'md',
  fullWidth: false,
  showIcon: true,
  iconPosition: 'left',
  primaryColor: '#2563eb',
  borderRadius: 8,
  animation: 'none',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getButtonSizeStyles(size: string): React.CSSProperties {
  switch (size) {
    case 'sm':
      return { padding: '8px 16px', fontSize: '14px' };
    case 'lg':
      return { padding: '16px 32px', fontSize: '18px' };
    default:
      return { padding: '12px 24px', fontSize: '16px' };
  }
}

function getButtonStyles(style: string, primaryColor: string): React.CSSProperties {
  switch (style) {
    case 'primary':
      return { backgroundColor: primaryColor, color: 'white', border: 'none' };
    case 'secondary':
      return { backgroundColor: '#f3f4f6', color: '#374151', border: 'none' };
    case 'outline':
      return { backgroundColor: 'transparent', color: primaryColor, border: `2px solid ${primaryColor}` };
    case 'ghost':
      return { backgroundColor: 'transparent', color: primaryColor, border: 'none' };
    default:
      return { backgroundColor: primaryColor, color: 'white', border: 'none' };
  }
}

function getAnimationClass(animation: string): string {
  switch (animation) {
    case 'pulse': return 'animate-pulse';
    case 'bounce': return 'hover:animate-bounce';
    default: return '';
  }
}

// ============================================================================
// ADD TO CART BUTTON COMPONENT
// ============================================================================

export function AddToCartButton(props: AddToCartButtonProps) {
  const mergedProps = { ...defaultProps, ...props };
  const {
    _productId,
    _variantId,
    quantity: initialQuantity,
    showQuantitySelector,
    showPrice,
    price,
    buttonText,
    addedText,
    buttonStyle,
    size,
    fullWidth,
    showIcon,
    iconPosition,
    primaryColor,
    borderRadius,
    animation,
  } = { ...mergedProps, _productId: mergedProps.productId, _variantId: mergedProps.variantId };

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsLoading(false);
    setIsAdded(true);
    
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const incrementQuantity = () => setQuantity(q => q + 1);
  const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1));

  const sizeStyles = getButtonSizeStyles(size!);
  const styleProps = getButtonStyles(buttonStyle!, primaryColor!);
  const animationClass = getAnimationClass(animation!);

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`add-to-cart-component inline-flex items-center gap-3 ${selected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
    >
      {/* Quantity Selector */}
      {showQuantitySelector && (
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button
            onClick={decrementQuantity}
            className="p-2 hover:bg-gray-100 transition-colors"
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <button
            onClick={incrementQuantity}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        className={`
          flex items-center justify-center gap-2 font-semibold transition-all
          ${fullWidth ? 'w-full' : ''}
          ${animationClass}
          ${isAdded ? 'opacity-90' : 'hover:opacity-90'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        style={{
          ...sizeStyles,
          ...styleProps,
          borderRadius: `${borderRadius}px`,
          minWidth: fullWidth ? '100%' : 'auto',
        }}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {showIcon && iconPosition === 'left' && (
              isAdded ? (
                <Check className="h-5 w-5" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )
            )}
            
            <span>{isAdded ? addedText : buttonText}</span>
            
            {showPrice && price && !isAdded && (
              <span className="opacity-80">• {formatPrice(price)}</span>
            )}
            
            {showIcon && iconPosition === 'right' && (
              isAdded ? (
                <Check className="h-5 w-5" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )
            )}
          </>
        )}
      </button>
    </div>
  );
}

// ============================================================================
// SETTINGS PANEL
// ============================================================================

function AddToCartButtonSettings() {
  const {
    actions: { setProp },
    productId,
    _quantity,
    showQuantitySelector,
    showPrice,
    price,
    buttonText,
    addedText,
    buttonStyle,
    size,
    fullWidth,
    showIcon,
    iconPosition,
    primaryColor,
    borderRadius,
    animation,
  } = useNode((node) => ({
    productId: node.data.props.productId,
    _quantity: node.data.props.quantity,
    showQuantitySelector: node.data.props.showQuantitySelector,
    showPrice: node.data.props.showPrice,
    price: node.data.props.price,
    buttonText: node.data.props.buttonText,
    addedText: node.data.props.addedText,
    buttonStyle: node.data.props.buttonStyle,
    size: node.data.props.size,
    fullWidth: node.data.props.fullWidth,
    showIcon: node.data.props.showIcon,
    iconPosition: node.data.props.iconPosition,
    primaryColor: node.data.props.primaryColor,
    borderRadius: node.data.props.borderRadius,
    animation: node.data.props.animation,
  }));

  return (
    <div className="space-y-4 p-4">
      <div className="text-sm font-medium text-gray-900 border-b pb-2">
        Add to Cart Button Settings
      </div>

      {/* Product ID */}
      <div className="space-y-2">
        <Label>Product ID</Label>
        <Input
          value={productId || ''}
          onChange={(e) => setProp((props: AddToCartButtonProps) => (props.productId = e.target.value))}
          placeholder="Product ID (optional in editor)"
        />
      </div>

      {/* Button Text */}
      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input
          value={buttonText}
          onChange={(e) => setProp((props: AddToCartButtonProps) => (props.buttonText = e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label>Added Text</Label>
        <Input
          value={addedText}
          onChange={(e) => setProp((props: AddToCartButtonProps) => (props.addedText = e.target.value))}
        />
      </div>

      {/* Button Style */}
      <div className="space-y-2">
        <Label>Button Style</Label>
        <Select
          value={buttonStyle}
          onValueChange={(value) => setProp((props: AddToCartButtonProps) => (props.buttonStyle = value as 'primary' | 'secondary' | 'outline' | 'ghost'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary (Filled)</SelectItem>
            <SelectItem value="secondary">Secondary (Gray)</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="ghost">Ghost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Size */}
      <div className="space-y-2">
        <Label>Size</Label>
        <Select
          value={size}
          onValueChange={(value) => setProp((props: AddToCartButtonProps) => (props.size = value as 'sm' | 'md' | 'lg'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <Label>Border Radius: {borderRadius}px</Label>
        <Input
          type="number"
          value={borderRadius}
          onChange={(e) => setProp((props: AddToCartButtonProps) => (props.borderRadius = parseInt(e.target.value) || 8))}
          min={0}
          max={32}
        />
      </div>

      {/* Animation */}
      <div className="space-y-2">
        <Label>Animation</Label>
        <Select
          value={animation}
          onValueChange={(value) => setProp((props: AddToCartButtonProps) => (props.animation = value as 'none' | 'pulse' | 'bounce'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="pulse">Pulse</SelectItem>
            <SelectItem value="bounce">Bounce on Hover</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Display Options */}
      <div className="space-y-3">
        <Label>Display Options</Label>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Full Width</span>
          <Switch
            checked={fullWidth}
            onCheckedChange={(checked) => setProp((props: AddToCartButtonProps) => (props.fullWidth = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Icon</span>
          <Switch
            checked={showIcon}
            onCheckedChange={(checked) => setProp((props: AddToCartButtonProps) => (props.showIcon = checked))}
          />
        </div>

        {showIcon && (
          <div className="space-y-2">
            <Label>Icon Position</Label>
            <Select
              value={iconPosition}
              onValueChange={(value) => setProp((props: AddToCartButtonProps) => (props.iconPosition = value as 'left' | 'right'))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Quantity Selector</span>
          <Switch
            checked={showQuantitySelector}
            onCheckedChange={(checked) => setProp((props: AddToCartButtonProps) => (props.showQuantitySelector = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Price</span>
          <Switch
            checked={showPrice}
            onCheckedChange={(checked) => setProp((props: AddToCartButtonProps) => (props.showPrice = checked))}
          />
        </div>

        {showPrice && (
          <div className="space-y-2">
            <Label>Demo Price (cents)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setProp((props: AddToCartButtonProps) => (props.price = parseInt(e.target.value) || 0))}
              min={0}
            />
          </div>
        )}
      </div>

      {/* Primary Color */}
      <div className="space-y-2">
        <Label>Primary Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setProp((props: AddToCartButtonProps) => (props.primaryColor = e.target.value))}
            className="w-10 h-10 rounded border cursor-pointer"
          />
          <Input
            value={primaryColor}
            onChange={(e) => setProp((props: AddToCartButtonProps) => (props.primaryColor = e.target.value))}
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

AddToCartButton.craft = {
  displayName: 'AddToCartButton',
  props: defaultProps,
  related: {
    settings: AddToCartButtonSettings,
  },
};
