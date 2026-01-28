/**
 * DRAMAC CMS Brand React Hooks
 * 
 * React hooks for accessing brand configuration in components.
 * These hooks provide a convenient API for brand-aware components.
 * 
 * @module config/brand/hooks
 * @version 1.0.0
 */

'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/components/providers/theme-provider';
import { 
  brand, 
  colors, 
  getColor, 
  getHex, 
  getHsl,
  getActiveSocialLinks,
  getCopyrightText,
  type ColorName,
  type ColorScale,
} from './index';

// =============================================================================
// RESOLVED THEME HELPER
// =============================================================================

/**
 * Gets the resolved theme (accounts for system preference).
 */
function useResolvedTheme(): 'light' | 'dark' {
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(isDark ? 'dark' : 'light');
      
      // Listen for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setResolvedTheme(theme as 'light' | 'dark');
    }
  }, [theme]);
  
  return resolvedTheme;
}

// =============================================================================
// BRAND HOOK
// =============================================================================

/**
 * Hook for accessing the complete brand configuration.
 * 
 * @example
 * ```tsx
 * function Header() {
 *   const { identity, logo } = useBrand();
 *   return <img src={logo.main} alt={identity.name} />;
 * }
 * ```
 */
export function useBrand() {
  return brand;
}

// =============================================================================
// COLOR HOOKS
// =============================================================================

/**
 * Hook for accessing theme-aware colors.
 * Automatically switches between light and dark theme colors.
 * 
 * @example
 * ```tsx
 * function ThemedCard() {
 *   const { theme, colors } = useColors();
 *   const bgColor = colors.neutral.card.DEFAULT.hex;
 *   return <div style={{ backgroundColor: bgColor }}>...</div>;
 * }
 * ```
 */
export function useColors() {
  const resolvedTheme = useResolvedTheme();
  
  const themeColors = useMemo(() => {
    return resolvedTheme === 'dark' ? brand.colors.dark : brand.colors.light;
  }, [resolvedTheme]);
  
  return {
    theme: resolvedTheme,
    colors: themeColors,
    scales: colors,
  };
}

/**
 * Hook for getting a specific color with all shades.
 * 
 * @example
 * ```tsx
 * function Button() {
 *   const primary = useColorScale('primary');
 *   return (
 *     <button 
 *       style={{ 
 *         backgroundColor: primary[500].hex,
 *         color: 'white',
 *       }}
 *       onMouseOver={(e) => e.target.style.backgroundColor = primary[600].hex}
 *     >
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export function useColorScale(colorName: ColorName): ColorScale {
  return colors[colorName];
}

/**
 * Hook for getting color utility functions.
 * 
 * @example
 * ```tsx
 * function Badge() {
 *   const { getHex, getHsl } = useColorUtils();
 *   return <span style={{ backgroundColor: getHex('success', 100) }}>...</span>;
 * }
 * ```
 */
export function useColorUtils() {
  return useMemo(() => ({
    getColor,
    getHex,
    getHsl,
  }), []);
}

// =============================================================================
// IDENTITY HOOKS
// =============================================================================

/**
 * Hook for accessing brand identity information.
 * 
 * @example
 * ```tsx
 * function Footer() {
 *   const { name, copyright } = useIdentity();
 *   return <footer>{copyright}</footer>;
 * }
 * ```
 */
export function useIdentity() {
  const copyright = useMemo(() => getCopyrightText(), []);
  
  return {
    ...brand.identity,
    copyright,
  };
}

/**
 * Hook for accessing logo configuration.
 */
export function useLogo() {
  const resolvedTheme = useResolvedTheme();
  
  const currentLogo = useMemo(() => {
    if (resolvedTheme === 'dark' && brand.logo.dark) {
      return brand.logo.dark;
    }
    return brand.logo.main;
  }, [resolvedTheme]);
  
  return {
    ...brand.logo,
    current: currentLogo,
  };
}

// =============================================================================
// SEO HOOKS
// =============================================================================

/**
 * Hook for generating SEO metadata.
 * 
 * @example
 * ```tsx
 * function Page() {
 *   const { generateMetadata } = useSEO();
 *   const metadata = generateMetadata({
 *     title: 'Dashboard',
 *     description: 'Your dashboard overview',
 *   });
 *   // Use with Next.js metadata
 * }
 * ```
 */
