# Phase 84: SEO Dashboard

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 IMPORTANT
>
> **Estimated Time**: 8-10 hours

---

## 🎯 Objective

Create a comprehensive SEO management dashboard for sites:
1. **Site SEO Settings** - Default meta tags, social sharing
2. **Page SEO** - Per-page meta tags, keywords, OG images
3. **Sitemap** - Auto-generated XML sitemap
4. **Robots.txt** - Customizable robots.txt
5. **SEO Analysis** - Score pages for SEO best practices

---

## 📋 Prerequisites

- [ ] Site management working
- [ ] Page system working
- [ ] Blog system (for blog URLs)
- [ ] Site publishing

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ `sites` table has: `seo_title`, `seo_description`, `seo_image`
- ✅ `pages` table has: `seo_title`, `seo_description`, `seo_image`
- ✅ Blog posts have SEO fields
- ✅ Basic site settings

**What's Missing:**
- SEO dashboard UI
- Additional SEO fields (analytics codes, verification, etc.)
- Sitemap generation
- Robots.txt management
- SEO score/analysis
- Social sharing previews

---

## ⚠️ IMPORTANT: EXTEND EXISTING TABLES

**DO NOT duplicate SEO fields!** The `sites` and `pages` tables already have `seo_title`, `seo_description`, `seo_image`.

We will:
1. ✅ **ADD missing columns** to `sites` table (analytics, verification, robots settings)
2. ✅ **ADD missing columns** to `pages` table (og fields, robots per-page)
3. ✅ **CREATE `site_seo_settings`** only for ADVANCED settings (to avoid bloating sites table)

---

## 💼 Business Value

1. **Search Rankings** - Better SEO = more organic traffic
2. **Agency Service** - SEO optimization as service
3. **Client Value** - Clients need SEO to succeed
4. **Competitive Edge** - Built-in SEO tools
5. **Discoverability** - Social sharing works correctly

---

## 📁 Files to Create

```
src/app/(dashboard)/sites/[siteId]/seo/
├── page.tsx                    # SEO dashboard
├── pages/page.tsx              # Page-by-page SEO
├── sitemap/page.tsx            # Sitemap settings
├── robots/page.tsx             # Robots.txt editor

src/lib/seo/
├── seo-service.ts              # SEO settings CRUD
├── seo-analyzer.ts             # SEO scoring
├── sitemap-generator.ts        # XML sitemap

src/components/seo/
├── seo-form.tsx                # SEO settings form
├── seo-preview.tsx             # Google/social preview
├── seo-score.tsx               # SEO score display
├── page-seo-list.tsx           # Page SEO table

src/app/sites/[subdomain]/
├── sitemap.xml/route.ts        # Dynamic sitemap
├── robots.txt/route.ts         # Dynamic robots
```

---

## ✅ Tasks

### Task 84.1: Database Schema (EXTEND existing tables!)

**File: `migrations/seo-tables.sql`**

```sql
-- EXTEND existing sites table with advanced SEO fields
ALTER TABLE sites ADD COLUMN IF NOT EXISTS google_analytics_id TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS google_site_verification TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS bing_site_verification TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS robots_txt TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS sitemap_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS sitemap_changefreq TEXT DEFAULT 'weekly';

-- Site SEO settings for advanced/additional fields
-- (We use a separate table to avoid bloating sites table too much)
CREATE TABLE IF NOT EXISTS site_seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Title template
  default_title_template TEXT DEFAULT '{page_title} | {site_name}',
  default_description TEXT,
  default_keywords TEXT[],
  
  -- Social sharing
  og_image_url TEXT,
  twitter_card_type TEXT DEFAULT 'summary_large_image',
  
  -- Robots defaults
  robots_index BOOLEAN DEFAULT TRUE,
  robots_follow BOOLEAN DEFAULT TRUE,
  
  -- Structured data
  organization_name TEXT,
  organization_logo_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXTEND existing pages table (NOT page_content - pages is the main table)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_title TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_image_url TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS robots_index BOOLEAN DEFAULT TRUE;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS robots_follow BOOLEAN DEFAULT TRUE;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];

-- SEO audit logs
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  
  score INTEGER, -- 0-100
  issues JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_site_seo_settings_site ON site_seo_settings(site_id);
CREATE INDEX idx_seo_audits_site ON seo_audits(site_id);
CREATE INDEX idx_seo_audits_page ON seo_audits(page_id);
```

