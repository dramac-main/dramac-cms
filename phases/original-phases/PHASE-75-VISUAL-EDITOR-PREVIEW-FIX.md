# Phase 75: Visual Editor Preview & Site Rendering Fix

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 5-6 hours

---

## 🎯 Objective

Fix the visual editor preview functionality so users can preview their pages in real-time, switch between device sizes, and view the live rendered site. Ensure the site renderer properly displays published pages.

---

## 📋 Prerequisites

- [ ] Visual editor working with Craft.js
- [ ] Page data saving to database
- [ ] Preview API route functional
- [ ] Component resolver configured

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ Preview page at `/preview/[siteId]/[pageId]/page.tsx`
- ✅ Preview API at `/api/preview/[siteId]/[pageId]/route.ts`
- ✅ Editor canvas with responsive width settings
- ✅ Component resolver for Craft.js

**What's Missing:**
- ❌ Preview button in editor toolbar
- ❌ Preview toggle in editor (inline preview mode)
- ❌ Responsive device switcher (mobile/tablet/desktop)
- ❌ Preview in new window option
- ❌ Live preview panel (side-by-side)
- ❌ Error handling for rendering failures
- ❌ Loading states in preview
- ❌ Preview URL copy functionality

---

## 💼 Business Value

1. **User Confidence** - See exactly what will be published
2. **Quality Assurance** - Catch issues before publishing
3. **Client Presentations** - Show work in progress
4. **Device Testing** - Ensure mobile responsiveness
5. **Faster Iteration** - Quick feedback loop

---

## 📁 Files to Create/Modify

```
src/components/editor/
├── preview-toolbar.tsx          # Device switcher + preview button
├── preview-panel.tsx            # Side-by-side preview
├── preview-frame.tsx            # Iframe preview container
├── preview-device-switcher.tsx  # Device size controls
├── editor-header.tsx            # Enhanced editor header

src/app/preview/
├── [siteId]/[pageId]/page.tsx   # Fix preview page (MODIFY)

src/app/api/preview/
├── [siteId]/[pageId]/route.ts   # Fix API route (MODIFY)

src/lib/preview/
├── preview-utils.ts             # Preview URL utilities
├── use-preview.ts               # Preview state hook

src/app/(dashboard)/sites/[siteId]/editor/[pageId]/
├── page.tsx                     # Add preview integration (MODIFY)
```

---

## ✅ Tasks

### Task 75.1: Preview Utilities

**File: `src/lib/preview/preview-utils.ts`**

```typescript
export type DeviceType = "mobile" | "tablet" | "desktop" | "full";

export interface DeviceConfig {
  id: DeviceType;
  label: string;
  icon: string;
  width: number;
  height: number;
  scale?: number;
}

export const DEVICES: DeviceConfig[] = [
  { id: "mobile", label: "Mobile", icon: "📱", width: 375, height: 667 },
  { id: "tablet", label: "Tablet", icon: "📱", width: 768, height: 1024 },
  { id: "desktop", label: "Desktop", icon: "🖥️", width: 1280, height: 800 },
  { id: "full", label: "Full Width", icon: "🖥️", width: 0, height: 0 }, // 0 = 100%
];

export function getDeviceConfig(device: DeviceType): DeviceConfig {
  return DEVICES.find((d) => d.id === device) || DEVICES[2];
}

export function getPreviewUrl(siteId: string, pageId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return `${baseUrl}/preview/${siteId}/${pageId}`;
}

export function getPublicUrl(subdomain: string, customDomain?: string | null): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";
  return `https://${subdomain}.${baseDomain}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
```

---

### Task 75.2: Preview State Hook

**File: `src/lib/preview/use-preview.ts`**

```typescript
"use client";

import { useState, useCallback, useMemo } from "react";
import type { DeviceType } from "./preview-utils";
import { getPreviewUrl } from "./preview-utils";

interface UsePreviewOptions {
  siteId: string;
  pageId: string;
}

export function usePreview({ siteId, pageId }: UsePreviewOptions) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const previewUrl = useMemo(
    () => getPreviewUrl(siteId, pageId),
    [siteId, pageId]
  );

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode((prev) => !prev);
  }, []);

  const togglePreviewPanel = useCallback(() => {
    setShowPreviewPanel((prev) => !prev);
  }, []);

  const refreshPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  const openInNewWindow = useCallback(() => {
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }, [previewUrl]);

  return {
    isPreviewMode,
    setIsPreviewMode,
    togglePreviewMode,
    device,
    setDevice,
    showPreviewPanel,
    setShowPreviewPanel,
    togglePreviewPanel,
    previewUrl,
    previewKey,
    refreshPreview,
    openInNewWindow,
  };
}
```

---

### Task 75.3: Device Switcher Component

**File: `src/components/editor/preview-device-switcher.tsx`**

```tsx
"use client";

