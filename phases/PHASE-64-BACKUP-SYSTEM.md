# Phase 64: Backup System - ADD UI Components & Scheduling

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 HIGH
>
> **Estimated Time**: 2-3 hours

---

## 🎯 Objective

ADD UI components and automatic scheduling to the existing backup system. The core backup functionality already exists.

---

## 📋 Prerequisites

- [ ] Phase 63 Site Cloning completed
- [ ] Supabase Storage configured
- [ ] Understanding of site/page structure

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ `src/lib/backup/manager.ts` (489 lines) with:
  - `BackupRecord` interface
  - `createBackup()` - creates backups to Supabase Storage
  - `listBackups()` - lists backups for a site
  - `restoreFromBackup()` - restores from backup
  - `downloadBackup()` - downloads backup JSON
  - `deleteBackup()` - deletes backup
  - `getBackupStats()` - backup statistics
  - `cleanupOldBackups()` - cleanup old backups
- ✅ `src/lib/backup/index.ts` - exports all functions
- ✅ `backups` table exists in database schema
- ✅ Tests in `src/lib/__tests__/backup-export.test.ts`

**What's Missing:**
- Backup UI components (list, dialog, button)
- Automatic backup scheduling (before publish, daily)
- Server actions wrapping the functions

---

## ⚠️ IMPORTANT: USE EXISTING BACKUP FUNCTIONS

The core backup system is complete. We only need:
1. ✅ **USE** existing functions from `src/lib/backup`
2. ✅ **ADD** UI components
3. ✅ **ADD** automatic scheduling
4. ✅ **ADD** server actions

**DO NOT:**
- ❌ Recreate backup logic
- ❌ Recreate database migration (table exists!)
- ❌ Duplicate interfaces

---

## 💼 Business Value

1. **Data Protection** - Never lose client work
2. **Confidence** - Users can experiment freely
3. **Recovery** - Quick restoration from mistakes
4. **Compliance** - Audit trail of changes
5. **Peace of Mind** - Professional-grade reliability

---

## 📁 Files to Create

```
src/lib/backup/
├── scheduler.ts                # NEW - Auto-backup scheduling

src/actions/backup/
├── backup-actions.ts           # Server actions wrapping existing functions

src/components/backup/
├── backup-manager.tsx          # Full backup UI
├── backup-list.tsx             # List of backups
├── backup-item.tsx             # Single backup row
├── restore-dialog.tsx          # Restore confirmation
├── create-backup-button.tsx    # Manual backup trigger
```

---

## ✅ Tasks

### Task 64.0: Verify Existing Implementation

**The backup system already exists in `src/lib/backup/`:**

```typescript
// Already exists - USE THESE
import {
  createBackup,
  listBackups,
  deleteBackup,
  restoreFromBackup,
  downloadBackup,
  getBackupStats,
  cleanupOldBackups,
} from "@/lib/backup";

// Example usage:
const result = await createBackup(siteId, "manual");
const backups = await listBackups(siteId);
const restored = await restoreFromBackup(backupId, targetSiteId, true);
```

---

### Task 64.1: Skip Database Migration

**The `backups` table already exists!** Check `src/types/database.ts` line 921.

---

### Task 64.2: Backup Scheduler (NEW)
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Backup metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  backup_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  -- Types: 'manual', 'auto_publish', 'auto_schedule', 'auto_change', 'pre_restore'
  
  -- Backup data
  site_data JSONB NOT NULL,
  pages_data JSONB NOT NULL,
  modules_data JSONB,
  
  -- Storage reference (for large backups)
  storage_path TEXT,
  
  -- Stats
  size_bytes BIGINT DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed',
  -- Status: 'pending', 'completed', 'failed', 'restored'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  restored_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_backups_site_id ON backups(site_id);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX idx_backups_backup_type ON backups(backup_type);
CREATE INDEX idx_backups_status ON backups(status);

-- RLS Policies
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view backups for their agency sites"
  ON backups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN profiles p ON c.agency_id = p.agency_id
      WHERE s.id = backups.site_id
        AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can create backups for their agency sites"
  ON backups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN profiles p ON c.agency_id = p.agency_id
      WHERE s.id = site_id
        AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete backups for their agency sites"
  ON backups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN profiles p ON c.agency_id = p.agency_id
      WHERE s.id = backups.site_id
        AND p.id = auth.uid()
    )
  );

