"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Search,
  Globe,
  FileText,
  Bot,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getSiteSeoSettings,
  updateSiteSeoSettings,
  getPagesSeo,
  getSiteForSeo,
  canEditSiteSeo,
  type SiteSeoSettings,
  type PageSeo,
} from "@/lib/seo/seo-service";
import { analyzeSeo, getScoreColor, getScoreLabel } from "@/lib/seo/seo-analyzer";

export default function SeoPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSeoSettings | null>(null);
  const [pages, setPages] = useState<PageSeo[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [siteName, setSiteName] = useState("");

  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [seoSettings, pagesData, editPermission, siteInfo] = await Promise.all([
        getSiteSeoSettings(siteId),
        getPagesSeo(siteId),
        canEditSiteSeo(),
        getSiteForSeo(siteId),
      ]);
      setSettings(seoSettings);
      setPages(pagesData);
      setCanEdit(editPermission);
      setSiteName(siteInfo?.name || "Site");
    } catch (error) {
      console.error("Failed to load SEO data:", error);
      toast.error("Failed to load SEO settings");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings || !canEdit) return;

    setSaving(true);
    try {
      const result = await updateSiteSeoSettings(siteId, settings);
      if (result.success) {
        toast.success("SEO settings saved");
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  // Calculate overall score
  const overallScore = pages.length > 0
    ? Math.round(
        pages.reduce((sum, p) => {
          const result = analyzeSeo({
            title: p.seoTitle || p.pageName,
            description: p.seoDescription,
            slug: p.slug,
            ogImage: p.ogImageUrl,
            keywords: p.seoKeywords,
          });
          return sum + result.score;
        }, 0) / pages.length
      )
    : 0;

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
          <Link href={`/sites/${siteId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Search className="h-6 w-6" />
              SEO Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {siteName} - Optimize for search engines
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

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className={`text-4xl font-bold ${getScoreColor(overallScore)}`}
              >
                {overallScore}
              </div>
              <div>
                <p className="font-medium">SEO Score</p>
                <p className="text-sm text-muted-foreground">
                  {getScoreLabel(overallScore)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{pages.length}</p>
                <p className="text-sm text-muted-foreground">Published Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href={`/sites/${siteId}/seo/sitemap`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Globe className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">Sitemap</p>
                  <p className="text-sm text-muted-foreground">Configure</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href={`/sites/${siteId}/seo/robots`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Bot className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-medium">Robots.txt</p>
                  <p className="text-sm text-muted-foreground">Edit</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Meta Settings</CardTitle>
              <CardDescription>
                These settings apply to pages without custom SEO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title Template</Label>
                <Input
                  value={settings?.defaultTitleTemplate || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, defaultTitleTemplate: e.target.value })
                  }
                  placeholder="{page_title} | {site_name}"
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{page_title}"} and {"{site_name}"} as placeholders
                </p>
              </div>

              <div className="space-y-2">
                <Label>Default Description</Label>
                <Textarea
                  value={settings?.defaultDescription || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, defaultDescription: e.target.value })
                  }
                  placeholder="Your site's default meta description..."
                  rows={3}
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  {(settings?.defaultDescription?.length || 0)}/160 characters
                  {(settings?.defaultDescription?.length || 0) > 160 && (
                    <span className="text-yellow-600 ml-2">May be truncated</span>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Default Keywords</Label>
                <Input
                  value={settings?.defaultKeywords?.join(", ") || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { 
                      ...s, 
                      defaultKeywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean)
                    })
                  }
                  placeholder="keyword1, keyword2, keyword3"
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of keywords
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Search Indexing</Label>
                  <p className="text-sm text-muted-foreground">
                    Let search engines index your site
                  </p>
                </div>
                <Switch
                  checked={settings?.robotsIndex ?? true}
                  onCheckedChange={(checked) =>
                    setSettings((s) => s && { ...s, robotsIndex: checked })
                  }
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Link Following</Label>
                  <p className="text-sm text-muted-foreground">
                    Let search engines follow links on your site
                  </p>
                </div>
                <Switch
                  checked={settings?.robotsFollow ?? true}
                  onCheckedChange={(checked) =>
                    setSettings((s) => s && { ...s, robotsFollow: checked })
                  }
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>
                Structured data for your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input
                  value={settings?.organizationName || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, organizationName: e.target.value })
                  }
                  placeholder="Your Company Name"
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label>Organization Logo URL</Label>
                <Input
                  value={settings?.organizationLogoUrl || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, organizationLogoUrl: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Sharing</CardTitle>
              <CardDescription>
                How your site appears when shared on social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default OG Image URL</Label>
                <Input
                  value={settings?.ogImageUrl || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, ogImageUrl: e.target.value || null })
                  }
                  placeholder="https://..."
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1200x630px for best display
                </p>
                {settings?.ogImageUrl && (
                  <div className="mt-2 border rounded-lg p-2">
                    <img 
                      src={settings.ogImageUrl} 
                      alt="OG Preview" 
                      className="max-h-32 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Twitter Handle</Label>
                <Input
                  value={settings?.twitterHandle || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, twitterHandle: e.target.value })
                  }
                  placeholder="@yourbrand"
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label>Twitter Card Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={settings?.twitterCardType === "summary" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(s => s && { ...s, twitterCardType: "summary" })}
                    disabled={!canEdit}
                  >
                    Summary
                  </Button>
                  <Button
                    variant={settings?.twitterCardType === "summary_large_image" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(s => s && { ...s, twitterCardType: "summary_large_image" })}
                    disabled={!canEdit}
                  >
                    Large Image
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                How your site will appear on social media
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden max-w-md">
                {settings?.ogImageUrl && (
                  <img 
                    src={settings.ogImageUrl} 
                    alt="Preview" 
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.png';
                    }}
                  />
                )}
                <div className="p-3 bg-muted/50">
                  <p className="text-sm text-muted-foreground truncate">
                    example.com
                  </p>
                  <p className="font-medium truncate">
                    {settings?.defaultTitleTemplate?.replace("{page_title}", "Page Title").replace("{site_name}", siteName) || siteName}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {settings?.defaultDescription || "No description set"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Verification</CardTitle>
              <CardDescription>
                Verify ownership with search engines to access their webmaster tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Search Console</Label>
                <Input
                  value={settings?.googleSiteVerification || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, googleSiteVerification: e.target.value })
                  }
                  placeholder="Enter verification code"
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  Get this from Google Search Console → Settings → Ownership verification
                </p>
              </div>

              <div className="space-y-2">
                <Label>Bing Webmaster Tools</Label>
                <Input
                  value={settings?.bingSiteVerification || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, bingSiteVerification: e.target.value })
                  }
                  placeholder="Enter verification code"
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  Get this from Bing Webmaster Tools
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Integration</CardTitle>
              <CardDescription>
                Connect analytics and tracking tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input
                  value={settings?.googleAnalyticsId || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, googleAnalyticsId: e.target.value })
                  }
                  placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  Supports both GA4 (G-) and Universal Analytics (UA-) IDs
                </p>
              </div>

              <div className="space-y-2">
                <Label>Facebook Pixel ID</Label>
                <Input
                  value={settings?.facebookPixelId || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, facebookPixelId: e.target.value })
                  }
                  placeholder="Enter pixel ID"
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  For Facebook/Meta ads tracking and conversion optimization
                </p>
              </div>

              {!canEdit && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Analytics codes are only visible to agency owners and admins.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page SEO Analysis</CardTitle>
              <CardDescription>
                SEO status for each published page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pages.map((page) => {
                  const result = analyzeSeo({
                    title: page.seoTitle || page.pageName,
                    description: page.seoDescription,
                    slug: page.slug,
                    ogImage: page.ogImageUrl,
                    keywords: page.seoKeywords,
                  });

                  return (
                    <div
                      key={page.pageId}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {result.score >= 80 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : result.score >= 50 ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{page.pageName}</p>
                          <p className="text-sm text-muted-foreground">/{page.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={`font-bold ${getScoreColor(result.score)}`}>
                            {result.score}/100
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {result.issues.length} issue{result.issues.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/sites/${siteId}/seo/pages?page=${page.pageId}`}>
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {pages.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No published pages yet
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href={`/sites/${siteId}/builder`}>
                        Create Your First Page
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {pages.length > 0 && (
            <div className="flex justify-center">
              <Button variant="outline" asChild>
                <Link href={`/sites/${siteId}/seo/pages`}>
                  View All Page SEO Settings
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
