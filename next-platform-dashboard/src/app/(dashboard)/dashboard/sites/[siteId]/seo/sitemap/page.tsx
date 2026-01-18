"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Globe,
  RefreshCw,
  ExternalLink,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getSiteSitemapSettings,
  updateSiteSitemapSettings,
  getSiteForSeo,
  canEditSiteSeo,
} from "@/lib/seo/seo-service";

export default function SitemapPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    changefreq: "weekly",
    includeImages: true,
  });
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
      const [sitemapSettings, editPermission, siteInfo] = await Promise.all([
        getSiteSitemapSettings(siteId),
        canEditSiteSeo(),
        getSiteForSeo(siteId),
      ]);
      
      if (sitemapSettings) {
        setSettings(sitemapSettings);
      }
      setCanEdit(editPermission);
      setSite(siteInfo);
    } catch (error) {
      console.error("Failed to load sitemap settings:", error);
      toast.error("Failed to load settings");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!canEdit) return;

    setSaving(true);
    try {
      const result = await updateSiteSitemapSettings(siteId, settings);
      if (result.success) {
        toast.success("Sitemap settings saved");
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  const getSitemapUrl = () => {
    if (!site) return "#";
    const baseUrl = site.domain 
      ? `https://${site.domain}` 
      : `https://${site.subdomain}.dramac.app`;
    return `${baseUrl}/sitemap.xml`;
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
          <Link href={`/dashboard/sites/${siteId}/seo`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6" />
              Sitemap Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              {site?.name} - Configure XML sitemap generation
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {/* Sitemap URL */}
        <Card>
          <CardHeader>
            <CardTitle>Sitemap URL</CardTitle>
            <CardDescription>
              Your automatically generated sitemap
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono">
                {getSitemapUrl()}
              </code>
              <Button variant="outline" size="icon" asChild>
                <a href={getSitemapUrl()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Submit this URL to Google Search Console and Bing Webmaster Tools
            </p>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sitemap Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Sitemap</Label>
                <p className="text-sm text-muted-foreground">
                  Make your sitemap available to search engines
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, enabled: checked }))}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label>Change Frequency</Label>
              <Select
                value={settings.changefreq}
                onValueChange={(value) => setSettings(s => ({ ...s, changefreq: value }))}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Always</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How often search engines should check for updates
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Include Images</Label>
                <p className="text-sm text-muted-foreground">
                  Add image URLs to sitemap for image search
                </p>
              </div>
              <Switch
                checked={settings.includeImages}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, includeImages: checked }))}
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>About XML Sitemaps</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert">
            <p>
              An XML sitemap helps search engines discover and crawl your site&apos;s pages efficiently.
              It includes information about each URL like when it was last modified and how important it is.
            </p>
            <h4>What&apos;s included in your sitemap:</h4>
            <ul>
              <li>All published pages</li>
              <li>Blog posts (if you have a blog)</li>
              <li>Blog index page</li>
              <li>Images from your content (optional)</li>
            </ul>
            <h4>Best practices:</h4>
            <ul>
              <li>Submit your sitemap to Google Search Console</li>
              <li>Submit to Bing Webmaster Tools</li>
              <li>Keep pages with noindex removed from sitemap</li>
              <li>Update sitemap when publishing new content</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