-- Function to cleanup old backups
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM backups
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-backup before certain operations
CREATE OR REPLACE FUNCTION trigger_auto_backup()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder - actual backup creation happens in app code
  -- due to complexity of serializing all site data
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Task 64.2: Backup Types

**File: `src/lib/backup/backup-types.ts`**

```typescript
export type BackupType = 
  | "manual"           // User-initiated backup
  | "auto_publish"     // Before publishing
  | "auto_schedule"    // Scheduled backup
  | "auto_change"      // Before major changes
  | "pre_restore";     // Before restoring another backup

export type BackupStatus = 
  | "pending"
  | "completed"
  | "failed"
  | "restored";

export interface BackupMetadata {
  id: string;
  siteId: string;
  createdBy: string | null;
  name: string;
  description: string | null;
  backupType: BackupType;
  sizeBytes: number;
  pageCount: number;
  status: BackupStatus;
  createdAt: string;
  expiresAt: string | null;
  restoredAt: string | null;
}

export interface BackupData {
  version: string;
  createdAt: string;
  site: SiteBackupData;
  pages: PageBackupData[];
  modules: ModuleBackupData[];
}

export interface SiteBackupData {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  settings: Record<string, any>;
  theme: Record<string, any> | null;
  favicon: string | null;
  ogImage: string | null;
  templateId: string | null;
}

export interface PageBackupData {
  id: string;
  name: string;
  slug: string;
  content: string | null;
  settings: Record<string, any>;
  isHomepage: boolean;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  order: number;
}

export interface ModuleBackupData {
  id: string;
  moduleId: string;
  settings: Record<string, any>;
  isActive: boolean;
}

export interface CreateBackupOptions {
  siteId: string;
  name?: string;
  description?: string;
  backupType?: BackupType;
  expiresIn?: number; // Days until expiration, null = never
}

export interface RestoreBackupOptions {
  backupId: string;
  createPreRestoreBackup?: boolean;
  restoreSettings?: boolean;
  restorePages?: boolean;
  restoreModules?: boolean;
}

export interface BackupResult {
  success: boolean;
  backup?: BackupMetadata;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  restoredAt?: string;
  preRestoreBackupId?: string;
  error?: string;
}
```

---

### Task 64.3: Backup Service

