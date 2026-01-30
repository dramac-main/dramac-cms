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

// Additional E-commerce Component Props (PHASE-ED-03)
export interface ProductCategoriesProps {
  title?: string;
  subtitle?: string;
  categories?: Array<{
    name: string;
    image?: string;
    href?: string;
    productCount?: number;
  }>;
  columns?: 2 | 3 | 4;
  layout?: "grid" | "carousel";
  showProductCount?: boolean;
}

export interface CartSummaryProps {
  showItemCount?: boolean;
  showSubtotal?: boolean;
  checkoutButtonText?: string;
  emptyCartText?: string;
  backgroundColor?: string;
}

export interface ProductFiltersProps {
  showPriceFilter?: boolean;
  showCategoryFilter?: boolean;
  showRatingFilter?: boolean;
  showSortOptions?: boolean;
  priceRanges?: Array<{ label: string; min: number; max: number }>;
  categories?: string[];
}

export interface ProductQuickViewProps {
  productName?: string;
  productImage?: string;
  price?: number;
  salePrice?: number;
  description?: string;
  rating?: number;
  showQuantitySelector?: boolean;
  showSizeSelector?: boolean;
  sizes?: string[];
}

export interface FeaturedProductsBannerProps {
  title?: string;
  subtitle?: string;
  layout?: "banner" | "carousel" | "grid";
  products?: Array<{
    name: string;
    image?: string;
    price?: number;
    salePrice?: number;
    badge?: string;
    href?: string;
  }>;
  showBadges?: boolean;
}

