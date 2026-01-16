# Phase 70: Sitemap Generation - Automatic SEO Sitemaps

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 MEDIUM
>
> **Estimated Time**: 2-3 hours

---

## 🎯 Objective

Implement automatic sitemap.xml generation for published sites, improving SEO by helping search engines discover and index all pages efficiently.

---

## 📋 Prerequisites

- [ ] Phase 69 Activity Logging completed
- [ ] Site publishing system working
- [ ] Pages are stored in database
- [ ] Custom domain support exists

---

## ⚠️ NOTE: Complements Phase 84 SEO Dashboard

This phase focuses on the **sitemap generation core logic**. Phase 84 (SEO Dashboard) adds the **UI and advanced SEO settings**. They work together:

- **Phase 70**: Sitemap XML generation, robots.txt API routes
- **Phase 84**: SEO dashboard UI, site-wide SEO settings, SEO scoring

Both can be implemented - Phase 70 provides the backend, Phase 84 provides the frontend.

---

## 💼 Business Value

1. **SEO Improvement** - Better search engine indexing
2. **Discoverability** - All pages found by crawlers
3. **Automation** - No manual sitemap maintenance
4. **Professional** - Industry standard SEO practice
5. **Crawl Efficiency** - Search engines find content faster

---

## 📁 Files to Create

```
src/lib/sitemap/
├── sitemap-generator.ts         # Core sitemap generation
├── sitemap-types.ts             # Type definitions
└── robots-generator.ts          # robots.txt generation

src/actions/sitemap/
├── generate-sitemap.ts          # Generate sitemap action
├── get-sitemap.ts               # Fetch sitemap

src/app/api/sites/[siteId]/sitemap/
├── route.ts                     # Sitemap API endpoint

src/app/api/sites/[siteId]/robots/
├── route.ts                     # Robots.txt API endpoint

src/components/seo/
├── sitemap-preview.tsx          # Preview sitemap in settings
├── sitemap-settings.tsx         # Sitemap configuration
```

---

## ✅ Tasks

### Task 70.1: Sitemap Types

**File: `src/lib/sitemap/sitemap-types.ts`**

```typescript
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFrequency;
  priority?: number;
}

export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapOptions {
  baseUrl: string;
  includeLastMod?: boolean;
  includeChangeFreq?: boolean;
  includePriority?: boolean;
  defaultChangeFreq?: ChangeFrequency;
  defaultPriority?: number;
  excludePatterns?: string[];
}

export interface PageSitemapData {
  id: string;
  slug: string;
  name: string;
  updatedAt: Date;
  isPublished: boolean;
  seoSettings?: {
    excludeFromSitemap?: boolean;
    changeFreq?: ChangeFrequency;
    priority?: number;
  };
}

export interface SiteSitemapConfig {
  enabled: boolean;
  includeImages: boolean;
  customUrls: SitemapUrl[];
  excludePages: string[];
  defaultPriority: number;
  defaultChangeFreq: ChangeFrequency;
}

export interface RobotsConfig {
  enabled: boolean;
  allowAll: boolean;
  disallowPaths: string[];
  customRules: string;
  sitemapUrl: string;
}
```

---

### Task 70.2: Sitemap Generator

**File: `src/lib/sitemap/sitemap-generator.ts`**