**File: `src/lib/backup/backup-service.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import type {
  BackupData,
  BackupMetadata,
  BackupType,
  CreateBackupOptions,
  BackupResult,
  SiteBackupData,
  PageBackupData,
  ModuleBackupData,
} from "./backup-types";

const BACKUP_VERSION = "1.0";

// Auto-backup configuration
const AUTO_BACKUP_CONFIG = {
  auto_publish: { expiresIn: 30 }, // 30 days
  auto_schedule: { expiresIn: 7 },  // 7 days
  auto_change: { expiresIn: 14 },   // 14 days
  pre_restore: { expiresIn: 90 },   // 90 days
  manual: { expiresIn: null },      // Never expires
};

export async function createBackup(options: CreateBackupOptions): Promise<BackupResult> {
  const {
    siteId,
    name,
    description,
    backupType = "manual",
    expiresIn = AUTO_BACKUP_CONFIG[backupType].expiresIn,
  } = options;

  const supabase = await createClient();

  try {
    // 1. Fetch current site data
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("*")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return { success: false, error: "Site not found" };
    }

    // 2. Fetch pages
    const { data: pages, error: pagesError } = await supabase
      .from("pages")
      .select("*")
      .eq("site_id", siteId)
      .order("order", { ascending: true });

    if (pagesError) {
      return { success: false, error: "Failed to fetch pages" };
    }

    // 3. Fetch modules
    const { data: modules } = await supabase
      .from("site_modules")
      .select("*")
      .eq("site_id", siteId);

    // 4. Create backup data structure
    const siteData: SiteBackupData = {
      id: site.id,
      name: site.name,
      subdomain: site.subdomain,
      status: site.status,
      settings: site.settings || {},
      theme: site.theme,
      favicon: site.favicon,
      ogImage: site.og_image,
      templateId: site.template_id,
    };

    const pagesData: PageBackupData[] = (pages || []).map((page) => ({
      id: page.id,
      name: page.name,
      slug: page.slug,
      content: page.content,
      settings: page.settings || {},
      isHomepage: page.is_homepage,
      status: page.status,
      metaTitle: page.meta_title,
      metaDescription: page.meta_description,
      order: page.order,
    }));

    const modulesData: ModuleBackupData[] = (modules || []).map((module) => ({
      id: module.id,
      moduleId: module.module_id,
      settings: module.settings || {},
      isActive: module.is_active,
    }));

    const backupData: BackupData = {
      version: BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      site: siteData,
      pages: pagesData,
      modules: modulesData,
    };

    // 5. Calculate size
    const dataJson = JSON.stringify(backupData);
    const sizeBytes = new Blob([dataJson]).size;

    // 6. Generate backup name
    const backupName = name || `${site.name} - ${new Date().toLocaleString()}`;

    // 7. Calculate expiration
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // 8. Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // 9. Insert backup record
    const { data: backup, error: backupError } = await supabase
      .from("backups")
      .insert({
        site_id: siteId,
        created_by: user?.id,
        name: backupName,
        description,
        backup_type: backupType,
        site_data: siteData,
        pages_data: pagesData,
        modules_data: modulesData,
        size_bytes: sizeBytes,
        page_count: pagesData.length,
        status: "completed",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (backupError || !backup) {
      return { success: false, error: "Failed to create backup" };
    }

    return {
      success: true,
      backup: {
        id: backup.id,
        siteId: backup.site_id,
        createdBy: backup.created_by,
        name: backup.name,
        description: backup.description,
        backupType: backup.backup_type as BackupType,
        sizeBytes: backup.size_bytes,
        pageCount: backup.page_count,
        status: backup.status,
        createdAt: backup.created_at,
        expiresAt: backup.expires_at,
        restoredAt: backup.restored_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Backup failed",
    };
  }
}

export async function listBackups(siteId: string): Promise<BackupMetadata[]> {
  const supabase = await createClient();

  const { data: backups, error } = await supabase
    .from("backups")
    .select("*")
    .eq("site_id", siteId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error || !backups) {
    return [];
  }

  return backups.map((backup) => ({
    id: backup.id,
    siteId: backup.site_id,
    createdBy: backup.created_by,
    name: backup.name,
    description: backup.description,
    backupType: backup.backup_type as BackupType,
    sizeBytes: backup.size_bytes,
    pageCount: backup.page_count,
    status: backup.status,
    createdAt: backup.created_at,
    expiresAt: backup.expires_at,
    restoredAt: backup.restored_at,
  }));
}

export async function getBackup(backupId: string): Promise<BackupData | null> {
  const supabase = await createClient();

  const { data: backup, error } = await supabase
    .from("backups")
    .select("*")
    .eq("id", backupId)
    .single();

  if (error || !backup) {
    return null;
  }

  return {
    version: BACKUP_VERSION,
    createdAt: backup.created_at,
    site: backup.site_data as SiteBackupData,
    pages: backup.pages_data as PageBackupData[],
    modules: backup.modules_data as ModuleBackupData[] || [],
  };
}

export async function deleteBackup(backupId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("backups")
    .delete()
    .eq("id", backupId);

  return !error;
}
```

---

### Task 64.4: Restore Service

