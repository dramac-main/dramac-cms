# Phase 61: Critical Infrastructure - Safety & Cloning

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` and `PHASE-57-ORIGINAL-FEATURE-COMPARISON.md`

---

## 🎯 Objective

Implement critical missing features from original platform:
1. Content Safety Filter for AI generation
2. Rate Limiting for API protection
3. Site Cloning for template duplication

---

## 📋 Prerequisites

- [ ] Phase 1-45 completed
- [ ] Supabase project configured
- [ ] AI generation working

---

## ✅ Tasks

### Task 58.1: Content Safety Filter

**File: `src/lib/ai/safety.ts`**

```typescript
/**
 * Content Safety Filter
 * Prevents inappropriate content in AI-generated websites
 */

// Blocked keywords and phrases
const BLOCKED_KEYWORDS = [
  // Violence
  'violence', 'kill', 'murder', 'attack', 'weapon', 'gun', 'bomb',
  // Adult content
  'adult', 'xxx', 'porn', 'nude', 'explicit', 'nsfw',
  // Hate speech
  'hate', 'racist', 'discrimination', 'supremacy',
  // Illegal
  'illegal', 'drugs', 'hack', 'crack', 'pirate',
  // Scams
  'get rich quick', 'pyramid', 'mlm scheme',
];

// Blocked industries/niches
const BLOCKED_INDUSTRIES = [
  'gambling',
  'casino',
  'adult entertainment',
  'weapons',
  'tobacco',
  'cryptocurrency scam',
];

export interface SafetyCheckResult {
  isAllowed: boolean;
  blockedTerms: string[];
  reason?: string;
}

/**
 * Check if prompt contains blocked content
 */
export function checkPromptSafety(prompt: string): SafetyCheckResult {
  const lowercasePrompt = prompt.toLowerCase();
  const blockedTerms: string[] = [];

  // Check for blocked keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowercasePrompt.includes(keyword)) {
      blockedTerms.push(keyword);
    }
  }

  // Check for blocked industries
  for (const industry of BLOCKED_INDUSTRIES) {
    if (lowercasePrompt.includes(industry)) {
      blockedTerms.push(industry);
    }
  }

  if (blockedTerms.length > 0) {
    return {
      isAllowed: false,
      blockedTerms,
      reason: `Content contains blocked terms: ${blockedTerms.join(', ')}`,
    };
  }

  return { isAllowed: true, blockedTerms: [] };
}

/**
 * Sanitize generated content
 */
export function sanitizeGeneratedContent(content: string): string {
  let sanitized = content;

  // Remove any blocked keywords that slipped through
  for (const keyword of BLOCKED_KEYWORDS) {
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, '[removed]');
  }

  // Remove potential script injections
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  return sanitized;
}

/**
 * Check if business name is appropriate
 */
export function checkBusinessName(name: string): SafetyCheckResult {
  const lowercaseName = name.toLowerCase();
  const blockedTerms: string[] = [];

  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowercaseName.includes(keyword)) {
      blockedTerms.push(keyword);
    }
  }

  if (blockedTerms.length > 0) {
    return {
      isAllowed: false,
      blockedTerms,
      reason: 'Business name contains inappropriate content',
    };
  }

  return { isAllowed: true, blockedTerms: [] };
}

/**
 * Content moderation levels
 */
export type ModerationLevel = 'strict' | 'moderate' | 'permissive';

/**
 * Get blocked keywords for moderation level
 */
export function getBlockedKeywords(level: ModerationLevel): string[] {
  switch (level) {
    case 'strict':
      return BLOCKED_KEYWORDS;
    case 'moderate':
      return BLOCKED_KEYWORDS.filter(k => 
        !['hate', 'discrimination'].includes(k) // Allow some edge cases
      );
    case 'permissive':
      return BLOCKED_KEYWORDS.filter(k =>
        ['violence', 'kill', 'murder', 'xxx', 'porn'].includes(k) // Only block severe
      );
    default:
      return BLOCKED_KEYWORDS;
  }
}
```

### Task 58.2: Rate Limiting

**File: `src/lib/rate-limit.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";

