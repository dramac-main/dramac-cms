"use client";

/**
 * Published Site Page
 * 
 * This uses the EXACT same approach as the preview page that works perfectly.
 * Client-side fetch + Craft.js render = guaranteed visual parity.
 */

import { useEffect, useState } from "react";
import { use } from "react";
import { Editor, Frame, Element } from "@craftjs/core";
import { componentResolver } from "@/components/editor/resolver";
import { Root } from "@/components/editor/user-components/root";
import { Loader2, AlertTriangle, FileText } from "lucide-react";

interface SitePageProps {
  params: Promise<{
    domain: string;
    slug?: string[];
  }>;
}

interface SiteData {
  site: {
    id: string;
    name: string;
    subdomain: string;
    customDomain: string | null;
    settings: Record<string, unknown>;
  };
  page: {
    id: string;
    name: string;
    slug: string;
    isHomepage: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    seoImage: string | null;
  };
  content: string | null;
  themeSettings: Record<string, unknown> | null;
}

export default function SitePage({ params }: SitePageProps) {
  const resolvedParams = use(params);
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const domain = resolvedParams.domain;
  const pageSlug = resolvedParams.slug?.join("/") || "";

  useEffect(() => {
    async function fetchSiteData() {
      try {
        // Build the API URL
        const apiUrl = pageSlug 
          ? `/api/site/${domain}/${pageSlug}`
          : `/api/site/${domain}`;
        
        const response = await fetch(apiUrl);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Site or page not found");
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to load site (${response.status})`
          );
        }

        const siteData = await response.json();
        setData(siteData);

        // Update document title
        if (siteData.page?.seoTitle) {
          document.title = siteData.page.seoTitle;
        } else if (siteData.page?.name && siteData.site?.name) {
          document.title = `${siteData.page.name} | ${siteData.site.name}`;
        }
      } catch (err) {
        console.error("[Site] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load site");
      } finally {
        setLoading(false);
      }
    }

    fetchSiteData();
  }, [domain, pageSlug]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2 text-gray-900">
            Unable to Load Site
          </h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No content state
  if (!data?.content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold mb-2 text-gray-900">
            Page Coming Soon
          </h1>
          <p className="text-gray-500">
            This page is being built and will be available shortly.
          </p>
        </div>
      </div>
    );
  }

  // Apply theme settings as CSS custom properties
  const themeVars: Record<string, string> = {};
  if (data.themeSettings) {
    const settings = data.themeSettings as Record<string, string>;
    if (settings.primaryColor) {
      themeVars["--theme-primary"] = settings.primaryColor;
      themeVars["--primary"] = settings.primaryColor;
    }
    if (settings.secondaryColor) {
      themeVars["--theme-secondary"] = settings.secondaryColor;
    }
    if (settings.accentColor) {
      themeVars["--theme-accent"] = settings.accentColor;
    }
    if (settings.fontFamily) {
      themeVars["--theme-font-family"] = settings.fontFamily;
    }
    if (settings.backgroundColor) {
      themeVars["--theme-background"] = settings.backgroundColor;
    }
    if (settings.foregroundColor) {
      themeVars["--theme-text"] = settings.foregroundColor;
    }
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={themeVars as React.CSSProperties}
    >
      <Editor
        resolver={componentResolver}
        enabled={false}
        onRender={({ render }) => render}
      >
        <Frame data={data.content}>
          <Element is={Root} canvas />
        </Frame>
      </Editor>
    </div>
  );
}