**File: `src/lib/backup/restore-service.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import type { RestoreBackupOptions, RestoreResult, BackupData } from "./backup-types";
import { createBackup, getBackup } from "./backup-service";

export async function restoreBackup(options: RestoreBackupOptions): Promise<RestoreResult> {
  const {
    backupId,
    createPreRestoreBackup = true,
    restoreSettings = true,
    restorePages = true,
    restoreModules = true,
  } = options;

  const supabase = await createClient();

  try {
    // 1. Get backup data
    const backupData = await getBackup(backupId);
    
    if (!backupData) {
      return { success: false, error: "Backup not found" };
    }

    const siteId = backupData.site.id;

    // 2. Create pre-restore backup
    let preRestoreBackupId: string | undefined;
    
    if (createPreRestoreBackup) {
      const preBackup = await createBackup({
        siteId,
        name: `Pre-restore backup`,
        description: `Automatic backup before restoring from backup ${backupId}`,
        backupType: "pre_restore",
      });

      if (preBackup.success && preBackup.backup) {
        preRestoreBackupId = preBackup.backup.id;
      }
    }

    // 3. Restore site settings
    if (restoreSettings) {
      const { error: siteError } = await supabase
        .from("sites")
        .update({
          settings: backupData.site.settings,
          theme: backupData.site.theme,
          favicon: backupData.site.favicon,
          og_image: backupData.site.ogImage,
        })
        .eq("id", siteId);

      if (siteError) {
        return { success: false, error: "Failed to restore site settings" };
      }
    }

    // 4. Restore pages
    if (restorePages && backupData.pages.length > 0) {
      // Delete current pages
      await supabase
        .from("pages")
        .delete()
        .eq("site_id", siteId);

      // Insert restored pages
      const pagesToInsert = backupData.pages.map((page) => ({
        site_id: siteId,
        name: page.name,
        slug: page.slug,
        content: page.content,
        settings: page.settings,
        is_homepage: page.isHomepage,
        status: page.status,
        meta_title: page.metaTitle,
        meta_description: page.metaDescription,
        order: page.order,
      }));

      const { error: pagesError } = await supabase
        .from("pages")
        .insert(pagesToInsert);

      if (pagesError) {
        return { success: false, error: "Failed to restore pages" };
      }
    }

    // 5. Restore modules
    if (restoreModules && backupData.modules.length > 0) {
      // Delete current modules
      await supabase
        .from("site_modules")
        .delete()
        .eq("site_id", siteId);

      // Insert restored modules
      const modulesToInsert = backupData.modules.map((module) => ({
        site_id: siteId,
        module_id: module.moduleId,
        settings: module.settings,
        is_active: module.isActive,
      }));

      const { error: modulesError } = await supabase
        .from("site_modules")
        .insert(modulesToInsert);

      if (modulesError) {
        // Non-critical, continue
        console.error("Failed to restore modules:", modulesError);
      }
    }

    // 6. Update backup status
    const restoredAt = new Date().toISOString();
    
    await supabase
      .from("backups")
      .update({ 
        status: "restored",
        restored_at: restoredAt,
      })
      .eq("id", backupId);

    return {
      success: true,
      restoredAt,
      preRestoreBackupId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Restore failed",
    };
  }
}
```

---

### Task 64.5: Backup Index Export

**File: `src/lib/backup/index.ts`**

```typescript
export * from "./backup-types";
export { createBackup, listBackups, getBackup, deleteBackup } from "./backup-service";
export { restoreBackup } from "./restore-service";
```

---

### Task 64.6: Create Backup Action

**File: `src/actions/backup/create-backup.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createBackup, type CreateBackupOptions } from "@/lib/backup";
import { logError } from "@/lib/errors";

const createBackupSchema = z.object({
  siteId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
});

export type CreateBackupInput = z.infer<typeof createBackupSchema>;

export async function createBackupAction(input: CreateBackupInput) {
  try {
    const validated = createBackupSchema.parse(input);

    const result = await createBackup({
      siteId: validated.siteId,
      name: validated.name,
      description: validated.description,
      backupType: "manual",
    });

    if (result.success) {
      revalidatePath(`/sites/${validated.siteId}/backups`);
    }

    return result;
  } catch (error) {
    logError(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create backup",
    };
  }
}
```

---

### Task 64.7: Restore Backup Action

**File: `src/actions/backup/restore-backup.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { restoreBackup, getBackup } from "@/lib/backup";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";

const restoreBackupSchema = z.object({
  backupId: z.string().uuid(),
  createPreRestoreBackup: z.boolean().default(true),
  restoreSettings: z.boolean().default(true),
  restorePages: z.boolean().default(true),
  restoreModules: z.boolean().default(true),
});

export type RestoreBackupInput = z.infer<typeof restoreBackupSchema>;

export async function restoreBackupAction(input: RestoreBackupInput) {
  try {
    const validated = restoreBackupSchema.parse(input);

    // Get backup to find site ID
    const backup = await getBackup(validated.backupId);
    if (!backup) {
      return { success: false, error: "Backup not found" };
    }

    const siteId = backup.site.id;

    const result = await restoreBackup({
      backupId: validated.backupId,
      createPreRestoreBackup: validated.createPreRestoreBackup,
      restoreSettings: validated.restoreSettings,
      restorePages: validated.restorePages,
      restoreModules: validated.restoreModules,
    });

    if (result.success) {
      revalidatePath(`/sites/${siteId}`);
      revalidatePath(`/sites/${siteId}/backups`);
      revalidatePath(`/sites/${siteId}/pages`);
    }

    return result;
  } catch (error) {
    logError(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to restore backup",
    };
  }
}
```

