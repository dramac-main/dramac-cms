/**
 * BrandingProvider
 * 
 * Phase WL-01: White-Label Branding Foundation
 * 
 * React context that provides per-agency branding throughout the app.
 * Supports SSR via initialBranding prop (no loading flash).
 */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    if (initialBranding) return;

    let cancelled = false;

    async function fetchBranding() {
      try {
        const response = await fetch(`/api/branding/${agencyId}`);
        if (response.ok) {
          const data = await response.json();
          if (!cancelled && data) setBranding(data);
        }
        // If 404, branding stays null — components will use DEFAULT_BRANDING fallbacks
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchBranding();
    return () => { cancelled = true; };
  }, [agencyId, initialBranding]);

  // Inject CSS custom properties for brand colors
  // Maps to both --brand-* (custom) AND Tailwind/shadcn --primary/--accent vars
  useEffect(() => {
    if (!branding) return;

    // Convert hex to HSL for Tailwind CSS variables
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

    const style = document.createElement("style");
    style.id = "branding-vars";

    const primaryHSL = hexToHSL(branding.primary_color);
    const accentHSL = hexToHSL(branding.accent_color);

    style.textContent = `:root {
      --brand-primary: ${branding.primary_color};
      --brand-primary-foreground: ${branding.primary_foreground};
      --brand-accent: ${branding.accent_color};
      --brand-accent-foreground: ${branding.accent_foreground};
      --primary: ${primaryHSL};
      --accent: ${accentHSL};
    }
    .dark {
      --primary: ${primaryHSL};
      --accent: ${accentHSL};
    }`;
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
