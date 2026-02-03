# PHASE-STUDIO-24: Section Templates

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-24 |
| Title | Section Templates |
| Priority | Medium |
| Estimated Time | 12-16 hours |
| Dependencies | STUDIO-01 through STUDIO-23 (Waves 1-7) |
| Risk Level | Low |

## Problem Statement

Users building pages from scratch face a "blank canvas" problem. They need to:
1. Design every section from individual components (time-consuming)
2. Know best practices for section layouts (learning curve)
3. Maintain design consistency across pages (difficult)

A template library solves this by providing pre-designed, professionally crafted sections that users can insert with one click and customize to match their brand.

## Goals

- [ ] Create template data structure with categories and color tokens
- [ ] Build template browser UI with search, filter, and preview
- [ ] Implement template insertion at specified position
- [ ] Enable automatic color adaptation to site color scheme
- [ ] Provide 12+ starter templates across all major categories
- [ ] Store templates in database with versioning support

## Technical Approach

### Template System Architecture

```
Template Library
├── Data Layer (template-store.ts)
│   ├── Fetch templates from database
│   ├── Filter by category/search
│   └── Cache templates
├── UI Layer (template-browser.tsx)
│   ├── Category sidebar
│   ├── Search bar
│   ├── Template grid with previews
│   └── Insert actions
└── Insertion Logic (template-utils.ts)
    ├── Clone with new IDs
    ├── Replace color tokens
    ├── Replace text tokens
    └── Position in component tree
```

### Color Token System

Templates use tokens like `$primary`, `$secondary` that are replaced with the site's actual colors during insertion:

```typescript
// Template definition
background: { type: 'gradient', colors: ['$primary', '$secondary'] }

// After insertion (site has blue theme)
background: { type: 'gradient', colors: ['#3B82F6', '#8B5CF6'] }
```

## Implementation Tasks

### Task 1: Template Type Definitions

**Description:** Create TypeScript types for templates and categories.

**Files:**
- CREATE: `src/types/studio-templates.ts`

**Code:**

```typescript
// src/types/studio-templates.ts

import type { StudioComponent } from './studio';

/**
 * Template categories for section templates
 */
export type TemplateCategory = 
  | 'hero'
  | 'features'
  | 'pricing'
  | 'testimonials'
  | 'cta'
  | 'team'
  | 'faq'
  | 'contact'
  | 'footer'
  | 'gallery'
  | 'stats'
  | 'newsletter';

/**
 * Category metadata for display
 */
export interface TemplateCategoryInfo {
  id: TemplateCategory;
  label: string;
  description: string;
  icon: string;
}

/**
 * Color token mapping - maps template tokens to site color keys
 */
export type ColorTokenMap = Record<string, string>;

/**
 * Text token mapping - placeholder texts in templates
 */
export type TextTokenMap = Record<string, string>;

/**
 * Section template structure
 */
export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string;
  tags: string[];
  isPremium: boolean;
  
  // Template data
  components: StudioComponent[];
  
  // Customization tokens
  colorTokens: ColorTokenMap;
  textTokens: TextTokenMap;
  
  // Metadata
  version: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Site color scheme for token replacement
 */
export interface SiteColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
}

/**
 * Template insert position
 */
export type TemplateInsertPosition = 'top' | 'bottom' | 'after-selected';

/**
 * Template store state
 */
export interface TemplateStoreState {
  templates: SectionTemplate[];
  categories: TemplateCategoryInfo[];
  selectedCategory: TemplateCategory | 'all';
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Template store actions
 */
export interface TemplateStoreActions {
  fetchTemplates: () => Promise<void>;
  setCategory: (category: TemplateCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  getFilteredTemplates: () => SectionTemplate[];
  getTemplateById: (id: string) => SectionTemplate | undefined;
}

/**
 * Template browser props
 */
export interface TemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (template: SectionTemplate, position: TemplateInsertPosition) => void;
  insertPosition?: TemplateInsertPosition;
}

/**
 * Template category metadata
 */
export const TEMPLATE_CATEGORIES: TemplateCategoryInfo[] = [
  { id: 'hero', label: 'Hero', description: 'Full-width introductory sections', icon: 'layout-template' },
  { id: 'features', label: 'Features', description: 'Showcase product features', icon: 'sparkles' },
  { id: 'pricing', label: 'Pricing', description: 'Pricing tables and plans', icon: 'credit-card' },
  { id: 'testimonials', label: 'Testimonials', description: 'Customer reviews and quotes', icon: 'message-square' },
  { id: 'cta', label: 'Call to Action', description: 'Conversion-focused sections', icon: 'zap' },
  { id: 'team', label: 'Team', description: 'Team member showcases', icon: 'users' },
  { id: 'faq', label: 'FAQ', description: 'Frequently asked questions', icon: 'help-circle' },
  { id: 'contact', label: 'Contact', description: 'Contact forms and info', icon: 'mail' },
  { id: 'footer', label: 'Footer', description: 'Page footers with links', icon: 'square' },
  { id: 'gallery', label: 'Gallery', description: 'Image galleries and grids', icon: 'image' },
  { id: 'stats', label: 'Stats', description: 'Statistics and metrics', icon: 'bar-chart' },
  { id: 'newsletter', label: 'Newsletter', description: 'Email signup sections', icon: 'mail-plus' },
];
```

**Acceptance Criteria:**
- [ ] All template types are defined
- [ ] Category metadata is complete
- [ ] Types are exported properly

---

### Task 2: Template Store

**Description:** Create Zustand store for managing templates.

**Files:**
- CREATE: `src/lib/studio/store/template-store.ts`

**Code:**

```typescript
// src/lib/studio/store/template-store.ts

import { create } from 'zustand';
import type {
  SectionTemplate,
  TemplateCategoryInfo,
  TemplateCategory,
  TemplateStoreState,
  TemplateStoreActions,
  TEMPLATE_CATEGORIES,
} from '@/types/studio-templates';
import { STARTER_TEMPLATES } from '../data/starter-templates';

interface TemplateStore extends TemplateStoreState, TemplateStoreActions {}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  // State
  templates: [],
  categories: TEMPLATE_CATEGORIES,
  selectedCategory: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,

  // Actions
  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // For now, use starter templates
      // Later: fetch from Supabase
      // const { data, error } = await supabase
      //   .from('studio_templates')
      //   .select('*')
      //   .order('category', { ascending: true });
      
      // Simulate API delay for now
      await new Promise(resolve => setTimeout(resolve, 100));
      
      set({
        templates: STARTER_TEMPLATES,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch templates',
        isLoading: false,
      });
    }
  },

  setCategory: (category) => {
    set({ selectedCategory: category });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  getFilteredTemplates: () => {
    const { templates, selectedCategory, searchQuery } = get();
    
    let filtered = templates;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  },

  getTemplateById: (id) => {
    return get().templates.find(t => t.id === id);
  },
}));

// Hook for filtered templates with auto-update
export function useFilteredTemplates() {
  const templates = useTemplateStore(state => state.templates);
  const selectedCategory = useTemplateStore(state => state.selectedCategory);
  const searchQuery = useTemplateStore(state => state.searchQuery);
  const getFilteredTemplates = useTemplateStore(state => state.getFilteredTemplates);
  
  return getFilteredTemplates();
}
```

**Acceptance Criteria:**
- [ ] Store fetches templates
- [ ] Category filtering works
- [ ] Search filtering works
- [ ] Templates can be retrieved by ID

---

### Task 3: Template Utilities

**Description:** Create utilities for cloning and inserting templates.

**Files:**
- CREATE: `src/lib/studio/utils/template-utils.ts`

**Code:**

