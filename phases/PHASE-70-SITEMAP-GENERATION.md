# Phase 70: Sitemap Generation - ADD API Routes

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 LOW (Core generation exists!)
>
> **Estimated Time**: 30 minutes - 1 hour

---

## ⚠️ CRITICAL: SITEMAP GENERATOR ALREADY EXISTS!

**The core sitemap generation is implemented:**
- ✅ `src/lib/seo/sitemap-generator.ts` (300 lines)
- ✅ `generateSitemap(siteId, baseUrl)` function
- ✅ `SitemapUrl` interface
- ✅ Blog post sitemap support
- ✅ Image sitemap support

**What Already Exists:**
```typescript
// src/lib/seo/sitemap-generator.ts
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: SitemapImage[];
}

export async function generateSitemap(siteId: string, baseUrl: string): Promise<string>
```

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAMES!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `site_modules` | `site_module_installations` |
| `modules` | `modules_v2` |

---

## 🎯 Objective

ADD API routes to serve sitemap.xml and robots.txt. Core generation logic exists!

---

## 📋 Prerequisites

- [ ] `src/lib/seo/sitemap-generator.ts` exists (it does!)
- [ ] Sites have subdomain/custom domain support
- [ ] Site publishing works

---

## ✅ Tasks

### Task 70.1: Verify Existing Implementation

**The sitemap generator exists at `src/lib/seo/sitemap-generator.ts`:**

```typescript
// Already exists!
export async function generateSitemap(siteId: string, baseUrl: string): Promise<string>

// Features already implemented:
// - Page URLs with lastmod
// - Blog post URLs (if blog module enabled)
// - Image sitemaps
// - Priority based on page type
// - Changefreq from site settings
```

---

### Task 70.2: Sitemap API Route

**File: `src/app/api/sites/[siteId]/sitemap.xml/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSitemap } from "@/lib/seo/sitemap-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const supabase = await createClient();

  // Get site info
  const { data: site } = await supabase
    .from("sites")
    .select("subdomain, custom_domain, status")
    .eq("id", siteId)
    .single();

  if (!site) {
    return new NextResponse("Site not found", { status: 404 });
  }

  // Determine base URL
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";
  const baseUrl = site.custom_domain
    ? `https://${site.custom_domain}`
    : `https://${site.subdomain}.${baseDomain}`;

  try {
    const sitemapXml = await generateSitemap(siteId, baseUrl);

    return new NextResponse(sitemapXml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
```

---

### Task 70.3: Robots.txt API Route

**File: `src/app/api/sites/[siteId]/robots.txt/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const supabase = await createClient();

  // Get site info
  const { data: site } = await supabase
    .from("sites")
    .select("subdomain, custom_domain, robots_txt")
    .eq("id", siteId)
    .single();

  if (!site) {
    return new NextResponse("Site not found", { status: 404 });
  }

  // Use custom robots.txt if set, otherwise generate default
  if (site.robots_txt) {
    return new NextResponse(site.robots_txt, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Determine base URL for sitemap reference
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";
  const baseUrl = site.custom_domain
    ? `https://${site.custom_domain}`
    : `https://${site.subdomain}.${baseDomain}`;

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
```

---

### Task 70.4: Sitemap Preview Component (Optional)

**File: `src/components/seo/sitemap-preview.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SitemapPreviewProps {
  siteId: string;
  baseUrl: string;
}

export function SitemapPreview({ siteId, baseUrl }: SitemapPreviewProps) {
  const [sitemap, setSitemap] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function fetchSitemap() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/sitemap.xml`);
      const xml = await res.text();
      setSitemap(xml);
    } catch (error) {
      setSitemap("Error loading sitemap");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSitemap();
  }, [siteId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Sitemap Preview</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSitemap}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
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
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
              {sitemap}
            </pre>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## ✅ Completion Checklist

- [ ] Verified `sitemap-generator.ts` exists
- [ ] Sitemap API route created
- [ ] Robots.txt API route created
- [ ] Sitemap preview component (optional)
- [ ] Tested sitemap serves valid XML
- [ ] Tested robots.txt references sitemap

---

## 📝 Notes for AI Agent

1. **DON'T RECREATE** - Generator exists in `src/lib/seo/sitemap-generator.ts`!
2. **API ROUTES ONLY** - Just add routes to serve the generated content
3. **CACHE HEADERS** - Add appropriate caching (1hr for sitemap, 24hr for robots)
4. **BOTH DOMAINS** - Handle subdomain and custom domain URLs
5. **MINIMAL CODE** - This is mostly wiring, logic exists!
