"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface SitemapPreviewProps {
  siteId: string;
  baseUrl: string;
  showLiveLink?: boolean;
}

export function SitemapPreview({
  siteId,
  baseUrl,
  showLiveLink = true,
}: SitemapPreviewProps) {
  const [sitemap, setSitemap] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSitemap = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/sites/${siteId}/sitemap.xml`);
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      
      const xml = await res.text();
      setSitemap(xml);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading sitemap";
      setError(message);
      setSitemap("");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchSitemap();
  }, [fetchSitemap]);

  const handleCopy = async () => {
    if (!sitemap) return;
    
    try {
      await navigator.clipboard.writeText(sitemap);
      setCopied(true);
      toast.success("Sitemap copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Parse sitemap to count URLs
  const urlCount = sitemap ? (sitemap.match(/<url>/g) || []).length : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Sitemap Preview</CardTitle>
          <CardDescription>
            {loading
              ? "Loading..."
              : error
              ? "Failed to load"
              : `${urlCount} URLs indexed`}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={loading || !sitemap}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSitemap}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {showLiveLink && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`${baseUrl}/sitemap.xml`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Live
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSitemap}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[300px] rounded-md border">
            <pre className="text-xs font-mono p-4 whitespace-pre-wrap break-all">
              {sitemap}
            </pre>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
