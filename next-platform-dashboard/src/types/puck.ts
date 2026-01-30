/**
 * Puck Editor Type Definitions
 * 
 * Type definitions for Puck editor data structures used in DRAMAC CMS.
 * These types define the page content format stored in the database.
 */

import type { Data, ComponentData, Config, ComponentConfig } from "@puckeditor/core";

// Re-export Puck types for convenience
export type { Data as PuckData, ComponentData, Config as PuckConfig, ComponentConfig };

/**
 * Root props for Puck pages
 */
export interface PuckRootProps {
  title?: string;
  description?: string;
  backgroundColor?: string;
  padding?: number;
}

// Alias for backwards compatibility
export type RootProps = PuckRootProps;

/**
 * Extended Puck data with DRAMAC-specific fields
 */
export interface DramacPuckData extends Data {
  root: {
    props: PuckRootProps;
  };
  // Zones for nested content (like columns)
  zones?: Record<string, ComponentData[]>;
}

/**
 * Component category for organization in the toolbox
 */
export type ComponentCategory =
  | "layout"
  | "typography"
  | "buttons"
  | "media"
  | "sections"
  | "navigation"
  | "forms"
  | "ecommerce"
  | "interactive";

/**
 * Component metadata for registry
 */
export interface ComponentMeta {
  name: string;
  label: string;
  description: string;
  category: ComponentCategory;
  icon: string;
  tags?: string[];
}

/**
 * Registry entry combining component config and metadata
 */
export interface ComponentRegistryEntry {
  config: ComponentConfig;
  meta: ComponentMeta;
}

// ============================================
// Layout Component Props
// ============================================

export interface SectionProps {
  children?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  minHeight?: number;
}

export interface ContainerProps {
  children?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  backgroundColor?: string;
}

export interface ColumnsProps {
  columns?: number;
  gap?: "none" | "sm" | "md" | "lg";
  verticalAlign?: "top" | "center" | "bottom" | "stretch";
  reverseOnMobile?: boolean;
}

export interface CardProps {
  children?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  borderRadius?: "none" | "sm" | "md" | "lg";
  backgroundColor?: string;
  border?: boolean;
}

export interface SpacerProps {
  height?: number;
  mobileHeight?: number;
}

export interface DividerProps {
  color?: string;
  thickness?: number;
  style?: "solid" | "dashed" | "dotted";
  margin?: "none" | "sm" | "md" | "lg";
}

// ============================================
// Typography Component Props
// ============================================

export interface HeadingProps {
  text?: string;
  level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  alignment?: "left" | "center" | "right";
  color?: string;
}

export interface TextProps {
  text?: string;
  alignment?: "left" | "center" | "right" | "justify";
  color?: string;
  fontSize?: "sm" | "base" | "lg" | "xl";
}

// ============================================
// Button Component Props
// ============================================

export interface ButtonProps {
  text?: string;
  link?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  openInNewTab?: boolean;
}

// ============================================
// Media Component Props
// ============================================

export interface ImageProps {
  src?: string;
  alt?: string;
  width?: "auto" | "full" | "fixed";
  fixedWidth?: number;
  height?: "auto" | "fixed";
  fixedHeight?: number;
  objectFit?: "cover" | "contain" | "fill";
  borderRadius?: "none" | "sm" | "md" | "lg" | "full";
}

export interface VideoProps {
  url?: string;
  type?: "youtube" | "vimeo" | "file";
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  aspectRatio?: "16:9" | "4:3" | "1:1" | "9:16";
}

export interface MapProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
  height?: number;
  style?: "roadmap" | "satellite" | "hybrid" | "terrain";
}

// ============================================
// Section Component Props
// ============================================

export interface HeroProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  textColor?: string;
  alignment?: "left" | "center" | "right";
  minHeight?: number;
  overlay?: boolean;
  overlayOpacity?: number;
}

export interface FeaturesProps {
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  features?: Array<{
    icon?: string;
    title: string;
    description: string;
  }>;
}

export interface CTAProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: "left" | "center" | "right";
}

export interface TestimonialsProps {
  title?: string;
  testimonials?: Array<{
    quote: string;
    author: string;
    role?: string;
    avatar?: string;
  }>;
  columns?: 1 | 2 | 3;
  showAvatar?: boolean;
}

export interface FAQProps {
  title?: string;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  style?: "accordion" | "list";
}

export interface StatsProps {
  stats?: Array<{
    value: string;
    label: string;
    prefix?: string;
    suffix?: string;
  }>;
  columns?: 2 | 3 | 4;
  alignment?: "left" | "center" | "right";
}

