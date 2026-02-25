/**
 * PHASE AWD-02: Data Context System
 * Type Definitions for Business Data Context
 * 
 * These types define the structure of data pulled from the database
 * to provide AI with complete knowledge of the business being designed for.
 */

// =============================================================================
// CORE DATA TYPES
// =============================================================================

/**
 * Site data from the sites table
 */
export interface SiteData {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  settings?: Record<string, unknown>;
  seo_title?: string;
  seo_description?: string;
  analytics_id?: string;
  client_id?: string;
  agency_id?: string;
  created_at?: string;
  updated_at?: string;
  agencies?: AgencyData;
}

/**
 * Agency data for white-label branding
 */
export interface AgencyData {
  id: string;
  name: string;
  logo_url?: string;
  branding?: Record<string, unknown>;
}

/**
 * Site branding data - Extended with all design system fields
 */
export interface BrandingData {
  id?: string;
  site_id?: string;
  business_name?: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  // Colors
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  // Typography
  heading_font?: string;
  body_font?: string;
  font_heading?: string;
  font_body?: string;
  font_scale?: string;
  // Design preferences
  border_radius?: string;
  shadow_style?: string;
  spacing_scale?: string;
  // Brand voice
  brand_voice?: string;
  tone?: string;
  // Custom styles
  custom_css?: string;
}

/**
 * Client data from the clients table - Extended with all business fields
 */
export interface ClientData {
  id?: string;
  company?: string;
  company_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  notes?: string;
  // Address
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  // Business identity
  tagline?: string;
  mission?: string;
  vision?: string;
  values?: string[];
  description?: string;
  founded_year?: number;
}

/**
 * Consolidated contact information
 */
export interface ContactData {
  email?: string;
  phone?: string;
  address?: AddressData;
  mapCoordinates?: MapCoordinates | null;
}

/**
 * Address data
 */
export interface AddressData {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

/**
 * Map coordinates
 */
export interface MapCoordinates {
  lat: number;
  lng: number;
}

// =============================================================================
// CONTENT DATA TYPES
// =============================================================================

/**
 * Social media link
 */
export interface SocialLink {
  id: string;
  site_id: string;
  platform: string;
  url: string;
  label?: string;
  display_order?: number;
  created_at?: string;
}

/**
 * Business hours for a day
 */
export interface BusinessHours {
  id: string;
  site_id: string;
  day: string;
  open_time?: string;
  close_time?: string;
  is_closed?: boolean;
  is_24_hours?: boolean;
}

/**
 * Business location
 */
export interface Location {
  id: string;
  site_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  lat?: number;
  lng?: number;
  is_primary?: boolean;
  created_at?: string;
}

/**
 * Team member - Extended with all profile fields
 */
export interface TeamMember {
  id: string;
  site_id: string;
  name: string;
  role?: string;
  title?: string;
  department?: string;
  bio?: string;
  image_url?: string;
  email?: string;
  phone?: string;
  qualifications?: string[];
  social_links?: Record<string, string>;
  display_order?: number;
  created_at?: string;
}

/**
 * Service or product - Extended with pricing and duration
 */
export interface Service {
  id: string;
  site_id: string;
  name: string;
  description?: string;
  price?: string;
  price_unit?: string;
  duration?: string;
  image_url?: string;
  features?: string[];
  category?: string;
  is_featured?: boolean;
  display_order?: number;
  created_at?: string;
}

/**
 * Portfolio or project item - Extended with all project fields
 */
export interface PortfolioItem {
  id: string;
  site_id: string;
  title: string;
  description?: string;
  image_url?: string;
  gallery?: string[];
  client?: string;
  client_name?: string;
  category?: string;
  technologies?: string[];
  project_date?: string;
  completed_date?: string;
  link?: string;
  featured?: boolean;
  is_featured?: boolean;
  created_at?: string;
}

/**
 * Customer testimonial - Extended with author details
 */
export interface Testimonial {
  id: string;
  site_id: string;
  name: string;
  author_name?: string;
  author_title?: string;
  company?: string;
  role?: string;
  content: string;
  rating?: number;
  image_url?: string;
  featured?: boolean;
  created_at?: string;
}

/**
 * Blog post
 */
export interface BlogPost {
  id: string;
  site_id?: string;
  title: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  category?: string;
  author?: string;
  published_at?: string;
  status?: string;
}

/**
 * FAQ item
 */
export interface FAQItem {
  id: string;
  site_id: string;
  question: string;
  answer: string;
  category?: string;
  display_order?: number;
  created_at?: string;
}

/**
 * Enabled module/feature
 */
export interface EnabledModule {
  id: string;
  site_id: string;
  module_type: string;
  module_name?: string;
  name?: string;
  enabled: boolean;
  settings?: Record<string, unknown>;
}

/**
 * Booking service from the booking module tables
 */
export interface BookingServiceData {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  duration_minutes?: number;
  category?: string;
  is_featured?: boolean;
}

/**
 * Booking staff from the booking module tables
 */
export interface BookingStaffData {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  image_url?: string;
  specialties?: string[];
  service_ids?: string[];
}

// =============================================================================
// AGGREGATE TYPES
// =============================================================================

/**
 * Complete business data context for AI
 */
export interface BusinessDataContext {
  site: SiteData;
  branding: BrandingData;
  client: ClientData;
  contact: ContactData;
  social: SocialLink[];
  hours: BusinessHours[];
  locations: Location[];
  testimonials: Testimonial[];
  team: TeamMember[];
  services: Service[];
  portfolio: PortfolioItem[];
  blog: BlogPost[];
  faq: FAQItem[];
  modules: EnabledModule[];
  /** Booking module services fetched from mod_bookmod01_services */
  bookingServices?: BookingServiceData[];
  /** Booking module staff fetched from mod_bookmod01_staff */
  bookingStaff?: BookingStaffData[];
}

// =============================================================================
// DATA AVAILABILITY TYPES
// =============================================================================

/**
 * Score levels for data availability
 */
export type DataAvailabilityScore = "excellent" | "good" | "fair" | "limited" | "minimal";

/**
 * Priority levels for missing data prompts
 */
export type MissingDataPromptPriority = "critical" | "high" | "medium" | "low";

/**
 * Individual category availability
 */
export interface DataAvailabilityCategory {
  name: string;
  key: string;
  total: number;
  filled: number;
  percentage: number;
  score: DataAvailabilityScore;
  missingFields: string[];
}

/**
 * Data availability status - Full analysis
 */
export interface DataAvailability {
  overallScore: DataAvailabilityScore;
  overallPercentage: number;
  categories: DataAvailabilityCategory[];
  recommendations: string[];
}

/**
 * Missing data prompt for the user
 */
export interface MissingDataPrompt {
  field: string;
  category?: string;
  question: string;
  priority: MissingDataPromptPriority;
  placeholder?: string;
  helpText?: string;
  examples?: string[];
  inputType?: "text" | "color" | "file" | "select" | "multiline";
}

/**
 * Data context builder options
 */
export interface DataContextBuilderOptions {
  includeModules?: boolean;
  includeBlog?: boolean;
  maxTestimonials?: number;
  maxPortfolioItems?: number;
  maxBlogPosts?: number;
  maxFaqItems?: number;
}

/**
 * Formatted context for AI consumption
 */
export interface FormattedContext {
  markdown: string;
  json: BusinessDataContext;
  availability: DataAvailability;
  missingPrompts: MissingDataPrompt[];
}