export function useSEO() {
  const generateMetadata = useCallback((options: {
    title?: string;
    description?: string;
    image?: string;
    noIndex?: boolean;
  } = {}) => {
    const { title, description, image, noIndex } = options;
    
    const fullTitle = title 
      ? brand.seo.titleTemplate.replace('%s', title)
      : brand.seo.title;
    
    return {
      title: fullTitle,
      description: description || brand.seo.description,
      openGraph: {
        title: fullTitle,
        description: description || brand.seo.description,
        images: [image || brand.seo.ogImage].filter(Boolean),
        siteName: brand.identity.name,
        url: brand.identity.url,
      },
      twitter: {
        card: brand.seo.twitterCard,
        site: brand.seo.twitterHandle ? `@${brand.seo.twitterHandle}` : undefined,
        title: fullTitle,
        description: description || brand.seo.description,
        images: [image || brand.seo.ogImage].filter(Boolean),
      },
      robots: noIndex ? 'noindex, nofollow' : brand.seo.robots,
    };
  }, []);
  
  return {
    ...brand.seo,
    generateMetadata,
  };
}

// =============================================================================
// SOCIAL HOOKS
// =============================================================================

/**
 * Hook for accessing social media links.
 * 
 * @example
 * ```tsx
 * function SocialLinks() {
 *   const { links, getIcon } = useSocial();
 *   return (
 *     <div>
 *       {links.map(({ platform, url }) => (
 *         <a key={platform} href={url}>{platform}</a>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSocial() {
  const activeLinks = useMemo(() => getActiveSocialLinks(), []);
  
  return {
    all: brand.social,
    links: activeLinks,
    hasLinks: activeLinks.length > 0,
  };
}

// =============================================================================
// RESPONSIVE HOOKS
// =============================================================================

/**
 * Hook for accessing responsive breakpoints.
 * 
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const { breakpoints, containerMaxWidths } = useResponsive();
 *   // Use for responsive logic
 * }
 * ```
 */
export function useResponsive() {
  return useMemo(() => ({
    breakpoints: brand.breakpoints,
  }), []);
}

// =============================================================================
// SPACING HOOKS
// =============================================================================

/**
 * Hook for accessing spacing tokens.
 */
export function useSpacing() {
  return brand.spacing;
}

// =============================================================================
// COMBINED HOOK
// =============================================================================

/**
 * All-in-one hook for complete brand access.
 * Use when you need multiple brand aspects in one component.
 * 
 * @example
 * ```tsx
 * function BrandedComponent() {
 *   const { 
 *     identity, 
 *     colors, 
 *     spacing, 
 *     copyright 
 *   } = useBrandSystem();
 *   
 *   return (
 *     <div style={{ padding: spacing[4] }}>
 *       <h1>{identity.name}</h1>
 *       <p>{copyright}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBrandSystem() {
  const resolvedTheme = useResolvedTheme();
  const copyright = getCopyrightText();
  const activeLinks = getActiveSocialLinks();
  
  const themeColors = useMemo(() => {
    return resolvedTheme === 'dark' ? brand.colors.dark : brand.colors.light;
  }, [resolvedTheme]);
  
  const currentLogo = useMemo(() => {
    if (resolvedTheme === 'dark' && brand.logo.dark) {
      return brand.logo.dark;
    }
    return brand.logo.main;
  }, [resolvedTheme]);
  
  return {
    // Identity
    identity: brand.identity,
    logo: { ...brand.logo, current: currentLogo },
    seo: brand.seo,
    
    // Colors
    colors: themeColors,
    colorScales: colors,
    theme: resolvedTheme,
    
    // Typography & Layout
    typography: brand.typography,
    spacing: brand.spacing,
    borderRadius: brand.borderRadius,
    shadows: brand.shadows,
    breakpoints: brand.breakpoints,
    
    // Social & Analytics
    social: brand.social,
    socialLinks: activeLinks,
    analytics: brand.analytics,
    
    // Utilities
    copyright,
    getColor,
    getHex,
    getHsl,
  };
}