---

### Task 64.8: Backup Manager Component

**File: `src/components/backup/backup-manager.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Archive, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackupList } from "./backup-list";
import { CreateBackupButton } from "./create-backup-button";
import type { BackupMetadata } from "@/lib/backup";

interface BackupManagerProps {
  siteId: string;
  siteName: string;
  backups: BackupMetadata[];
}

export function BackupManager({ siteId, siteName, backups }: BackupManagerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger a router refresh
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Backups</CardTitle>
              <CardDescription>
                Manage backups for {siteName}. Backups are created automatically
                before publishing and can be created manually at any time.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            <CreateBackupButton siteId={siteId} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <BackupList siteId={siteId} backups={backups} />
      </CardContent>
    </Card>
  );
}
```

---

### Task 64.9: Backup List Component

**File: `src/components/backup/backup-list.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Archive, FileArchive } from "lucide-react";
import { BackupItem } from "./backup-item";
import type { BackupMetadata } from "@/lib/backup";

interface BackupListProps {
  siteId: string;
  backups: BackupMetadata[];
}

export function BackupList({ siteId, backups }: BackupListProps) {
  if (backups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileArchive className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No backups yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Create your first backup to protect your work. Backups are also
          created automatically before publishing.
        </p>
      </div>
    );
  }

  // Group backups by date
  const groupedBackups = backups.reduce<Record<string, BackupMetadata[]>>(
    (groups, backup) => {
      const date = new Date(backup.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(backup);
      return groups;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedBackups).map(([date, dateBackups]) => (
        <div key={date}>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {date}
          </h4>
          <div className="space-y-2">
            {dateBackups.map((backup) => (
              <BackupItem key={backup.id} backup={backup} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### Task 64.10: Backup Item Component

**File: `src/components/backup/backup-item.tsx`**

```tsx
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Archive, 
  Clock, 
  FileText, 
  MoreVertical, 
  RotateCcw, 
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RestoreDialog } from "./restore-dialog";
import type { BackupMetadata, BackupType } from "@/lib/backup";

interface BackupItemProps {
  backup: BackupMetadata;
}

const BACKUP_TYPE_LABELS: Record<BackupType, string> = {
  manual: "Manual",
  auto_publish: "Pre-publish",
  auto_schedule: "Scheduled",
  auto_change: "Auto-save",
  pre_restore: "Pre-restore",
};