export interface CartIconProps {
  count?: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
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

// ============================================
// PHASE-ED-02A: Advanced Layout Component Props
// ============================================

export interface GridProps {
  columns?: number;
  rows?: number;
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  rowGap?: "none" | "sm" | "md" | "lg" | "xl";
  columnGap?: "none" | "sm" | "md" | "lg" | "xl";
  alignItems?: "start" | "center" | "end" | "stretch";
  justifyItems?: "start" | "center" | "end" | "stretch";
  minChildWidth?: number;
  autoFit?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  backgroundColor?: string;
}

export interface FlexboxProps {
  direction?: "row" | "row-reverse" | "column" | "column-reverse";
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  justifyContent?: "start" | "center" | "end" | "between" | "around" | "evenly";
  alignItems?: "start" | "center" | "end" | "stretch" | "baseline";
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  padding?: "none" | "sm" | "md" | "lg";
  backgroundColor?: string;
}

export interface TabsContainerProps {
  tabs?: Array<{
    id: string;
    label: string;
    icon?: string;
  }>;
  defaultTab?: number;
  variant?: "default" | "pills" | "underline" | "boxed";
  alignment?: "left" | "center" | "right" | "full";
  orientation?: "horizontal" | "vertical";
}

export interface AccordionContainerProps {
  items?: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
  multiple?: boolean;
  allowMultiple?: boolean;
  defaultOpen?: number | string[];
  variant?: "default" | "bordered" | "separated";
  iconPosition?: "left" | "right";
}

export interface ModalTriggerProps {
  triggerText?: string;
  triggerVariant?: "primary" | "secondary" | "outline" | "ghost";
  modalTitle?: string;
  modalSize?: "sm" | "md" | "lg" | "xl" | "full";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlay?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface DrawerTriggerProps {
  triggerText?: string;
  triggerVariant?: "primary" | "secondary" | "outline" | "ghost";
  drawerTitle?: string;
  position?: "left" | "right" | "top" | "bottom";
  size?: "sm" | "md" | "lg" | "full";
  overlay?: boolean;
  closeOnOverlay?: boolean;
}

export interface AspectRatioProps {
  ratio?: "1:1" | "4:3" | "16:9" | "21:9" | "3:4" | "9:16" | "3:2" | "2:3" | "custom";
  customRatio?: number;
  maxWidth?: string;
  backgroundColor?: string;
}

export interface StackProps {
  direction?: "vertical" | "horizontal";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
  divider?: boolean;
  dividers?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export interface StickyContainerProps {
  position?: "top" | "bottom";
  offset?: number;
  top?: number;
  bottom?: number;
  zIndex?: number;
  backgroundColor?: string;
  shadow?: boolean;
}

export interface ScrollAreaProps {
  maxHeight?: string | number;
  maxWidth?: string | number;
  scrollbarStyle?: "default" | "thin" | "hidden";
  scrollDirection?: "vertical" | "horizontal" | "both";
  showScrollbar?: "auto" | "always" | "hover" | "never";
  orientation?: "vertical" | "horizontal" | "both";
  padding?: "none" | "sm" | "md" | "lg";
}

// ============================================
// PHASE-ED-02B: Content Component Props
// ============================================

export interface RichTextProps {
  content?: string;
  typography?: "prose" | "compact" | "large";
  preserveWhitespace?: boolean;
  alignment?: "left" | "center" | "right" | "justify";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  fontSize?: "sm" | "base" | "lg" | "xl";
  lineHeight?: "tight" | "normal" | "relaxed" | "loose";
}

export interface QuoteProps {
  text?: string;
  author?: string;
  authorTitle?: string;
  authorRole?: string;
  authorImage?: string;
  variant?: "default" | "large" | "card" | "border" | "bordered" | "highlight" | "minimal";
  alignment?: "left" | "center" | "right";
  backgroundColor?: string;
}

export interface CodeBlockProps {
  code?: string;
  language?: "javascript" | "typescript" | "python" | "html" | "css" | "json" | "bash" | "sql" | "plain" | "text";
  theme?: "dark" | "light";
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  highlightLines?: string;
  filename?: string;
  title?: string;
}

export interface ListProps {
  items?: Array<{
    text: string;
    subItems?: string[];
  }>;
  variant?: "unordered" | "ordered" | "checklist" | "check" | "arrow" | "custom" | "icon";
  icon?: string;
  iconColor?: string;
  spacing?: "compact" | "normal" | "relaxed";
  size?: "sm" | "md" | "lg";
}

export interface TableProps {
  headers?: Array<{ key: string; label: string }> | string[];
  rows?: Array<Record<string, string>> | Array<string[]>;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  alignment?: "left" | "center" | "right";
  headerBackground?: string;
}

export interface BadgeProps {
  text?: string;
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "error" | "info" | "outline";
  size?: "sm" | "md" | "lg";
  rounded?: boolean;
  icon?: string;
  outline?: boolean;
  dot?: boolean;
  removable?: boolean;
}

export interface AlertProps {
  title?: string;
  message?: string;
  variant?: "info" | "success" | "warning" | "danger" | "error";
  icon?: string;
  dismissible?: boolean;
  showIcon?: boolean;
}

export interface ProgressProps {
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: "default" | "success" | "warning" | "danger" | "error" | "gradient";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  striped?: boolean;
}

export interface TooltipWrapperProps {
  content?: string;
  position?: "top" | "bottom" | "left" | "right";
  trigger?: "hover" | "click";
  delay?: number;
  maxWidth?: number;
}

export interface TimelineProps {
  items?: Array<{
    title: string;
    description?: string;
    date?: string;
    icon?: string;
    color?: string;
  }>;
  variant?: "default" | "alternating" | "compact";
  lineStyle?: "solid" | "dashed" | "dotted";
  lineColor?: string;
  showConnector?: boolean;
}

export interface PricingTableProps {
  plans?: Array<{
    name: string;
    price: string;
    period?: string;
    description?: string;
    features?: string[];
    buttonText?: string;
    buttonLink?: string;
    highlighted?: boolean;
    badge?: string;
  }>;
  columns?: number | 2 | 3 | 4;
  currency?: string;
  showToggle?: boolean;
  monthlyLabel?: string;
  yearlyLabel?: string;
  yearlyDiscount?: number;
}

export interface CounterProps {
  endValue?: number;
  startValue?: number;
  value?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  separator?: string | boolean;
  decimals?: number;
  label?: string;
  labelPosition?: "top" | "bottom";
  size?: "sm" | "md" | "lg" | "xl";
}

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square" | "rounded";
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  border?: boolean;
  status?: "online" | "offline" | "away" | "busy";
}

export interface AvatarGroupProps {
  avatars?: Array<{
    src?: string;
    alt?: string;
    fallback?: string;
  }>;
  max?: number;
  size?: "sm" | "md" | "lg";
  overlap?: "sm" | "md" | "lg";
}

export interface IconProps {
  name?: string;
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  rounded?: boolean;
}

// ============================================
// PHASE-ED-02C: Advanced Form Component Props
// ============================================

export interface MultiStepFormProps {
  steps?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  currentStep?: number;
  showProgress?: boolean;
  progressVariant?: "dots" | "bar" | "steps";
  allowSkip?: boolean;
  submitText?: string;
  nextText?: string;
  prevText?: string;
}

export interface RatingInputProps {
  name?: string;
  label?: string;
  maxRating?: number;
  defaultValue?: number;
  size?: "sm" | "md" | "lg";
  icon?: "star" | "heart" | "circle";
  color?: string;
  allowHalf?: boolean;
  readonly?: boolean;
  showValue?: boolean;
}

export interface FileUploadProps {
  name?: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  variant?: "dropzone" | "button" | "avatar";
  showPreview?: boolean;
  helpText?: string;
  required?: boolean;
}

export interface DatePickerInputProps {
  name?: string;
  label?: string;
  placeholder?: string;
  format?: string;
  minDate?: string;
  maxDate?: string;
  showTime?: boolean;
  required?: boolean;
  helpText?: string;
}

export interface RangeSliderProps {
  name?: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  showValue?: boolean;
  showMinMax?: boolean;
  unit?: string;
  marks?: Array<{ value: number; label: string }>;
}

export interface SwitchInputProps {
  name?: string;
  label?: string;
  description?: string;
  defaultChecked?: boolean;
  size?: "sm" | "md" | "lg";
  labelPosition?: "left" | "right";
  required?: boolean;
}

export interface CheckboxGroupProps {
  name?: string;
  label?: string;
  options?: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  defaultValue?: string[];
  orientation?: "vertical" | "horizontal";
  required?: boolean;
  helpText?: string;
}

export interface RadioGroupProps {
  name?: string;
  label?: string;
  options?: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  defaultValue?: string;
  orientation?: "vertical" | "horizontal";
  variant?: "default" | "cards" | "buttons";
  required?: boolean;
  helpText?: string;
}

export interface SearchInputProps {
  name?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outline";
  showClearButton?: boolean;
  showSearchIcon?: boolean;
  iconPosition?: "left" | "right";
}

export interface PasswordInputProps {
  name?: string;
  label?: string;
  placeholder?: string;
  showToggle?: boolean;
  showStrength?: boolean;
  required?: boolean;
  helpText?: string;
  minLength?: number;
}

export interface OTPInputProps {
  name?: string;
  label?: string;
  length?: number;
  variant?: "boxes" | "underline";
  autoFocus?: boolean;
  helpText?: string;
  type?: "number" | "text";
}

export interface SelectInputProps {
  name?: string;
  label?: string;
  options?: Array<{
    value: string;
    label: string;
    group?: string;
    disabled?: boolean;
  }>;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  required?: boolean;
  helpText?: string;
}

export interface TagInputProps {
  name?: string;
  label?: string;
  placeholder?: string;
  defaultTags?: string[];
  maxTags?: number;
  allowDuplicates?: boolean;
  suggestions?: string[];
  required?: boolean;
  helpText?: string;
}
