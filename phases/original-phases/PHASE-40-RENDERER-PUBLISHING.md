# Phase 40: Site Renderer - Publishing

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **⚠️ FIRST**: Read `PHASE-37-RENDERER-FOUNDATION.md` through `PHASE-39-RENDERER-STYLING.md`

---

## 🎯 Objective

Implement the complete publishing flow - site/page publishing, domain verification, and DNS configuration guidance.

---

## 📋 Prerequisites

- [ ] Phase 37-39 completed (Renderer)
- [ ] Supabase setup complete
- [ ] Domain system understanding

---

## ✅ Tasks

### Task 40.1: Publishing Service

**File: `src/lib/publishing/publish-service.ts`**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { triggerRevalidation } from "@/lib/renderer/revalidate";

export interface PublishResult {
  success: boolean;
  publishedAt: string | null;
  error?: string;
  url?: string;
}

export async function publishSite(siteId: string): Promise<PublishResult> {
  const supabase = createAdminClient();

  try {
    // Get site details
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("slug, domain, client:clients(agency_id)")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return { success: false, publishedAt: null, error: "Site not found" };
    }

    // Verify at least one page is publishable
    const { count: pageCount } = await supabase
      .from("pages")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("published", true);

    if (!pageCount || pageCount === 0) {
      return { 
        success: false, 
        publishedAt: null, 
        error: "Site must have at least one published page" 
      };
    }

    // Update site to published
    const publishedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("sites")
      .update({
        published: true,
        published_at: publishedAt,
      })
      .eq("id", siteId);

    if (updateError) {
      return { success: false, publishedAt: null, error: "Failed to publish site" };
    }

    // Trigger revalidation
    await triggerRevalidation("site", site.slug);

    // Determine URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3000";
    const url = site.domain || `${site.slug}.${baseUrl}`;

    return {
      success: true,
      publishedAt,
      url: `https://${url}`,
    };
  } catch (error) {
    console.error("Publish site error:", error);
    return { success: false, publishedAt: null, error: "Unexpected error" };
  }
}

export async function unpublishSite(siteId: string): Promise<PublishResult> {
  const supabase = createAdminClient();

  try {
    const { data: site } = await supabase
      .from("sites")
      .select("slug")
      .eq("id", siteId)
      .single();

    const { error } = await supabase
      .from("sites")
      .update({
        published: false,
        published_at: null,
      })
      .eq("id", siteId);

    if (error) {
      return { success: false, publishedAt: null, error: "Failed to unpublish site" };
    }

    // Trigger revalidation to clear cache
    if (site?.slug) {
      await triggerRevalidation("site", site.slug);
    }

    return { success: true, publishedAt: null };
  } catch (error) {
    return { success: false, publishedAt: null, error: "Unexpected error" };
  }
}

export async function publishPage(pageId: string): Promise<PublishResult> {
  const supabase = createAdminClient();

  try {
    const { data: page } = await supabase
      .from("pages")
      .select("slug, site:sites(slug)")
      .eq("id", pageId)
      .single();

    const publishedAt = new Date().toISOString();
    const { error } = await supabase
      .from("pages")
      .update({
        published: true,
        published_at: publishedAt,
      })
      .eq("id", pageId);

    if (error) {
      return { success: false, publishedAt: null, error: "Failed to publish page" };
    }

    // Trigger page revalidation
    if (page?.site?.slug) {
      await triggerRevalidation("page", page.site.slug, page.slug);
    }

    return { success: true, publishedAt };
  } catch (error) {
    return { success: false, publishedAt: null, error: "Unexpected error" };
  }
}