```typescript
// src/lib/studio/utils/template-utils.ts

import { nanoid } from 'nanoid';
import type { StudioComponent } from '@/types/studio';
import type {
  SectionTemplate,
  SiteColorScheme,
  ColorTokenMap,
  TextTokenMap,
  TemplateInsertPosition,
} from '@/types/studio-templates';

/**
 * Generate a new component ID
 */
function generateId(): string {
  return `comp_${nanoid(10)}`;
}

/**
 * Clone template components with new unique IDs
 */
export function cloneTemplateComponents(
  components: StudioComponent[]
): StudioComponent[] {
  const idMap = new Map<string, string>();
  
  // First pass: generate new IDs for all components
  components.forEach(comp => {
    idMap.set(comp.id, generateId());
  });
  
  // Second pass: update all ID references
  return components.map(comp => ({
    ...comp,
    id: idMap.get(comp.id)!,
    parentId: comp.parentId ? idMap.get(comp.parentId) : undefined,
    children: comp.children?.map(childId => idMap.get(childId) || childId),
  }));
}

/**
 * Deep replace tokens in an object
 */
function replaceTokensInValue(
  value: unknown,
  tokens: Record<string, string>,
  replacements: Record<string, string>
): unknown {
  if (typeof value === 'string') {
    let result = value;
    for (const [token, key] of Object.entries(tokens)) {
      if (result.includes(token) && replacements[key]) {
        result = result.replace(new RegExp(escapeRegex(token), 'g'), replacements[key]);
      }
    }
    return result;
  }
  
  if (Array.isArray(value)) {
    return value.map(item => replaceTokensInValue(item, tokens, replacements));
  }
  
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = replaceTokensInValue(v, tokens, replacements);
    }
    return result;
  }
  
  return value;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace color tokens in components with site colors
 */
export function replaceColorTokens(
  components: StudioComponent[],
  colorTokens: ColorTokenMap,
  siteColors: SiteColorScheme
): StudioComponent[] {
  return components.map(comp => ({
    ...comp,
    props: replaceTokensInValue(
      comp.props,
      colorTokens,
      siteColors as unknown as Record<string, string>
    ) as Record<string, unknown>,
  }));
}

/**
 * Replace text tokens in components with placeholder texts
 */
export function replaceTextTokens(
  components: StudioComponent[],
  textTokens: TextTokenMap
): StudioComponent[] {
  // Create a simple replacement map
  const replacements: Record<string, string> = {};
  for (const [token, text] of Object.entries(textTokens)) {
    replacements[token.replace('$', '')] = text;
  }
  
  return components.map(comp => ({
    ...comp,
    props: replaceTokensInValue(
      comp.props,
      textTokens,
      textTokens
    ) as Record<string, unknown>,
  }));
}

/**
 * Prepare template for insertion
 * 1. Clone with new IDs
 * 2. Replace color tokens with site colors
 * 3. Replace text tokens with placeholders
 */
export function prepareTemplateForInsertion(
  template: SectionTemplate,
  siteColors: SiteColorScheme
): StudioComponent[] {
  // Step 1: Clone with new IDs
  let components = cloneTemplateComponents(template.components);
  
  // Step 2: Replace color tokens
  components = replaceColorTokens(components, template.colorTokens, siteColors);
  
  // Step 3: Replace text tokens (keep placeholder text for user to customize)
  components = replaceTextTokens(components, template.textTokens);
  
  return components;
}

/**
 * Get the root component(s) from template components
 * Root components have no parentId
 */
export function getTemplateRootComponents(
  components: StudioComponent[]
): StudioComponent[] {
  return components.filter(c => !c.parentId);
}

/**
 * Get child components for a given parent ID
 */
export function getTemplateChildComponents(
  components: StudioComponent[],
  parentId: string
): StudioComponent[] {
  return components.filter(c => c.parentId === parentId);
}

/**
 * Convert components array to a record keyed by ID
 */
export function componentsToRecord(
  components: StudioComponent[]
): Record<string, StudioComponent> {
  return components.reduce((acc, comp) => {
    acc[comp.id] = comp;
    return acc;
  }, {} as Record<string, StudioComponent>);
}

/**
 * Default site colors (used if site doesn't have custom colors)
 */
export const DEFAULT_SITE_COLORS: SiteColorScheme = {
  primary: '#3B82F6',      // Blue
  secondary: '#8B5CF6',    // Purple
  accent: '#10B981',       // Green
  background: '#FFFFFF',
  foreground: '#0F172A',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
  border: '#E2E8F0',
};
```

**Acceptance Criteria:**
- [ ] Clone creates unique IDs
- [ ] ID references are updated correctly
- [ ] Color tokens are replaced
- [ ] Text tokens are replaced
- [ ] Deep nested objects are handled

---

### Task 4: Starter Templates Data

**Description:** Create 12+ pre-designed section templates.

**Files:**
- CREATE: `src/lib/studio/data/starter-templates.ts`

**Code:**