```typescript
import type { SitemapUrl, SitemapOptions, PageSitemapData, ChangeFrequency } from "./sitemap-types";

// Escape special XML characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Format date to W3C format (YYYY-MM-DD)
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Calculate priority based on page depth
function calculatePriority(slug: string, defaultPriority: number): number {
  if (slug === "" || slug === "/" || slug === "home") {
    return 1.0;
  }
  
  const depth = slug.split("/").filter(Boolean).length;
  const depthPenalty = depth * 0.1;
  
  return Math.max(0.1, Math.min(1.0, defaultPriority - depthPenalty));
}

// Determine change frequency based on page type
function determineChangeFreq(slug: string, defaultFreq: ChangeFrequency): ChangeFrequency {
  if (slug === "" || slug === "/" || slug === "home") {
    return "weekly";
  }
  if (slug.includes("blog") || slug.includes("news")) {
    return "daily";
  }
  if (slug.includes("contact") || slug.includes("about")) {
    return "monthly";
  }
  return defaultFreq;
}

// Generate sitemap URL entry
function generateUrlEntry(url: SitemapUrl, options: SitemapOptions): string {
  const lines: string[] = ["  <url>"];
  
  lines.push(`    <loc>${escapeXml(url.loc)}</loc>`);
  
  if (options.includeLastMod && url.lastmod) {
    lines.push(`    <lastmod>${url.lastmod}</lastmod>`);
  }
  
  if (options.includeChangeFreq && url.changefreq) {
    lines.push(`    <changefreq>${url.changefreq}</changefreq>`);
  }
  
  if (options.includePriority && url.priority !== undefined) {
    lines.push(`    <priority>${url.priority.toFixed(1)}</priority>`);
  }
  
  lines.push("  </url>");
  
  return lines.join("\n");
}

// Check if URL matches exclude pattern
function shouldExclude(slug: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith("*")) {
      return slug.startsWith(pattern.slice(0, -1));
    }
    return slug === pattern;
  });
}

// Generate sitemap from pages
export function generateSitemap(
  pages: PageSitemapData[],
  options: SitemapOptions
): string {
  const urls: SitemapUrl[] = [];
  
  // Filter and process pages
  for (const page of pages) {
    // Skip unpublished pages
    if (!page.isPublished) continue;
    
    // Skip excluded pages
    if (page.seoSettings?.excludeFromSitemap) continue;
    
    // Check exclude patterns
    if (shouldExclude(page.slug, options.excludePatterns || [])) continue;
    
    // Build URL
    const slug = page.slug === "home" || page.slug === "index" ? "" : page.slug;
    const loc = `${options.baseUrl}${slug ? `/${slug}` : ""}`;
    
    // Determine properties
    const changefreq = page.seoSettings?.changeFreq || 
      determineChangeFreq(page.slug, options.defaultChangeFreq || "weekly");
    
    const priority = page.seoSettings?.priority ||
      calculatePriority(page.slug, options.defaultPriority || 0.8);
    
    urls.push({
      loc,
      lastmod: options.includeLastMod ? formatDate(page.updatedAt) : undefined,
      changefreq,
      priority,
    });
  }
  
  // Sort by priority (highest first)
  urls.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  // Generate XML
  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  
  for (const url of urls) {
    xmlLines.push(generateUrlEntry(url, options));
  }
  
  xmlLines.push("</urlset>");
  
  return xmlLines.join("\n");
}

// Generate sitemap index for large sites
export function generateSitemapIndex(
  sitemaps: { loc: string; lastmod?: string }[],
  baseUrl: string
): string {
  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  
  for (const sitemap of sitemaps) {
    xmlLines.push("  <sitemap>");
    xmlLines.push(`    <loc>${escapeXml(sitemap.loc)}</loc>`);
    if (sitemap.lastmod) {
      xmlLines.push(`    <lastmod>${sitemap.lastmod}</lastmod>`);
    }
    xmlLines.push("  </sitemap>");
  }
  
  xmlLines.push("</sitemapindex>");
  
  return xmlLines.join("\n");
}

// Validate sitemap XML
export function validateSitemap(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!xml.includes('<?xml version="1.0"')) {
    errors.push("Missing XML declaration");
  }
  
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    errors.push("Missing or invalid urlset element");
  }
  
  // Count URLs
  const urlCount = (xml.match(/<url>/g) || []).length;
  if (urlCount === 0) {
    errors.push("Sitemap contains no URLs");
  }
  if (urlCount > 50000) {
    errors.push("Sitemap exceeds 50,000 URL limit");
  }
  
  // Check file size (must be under 50MB)
  const sizeInMB = new Blob([xml]).size / (1024 * 1024);
  if (sizeInMB > 50) {
    errors.push("Sitemap exceeds 50MB size limit");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

### Task 70.3: Robots.txt Generator

**File: `src/lib/sitemap/robots-generator.ts`**

```typescript
import type { RobotsConfig } from "./sitemap-types";

export function generateRobotsTxt(config: RobotsConfig): string {
  const lines: string[] = [];
  
  // User-agent directive
  lines.push("User-agent: *");
  
  if (config.allowAll) {
    lines.push("Allow: /");
  } else {
    // Add disallow paths
    for (const path of config.disallowPaths) {
      lines.push(`Disallow: ${path}`);
    }
    
    // If no disallow paths and not allowing all, disallow everything
    if (config.disallowPaths.length === 0) {
      lines.push("Disallow: /");
    }
  }
  
  // Add blank line before sitemap
  lines.push("");
  
  // Sitemap reference
  if (config.sitemapUrl) {
    lines.push(`Sitemap: ${config.sitemapUrl}`);
  }
  
  // Custom rules
  if (config.customRules) {
    lines.push("");
    lines.push("# Custom rules");
    lines.push(config.customRules);
  }
  
  return lines.join("\n");
}