export async function unpublishPage(pageId: string): Promise<PublishResult> {
  const supabase = createAdminClient();

  try {
    const { data: page } = await supabase
      .from("pages")
      .select("slug, site:sites(slug)")
      .eq("id", pageId)
      .single();

    const { error } = await supabase
      .from("pages")
      .update({
        published: false,
        published_at: null,
      })
      .eq("id", pageId);

    if (error) {
      return { success: false, publishedAt: null, error: "Failed to unpublish page" };
    }

    if (page?.site?.slug) {
      await triggerRevalidation("page", page.site.slug, page.slug);
    }

    return { success: true, publishedAt: null };
  } catch (error) {
    return { success: false, publishedAt: null, error: "Unexpected error" };
  }
}
```

### Task 40.2: Domain Verification Service

**File: `src/lib/publishing/domain-service.ts`**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

export interface DomainVerificationResult {
  verified: boolean;
  method: "txt" | "cname" | null;
  error?: string;
}

export interface DomainConfig {
  domain: string;
  txtRecord: string;
  cnameTarget: string;
}

export function generateDomainConfig(siteId: string): DomainConfig {
  const verificationCode = `dramac-verify=${siteId}`;
  const cnameTarget = process.env.NEXT_PUBLIC_CNAME_TARGET || "cname.platform.com";

  return {
    domain: "", // Will be filled by user
    txtRecord: verificationCode,
    cnameTarget,
  };
}

export async function verifyDomain(
  domain: string,
  siteId: string
): Promise<DomainVerificationResult> {
  const expectedTxt = `dramac-verify=${siteId}`;
  const expectedCname = process.env.NEXT_PUBLIC_CNAME_TARGET || "cname.platform.com";

  try {
    // Try TXT record verification
    try {
      const txtRecords = await resolveTxt(domain);
      const flatRecords = txtRecords.flat();
      
      if (flatRecords.some((record) => record.includes(expectedTxt))) {
        return { verified: true, method: "txt" };
      }
    } catch {
      // TXT lookup failed, continue to CNAME
    }

    // Try CNAME verification
    try {
      const cnameRecords = await resolveCname(domain);
      
      if (cnameRecords.some((record) => record === expectedCname)) {
        return { verified: true, method: "cname" };
      }
    } catch {
      // CNAME lookup failed
    }

    return {
      verified: false,
      method: null,
      error: "Domain verification failed. Please check your DNS settings.",
    };
  } catch (error) {
    return {
      verified: false,
      method: null,
      error: "Failed to verify domain. DNS lookup error.",
    };
  }
}

export async function setCustomDomain(
  siteId: string,
  domain: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Clean domain
  const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "");

  // Verify domain first
  const verification = await verifyDomain(cleanDomain, siteId);
  
  if (!verification.verified) {
    return {
      success: false,
      error: verification.error || "Domain verification failed",
    };
  }

  // Check if domain is already in use
  const { data: existing } = await supabase
    .from("sites")
    .select("id")
    .eq("domain", cleanDomain)
    .neq("id", siteId)
    .single();

  if (existing) {
    return {
      success: false,
      error: "This domain is already in use by another site",
    };
  }

  // Update site with domain
  const { error } = await supabase
    .from("sites")
    .update({
      domain: cleanDomain,
      domain_verified: true,
      domain_verified_at: new Date().toISOString(),
    })
    .eq("id", siteId);

  if (error) {
    return { success: false, error: "Failed to set custom domain" };
  }

  return { success: true };
}

export async function removeCustomDomain(
  siteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("sites")
    .update({
      domain: null,
      domain_verified: false,
      domain_verified_at: null,
    })
    .eq("id", siteId);

  if (error) {
    return { success: false, error: "Failed to remove custom domain" };
  }

  return { success: true };
}
```

### Task 40.3: Publishing API Routes

**File: `src/app/api/sites/[siteId]/publish/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishSite, unpublishSite } from "@/lib/publishing/publish-service";

interface RouteParams {
  params: Promise<{ siteId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { siteId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this site
    const { data: site } = await supabase
      .from("sites")
      .select("id, client:clients(agency_id)")
      .eq("id", siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const result = await publishSite(siteId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish site" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { siteId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await unpublishSite(siteId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to unpublish site" },
      { status: 500 }
    );
  }
}
```