```typescript
// src/lib/studio/data/starter-templates.ts

import type { SectionTemplate } from '@/types/studio-templates';

/**
 * Starter templates included with DRAMAC Studio
 */
export const STARTER_TEMPLATES: SectionTemplate[] = [
  // ========== HERO SECTIONS ==========
  {
    id: 'hero-gradient-centered',
    name: 'Gradient Hero - Centered',
    description: 'Bold gradient background with centered headline and dual CTAs',
    category: 'hero',
    thumbnail: '/templates/hero-gradient-centered.png',
    tags: ['gradient', 'centered', 'cta', 'modern'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {
      '$primary': 'primary',
      '$secondary': 'secondary',
    },
    textTokens: {
      '$headline': 'Build Something Amazing',
      '$subheadline': 'The all-in-one platform that helps you create, manage, and scale your digital presence',
      '$cta1': 'Get Started Free',
      '$cta2': 'Watch Demo',
    },
    components: [
      {
        id: 'hero-section',
        type: 'Section',
        props: {
          background: {
            type: 'gradient',
            direction: '135deg',
            colors: ['$primary', '$secondary'],
          },
          padding: { mobile: '64px 24px', tablet: '96px 48px', desktop: '128px 64px' },
          minHeight: { mobile: '80vh' },
        },
        children: ['hero-container'],
      },
      {
        id: 'hero-container',
        type: 'Container',
        props: {
          maxWidth: '800px',
          textAlign: { mobile: 'center' },
        },
        parentId: 'hero-section',
        children: ['hero-heading', 'hero-subheading', 'hero-buttons'],
      },
      {
        id: 'hero-heading',
        type: 'Heading',
        props: {
          text: '$headline',
          level: 'h1',
          fontSize: { mobile: '36px', tablet: '48px', desktop: '64px' },
          fontWeight: 'bold',
          color: '#FFFFFF',
          marginBottom: { mobile: '16px', desktop: '24px' },
        },
        parentId: 'hero-container',
      },
      {
        id: 'hero-subheading',
        type: 'Text',
        props: {
          text: '$subheadline',
          fontSize: { mobile: '18px', desktop: '20px' },
          color: 'rgba(255,255,255,0.9)',
          marginBottom: { mobile: '32px', desktop: '40px' },
        },
        parentId: 'hero-container',
      },
      {
        id: 'hero-buttons',
        type: 'Container',
        props: {
          display: 'flex',
          flexDirection: { mobile: 'column', tablet: 'row' },
          gap: { mobile: '12px', tablet: '16px' },
          justifyContent: 'center',
        },
        parentId: 'hero-container',
        children: ['hero-btn-primary', 'hero-btn-secondary'],
      },
      {
        id: 'hero-btn-primary',
        type: 'Button',
        props: {
          text: '$cta1',
          variant: 'solid',
          size: 'lg',
          backgroundColor: '#FFFFFF',
          textColor: '$primary',
        },
        parentId: 'hero-buttons',
      },
      {
        id: 'hero-btn-secondary',
        type: 'Button',
        props: {
          text: '$cta2',
          variant: 'outline',
          size: 'lg',
          borderColor: '#FFFFFF',
          textColor: '#FFFFFF',
        },
        parentId: 'hero-buttons',
      },
    ],
  },
  {
    id: 'hero-split-image',
    name: 'Hero - Split with Image',
    description: 'Two-column hero with text on left and image on right',
    category: 'hero',
    thumbnail: '/templates/hero-split-image.png',
    tags: ['split', 'image', 'modern'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {
      '$primary': 'primary',
    },
    textTokens: {
      '$headline': 'Grow Your Business with Smart Tools',
      '$subheadline': 'Everything you need to attract customers, manage projects, and scale your operations.',
      '$cta': 'Start Your Free Trial',
    },
    components: [
      {
        id: 'hero-split-section',
        type: 'Section',
        props: {
          backgroundColor: '#FFFFFF',
          padding: { mobile: '48px 24px', desktop: '80px 64px' },
        },
        children: ['hero-split-grid'],
      },
      {
        id: 'hero-split-grid',
        type: 'Columns',
        props: {
          columns: { mobile: 1, desktop: 2 },
          gap: { mobile: '32px', desktop: '64px' },
          alignItems: 'center',
        },
        parentId: 'hero-split-section',
        children: ['hero-split-content', 'hero-split-image'],
      },
      {
        id: 'hero-split-content',
        type: 'Container',
        props: {},
        parentId: 'hero-split-grid',
        children: ['hero-split-heading', 'hero-split-text', 'hero-split-btn'],
      },
      {
        id: 'hero-split-heading',
        type: 'Heading',
        props: {
          text: '$headline',
          level: 'h1',
          fontSize: { mobile: '32px', tablet: '40px', desktop: '48px' },
          fontWeight: 'bold',
          marginBottom: '16px',
        },
        parentId: 'hero-split-content',
      },
      {
        id: 'hero-split-text',
        type: 'Text',
        props: {
          text: '$subheadline',
          fontSize: { mobile: '16px', desktop: '18px' },
          color: '#64748B',
          marginBottom: '24px',
        },
        parentId: 'hero-split-content',
      },
      {
        id: 'hero-split-btn',
        type: 'Button',
        props: {
          text: '$cta',
          variant: 'solid',
          size: 'lg',
          backgroundColor: '$primary',
        },
        parentId: 'hero-split-content',
      },
      {
        id: 'hero-split-image',
        type: 'Image',
        props: {
          src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
          alt: 'Hero image',
          borderRadius: '16px',
          aspectRatio: '4/3',
        },
        parentId: 'hero-split-grid',
      },
    ],
  },

  // ========== FEATURES SECTIONS ==========
  {
    id: 'features-grid-icons',
    name: 'Features Grid - With Icons',
    description: 'Three-column feature grid with icons and descriptions',
    category: 'features',
    thumbnail: '/templates/features-grid-icons.png',
    tags: ['grid', 'icons', 'three-column'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {
      '$primary': 'primary',
    },
    textTokens: {
      '$title': 'Everything You Need',
      '$subtitle': 'Powerful features to help you manage and grow your business',
      '$feature1_title': 'Lightning Fast',
      '$feature1_desc': 'Optimized for speed so your customers never have to wait',
      '$feature2_title': 'Secure by Default',
      '$feature2_desc': 'Enterprise-grade security to protect your data',
      '$feature3_title': '24/7 Support',
      '$feature3_desc': 'Our team is always here to help you succeed',
    },
    components: [
      {
        id: 'features-section',
        type: 'Section',
        props: {
          backgroundColor: '#F8FAFC',
          padding: { mobile: '64px 24px', desktop: '96px 64px' },
        },
        children: ['features-container'],
      },
      {
        id: 'features-container',
        type: 'Container',
        props: {
          maxWidth: '1200px',
        },
        parentId: 'features-section',
        children: ['features-header', 'features-grid'],
      },
      {
        id: 'features-header',
        type: 'Container',
        props: {
          textAlign: { mobile: 'center' },
          marginBottom: { mobile: '48px', desktop: '64px' },
        },
        parentId: 'features-container',
        children: ['features-title', 'features-subtitle'],
      },
      {
        id: 'features-title',
        type: 'Heading',
        props: {
          text: '$title',
          level: 'h2',
          fontSize: { mobile: '28px', desktop: '36px' },
          fontWeight: 'bold',
          marginBottom: '16px',
        },
        parentId: 'features-header',
      },
      {
        id: 'features-subtitle',
        type: 'Text',
        props: {
          text: '$subtitle',
          fontSize: { mobile: '16px', desktop: '18px' },
          color: '#64748B',
        },
        parentId: 'features-header',
      },
      {
        id: 'features-grid',
        type: 'Columns',
        props: {
          columns: { mobile: 1, tablet: 2, desktop: 3 },
          gap: { mobile: '24px', desktop: '32px' },
        },
        parentId: 'features-container',
        children: ['feature-1', 'feature-2', 'feature-3'],
      },
      {
        id: 'feature-1',
        type: 'Container',
        props: {
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
        parentId: 'features-grid',
        children: ['feature-1-icon', 'feature-1-title', 'feature-1-desc'],
      },
      {
        id: 'feature-1-icon',
        type: 'Icon',
        props: {
          name: 'zap',
          size: 40,
          color: '$primary',
          marginBottom: '16px',
        },
        parentId: 'feature-1',
      },
      {
        id: 'feature-1-title',
        type: 'Heading',
        props: {
          text: '$feature1_title',
          level: 'h3',
          fontSize: '20px',
          fontWeight: 'semibold',
          marginBottom: '8px',
        },
        parentId: 'feature-1',
      },
      {
        id: 'feature-1-desc',
        type: 'Text',
        props: {
          text: '$feature1_desc',
          fontSize: '14px',
          color: '#64748B',
        },
        parentId: 'feature-1',
      },
      {
        id: 'feature-2',
        type: 'Container',
        props: {
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
        parentId: 'features-grid',
        children: ['feature-2-icon', 'feature-2-title', 'feature-2-desc'],
      },
      {
        id: 'feature-2-icon',
        type: 'Icon',
        props: {
          name: 'shield',
          size: 40,
          color: '$primary',
          marginBottom: '16px',
        },
        parentId: 'feature-2',
      },
      {
        id: 'feature-2-title',
        type: 'Heading',
        props: {
          text: '$feature2_title',
          level: 'h3',
          fontSize: '20px',
          fontWeight: 'semibold',
          marginBottom: '8px',
        },
        parentId: 'feature-2',
      },
      {
        id: 'feature-2-desc',
        type: 'Text',
        props: {
          text: '$feature2_desc',
          fontSize: '14px',
          color: '#64748B',
        },
        parentId: 'feature-2',
      },
      {
        id: 'feature-3',
        type: 'Container',
        props: {
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
        parentId: 'features-grid',
        children: ['feature-3-icon', 'feature-3-title', 'feature-3-desc'],
      },
      {
        id: 'feature-3-icon',
        type: 'Icon',
        props: {
          name: 'headphones',
          size: 40,
          color: '$primary',
          marginBottom: '16px',
        },
        parentId: 'feature-3',
      },
      {
        id: 'feature-3-title',
        type: 'Heading',
        props: {
          text: '$feature3_title',
          level: 'h3',
          fontSize: '20px',
          fontWeight: 'semibold',
          marginBottom: '8px',
        },
        parentId: 'feature-3',
      },
      {
        id: 'feature-3-desc',
        type: 'Text',
        props: {
          text: '$feature3_desc',
          fontSize: '14px',
          color: '#64748B',
        },
        parentId: 'feature-3',
      },
    ],
  },
  {
    id: 'features-alternating',
    name: 'Features - Alternating Layout',
    description: 'Feature sections that alternate image and text positions',
    category: 'features',
    thumbnail: '/templates/features-alternating.png',
    tags: ['alternating', 'image', 'detailed'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {
      '$primary': 'primary',
    },
    textTokens: {
      '$title': 'Powerful Analytics',
      '$description': 'Get real-time insights into your business performance with our comprehensive analytics dashboard. Track metrics that matter, identify trends, and make data-driven decisions.',
      '$cta': 'Learn More',
    },
    components: [
      {
        id: 'feature-alt-section',
        type: 'Section',
        props: {
          backgroundColor: '#FFFFFF',
          padding: { mobile: '64px 24px', desktop: '96px 64px' },
        },
        children: ['feature-alt-grid'],
      },
      {
        id: 'feature-alt-grid',
        type: 'Columns',
        props: {
          columns: { mobile: 1, desktop: 2 },
          gap: { mobile: '32px', desktop: '64px' },
          alignItems: 'center',
        },
        parentId: 'feature-alt-section',
        children: ['feature-alt-image', 'feature-alt-content'],
      },
      {
        id: 'feature-alt-image',
        type: 'Image',
        props: {
          src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
          alt: 'Analytics dashboard',
          borderRadius: '12px',
        },
        parentId: 'feature-alt-grid',
      },
      {
        id: 'feature-alt-content',
        type: 'Container',
        props: {},
        parentId: 'feature-alt-grid',
        children: ['feature-alt-title', 'feature-alt-desc', 'feature-alt-btn'],
      },
      {
        id: 'feature-alt-title',
        type: 'Heading',
        props: {
          text: '$title',
          level: 'h2',
          fontSize: { mobile: '28px', desktop: '36px' },
          fontWeight: 'bold',
          marginBottom: '16px',
        },
        parentId: 'feature-alt-content',
      },
      {
        id: 'feature-alt-desc',
        type: 'Text',
        props: {
          text: '$description',
          fontSize: { mobile: '16px', desktop: '18px' },
          color: '#64748B',
          marginBottom: '24px',
          lineHeight: '1.7',
        },
        parentId: 'feature-alt-content',
      },
      {
        id: 'feature-alt-btn',
        type: 'Button',
        props: {
          text: '$cta',
          variant: 'outline',
          size: 'md',
          borderColor: '$primary',
          textColor: '$primary',
        },
        parentId: 'feature-alt-content',
      },
    ],
  },

  // ========== PRICING SECTION ==========
  {
    id: 'pricing-three-tier',
    name: 'Pricing - Three Tier',
    description: 'Classic three-tier pricing table with featured plan',
    category: 'pricing',
    thumbnail: '/templates/pricing-three-tier.png',
    tags: ['three-tier', 'popular', 'comparison'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {
      '$primary': 'primary',
    },
    textTokens: {
      '$title': 'Simple, Transparent Pricing',
      '$subtitle': 'Choose the plan that works best for your business',
    },
    components: [
      {
        id: 'pricing-section',
        type: 'Section',
        props: {
          backgroundColor: '#FFFFFF',
          padding: { mobile: '64px 24px', desktop: '96px 64px' },
        },
        children: ['pricing-container'],
      },
      {
        id: 'pricing-container',
        type: 'Container',
        props: {
          maxWidth: '1200px',
        },
        parentId: 'pricing-section',
        children: ['pricing-header', 'pricing-grid'],
      },
      {
        id: 'pricing-header',
        type: 'Container',
        props: {
          textAlign: { mobile: 'center' },
          marginBottom: { mobile: '48px', desktop: '64px' },
        },
        parentId: 'pricing-container',
        children: ['pricing-title', 'pricing-subtitle'],
      },
      {
        id: 'pricing-title',
        type: 'Heading',
        props: {
          text: '$title',
          level: 'h2',
          fontSize: { mobile: '28px', desktop: '36px' },
          fontWeight: 'bold',
          marginBottom: '16px',
        },
        parentId: 'pricing-header',
      },
      {
        id: 'pricing-subtitle',
        type: 'Text',
        props: {
          text: '$subtitle',
          fontSize: { mobile: '16px', desktop: '18px' },
          color: '#64748B',
        },
        parentId: 'pricing-header',
      },
      {
        id: 'pricing-grid',
        type: 'Columns',
        props: {
          columns: { mobile: 1, tablet: 3 },
          gap: { mobile: '24px', desktop: '32px' },
        },
        parentId: 'pricing-container',
        children: ['pricing-starter', 'pricing-pro', 'pricing-enterprise'],
      },
      {
        id: 'pricing-starter',
        type: 'Container',
        props: {
          backgroundColor: '#F8FAFC',
          padding: '32px',
          borderRadius: '16px',
          textAlign: 'center',
        },
        parentId: 'pricing-grid',
        children: ['starter-name', 'starter-price', 'starter-desc', 'starter-features', 'starter-btn'],
      },
      {
        id: 'starter-name',
        type: 'Heading',
        props: { text: 'Starter', level: 'h3', fontSize: '20px', marginBottom: '16px' },
        parentId: 'pricing-starter',
      },
      {
        id: 'starter-price',
        type: 'Heading',
        props: { text: '$29/mo', level: 'h2', fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' },
        parentId: 'pricing-starter',
      },
      {
        id: 'starter-desc',
        type: 'Text',
        props: { text: 'Perfect for small teams', fontSize: '14px', color: '#64748B', marginBottom: '24px' },
        parentId: 'pricing-starter',
      },
      {
        id: 'starter-features',
        type: 'Text',
        props: {
          text: '✓ Up to 5 users\n✓ 10GB storage\n✓ Basic analytics\n✓ Email support',
          fontSize: '14px',
          whiteSpace: 'pre-line',
          textAlign: 'left',
          marginBottom: '24px',
        },
        parentId: 'pricing-starter',
      },
      {
        id: 'starter-btn',
        type: 'Button',
        props: { text: 'Get Started', variant: 'outline', size: 'lg', fullWidth: true },
        parentId: 'pricing-starter',
      },
      {
        id: 'pricing-pro',
        type: 'Container',
        props: {
          backgroundColor: '$primary',
          padding: '32px',
          borderRadius: '16px',
          textAlign: 'center',
          transform: { desktop: 'scale(1.05)' },
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        },
        parentId: 'pricing-grid',
        children: ['pro-badge', 'pro-name', 'pro-price', 'pro-desc', 'pro-features', 'pro-btn'],
      },
      {
        id: 'pro-badge',
        type: 'Text',
        props: {
          text: 'MOST POPULAR',
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'rgba(255,255,255,0.8)',
          marginBottom: '16px',
          letterSpacing: '1px',
        },
        parentId: 'pricing-pro',
      },
      {
        id: 'pro-name',
        type: 'Heading',
        props: { text: 'Professional', level: 'h3', fontSize: '20px', color: '#FFFFFF', marginBottom: '16px' },
        parentId: 'pricing-pro',
      },
      {
        id: 'pro-price',
        type: 'Heading',
        props: { text: '$79/mo', level: 'h2', fontSize: '48px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' },
        parentId: 'pricing-pro',
      },
      {
        id: 'pro-desc',
        type: 'Text',
        props: { text: 'Best for growing businesses', fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '24px' },
        parentId: 'pricing-pro',
      },
      {
        id: 'pro-features',
        type: 'Text',
        props: {
          text: '✓ Unlimited users\n✓ 100GB storage\n✓ Advanced analytics\n✓ Priority support\n✓ API access',
          fontSize: '14px',
          color: '#FFFFFF',
          whiteSpace: 'pre-line',
          textAlign: 'left',
          marginBottom: '24px',
        },
        parentId: 'pricing-pro',
      },
      {
        id: 'pro-btn',
        type: 'Button',
        props: { text: 'Get Started', variant: 'solid', size: 'lg', fullWidth: true, backgroundColor: '#FFFFFF', textColor: '$primary' },
        parentId: 'pricing-pro',
      },
      {
        id: 'pricing-enterprise',
        type: 'Container',
        props: {
          backgroundColor: '#F8FAFC',
          padding: '32px',
          borderRadius: '16px',
          textAlign: 'center',
        },
        parentId: 'pricing-grid',
        children: ['ent-name', 'ent-price', 'ent-desc', 'ent-features', 'ent-btn'],
      },
      {
        id: 'ent-name',
        type: 'Heading',
        props: { text: 'Enterprise', level: 'h3', fontSize: '20px', marginBottom: '16px' },
        parentId: 'pricing-enterprise',
      },
      {
        id: 'ent-price',
        type: 'Heading',
        props: { text: 'Custom', level: 'h2', fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' },
        parentId: 'pricing-enterprise',
      },
      {
        id: 'ent-desc',
        type: 'Text',
        props: { text: 'For large organizations', fontSize: '14px', color: '#64748B', marginBottom: '24px' },
        parentId: 'pricing-enterprise',
      },
      {
        id: 'ent-features',
        type: 'Text',
        props: {
          text: '✓ Everything in Pro\n✓ Unlimited storage\n✓ Custom integrations\n✓ Dedicated support\n✓ SLA guarantee',
          fontSize: '14px',
          whiteSpace: 'pre-line',
          textAlign: 'left',
          marginBottom: '24px',
        },
        parentId: 'pricing-enterprise',
      },
      {
        id: 'ent-btn',
        type: 'Button',
        props: { text: 'Contact Sales', variant: 'outline', size: 'lg', fullWidth: true },
        parentId: 'pricing-enterprise',
      },
    ],
  },

  // ========== TESTIMONIALS SECTION ==========
  {
    id: 'testimonials-cards',
    name: 'Testimonials - Card Grid',
    description: 'Customer testimonials in a card grid layout',
    category: 'testimonials',
    thumbnail: '/templates/testimonials-cards.png',
    tags: ['cards', 'grid', 'reviews'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {
      '$primary': 'primary',
    },
    textTokens: {
      '$title': 'Loved by Thousands',
      '$subtitle': 'See what our customers are saying about us',
    },
    components: [
      {
        id: 'testimonials-section',
        type: 'Section',
        props: {
          backgroundColor: '#F8FAFC',
          padding: { mobile: '64px 24px', desktop: '96px 64px' },
        },
        children: ['testimonials-container'],
      },
      {
        id: 'testimonials-container',
        type: 'Container',
        props: { maxWidth: '1200px' },
        parentId: 'testimonials-section',
        children: ['testimonials-header', 'testimonials-grid'],
      },
      {
        id: 'testimonials-header',
        type: 'Container',
        props: { textAlign: 'center', marginBottom: { mobile: '48px', desktop: '64px' } },
        parentId: 'testimonials-container',
        children: ['testimonials-title', 'testimonials-subtitle'],
      },
      {
        id: 'testimonials-title',
        type: 'Heading',
        props: { text: '$title', level: 'h2', fontSize: { mobile: '28px', desktop: '36px' }, marginBottom: '16px' },
        parentId: 'testimonials-header',
      },
      {
        id: 'testimonials-subtitle',
        type: 'Text',
        props: { text: '$subtitle', fontSize: '18px', color: '#64748B' },
        parentId: 'testimonials-header',
      },
      {
        id: 'testimonials-grid',
        type: 'Columns',
        props: { columns: { mobile: 1, tablet: 2, desktop: 3 }, gap: '24px' },
        parentId: 'testimonials-container',
        children: ['testimonial-1', 'testimonial-2', 'testimonial-3'],
      },
      {
        id: 'testimonial-1',
        type: 'Container',
        props: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px' },
        parentId: 'testimonials-grid',
        children: ['t1-quote', 't1-author'],
      },
      {
        id: 't1-quote',
        type: 'Text',
        props: {
          text: '"This platform has completely transformed how we manage our business. The automation features alone have saved us 20+ hours per week."',
          fontSize: '16px',
          fontStyle: 'italic',
          marginBottom: '16px',
          lineHeight: '1.6',
        },
        parentId: 'testimonial-1',
      },
      {
        id: 't1-author',
        type: 'Text',
        props: { text: '— Sarah Johnson, CEO at TechStart', fontSize: '14px', fontWeight: 'semibold' },
        parentId: 'testimonial-1',
      },
      {
        id: 'testimonial-2',
        type: 'Container',
        props: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px' },
        parentId: 'testimonials-grid',
        children: ['t2-quote', 't2-author'],
      },
      {
        id: 't2-quote',
        type: 'Text',
        props: {
          text: '"The customer support is incredible. Any time I\'ve had a question, they\'ve responded within minutes with helpful solutions."',
          fontSize: '16px',
          fontStyle: 'italic',
          marginBottom: '16px',
          lineHeight: '1.6',
        },
        parentId: 'testimonial-2',
      },
      {
        id: 't2-author',
        type: 'Text',
        props: { text: '— Michael Chen, Founder at DevLab', fontSize: '14px', fontWeight: 'semibold' },
        parentId: 'testimonial-2',
      },
      {
        id: 'testimonial-3',
        type: 'Container',
        props: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px' },
        parentId: 'testimonials-grid',
        children: ['t3-quote', 't3-author'],
      },
      {
        id: 't3-quote',
        type: 'Text',
        props: {
          text: '"We\'ve tried many solutions, but nothing comes close to the flexibility and power of this platform. Highly recommended!"',
          fontSize: '16px',
          fontStyle: 'italic',
          marginBottom: '16px',
          lineHeight: '1.6',
        },
        parentId: 'testimonial-3',
      },
      {
        id: 't3-author',
        type: 'Text',
        props: { text: '— Emily Parker, Marketing Director', fontSize: '14px', fontWeight: 'semibold' },
        parentId: 'testimonial-3',
      },
    ],
  },

  // ========== CTA SECTIONS ==========
  {
    id: 'cta-centered',
    name: 'CTA - Centered',
    description: 'Simple centered call-to-action section',
    category: 'cta',
    thumbnail: '/templates/cta-centered.png',
    tags: ['centered', 'simple', 'conversion'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {
      '$primary': 'primary',
    },
    textTokens: {
      '$title': 'Ready to Get Started?',
      '$subtitle': 'Join thousands of businesses already using our platform.',
      '$cta': 'Start Your Free Trial',
    },
    components: [
      {
        id: 'cta-section',
        type: 'Section',
        props: {
          backgroundColor: '$primary',
          padding: { mobile: '64px 24px', desktop: '96px 64px' },
        },
        children: ['cta-container'],
      },
      {
        id: 'cta-container',
        type: 'Container',
        props: { maxWidth: '600px', textAlign: 'center' },
        parentId: 'cta-section',
        children: ['cta-title', 'cta-subtitle', 'cta-button'],
      },
      {
        id: 'cta-title',
        type: 'Heading',
        props: {
          text: '$title',
          level: 'h2',
          fontSize: { mobile: '28px', desktop: '36px' },
          color: '#FFFFFF',
          marginBottom: '16px',
        },
        parentId: 'cta-container',
      },
      {
        id: 'cta-subtitle',
        type: 'Text',
        props: {
          text: '$subtitle',
          fontSize: '18px',
          color: 'rgba(255,255,255,0.9)',
          marginBottom: '32px',
        },
        parentId: 'cta-container',
      },
      {
        id: 'cta-button',
        type: 'Button',
        props: {
          text: '$cta',
          variant: 'solid',
          size: 'lg',
          backgroundColor: '#FFFFFF',
          textColor: '$primary',
        },
        parentId: 'cta-container',
      },
    ],
  },
  {
    id: 'cta-with-image',
    name: 'CTA - With Image',
    description: 'Call-to-action with background image',
    category: 'cta',
    thumbnail: '/templates/cta-with-image.png',
    tags: ['image', 'background', 'overlay'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {},
    textTokens: {
      '$title': 'Transform Your Business Today',
      '$subtitle': 'Get the tools you need to succeed in the digital age.',
      '$cta': 'Get Started Now',
    },
    components: [
      {
        id: 'cta-img-section',
        type: 'Section',
        props: {
          backgroundImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: { mobile: '80px 24px', desktop: '120px 64px' },
          position: 'relative',
        },
        children: ['cta-img-overlay', 'cta-img-content'],
      },
      {
        id: 'cta-img-overlay',
        type: 'Container',
        props: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
        },
        parentId: 'cta-img-section',
      },
      {
        id: 'cta-img-content',
        type: 'Container',
        props: { maxWidth: '700px', textAlign: 'center', position: 'relative', zIndex: 1 },
        parentId: 'cta-img-section',
        children: ['cta-img-title', 'cta-img-subtitle', 'cta-img-button'],
      },
      {
        id: 'cta-img-title',
        type: 'Heading',
        props: {
          text: '$title',
          level: 'h2',
          fontSize: { mobile: '32px', desktop: '48px' },
          color: '#FFFFFF',
          marginBottom: '16px',
        },
        parentId: 'cta-img-content',
      },
      {
        id: 'cta-img-subtitle',
        type: 'Text',
        props: {
          text: '$subtitle',
          fontSize: '18px',
          color: 'rgba(255,255,255,0.9)',
          marginBottom: '32px',
        },
        parentId: 'cta-img-content',
      },
      {
        id: 'cta-img-button',
        type: 'Button',
        props: {
          text: '$cta',
          variant: 'solid',
          size: 'lg',
          backgroundColor: '#FFFFFF',
          textColor: '#0F172A',
        },
        parentId: 'cta-img-content',
      },
    ],
  },

  // ========== TEAM SECTION ==========
  {
    id: 'team-grid',
    name: 'Team - Grid Layout',
    description: 'Team members displayed in a grid with photos and titles',
    category: 'team',
    thumbnail: '/templates/team-grid.png',
    tags: ['grid', 'photos', 'bios'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {},
    textTokens: {
      '$title': 'Meet Our Team',
      '$subtitle': 'The talented people behind our success',
    },
    components: [
      {
        id: 'team-section',
        type: 'Section',
        props: {
          backgroundColor: '#FFFFFF',
          padding: { mobile: '64px 24px', desktop: '96px 64px' },
        },
        children: ['team-container'],
      },
      {
        id: 'team-container',
        type: 'Container',
        props: { maxWidth: '1000px' },
        parentId: 'team-section',
        children: ['team-header', 'team-grid'],
      },
      {
        id: 'team-header',
        type: 'Container',
        props: { textAlign: 'center', marginBottom: '48px' },
        parentId: 'team-container',
        children: ['team-title', 'team-subtitle'],
      },
      {
        id: 'team-title',
        type: 'Heading',
        props: { text: '$title', level: 'h2', fontSize: { mobile: '28px', desktop: '36px' }, marginBottom: '16px' },
        parentId: 'team-header',
      },
      {
        id: 'team-subtitle',
        type: 'Text',
        props: { text: '$subtitle', fontSize: '18px', color: '#64748B' },
        parentId: 'team-header',
      },
      {
        id: 'team-grid',
        type: 'Columns',
        props: { columns: { mobile: 2, desktop: 4 }, gap: '24px' },
        parentId: 'team-container',
        children: ['member-1', 'member-2', 'member-3', 'member-4'],
      },
      {
        id: 'member-1',
        type: 'Container',
        props: { textAlign: 'center' },
        parentId: 'team-grid',
        children: ['m1-img', 'm1-name', 'm1-role'],
      },
      {
        id: 'm1-img',
        type: 'Image',
        props: {
          src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
          alt: 'Team member',
          borderRadius: '50%',
          aspectRatio: '1/1',
          marginBottom: '16px',
        },
        parentId: 'member-1',
      },
      {
        id: 'm1-name',
        type: 'Heading',
        props: { text: 'Sarah Johnson', level: 'h4', fontSize: '18px', marginBottom: '4px' },
        parentId: 'member-1',
      },
      {
        id: 'm1-role',
        type: 'Text',
        props: { text: 'CEO & Founder', fontSize: '14px', color: '#64748B' },
        parentId: 'member-1',
      },
      {
        id: 'member-2',
        type: 'Container',
        props: { textAlign: 'center' },
        parentId: 'team-grid',
        children: ['m2-img', 'm2-name', 'm2-role'],
      },
      {
        id: 'm2-img',
        type: 'Image',
        props: {
          src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
          alt: 'Team member',
          borderRadius: '50%',
          aspectRatio: '1/1',
          marginBottom: '16px',
        },
        parentId: 'member-2',
      },
      {
        id: 'm2-name',
        type: 'Heading',
        props: { text: 'Michael Chen', level: 'h4', fontSize: '18px', marginBottom: '4px' },
        parentId: 'member-2',
      },
      {
        id: 'm2-role',
        type: 'Text',
        props: { text: 'CTO', fontSize: '14px', color: '#64748B' },
        parentId: 'member-2',
      },
      {
        id: 'member-3',
        type: 'Container',
        props: { textAlign: 'center' },
        parentId: 'team-grid',
        children: ['m3-img', 'm3-name', 'm3-role'],
      },
      {
        id: 'm3-img',
        type: 'Image',
        props: {
          src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
          alt: 'Team member',
          borderRadius: '50%',
          aspectRatio: '1/1',
          marginBottom: '16px',
        },
        parentId: 'member-3',
      },
      {
        id: 'm3-name',
        type: 'Heading',
        props: { text: 'Emily Parker', level: 'h4', fontSize: '18px', marginBottom: '4px' },
        parentId: 'member-3',
      },
      {
        id: 'm3-role',
        type: 'Text',
        props: { text: 'Head of Design', fontSize: '14px', color: '#64748B' },
        parentId: 'member-3',
      },
      {
        id: 'member-4',
        type: 'Container',
        props: { textAlign: 'center' },
        parentId: 'team-grid',
        children: ['m4-img', 'm4-name', 'm4-role'],
      },
      {
        id: 'm4-img',
        type: 'Image',
        props: {
          src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
          alt: 'Team member',
          borderRadius: '50%',
          aspectRatio: '1/1',
          marginBottom: '16px',
        },
        parentId: 'member-4',
      },
      {
        id: 'm4-name',
        type: 'Heading',
        props: { text: 'David Smith', level: 'h4', fontSize: '18px', marginBottom: '4px' },
        parentId: 'member-4',
      },
      {
        id: 'm4-role',
        type: 'Text',
        props: { text: 'Lead Developer', fontSize: '14px', color: '#64748B' },
        parentId: 'member-4',
      },
    ],
  },

  // ========== FAQ SECTION ==========
  {
    id: 'faq-accordion',
    name: 'FAQ - Accordion',
    description: 'Frequently asked questions with expandable answers',
    category: 'faq',
    thumbnail: '/templates/faq-accordion.png',
    tags: ['accordion', 'expandable', 'questions'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {},
    textTokens: {
      '$title': 'Frequently Asked Questions',
      '$subtitle': 'Find answers to common questions about our platform',
    },
    components: [
      {
        id: 'faq-section',
        type: 'Section',
        props: {
          backgroundColor: '#F8FAFC',
          padding: { mobile: '64px 24px', desktop: '96px 64px' },
        },
        children: ['faq-container'],
      },
      {
        id: 'faq-container',
        type: 'Container',
        props: { maxWidth: '800px' },
        parentId: 'faq-section',
        children: ['faq-header', 'faq-list'],
      },
      {
        id: 'faq-header',
        type: 'Container',
        props: { textAlign: 'center', marginBottom: '48px' },
        parentId: 'faq-container',
        children: ['faq-title', 'faq-subtitle'],
      },
      {
        id: 'faq-title',
        type: 'Heading',
        props: { text: '$title', level: 'h2', fontSize: { mobile: '28px', desktop: '36px' }, marginBottom: '16px' },
        parentId: 'faq-header',
      },
      {
        id: 'faq-subtitle',
        type: 'Text',
        props: { text: '$subtitle', fontSize: '18px', color: '#64748B' },
        parentId: 'faq-header',
      },
      {
        id: 'faq-list',
        type: 'Accordion',
        props: {
          items: [
            { title: 'How does the free trial work?', content: 'You get full access to all features for 14 days. No credit card required. Cancel anytime.' },
            { title: 'Can I cancel my subscription?', content: 'Yes, you can cancel at any time. Your subscription will remain active until the end of your billing period.' },
            { title: 'Do you offer refunds?', content: 'We offer a 30-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.' },
            { title: 'What payment methods do you accept?', content: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.' },
            { title: 'Is my data secure?', content: 'Yes, we use industry-standard encryption and security practices to protect your data. We are SOC 2 certified.' },
          ],
        },
        parentId: 'faq-container',
      },
    ],
  },

  // ========== CONTACT SECTION ==========
  {
    id: 'contact-split',
    name: 'Contact - Split Layout',
    description: 'Contact form with info section',
    category: 'contact',
    thumbnail: '/templates/contact-split.png',
    tags: ['form', 'split', 'info'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {
      '$primary': 'primary',
    },
    textTokens: {
      '$title': 'Get in Touch',
      '$subtitle': 'Have a question? We\'d love to hear from you.',
    },
    components: [
      {
        id: 'contact-section',
        type: 'Section',
        props: {
          backgroundColor: '#FFFFFF',
          padding: { mobile: '64px 24px', desktop: '96px 64px' },
        },
        children: ['contact-container'],
      },
      {
        id: 'contact-container',
        type: 'Container',
        props: { maxWidth: '1000px' },
        parentId: 'contact-section',
        children: ['contact-header', 'contact-grid'],
      },
      {
        id: 'contact-header',
        type: 'Container',
        props: { textAlign: 'center', marginBottom: '48px' },
        parentId: 'contact-container',
        children: ['contact-title', 'contact-subtitle'],
      },
      {
        id: 'contact-title',
        type: 'Heading',
        props: { text: '$title', level: 'h2', fontSize: { mobile: '28px', desktop: '36px' }, marginBottom: '16px' },
        parentId: 'contact-header',
      },
      {
        id: 'contact-subtitle',
        type: 'Text',
        props: { text: '$subtitle', fontSize: '18px', color: '#64748B' },
        parentId: 'contact-header',
      },
      {
        id: 'contact-grid',
        type: 'Columns',
        props: { columns: { mobile: 1, desktop: 2 }, gap: '48px' },
        parentId: 'contact-container',
        children: ['contact-info', 'contact-form'],
      },
      {
        id: 'contact-info',
        type: 'Container',
        props: {},
        parentId: 'contact-grid',
        children: ['info-email', 'info-phone', 'info-address'],
      },
      {
        id: 'info-email',
        type: 'Container',
        props: { marginBottom: '24px' },
        parentId: 'contact-info',
        children: ['email-label', 'email-value'],
      },
      {
        id: 'email-label',
        type: 'Heading',
        props: { text: 'Email', level: 'h4', fontSize: '14px', fontWeight: 'semibold', marginBottom: '4px' },
        parentId: 'info-email',
      },
      {
        id: 'email-value',
        type: 'Text',
        props: { text: 'hello@company.com', fontSize: '16px', color: '#64748B' },
        parentId: 'info-email',
      },
      {
        id: 'info-phone',
        type: 'Container',
        props: { marginBottom: '24px' },
        parentId: 'contact-info',
        children: ['phone-label', 'phone-value'],
      },
      {
        id: 'phone-label',
        type: 'Heading',
        props: { text: 'Phone', level: 'h4', fontSize: '14px', fontWeight: 'semibold', marginBottom: '4px' },
        parentId: 'info-phone',
      },
      {
        id: 'phone-value',
        type: 'Text',
        props: { text: '+1 (555) 123-4567', fontSize: '16px', color: '#64748B' },
        parentId: 'info-phone',
      },
      {
        id: 'info-address',
        type: 'Container',
        props: {},
        parentId: 'contact-info',
        children: ['address-label', 'address-value'],
      },
      {
        id: 'address-label',
        type: 'Heading',
        props: { text: 'Office', level: 'h4', fontSize: '14px', fontWeight: 'semibold', marginBottom: '4px' },
        parentId: 'info-address',
      },
      {
        id: 'address-value',
        type: 'Text',
        props: { text: '123 Business Ave\nSuite 100\nSan Francisco, CA 94105', fontSize: '16px', color: '#64748B', whiteSpace: 'pre-line' },
        parentId: 'info-address',
      },
      {
        id: 'contact-form',
        type: 'Form',
        props: {
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'message', label: 'Message', type: 'textarea', rows: 4, required: true },
          ],
          submitText: 'Send Message',
          submitButtonProps: { backgroundColor: '$primary' },
        },
        parentId: 'contact-grid',
      },
    ],
  },

  // ========== FOOTER SECTION ==========
  {
    id: 'footer-multi-column',
    name: 'Footer - Multi Column',
    description: 'Multi-column footer with links and social icons',
    category: 'footer',
    thumbnail: '/templates/footer-multi-column.png',
    tags: ['multi-column', 'links', 'social'],
    isPremium: false,
    version: '1.0.0',
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
    colorTokens: {},
    textTokens: {
      '$company': 'Company Name',
      '$tagline': 'Building the future of digital business.',
    },
    components: [
      {
        id: 'footer-section',
        type: 'Section',
        props: {
          backgroundColor: '#0F172A',
          padding: { mobile: '48px 24px', desktop: '64px 64px' },
        },
        children: ['footer-container'],
      },
      {
        id: 'footer-container',
        type: 'Container',
        props: { maxWidth: '1200px' },
        parentId: 'footer-section',
        children: ['footer-grid', 'footer-bottom'],
      },
      {
        id: 'footer-grid',
        type: 'Columns',
        props: { columns: { mobile: 2, desktop: 4 }, gap: '32px', marginBottom: '48px' },
        parentId: 'footer-container',
        children: ['footer-brand', 'footer-product', 'footer-company', 'footer-legal'],
      },
      {
        id: 'footer-brand',
        type: 'Container',
        props: {},
        parentId: 'footer-grid',
        children: ['brand-name', 'brand-tagline'],
      },
      {
        id: 'brand-name',
        type: 'Heading',
        props: { text: '$company', level: 'h4', fontSize: '18px', color: '#FFFFFF', marginBottom: '8px' },
        parentId: 'footer-brand',
      },
      {
        id: 'brand-tagline',
        type: 'Text',
        props: { text: '$tagline', fontSize: '14px', color: '#94A3B8' },
        parentId: 'footer-brand',
      },
      {
        id: 'footer-product',
        type: 'Container',
        props: {},
        parentId: 'footer-grid',
        children: ['product-title', 'product-links'],
      },
      {
        id: 'product-title',
        type: 'Heading',
        props: { text: 'Product', level: 'h5', fontSize: '14px', fontWeight: 'semibold', color: '#FFFFFF', marginBottom: '16px' },
        parentId: 'footer-product',
      },
      {
        id: 'product-links',
        type: 'Text',
        props: { text: 'Features\nPricing\nIntegrations\nAPI', fontSize: '14px', color: '#94A3B8', whiteSpace: 'pre-line', lineHeight: '2' },
        parentId: 'footer-product',
      },
      {
        id: 'footer-company',
        type: 'Container',
        props: {},
        parentId: 'footer-grid',
        children: ['company-title', 'company-links'],
      },
      {
        id: 'company-title',
        type: 'Heading',
        props: { text: 'Company', level: 'h5', fontSize: '14px', fontWeight: 'semibold', color: '#FFFFFF', marginBottom: '16px' },
        parentId: 'footer-company',
      },
      {
        id: 'company-links',
        type: 'Text',
        props: { text: 'About\nBlog\nCareers\nContact', fontSize: '14px', color: '#94A3B8', whiteSpace: 'pre-line', lineHeight: '2' },
        parentId: 'footer-company',
      },
      {
        id: 'footer-legal',
        type: 'Container',
        props: {},
        parentId: 'footer-grid',
        children: ['legal-title', 'legal-links'],
      },
      {
        id: 'legal-title',
        type: 'Heading',
        props: { text: 'Legal', level: 'h5', fontSize: '14px', fontWeight: 'semibold', color: '#FFFFFF', marginBottom: '16px' },
        parentId: 'footer-legal',
      },
      {
        id: 'legal-links',
        type: 'Text',
        props: { text: 'Privacy\nTerms\nCookies\nLicenses', fontSize: '14px', color: '#94A3B8', whiteSpace: 'pre-line', lineHeight: '2' },
        parentId: 'footer-legal',
      },
      {
        id: 'footer-bottom',
        type: 'Container',
        props: {
          borderTop: '1px solid #1E293B',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { mobile: 'center' },
          flexDirection: { mobile: 'column', desktop: 'row' },
          gap: '16px',
        },
        parentId: 'footer-container',
        children: ['copyright'],
      },
      {
        id: 'copyright',
        type: 'Text',
        props: { text: '© 2026 Company Name. All rights reserved.', fontSize: '14px', color: '#64748B' },
        parentId: 'footer-bottom',
      },
    ],
  },
];

// Export template count for display
export const TEMPLATE_COUNT = STARTER_TEMPLATES.length;
```

