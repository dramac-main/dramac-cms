# Phase 65: Export/Import System - ADD UI Components

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 HIGH
>
> **Estimated Time**: 1-2 hours

> ⚠️ **SCHEMA WARNING**: This phase contains outdated table names!
> - `site_modules` → Use `site_module_installations`
> - `modules` → Use `modules_v2`
> 
> **ALWAYS reference [SCHEMA-REFERENCE.md](SCHEMA-REFERENCE.md) before implementing!**

---

## 🎯 Objective

ADD UI components for the existing export/import functionality. The core logic already exists.

---

## 📋 Prerequisites

- [ ] Phase 64 Backup System completed
- [ ] Understanding of site data model

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ `src/lib/sites/export.ts` (182 lines) with:
  - `SiteExportData` interface
  - `exportSite()` function - exports site to JSON
- ✅ `src/lib/sites/import.ts` with:
  - `importSite()` function - imports from JSON
- ✅ Used by backup system (`src/lib/backup/manager.ts` calls `exportSite`)

**What's Missing:**
- Export button UI component
- Import dialog with file upload
- Server actions wrapping functions
- Download trigger

---

## ⚠️ IMPORTANT: USE EXISTING EXPORT/IMPORT

The core export/import logic exists. We only need:
1. ✅ **USE** existing `exportSite()` from `src/lib/sites/export.ts`
2. ✅ **USE** existing `importSite()` from `src/lib/sites/import.ts`
3. ✅ **ADD** UI components
4. ✅ **ADD** server actions

**DO NOT:**
- ❌ Recreate export/import logic
- ❌ Create duplicate `src/lib/export/` folder
- ❌ Recreate types (use existing `SiteExportData`)

---

## 💼 Business Value

1. **Portability** - Move sites between agencies/accounts
2. **External Backup** - Store backups outside the platform
3. **Migration** - Import sites from other sources
4. **Sharing** - Share templates as files
5. **Disaster Recovery** - Additional backup layer

---

## 📁 Files to Create

```
src/actions/sites/
├── export-action.ts            # Server action for export
├── import-action.ts            # Server action for import

src/components/sites/
├── export-site-button.tsx      # Export trigger
├── import-site-dialog.tsx      # Import modal with dropzone
```

---

## ✅ Tasks

### Task 65.0: Verify Existing Implementation

**The export/import functions already exist:**

```typescript
// Already exists in src/lib/sites/export.ts
import { exportSite, SiteExportData } from "@/lib/sites/export";

// Already exists in src/lib/sites/import.ts
import { importSite } from "@/lib/sites/import";

// Example usage:
const exportResult = await exportSite(siteId);
if (exportResult.success && exportResult.data) {
  // Download as JSON
  const json = JSON.stringify(exportResult.data, null, 2);
}

const importResult = await importSite(jsonData, clientId, agencyId);
```

---

### Task 65.1: Server Actions (Wrappers)
    theme: Record<string, any> | null;
    templateId: string | null;
  };

  pages: ExportedPage[];
  modules: ExportedModule[];
  assets: ExportedAsset[];
}

export interface ExportedPage {
  name: string;
  slug: string;
  content: string | null;
  settings: Record<string, any>;
  isHomepage: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  order: number;
}

export interface ExportedModule {
  moduleId: string;
  moduleName: string;
  settings: Record<string, any>;
  isActive: boolean;
}

export interface ExportedAsset {
  type: "image" | "file";
  originalUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  // Base64 encoded content (for small files) or external URL
  data?: string;
}

export interface ExportOptions {
  siteId: string;
  includeContent?: boolean;
  includeSettings?: boolean;
  includeModules?: boolean;
  includeAssets?: boolean;
}

export interface ImportOptions {
  file: File | ExportedSite;
  clientId: string;
  newName?: string;
  newSubdomain?: string;
  importSettings?: boolean;
  importModules?: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: ExportedSite;
  filename?: string;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  siteId?: string;
  siteName?: string;
  pagesImported?: number;
  error?: string;
  validationErrors?: string[];
}
```

---

### Task 65.2: Export Validators

**File: `src/lib/export/validators.ts`**

```typescript
import { z } from "zod";
import { EXPORT_FORMAT, EXPORT_VERSION, type ExportedSite } from "./export-types";

const exportedPageSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().nullable(),
  settings: z.record(z.any()).default({}),
  isHomepage: z.boolean(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  order: z.number().int().min(0),
});

const exportedModuleSchema = z.object({
  moduleId: z.string(),
  moduleName: z.string(),
  settings: z.record(z.any()).default({}),
  isActive: z.boolean(),
});

const exportedAssetSchema = z.object({
  type: z.enum(["image", "file"]),
  originalUrl: z.string().url(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  data: z.string().optional(),
});

const exportedSiteSchema = z.object({
  _format: z.literal(EXPORT_FORMAT),
  _version: z.string(),
  _exportedAt: z.string().datetime(),
  _exportedBy: z.string(),

  site: z.object({
    name: z.string().min(1),
    subdomain: z.string().min(3),
    settings: z.record(z.any()).default({}),
    theme: z.record(z.any()).nullable(),
    templateId: z.string().nullable(),
  }),

  pages: z.array(exportedPageSchema),
  modules: z.array(exportedModuleSchema).default([]),
  assets: z.array(exportedAssetSchema).default([]),
});

export interface ValidationResult {
  valid: boolean;
  data?: ExportedSite;
  errors: string[];
}

export function validateExportFile(data: unknown): ValidationResult {
  try {
    // Check if it's an object
    if (typeof data !== "object" || data === null) {
      return { valid: false, errors: ["Invalid file format: not an object"] };
    }

    // Check format marker
    const obj = data as Record<string, unknown>;
    if (obj._format !== EXPORT_FORMAT) {
      return {
        valid: false,
        errors: [`Invalid file format: expected ${EXPORT_FORMAT}, got ${obj._format}`],
      };
    }

    // Validate with schema
    const result = exportedSiteSchema.safeParse(data);

    if (!result.success) {
      const errors = result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      return { valid: false, errors };
    }

    // Version compatibility check
    const [major] = result.data._version.split(".");
    const [currentMajor] = EXPORT_VERSION.split(".");
    if (major !== currentMajor) {
      return {
        valid: false,
        errors: [`Incompatible version: ${result.data._version} (current: ${EXPORT_VERSION})`],
      };
    }

    return { valid: true, data: result.data, errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : "Unknown validation error"],
    };
  }
}

export function parseExportFile(content: string): ValidationResult {
  try {
    const data = JSON.parse(content);
    return validateExportFile(data);
  } catch (error) {
    return {
      valid: false,
      errors: ["Invalid JSON file"],
    };
  }
}
```

---

### Task 65.3: Export Site Logic

**File: `src/lib/export/export-site.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import {
  EXPORT_FORMAT,
  EXPORT_VERSION,
  type ExportedSite,
  type ExportOptions,
  type ExportResult,
  type ExportedPage,
  type ExportedModule,
} from "./export-types";

export async function exportSite(options: ExportOptions): Promise<ExportResult> {
  const {
    siteId,
    includeContent = true,
    includeSettings = true,
    includeModules = true,
    includeAssets = false, // Assets are large, optional
  } = options;

  const supabase = await createClient();

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Fetch site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("*")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return { success: false, error: "Site not found" };
    }

    // Fetch pages
    const { data: pages } = await supabase
      .from("pages")
      .select("*")
      .eq("site_id", siteId)
      .order("order", { ascending: true });

    // Fetch modules if requested
    let modules: ExportedModule[] = [];
    if (includeModules) {
      const { data: siteModules } = await supabase
        .from("site_modules")
        .select(`
          *,
          modules (
            name
          )
        `)
        .eq("site_id", siteId);

      modules = (siteModules || []).map((m) => ({
        moduleId: m.module_id,
        moduleName: (m.modules as any)?.name || "Unknown",
        settings: m.settings || {},
        isActive: m.is_active,
      }));
    }

    // Build export data
    const exportData: ExportedSite = {
      _format: EXPORT_FORMAT,
      _version: EXPORT_VERSION,
      _exportedAt: new Date().toISOString(),
      _exportedBy: user.email || user.id,

      site: {
        name: site.name,
        subdomain: site.subdomain,
        settings: includeSettings ? (site.settings || {}) : {},
        theme: includeSettings ? site.theme : null,
        templateId: site.template_id,
      },

      pages: (pages || []).map((page): ExportedPage => ({
        name: page.name,
        slug: page.slug,
        content: includeContent ? page.content : null,
        settings: page.settings || {},
        isHomepage: page.is_homepage,
        metaTitle: page.meta_title,
        metaDescription: page.meta_description,
        order: page.order,
      })),

      modules,
      assets: [], // TODO: Asset export in future version
    };

    // Generate filename
    const sanitizedName = site.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${sanitizedName}-${timestamp}.json`;

    return {
      success: true,
      data: exportData,
      filename,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}
```