**File: `src/app/api/sites/[siteId]/domain/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  setCustomDomain,
  removeCustomDomain,
  verifyDomain,
  generateDomainConfig,
} from "@/lib/publishing/domain-service";

interface RouteParams {
  params: Promise<{ siteId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { siteId } = await params;
  
  // Return domain configuration info
  const config = generateDomainConfig(siteId);
  
  return NextResponse.json(config);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { siteId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const result = await setCustomDomain(siteId, domain);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, domain });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to set domain" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { siteId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await removeCustomDomain(siteId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove domain" },
      { status: 500 }
    );
  }
}

// Verify domain without setting it
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { siteId } = await params;
    const body = await request.json();
    const { domain } = body;

    const result = await verifyDomain(domain, siteId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to verify domain" },
      { status: 500 }
    );
  }
}
```

### Task 40.4: Publish Dialog Component

**File: `src/components/publishing/publish-dialog.tsx`**

```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Globe, Loader2, ExternalLink } from "lucide-react";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteName: string;
  siteSlug: string;
  isPublished: boolean;
  customDomain?: string | null;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
}

export function PublishDialog({
  open,
  onOpenChange,
  siteId,
  siteName,
  siteSlug,
  isPublished,
  customDomain,
  onPublish,
  onUnpublish,
}: PublishDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; url?: string } | null>(null);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "platform.com";
  const liveUrl = customDomain || `${siteSlug}.${baseDomain}`;

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      await onPublish();
      setResult({ success: true, url: `https://${liveUrl}` });
    } catch (error) {
      setResult({ success: false });
    }
    setIsLoading(false);
  };

  const handleUnpublish = async () => {
    setIsLoading(true);
    try {
      await onUnpublish();
      setResult(null);
      onOpenChange(false);
    } catch (error) {
      // Handle error
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {isPublished ? "Site Published" : "Publish Site"}
          </DialogTitle>
          <DialogDescription>
            {isPublished
              ? `${siteName} is live and accessible to visitors.`
              : `Publish ${siteName} to make it accessible to visitors.`}
          </DialogDescription>
        </DialogHeader>

        {result?.success ? (
          <div className="py-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Published Successfully!</h3>
            <p className="text-muted-foreground mb-4">Your site is now live at:</p>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              {result.url}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="py-4">
            <div className="rounded-lg border p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Site URL</span>
                <Badge variant={isPublished ? "default" : "secondary"}>
                  {isPublished ? "Live" : "Draft"}
                </Badge>
              </div>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                https://{liveUrl}
              </code>
            </div>

            {!isPublished && (
              <div className="text-sm text-muted-foreground">
                <p>Before publishing, make sure:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>At least one page is marked as published</li>
                  <li>Your homepage is set correctly</li>
                  <li>All content is reviewed and ready</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result?.success ? (
            <Button onClick={handleClose}>Done</Button>
          ) : isPublished ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleUnpublish}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Unpublish Site
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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

### Task 40.5: Domain Settings Component

**File: `src/components/publishing/domain-settings.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Check, X, Loader2, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface DomainSettingsProps {
  siteId: string;
  siteSlug: string;
  currentDomain: string | null;
  isVerified: boolean;
}

interface DomainConfig {
  txtRecord: string;
  cnameTarget: string;
}

export function DomainSettings({
  siteId,
  siteSlug,
  currentDomain,
  isVerified,
}: DomainSettingsProps) {
  const [domain, setDomain] = useState(currentDomain || "");
  const [config, setConfig] = useState<DomainConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "failed" | null>(null);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "platform.com";
  const subdomainUrl = `${siteSlug}.${baseDomain}`;

  useEffect(() => {
    // Fetch domain config
    fetch(`/api/sites/${siteId}/domain`)
      .then((res) => res.json())
      .then(setConfig);
  }, [siteId]);

  const handleVerify = async () => {
    if (!domain) return;

    setIsVerifying(true);
    setVerificationStatus("pending");

    try {
      const res = await fetch(`/api/sites/${siteId}/domain`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      const result = await res.json();

      if (result.verified) {
        setVerificationStatus("success");
      } else {
        setVerificationStatus("failed");
      }
    } catch {
      setVerificationStatus("failed");
    }

    setIsVerifying(false);
  };

  const handleSave = async () => {
    if (!domain) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/sites/${siteId}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Custom domain saved successfully");
      } else {
        toast.error(result.error || "Failed to save domain");
      }
    } catch {
      toast.error("Failed to save domain");
    }

    setIsLoading(false);
  };

  const handleRemove = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/sites/${siteId}/domain`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDomain("");
        setVerificationStatus(null);
        toast.success("Custom domain removed");
      }
    } catch {
      toast.error("Failed to remove domain");
    }

    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Custom Domain
        </CardTitle>
        <CardDescription>
          Connect your own domain to this site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default subdomain */}
        <div className="p-4 rounded-lg bg-muted">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Default URL</p>
              <p className="text-sm text-muted-foreground">{subdomainUrl}</p>
            </div>
            <Badge>Always Active</Badge>
          </div>
        </div>

        {/* Custom domain input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Custom Domain</Label>
            <div className="flex gap-2">
              <Input
                placeholder="www.example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={!domain || isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Verification status */}
          {verificationStatus && (
            <Alert variant={verificationStatus === "success" ? "default" : "destructive"}>
              <AlertDescription className="flex items-center gap-2">
                {verificationStatus === "success" ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Domain verified successfully
                  </>
                ) : verificationStatus === "failed" ? (
                  <>
                    <X className="h-4 w-4" />
                    Domain verification failed. Please check DNS settings.
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying domain...
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* DNS Configuration */}
        {config && domain && (
          <div className="space-y-4 p-4 rounded-lg border">
            <h4 className="font-medium">DNS Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Add one of the following records to your DNS provider:
            </p>

            {/* CNAME Option */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Option 1: CNAME Record</p>
              <div className="flex items-center gap-2 bg-muted p-2 rounded text-sm font-mono">
                <span className="text-muted-foreground">CNAME</span>
                <span className="flex-1">{config.cnameTarget}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(config.cnameTarget)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* TXT Option */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Option 2: TXT Record (for verification)</p>
              <div className="flex items-center gap-2 bg-muted p-2 rounded text-sm font-mono">
                <span className="text-muted-foreground">TXT</span>
                <span className="flex-1 truncate">{config.txtRecord}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(config.txtRecord)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {currentDomain && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isLoading}
            >
              Remove Domain
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!domain || verificationStatus !== "success" || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {currentDomain ? "Update Domain" : "Connect Domain"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 40.6: Publishing Hooks

**File: `src/lib/hooks/use-publishing.ts`**

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function usePublishSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (siteId: string) => {
      const res = await fetch(`/api/sites/${siteId}/publish`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to publish");
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Site published successfully!");
      if (data.url) {
        toast.info(`Live at: ${data.url}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUnpublishSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (siteId: string) => {
      const res = await fetch(`/api/sites/${siteId}/publish`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to unpublish");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Site unpublished");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function usePublishPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      const res = await fetch(`/api/pages/${pageId}/publish`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to publish page");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Page published");
    },
  });
}
```

---

## 📐 Acceptance Criteria

- [ ] Sites can be published/unpublished
- [ ] Pages can be published individually
- [ ] Domain verification works (TXT/CNAME)
- [ ] Custom domain can be connected
- [ ] Publish dialog shows correct status
- [ ] Domain settings UI functional
- [ ] Revalidation triggers on publish

---

## 📁 Files Created This Phase

```
src/lib/publishing/
├── publish-service.ts
└── domain-service.ts

src/app/api/sites/[siteId]/
├── publish/
│   └── route.ts
└── domain/
    └── route.ts

src/components/publishing/
├── publish-dialog.tsx
└── domain-settings.tsx

src/lib/hooks/
└── use-publishing.ts
```

---

## ➡️ Next Phase

**Phase 41: Production - Database Migration** - Final Supabase setup, indexes, and production readiness.