**Acceptance Criteria:**
- [ ] At least 12 templates created
- [ ] All major categories covered
- [ ] Templates use color and text tokens
- [ ] Components are properly nested

---

### Task 5: Template Browser Component

**Description:** Create the template browser dialog UI.

**Files:**
- CREATE: `src/components/studio/features/template-browser.tsx`

**Code:**

```typescript
// src/components/studio/features/template-browser.tsx

'use client';

import { useEffect, useState } from 'react';
import { Search, LayoutTemplate, X, Star, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTemplateStore, useFilteredTemplates } from '@/lib/studio/store/template-store';
import type {
  SectionTemplate,
  TemplateCategory,
  TemplateCategoryInfo,
  TemplateBrowserProps,
} from '@/types/studio-templates';
import { TEMPLATE_CATEGORIES } from '@/types/studio-templates';

// Category icons mapping
const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  hero: '🦸',
  features: '✨',
  pricing: '💰',
  testimonials: '💬',
  cta: '⚡',
  team: '👥',
  faq: '❓',
  contact: '📧',
  footer: '📋',
  gallery: '🖼️',
  stats: '📊',
  newsletter: '📰',
};

export function TemplateBrowser({ isOpen, onClose, onInsert, insertPosition = 'bottom' }: TemplateBrowserProps) {
  const {
    categories,
    selectedCategory,
    searchQuery,
    isLoading,
    fetchTemplates,
    setCategory,
    setSearchQuery,
  } = useTemplateStore();
  
  const filteredTemplates = useFilteredTemplates();
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, fetchTemplates]);

  // Reset filters when closing
  useEffect(() => {
    if (!isOpen) {
      setCategory('all');
      setSearchQuery('');
    }
  }, [isOpen, setCategory, setSearchQuery]);

  const handleInsert = (template: SectionTemplate) => {
    onInsert(template, insertPosition);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" />
            Insert Section
          </DialogTitle>
          <DialogDescription>
            Choose a pre-designed section template to add to your page
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Categories */}
          <div className="w-56 border-r p-4 flex-shrink-0">
            <CategoryList
              categories={categories}
              selected={selectedCategory}
              onSelect={setCategory}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Template Grid */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <LayoutTemplate className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No templates found</p>
                  <p className="text-sm text-muted-foreground">
                    Try a different search term or category
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isHovered={hoveredTemplate === template.id}
                      onHover={() => setHoveredTemplate(template.id)}
                      onLeave={() => setHoveredTemplate(null)}
                      onSelect={() => handleInsert(template)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Category List Component
interface CategoryListProps {
  categories: TemplateCategoryInfo[];
  selected: TemplateCategory | 'all';
  onSelect: (category: TemplateCategory | 'all') => void;
}

function CategoryList({ categories, selected, onSelect }: CategoryListProps) {
  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelect('all')}
        className={cn(
          'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
          selected === 'all'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted'
        )}
      >
        All Templates
      </button>
      
      <div className="h-px bg-border my-2" />
      
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2',
            selected === category.id
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          )}
        >
          <span>{CATEGORY_ICONS[category.id]}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: SectionTemplate;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
}

function TemplateCard({
  template,
  isHovered,
  onHover,
  onLeave,
  onSelect,
}: TemplateCardProps) {
  return (
    <div
      className={cn(
        'group cursor-pointer border rounded-lg overflow-hidden transition-all',
        isHovered ? 'border-primary shadow-lg scale-[1.02]' : 'hover:border-primary/50'
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-muted">
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <LayoutTemplate className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Premium Badge */}
        {template.isPremium && (
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500">
            <Star className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        )}

        {/* Hover Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Button variant="secondary" size="sm">
            Insert Section
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="font-medium text-sm truncate">{template.name}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {template.description}
        </p>
        
        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TemplateBrowser;
```