export interface TeamProps {
  title?: string;
  members?: Array<{
    name: string;
    role: string;
    image?: string;
    bio?: string;
    social?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  }>;
  columns?: 2 | 3 | 4;
}

export interface GalleryProps {
  images?: Array<{
    src: string;
    alt?: string;
    caption?: string;
  }>;
  columns?: 2 | 3 | 4;
  gap?: "none" | "sm" | "md" | "lg";
  aspectRatio?: "square" | "landscape" | "portrait" | "auto";
  lightbox?: boolean;
}

// ============================================
// Navigation Component Props
// ============================================

export interface NavbarProps {
  logo?: string;
  logoText?: string;
  links?: Array<{
    text: string;
    href: string;
  }>;
  sticky?: boolean;
  backgroundColor?: string;
  textColor?: string;
  ctaButton?: {
    text: string;
    href: string;
  };
}

export interface FooterProps {
  logo?: string;
  description?: string;
  columns?: Array<{
    title: string;
    links: Array<{
      text: string;
      href: string;
    }>;
  }>;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  copyright?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface SocialLinksProps {
  links?: Array<{
    platform: "facebook" | "twitter" | "instagram" | "linkedin" | "youtube" | "tiktok" | "github";
    url: string;
  }>;
  size?: "sm" | "md" | "lg";
  color?: string;
  style?: "filled" | "outline" | "minimal";
}

// ============================================
// Form Component Props
// ============================================

export interface FormProps {
  formId?: string;
  submitUrl?: string;
  submitText?: string;
  successMessage?: string;
  backgroundColor?: string;
  padding?: "none" | "sm" | "md" | "lg";
  buttonVariant?: "default" | "secondary" | "outline";
  buttonFullWidth?: boolean;
}

export interface FormFieldProps {
  name?: string;
  label?: string;
  type?: "text" | "email" | "tel" | "textarea" | "select" | "checkbox" | "radio";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  helpText?: string;
  width?: "full" | "half" | "third" | "quarter";
}

export interface ContactFormProps {
  title?: string;
  subtitle?: string;
  description?: string;
  fields?: Array<string> | Array<{
    name: string;
    label: string;
    type: "text" | "email" | "tel" | "textarea";
    required?: boolean;
  }>;
  submitText?: string;
  successMessage?: string;
  recipientEmail?: string;
  backgroundColor?: string;
  showIcons?: boolean;
}

export interface NewsletterProps {
  title?: string;
  subtitle?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  provider?: "resend" | "mailchimp" | "custom";
  listId?: string;
  layout?: "inline" | "stacked";
  backgroundColor?: string;
}

// ============================================
// E-Commerce Component Props
// ============================================

export interface ProductGridProps {
  siteId?: string;
  columns?: number;
  limit?: number;
  category?: string;
  sortBy?: "name" | "price" | "created";
  sortOrder?: "asc" | "desc";
  showPrice?: boolean;
  showAddToCart?: boolean;
  gap?: "sm" | "md" | "lg";
  products?: Array<{
    name: string;
    image?: string;
    price?: number;
    salePrice?: number;
    description?: string;
    rating?: number;
    href?: string;
  }>;
  showPrices?: boolean;
  showRatings?: boolean;
}

export interface ProductCardProps {
  productId?: string;
  name?: string;
  image?: string;
  price?: number;
  salePrice?: number;
  description?: string;
  rating?: number;
  href?: string;
  showDescription?: boolean;
  showPrice?: boolean;
  showAddToCart?: boolean;
  showQuickView?: boolean;
  showWishlist?: boolean;
  imageAspect?: "square" | "landscape" | "portrait";
}

export interface CartWidgetProps {
  position?: "fixed" | "inline";
  showCount?: boolean;
  showTotal?: boolean;
}

export interface FeaturedProductsProps {
  siteId?: string;
  title?: string;
  limit?: number;
  columns?: 2 | 3 | 4;
}

export interface AddToCartButtonProps {
  productId?: string;
  text?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export interface CategoryMenuProps {
  siteId?: string;
  orientation?: "horizontal" | "vertical";
  showCount?: boolean;
}

// ============================================
// Field Type Helpers
// ============================================

/**
 * Standard select options for common fields
 */
export const ALIGNMENT_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
] as const;

export const PADDING_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
  { label: "Extra Large", value: "xl" },
] as const;

export const SIZE_OPTIONS = [
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
] as const;

export const COLUMN_OPTIONS = [
  { label: "2 Columns", value: 2 },
  { label: "3 Columns", value: 3 },
  { label: "4 Columns", value: 4 },
] as const;

export const MAX_WIDTH_OPTIONS = [
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
  { label: "Extra Large", value: "xl" },
  { label: "Full Width", value: "full" },
] as const;