---

### Task 84.2: SEO Service

**File: `src/lib/seo/seo-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export interface SiteSeoSettings {
  id: string;
  siteId: string;
  defaultTitleTemplate: string;
  defaultDescription: string | null;
  defaultKeywords: string[];
  ogImageUrl: string | null;
  twitterCardType: "summary" | "summary_large_image";
  twitterHandle: string | null;
  googleSiteVerification: string | null;
  bingSiteVerification: string | null;
  googleAnalyticsId: string | null;
  facebookPixelId: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  organizationName: string | null;
  organizationLogoUrl: string | null;
}

export interface PageSeo {
  pageId: string;
  pageName: string;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalUrl: string | null;
  score?: number;
}

export async function getSiteSeoSettings(siteId: string): Promise<SiteSeoSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_seo_settings")
    .select("*")
    .eq("site_id", siteId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[SEO] Error:", error);
    return null;
  }

  if (!data) {
    // Create default settings
    const { data: newData } = await supabase
      .from("site_seo_settings")
      .insert({ site_id: siteId })
      .select()
      .single();

    if (newData) {
      return mapToSettings(newData);
    }
    return null;
  }

  return mapToSettings(data);
}

export async function updateSiteSeoSettings(
  siteId: string,
  updates: Partial<{
    defaultTitleTemplate: string;
    defaultDescription: string;
    defaultKeywords: string[];
    ogImageUrl: string | null;
    twitterCardType: "summary" | "summary_large_image";
    twitterHandle: string;
    googleSiteVerification: string;
    bingSiteVerification: string;
    googleAnalyticsId: string;
    facebookPixelId: string;
    robotsIndex: boolean;
    robotsFollow: boolean;
    organizationName: string;
    organizationLogoUrl: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.defaultTitleTemplate !== undefined) dbUpdates.default_title_template = updates.defaultTitleTemplate;
  if (updates.defaultDescription !== undefined) dbUpdates.default_description = updates.defaultDescription;
  if (updates.defaultKeywords !== undefined) dbUpdates.default_keywords = updates.defaultKeywords;
  if (updates.ogImageUrl !== undefined) dbUpdates.og_image_url = updates.ogImageUrl;
  if (updates.twitterCardType !== undefined) dbUpdates.twitter_card_type = updates.twitterCardType;
  if (updates.twitterHandle !== undefined) dbUpdates.twitter_handle = updates.twitterHandle;
  if (updates.googleSiteVerification !== undefined) dbUpdates.google_site_verification = updates.googleSiteVerification;
  if (updates.bingSiteVerification !== undefined) dbUpdates.bing_site_verification = updates.bingSiteVerification;
  if (updates.googleAnalyticsId !== undefined) dbUpdates.google_analytics_id = updates.googleAnalyticsId;
  if (updates.facebookPixelId !== undefined) dbUpdates.facebook_pixel_id = updates.facebookPixelId;
  if (updates.robotsIndex !== undefined) dbUpdates.robots_index = updates.robotsIndex;
  if (updates.robotsFollow !== undefined) dbUpdates.robots_follow = updates.robotsFollow;
  if (updates.organizationName !== undefined) dbUpdates.organization_name = updates.organizationName;
  if (updates.organizationLogoUrl !== undefined) dbUpdates.organization_logo_url = updates.organizationLogoUrl;

  const { error } = await supabase
    .from("site_seo_settings")
    .update(dbUpdates)
    .eq("site_id", siteId);

  if (error) {
    return { success: false, error: "Failed to update settings" };
  }

  return { success: true };
}

export async function getPagesSeo(siteId: string): Promise<PageSeo[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pages")
    .select("id, name, slug, seo_title, seo_description, seo_keywords, og_title, og_description, og_image_url, robots_index, robots_follow, canonical_url")
    .eq("site_id", siteId)
    .eq("status", "published")
    .order("name");

  if (error || !data) {
    return [];
  }

  return data.map((p) => ({
    pageId: p.id,
    pageName: p.name,
    slug: p.slug,
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
    seoKeywords: p.seo_keywords || [],
    ogTitle: p.og_title,
    ogDescription: p.og_description,
    ogImageUrl: p.og_image_url,
    robotsIndex: p.robots_index ?? true,
    robotsFollow: p.robots_follow ?? true,
    canonicalUrl: p.canonical_url,
  }));
}

export async function updatePageSeo(
  pageId: string,
  updates: Partial<{
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string[];
    ogTitle: string;
    ogDescription: string;
    ogImageUrl: string | null;
    robotsIndex: boolean;
    robotsFollow: boolean;
    canonicalUrl: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const dbUpdates: Record<string, unknown> = {};

  if (updates.seoTitle !== undefined) dbUpdates.seo_title = updates.seoTitle;
  if (updates.seoDescription !== undefined) dbUpdates.seo_description = updates.seoDescription;
  if (updates.seoKeywords !== undefined) dbUpdates.seo_keywords = updates.seoKeywords;
  if (updates.ogTitle !== undefined) dbUpdates.og_title = updates.ogTitle;
  if (updates.ogDescription !== undefined) dbUpdates.og_description = updates.ogDescription;
  if (updates.ogImageUrl !== undefined) dbUpdates.og_image_url = updates.ogImageUrl;
  if (updates.robotsIndex !== undefined) dbUpdates.robots_index = updates.robotsIndex;
  if (updates.robotsFollow !== undefined) dbUpdates.robots_follow = updates.robotsFollow;
  if (updates.canonicalUrl !== undefined) dbUpdates.canonical_url = updates.canonicalUrl;

  const { error } = await supabase
    .from("pages")
    .update(dbUpdates)
    .eq("id", pageId);

  if (error) {
    return { success: false, error: "Failed to update page SEO" };
  }

  return { success: true };
}

function mapToSettings(data: Record<string, unknown>): SiteSeoSettings {
  return {
    id: data.id as string,
    siteId: data.site_id as string,
    defaultTitleTemplate: (data.default_title_template as string) || "{page_title} | {site_name}",
    defaultDescription: data.default_description as string | null,
    defaultKeywords: (data.default_keywords as string[]) || [],
    ogImageUrl: data.og_image_url as string | null,
    twitterCardType: (data.twitter_card_type as "summary" | "summary_large_image") || "summary_large_image",
    twitterHandle: data.twitter_handle as string | null,
    googleSiteVerification: data.google_site_verification as string | null,
    bingSiteVerification: data.bing_site_verification as string | null,
    googleAnalyticsId: data.google_analytics_id as string | null,
    facebookPixelId: data.facebook_pixel_id as string | null,
    robotsIndex: data.robots_index as boolean,
    robotsFollow: data.robots_follow as boolean,
    organizationName: data.organization_name as string | null,
    organizationLogoUrl: data.organization_logo_url as string | null,
  };
}
```