**Acceptance Criteria:**
- [ ] Dialog opens and closes properly
- [ ] Categories filter templates
- [ ] Search filters by name, description, tags
- [ ] Hover shows insert button
- [ ] Click inserts template
- [ ] Premium badge shown for Pro templates

---

### Task 6: Integration with Editor

**Description:** Integrate template browser with toolbar and editor store.

**Files:**
- MODIFY: `src/components/studio/layout/studio-toolbar.tsx`
- MODIFY: `src/lib/studio/store/editor-store.ts`

**Code:**

```typescript
// Add to studio-toolbar.tsx - Add Section button
import { useState } from 'react';
import { Plus, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplateBrowser } from '../features/template-browser';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { prepareTemplateForInsertion, DEFAULT_SITE_COLORS } from '@/lib/studio/utils/template-utils';
import type { SectionTemplate, TemplateInsertPosition } from '@/types/studio-templates';

// In toolbar component:
export function StudioToolbar() {
  const [isTemplateBrowserOpen, setTemplateBrowserOpen] = useState(false);
  const { insertComponents, selectedComponentId, getSiteColors } = useEditorStore();

  const handleInsertTemplate = (template: SectionTemplate, position: TemplateInsertPosition) => {
    // Get site colors (or use defaults)
    const siteColors = getSiteColors() || DEFAULT_SITE_COLORS;
    
    // Prepare template components
    const components = prepareTemplateForInsertion(template, siteColors);
    
    // Insert into editor
    insertComponents(components, position, selectedComponentId);
  };

  return (
    <>
      {/* ... existing toolbar content ... */}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTemplateBrowserOpen(true)}
        className="gap-2"
      >
        <LayoutTemplate className="w-4 h-4" />
        Add Section
      </Button>
      
      {/* Template Browser Dialog */}
      <TemplateBrowser
        isOpen={isTemplateBrowserOpen}
        onClose={() => setTemplateBrowserOpen(false)}
        onInsert={handleInsertTemplate}
        insertPosition={selectedComponentId ? 'after-selected' : 'bottom'}
      />
    </>
  );
}
```

