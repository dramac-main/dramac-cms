# Phase 77: Site Publishing Complete

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 6-8 hours

---

## 🎯 Objective

Fix site publishing so users can publish their site, view it live, configure custom domains, and see the actual rendered website. The "I CAN'T VIEW SITE! I CAN'T CONFIGURE CUSTOM DOMAIN!" problem must be solved.

---

## 📋 Prerequisites

- [ ] Sites exist in database
- [ ] Pages exist with content
- [ ] Supabase configured
- [ ] Domain verification service ready

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ `publish-service.ts` with `publishSite()` and `unpublishSite()`
- ✅ `publish-dialog.tsx` component
- ✅ Sites table has `published`, `subdomain` fields
- ✅ Preview page at `/preview/[siteId]/[pageId]`

**What's Missing:**
- ❌ "View Site" button after publishing
- ❌ Live site URL display
- ❌ Custom domain configuration UI
- ❌ DNS verification system
- ❌ SSL certificate provisioning
- ❌ Domain validation status
- ❌ Subdomain availability check
- ❌ Published site renderer route
- ❌ Site status indicator (draft/published)

---

## 💼 Business Value

1. **Core Functionality** - Publishing is the whole point of a website builder!
2. **Client Delivery** - Agencies need to show work to clients
3. **Custom Branding** - Custom domains = professional look
4. **SEO Value** - Own domain improves search rankings
5. **Upgrade Driver** - Custom domains can be premium feature

---

## 📁 Files to Create/Modify

```
src/lib/publishing/
├── publish-service.ts           # ENHANCE publishing logic
├── domain-service.ts            # Domain management
├── dns-verification.ts          # DNS record verification
├── ssl-service.ts               # SSL certificate management

src/components/publishing/
├── publish-dialog.tsx           # ENHANCE with view site
├── publish-status-badge.tsx     # Published/Draft badge
├── view-site-button.tsx         # View live site button
├── domain-settings.tsx          # Custom domain config
├── dns-instructions.tsx         # DNS setup instructions
├── domain-verification.tsx      # Verification status

src/app/(dashboard)/sites/[siteId]/
├── page.tsx                     # Add publish status + view site
├── settings/
│   └── domain/page.tsx          # Domain settings page

src/app/api/sites/[siteId]/
├── publish/route.ts             # Publish endpoint
├── domain/
│   ├── route.ts                 # Domain CRUD
│   ├── verify/route.ts          # Verify DNS
│   └── check/route.ts           # Check availability

src/app/sites/[subdomain]/
├── page.tsx                     # Public site renderer (home)
├── [slug]/page.tsx              # Public site renderer (pages)
```

---

## ✅ Tasks

### Task 77.1: Enhanced Publish Service

**File: `src/lib/publishing/publish-service.ts`** (REPLACE)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PublishResult {
  success: boolean;
  error?: string;
  siteUrl?: string;
  publishedAt?: string;
}

export interface SitePublishStatus {
  isPublished: boolean;
  publishedAt: string | null;
  subdomain: string;
  customDomain: string | null;
  customDomainVerified: boolean;
  siteUrl: string;
}

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";

