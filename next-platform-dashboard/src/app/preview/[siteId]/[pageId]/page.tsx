"use client";

import { useEffect, useState } from "react";
import { Editor, Frame, Element } from "@craftjs/core";
import { componentResolver } from "@/components/editor/resolver";
import { Root } from "@/components/editor/user-components/root";

interface PreviewPageProps {
  params: Promise<{ siteId: string; pageId: string }>;
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ siteId: string; pageId: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;

    async function fetchContent() {
      try {
        console.log("[Preview] Fetching content for:", resolvedParams);
        const response = await fetch(`/api/preview/${resolvedParams!.siteId}/${resolvedParams!.pageId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to load page content");
        }
        
        const data = await response.json();
        console.log("[Preview] Received data:", data);
        console.log("[Preview] Content type:", typeof data.content);
        
        if (data.content) {
          // Content is already a JSON string from the API
          setContent(data.content);
          console.log("[Preview] Content set successfully");
        } else {
          console.log("[Preview] No content in response");
          setContent(null);
        }
      } catch (err) {
        console.error("[Preview] Error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [resolvedParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-xl font-medium text-muted-foreground mb-2">No Content</h1>
          <p className="text-muted-foreground">This page has no content yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Editor
        resolver={componentResolver}
        enabled={false}
      >
        <Frame data={content}>
          <Element is={Root} canvas />
        </Frame>
      </Editor>
    </div>
  );
}