```typescript
// Add to editor-store.ts - insertComponents action
interface EditorStore {
  // ... existing state ...
  
  // Template insertion
  insertComponents: (
    components: StudioComponent[],
    position: 'top' | 'bottom' | 'after-selected',
    afterComponentId?: string | null
  ) => void;
  
  getSiteColors: () => SiteColorScheme | null;
}

// Implementation:
insertComponents: (components, position, afterComponentId) => {
  set((state) => {
    const newState = { ...state };
    
    // Add all components to the components record
    components.forEach(comp => {
      newState.data.components[comp.id] = comp;
    });
    
    // Get root components (no parentId)
    const rootComponents = components.filter(c => !c.parentId);
    const rootIds = rootComponents.map(c => c.id);
    
    // Insert root IDs into the page's children array
    const currentChildren = [...newState.data.root.children];
    
    if (position === 'top') {
      newState.data.root.children = [...rootIds, ...currentChildren];
    } else if (position === 'bottom') {
      newState.data.root.children = [...currentChildren, ...rootIds];
    } else if (position === 'after-selected' && afterComponentId) {
      const index = currentChildren.indexOf(afterComponentId);
      if (index !== -1) {
        currentChildren.splice(index + 1, 0, ...rootIds);
        newState.data.root.children = currentChildren;
      } else {
        // Fallback to bottom
        newState.data.root.children = [...currentChildren, ...rootIds];
      }
    } else {
      newState.data.root.children = [...currentChildren, ...rootIds];
    }
    
    return newState;
  });
},

getSiteColors: () => {
  // In a real implementation, fetch from site settings
  // For now, return null to use defaults
  return null;
},
```