export interface RateLimitConfig {
  maxRequests: number;  // Maximum requests allowed
  windowMs: number;     // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;  // Seconds until reset
}

// Rate limit configurations
export const RATE_LIMITS = {
  aiGeneration: { maxRequests: 10, windowMs: 60 * 60 * 1000 },    // 10/hour
  aiRegeneration: { maxRequests: 50, windowMs: 60 * 60 * 1000 },  // 50/hour
  siteCreation: { maxRequests: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20/day
  pageCreation: { maxRequests: 100, windowMs: 24 * 60 * 60 * 1000 }, // 100/day
  export: { maxRequests: 10, windowMs: 60 * 60 * 1000 },          // 10/hour
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Check rate limit for a user and action type
 */
export async function checkRateLimit(
  userId: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  const supabase = await createClient();
  const config = RATE_LIMITS[type];
  const windowStart = new Date(Date.now() - config.windowMs);

  // Count requests in the time window
  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action_type', type)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if check fails
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }

  const requestCount = count || 0;
  const remaining = Math.max(0, config.maxRequests - requestCount);
  const resetAt = new Date(Date.now() + config.windowMs);

  if (requestCount >= config.maxRequests) {
    // Get the oldest request to calculate retry time
    const { data: oldestRequest } = await supabase
      .from('rate_limits')
      .select('created_at')
      .eq('user_id', userId)
      .eq('action_type', type)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const retryAfter = oldestRequest
      ? Math.ceil((new Date(oldestRequest.created_at).getTime() + config.windowMs - Date.now()) / 1000)
      : Math.ceil(config.windowMs / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter,
    };
  }

  return { allowed: true, remaining, resetAt };
}

/**
 * Record a rate-limited action
 */
export async function recordRateLimitedAction(
  userId: string,
  type: RateLimitType,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('rate_limits').insert({
    user_id: userId,
    action_type: type,
    metadata: metadata || {},
  });
}

/**
 * Clean up old rate limit records (run periodically)
 */
export async function cleanupRateLimits(): Promise<number> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  const { count, error } = await supabase
    .from('rate_limits')
    .delete()
    .lt('created_at', cutoff.toISOString())
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Rate limit cleanup error:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get rate limit status for display
 */
export async function getRateLimitStatus(
  userId: string,
  type: RateLimitType
): Promise<{
  used: number;
  limit: number;
  remaining: number;
  resetsIn: string;
}> {
  const result = await checkRateLimit(userId, type);
  const config = RATE_LIMITS[type];

  const resetsInMs = result.resetAt.getTime() - Date.now();
  const resetsInMinutes = Math.ceil(resetsInMs / (60 * 1000));
  const resetsIn = resetsInMinutes > 60
    ? `${Math.ceil(resetsInMinutes / 60)} hours`
    : `${resetsInMinutes} minutes`;

  return {
    used: config.maxRequests - result.remaining,
    limit: config.maxRequests,
    remaining: result.remaining,
    resetsIn,
  };
}
```

**File: `migrations/rate-limits.sql`**

```sql
-- Rate limits tracking table
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_rate_limits_user_action ON public.rate_limits(user_id, action_type, created_at DESC);

-- RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limits
CREATE POLICY "Users view own rate limits"
  ON public.rate_limits FOR SELECT
  USING (user_id = auth.uid());

-- System can insert rate limits (via service role)
CREATE POLICY "System inserts rate limits"
  ON public.rate_limits FOR INSERT
  WITH CHECK (true);

-- Cleanup job: Delete records older than 24 hours
-- Run this as a cron job or scheduled function
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
```

### Task 58.3: Site Cloning

**File: `src/lib/sites/clone.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import type { Site, Page } from "@/types";

export interface CloneOptions {
  newName: string;
  newSubdomain: string;
  clonePages: boolean;
  cloneSettings: boolean;
  cloneModules: boolean;
  clientId: string;
}

export interface CloneResult {
  success: boolean;
  newSiteId?: string;
  newSiteUrl?: string;
  error?: string;
  details?: {
    pagesCloned: number;
    modulesCloned: number;
  };
}

/**
 * Clone an entire site with all its data
 */
export async function cloneSite(
  sourceSiteId: string,
  options: CloneOptions
): Promise<CloneResult> {
  const supabase = await createClient();

  try {
    // 1. Get source site
    const { data: sourceSite, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', sourceSiteId)
      .single();

    if (siteError || !sourceSite) {
      return { success: false, error: 'Source site not found' };
    }

    // 2. Check if subdomain is available
    const { data: existingSubdomain } = await supabase
      .from('sites')
      .select('id')
      .eq('subdomain', options.newSubdomain)
      .single();

    if (existingSubdomain) {
      return { success: false, error: 'Subdomain already exists' };
    }

    // 3. Create new site
    const { data: newSite, error: createError } = await supabase
      .from('sites')
      .insert({
        client_id: options.clientId,
        name: options.newName,
        subdomain: options.newSubdomain,
        custom_domain: null, // Don't clone custom domain
        status: 'draft',
        settings: options.cloneSettings ? sourceSite.settings : {},
        theme: sourceSite.theme,
        favicon_url: sourceSite.favicon_url,
        logo_url: sourceSite.logo_url,
      })
      .select()
      .single();

    if (createError || !newSite) {
      return { success: false, error: `Failed to create site: ${createError?.message}` };
    }

    let pagesCloned = 0;
    let modulesCloned = 0;

    // 4. Clone pages if requested
    if (options.clonePages) {
      const { data: sourcePages, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('site_id', sourceSiteId);

      if (!pagesError && sourcePages) {
        for (const page of sourcePages) {
          const { error: pageCreateError } = await supabase
            .from('pages')
            .insert({
              site_id: newSite.id,
              slug: page.slug,
              title: page.title,
              content: page.content,
              seo_title: page.seo_title,
              seo_description: page.seo_description,
              is_homepage: page.is_homepage,
              is_published: false, // Don't auto-publish cloned pages
              sort_order: page.sort_order,
            });

          if (!pageCreateError) {
            pagesCloned++;
          }
        }
      }
    }

    // 5. Clone modules if requested
    if (options.cloneModules) {
      const { data: sourceModules, error: modulesError } = await supabase
        .from('site_modules')
        .select('*')
        .eq('site_id', sourceSiteId);

      if (!modulesError && sourceModules) {
        for (const mod of sourceModules) {
          const { error: modCreateError } = await supabase
            .from('site_modules')
            .insert({
              site_id: newSite.id,
              module_id: mod.module_id,
              settings: mod.settings,
              is_enabled: mod.is_enabled,
            });

          if (!modCreateError) {
            modulesCloned++;
          }
        }
      }
    }

    return {
      success: true,
      newSiteId: newSite.id,
      newSiteUrl: `https://${options.newSubdomain}.dramac.site`,
      details: {
        pagesCloned,
        modulesCloned,
      },
    };
  } catch (error) {
    console.error('Site clone error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Clone failed',
    };
  }
}

/**
 * Clone a single page to another site
 */
export async function clonePage(
  sourcePageId: string,
  targetSiteId: string,
  newSlug?: string
): Promise<{ success: boolean; newPageId?: string; error?: string }> {
  const supabase = await createClient();

  try {
    // Get source page
    const { data: sourcePage, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', sourcePageId)
      .single();

    if (pageError || !sourcePage) {
      return { success: false, error: 'Source page not found' };
    }

    // Create cloned page
    const { data: newPage, error: createError } = await supabase
      .from('pages')
      .insert({
        site_id: targetSiteId,
        slug: newSlug || `${sourcePage.slug}-copy`,
        title: `${sourcePage.title} (Copy)`,
        content: sourcePage.content,
        seo_title: sourcePage.seo_title,
        seo_description: sourcePage.seo_description,
        is_homepage: false,
        is_published: false,
        sort_order: sourcePage.sort_order,
      })
      .select()
      .single();

    if (createError || !newPage) {
      return { success: false, error: `Failed to clone page: ${createError?.message}` };
    }

    return { success: true, newPageId: newPage.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Page clone failed',
    };
  }
}

/**
 * Clone site from template
 */
export async function cloneFromTemplate(
  templateId: string,
  options: Omit<CloneOptions, 'clonePages' | 'cloneSettings' | 'cloneModules'>
): Promise<CloneResult> {
  // Templates always clone everything
  return cloneSite(templateId, {
    ...options,
    clonePages: true,
    cloneSettings: true,
    cloneModules: true,
  });
}
```

**File: `src/lib/actions/clone.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { cloneSite, clonePage, CloneOptions, CloneResult } from "@/lib/sites/clone";
import { revalidatePath } from "next/cache";
import { checkRateLimit, recordRateLimitedAction } from "@/lib/rate-limit";

export async function cloneSiteAction(
  sourceSiteId: string,
  options: CloneOptions
): Promise<CloneResult> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(user.id, "siteCreation");
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
    };
  }

  // Perform clone
  const result = await cloneSite(sourceSiteId, options);

  if (result.success) {
    // Record rate-limited action
    await recordRateLimitedAction(user.id, "siteCreation", {
      action: "clone",
      sourceSiteId,
      newSiteId: result.newSiteId,
    });

    // Revalidate sites list
    revalidatePath("/dashboard/sites");
    revalidatePath(`/dashboard/clients/${options.clientId}`);
  }

  return result;
}

export async function clonePageAction(
  sourcePageId: string,
  targetSiteId: string,
  newSlug?: string
): Promise<{ success: boolean; newPageId?: string; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(user.id, "pageCreation");
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
    };
  }

  // Perform clone
  const result = await clonePage(sourcePageId, targetSiteId, newSlug);

  if (result.success) {
    await recordRateLimitedAction(user.id, "pageCreation", {
      action: "clone",
      sourcePageId,
      newPageId: result.newPageId,
    });

    revalidatePath(`/dashboard/sites/${targetSiteId}`);
  }

  return result;
}
```

### Task 58.4: Clone UI Component

**File: `src/components/sites/clone-site-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cloneSiteAction } from "@/lib/actions/clone";

