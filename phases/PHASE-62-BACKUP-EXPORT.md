# Phase 62: Backup & Export System

> **AI Model**: Claude Opus 4.5 (2x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` and complete Phase 61

---

## 🎯 Objective

Implement site backup and export/import functionality from original platform:
1. Full site export to JSON
2. Site import from JSON
3. Automated backup system
4. Manual backup triggers

---

## 📋 Prerequisites

- [ ] Phase 61 completed
- [ ] Supabase Storage configured

---

## ✅ Tasks

### Task 59.1: Site Export

**File: `src/lib/sites/export.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";

export interface SiteExportData {
  version: "1.0";
  exportDate: string;
  siteInfo: {
    name: string;
    subdomain: string;
    status: string;
    theme: Record<string, unknown>;
    settings: Record<string, unknown>;
  };
  pages: Array<{
    slug: string;
    title: string;
    content: unknown;
    seoTitle: string | null;
    seoDescription: string | null;
    isHomepage: boolean;
    isPublished: boolean;
    sortOrder: number;
  }>;
  modules: Array<{
    moduleSlug: string;
    settings: Record<string, unknown>;
    isEnabled: boolean;
  }>;
  metadata: {
    totalPages: number;
    totalModules: number;
    exportedBy: string;
  };
}

/**
 * Export entire site to JSON format
 */
export async function exportSite(siteId: string): Promise<{
  success: boolean;
  data?: SiteExportData;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // 1. Get site info
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("*")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return { success: false, error: "Site not found" };
    }

    // 2. Get all pages
    const { data: pages, error: pagesError } = await supabase
      .from("pages")
      .select("*")
      .eq("site_id", siteId)
      .order("sort_order", { ascending: true });

    if (pagesError) {
      return { success: false, error: `Failed to get pages: ${pagesError.message}` };
    }

    // 3. Get enabled modules
    const { data: siteModules, error: modulesError } = await supabase
      .from("site_modules")
      .select(`
        settings,
        is_enabled,
        module:modules(slug)
      `)
      .eq("site_id", siteId);

    if (modulesError) {
      return { success: false, error: `Failed to get modules: ${modulesError.message}` };
    }

    // 4. Build export data
    const exportData: SiteExportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      siteInfo: {
        name: site.name,
        subdomain: site.subdomain,
        status: site.status,
        theme: site.theme || {},
        settings: site.settings || {},
      },
      pages: (pages || []).map((page) => ({
        slug: page.slug,
        title: page.title,
        content: page.content,
        seoTitle: page.seo_title,
        seoDescription: page.seo_description,
        isHomepage: page.is_homepage,
        isPublished: page.is_published,
        sortOrder: page.sort_order,
      })),
      modules: (siteModules || []).map((sm) => ({
        moduleSlug: (sm.module as { slug: string })?.slug || "",
        settings: sm.settings as Record<string, unknown>,
        isEnabled: sm.is_enabled,
      })).filter(m => m.moduleSlug),
      metadata: {
        totalPages: pages?.length || 0,
        totalModules: siteModules?.filter(m => m.is_enabled).length || 0,
        exportedBy: user.email || user.id,
      },
    };

    return { success: true, data: exportData };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}

/**
 * Export site and return as downloadable JSON
 */
export async function exportSiteToJSON(siteId: string): Promise<{
  success: boolean;
  json?: string;
  filename?: string;
  error?: string;
}> {
  const result = await exportSite(siteId);

  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }

  const filename = `${result.data.siteInfo.subdomain}-export-${
    new Date().toISOString().split("T")[0]
  }.json`;

  return {
    success: true,
    json: JSON.stringify(result.data, null, 2),
    filename,
  };
}
```

### Task 59.2: Site Import

**File: `src/lib/sites/import.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import type { SiteExportData } from "./export";

export interface ImportOptions {
  targetSiteId?: string;      // Import into existing site
  newSiteName?: string;       // Create new site
  newSubdomain?: string;      // For new site
  clientId: string;           // Required for new site
  overwritePages: boolean;    // Replace existing pages
  importModules: boolean;     // Import module settings
}

export interface ImportResult {
  success: boolean;
  siteId?: string;
  error?: string;
  details?: {
    pagesImported: number;
    pagesSkipped: number;
    modulesImported: number;
  };
}

/**
 * Validate import data structure
 */
