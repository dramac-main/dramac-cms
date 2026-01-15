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
        const response = await fetch(`/api/preview/${resolvedParams!.siteId}/${resolvedParams!.pageId}`);
        if (!response.ok) {
          throw new Error("Failed to load page content");
        }
        const data = await response.json();
        setContent(data.content);
      } catch (err) {
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

  return (
    <div className="min-h-screen bg-white">
      <Editor
        resolver={componentResolver}
        enabled={false}
      >
        <Frame data={content || undefined}>
          <Element is={Root} canvas />
        </Frame>
      </Editor>
    </div>
  );
}
