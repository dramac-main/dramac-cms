# Phase 37: Site Renderer - Foundation

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` and `PHASE-17-VISUAL-EDITOR-FOUNDATION.md`

---

## 🎯 Objective

Create the foundation for rendering published sites - route handling, data fetching, and SSG/ISR configuration.

---

## 📋 Prerequisites

- [ ] Phase 17-24 completed (Visual Editor)
- [ ] Published sites data in Supabase
- [ ] Domain setup understanding

---

## ✅ Tasks

### Task 37.1: Renderer Configuration

**File: `src/lib/renderer/config.ts`**

```typescript
export const RENDERER_CONFIG = {
  // Revalidation time for ISR (seconds)
  revalidateTime: 60,
  // Whether to use static generation
  staticGeneration: true,
  // Maximum pages to pre-render per site
  maxStaticPages: 100,
  // Fallback behavior
  fallback: "blocking" as const,
  // Cache headers
  cacheHeaders: {
    public: "public, max-age=60, s-maxage=3600",
    private: "private, no-cache",
    static: "public, max-age=31536000, immutable",
  },
};

export const RENDERER_DEFAULTS = {
  title: "Untitled Site",
  description: "",
  favicon: "/favicon.ico",
  ogImage: null,
};
```

### Task 37.2: Site Data Fetching

**File: `src/lib/renderer/site-data.ts`**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { unstable_cache } from "next/cache";
import { RENDERER_CONFIG } from "./config";

export interface SiteData {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: {
    title?: string;
    description?: string;
    favicon?: string;
    ogImage?: string;
    customCss?: string;
    customHead?: string;
    fonts?: string[];
  };
  pages: PageData[];
  published: boolean;
  publishedAt: string | null;
}

export interface PageData {
  id: string;
  slug: string;
  title: string;
  content: any; // Craft.js JSON
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  isHomepage: boolean;
  published: boolean;
}

// Cached site fetch with ISR
export const getSiteByDomain = unstable_cache(
  async (domain: string): Promise<SiteData | null> => {
    const supabase = createAdminClient();

    // Try custom domain first
    let query = supabase
      .from("sites")
      .select(`
        id,
        name,
        slug,
        domain,
        settings,
        published,
        published_at,
        pages (
          id,
          slug,
          title,
          content,
          seo_title,
          seo_description,
          og_image,
          is_homepage,
          published
        )
      `)
      .eq("published", true);

    // Check if it's a custom domain or subdomain
    if (domain.includes(".")) {
      query = query.eq("domain", domain);
    } else {
      query = query.eq("slug", domain);
    }

    const { data: site } = await query.single();

    if (!site) return null;

    return {
      id: site.id,
      name: site.name,
      slug: site.slug,
      domain: site.domain,
      settings: site.settings || {},
      pages: (site.pages || [])
        .filter((p: any) => p.published)
        .map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          content: p.content,
          seoTitle: p.seo_title,
          seoDescription: p.seo_description,
          ogImage: p.og_image,
          isHomepage: p.is_homepage,
          published: p.published,
        })),
      published: site.published,
      publishedAt: site.published_at,
    };
  },
  ["site-by-domain"],
  {
    revalidate: RENDERER_CONFIG.revalidateTime,
    tags: ["site"],
  }
);

export const getSiteBySlug = unstable_cache(
  async (slug: string): Promise<SiteData | null> => {
    const supabase = createAdminClient();

    const { data: site } = await supabase
      .from("sites")
      .select(`
        id,
        name,
        slug,
        domain,
        settings,
        published,
        published_at,
        pages (
          id,
          slug,
          title,
          content,
          seo_title,
          seo_description,
          og_image,
          is_homepage,
          published
        )
      `)
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (!site) return null;

    return {
      id: site.id,
      name: site.name,
      slug: site.slug,
      domain: site.domain,
      settings: site.settings || {},
      pages: (site.pages || [])
        .filter((p: any) => p.published)
        .map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          content: p.content,
          seoTitle: p.seo_title,
          seoDescription: p.seo_description,
          ogImage: p.og_image,
          isHomepage: p.is_homepage,
          published: p.published,
        })),
      published: site.published,
      publishedAt: site.published_at,
    };
  },
  ["site-by-slug"],
  {
    revalidate: RENDERER_CONFIG.revalidateTime,
    tags: ["site"],
  }
);

export async function getPageBySlug(
  siteId: string,
  pageSlug: string
): Promise<PageData | null> {
  const supabase = createAdminClient();

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("site_id", siteId)
    .eq("slug", pageSlug)
    .eq("published", true)
    .single();

  if (!page) return null;

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    content: page.content,
    seoTitle: page.seo_title,
    seoDescription: page.seo_description,
    ogImage: page.og_image,
    isHomepage: page.is_homepage,
    published: page.published,
  };
}

export async function getAllPublishedSites(): Promise<{ slug: string; domain: string | null }[]> {
  const supabase = createAdminClient();

  const { data: sites } = await supabase
    .from("sites")
    .select("slug, domain")
    .eq("published", true);

  return sites || [];
}

export async function getSitePages(siteId: string): Promise<string[]> {
  const supabase = createAdminClient();

  const { data: pages } = await supabase
    .from("pages")
    .select("slug")
    .eq("site_id", siteId)
    .eq("published", true);

  return (pages || []).map((p) => p.slug);
}
```

### Task 37.3: Domain Resolution Middleware

