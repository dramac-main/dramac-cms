/**
 * DRAMAC CMS Brand Identity & Metadata Configuration
 * 
 * Central configuration for all brand identity elements.
 * This is the single source of truth for business information,
 * SEO metadata, social links, and analytics configuration.
 * 
 * @module config/brand/identity
 * @version 1.0.0
 */

import type { 
  BrandIdentity, 
  LogoConfig, 
  SEOConfig, 
  SocialLinks, 
  AnalyticsConfig,
} from './types';

// =============================================================================
// BRAND IDENTITY
// =============================================================================

/**
 * Core brand identity information.
 * Update these values to customize the platform branding.
 */
export const identity: BrandIdentity = {
  /** Full product/business name */
  name: 'DRAMAC',
  
  /** Short name for compact spaces (navbar, mobile) */
  shortName: 'DRAMAC',
  
  /** Brand tagline - used in hero sections and metadata */
  tagline: 'Build beautiful websites for your clients',
  
  /** Full description for SEO and about pages */
  description: 
    'DRAMAC is an enterprise-grade modular CMS platform that empowers agencies ' +
    'to build, manage, and scale beautiful client websites with a powerful ' +
    'visual editor, AI assistance, and extensible module marketplace.',
  
  /** Primary domain (without protocol) */
  domain: 'dramac.io',
  
  /** Full site URL (with protocol) */
  url: 'https://dramac.io',
  
  /** Support email address */
  supportEmail: 'support@dramac.io',
  
  /** Sales/inquiries email */
  salesEmail: 'hello@dramac.io',
  
  /** Copyright holder name */
  copyrightName: 'DRAMAC Technologies',
  
  /** Year the business was founded */
  foundedYear: 2024,
};

// =============================================================================
// LOGO CONFIGURATION
// =============================================================================

/**
 * Logo assets configuration.
 * Ensure all logo files exist in the /public directory.
 */
export const logo: LogoConfig = {
  /** Main logo for light backgrounds */
  main: '/images/logo.svg',
  
  /** Logo variant for dark backgrounds */
  dark: '/images/logo-dark.svg',
  
  /** Small icon/favicon */
  icon: '/favicon.ico',
  
  /** Apple touch icon (180x180) */
  appleTouchIcon: '/images/apple-touch-icon.png',
  
  /** Alt text for accessibility */
  alt: 'DRAMAC Logo',
  
  /** Logo dimensions for proper sizing */
  dimensions: {
    width: 140,
    height: 32,
  },
};

// =============================================================================
// SEO CONFIGURATION
// =============================================================================

/**
 * Default SEO metadata.
 * Can be overridden on a per-page basis.
 */
export const seo: SEOConfig = {
  /** Default page title */
  title: identity.name,
  
  /** Title template for sub-pages */
  titleTemplate: `%s | ${identity.name}`,
  
  /** Default meta description */
  description: identity.description,
  
  /** Open Graph image URL (1200x630 recommended) */
  ogImage: `${identity.url}/images/og-image.png`,
  
  /** Twitter card type */
  twitterCard: 'summary_large_image',
  
  /** Twitter handle (without @) */
  twitterHandle: 'dramac_io',
  
  /** Canonical URL base */
  canonicalBase: identity.url,
  
  /** Robots meta directives */
  robots: 'index, follow',
};

// =============================================================================
// SOCIAL LINKS
// =============================================================================

/**
 * Social media profile links.
 * Leave undefined to hide from footer/social components.
 */
export const social: SocialLinks = {
  /** Twitter/X profile */
  twitter: 'https://twitter.com/dramac_io',
  
  /** GitHub organization */
  github: 'https://github.com/dramac-main',
  
  /** LinkedIn company page */
  linkedin: 'https://linkedin.com/company/dramac',
  
  /** Discord community server */
  discord: 'https://discord.gg/dramac',
  
  /** YouTube channel */
  youtube: undefined,
  
  /** Facebook page */
  facebook: undefined,
  
  /** Instagram profile */
  instagram: undefined,
  
  /** TikTok profile */
  tiktok: undefined,
};

// =============================================================================
// ANALYTICS CONFIGURATION
// =============================================================================

/**
 * Analytics and tracking configuration.
 * Set to undefined to disable a provider.
 * 
 * NOTE: Production values should come from environment variables.
 */
export const analytics: AnalyticsConfig = {
  /** Google Analytics 4 measurement ID */
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
  
  /** Enable Vercel Analytics */
  vercelAnalytics: true,
  
  /** PostHog project key */
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  
  /** Mixpanel project token */
  mixpanelToken: undefined,
  
  /** Hotjar site ID */
  hotjarId: undefined,
  
  /** Custom analytics endpoint */
  customEndpoint: undefined,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the full page title with template.
 * @param pageTitle - The page-specific title
 * @returns Full formatted title
 */
export function getFullTitle(pageTitle?: string): string {
  if (!pageTitle) return seo.title;
  return seo.titleTemplate.replace('%s', pageTitle);
}

/**
 * Get the current year for copyright.
 */
export function getCopyrightYear(): string {
  const currentYear = new Date().getFullYear();
  if (identity.foundedYear && identity.foundedYear < currentYear) {
    return `${identity.foundedYear}-${currentYear}`;
  }
  return String(currentYear);
}

/**
 * Get formatted copyright text.
 */
export function getCopyrightText(): string {
  return `© ${getCopyrightYear()} ${identity.copyrightName || identity.name}. All rights reserved.`;
}

/**
 * Get active social links (non-undefined).
 */
export function getActiveSocialLinks(): Array<{ platform: keyof SocialLinks; url: string }> {
  return Object.entries(social)
    .filter(([, url]) => url !== undefined)
    .map(([platform, url]) => ({ 
      platform: platform as keyof SocialLinks, 
      url: url as string 
    }));
}