---

### Task 84.3: SEO Analyzer

**File: `src/lib/seo/seo-analyzer.ts`**

```typescript
export interface SeoIssue {
  type: "error" | "warning" | "info";
  field: string;
  message: string;
  suggestion: string;
}

export interface SeoAuditResult {
  score: number;
  issues: SeoIssue[];
  passed: string[];
}

export function analyzeSeo(page: {
  title: string;
  description?: string | null;
  content?: string | null;
  slug: string;
  ogImage?: string | null;
  keywords?: string[];
}): SeoAuditResult {
  const issues: SeoIssue[] = [];
  const passed: string[] = [];

  // Title checks
  if (!page.title) {
    issues.push({
      type: "error",
      field: "title",
      message: "Missing page title",
      suggestion: "Add a descriptive page title (50-60 characters)",
    });
  } else if (page.title.length < 30) {
    issues.push({
      type: "warning",
      field: "title",
      message: "Title is too short",
      suggestion: "Expand title to 50-60 characters for better SEO",
    });
  } else if (page.title.length > 60) {
    issues.push({
      type: "warning",
      field: "title",
      message: "Title may be truncated in search results",
      suggestion: "Shorten title to under 60 characters",
    });
  } else {
    passed.push("Title length is optimal");
  }

  // Description checks
  if (!page.description) {
    issues.push({
      type: "error",
      field: "description",
      message: "Missing meta description",
      suggestion: "Add a compelling description (150-160 characters)",
    });
  } else if (page.description.length < 100) {
    issues.push({
      type: "warning",
      field: "description",
      message: "Description is too short",
      suggestion: "Expand description to 150-160 characters",
    });
  } else if (page.description.length > 160) {
    issues.push({
      type: "warning",
      field: "description",
      message: "Description may be truncated",
      suggestion: "Shorten description to under 160 characters",
    });
  } else {
    passed.push("Meta description length is optimal");
  }

  // OG Image
  if (!page.ogImage) {
    issues.push({
      type: "warning",
      field: "ogImage",
      message: "Missing Open Graph image",
      suggestion: "Add an image for social sharing (1200x630px recommended)",
    });
  } else {
    passed.push("Open Graph image is set");
  }

  // Content checks
  if (page.content) {
    const wordCount = page.content.replace(/<[^>]+>/g, " ").split(/\s+/).length;

    if (wordCount < 300) {
      issues.push({
        type: "warning",
        field: "content",
        message: "Page has thin content",
        suggestion: "Add more content (aim for 500+ words)",
      });
    } else {
      passed.push(`Content has ${wordCount} words`);
    }

    // Check for headings
    const hasH1 = /<h1[^>]*>/i.test(page.content);
    if (!hasH1) {
      issues.push({
        type: "warning",
        field: "headings",
        message: "Missing H1 heading",
        suggestion: "Add a main H1 heading to your page",
      });
    } else {
      passed.push("H1 heading present");
    }

    // Check for images without alt text
    const imagesWithoutAlt = (page.content.match(/<img[^>]*>/gi) || []).filter(
      (img) => !img.includes("alt=") || img.includes('alt=""')
    );
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: "warning",
        field: "images",
        message: `${imagesWithoutAlt.length} image(s) missing alt text`,
        suggestion: "Add descriptive alt text to all images",
      });
    } else {
      passed.push("All images have alt text");
    }
  }

  // Keywords
  if (!page.keywords || page.keywords.length === 0) {
    issues.push({
      type: "info",
      field: "keywords",
      message: "No focus keywords set",
      suggestion: "Add 3-5 relevant keywords for this page",
    });
  } else {
    passed.push(`${page.keywords.length} keywords set`);
  }

  // Slug check
  if (page.slug.includes("_") || page.slug.includes(" ")) {
    issues.push({
      type: "warning",
      field: "slug",
      message: "URL slug contains underscores or spaces",
      suggestion: "Use hyphens in URLs for better SEO",
    });
  } else {
    passed.push("URL slug is SEO-friendly");
  }

  // Calculate score
  const errorCount = issues.filter((i) => i.type === "error").length;
  const warningCount = issues.filter((i) => i.type === "warning").length;
  const infoCount = issues.filter((i) => i.type === "info").length;

  let score = 100;
  score -= errorCount * 20;
  score -= warningCount * 10;
  score -= infoCount * 5;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    issues,
    passed,
  };
}
```