**File: `src/middleware.ts`**

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Skip for dashboard, API, and static files
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get base domain from env
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3000";
  const appDomain = process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";

  // Check if this is a custom domain or subdomain
  const isBaseDomain = hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
  const isAppDomain = hostname.includes(new URL(appDomain).host);

  // If custom domain (not our base domain), rewrite to renderer
  if (!isBaseDomain && !isAppDomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/site/${hostname}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // If subdomain of base domain (e.g., mysite.platform.com)
  if (isBaseDomain && hostname !== baseDomain) {
    const subdomain = hostname.replace(`.${baseDomain}`, "");
    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### Task 37.4: Site Route Handler

**File: `src/app/site/[domain]/[[...slug]]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSiteByDomain, getSiteBySlug, getAllPublishedSites, getSitePages } from "@/lib/renderer/site-data";
import { RENDERER_DEFAULTS } from "@/lib/renderer/config";
import { SiteRenderer } from "@/components/renderer/site-renderer";

interface SitePageProps {
  params: Promise<{
    domain: string;
    slug?: string[];
  }>;
}

export async function generateStaticParams() {
  const sites = await getAllPublishedSites();
  const params: { domain: string; slug?: string[] }[] = [];

  for (const site of sites) {
    const domain = site.domain || site.slug;
    
    // Add homepage
    params.push({ domain, slug: [] });

    // Add all pages
    // In real implementation, fetch pages for each site
    // params.push({ domain, slug: ['about'] });
  }

  return params;
}

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { domain, slug } = await params;
  const pageSlug = slug?.join("/") || "";

  // Try custom domain first, then slug
  const site = await getSiteByDomain(domain) || await getSiteBySlug(domain);
  if (!site) return {};

  // Find the specific page
  const page = pageSlug
    ? site.pages.find((p) => p.slug === pageSlug)
    : site.pages.find((p) => p.isHomepage);

  const title = page?.seoTitle || page?.title || site.settings.title || RENDERER_DEFAULTS.title;
  const description = page?.seoDescription || site.settings.description || RENDERER_DEFAULTS.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: page?.ogImage || site.settings.ogImage ? [page?.ogImage || site.settings.ogImage!] : [],
    },
    icons: site.settings.favicon ? [site.settings.favicon] : undefined,
  };
}

export default async function SitePage({ params }: SitePageProps) {
  const { domain, slug } = await params;
  const pageSlug = slug?.join("/") || "";

  // Try custom domain first, then slug
  const site = await getSiteByDomain(domain) || await getSiteBySlug(domain);
  
  if (!site || !site.published) {
    notFound();
  }

  // Find the requested page
  const page = pageSlug
    ? site.pages.find((p) => p.slug === pageSlug)
    : site.pages.find((p) => p.isHomepage);

  if (!page) {
    notFound();
  }

  return (
    <SiteRenderer
      site={site}
      page={page}
    />
  );
}

// Enable ISR
export const revalidate = 60;
```

### Task 37.5: Cache Revalidation API

**File: `src/app/api/revalidate/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    // Verify revalidation secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.REVALIDATION_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, siteSlug, pageSlug } = body;

    if (type === "site") {
      // Revalidate entire site
      revalidateTag("site");
      if (siteSlug) {
        revalidatePath(`/site/${siteSlug}`);
      }
    } else if (type === "page" && siteSlug) {
      // Revalidate specific page
      if (pageSlug) {
        revalidatePath(`/site/${siteSlug}/${pageSlug}`);
      } else {
        revalidatePath(`/site/${siteSlug}`);
      }
    } else {
      // Revalidate everything
      revalidateTag("site");
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
```

### Task 37.6: Revalidation on Publish

**File: `src/lib/renderer/revalidate.ts`**

```typescript
export async function triggerRevalidation(
  type: "site" | "page",
  siteSlug: string,
  pageSlug?: string
) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REVALIDATION_SECRET}`,
      },
      body: JSON.stringify({
        type,
        siteSlug,
        pageSlug,
      }),
    });
  } catch (error) {
    console.error("Failed to trigger revalidation:", error);
  }
}

// Call this when a site is published
export async function onSitePublish(siteSlug: string) {
  await triggerRevalidation("site", siteSlug);
}

// Call this when a page is published
export async function onPagePublish(siteSlug: string, pageSlug: string) {
  await triggerRevalidation("page", siteSlug, pageSlug);
}
```

### Task 37.7: Site Types

**File: `src/types/renderer.ts`**

```typescript
import { SiteData, PageData } from "@/lib/renderer/site-data";

export interface RendererProps {
  site: SiteData;
  page: PageData;
}

export interface SiteSettings {
  title?: string;
  description?: string;
  favicon?: string;
  ogImage?: string;
  customCss?: string;
  customHead?: string;
  fonts?: string[];
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
    borderRadius?: string;
  };
}

export interface SEOData {
  title: string;
  description: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

export type { SiteData, PageData };
```

---

## 📐 Acceptance Criteria

- [ ] Site data fetching with caching works
- [ ] Domain resolution middleware routes correctly
- [ ] Custom domains resolve to correct sites
- [ ] Subdomains resolve to correct sites
- [ ] ISR revalidation triggers on publish
- [ ] Metadata generation works for SEO
- [ ] 404 shown for unpublished sites/pages

---

## 🔐 Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_BASE_DOMAIN=platform.com
REVALIDATION_SECRET=your-secret-key
```

---

## 📁 Files Created This Phase

```
src/lib/renderer/
├── config.ts
├── site-data.ts
└── revalidate.ts

src/middleware.ts (updated)

src/app/site/[domain]/[[...slug]]/
└── page.tsx

src/app/api/revalidate/
└── route.ts

src/types/
└── renderer.ts
```

---

## ➡️ Next Phase

**Phase 38: Site Renderer - Components** - Render Craft.js JSON as static React components.
