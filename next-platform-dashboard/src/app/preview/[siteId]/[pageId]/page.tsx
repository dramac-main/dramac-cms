"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Editor, Frame, Element } from "@craftjs/core";
import { componentResolver } from "@/components/editor/resolver";
import { Root } from "@/components/editor/user-components/root";
import { Loader2, AlertTriangle, FileText } from "lucide-react";

interface PreviewPageProps {
  params: Promise<{ siteId: string; pageId: string }>;
}

interface PreviewData {
  page: {
    id: string;
    name: string;
    slug: string;
    metaTitle: string | null;
    metaDescription: string | null;
  };
  site: {
    id: string;
    name: string;
    subdomain: string;
    theme_settings: Record<string, unknown> | null;
  } | null;
  content: string | null;
  themeSettings: Record<string, unknown> | null;
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const resolvedParams = use(params);
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const response = await fetch(
          `/api/preview/${resolvedParams.siteId}/${resolvedParams.pageId}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to load preview (${response.status})`
          );
        }

        const previewData = await response.json();
        setData(previewData);
      } catch (err) {
        console.error("[Preview] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load preview");
      } finally {
        setLoading(false);
      }
    }

    fetchPreview();
  }, [resolvedParams.siteId, resolvedParams.pageId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading preview...</p>
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
            Preview Error
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
            No Content Yet
          </h1>
          <p className="text-gray-500">
            This page doesn't have any content. Open the editor to add
            components.
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
    }
    if (settings.fontFamily) {
      themeVars["--theme-font-family"] = settings.fontFamily;
    }
  }

  return (
    <>
      {/* Document title update */}
      {typeof document !== "undefined" && data.page.metaTitle && (
        <title>{data.page.metaTitle}</title>
      )}

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
    </>
  );
}
