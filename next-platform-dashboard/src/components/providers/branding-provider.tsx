/**
 * BrandingProvider
 * 
 * Phase WL-01: White-Label Branding Foundation
 * 
 * React context that provides per-agency branding throughout the app.
 * Supports SSR via initialBranding prop (no loading flash).
 */
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AgencyBranding, DEFAULT_BRANDING } from "@/types/branding";

interface BrandingContextType {
  branding: AgencyBranding | null;
  isLoading: boolean;
  error: Error | null;
  /** Get the agency display name, with fallback */
  getDisplayName: () => string;
  /** Get the logo URL for the given color mode */
  getLogoUrl: (mode?: "light" | "dark") => string | null;
  /** Get email "From" display name */
  getEmailFromName: () => string;
  /** Get primary brand color */
  getPrimaryColor: () => string;
  /** Get accent brand color */
  getAccentColor: () => string;
  /** Force re-fetch branding from server */
  refetch: () => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

interface BrandingProviderProps {
  agencyId: string;
  children: React.ReactNode;
  /** Server-side fetched branding for instant SSR render */
  initialBranding?: AgencyBranding | null;
}

export function BrandingProvider({
  agencyId,
  children,
  initialBranding,
}: BrandingProviderProps) {
  const [branding, setBranding] = useState<AgencyBranding | null>(initialBranding ?? null);
  const [isLoading, setIsLoading] = useState(!initialBranding);
  const [error, setError] = useState<Error | null>(null);

  const fetchBranding = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/branding/${agencyId}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        if (data) setBranding(data);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    if (initialBranding) return;
    fetchBranding();
  }, [initialBranding, fetchBranding]);

  // Listen for branding-updated events (fired by branding settings form after save)
  useEffect(() => {
    const handleBrandingUpdated = (e: Event) => {
      const detail = (e as CustomEvent<AgencyBranding>).detail;
      if (detail) {
        setBranding(detail);
      } else {
        fetchBranding();
      }
    };
    window.addEventListener("branding-updated", handleBrandingUpdated);
    return () => window.removeEventListener("branding-updated", handleBrandingUpdated);
  }, [fetchBranding]);

  // Inject CSS custom properties for brand colors
  // Maps to --color-primary/--color-accent which Tailwind reads via generateColorScale()
  useEffect(() => {
    if (!branding) return;

    // Convert hex to HSL string "H S% L%" for CSS custom properties
    function hexToHSL(hex: string): string {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let h = 0, s = 0;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    }

    /**
     * Generate a basic HSL shade scale from a base HSL string.
     * Adjusts lightness to create 50-950 shades for Tailwind consumption.
     */
    function generateHSLScale(baseHSL: string): Record<string, string> {
      const parts = baseHSL.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
      if (!parts) return {};
      const h = parseInt(parts[1]);
      const s = parseInt(parts[2]);
      // Map shade number → lightness percentage
      const shades: Record<string, number> = {
        '50': 97, '100': 94, '200': 86, '300': 77,
        '400': 66, '500': 55, '600': 47, '700': 39,
        '800': 32, '900': 24, '950': 14,
      };
      const result: Record<string, string> = {};
      for (const [shade, lightness] of Object.entries(shades)) {
        // Reduce saturation slightly for extreme lightness values
        const adjS = lightness > 90 ? Math.round(s * 0.3) : lightness > 80 ? Math.round(s * 0.5) : lightness < 20 ? Math.round(s * 0.8) : s;
        result[shade] = `${h} ${adjS}% ${lightness}%`;
      }
      return result;
    }

    const style = document.createElement("style");
    style.id = "branding-vars";

    const primaryHSL = hexToHSL(branding.primary_color);
    const accentHSL = hexToHSL(branding.accent_color);
    const primaryFgHSL = branding.primary_foreground ? hexToHSL(branding.primary_foreground) : '0 0% 100%';
    const accentFgHSL = branding.accent_foreground ? hexToHSL(branding.accent_foreground) : '0 0% 100%';

    // Generate shade scales
    const primaryScale = generateHSLScale(primaryHSL);
    const accentScale = generateHSLScale(accentHSL);

    // Build scale CSS lines
    const primaryScaleCSS = Object.entries(primaryScale)
      .map(([shade, val]) => `--color-primary-${shade}: ${val};`)
      .join('\n      ');
    const accentScaleCSS = Object.entries(accentScale)
      .map(([shade, val]) => `--color-accent-${shade}: ${val};`)
      .join('\n      ');

    style.textContent = `:root {
      --brand-primary: ${branding.primary_color};
      --brand-accent: ${branding.accent_color};
      --color-primary: ${primaryHSL};
      --color-primary-foreground: ${primaryFgHSL};
      --color-accent: ${accentHSL};
      --color-accent-foreground: ${accentFgHSL};
      --color-ring: ${primaryHSL};
      --color-secondary: ${accentHSL};
      --color-secondary-foreground: ${accentFgHSL};
      --sidebar-primary: hsl(${primaryHSL});
      --sidebar-primary-foreground: hsl(${primaryFgHSL});
      --sidebar-accent: hsl(${accentHSL});
      --sidebar-accent-foreground: hsl(${accentFgHSL});
      --sidebar-ring: hsl(${primaryHSL});
      --sidebar-border: hsl(${primaryHSL} / 0.15);
      ${primaryScaleCSS}
      ${accentScaleCSS}
    }
    .dark {
      --color-primary: ${primaryHSL};
      --color-primary-foreground: ${primaryFgHSL};
      --color-accent: ${accentHSL};
      --color-accent-foreground: ${accentFgHSL};
      --color-ring: ${primaryHSL};
      --color-secondary: ${accentHSL};
      --color-secondary-foreground: ${accentFgHSL};
      --sidebar-primary: hsl(${primaryHSL});
      --sidebar-primary-foreground: hsl(${primaryFgHSL});
      --sidebar-accent: hsl(${accentHSL});
      --sidebar-accent-foreground: hsl(${accentFgHSL});
      --sidebar-ring: hsl(${primaryHSL});
      --sidebar-border: hsl(${primaryHSL} / 0.15);
      ${primaryScaleCSS}
      ${accentScaleCSS}
    }`;

    // Inject portal custom CSS if present
    if (branding.portal_custom_css) {
      style.textContent += `\n/* Portal Custom CSS */\n${branding.portal_custom_css}`;
    }

    // Remove any existing branding style
    document.getElementById("branding-vars")?.remove();
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, [branding]);

  // Inject custom favicon if set
  useEffect(() => {
    if (!branding?.favicon_url) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = branding.favicon_url;
  }, [branding?.favicon_url]);

  const value: BrandingContextType = {
    branding,
    isLoading,
    error,
    getDisplayName: () =>
      branding?.agency_display_name ?? DEFAULT_BRANDING.agency_display_name,
    getLogoUrl: (mode = "light") =>
      mode === "dark"
        ? (branding?.logo_dark_url ?? branding?.logo_url ?? null)
        : (branding?.logo_url ?? null),
    getEmailFromName: () =>
      branding?.email_from_name ?? branding?.agency_display_name ?? DEFAULT_BRANDING.agency_display_name,
    getPrimaryColor: () =>
      branding?.primary_color ?? DEFAULT_BRANDING.primary_color,
    getAccentColor: () =>
      branding?.accent_color ?? DEFAULT_BRANDING.accent_color,
    refetch: fetchBranding,
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

/**
 * Hook to access branding context.
 * Must be used within a BrandingProvider.
 */
export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}

/**
 * Optional hook that returns null instead of throwing if not in a BrandingProvider.
 * Useful for shared components that might be used outside branded context.
 */
export function useBrandingOptional() {
  return useContext(BrandingContext) ?? null;
}