import { Smartphone, Tablet, Monitor, Maximize2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DeviceType } from "@/lib/preview/preview-utils";
import { DEVICES } from "@/lib/preview/preview-utils";

interface PreviewDeviceSwitcherProps {
  value: DeviceType;
  onChange: (device: DeviceType) => void;
  disabled?: boolean;
}

const DEVICE_ICONS: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  full: Maximize2,
};

export function PreviewDeviceSwitcher({
  value,
  onChange,
  disabled,
}: PreviewDeviceSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as DeviceType)}
      disabled={disabled}
    >
      {DEVICES.map((device) => {
        const Icon = DEVICE_ICONS[device.id];
        return (
          <Tooltip key={device.id}>
            <TooltipTrigger asChild>
              <ToggleGroupItem value={device.id} aria-label={device.label}>
                <Icon className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {device.label}
                {device.width > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({device.width}px)
                  </span>
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}
```

---

### Task 75.4: Preview Frame Component

**File: `src/components/editor/preview-frame.tsx`**

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDeviceConfig, type DeviceType } from "@/lib/preview/preview-utils";

interface PreviewFrameProps {
  url: string;
  device: DeviceType;
  refreshKey?: number;
  className?: string;
}

export function PreviewFrame({
  url,
  device,
  refreshKey = 0,
  className,
}: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const deviceConfig = getDeviceConfig(device);
  const isFullWidth = device === "full";

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [url, refreshKey]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      setHasError(false);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-muted/30 overflow-hidden",
        className
      )}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-medium">Preview Failed to Load</h3>
              <p className="text-sm text-muted-foreground">
                There was an error loading the preview.
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Device frame */}
      <div
        className={cn(
          "bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300",
          !isFullWidth && "border-8 border-gray-800 rounded-[2rem]"
        )}
        style={{
          width: isFullWidth ? "100%" : deviceConfig.width,
          height: isFullWidth ? "100%" : deviceConfig.height,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        {/* Device notch for mobile */}
        {device === "mobile" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-gray-800 rounded-b-xl z-20" />
        )}

        <iframe
          ref={iframeRef}
          src={`${url}?t=${refreshKey}`}
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleError}
          title="Page Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
```

---

### Task 75.5: Preview Toolbar Component

**File: `src/components/editor/preview-toolbar.tsx`**

```tsx
"use client";

import {
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  PanelRightOpen,
  PanelRightClose,
  Check,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { PreviewDeviceSwitcher } from "./preview-device-switcher";
import { useState } from "react";
import type { DeviceType } from "@/lib/preview/preview-utils";
import { copyToClipboard } from "@/lib/preview/preview-utils";
import { toast } from "sonner";

interface PreviewToolbarProps {
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  showPanel: boolean;
  onTogglePanel: () => void;
  previewUrl: string;
  onOpenNewWindow: () => void;
  onRefresh: () => void;
}

export function PreviewToolbar({
  isPreviewMode,
  onTogglePreview,
  device,
  onDeviceChange,
  showPanel,
  onTogglePanel,
  previewUrl,
  onOpenNewWindow,
  onRefresh,
}: PreviewToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await copyToClipboard(previewUrl);
      setCopied(true);
      toast.success("Preview URL copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Device Switcher */}
      <PreviewDeviceSwitcher
        value={device}
        onChange={onDeviceChange}
        disabled={!isPreviewMode && !showPanel}
      />

      <Separator orientation="vertical" className="h-6" />

      {/* Preview Mode Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isPreviewMode ? "default" : "outline"}
            size="sm"
            onClick={onTogglePreview}
          >
            {isPreviewMode ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Exit Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isPreviewMode ? "Exit preview mode" : "Enter preview mode"}</p>
        </TooltipContent>
      </Tooltip>

      {/* Side Panel Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={onTogglePanel}>
            {showPanel ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{showPanel ? "Hide preview panel" : "Show preview panel"}</p>
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      {/* Refresh Preview */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Refresh preview</p>
        </TooltipContent>
      </Tooltip>

      {/* Copy URL */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handleCopyUrl}>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy preview URL</p>
        </TooltipContent>
      </Tooltip>

      {/* Open in New Window */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onOpenNewWindow}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Open in new window</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
```

---

### Task 75.6: Preview Panel Component

**File: `src/components/editor/preview-panel.tsx`**

```tsx
"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreviewFrame } from "./preview-frame";
import { PreviewDeviceSwitcher } from "./preview-device-switcher";
import type { DeviceType } from "@/lib/preview/preview-utils";
import { cn } from "@/lib/utils";

interface PreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  refreshKey: number;
}

export function PreviewPanel({
  isOpen,
  onClose,
  url,
  device,
  onDeviceChange,
  refreshKey,
}: PreviewPanelProps) {
  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-screen bg-background border-l shadow-lg z-40 transition-all duration-300",
        isOpen ? "w-[50vw]" : "w-0"
      )}
    >
      {isOpen && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-4">
              <h3 className="font-medium">Live Preview</h3>
              <PreviewDeviceSwitcher value={device} onChange={onDeviceChange} />
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Preview Frame */}
          <div className="flex-1 p-4">
            <PreviewFrame
              url={url}
              device={device}
              refreshKey={refreshKey}
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Task 75.7: Enhanced Editor Header

**File: `src/components/editor/editor-header.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  MoreHorizontal,
  Settings,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PreviewToolbar } from "./preview-toolbar";
import type { DeviceType } from "@/lib/preview/preview-utils";
import { toast } from "sonner";

interface EditorHeaderProps {
  siteId: string;
  siteName: string;
  pageName: string;
  pageId: string;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onSave: () => Promise<void>;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  showPreviewPanel: boolean;
  onTogglePreviewPanel: () => void;
  previewUrl: string;
  onOpenNewWindow: () => void;
  onRefreshPreview: () => void;
  onPublish?: () => void;
}

export function EditorHeader({
  siteId,
  siteName,
  pageName,
  isSaving,
  hasUnsavedChanges,
  onSave,
  isPreviewMode,
  onTogglePreview,
  device,
  onDeviceChange,
  showPreviewPanel,
  onTogglePreviewPanel,
  previewUrl,
  onOpenNewWindow,
  onRefreshPreview,
  onPublish,
}: EditorHeaderProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!onPublish) return;
    setIsPublishing(true);
    try {
      await onPublish();
      toast.success("Site published!");
    } catch (error) {
      toast.error("Failed to publish site");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      {/* Left: Back + Page Info */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/sites/${siteId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-medium text-sm">{pageName}</h1>
          <p className="text-xs text-muted-foreground">{siteName}</p>
        </div>
        {hasUnsavedChanges && (
          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded">
            Unsaved
          </span>
        )}
      </div>

      {/* Center: Preview Controls */}
      <PreviewToolbar
        isPreviewMode={isPreviewMode}
        onTogglePreview={onTogglePreview}
        device={device}
        onDeviceChange={onDeviceChange}
        showPanel={showPreviewPanel}
        onTogglePanel={onTogglePreviewPanel}
        previewUrl={previewUrl}
        onOpenNewWindow={onOpenNewWindow}
        onRefresh={onRefreshPreview}
      />

      {/* Right: Save + Publish */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save
        </Button>

        <Button
          size="sm"
          onClick={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Globe className="h-4 w-4 mr-1" />
          )}
          Publish
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/sites/${siteId}/settings`)}>
              <Settings className="h-4 w-4 mr-2" />
              Site Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/sites/${siteId}/pages`)}>
              All Pages
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

---

### Task 75.8: Fix Preview API Route

**File: `src/app/api/preview/[siteId]/[pageId]/route.ts`** (REPLACE)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ siteId: string; pageId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { siteId, pageId } = await params;
    const supabase = await createClient();

    // Get page with site info
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select(`
        id,
        name,
        slug,
        content,
        meta_title,
        meta_description,
        site:sites (
          id,
          name,
          subdomain,
          custom_domain,
          theme_settings
        )
      `)
      .eq("id", pageId)
      .eq("site_id", siteId)
      .single();

    if (pageError || !page) {
      console.error("[Preview API] Page not found:", pageError);
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    // Return page content for Craft.js
    return NextResponse.json({
      page: {
        id: page.id,
        name: page.name,
        slug: page.slug,
        metaTitle: page.meta_title,
        metaDescription: page.meta_description,
      },
      site: page.site,
      content: page.content || null,
      themeSettings: page.site?.theme_settings || null,
    });
  } catch (error) {
    console.error("[Preview API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### Task 75.9: Fix Preview Page

**File: `src/app/preview/[siteId]/[pageId]/page.tsx`** (REPLACE)

```tsx
"use client";

import { useEffect, useState } from "react";
import { Editor, Frame, Element } from "@craftjs/core";
import { componentResolver } from "@/components/editor/resolver";
import { Root } from "@/components/editor/user-components/root";
import { Loader2, AlertTriangle } from "lucide-react";

interface PreviewPageProps {
  params: Promise<{ siteId: string; pageId: string }>;
}

interface PreviewData {
  page: {
    id: string;
    name: string;
    slug: string;
    metaTitle: string;
    metaDescription: string;
  };
  site: {
    id: string;
    name: string;
    subdomain: string;
    theme_settings: Record<string, unknown>;
  };
  content: string | null;
  themeSettings: Record<string, unknown> | null;
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const { siteId, pageId } = await params;
        const response = await fetch(`/api/preview/${siteId}/${pageId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to load preview (${response.status})`);
        }
        
        const previewData = await response.json();
        setData(previewData);
      } catch (err) {
        console.error("[Preview] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load preview");
      } finally {
        setLoading(false);
      }
    }

    fetchPreview();
  }, [params]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Preview Error</h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No content state
  if (!data?.content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📄</span>
          </div>
          <h1 className="text-xl font-semibold mb-2">No Content Yet</h1>
          <p className="text-gray-500">
            This page doesn't have any content. Open the editor to add components.
          </p>
        </div>
      </div>
    );
  }

  // Apply theme settings as CSS variables
  const themeStyle = data.themeSettings
    ? {
        "--primary": (data.themeSettings as Record<string, string>).primaryColor || "#3b82f6",
        "--font-family": (data.themeSettings as Record<string, string>).fontFamily || "Inter, sans-serif",
      }
    : {};

  return (
    <>
      {/* SEO Meta */}
      <head>
        <title>{data.page.metaTitle || data.page.name}</title>
        {data.page.metaDescription && (
          <meta name="description" content={data.page.metaDescription} />
        )}
      </head>

      <div className="min-h-screen bg-white" style={themeStyle as React.CSSProperties}>
        <Editor
          resolver={componentResolver}
          enabled={false}
          onRender={({ render }) => render}
        >
          <Frame data={data.content}>
            <Element is={Root} canvas />
          </Frame>
        </Editor>
      </div>
    </>
  );
}
```

---

### Task 75.10: Editor Page Integration Example

Add to existing editor page to integrate preview:

```tsx
// In your editor page component, add:

import { usePreview } from "@/lib/preview/use-preview";
import { EditorHeader } from "@/components/editor/editor-header";
import { PreviewPanel } from "@/components/editor/preview-panel";

// Inside component:
const {
  isPreviewMode,
  togglePreviewMode,
  device,
  setDevice,
  showPreviewPanel,
  togglePreviewPanel,
  previewUrl,
  previewKey,
  refreshPreview,
  openInNewWindow,
} = usePreview({ siteId, pageId });

// In JSX:
<>
  <EditorHeader
    siteId={siteId}
    siteName={site.name}
    pageName={page.name}
    pageId={pageId}
    isSaving={isSaving}
    hasUnsavedChanges={hasChanges}
    onSave={handleSave}
    isPreviewMode={isPreviewMode}
    onTogglePreview={togglePreviewMode}
    device={device}
    onDeviceChange={setDevice}
    showPreviewPanel={showPreviewPanel}
    onTogglePreviewPanel={togglePreviewPanel}
    previewUrl={previewUrl}
    onOpenNewWindow={openInNewWindow}
    onRefreshPreview={refreshPreview}
  />

  <div className="flex flex-1">
    {/* Editor Canvas - shrinks when panel is open */}
    <div className={cn("flex-1", showPreviewPanel && "mr-[50vw]")}>
      {isPreviewMode ? (
        <PreviewFrame url={previewUrl} device={device} refreshKey={previewKey} />
      ) : (
        <EditorCanvas />
      )}
    </div>
  </div>

  {/* Side-by-side preview panel */}
  <PreviewPanel
    isOpen={showPreviewPanel}
    onClose={togglePreviewPanel}
    url={previewUrl}
    device={device}
    onDeviceChange={setDevice}
    refreshKey={previewKey}
  />
</>
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Device config returns correct sizes
- [ ] Preview URL generation works
- [ ] Copy to clipboard works

### Integration Tests
- [ ] Preview API returns page content
- [ ] Preview page renders content
- [ ] Device switcher updates preview size

### E2E Tests
- [ ] User can click Preview button
- [ ] Preview shows page content
- [ ] Device switching works
- [ ] Open in new window works
- [ ] Copy URL works

---

## ✅ Completion Checklist

- [ ] Preview utilities created
- [ ] Preview hook created
- [ ] Device switcher component created
- [ ] Preview frame component created
- [ ] Preview toolbar component created
- [ ] Preview panel component created
- [ ] Editor header enhanced
- [ ] Preview API fixed
- [ ] Preview page fixed
- [ ] Editor page integrated
- [ ] Tests passing

---

**Next Phase**: Phase 76 - Module Marketplace Complete