---

### Task 65.4: Import Site Logic

**File: `src/lib/export/import-site.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { parseExportFile, validateExportFile } from "./validators";
import type { ExportedSite, ImportOptions, ImportResult } from "./export-types";

export async function importSite(options: ImportOptions): Promise<ImportResult> {
  const {
    file,
    clientId,
    newName,
    newSubdomain,
    importSettings = true,
    importModules = false,
  } = options;

  const supabase = await createClient();

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Parse and validate file
    let exportData: ExportedSite;

    if (file instanceof File) {
      const content = await file.text();
      const validation = parseExportFile(content);

      if (!validation.valid || !validation.data) {
        return {
          success: false,
          error: "Invalid import file",
          validationErrors: validation.errors,
        };
      }

      exportData = validation.data;
    } else {
      const validation = validateExportFile(file);

      if (!validation.valid || !validation.data) {
        return {
          success: false,
          error: "Invalid import data",
          validationErrors: validation.errors,
        };
      }

      exportData = validation.data;
    }

    // Check for subdomain conflicts
    const subdomain = newSubdomain || exportData.site.subdomain;
    const { data: existingSite } = await supabase
      .from("sites")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (existingSite) {
      return {
        success: false,
        error: `Subdomain "${subdomain}" is already in use`,
      };
    }

    // Create the site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .insert({
        client_id: clientId,
        name: newName || exportData.site.name,
        subdomain: subdomain,
        settings: importSettings ? exportData.site.settings : {},
        theme: importSettings ? exportData.site.theme : null,
        template_id: exportData.site.templateId,
        status: "draft",
      })
      .select()
      .single();

    if (siteError || !site) {
      return { success: false, error: "Failed to create site" };
    }

    // Import pages
    if (exportData.pages.length > 0) {
      const pagesToInsert = exportData.pages.map((page) => ({
        site_id: site.id,
        name: page.name,
        slug: page.slug,
        content: page.content,
        settings: page.settings,
        is_homepage: page.isHomepage,
        meta_title: page.metaTitle,
        meta_description: page.metaDescription,
        order: page.order,
        status: "draft",
      }));

      const { error: pagesError } = await supabase
        .from("pages")
        .insert(pagesToInsert);

      if (pagesError) {
        // Cleanup: delete site
        await supabase.from("sites").delete().eq("id", site.id);
        return { success: false, error: "Failed to import pages" };
      }
    }

    // Import modules (if requested and available)
    if (importModules && exportData.modules.length > 0) {
      // Verify modules exist in the system
      const moduleIds = exportData.modules.map((m) => m.moduleId);
      const { data: availableModules } = await supabase
        .from("modules")
        .select("id")
        .in("id", moduleIds);

      const availableIds = new Set((availableModules || []).map((m) => m.id));

      const modulesToInsert = exportData.modules
        .filter((m) => availableIds.has(m.moduleId))
        .map((module) => ({
          site_id: site.id,
          module_id: module.moduleId,
          settings: module.settings,
          is_active: false, // Start disabled
        }));

      if (modulesToInsert.length > 0) {
        await supabase.from("site_modules").insert(modulesToInsert);
      }
    }

    return {
      success: true,
      siteId: site.id,
      siteName: site.name,
      pagesImported: exportData.pages.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}
```

---

### Task 65.5: Export Index

**File: `src/lib/export/index.ts`**

```typescript
export * from "./export-types";
export { exportSite } from "./export-site";
export { importSite } from "./import-site";
export { validateExportFile, parseExportFile } from "./validators";
```