export async function publishSite(siteId: string): Promise<PublishResult> {
  try {
    const supabase = await createClient();

    // Get site data
    const { data: site, error: fetchError } = await supabase
      .from("sites")
      .select("id, subdomain, pages(id, content)")
      .eq("id", siteId)
      .single();

    if (fetchError || !site) {
      return { success: false, error: "Site not found" };
    }

    // Check if site has content
    const hasContent = site.pages?.some((p: { content: unknown }) => p.content);
    if (!hasContent) {
      return { success: false, error: "Site has no content to publish" };
    }

    // Update site as published
    const publishedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("sites")
      .update({
        published: true,
        published_at: publishedAt,
        updated_at: publishedAt,
      })
      .eq("id", siteId);

    if (updateError) {
      console.error("[PublishService] Update error:", updateError);
      return { success: false, error: "Failed to publish site" };
    }

    // Generate site URL
    const siteUrl = `https://${site.subdomain}.${BASE_DOMAIN}`;

    revalidatePath(`/sites/${siteId}`);

    return {
      success: true,
      siteUrl,
      publishedAt,
    };
  } catch (error) {
    console.error("[PublishService] Error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function unpublishSite(siteId: string): Promise<PublishResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("sites")
      .update({
        published: false,
        published_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);

    if (error) {
      console.error("[PublishService] Unpublish error:", error);
      return { success: false, error: "Failed to unpublish site" };
    }

    revalidatePath(`/sites/${siteId}`);
    return { success: true };
  } catch (error) {
    console.error("[PublishService] Error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getSitePublishStatus(siteId: string): Promise<SitePublishStatus | null> {
  try {
    const supabase = await createClient();

    const { data: site, error } = await supabase
      .from("sites")
      .select("published, published_at, subdomain, custom_domain, custom_domain_verified")
      .eq("id", siteId)
      .single();

    if (error || !site) {
      return null;
    }

    const siteUrl = site.custom_domain && site.custom_domain_verified
      ? `https://${site.custom_domain}`
      : `https://${site.subdomain}.${BASE_DOMAIN}`;

    return {
      isPublished: site.published || false,
      publishedAt: site.published_at,
      subdomain: site.subdomain,
      customDomain: site.custom_domain,
      customDomainVerified: site.custom_domain_verified || false,
      siteUrl,
    };
  } catch (error) {
    console.error("[PublishService] Status error:", error);
    return null;
  }
}

export async function checkSubdomainAvailability(subdomain: string, excludeSiteId?: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("sites")
      .select("id")
      .eq("subdomain", subdomain.toLowerCase());

    if (excludeSiteId) {
      query = query.neq("id", excludeSiteId);
    }

    const { data } = await query.single();
    return !data; // Available if no site found
  } catch {
    return true; // Assume available on error
  }
}

export async function updateSubdomain(siteId: string, subdomain: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain.toLowerCase())) {
      return { success: false, error: "Invalid subdomain format" };
    }

    // Check availability
    const isAvailable = await checkSubdomainAvailability(subdomain, siteId);
    if (!isAvailable) {
      return { success: false, error: "Subdomain already taken" };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("sites")
      .update({ subdomain: subdomain.toLowerCase() })
      .eq("id", siteId);

    if (error) {
      return { success: false, error: "Failed to update subdomain" };
    }

    revalidatePath(`/sites/${siteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
```

---

### Task 77.2: Domain Service

**File: `src/lib/publishing/domain-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface DomainStatus {
  domain: string;
  configured: boolean;
  verified: boolean;
  sslActive: boolean;
  dnsRecords: DnsRecord[];
  verificationToken: string;
  lastChecked: string | null;
}

export interface DnsRecord {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  required: boolean;
  verified: boolean;
}

// Platform IP address for A records (would be your load balancer/CDN)
const PLATFORM_IP = process.env.PLATFORM_IP || "76.76.21.21";
const VERIFICATION_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";

export async function setCustomDomain(siteId: string, domain: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate domain format
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return { success: false, error: "Invalid domain format" };
    }

    // Normalize domain (lowercase, no www prefix stored)
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");

    const supabase = await createClient();

    // Check if domain is already in use
    const { data: existing } = await supabase
      .from("sites")
      .select("id")
      .eq("custom_domain", normalizedDomain)
      .neq("id", siteId)
      .single();

    if (existing) {
      return { success: false, error: "Domain is already in use by another site" };
    }

    // Generate verification token
    const verificationToken = `dramac-verify-${siteId.slice(0, 8)}-${Date.now().toString(36)}`;

    // Update site with domain
    const { error } = await supabase
      .from("sites")
      .update({
        custom_domain: normalizedDomain,
        custom_domain_verified: false,
        domain_verification_token: verificationToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);

    if (error) {
      console.error("[DomainService] Set domain error:", error);
      return { success: false, error: "Failed to set custom domain" };
    }

    revalidatePath(`/sites/${siteId}`);
    return { success: true };
  } catch (error) {
    console.error("[DomainService] Error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function removeCustomDomain(siteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("sites")
      .update({
        custom_domain: null,
        custom_domain_verified: false,
        domain_verification_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);

    if (error) {
      return { success: false, error: "Failed to remove custom domain" };
    }

    revalidatePath(`/sites/${siteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getDomainStatus(siteId: string): Promise<DomainStatus | null> {
  try {
    const supabase = await createClient();

    const { data: site, error } = await supabase
      .from("sites")
      .select("custom_domain, custom_domain_verified, domain_verification_token, domain_last_checked, subdomain")
      .eq("id", siteId)
      .single();

    if (error || !site || !site.custom_domain) {
      return null;
    }

    // Generate required DNS records
    const dnsRecords: DnsRecord[] = [
      {
        type: "A",
        name: "@",
        value: PLATFORM_IP,
        required: true,
        verified: false, // Would check actual DNS
      },
      {
        type: "CNAME",
        name: "www",
        value: `${site.subdomain}.${VERIFICATION_DOMAIN}`,
        required: false,
        verified: false,
      },
      {
        type: "TXT",
        name: "_dramac-verification",
        value: site.domain_verification_token,
        required: true,
        verified: false,
      },
    ];

    return {
      domain: site.custom_domain,
      configured: true,
      verified: site.custom_domain_verified || false,
      sslActive: site.custom_domain_verified || false, // SSL auto-enabled when verified
      dnsRecords,
      verificationToken: site.domain_verification_token,
      lastChecked: site.domain_last_checked,
    };
  } catch (error) {
    console.error("[DomainService] Get status error:", error);
    return null;
  }
}

export async function verifyDomain(siteId: string): Promise<{ success: boolean; verified: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get site domain info
    const { data: site, error: fetchError } = await supabase
      .from("sites")
      .select("custom_domain, domain_verification_token")
      .eq("id", siteId)
      .single();

    if (fetchError || !site?.custom_domain) {
      return { success: false, verified: false, error: "Domain not configured" };
    }

    // In production, this would:
    // 1. Check DNS TXT record for verification token
    // 2. Check A/CNAME records point to our servers
    // 3. Provision SSL certificate via Let's Encrypt
    
    // For now, simulate verification (would use DNS lookup libraries)
    const isVerified = await simulateDnsVerification(
      site.custom_domain,
      site.domain_verification_token
    );

    // Update verification status
    const { error: updateError } = await supabase
      .from("sites")
      .update({
        custom_domain_verified: isVerified,
        domain_last_checked: new Date().toISOString(),
      })
      .eq("id", siteId);

    if (updateError) {
      return { success: false, verified: false, error: "Failed to update status" };
    }

    revalidatePath(`/sites/${siteId}`);

    return {
      success: true,
      verified: isVerified,
      error: isVerified ? undefined : "DNS records not found. Please check your configuration.",
    };
  } catch (error) {
    console.error("[DomainService] Verification error:", error);
    return { success: false, verified: false, error: "Verification failed" };
  }
}

async function simulateDnsVerification(domain: string, token: string): Promise<boolean> {
  // In production, use dns.resolveTxt() and dns.resolve4()
  // For development, always return false (requires manual verification)
  console.log(`[DNS] Would verify ${domain} with token ${token}`);
  return false;
}
```

---

### Task 77.3: Publish Status Badge

**File: `src/components/publishing/publish-status-badge.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { Globe, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublishStatusBadgeProps {
  isPublished: boolean;
  className?: string;
}

export function PublishStatusBadge({ isPublished, className }: PublishStatusBadgeProps) {
  return (
    <Badge
      variant={isPublished ? "default" : "secondary"}
      className={cn(
        isPublished 
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
        className
      )}
    >
      {isPublished ? (
        <>
          <Globe className="h-3 w-3 mr-1" />
          Published
        </>
      ) : (
        <>
          <FileText className="h-3 w-3 mr-1" />
          Draft
        </>
      )}
    </Badge>
  );
}
```

---

### Task 77.4: View Site Button

**File: `src/components/publishing/view-site-button.tsx`**

```tsx
"use client";

import { useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ViewSiteButtonProps {
  siteUrl: string;
  disabled?: boolean;
}

export function ViewSiteButton({ siteUrl, disabled }: ViewSiteButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      toast.success("URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleView = () => {
    window.open(siteUrl, "_blank", "noopener,noreferrer");
  };

  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" disabled>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Site
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Publish your site first to view it</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Site
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleView}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in new tab
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          Copy URL
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### Task 77.5: Enhanced Publish Dialog

**File: `src/components/publishing/publish-dialog.tsx`** (REPLACE)

```tsx
"use client";

import { useState } from "react";
import { Globe, Loader2, ExternalLink, Copy, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { publishSite, unpublishSite } from "@/lib/publishing/publish-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PublishDialogProps {
  siteId: string;
  siteName: string;
  isPublished: boolean;
  siteUrl: string;
  onPublishChange?: (published: boolean) => void;
  children?: React.ReactNode;
}

export function PublishDialog({
  siteId,
  siteName,
  isPublished,
  siteUrl,
  onPublishChange,
  children,
}: PublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [justPublished, setJustPublished] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    setError(null);

    const result = await publishSite(siteId);

    setLoading(false);

    if (result.success) {
      setJustPublished(true);
      onPublishChange?.(true);
      toast.success("Site published successfully!");
    } else {
      setError(result.error || "Failed to publish site");
    }
  };

  const handleUnpublish = async () => {
    setLoading(true);
    setError(null);

    const result = await unpublishSite(siteId);

    setLoading(false);

    if (result.success) {
      setJustPublished(false);
      onPublishChange?.(false);
      toast.success("Site unpublished");
      setOpen(false);
    } else {
      setError(result.error || "Failed to unpublish site");
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      toast.success("URL copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleViewSite = () => {
    window.open(siteUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Globe className="h-4 w-4 mr-2" />
            {isPublished ? "Manage" : "Publish"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isPublished || justPublished ? "Site Published!" : "Publish Site"}
          </DialogTitle>
          <DialogDescription>
            {isPublished || justPublished
              ? "Your site is live and accessible to the public."
              : `Make "${siteName}" accessible to the public.`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(isPublished || justPublished) ? (
          <div className="space-y-4">
            {/* Site URL */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your site is live at:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-background px-3 py-2 rounded border truncate">
                  {siteUrl}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleViewSite}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live Site
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                Publishing will make your site available at:
              </p>
              <code className="text-sm font-medium block mt-2">{siteUrl}</code>
            </div>

            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All pages will be publicly accessible</li>
              <li>• Changes made after publishing require re-publishing</li>
              <li>• You can unpublish at any time</li>
            </ul>
          </div>
        )}

        <DialogFooter className={cn("gap-2", (isPublished || justPublished) && "sm:justify-between")}>
          {(isPublished || justPublished) ? (
            <>
              <Button
                variant="outline"
                onClick={handleUnpublish}
                disabled={loading}
                className="text-destructive hover:text-destructive"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Unpublish Site
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Publish Now
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 77.6: Domain Settings Component

**File: `src/components/publishing/domain-settings.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Loader2,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  setCustomDomain,
  removeCustomDomain,
  getDomainStatus,
  verifyDomain,
  type DomainStatus,
} from "@/lib/publishing/domain-service";
import { DnsInstructions } from "./dns-instructions";
import { toast } from "sonner";

interface DomainSettingsProps {
  siteId: string;
  subdomain: string;
}

export function DomainSettings({ siteId, subdomain }: DomainSettingsProps) {
  const [domain, setDomain] = useState("");
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";
  const defaultUrl = `https://${subdomain}.${baseDomain}`;

  // Load domain status
  useEffect(() => {
    loadDomainStatus();
  }, [siteId]);

  const loadDomainStatus = async () => {
    const status = await getDomainStatus(siteId);
    setDomainStatus(status);
    if (status?.domain) {
      setDomain(status.domain);
    }
  };

  const handleSetDomain = async () => {
    if (!domain.trim()) {
      setError("Please enter a domain");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await setCustomDomain(siteId, domain.trim());

    setLoading(false);

    if (result.success) {
      toast.success("Domain configured! Please add the DNS records.");
      loadDomainStatus();
    } else {
      setError(result.error || "Failed to set domain");
    }
  };

  const handleRemoveDomain = async () => {
    setLoading(true);
    setError(null);

    const result = await removeCustomDomain(siteId);

    setLoading(false);

    if (result.success) {
      setDomain("");
      setDomainStatus(null);
      toast.success("Custom domain removed");
    } else {
      setError(result.error || "Failed to remove domain");
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);

    const result = await verifyDomain(siteId);

    setVerifying(false);

    if (result.success && result.verified) {
      toast.success("Domain verified and SSL activated!");
      loadDomainStatus();
    } else {
      setError(result.error || "Verification failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Default Subdomain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Default URL</CardTitle>
          <CardDescription>
            Your site is always accessible at this URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-muted rounded-lg px-3 py-2">
              <Globe className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm font-mono">{defaultUrl}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(defaultUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Custom Domain</CardTitle>
              <CardDescription>
                Use your own domain for this site
              </CardDescription>
            </div>
            {domainStatus?.verified && (
              <Badge className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!domainStatus?.configured ? (
            // Domain input
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <div className="flex gap-2">
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    disabled={loading}
                  />
                  <Button onClick={handleSetDomain} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Domain
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your domain without http:// or www
                </p>
              </div>
            </div>
          ) : (
            // Domain configured
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{domainStatus.domain}</span>
                </div>
                <div className="flex items-center gap-2">
                  {domainStatus.sslActive && (
                    <Badge variant="outline" className="text-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      SSL
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveDomain}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {!domainStatus.verified && (
                <>
                  <Separator />

                  {/* DNS Instructions */}
                  <DnsInstructions
                    domain={domainStatus.domain}
                    records={domainStatus.dnsRecords}
                  />

                  {/* Verify Button */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                      {domainStatus.lastChecked
                        ? `Last checked: ${new Date(domainStatus.lastChecked).toLocaleString()}`
                        : "Not verified yet"}
                    </p>
                    <Button onClick={handleVerify} disabled={verifying}>
                      {verifying ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Verify DNS
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 77.7: DNS Instructions Component

**File: `src/components/publishing/dns-instructions.tsx`**

```tsx
import { Check, X, Copy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DnsRecord } from "@/lib/publishing/domain-service";
import { toast } from "sonner";

interface DnsInstructionsProps {
  domain: string;
  records: DnsRecord[];
}

export function DnsInstructions({ domain, records }: DnsInstructionsProps) {
  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Add these DNS records at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
        </AlertDescription>
      </Alert>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Type</TableHead>
            <TableHead className="w-32">Name/Host</TableHead>
            <TableHead>Value/Points to</TableHead>
            <TableHead className="w-24 text-center">Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, i) => (
            <TableRow key={i}>
              <TableCell>
                <Badge variant="outline">{record.type}</Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {record.name === "@" ? domain : `${record.name}.${domain}`}
              </TableCell>
              <TableCell className="font-mono text-sm max-w-xs truncate">
                {record.value}
              </TableCell>
              <TableCell className="text-center">
                {record.verified ? (
                  <Check className="h-4 w-4 text-green-500 mx-auto" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground mx-auto" />
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyValue(record.value)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• DNS changes can take 24-48 hours to propagate worldwide</p>
        <p>• The TXT record is required for domain verification</p>
        <p>• SSL certificate will be automatically provisioned after verification</p>
      </div>
    </div>
  );
}
```

---

### Task 77.8: Domain Settings Page

**File: `src/app/(dashboard)/sites/[siteId]/settings/domain/page.tsx`**

```tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DomainSettings } from "@/components/publishing/domain-settings";

interface DomainSettingsPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function DomainSettingsPage({ params }: DomainSettingsPageProps) {
  const { siteId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get site
  const { data: site, error } = await supabase
    .from("sites")
    .select(`
      id,
      name,
      subdomain,
      custom_domain,
      custom_domain_verified,
      client:clients!inner(agency_id)
    `)
    .eq("id", siteId)
    .single();

  if (error || !site) {
    notFound();
  }

  return (
    <div className="container max-w-3xl py-8">
      <Link
        href={`/sites/${siteId}/settings`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Settings
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Domain Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your site's domain and SSL settings
        </p>
      </div>

      <DomainSettings siteId={siteId} subdomain={site.subdomain} />
    </div>
  );
}
```

---

### Task 77.9: Public Site Renderer (Home)

**File: `src/app/sites/[subdomain]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteRenderer } from "@/components/renderer/site-renderer";

interface PublicSitePageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PublicSitePageProps) {
  const { subdomain } = await params;
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("name, pages(meta_title, meta_description, is_home)")
    .eq("subdomain", subdomain)
    .eq("published", true)
    .single();

  if (!site) return { title: "Site Not Found" };

  const homePage = site.pages?.find((p: { is_home: boolean }) => p.is_home) || site.pages?.[0];

  return {
    title: homePage?.meta_title || site.name,
    description: homePage?.meta_description || `Welcome to ${site.name}`,
  };
}

export default async function PublicSitePage({ params }: PublicSitePageProps) {
  const { subdomain } = await params;
  const supabase = await createClient();

  // Get published site with home page
  const { data: site, error } = await supabase
    .from("sites")
    .select(`
      id,
      name,
      subdomain,
      theme_settings,
      pages (
        id,
        name,
        slug,
        content,
        is_home,
        meta_title,
        meta_description
      )
    `)
    .eq("subdomain", subdomain)
    .eq("published", true)
    .single();

  if (error || !site) {
    notFound();
  }

  // Find home page
  const homePage = site.pages?.find((p: { is_home: boolean }) => p.is_home) || site.pages?.[0];

  if (!homePage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Pages Found</h1>
          <p className="text-gray-600">This site doesn't have any published pages yet.</p>
        </div>
      </div>
    );
  }

  return (
    <SiteRenderer
      site={{
        id: site.id,
        name: site.name,
        themeSettings: site.theme_settings,
      }}
      page={{
        id: homePage.id,
        name: homePage.name,
        slug: homePage.slug,
        content: homePage.content,
      }}
    />
  );
}
```

---

### Task 77.10: Public Site Renderer (Other Pages)

**File: `src/app/sites/[subdomain]/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteRenderer } from "@/components/renderer/site-renderer";

interface PublicPageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

export async function generateMetadata({ params }: PublicPageProps) {
  const { subdomain, slug } = await params;
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("name, pages(meta_title, meta_description, slug)")
    .eq("subdomain", subdomain)
    .eq("published", true)
    .single();

  if (!site) return { title: "Page Not Found" };

  const page = site.pages?.find((p: { slug: string }) => p.slug === slug);
  if (!page) return { title: "Page Not Found" };

  return {
    title: page.meta_title || `${site.name}`,
    description: page.meta_description,
  };
}

export default async function PublicPagePage({ params }: PublicPageProps) {
  const { subdomain, slug } = await params;
  const supabase = await createClient();

  // Get published site
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select(`
      id,
      name,
      theme_settings,
      pages (
        id,
        name,
        slug,
        content,
        meta_title,
        meta_description
      )
    `)
    .eq("subdomain", subdomain)
    .eq("published", true)
    .single();

  if (siteError || !site) {
    notFound();
  }

  // Find page by slug
  const page = site.pages?.find((p: { slug: string }) => p.slug === slug);

  if (!page) {
    notFound();
  }

  return (
    <SiteRenderer
      site={{
        id: site.id,
        name: site.name,
        themeSettings: site.theme_settings,
      }}
      page={{
        id: page.id,
        name: page.name,
        slug: page.slug,
        content: page.content,
      }}
    />
  );
}
```

---

### Task 77.11: Site Renderer Component

**File: `src/components/renderer/site-renderer.tsx`**

```tsx
"use client";

import { Editor, Frame, Element } from "@craftjs/core";
import { componentResolver } from "@/components/editor/resolver";
import { Root } from "@/components/editor/user-components/root";

interface SiteRendererProps {
  site: {
    id: string;
    name: string;
    themeSettings?: Record<string, unknown> | null;
  };
  page: {
    id: string;
    name: string;
    slug: string;
    content: string | null;
  };
}

export function SiteRenderer({ site, page }: SiteRendererProps) {
  // No content state
  if (!page.content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Coming Soon</h1>
          <p className="text-gray-600">This page is being built.</p>
        </div>
      </div>
    );
  }

  // Apply theme settings
  const themeStyle: React.CSSProperties = site.themeSettings
    ? {
        // @ts-expect-error CSS custom properties
        "--primary": (site.themeSettings as Record<string, string>).primaryColor || "#3b82f6",
        "--font-family": (site.themeSettings as Record<string, string>).fontFamily || "Inter, sans-serif",
      }
    : {};

  return (
    <div className="min-h-screen bg-white" style={themeStyle}>
      <Editor
        resolver={componentResolver}
        enabled={false}
        onRender={({ render }) => render}
      >
        <Frame data={page.content}>
          <Element is={Root} canvas />
        </Frame>
      </Editor>
    </div>
  );
}
```

---

### Task 77.12: Database Migration for Domain Fields

**File: `migrations/add-domain-fields.sql`**

```sql
-- Add custom domain fields to sites table
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS domain_verification_token TEXT,
ADD COLUMN IF NOT EXISTS domain_last_checked TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Create index for subdomain lookup
CREATE INDEX IF NOT EXISTS idx_sites_subdomain ON sites(subdomain);

-- Create index for custom domain lookup
CREATE INDEX IF NOT EXISTS idx_sites_custom_domain ON sites(custom_domain) WHERE custom_domain IS NOT NULL;

-- Ensure subdomain is unique
ALTER TABLE sites
ADD CONSTRAINT unique_subdomain UNIQUE (subdomain);

-- Ensure custom domain is unique (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_unique_custom_domain 
ON sites(custom_domain) 
WHERE custom_domain IS NOT NULL;
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Subdomain validation works
- [ ] Domain format validation works
- [ ] Publish service updates correctly
- [ ] Domain service CRUD works

### Integration Tests
- [ ] Publishing flow updates database
- [ ] Domain configuration saves correctly
- [ ] DNS verification flow works
- [ ] Public site rendering works

### E2E Tests
- [ ] User can publish site
- [ ] User sees "View Site" button after publish
- [ ] User can click and see live site
- [ ] User can add custom domain
- [ ] User sees DNS instructions
- [ ] User can verify domain

---

## ✅ Completion Checklist

- [ ] Enhanced publish service
- [ ] Domain service created
- [ ] Publish status badge component
- [ ] View site button component
- [ ] Enhanced publish dialog
- [ ] Domain settings component
- [ ] DNS instructions component
- [ ] Domain settings page
- [ ] Public site home renderer
- [ ] Public site page renderer
- [ ] Site renderer component
- [ ] Database migration for domains
- [ ] Tests passing

---

**Next Phase**: Phase 78 - Super Admin Dashboard