**Acceptance Criteria:**
- [ ] "Add Section" button appears in toolbar
- [ ] Clicking opens template browser
- [ ] Selecting template inserts components
- [ ] Templates adapt to site colors
- [ ] Insert position respects selection

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | src/types/studio-templates.ts | Template type definitions |
| CREATE | src/lib/studio/store/template-store.ts | Zustand store for templates |
| CREATE | src/lib/studio/utils/template-utils.ts | Template processing utilities |
| CREATE | src/lib/studio/data/starter-templates.ts | 12+ starter templates |
| CREATE | src/components/studio/features/template-browser.tsx | Template browser dialog UI |
| MODIFY | src/components/studio/layout/studio-toolbar.tsx | Add "Add Section" button |
| MODIFY | src/lib/studio/store/editor-store.ts | Add insertComponents action |

## Testing Requirements

### Unit Tests
- [ ] Template cloning generates unique IDs
- [ ] Color token replacement works correctly
- [ ] Text token replacement works correctly
- [ ] ID references are updated after cloning
- [ ] Filter by category returns correct templates
- [ ] Search filters by name, description, tags

### Integration Tests
- [ ] Template browser opens from toolbar
- [ ] Template insertion adds components to page
- [ ] Inserted components render correctly
- [ ] Site colors are applied to templates

