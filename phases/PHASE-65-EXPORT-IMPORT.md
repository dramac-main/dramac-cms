# Phase 65: Export/Import System - ADD UI Components

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 LOW (Core export/import exists!)
>
> **Estimated Time**: 30 minutes - 1 hour

---

## ⚠️ CRITICAL: EXPORT/IMPORT ALREADY EXISTS!

**The core export/import logic is implemented:**
- ✅ `src/lib/sites/export.ts` (182 lines)
- ✅ Export action exists in `src/lib/actions/export-import.ts`

**What Already Exists:**
- ✅ `SiteExportData` interface
- ✅ `exportSite(siteId)` function
- ✅ Export is used by backup system

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAMES!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `site_modules` | `site_module_installations` |
| `modules` | `modules_v2` |

---

## 🎯 Objective

ADD UI components for export/import. DO NOT recreate the core logic!

---

## 📋 Prerequisites

- [ ] `src/lib/sites/export.ts` exists (it does!)
- [ ] `src/lib/actions/export-import.ts` exists

---

## ✅ Tasks

### Task 65.1: Verify Existing Implementation

**Check what exists:**

```typescript
// src/lib/sites/export.ts
import { exportSite, SiteExportData } from "@/lib/sites/export";

// Check if actions exist:
import { exportSiteAction, importSiteAction } from "@/lib/actions/export-import";
```

---

### Task 65.2: Export Button Component

**File: `src/components/sites/export-site-button.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportSiteAction } from "@/lib/actions/export-import";

interface ExportSiteButtonProps {
  siteId: string;
  siteName: string;
}

export function ExportSiteButton({ siteId, siteName }: ExportSiteButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    
    try {
      const result = await exportSiteAction(siteId);
      
      if (result.success && result.data) {
        // Create download
        const json = JSON.stringify(result.data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `${siteName.toLowerCase().replace(/\s+/g, "-")}-export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success("Site exported successfully");
      } else {
        toast.error("Export failed", { description: result.error });
      }
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={exporting}>
      {exporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export Site
    </Button>
  );
}
```

---

### Task 65.3: Import Site Dialog

**File: `src/components/sites/import-site-dialog.tsx`**

```typescript
"use client";

import { useState, useCallback } from "react";
import { Upload, Loader2, FileJson } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { importSiteAction } from "@/lib/actions/export-import";
import { cn } from "@/lib/utils";

interface ImportSiteDialogProps {
  clientId: string;
  onImported?: (siteId: string) => void;
  trigger?: React.ReactNode;
}

export function ImportSiteDialog({
  clientId,
  onImported,
  trigger,
}: ImportSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [newName, setNewName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [importing, setImporting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const jsonFile = acceptedFiles.find((f) => f.type === "application/json");
    if (jsonFile) {
      setFile(jsonFile);
      // Try to extract name from filename
      const baseName = jsonFile.name.replace(/-export\.json$/, "").replace(/[-_]/g, " ");
      setNewName(baseName);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    maxFiles: 1,
  });

  async function handleImport() {
    if (!file || !newName || !subdomain) {
      toast.error("Please fill all fields");
      return;
    }

    setImporting(true);
    
    try {
      const content = await file.text();
      const exportData = JSON.parse(content);
      
      const result = await importSiteAction({
        exportData,
        clientId,
        newName,
        newSubdomain: subdomain,
      });

      if (result.success && result.siteId) {
        toast.success("Site imported successfully!");
        setOpen(false);
        setFile(null);
        setNewName("");
        setSubdomain("");
        onImported?.(result.siteId);
      } else {
        toast.error("Import failed", { description: result.error });
      }
    } catch (error) {
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : "Invalid file format",
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Site
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Site</DialogTitle>
          <DialogDescription>
            Import a site from a JSON export file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              file && "border-green-500 bg-green-500/5"
            )}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileJson className="h-8 w-8 text-green-500" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag & drop a JSON file, or click to browse
                </p>
              </>
            )}
          </div>

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">Site Name</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My Imported Site"
            />
          </div>

          {/* Subdomain field */}
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <Input
              id="subdomain"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="my-site"
            />
            <p className="text-xs text-muted-foreground">
              {subdomain || "my-site"}.yourdomain.com
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importing || !file}>
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Site
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 65.4: Server Actions (if not complete)

**Verify `src/lib/actions/export-import.ts` has both functions:**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { exportSite } from "@/lib/sites/export";
import { revalidatePath } from "next/cache";

export async function exportSiteAction(siteId: string) {
  return exportSite(siteId);
}

export async function importSiteAction(options: {
  exportData: unknown;
  clientId: string;
  newName: string;
  newSubdomain: string;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Get agency ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    return { success: false, error: "No agency found" };
  }

  const exportData = options.exportData as any;
  
  // Validate export data
  if (!exportData.version || !exportData.pages) {
    return { success: false, error: "Invalid export file format" };
  }

  // Check subdomain availability
  const { data: existing } = await supabase
    .from("sites")
    .select("id")
    .eq("subdomain", options.newSubdomain)
    .single();

  if (existing) {
    return { success: false, error: "Subdomain already exists" };
  }

  // Create site
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      name: options.newName,
      subdomain: options.newSubdomain,
      client_id: options.clientId,
      agency_id: profile.agency_id,
      settings: exportData.siteInfo?.settings || {},
      seo_title: exportData.siteInfo?.seoTitle,
      seo_description: exportData.siteInfo?.seoDescription,
    })
    .select()
    .single();

  if (siteError || !site) {
    return { success: false, error: siteError?.message || "Failed to create site" };
  }

  // Import pages
  for (const page of exportData.pages || []) {
    await supabase.from("pages").insert({
      site_id: site.id,
      name: page.name,
      slug: page.slug,
      seo_title: page.seoTitle,
      seo_description: page.seoDescription,
      is_homepage: page.isHomepage,
      sort_order: page.sortOrder,
    });
    
    // Import page content if exists
    if (page.content) {
      const { data: newPage } = await supabase
        .from("pages")
        .select("id")
        .eq("site_id", site.id)
        .eq("slug", page.slug)
        .single();
        
      if (newPage) {
        await supabase.from("page_content").insert({
          page_id: newPage.id,
          content: page.content,
        });
      }
    }
  }

  revalidatePath("/dashboard/sites");
  
  return { success: true, siteId: site.id };
}
```

---

## ✅ Completion Checklist

- [ ] Verified export function exists
- [ ] Export button component created
- [ ] Import dialog component created  
- [ ] Server actions complete
- [ ] Tested export downloads JSON
- [ ] Tested import creates site
- [ ] Verified imported site has all pages

---

## 📝 Notes for AI Agent

1. **DON'T RECREATE** - Export logic exists in `src/lib/sites/export.ts`!
2. **UI ONLY** - Just add download button and import dialog
3. **CORRECT TABLES** - Use `site_module_installations` if importing modules
4. **VALIDATE IMPORTS** - Check file format before processing
5. **MINIMAL CHANGES** - Core system works!
