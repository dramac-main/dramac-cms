"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Bot,
  ExternalLink,
  RotateCcw,
  Save,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getSiteRobotsTxt,
  updateSiteRobotsTxt,
  getSiteForSeo,
  canEditSiteSeo,
} from "@/lib/seo/seo-service";
import { getDefaultRobotsTxt } from "@/lib/seo/sitemap-generator";

export default function RobotsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [robotsTxt, setRobotsTxt] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [site, setSite] = useState<{
    name: string;
    subdomain: string;
    domain: string | null;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [robotsContent, editPermission, siteInfo] = await Promise.all([
        getSiteRobotsTxt(siteId),
        canEditSiteSeo(),
        getSiteForSeo(siteId),
      ]);
      
      setRobotsTxt(robotsContent || "");
      setCanEdit(editPermission);
      setSite(siteInfo);
    } catch (error) {
      console.error("Failed to load robots.txt:", error);
      toast.error("Failed to load robots.txt");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!canEdit) return;

    setSaving(true);
    try {
      const result = await updateSiteRobotsTxt(siteId, robotsTxt);
      if (result.success) {
        toast.success("Robots.txt saved");
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save robots.txt");
    }
    setSaving(false);
  };

  const handleReset = () => {
    if (!site) return;
    const defaultContent = getDefaultRobotsTxt(site.subdomain, site.domain);
    setRobotsTxt(defaultContent);
    toast.info("Reset to default - don't forget to save");
  };

  const getRobotsUrl = () => {
    if (!site) return "#";
    const baseUrl = site.domain 
      ? `https://${site.domain}` 
      : `https://${site.subdomain}.dramac.app`;
    return `${baseUrl}/robots.txt`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/sites/${siteId}/seo`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6" />
              Robots.txt Editor
            </h1>
            <p className="text-muted-foreground mt-1">
              {site?.name} - Control search engine crawling
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Robots.txt URL */}
        <Card>
          <CardHeader>
            <CardTitle>Robots.txt URL</CardTitle>
            <CardDescription>
              Your robots.txt file location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono">
                {getRobotsUrl()}
              </code>
              <Button variant="outline" size="icon" asChild>
                <a href={getRobotsUrl()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Edit Robots.txt
            </CardTitle>
            <CardDescription>
              Control which pages search engines can crawl
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
              placeholder="# Robots.txt&#10;User-agent: *&#10;Allow: /"
              className="font-mono min-h-[300px]"
              disabled={!canEdit}
            />
            {!canEdit && (
              <p className="text-sm text-muted-foreground mt-2">
                Only agency owners and admins can edit robots.txt
              </p>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>About Robots.txt</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert">
            <p>
              The robots.txt file tells search engine crawlers which URLs they can access on your site.
              This is used mainly to avoid overloading your site with requests.
            </p>
            <h4>Common Directives:</h4>
            <ul>
              <li><code>User-agent: *</code> - Applies to all crawlers</li>
              <li><code>User-agent: Googlebot</code> - Applies only to Google</li>
              <li><code>Allow: /</code> - Allow crawling of all pages</li>
              <li><code>Disallow: /admin/</code> - Block crawling of admin pages</li>
              <li><code>Sitemap: URL</code> - Tell crawlers where your sitemap is</li>
            </ul>
            <h4>Important Notes:</h4>
            <ul>
              <li>Robots.txt is a request, not a command - malicious bots may ignore it</li>
              <li>Don&apos;t use it to hide sensitive information</li>
              <li>Blocking a page doesn&apos;t remove it from search results if it&apos;s linked elsewhere</li>
              <li>Use meta robots tags for page-level control</li>
            </ul>
            <h4>Example:</h4>
            <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
{`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: https://example.com/sitemap.xml`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
