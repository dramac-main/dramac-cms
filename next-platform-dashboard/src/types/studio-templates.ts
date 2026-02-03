/**
 * DRAMAC Studio Template Types
 * 
 * Type definitions for section templates, template categories,
 * color/text tokens, and the template browser system.
 * 
 * Phase: STUDIO-24 Section Templates
 */

import type { StudioComponent } from './studio';

// =============================================================================
// TEMPLATE CATEGORY TYPES
// =============================================================================

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

// =============================================================================
// TOKEN TYPES
// =============================================================================

/**
 * Color token mapping - maps template tokens to site color keys
 */
export type ColorTokenMap = Record<string, string>;

/**
 * Text token mapping - placeholder texts in templates
 */
export type TextTokenMap = Record<string, string>;

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

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

// =============================================================================
// STORE TYPES
// =============================================================================

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

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Template browser props
 */
export interface TemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (template: SectionTemplate, position: TemplateInsertPosition) => void;
  insertPosition?: TemplateInsertPosition;
}

// =============================================================================
// CATEGORY ICONS
// =============================================================================

/**
 * Emoji icons for categories (used in UI)
 */
export const CATEGORY_ICONS: Record<TemplateCategory, string> = {
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