const BACKUP_TYPE_COLORS: Record<BackupType, string> = {
  manual: "bg-blue-500",
  auto_publish: "bg-green-500",
  auto_schedule: "bg-purple-500",
  auto_change: "bg-yellow-500",
  pre_restore: "bg-orange-500",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function BackupItem({ backup }: BackupItemProps) {
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this backup? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/backups/${backup.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        window.location.reload();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${BACKUP_TYPE_COLORS[backup.backupType]} bg-opacity-10`}>
            <Archive className={`h-5 w-5 ${BACKUP_TYPE_COLORS[backup.backupType].replace("bg-", "text-")}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{backup.name}</h4>
              <Badge variant="outline" className="text-xs">
                {BACKUP_TYPE_LABELS[backup.backupType]}
              </Badge>
              {backup.restoredAt && (
                <Badge variant="secondary" className="text-xs">
                  Restored
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(backup.createdAt), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {backup.pageCount} pages
              </span>
              <span>{formatBytes(backup.sizeBytes)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRestoreDialogOpen(true)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restore
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRestoreDialogOpen(true)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore Backup
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Backup
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <RestoreDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        backup={backup}
      />
    </>
  );
}
```

---

### Task 64.11: Restore Dialog Component

**File: `src/components/backup/restore-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { restoreBackupAction } from "@/actions/backup/restore-backup";
import type { BackupMetadata } from "@/lib/backup";

interface RestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backup: BackupMetadata;
}

export function RestoreDialog({ open, onOpenChange, backup }: RestoreDialogProps) {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);
  const [options, setOptions] = useState({
    createPreRestoreBackup: true,
    restoreSettings: true,
    restorePages: true,
    restoreModules: true,
  });

  const handleRestore = async () => {
    setIsRestoring(true);

    try {
      const result = await restoreBackupAction({
        backupId: backup.id,
        ...options,
      });

      if (result.success) {
        toast.success("Backup restored successfully!", {
          description: result.preRestoreBackupId
            ? "A pre-restore backup was created automatically."
            : undefined,
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error("Failed to restore backup", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Restore Backup
          </AlertDialogTitle>
          <AlertDialogDescription>
            Restore your site to the state from "{backup.name}"
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will replace your current site content with the backup. This
            action cannot be undone directly, but a pre-restore backup will be
            created automatically.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Label className="font-medium">Restore Options</Label>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="createPreRestoreBackup"
                checked={options.createPreRestoreBackup}
                onCheckedChange={(checked) =>
                  setOptions((o) => ({ ...o, createPreRestoreBackup: !!checked }))
                }
              />
              <Label htmlFor="createPreRestoreBackup" className="font-normal">
                Create backup of current state before restoring
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="restoreSettings"
                checked={options.restoreSettings}
                onCheckedChange={(checked) =>
                  setOptions((o) => ({ ...o, restoreSettings: !!checked }))
                }
              />
              <Label htmlFor="restoreSettings" className="font-normal">
                Restore site settings (SEO, theme, etc.)
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="restorePages"
                checked={options.restorePages}
                onCheckedChange={(checked) =>
                  setOptions((o) => ({ ...o, restorePages: !!checked }))
                }
              />
              <Label htmlFor="restorePages" className="font-normal">
                Restore all pages ({backup.pageCount} pages)
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="restoreModules"
                checked={options.restoreModules}
                onCheckedChange={(checked) =>
                  setOptions((o) => ({ ...o, restoreModules: !!checked }))
                }
              />
              <Label htmlFor="restoreModules" className="font-normal">
                Restore installed modules
              </Label>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRestoring}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore Backup
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

### Task 64.12: Create Backup Button

**File: `src/components/backup/create-backup-button.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createBackupAction } from "@/actions/backup/create-backup";

interface CreateBackupButtonProps {
  siteId: string;
}

export function CreateBackupButton({ siteId }: CreateBackupButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      const result = await createBackupAction({
        siteId,
        name: name || undefined,
        description: description || undefined,
      });

      if (result.success) {
        toast.success("Backup created successfully!");
        setOpen(false);
        setName("");
        setDescription("");
        router.refresh();
      } else {
        toast.error("Failed to create backup", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Backup
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Backup</DialogTitle>
          <DialogDescription>
            Create a manual backup of your site's current state.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="backupName">Backup Name (optional)</Label>
            <Input
              id="backupName"
              placeholder="My backup"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="backupDescription">Description (optional)</Label>
            <Textarea
              id="backupDescription"
              placeholder="What changes are you about to make?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Backup
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

## 🧪 Testing Checklist

### Unit Tests
- [ ] Backup data structure is correct
- [ ] Size calculation is accurate
- [ ] Expiration dates set correctly

### Integration Tests
- [ ] Create backup works
- [ ] List backups returns correct data
- [ ] Restore backup restores all data
- [ ] Pre-restore backup is created
- [ ] Delete backup works

### E2E Tests
- [ ] Backup manager displays correctly
- [ ] Create backup dialog works
- [ ] Restore dialog shows options
- [ ] Success/error toasts appear

---

## ✅ Completion Checklist

- [ ] Database migration applied
- [ ] Backup types defined
- [ ] Backup service working
- [ ] Restore service working
- [ ] Server actions created
- [ ] Backup manager component created
- [ ] Backup list component created
- [ ] Restore dialog created
- [ ] API endpoints created
- [ ] Tests passing

---

**Next Phase**: Phase 65 - Export/Import System