export function parseRobotsTxt(content: string): RobotsConfig {
  const lines = content.split("\n").map((l) => l.trim());
  
  const disallowPaths: string[] = [];
  let allowAll = false;
  let sitemapUrl = "";
  const customLines: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith("Allow: /") && !line.startsWith("Allow: /")) {
      allowAll = true;
    } else if (line.startsWith("Disallow:")) {
      const path = line.replace("Disallow:", "").trim();
      if (path) {
        disallowPaths.push(path);
      }
    } else if (line.startsWith("Sitemap:")) {
      sitemapUrl = line.replace("Sitemap:", "").trim();
    } else if (!line.startsWith("User-agent:") && !line.startsWith("#") && line) {
      customLines.push(line);
    }
  }
  
  return {
    enabled: true,
    allowAll,
    disallowPaths,
    customRules: customLines.join("\n"),
    sitemapUrl,
  };
}

// Default robots.txt for published sites
export function getDefaultRobotsConfig(baseUrl: string): RobotsConfig {
  return {
    enabled: true,
    allowAll: true,
    disallowPaths: [
      "/api/*",
      "/admin/*",
      "/_next/*",
      "/private/*",
    ],
    customRules: "",
    sitemapUrl: `${baseUrl}/sitemap.xml`,
  };
}
```

---

### Task 70.4: Generate Sitemap Server Action

**File: `src/actions/sitemap/generate-sitemap.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSitemap, validateSitemap } from "@/lib/sitemap/sitemap-generator";
import { generateRobotsTxt, getDefaultRobotsConfig } from "@/lib/sitemap/robots-generator";
import type { SitemapOptions, PageSitemapData, SiteSitemapConfig } from "@/lib/sitemap/sitemap-types";

export interface GenerateSitemapResult {
  success: boolean;
  sitemap?: string;
  robots?: string;
  urlCount?: number;
  errors?: string[];
}

export async function generateSitemapAction(siteId: string): Promise<GenerateSitemapResult> {
  const supabase = await createClient();
  
  // Get site info
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, domain, subdomain, settings")
    .eq("id", siteId)
    .single();
  
  if (siteError || !site) {
    return { success: false, errors: ["Site not found"] };
  }
  
  // Determine base URL
  const baseUrl = site.domain
    ? `https://${site.domain}`
    : `https://${site.subdomain}.dramac.app`;
  
  // Get all published pages
  const { data: pages, error: pagesError } = await supabase
    .from("pages")
    .select("id, slug, name, updated_at, is_published, seo_settings")
    .eq("site_id", siteId)
    .eq("is_published", true);
  
  if (pagesError) {
    return { success: false, errors: [pagesError.message] };
  }
  
  // Convert to sitemap data format
  const pageData: PageSitemapData[] = (pages || []).map((page) => ({
    id: page.id,
    slug: page.slug,
    name: page.name,
    updatedAt: new Date(page.updated_at),
    isPublished: page.is_published,
    seoSettings: page.seo_settings,
  }));
  
  // Get sitemap config from site settings
  const sitemapConfig: SiteSitemapConfig = site.settings?.sitemap || {
    enabled: true,
    includeImages: false,
    customUrls: [],
    excludePages: [],
    defaultPriority: 0.8,
    defaultChangeFreq: "weekly",
  };
  
  // Build sitemap options
  const options: SitemapOptions = {
    baseUrl,
    includeLastMod: true,
    includeChangeFreq: true,
    includePriority: true,
    defaultChangeFreq: sitemapConfig.defaultChangeFreq,
    defaultPriority: sitemapConfig.defaultPriority,
    excludePatterns: sitemapConfig.excludePages,
  };
  
  // Generate sitemap
  const sitemapXml = generateSitemap(pageData, options);
  
  // Validate
  const validation = validateSitemap(sitemapXml);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  // Generate robots.txt
  const robotsConfig = getDefaultRobotsConfig(baseUrl);
  const robotsTxt = generateRobotsTxt(robotsConfig);
  
  // Count URLs
  const urlCount = (sitemapXml.match(/<url>/g) || []).length;
  
  return {
    success: true,
    sitemap: sitemapXml,
    robots: robotsTxt,
    urlCount,
  };
}

// Save sitemap settings
export async function saveSitemapSettings(
  siteId: string,
  config: Partial<SiteSitemapConfig>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  // Get current settings
  const { data: site } = await supabase
    .from("sites")
    .select("settings")
    .eq("id", siteId)
    .single();
  
  if (!site) {
    return { success: false, error: "Site not found" };
  }
  
  // Merge sitemap config
  const newSettings = {
    ...site.settings,
    sitemap: {
      ...(site.settings?.sitemap || {}),
      ...config,
    },
  };
  
  // Update site
  const { error } = await supabase
    .from("sites")
    .update({ settings: newSettings })
    .eq("id", siteId);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}