interface CloneSiteDialogProps {
  siteId: string;
  siteName: string;
  clientId: string;
  children?: React.ReactNode;
}

export function CloneSiteDialog({
  siteId,
  siteName,
  clientId,
  children,
}: CloneSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState(`${siteName} (Copy)`);
  const [subdomain, setSubdomain] = useState("");
  const [clonePages, setClonePages] = useState(true);
  const [cloneSettings, setCloneSettings] = useState(true);
  const [cloneModules, setCloneModules] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleClone = async () => {
    if (!subdomain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subdomain",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await cloneSiteAction(siteId, {
        newName,
        newSubdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
        clonePages,
        cloneSettings,
        cloneModules,
        clientId,
      });

      if (result.success) {
        toast({
          title: "Site cloned!",
          description: `${result.details?.pagesCloned || 0} pages and ${result.details?.modulesCloned || 0} modules copied.`,
        });
        setOpen(false);
        router.push(`/dashboard/sites/${result.newSiteId}`);
      } else {
        toast({
          title: "Clone failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" />
            Clone Site
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Clone Site</DialogTitle>
          <DialogDescription>
            Create a copy of "{siteName}" with all selected data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newName">New Site Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My New Site"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="my-new-site"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">.dramac.site</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Clone Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="clonePages"
                checked={clonePages}
                onCheckedChange={(checked) => setClonePages(!!checked)}
              />
              <Label htmlFor="clonePages" className="font-normal">
                Clone all pages
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cloneSettings"
                checked={cloneSettings}
                onCheckedChange={(checked) => setCloneSettings(!!checked)}
              />
              <Label htmlFor="cloneSettings" className="font-normal">
                Clone site settings & theme
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cloneModules"
                checked={cloneModules}
                onCheckedChange={(checked) => setCloneModules(!!checked)}
              />
              <Label htmlFor="cloneModules" className="font-normal">
                Clone enabled modules
              </Label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cloning...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Clone Site
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 58.5: Update AI Generation with Safety

**Update: `src/lib/ai/generate.ts`**

Add safety check at the beginning of `generateWebsite` function:

```typescript
import { checkPromptSafety, sanitizeGeneratedContent } from "./safety";
import { checkRateLimit, recordRateLimitedAction } from "@/lib/rate-limit";

export async function generateWebsite(
  context: GenerationContext,
  userId: string
): Promise<GenerationResult> {
  // 1. Check rate limit
  const rateLimit = await checkRateLimit(userId, "aiGeneration");
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. You have ${rateLimit.remaining} generations remaining. Resets in ${Math.ceil((rateLimit.retryAfter || 3600) / 60)} minutes.`,
    };
  }

  // 2. Check content safety
  const promptText = `${context.businessName} ${context.industry} ${context.description}`;
  const safetyCheck = checkPromptSafety(promptText);
  
  if (!safetyCheck.isAllowed) {
    return {
      success: false,
      error: `Content not allowed: ${safetyCheck.reason}`,
    };
  }

  try {
    // ... existing generation code ...

    // 3. Sanitize output
    const sanitizedContent = sanitizeGeneratedContent(JSON.stringify(website));
    const sanitizedWebsite = JSON.parse(sanitizedContent);

    // 4. Record successful generation
    await recordRateLimitedAction(userId, "aiGeneration", {
      industry: context.industry,
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    });

    return {
      success: true,
      website: sanitizedWebsite,
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    };
  } catch (error) {
    // ... existing error handling ...
  }
}
```

---

## 🧪 Testing

### Test Safety Filter

```typescript
// Test blocked content
const result1 = checkPromptSafety("Create a gambling website");
console.assert(!result1.isAllowed, "Should block gambling");

// Test allowed content
const result2 = checkPromptSafety("Create a photography portfolio");
console.assert(result2.isAllowed, "Should allow photography");
```

### Test Rate Limiting

```typescript
// Make 10 requests
for (let i = 0; i < 10; i++) {
  await recordRateLimitedAction(userId, "aiGeneration", {});
}

// 11th should be blocked
const result = await checkRateLimit(userId, "aiGeneration");
console.assert(!result.allowed, "Should be rate limited");
```

### Test Site Cloning

```typescript
const result = await cloneSite(sourceSiteId, {
  newName: "Test Clone",
  newSubdomain: "test-clone-" + Date.now(),
  clonePages: true,
  cloneSettings: true,
  cloneModules: true,
  clientId: clientId,
});

console.assert(result.success, "Clone should succeed");
console.assert(result.newSiteId, "Should have new site ID");
```

---

## ✅ Verification Checklist

- [ ] Content safety filter blocks inappropriate prompts
- [ ] Rate limiting enforces 10 AI generations per hour
- [ ] Site cloning creates complete copy of site
- [ ] Page cloning works independently
- [ ] Clone dialog shows in site settings
- [ ] Rate limit status shown in AI builder
- [ ] Cleanup function removes old rate limit records

---

## 📁 Files Created

1. `src/lib/ai/safety.ts` - Content safety filter
2. `src/lib/rate-limit.ts` - Rate limiting utilities
3. `migrations/rate-limits.sql` - Rate limits table
4. `src/lib/sites/clone.ts` - Site cloning logic
5. `src/lib/actions/clone.ts` - Clone server actions
6. `src/components/sites/clone-site-dialog.tsx` - Clone UI

---

## ⏭️ Next Phase

Continue to **Phase 62: Backup & Export System** for data protection features.
