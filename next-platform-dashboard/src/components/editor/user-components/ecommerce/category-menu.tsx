'use client';

/**
 * CategoryMenu Component for Visual Editor (Craft.js)
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Displays a navigation menu of product categories.
 * Can be used in sidebars or as a standalone navigation element.
 */

import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { FolderTree, ChevronRight, ChevronDown } from 'lucide-react';
import type { Category } from '@/modules/ecommerce/types/ecommerce-types';

// ============================================================================
// TYPES
// ============================================================================

interface CategoryMenuProps {
  siteId?: string;
  layout?: 'vertical' | 'horizontal';
  showProductCount?: boolean;
  showIcons?: boolean;
  expandable?: boolean;
  maxDepth?: number;
  activeCategory?: string;
  backgroundColor?: string;
  textColor?: string;
  activeColor?: string;
  borderRadius?: number;
  padding?: number;
  gap?: number;
}

// ============================================================================
// DEFAULT PROPS
// ============================================================================

const defaultProps: CategoryMenuProps = {
  layout: 'vertical',
  showProductCount: true,
  showIcons: true,
  expandable: true,
  maxDepth: 2,
  backgroundColor: '#ffffff',
  textColor: '#374151',
  activeColor: '#2563eb',
  borderRadius: 8,
  padding: 12,
  gap: 4,
};

// ============================================================================
// MOCK DATA
// ============================================================================