```

---

### Task 70.5: Sitemap API Endpoint

**File: `src/app/api/sites/[siteId]/sitemap/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSitemap } from "@/lib/sitemap/sitemap-generator";
import type { PageSitemapData, SitemapOptions } from "@/lib/sitemap/sitemap-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const supabase = await createClient();
  
  // Get site info
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, domain, subdomain, settings, is_published")
    .eq("id", siteId)
    .single();
  
  if (siteError || !site) {
    return new NextResponse("Site not found", { status: 404 });
  }
  
  // Only serve sitemap for published sites
  if (!site.is_published) {
    return new NextResponse("Site not published", { status: 404 });
  }
  
  // Check if sitemap is enabled
  if (site.settings?.sitemap?.enabled === false) {
    return new NextResponse("Sitemap disabled", { status: 404 });
  }
  
  // Determine base URL
  const baseUrl = site.domain
    ? `https://${site.domain}`
    : `https://${site.subdomain}.dramac.app`;
  
  // Get published pages
  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug, name, updated_at, is_published, seo_settings")
    .eq("site_id", siteId)
    .eq("is_published", true);
  
  const pageData: PageSitemapData[] = (pages || []).map((page) => ({
    id: page.id,
    slug: page.slug,
    name: page.name,
    updatedAt: new Date(page.updated_at),
    isPublished: page.is_published,
    seoSettings: page.seo_settings,
  }));
  
  const options: SitemapOptions = {
    baseUrl,
    includeLastMod: true,
    includeChangeFreq: true,
    includePriority: true,
    defaultChangeFreq: site.settings?.sitemap?.defaultChangeFreq || "weekly",
    defaultPriority: site.settings?.sitemap?.defaultPriority || 0.8,
    excludePatterns: site.settings?.sitemap?.excludePages || [],
  };
  
  const sitemapXml = generateSitemap(pageData, options);
  
  return new NextResponse(sitemapXml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
```

---

### Task 70.6: Robots.txt API Endpoint

**File: `src/app/api/sites/[siteId]/robots/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRobotsTxt, getDefaultRobotsConfig } from "@/lib/sitemap/robots-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const supabase = await createClient();
  
  // Get site info
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, domain, subdomain, settings, is_published")
    .eq("id", siteId)
    .single();
  
  if (siteError || !site) {
    return new NextResponse("Site not found", { status: 404 });
  }
  
  // Determine base URL
  const baseUrl = site.domain
    ? `https://${site.domain}`
    : `https://${site.subdomain}.dramac.app`;
  
  // Get robots config
  let robotsConfig = site.settings?.robots;
  
  if (!robotsConfig) {
    robotsConfig = getDefaultRobotsConfig(baseUrl);
  } else {
    // Ensure sitemap URL is set
    robotsConfig.sitemapUrl = robotsConfig.sitemapUrl || `${baseUrl}/sitemap.xml`;
  }
  
  // For unpublished sites, disallow all
  if (!site.is_published) {
    robotsConfig = {
      ...robotsConfig,
      allowAll: false,
      disallowPaths: ["/"],
    };
  }
  
  const robotsTxt = generateRobotsTxt(robotsConfig);
  
  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
```

---

### Task 70.7: Sitemap Preview Component

**File: `src/components/seo/sitemap-preview.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, ExternalLink, FileCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateSitemapAction } from "@/actions/sitemap/generate-sitemap";

interface SitemapPreviewProps {
  siteId: string;
  baseUrl: string;
}