---

### Task 65.6: Export Site Action

**File: `src/actions/export/export-site.ts`**

```typescript
"use server";

import { exportSite } from "@/lib/export";
import { logError } from "@/lib/errors";

export async function exportSiteAction(siteId: string) {
  try {
    const result = await exportSite({
      siteId,
      includeContent: true,
      includeSettings: true,
      includeModules: true,
    });

    return result;
  } catch (error) {
    logError(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}
```

---

### Task 65.7: Import Site Action

**File: `src/actions/export/import-site.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { importSite, type ExportedSite } from "@/lib/export";
import { logError } from "@/lib/errors";

interface ImportSiteActionInput {
  exportData: ExportedSite;
  clientId: string;
  newName?: string;
  newSubdomain?: string;
  importSettings?: boolean;
  importModules?: boolean;
}

export async function importSiteAction(input: ImportSiteActionInput) {
  try {
    const result = await importSite({
      file: input.exportData,
      clientId: input.clientId,
      newName: input.newName,
      newSubdomain: input.newSubdomain,
      importSettings: input.importSettings,
      importModules: input.importModules,
    });

    if (result.success) {
      revalidatePath("/sites");
      revalidatePath(`/clients/${input.clientId}/sites`);
    }

    return result;
  } catch (error) {
    logError(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}
```

---

### Task 65.8: Export Site Button

**File: `src/components/export/export-site-button.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { exportSiteAction } from "@/actions/export/export-site";

interface ExportSiteButtonProps {
  siteId: string;
  siteName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function ExportSiteButton({
  siteId,
  siteName,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: ExportSiteButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const result = await exportSiteAction(siteId);

      if (result.success && result.data) {
        // Create and download file
        const json = JSON.stringify(result.data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || `${siteName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Site exported successfully!", {
          description: `${result.data.pages.length} pages exported.`,
        });
      } else {
        toast.error("Failed to export site", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {showLabel && <span className="ml-2">Export</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Download site as JSON file</p>
      </TooltipContent>
    </Tooltip>
  );
}
```

---

### Task 65.9: Import Dropzone

**File: `src/components/export/import-dropzone.tsx`**

```tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileJson, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseExportFile, type ExportedSite } from "@/lib/export";

interface ImportDropzoneProps {
  onFileAccepted: (data: ExportedSite) => void;
  onError: (errors: string[]) => void;
}

export function ImportDropzone({ onFileAccepted, onError }: ImportDropzoneProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [fileName, setFileName] = useState<string>("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setStatus("loading");
      setFileName(file.name);

      try {
        const content = await file.text();
        const result = parseExportFile(content);

        if (result.valid && result.data) {
          setStatus("success");
          onFileAccepted(result.data);
        } else {
          setStatus("error");
          onError(result.errors);
        }
      } catch (error) {
        setStatus("error");
        onError(["Failed to read file"]);
      }
    },
    [onFileAccepted, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragActive && "border-primary bg-primary/5",
        status === "success" && "border-green-500 bg-green-500/5",
        status === "error" && "border-destructive bg-destructive/5",
        status === "idle" && "border-muted-foreground/25 hover:border-primary/50"
      )}
    >
      <input {...getInputProps()} />

      {status === "idle" && (
        <>
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm font-medium">
            {isDragActive ? "Drop the file here" : "Drag & drop a site export file"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse (JSON files only)
          </p>
        </>
      )}

      {status === "loading" && (
        <>
          <FileJson className="h-10 w-10 mx-auto text-primary mb-4 animate-pulse" />
          <p className="text-sm font-medium">Reading {fileName}...</p>
        </>
      )}

      {status === "success" && (
        <>
          <Check className="h-10 w-10 mx-auto text-green-500 mb-4" />
          <p className="text-sm font-medium text-green-600">
            {fileName} is valid
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ready to import
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-4" />
          <p className="text-sm font-medium text-destructive">
            Invalid file
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click to try another file
          </p>
        </>
      )}
    </div>
  );
}
```

---

### Task 65.10: Import Site Dialog

**File: `src/components/export/import-site-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImportDropzone } from "./import-dropzone";
import { importSiteAction } from "@/actions/export/import-site";
import type { ExportedSite } from "@/lib/export";