### Manual Testing
- [ ] All 12+ templates display correctly
- [ ] Category filtering works
- [ ] Search filtering works
- [ ] Premium badge shows on Pro templates
- [ ] Hover state shows insert button
- [ ] Template inserts at correct position
- [ ] Inserted section matches template design

## Dependencies to Install

```bash
# No new dependencies required
# Using existing: zustand, nanoid, radix-ui components
```

## Environment Variables

```env
# No new environment variables required
```

## Database Changes

```sql
-- Optional: For storing custom templates in database
CREATE TABLE IF NOT EXISTS studio_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  thumbnail TEXT,
  tags TEXT[] DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  components JSONB NOT NULL,
  color_tokens JSONB DEFAULT '{}',
  text_tokens JSONB DEFAULT '{}',
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for category filtering
CREATE INDEX idx_studio_templates_category ON studio_templates(category);

-- Enable RLS
ALTER TABLE studio_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read templates
CREATE POLICY "Templates are viewable by everyone"
  ON studio_templates FOR SELECT
  USING (true);

-- Policy: Only admins can modify templates
CREATE POLICY "Templates are modifiable by admins"
  ON studio_templates FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

## Rollback Plan

1. Remove the template browser button from toolbar
2. Delete new files:
   - `src/types/studio-templates.ts`
   - `src/lib/studio/store/template-store.ts`
   - `src/lib/studio/utils/template-utils.ts`
   - `src/lib/studio/data/starter-templates.ts`
   - `src/components/studio/features/template-browser.tsx`
3. Revert changes to `editor-store.ts` and `studio-toolbar.tsx`
4. Templates don't affect existing page data - no data migration needed

## Success Criteria

- [ ] Template browser opens from toolbar with "Add Section" button
- [ ] Can browse templates by category (12 categories)
- [ ] Can search templates by name, description, tags
- [ ] Clicking a template inserts it at the correct position
- [ ] Templates adapt colors based on site color scheme
- [ ] At least 12 starter templates available:
  - [ ] 2 Hero sections
  - [ ] 2 Features sections
  - [ ] 1 Pricing section
  - [ ] 1 Testimonials section
  - [ ] 2 CTA sections
  - [ ] 1 Team section
  - [ ] 1 FAQ section
  - [ ] 1 Contact section
  - [ ] 1 Footer section
- [ ] Premium badge displays on Pro templates
- [ ] No TypeScript errors
- [ ] Editor performance not degraded
