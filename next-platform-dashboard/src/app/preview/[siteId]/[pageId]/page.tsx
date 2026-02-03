"use client";

/**
 * Preview Page - Renders page content using StudioRenderer
 * 
 * @phase STUDIO-27 - Migrated from Puck to StudioRenderer
 */

import { useEffect, useState } from "react";
import { use } from "react";
import { StudioRenderer } from "@/lib/studio/engine/renderer";
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2 text-gray-900">
            No Content Yet
          </h1>
          <p className="text-gray-500">
            This page hasn&apos;t been built yet. Open the Studio to add content.
          </p>
        </div>
      </div>
    );
  }

  // Parse content
  let pageContent: unknown;
  try {
    pageContent = typeof data.content === "string" 
      ? JSON.parse(data.content) 
      : data.content;
  } catch {
    pageContent = {};
  }

  // Render with StudioRenderer
  return (
    <>
      {/* Meta tags */}
      {data.page.metaTitle && (
        <title>{data.page.metaTitle}</title>
      )}
      
      {/* Main content */}
      <StudioRenderer
        data={pageContent}
        themeSettings={data.themeSettings || data.site?.theme_settings}
        siteId={resolvedParams.siteId}
        pageId={resolvedParams.pageId}
        className="min-h-screen"
      />
    </>
  );
}