interface ImportSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export function ImportSiteDialog({
  open,
  onOpenChange,
  clientId,
}: ImportSiteDialogProps) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [exportData, setExportData] = useState<ExportedSite | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [newSubdomain, setNewSubdomain] = useState("");
  const [importSettings, setImportSettings] = useState(true);
  const [importModules, setImportModules] = useState(false);

  const handleFileAccepted = (data: ExportedSite) => {
    setExportData(data);
    setErrors([]);
    setNewName(data.site.name);
    setNewSubdomain(`${data.site.subdomain}-imported`);
  };

  const handleImport = async () => {
    if (!exportData) return;

    setIsImporting(true);

    try {
      const result = await importSiteAction({
        exportData,
        clientId,
        newName: newName || undefined,
        newSubdomain: newSubdomain || undefined,
        importSettings,
        importModules,
      });

      if (result.success && result.siteId) {
        toast.success("Site imported successfully!", {
          description: `${result.pagesImported} pages imported.`,
          action: {
            label: "View Site",
            onClick: () => router.push(`/sites/${result.siteId}`),
          },
        });
        onOpenChange(false);
        router.refresh();
      } else {
        if (result.validationErrors) {
          setErrors(result.validationErrors);
        } else {
          toast.error("Failed to import site", {
            description: result.error,
          });
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setExportData(null);
      setErrors([]);
      setNewName("");
      setNewSubdomain("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Site
          </DialogTitle>
          <DialogDescription>
            Import a site from a previously exported JSON file.
          </DialogDescription>
        </DialogHeader>

        {!exportData ? (
          <ImportDropzone
            onFileAccepted={handleFileAccepted}
            onError={setErrors}
          />
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{exportData.site.name}</p>
              <p className="text-sm text-muted-foreground">
                {exportData.pages.length} pages • Exported{" "}
                {new Date(exportData._exportedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="importName">Site Name</Label>
                <Input
                  id="importName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Imported Site"
                />
              </div>

              <div>
                <Label htmlFor="importSubdomain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="importSubdomain"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value.toLowerCase())}
                    placeholder="my-site"
                  />
                  <span className="text-sm text-muted-foreground">.dramac.io</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Import Options</Label>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="importSettings"
                    checked={importSettings}
                    onCheckedChange={(c) => setImportSettings(!!c)}
                  />
                  <Label htmlFor="importSettings" className="font-normal">
                    Include site settings and theme
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="importModules"
                    checked={importModules}
                    onCheckedChange={(c) => setImportModules(!!c)}
                  />
                  <Label htmlFor="importModules" className="font-normal">
                    Include installed modules (if available)
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, i) => (
                  <li key={i} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!exportData || isImporting || errors.length > 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Site
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 65.11: Export API Endpoint

**File: `src/app/api/export/[siteId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { exportSite } from "@/lib/export";
import { withErrorHandling } from "@/lib/errors";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
): Promise<NextResponse> {
  const { siteId } = await params;

  const result = await exportSite({
    siteId,
    includeContent: true,
    includeSettings: true,
    includeModules: true,
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  // Return as downloadable file
  const json = JSON.stringify(result.data, null, 2);
  
  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}

export const GET = withErrorHandling(handler);
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Export generates valid JSON
- [ ] Validator catches invalid files
- [ ] Version compatibility check works
- [ ] Subdomain conflict detection works

### Integration Tests
- [ ] Export includes all data
- [ ] Import creates site correctly
- [ ] Pages are imported with content
- [ ] Settings are imported correctly

### E2E Tests
- [ ] Export button downloads file
- [ ] Import dropzone accepts files
- [ ] Import dialog shows preview
- [ ] Success/error messages appear

---

## ✅ Completion Checklist

- [ ] Export types defined
- [ ] Validators implemented
- [ ] Export service working
- [ ] Import service working
- [ ] Server actions created
- [ ] Export button component created
- [ ] Import dropzone component created
- [ ] Import dialog component created
- [ ] API endpoints created
- [ ] Tests passing

---

**Next Phase**: Phase 66 - Mobile Editor Fix