export function SitemapPreview({ siteId, baseUrl }: SitemapPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [sitemap, setSitemap] = useState<string | null>(null);
  const [urlCount, setUrlCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateSitemap = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateSitemapAction(siteId);

      if (result.success) {
        setSitemap(result.sitemap || null);
        setUrlCount(result.urlCount || 0);
      } else {
        setError(result.errors?.join(", ") || "Failed to generate sitemap");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateSitemap();
  }, [siteId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Sitemap Preview
          </CardTitle>
          {urlCount > 0 && (
            <Badge variant="secondary" className="mt-1">
              {urlCount} URLs
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateSitemap}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`${baseUrl}/sitemap.xml`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            {error}
          </div>
        ) : sitemap ? (
          <ScrollArea className="h-[300px] rounded-md border">
            <pre className="p-4 text-xs font-mono text-muted-foreground">
              {sitemap}
            </pre>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No sitemap generated yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Task 70.8: Sitemap Settings Component

**File: `src/components/seo/sitemap-settings.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Plus, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { saveSitemapSettings } from "@/actions/sitemap/generate-sitemap";
import type { SiteSitemapConfig, ChangeFrequency } from "@/lib/sitemap/sitemap-types";

interface SitemapSettingsProps {
  siteId: string;
  initialConfig: SiteSitemapConfig;
}

export function SitemapSettings({ siteId, initialConfig }: SitemapSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SiteSitemapConfig>(initialConfig);
  const [newExcludePath, setNewExcludePath] = useState("");

  const handleSave = async () => {
    setSaving(true);

    try {
      const result = await saveSitemapSettings(siteId, config);

      if (result.success) {
        toast.success("Sitemap settings saved");
      } else {
        toast.error("Failed to save settings", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const addExcludePath = () => {
    if (!newExcludePath) return;
    
    if (!config.excludePages.includes(newExcludePath)) {
      setConfig({
        ...config,
        excludePages: [...config.excludePages, newExcludePath],
      });
    }
    setNewExcludePath("");
  };

  const removeExcludePath = (path: string) => {
    setConfig({
      ...config,
      excludePages: config.excludePages.filter((p) => p !== path),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sitemap Settings</CardTitle>
        <CardDescription>
          Configure how your sitemap.xml is generated for search engines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/disable */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="sitemap-enabled">Enable Sitemap</Label>
            <p className="text-sm text-muted-foreground">
              Generate and serve sitemap.xml for your site
            </p>
          </div>
          <Switch
            id="sitemap-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) =>
              setConfig({ ...config, enabled: checked })
            }
          />
        </div>

        {/* Default priority */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Default Priority</Label>
            <span className="text-sm font-medium">{config.defaultPriority}</span>
          </div>
          <Slider
            value={[config.defaultPriority * 10]}
            min={1}
            max={10}
            step={1}
            onValueChange={([value]) =>
              setConfig({ ...config, defaultPriority: value / 10 })
            }
          />
          <p className="text-xs text-muted-foreground">
            Priority hint for search engines (0.1 - 1.0)
          </p>
        </div>

        {/* Default change frequency */}
        <div className="space-y-2">
          <Label>Default Change Frequency</Label>
          <Select
            value={config.defaultChangeFreq}
            onValueChange={(value) =>
              setConfig({ ...config, defaultChangeFreq: value as ChangeFrequency })
            }
          >
            <SelectTrigger>
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
        </div>

        {/* Exclude pages */}
        <div className="space-y-2">
          <Label>Exclude Pages</Label>
          <div className="flex gap-2">
            <Input
              placeholder="/page-slug or /prefix*"
              value={newExcludePath}
              onChange={(e) => setNewExcludePath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExcludePath()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={addExcludePath}
              disabled={!newExcludePath}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {config.excludePages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {config.excludePages.map((path) => (
                <Badge key={path} variant="secondary" className="gap-1">
                  {path}
                  <button
                    onClick={() => removeExcludePath(path)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Use * as wildcard (e.g., /admin/*)
          </p>
        </div>

        {/* Include images */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="include-images">Include Images</Label>
            <p className="text-sm text-muted-foreground">
              Add image references to sitemap entries
            </p>
          </div>
          <Switch
            id="include-images"
            checked={config.includeImages}
            onCheckedChange={(checked) =>
              setConfig({ ...config, includeImages: checked })
            }
          />
        </div>

        {/* Save button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Sitemap XML generation is valid
- [ ] Priority calculation works correctly
- [ ] Change frequency detection works
- [ ] Exclude patterns work with wildcards
- [ ] Robots.txt generation is correct

### Integration Tests
- [ ] API returns valid sitemap
- [ ] API returns valid robots.txt
- [ ] Settings save correctly
- [ ] Only published pages included

### E2E Tests
- [ ] Sitemap accessible at /sitemap.xml
- [ ] Robots.txt accessible at /robots.txt
- [ ] Settings UI works
- [ ] Preview shows correct content

---

## ✅ Completion Checklist

- [ ] Sitemap types defined
- [ ] Sitemap generator working
- [ ] Robots.txt generator working
- [ ] Server actions created
- [ ] API endpoints working
- [ ] Sitemap preview component created
- [ ] Sitemap settings component created
- [ ] Caching configured
- [ ] Validation working
- [ ] Tests passing

---

**Next Phase**: Phase 71 - Email Notifications
