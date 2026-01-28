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
 * Hook for responsive breakpoint detection.
 * Returns current breakpoint and utilities for responsive design.
 * 
 * @example
 * ```tsx
 * function ResponsiveNav() {
 *   const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
 *   return isMobile ? <MobileNav /> : <DesktopNav />;
 * }
 * ```
 */
export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else if (width >= 640) setBreakpoint('sm');
      else setBreakpoint('xs');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return useMemo(() => ({
    breakpoint,
    breakpoints: brand.breakpoints,
    // Convenience booleans
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
    // Specific breakpoint checks
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2xl: breakpoint === '2xl',
    // Min-width checks
    smUp: ['sm', 'md', 'lg', 'xl', '2xl'].includes(breakpoint),
    mdUp: ['md', 'lg', 'xl', '2xl'].includes(breakpoint),
    lgUp: ['lg', 'xl', '2xl'].includes(breakpoint),
    xlUp: ['xl', '2xl'].includes(breakpoint),
    // SSR safety
    mounted,
  }), [breakpoint, mounted]);
}

/**
 * Hook for media query matching.
 * 
 * @example
 * ```tsx
 * function DarkModeAware() {
 *   const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *   return <div>{isDarkMode ? 'Dark' : 'Light'}</div>;
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [query]);
  
  return matches;
}

// =============================================================================
// ACCESSIBILITY HOOKS
// =============================================================================

/**
 * Hook for respecting user motion preferences.
 * 
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const { prefersReducedMotion, getAnimation } = useMotion();
 *   return (
 *     <div style={{ animation: getAnimation('fadeIn 0.3s ease') }}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useMotion() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  const getAnimation = useCallback((animation: string): string => {
    return prefersReducedMotion ? 'none' : animation;
  }, [prefersReducedMotion]);
  
  const getTransition = useCallback((transition: string): string => {
    return prefersReducedMotion ? 'none' : transition;
  }, [prefersReducedMotion]);
  
  const getDuration = useCallback((duration: number): number => {
    return prefersReducedMotion ? 0 : duration;
  }, [prefersReducedMotion]);
  
  return {
    prefersReducedMotion,
    getAnimation,
    getTransition,
    getDuration,
  };
}

/**
 * Hook for high contrast mode detection.
 */
export function useHighContrast() {
  const prefersHighContrast = useMediaQuery('(prefers-contrast: more)');
  return { prefersHighContrast };
}

/**
 * Hook for color scheme preference.
 */
export function useColorSchemePreference() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  return { prefersDark, prefersLight: !prefersDark };
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