---

### Task 84.4: Sitemap Generator

**File: `src/lib/seo/sitemap-generator.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
  images?: { loc: string; title?: string }[];
}

export async function generateSitemap(
  siteId: string,
  baseUrl: string
): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const urls: SitemapUrl[] = [];

  // Get site settings
  const { data: site } = await supabase
    .from("sites")
    .select("sitemap_changefreq, sitemap_include_images")
    .eq("id", siteId)
    .single();

  const changefreq = site?.sitemap_changefreq || "weekly";
  const includeImages = site?.sitemap_include_images ?? true;

  // Get published pages
  const { data: pages } = await supabase
    .from("pages")
    .select("slug, updated_at, robots_index, content")
    .eq("site_id", siteId)
    .eq("status", "published")
    .neq("robots_index", false);

  if (pages) {
    for (const page of pages) {
      const url: SitemapUrl = {
        loc: `${baseUrl}/${page.slug === "home" ? "" : page.slug}`,
        lastmod: page.updated_at,
        changefreq,
        priority: page.slug === "home" ? 1.0 : 0.8,
      };

      // Extract images from content if enabled
      if (includeImages && page.content) {
        const content = JSON.stringify(page.content);
        const imageMatches = content.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|gif|webp)/gi);
        if (imageMatches) {
          url.images = imageMatches.slice(0, 10).map((src) => ({ loc: src }));
        }
      }

      urls.push(url);
    }
  }

  // Get published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, featured_image_url")
    .eq("site_id", siteId)
    .eq("status", "published");

  if (posts) {
    for (const post of posts) {
      const url: SitemapUrl = {
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updated_at,
        changefreq: "monthly",
        priority: 0.7,
      };

      if (includeImages && post.featured_image_url) {
        url.images = [{ loc: post.featured_image_url }];
      }

      urls.push(url);
    }
  }

  // Blog index
  urls.push({
    loc: `${baseUrl}/blog`,
    changefreq: "daily",
    priority: 0.6,
  });

  // Generate XML
  return generateSitemapXml(urls);
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlsXml = urls
    .map((url) => {
      let urlXml = `  <url>
    <loc>${escapeXml(url.loc)}</loc>`;

      if (url.lastmod) {
        urlXml += `
    <lastmod>${new Date(url.lastmod).toISOString().split("T")[0]}</lastmod>`;
      }

      if (url.changefreq) {
        urlXml += `
    <changefreq>${url.changefreq}</changefreq>`;
      }

      if (url.priority !== undefined) {
        urlXml += `
    <priority>${url.priority.toFixed(1)}</priority>`;
      }

      if (url.images && url.images.length > 0) {
        for (const image of url.images) {
          urlXml += `
    <image:image>
      <image:loc>${escapeXml(image.loc)}</image:loc>
    </image:image>`;
        }
      }

      urlXml += `
  </url>`;

      return urlXml;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

---

### Task 84.5: SEO Dashboard Page

**File: `src/app/(dashboard)/sites/[siteId]/seo/page.tsx`**

```tsx
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Search,
  Globe,
  FileText,
  Settings,
  Bot,
  Share2,
  BarChart3,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  getSiteSeoSettings,
  updateSiteSeoSettings,
  getPagesSeo,
  type SiteSeoSettings,
  type PageSeo,
} from "@/lib/seo/seo-service";
import { analyzeSeo } from "@/lib/seo/seo-analyzer";

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [seoSettings, pagesData] = await Promise.all([
      getSiteSeoSettings(siteId),
      getPagesSeo(siteId),
    ]);
    setSettings(seoSettings);
    setPages(pagesData);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    const result = await updateSiteSeoSettings(siteId, settings);
    setSaving(false);

    if (result.success) {
      toast.success("SEO settings saved");
    } else {
      toast.error(result.error || "Failed to save");
    }
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
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            SEO Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Optimize your site for search engines
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className={`text-4xl font-bold ${
                  overallScore >= 80
                    ? "text-green-600"
                    : overallScore >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {overallScore}
              </div>
              <div>
                <p className="font-medium">SEO Score</p>
                <p className="text-sm text-muted-foreground">Overall</p>
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
                <p className="text-sm text-muted-foreground">Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50">
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

        <Card className="cursor-pointer hover:bg-muted/50">
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
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="social">Social Sharing</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="pages">Page SEO</TabsTrigger>
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
                />
                <p className="text-xs text-muted-foreground">
                  {(settings?.defaultDescription?.length || 0)}/160 characters
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
                    setSettings((s) => s && { ...s, ogImageUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1200x630px
                </p>
              </div>

              <div className="space-y-2">
                <Label>Twitter Handle</Label>
                <Input
                  value={settings?.twitterHandle || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, twitterHandle: e.target.value })
                  }
                  placeholder="@yourbrand"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Verification</CardTitle>
              <CardDescription>
                Verify ownership with search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Site Verification</Label>
                <Input
                  value={settings?.googleSiteVerification || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, googleSiteVerification: e.target.value })
                  }
                  placeholder="Enter verification code"
                />
              </div>

              <div className="space-y-2">
                <Label>Bing Site Verification</Label>
                <Input
                  value={settings?.bingSiteVerification || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, bingSiteVerification: e.target.value })
                  }
                  placeholder="Enter verification code"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Integration</CardTitle>
              <CardDescription>
                Connect analytics and tracking
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
                />
              </div>

              <div className="space-y-2">
                <Label>Facebook Pixel ID</Label>
                <Input
                  value={settings?.facebookPixelId || ""}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, facebookPixelId: e.target.value })
                  }
                  placeholder="Enter pixel ID"
                />
              </div>
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
                      className="flex items-center justify-between p-3 border rounded-lg"
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
                        <span
                          className={`font-bold ${
                            result.score >= 80
                              ? "text-green-600"
                              : result.score >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.score}/100
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/sites/${siteId}/seo/pages?page=${page.pageId}`}>
                            Edit SEO
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {pages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No published pages yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### Task 84.6: Dynamic Sitemap Route

**File: `src/app/sites/[subdomain]/sitemap.xml/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateSitemap } from "@/lib/seo/sitemap-generator";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params;

  // Get site
  const { data: site } = await supabase
    .from("sites")
    .select("id, custom_domain, sitemap_enabled")
    .eq("subdomain", subdomain)
    .eq("is_published", true)
    .single();

  if (!site || !site.sitemap_enabled) {
    return new NextResponse("Sitemap not available", { status: 404 });
  }

  // Determine base URL
  const baseUrl = site.custom_domain
    ? `https://${site.custom_domain}`
    : `https://${subdomain}.dramac.app`;

  const sitemap = await generateSitemap(site.id, baseUrl);

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
```

---

### Task 84.7: Dynamic Robots.txt Route

**File: `src/app/sites/[subdomain]/robots.txt/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params;

  // Get site
  const { data: site } = await supabase
    .from("sites")
    .select("id, robots_txt, custom_domain")
    .eq("subdomain", subdomain)
    .eq("is_published", true)
    .single();

  if (!site) {
    return new NextResponse("Site not found", { status: 404 });
  }

  // Use custom robots.txt or generate default
  const robotsTxt =
    site.robots_txt ||
    `# Robots.txt for ${subdomain}
User-agent: *
Allow: /

# Sitemap
Sitemap: https://${site.custom_domain || `${subdomain}.dramac.app`}/sitemap.xml

# Disallow admin paths
Disallow: /api/
Disallow: /_next/
`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] SEO analyzer scoring
- [ ] Sitemap XML generation
- [ ] Title template parsing

### Integration Tests
- [ ] SEO settings save/load
- [ ] Page SEO updates
- [ ] Sitemap includes all pages

### E2E Tests
- [ ] Update site SEO settings
- [ ] View page SEO scores
- [ ] Access public sitemap.xml
- [ ] Access public robots.txt

---

## ✅ Completion Checklist

- [ ] Database schema for SEO
- [ ] SEO service (CRUD)
- [ ] SEO analyzer
- [ ] Sitemap generator
- [ ] SEO dashboard page
- [ ] Social sharing settings
- [ ] Verification codes
- [ ] Analytics integration
- [ ] Dynamic sitemap route
- [ ] Dynamic robots.txt route
- [ ] Page SEO analysis list

---

**Next Phase**: Phase 85 - Client Portal
