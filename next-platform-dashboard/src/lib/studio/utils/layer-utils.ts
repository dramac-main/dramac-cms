/**
 * DRAMAC Studio Layer Utilities
 * 
 * Utility functions for building and managing the layer tree.
 * Created in PHASE-STUDIO-16.
 */

import type { StudioComponent, StudioPageData } from '@/types/studio';
import type { LayerItem } from '@/types/studio-history';
import { componentRegistry } from '@/lib/studio/registry/component-registry';

// =============================================================================
// LABEL UTILITIES
// =============================================================================

/**
 * Get display label for a component
 * Tries to extract meaningful text from props
 */
export function getComponentLabel(component: StudioComponent): string {
  // Priority order for label props
  const labelProps = ['title', 'text', 'label', 'heading', 'name', 'alt', 'content', 'placeholder'];
  
  for (const prop of labelProps) {
    const value = component.props[prop];
    
    // Direct string value
    if (typeof value === 'string' && value.trim()) {
      const text = value.trim();
      // Strip HTML tags if present
      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      if (cleanText) {
        return cleanText.length > 30 ? cleanText.slice(0, 30) + '...' : cleanText;
      }
    }
    
    // Handle responsive values
    if (value && typeof value === 'object' && 'mobile' in value) {
      const mobileValue = (value as { mobile: unknown }).mobile;
      if (typeof mobileValue === 'string' && mobileValue.trim()) {
        const text = mobileValue.trim().replace(/<[^>]*>/g, '').trim();
        if (text) {
          return text.length > 30 ? text.slice(0, 30) + '...' : text;
        }
      }
    }
  }
  
  // Fall back to component type with readable formatting
  return formatComponentType(component.type);
}

/**
 * Format component type for display
 */
function formatComponentType(type: string): string {
  // Convert PascalCase to Title Case with spaces
  return type.replace(/([A-Z])/g, ' $1').trim();
}

// =============================================================================
// ICON UTILITIES
// =============================================================================

/**
 * Default icon mapping by component type
 */
const ICON_MAP: Record<string, string> = {
  // Layout
  Section: 'LayoutGrid',
  Container: 'Square',
  Columns: 'Columns',
  Grid: 'Grid3X3',
  Spacer: 'MoveVertical',
  Divider: 'Minus',
  
  // Typography
  Heading: 'Heading',
  Text: 'Type',
  RichText: 'FileText',
  Paragraph: 'AlignLeft',
  
  // Media
  Image: 'Image',
  Video: 'Video',
  Icon: 'Star',
  Gallery: 'Images',
  
  // Interactive
  Button: 'MousePointerClick',
  Link: 'Link',
  Accordion: 'ChevronsDownUp',
  Tabs: 'PanelTop',
  Modal: 'Maximize2',
  
  // Marketing
  Hero: 'Sparkles',
  CTA: 'Megaphone',
  Testimonial: 'Quote',
  Pricing: 'CreditCard',
  FAQ: 'HelpCircle',
  
  // E-Commerce
  ProductCard: 'ShoppingBag',
  Cart: 'ShoppingCart',
  Checkout: 'CreditCard',
  
  // Forms
  Form: 'FormInput',
  Input: 'TextCursor',
  Select: 'ChevronDown',
  Checkbox: 'CheckSquare',
  
  // Navigation
  Navbar: 'Menu',
  Footer: 'Footprints',
  Breadcrumb: 'ChevronRight',
};

/**
 * Get icon for a component type
 */
export function getComponentIcon(type: string): string {
  // First check registry for defined icon
  const definition = componentRegistry.get(type);
  if (definition?.icon) {
    return definition.icon;
  }
  
  // Fall back to icon map
  return ICON_MAP[type] || 'Component';
}

// =============================================================================
// TREE BUILDING
// =============================================================================

/**
 * Build tree structure from flat components
 */
export function buildLayerTree(
  pageData: StudioPageData,
  selectedComponentId: string | null,
  expandedLayers: Set<string>
): LayerItem[] {
  const { root, components } = pageData;
  
  function buildNode(componentId: string, depth: number): LayerItem | null {
    const component = components[componentId];
    if (!component) return null;
    
    const childIds = component.children || [];
    const children = childIds
      .map(childId => buildNode(childId, depth + 1))
      .filter((child): child is LayerItem => child !== null);
    
    return {
      id: component.id,
      type: component.type,
      label: getComponentLabel(component),
      icon: getComponentIcon(component.type),
      children,
      isLocked: component.locked || false,
      isHidden: component.hidden || false,
      isSelected: component.id === selectedComponentId,
      isExpanded: expandedLayers.has(component.id),
      depth,
      parentId: component.parentId,
      hasChildren: childIds.length > 0,
    };
  }
  
  return root.children
    .map(id => buildNode(id, 0))
    .filter((item): item is LayerItem => item !== null);
}

/**
 * Flatten tree for virtualized rendering
 * Only includes visible items (respects expanded state)
 */
export function flattenLayerTree(
  tree: LayerItem[],
  expandedLayers: Set<string>
): LayerItem[] {
  const result: LayerItem[] = [];
  
  function traverse(items: LayerItem[]) {
    for (const item of items) {
      result.push(item);
      if (item.hasChildren && expandedLayers.has(item.id)) {
        traverse(item.children);
      }
    }
  }
  
  traverse(tree);
  return result;
}

/**
 * Filter layers by search query
 * Returns tree with only matching items and their ancestors
 */
export function filterLayers(
  layers: LayerItem[],
  query: string
): LayerItem[] {
  if (!query.trim()) return layers;
  
  const lowerQuery = query.toLowerCase();
  
  function matchesQuery(item: LayerItem): boolean {
    return (
      item.type.toLowerCase().includes(lowerQuery) ||
      item.label.toLowerCase().includes(lowerQuery)
    );
  }
  
  function filterTree(items: LayerItem[]): LayerItem[] {
    return items
      .map(item => {
        const filteredChildren = filterTree(item.children);
        
        // Include if matches directly or has matching descendants
        if (matchesQuery(item) || filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren,
            isExpanded: true, // Auto-expand matching items
          };
        }
        return null;
      })
      .filter((item): item is LayerItem => item !== null);
  }
  
  return filterTree(layers);
}

/**
 * Get all component IDs in tree order (depth-first)
 */
export function getAllLayerIds(pageData: StudioPageData): string[] {
  const result: string[] = [];
  
  function traverse(componentId: string) {
    result.push(componentId);
    const component = pageData.components[componentId];
    if (component?.children) {
      component.children.forEach(traverse);
    }
  }
  
  pageData.root.children.forEach(traverse);
  return result;
}

/**
 * Get sibling component IDs
 */
export function getSiblingIds(
  pageData: StudioPageData,
  componentId: string
): string[] {
  const component = pageData.components[componentId];
  if (!component) return [];
  
  if (component.parentId) {
    const parent = pageData.components[component.parentId];
    return parent?.children || [];
  }
  
  return pageData.root.children;
}

/**
 * Get component index in parent
 */
export function getComponentIndex(
  pageData: StudioPageData,
  componentId: string
): number {
  const siblings = getSiblingIds(pageData, componentId);
  return siblings.indexOf(componentId);
}