export function validateImportData(data: unknown): {
  valid: boolean;
  error?: string;
  data?: SiteExportData;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid data format" };
  }

  const exportData = data as SiteExportData;

  if (exportData.version !== "1.0") {
    return { valid: false, error: `Unsupported export version: ${exportData.version}` };
  }

  if (!exportData.siteInfo || !exportData.siteInfo.name) {
    return { valid: false, error: "Missing site info" };
  }

  if (!Array.isArray(exportData.pages)) {
    return { valid: false, error: "Invalid pages data" };
  }

  return { valid: true, data: exportData };
}

/**
 * Import site from JSON data
 */
export async function importSite(
  importData: SiteExportData,
  options: ImportOptions
): Promise<ImportResult> {
  const supabase = await createClient();

  try {
    let siteId = options.targetSiteId;

    // If creating new site
    if (!siteId && options.newSiteName && options.newSubdomain) {
      // Check subdomain availability
      const { data: existing } = await supabase
        .from("sites")
        .select("id")
        .eq("subdomain", options.newSubdomain)
        .single();

      if (existing) {
        return { success: false, error: "Subdomain already exists" };
      }

      // Create new site
      const { data: newSite, error: createError } = await supabase
        .from("sites")
        .insert({
          client_id: options.clientId,
          name: options.newSiteName,
          subdomain: options.newSubdomain,
          status: "draft",
          theme: importData.siteInfo.theme,
          settings: importData.siteInfo.settings,
        })
        .select()
        .single();

      if (createError || !newSite) {
        return { success: false, error: `Failed to create site: ${createError?.message}` };
      }

      siteId = newSite.id;
    }

    if (!siteId) {
      return { success: false, error: "No target site specified" };
    }

    let pagesImported = 0;
    let pagesSkipped = 0;
    let modulesImported = 0;

    // Import pages
    for (const page of importData.pages) {
      // Check if page exists
      const { data: existingPage } = await supabase
        .from("pages")
        .select("id")
        .eq("site_id", siteId)
        .eq("slug", page.slug)
        .single();

      if (existingPage && !options.overwritePages) {
        pagesSkipped++;
        continue;
      }

      if (existingPage && options.overwritePages) {
        // Update existing page
        await supabase
          .from("pages")
          .update({
            title: page.title,
            content: page.content,
            seo_title: page.seoTitle,
            seo_description: page.seoDescription,
            is_homepage: page.isHomepage,
            is_published: false, // Don't auto-publish
            sort_order: page.sortOrder,
          })
          .eq("id", existingPage.id);
      } else {
        // Create new page
        await supabase.from("pages").insert({
          site_id: siteId,
          slug: page.slug,
          title: page.title,
          content: page.content,
          seo_title: page.seoTitle,
          seo_description: page.seoDescription,
          is_homepage: page.isHomepage,
          is_published: false,
          sort_order: page.sortOrder,
        });
      }
      pagesImported++;
    }

    // Import modules
    if (options.importModules && importData.modules) {
      for (const moduleData of importData.modules) {
        // Get module ID from slug
        const { data: module } = await supabase
          .from("modules")
          .select("id")
          .eq("slug", moduleData.moduleSlug)
          .single();

        if (!module) continue;

        // Upsert site module
        await supabase
          .from("site_modules")
          .upsert({
            site_id: siteId,
            module_id: module.id,
            settings: moduleData.settings,
            is_enabled: moduleData.isEnabled,
          }, {
            onConflict: "site_id,module_id",
          });

        modulesImported++;
      }
    }

    return {
      success: true,
      siteId,
      details: {
        pagesImported,
        pagesSkipped,
        modulesImported,
      },
    };
  } catch (error) {
    console.error("Import error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}

/**
 * Parse JSON file and import
 */
export async function importSiteFromJSON(
  jsonString: string,
  options: ImportOptions
): Promise<ImportResult> {
  try {
    const data = JSON.parse(jsonString);
    const validation = validateImportData(data);

    if (!validation.valid || !validation.data) {
      return { success: false, error: validation.error };
    }

    return importSite(validation.data, options);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
}
```

### Task 59.3: Backup System

**File: `src/lib/backup/manager.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { exportSite } from "@/lib/sites/export";

export interface BackupRecord {
  id: string;
  siteId: string;
  siteName: string;
  filename: string;
  sizeBytes: number;
  createdAt: string;
  createdBy: string;
  type: "manual" | "automatic";
}

/**
 * Create a backup of a site
 */
export async function createBackup(
  siteId: string,
  type: "manual" | "automatic" = "manual"
): Promise<{
  success: boolean;
  backup?: BackupRecord;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Export site data
    const exportResult = await exportSite(siteId);
    if (!exportResult.success || !exportResult.data) {
      return { success: false, error: exportResult.error };
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${exportResult.data.siteInfo.subdomain}-${timestamp}.json`;

    // Convert to JSON
    const jsonData = JSON.stringify(exportResult.data);
    const sizeBytes = new Blob([jsonData]).size;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(`${siteId}/${filename}`, jsonData, {
        contentType: "application/json",
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Create backup record
    const { data: backupRecord, error: recordError } = await supabase
      .from("backups")
      .insert({
        site_id: siteId,
        filename,
        size_bytes: sizeBytes,
        type,
        created_by: user.id,
      })
      .select()
      .single();

    if (recordError) {
      // Cleanup uploaded file
      await supabase.storage.from("backups").remove([`${siteId}/${filename}`]);
      return { success: false, error: `Record creation failed: ${recordError.message}` };
    }

    return {
      success: true,
      backup: {
        id: backupRecord.id,
        siteId: backupRecord.site_id,
        siteName: exportResult.data.siteInfo.name,
        filename: backupRecord.filename,
        sizeBytes: backupRecord.size_bytes,
        createdAt: backupRecord.created_at,
        createdBy: user.email || user.id,
        type: backupRecord.type,
      },
    };
  } catch (error) {
    console.error("Backup creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Backup failed",
    };
  }
}

/**
 * List backups for a site
 */
export async function listBackups(siteId: string): Promise<{
  success: boolean;
  backups?: BackupRecord[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("backups")
    .select(`
      id,
      site_id,
      filename,
      size_bytes,
      type,
      created_at,
      created_by,
      sites(name)
    `)
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  const backups: BackupRecord[] = (data || []).map((b) => ({
    id: b.id,
    siteId: b.site_id,
    siteName: (b.sites as { name: string })?.name || "",
    filename: b.filename,
    sizeBytes: b.size_bytes,
    createdAt: b.created_at,
    createdBy: b.created_by,
    type: b.type,
  }));

  return { success: true, backups };
}

/**
 * Restore from a backup
 */
export async function restoreFromBackup(
  backupId: string,
  targetSiteId: string,
  overwritePages: boolean = true
): Promise<{
  success: boolean;
  error?: string;
  details?: {
    pagesRestored: number;
    modulesRestored: number;
  };
}> {
  const supabase = await createClient();

  try {
    // Get backup record
    const { data: backup, error: backupError } = await supabase
      .from("backups")
      .select("*")
      .eq("id", backupId)
      .single();

    if (backupError || !backup) {
      return { success: false, error: "Backup not found" };
    }

    // Download backup file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("backups")
      .download(`${backup.site_id}/${backup.filename}`);

    if (downloadError || !fileData) {
      return { success: false, error: `Download failed: ${downloadError?.message}` };
    }

    // Parse JSON
    const jsonText = await fileData.text();
    const exportData = JSON.parse(jsonText);

    // Import using existing import function
    const { importSite, validateImportData } = await import("@/lib/sites/import");
    
    const validation = validateImportData(exportData);
    if (!validation.valid || !validation.data) {
      return { success: false, error: validation.error };
    }

    // Get client ID for the target site
    const { data: targetSite } = await supabase
      .from("sites")
      .select("client_id")
      .eq("id", targetSiteId)
      .single();

    if (!targetSite) {
      return { success: false, error: "Target site not found" };
    }

    const result = await importSite(validation.data, {
      targetSiteId,
      clientId: targetSite.client_id,
      overwritePages,
      importModules: true,
    });

    return {
      success: result.success,
      error: result.error,
      details: result.details ? {
        pagesRestored: result.details.pagesImported,
        modulesRestored: result.details.modulesImported,
      } : undefined,
    };
  } catch (error) {
    console.error("Restore error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Restore failed",
    };
  }
}

/**
 * Delete a backup
 */
export async function deleteBackup(backupId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Get backup record
    const { data: backup, error: fetchError } = await supabase
      .from("backups")
      .select("site_id, filename")
      .eq("id", backupId)
      .single();

    if (fetchError || !backup) {
      return { success: false, error: "Backup not found" };
    }

    // Delete file from storage
    await supabase.storage
      .from("backups")
      .remove([`${backup.site_id}/${backup.filename}`]);

    // Delete record
    const { error: deleteError } = await supabase
      .from("backups")
      .delete()
      .eq("id", backupId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}
```

### Task 59.4: Backup Database Schema

**File: `migrations/backups.sql`**

```sql
-- Backups table
CREATE TABLE public.backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('manual', 'automatic')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_backups_site ON public.backups(site_id);
CREATE INDEX idx_backups_created ON public.backups(created_at DESC);

-- RLS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- View backups for sites you have access to
CREATE POLICY "View site backups"
  ON public.backups FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM public.agency_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create backups for sites you have access to
CREATE POLICY "Create site backups"
  ON public.backups FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM public.agency_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- Delete backups for sites you have access to
CREATE POLICY "Delete site backups"
  ON public.backups FOR DELETE
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM public.agency_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload backups"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'backups');

CREATE POLICY "Users can download their backups"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'backups');

CREATE POLICY "Users can delete their backups"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'backups');
```

### Task 59.5: Export/Import UI Components

**File: `src/components/sites/export-import-dialog.tsx`**

```tsx
"use client";

import { useState, useRef } from "react";
import { Download, Upload, Loader2, FileJson } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { exportSiteAction, importSiteAction } from "@/lib/actions/export-import";

interface ExportImportDialogProps {
  siteId: string;
  siteName: string;
  clientId: string;
}

export function ExportImportDialog({
  siteId,
  siteName,
  clientId,
}: ExportImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [overwritePages, setOverwritePages] = useState(false);
  const [importModules, setImportModules] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await exportSiteAction(siteId);
      
      if (result.success && result.json && result.filename) {
        // Create download
        const blob = new Blob([result.json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export successful",
          description: `Site exported to ${result.filename}`,
        });
      } else {
        toast({
          title: "Export failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a JSON file to import",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const jsonText = await importFile.text();
      const result = await importSiteAction(jsonText, {
        targetSiteId: siteId,
        clientId,
        overwritePages,
        importModules,
      });

      if (result.success) {
        toast({
          title: "Import successful",
          description: `${result.details?.pagesImported || 0} pages imported`,
        });
        setOpen(false);
      } else {
        toast({
          title: "Import failed",
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
        <Button variant="outline" size="sm">
          <FileJson className="mr-2 h-4 w-4" />
          Export/Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export / Import Site</DialogTitle>
          <DialogDescription>
            Export "{siteName}" to JSON or import from a backup file.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Export all site data including pages, settings, and module configurations to a JSON file.
            </p>
            <Button onClick={handleExport} disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download Export
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select JSON File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overwritePages"
                  checked={overwritePages}
                  onCheckedChange={(checked) => setOverwritePages(!!checked)}
                />
                <Label htmlFor="overwritePages" className="font-normal">
                  Overwrite existing pages with same slug
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="importModules"
                  checked={importModules}
                  onCheckedChange={(checked) => setImportModules(!!checked)}
                />
                <Label htmlFor="importModules" className="font-normal">
                  Import module settings
                </Label>
              </div>
            </div>

            <Button
              onClick={handleImport}
              disabled={loading || !importFile}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import Data
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 59.6: Backup List Component

**File: `src/components/sites/backup-list.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Archive, Download, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  createBackupAction,
  listBackupsAction,
  deleteBackupAction,
  restoreBackupAction,
} from "@/lib/actions/backup";

interface BackupListProps {
  siteId: string;
}

interface Backup {
  id: string;
  filename: string;
  sizeBytes: number;
  type: "manual" | "automatic";
  createdAt: string;
}

export function BackupList({ siteId }: BackupListProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  
  const { toast } = useToast();

  const loadBackups = async () => {
    setLoading(true);
    const result = await listBackupsAction(siteId);
    if (result.success && result.backups) {
      setBackups(result.backups);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBackups();
  }, [siteId]);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const result = await createBackupAction(siteId);
      if (result.success) {
        toast({
          title: "Backup created",
          description: "Your site has been backed up successfully",
        });
        loadBackups();
      } else {
        toast({
          title: "Backup failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    setRestoring(backupId);
    try {
      const result = await restoreBackupAction(backupId, siteId);
      if (result.success) {
        toast({
          title: "Restore complete",
          description: `${result.details?.pagesRestored || 0} pages restored`,
        });
      } else {
        toast({
          title: "Restore failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (backupId: string) => {
    const result = await deleteBackupAction(backupId);
    if (result.success) {
      toast({ title: "Backup deleted" });
      loadBackups();
    } else {
      toast({
        title: "Delete failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Site Backups
            </CardTitle>
            <CardDescription>
              Create and restore backups of your site
            </CardDescription>
          </div>
          <Button onClick={handleCreateBackup} disabled={creating}>
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Archive className="mr-2 h-4 w-4" />
            )}
            Create Backup
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No backups yet. Create your first backup to protect your site.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell>
                    {format(new Date(backup.createdAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={backup.type === "automatic" ? "secondary" : "outline"}>
                      {backup.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatSize(backup.sizeBytes)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(backup.id)}
                      disabled={restoring === backup.id}
                    >
                      {restoring === backup.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this backup. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(backup.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
```

### Task 59.7: Server Actions

**File: `src/lib/actions/export-import.ts`**

```typescript
"use server";

import { exportSiteToJSON } from "@/lib/sites/export";
import { importSiteFromJSON, ImportOptions, ImportResult } from "@/lib/sites/import";
import { checkRateLimit, recordRateLimitedAction } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function exportSiteAction(siteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(user.id, "export");
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
    };
  }

  const result = await exportSiteToJSON(siteId);

  if (result.success) {
    await recordRateLimitedAction(user.id, "export", { siteId });
  }

  return result;
}

export async function importSiteAction(
  jsonString: string,
  options: Omit<ImportOptions, "newSiteName" | "newSubdomain">
): Promise<ImportResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const result = await importSiteFromJSON(jsonString, options);

  if (result.success && options.targetSiteId) {
    revalidatePath(`/dashboard/sites/${options.targetSiteId}`);
  }

  return result;
}
```

**File: `src/lib/actions/backup.ts`**

```typescript
"use server";

import { createBackup, listBackups, deleteBackup, restoreFromBackup } from "@/lib/backup/manager";
import { revalidatePath } from "next/cache";

export async function createBackupAction(siteId: string) {
  const result = await createBackup(siteId, "manual");
  if (result.success) {
    revalidatePath(`/dashboard/sites/${siteId}/settings`);
  }
  return result;
}

export async function listBackupsAction(siteId: string) {
  return listBackups(siteId);
}

export async function deleteBackupAction(backupId: string) {
  return deleteBackup(backupId);
}

export async function restoreBackupAction(backupId: string, siteId: string) {
  const result = await restoreFromBackup(backupId, siteId, true);
  if (result.success) {
    revalidatePath(`/dashboard/sites/${siteId}`);
  }
  return result;
}
```

---

## 🧪 Testing

### Test Export

```typescript
const result = await exportSiteToJSON(siteId);
console.assert(result.success, "Export should succeed");
console.assert(result.json, "Should have JSON data");
console.assert(result.filename?.endsWith(".json"), "Should have JSON filename");
```

### Test Import

```typescript
const importResult = await importSiteFromJSON(exportedJson, {
  targetSiteId: newSiteId,
  clientId,
  overwritePages: true,
  importModules: true,
});
console.assert(importResult.success, "Import should succeed");
```

### Test Backup/Restore

```typescript
// Create backup
const backup = await createBackup(siteId);
console.assert(backup.success, "Backup should succeed");

// Restore
const restore = await restoreFromBackup(backup.backup.id, siteId);
console.assert(restore.success, "Restore should succeed");
```

---

## ✅ Verification Checklist

- [ ] Export creates valid JSON with all site data
- [ ] Import validates JSON structure
- [ ] Import can create new site or update existing
- [ ] Backup uploads to Supabase Storage
- [ ] Backup list shows all backups
- [ ] Restore works correctly
- [ ] Rate limiting applied to exports
- [ ] UI components work correctly

---

## 📁 Files Created

1. `src/lib/sites/export.ts` - Export functionality
2. `src/lib/sites/import.ts` - Import functionality
3. `src/lib/backup/manager.ts` - Backup system
4. `migrations/backups.sql` - Backup database schema
5. `src/components/sites/export-import-dialog.tsx` - Export/Import UI
6. `src/components/sites/backup-list.tsx` - Backup list UI
7. `src/lib/actions/export-import.ts` - Export/Import actions
8. `src/lib/actions/backup.ts` - Backup actions

---

## ⏭️ Next Phase

Continue to **Phase 63: Missing Editor Components** for Gallery, FAQ, Team, and Stats sections.