const mockCategories: (Category & { count?: number; children?: Category[] })[] = [
  {
    id: '1',
    site_id: '',
    agency_id: '',
    parent_id: null,
    name: 'Electronics',
    slug: 'electronics',
    description: null,
    image_url: null,
    sort_order: 1,
    is_active: true,
    seo_title: null,
    seo_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    count: 45,
    children: [
      {
        id: '1-1',
        site_id: '',
        agency_id: '',
        parent_id: '1',
        name: 'Smartphones',
        slug: 'smartphones',
        description: null,
        image_url: null,
        sort_order: 1,
        is_active: true,
        seo_title: null,
        seo_description: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '1-2',
        site_id: '',
        agency_id: '',
        parent_id: '1',
        name: 'Laptops',
        slug: 'laptops',
        description: null,
        image_url: null,
        sort_order: 2,
        is_active: true,
        seo_title: null,
        seo_description: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: '2',
    site_id: '',
    agency_id: '',
    parent_id: null,
    name: 'Fashion',
    slug: 'fashion',
    description: null,
    image_url: null,
    sort_order: 2,
    is_active: true,
    seo_title: null,
    seo_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    count: 128,
    children: [
      {
        id: '2-1',
        site_id: '',
        agency_id: '',
        parent_id: '2',
        name: "Men's Wear",
        slug: 'mens-wear',
        description: null,
        image_url: null,
        sort_order: 1,
        is_active: true,
        seo_title: null,
        seo_description: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2-2',
        site_id: '',
        agency_id: '',
        parent_id: '2',
        name: "Women's Wear",
        slug: 'womens-wear',
        description: null,
        image_url: null,
        sort_order: 2,
        is_active: true,
        seo_title: null,
        seo_description: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: '3',
    site_id: '',
    agency_id: '',
    parent_id: null,
    name: 'Home & Garden',
    slug: 'home-garden',
    description: null,
    image_url: null,
    sort_order: 3,
    is_active: true,
    seo_title: null,
    seo_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    count: 67,
  },
  {
    id: '4',
    site_id: '',
    agency_id: '',
    parent_id: null,
    name: 'Sports',
    slug: 'sports',
    description: null,
    image_url: null,
    sort_order: 4,
    is_active: true,
    seo_title: null,
    seo_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    count: 89,
  },
  {
    id: '5',
    site_id: '',
    agency_id: '',
    parent_id: null,
    name: 'Books',
    slug: 'books',
    description: null,
    image_url: null,
    sort_order: 5,
    is_active: true,
    seo_title: null,
    seo_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    count: 234,
  },
];

// ============================================================================
// CATEGORY MENU COMPONENT
// ============================================================================

export function CategoryMenu(props: CategoryMenuProps) {
  const mergedProps = { ...defaultProps, ...props };
  const {
    _siteId,
    layout,
    showProductCount,
    showIcons,
    expandable,
    maxDepth,
    activeCategory,
    backgroundColor,
    textColor,
    activeColor,
    borderRadius,
    padding,
    gap,
  } = { ...mergedProps, _siteId: mergedProps.siteId };

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const [categories] = useState(mockCategories);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategory = (category: typeof mockCategories[0], depth = 0) => {
    if (depth >= maxDepth!) return null;
    
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isActive = activeCategory === category.slug;

    return (
      <div key={category.id}>
        <a
          href={`/products/category/${category.slug}`}
          className={`
            flex items-center justify-between transition-colors
            ${isActive ? 'font-semibold' : 'hover:opacity-80'}
          `}
          style={{
            padding: `${padding! / 2}px ${padding}px`,
            paddingLeft: `${padding! + depth * 16}px`,
            color: isActive ? activeColor : textColor,
            borderRadius: `${borderRadius}px`,
            backgroundColor: isActive ? `${activeColor}10` : 'transparent',
          }}
          onClick={(e) => {
            if (hasChildren && expandable) {
              e.preventDefault();
              toggleExpanded(category.id);
            }
          }}
        >
          <span className="flex items-center gap-2">
            {showIcons && (
              <FolderTree className="h-4 w-4 opacity-60" />
            )}
            <span>{category.name}</span>
          </span>
          
          <span className="flex items-center gap-2">
            {showProductCount && category.count && (
              <span className="text-xs opacity-50">({category.count})</span>
            )}
            {hasChildren && expandable && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 opacity-50" />
              ) : (
                <ChevronRight className="h-4 w-4 opacity-50" />
              )
            )}
          </span>
        </a>
        
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategory(child as typeof mockCategories[0], depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`category-menu-component ${selected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
      style={{
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px 0`,
      }}
    >
      {layout === 'horizontal' ? (
        <div className="flex items-center flex-wrap" style={{ gap: `${gap}px` }}>
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/products/category/${category.slug}`}
              className="px-4 py-2 rounded-lg transition-colors hover:opacity-80"
              style={{
                color: activeCategory === category.slug ? activeColor : textColor,
                backgroundColor: activeCategory === category.slug ? `${activeColor}10` : 'transparent',
              }}
            >
              <span className="flex items-center gap-2">
                {showIcons && <FolderTree className="h-4 w-4 opacity-60" />}
                <span>{category.name}</span>
                {showProductCount && category.count && (
                  <span className="text-xs opacity-50">({category.count})</span>
                )}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
          {categories.map((category) => renderCategory(category))}
        </div>
      )}
    </nav>
  );
}

// ============================================================================
// SETTINGS PANEL
// ============================================================================

function CategoryMenuSettings() {
  const {
    actions: { setProp },
    layout,
    showProductCount,
    showIcons,
    expandable,
    maxDepth,
    backgroundColor,
    textColor,
    activeColor,
    borderRadius,
    padding,
    gap,
  } = useNode((node) => ({
    layout: node.data.props.layout,
    showProductCount: node.data.props.showProductCount,
    showIcons: node.data.props.showIcons,
    expandable: node.data.props.expandable,
    maxDepth: node.data.props.maxDepth,
    backgroundColor: node.data.props.backgroundColor,
    textColor: node.data.props.textColor,
    activeColor: node.data.props.activeColor,
    borderRadius: node.data.props.borderRadius,
    padding: node.data.props.padding,
    gap: node.data.props.gap,
  }));

  return (
    <div className="space-y-4 p-4">
      <div className="text-sm font-medium text-gray-900 border-b pb-2">
        Category Menu Settings
      </div>

      {/* Layout */}
      <div className="space-y-2">
        <Label>Layout</Label>
        <Select
          value={layout}
          onValueChange={(value) => setProp((props: CategoryMenuProps) => (props.layout = value as 'vertical' | 'horizontal'))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vertical">Vertical (Sidebar)</SelectItem>
            <SelectItem value="horizontal">Horizontal (Navbar)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Max Depth (only for vertical) */}
      {layout === 'vertical' && (
        <div className="space-y-2">
          <Label>Max Depth: {maxDepth}</Label>
          <Slider
            value={[maxDepth || 2]}
            onValueChange={([value]) => setProp((props: CategoryMenuProps) => (props.maxDepth = value))}
            min={1}
            max={3}
            step={1}
          />
        </div>
      )}

      {/* Display Options */}
      <div className="space-y-3">
        <Label>Display Options</Label>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Show Product Count</span>
          <Switch
            checked={showProductCount}
            onCheckedChange={(checked) => setProp((props: CategoryMenuProps) => (props.showProductCount = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show Icons</span>
          <Switch
            checked={showIcons}
            onCheckedChange={(checked) => setProp((props: CategoryMenuProps) => (props.showIcons = checked))}
          />
        </div>

        {layout === 'vertical' && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Expandable Subcategories</span>
            <Switch
              checked={expandable}
              onCheckedChange={(checked) => setProp((props: CategoryMenuProps) => (props.expandable = checked))}
            />
          </div>
        )}
      </div>

      {/* Spacing */}
      <div className="space-y-2">
        <Label>Padding: {padding}px</Label>
        <Slider
          value={[padding || 12]}
          onValueChange={([value]) => setProp((props: CategoryMenuProps) => (props.padding = value))}
          min={4}
          max={24}
          step={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Gap: {gap}px</Label>
        <Slider
          value={[gap || 4]}
          onValueChange={([value]) => setProp((props: CategoryMenuProps) => (props.gap = value))}
          min={0}
          max={16}
          step={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Border Radius: {borderRadius}px</Label>
        <Slider
          value={[borderRadius || 8]}
          onValueChange={([value]) => setProp((props: CategoryMenuProps) => (props.borderRadius = value))}
          min={0}
          max={24}
          step={2}
        />
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <Label>Colors</Label>
        
        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Background</span>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setProp((props: CategoryMenuProps) => (props.backgroundColor = e.target.value))}
            className="w-8 h-8 rounded border cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Text Color</span>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setProp((props: CategoryMenuProps) => (props.textColor = e.target.value))}
            className="w-8 h-8 rounded border cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Active Color</span>
          <input
            type="color"
            value={activeColor}
            onChange={(e) => setProp((props: CategoryMenuProps) => (props.activeColor = e.target.value))}
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

CategoryMenu.craft = {
  displayName: 'CategoryMenu',
  props: defaultProps,
  related: {
    settings: CategoryMenuSettings,
  },
};
