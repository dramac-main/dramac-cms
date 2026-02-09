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
          if (!cancelled) setBranding(data);
        }
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
  useEffect(() => {
    if (!branding) return;
    const style = document.createElement("style");
    style.id = "branding-vars";
    style.textContent = `:root {
      --brand-primary: ${branding.primary_color};
      --brand-primary-foreground: ${branding.primary_foreground};
      --brand-accent: ${branding.accent_color};
      --brand-accent-foreground: ${branding.accent_foreground};
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
