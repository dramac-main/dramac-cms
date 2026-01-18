# Phase 64: Backup System - ADD UI Components & Scheduling

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 LOW (Core backup exists!)
>
> **Estimated Time**: 1-2 hours

---

## ⚠️ CRITICAL: BACKUP SYSTEM ALREADY EXISTS!

**The core backup system is fully implemented:**
- ✅ `src/lib/backup/manager.ts` (489 lines!)
- ✅ `src/lib/backup/index.ts` (exports)

**What Already Exists:**
- ✅ `createBackup(siteId, type)` - Creates backups
- ✅ `listBackups(siteId)` - Lists backups
- ✅ `restoreFromBackup(backupId, targetSiteId)` - Restores
- ✅ `downloadBackup(backupId)` - Downloads JSON
- ✅ `deleteBackup(backupId)` - Deletes backup
- ✅ `getBackupStats(siteId)` - Statistics
- ✅ `cleanupOldBackups(siteId, maxAge)` - Cleanup

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAMES!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `site_modules` | `site_module_installations` |

---

## 🎯 Objective

ADD UI components for the existing backup system. DO NOT recreate backup logic!

---

## 📋 Prerequisites

- [ ] `src/lib/backup/` exists (it does!)
- [ ] Supabase Storage bucket `backups` exists

---

## ✅ Tasks

### Task 64.1: Verify Existing Implementation

**Check `src/lib/backup/manager.ts` exists:**

```typescript
// Already exists - USE THESE!
import {
  createBackup,
  listBackups,
  deleteBackup,
  restoreFromBackup,
  downloadBackup,
} from "@/lib/backup";
```

---

### Task 64.2: Backup Server Actions

**File: `src/lib/actions/backup.ts`** (if not exists)

```typescript
"use server";

import { revalidatePath } from "next/cache";
import {
  createBackup,
  listBackups,
  deleteBackup,
  restoreFromBackup,
} from "@/lib/backup";

export async function createBackupAction(siteId: string) {
  const result = await createBackup(siteId, "manual");
  
  if (result.success) {
    revalidatePath(`/dashboard/sites/${siteId}`);
  }
  
  return result;
}

export async function listBackupsAction(siteId: string) {
  return listBackups(siteId);
}

export async function deleteBackupAction(backupId: string, siteId: string) {
  const result = await deleteBackup(backupId);
  
  if (result.success) {
    revalidatePath(`/dashboard/sites/${siteId}`);
  }
  
  return result;
}

export async function restoreBackupAction(
  backupId: string,
  targetSiteId: string,
  overwrite: boolean = false
) {
  const result = await restoreFromBackup(backupId, targetSiteId, overwrite);
  
  if (result.success) {
    revalidatePath(`/dashboard/sites/${targetSiteId}`);
  }
  
  return result;
}
```

---

### Task 64.3: Backup List Component

**File: `src/components/backup/backup-list.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Download, Trash2, RotateCcw, HardDrive, Loader2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  listBackupsAction,
  deleteBackupAction,
  restoreBackupAction,
} from "@/lib/actions/backup";
import type { BackupRecord } from "@/lib/backup/manager";

interface BackupListProps {
  siteId: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function BackupList({ siteId }: BackupListProps) {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadBackups();
  }, [siteId]);

  async function loadBackups() {
    setLoading(true);
    const result = await listBackupsAction(siteId);
    if (result.success && result.backups) {
      setBackups(result.backups);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setProcessing(true);
    const result = await deleteBackupAction(deleteId, siteId);
    if (result.success) {
      toast.success("Backup deleted");
      loadBackups();
    } else {
      toast.error("Failed to delete", { description: result.error });
    }
    setProcessing(false);
    setDeleteId(null);
  }

  async function handleRestore() {
    if (!restoreId) return;
    setProcessing(true);
    const result = await restoreBackupAction(restoreId, siteId, true);
    if (result.success) {
      toast.success("Site restored from backup");
    } else {
      toast.error("Restore failed", { description: result.error });
    }
    setProcessing(false);
    setRestoreId(null);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backups
          </CardTitle>
          <CardDescription>
            {backups.length} backup{backups.length !== 1 ? "s" : ""} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No backups yet. Create your first backup.
            </p>
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
                      {formatDistanceToNow(new Date(backup.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="capitalize">{backup.type}</TableCell>
                    <TableCell>{formatBytes(backup.sizeBytes)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRestoreId(backup.id)}
                        title="Restore"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(backup.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The backup will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Dialog */}
      <AlertDialog open={!!restoreId} onOpenChange={() => setRestoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore from Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all current site content with the backup. Current
              changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

---

### Task 64.4: Create Backup Button

**File: `src/components/backup/create-backup-button.tsx`**

```typescript
"use client";

import { useState } from "react";
import { HardDrive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createBackupAction } from "@/lib/actions/backup";

interface CreateBackupButtonProps {
  siteId: string;
  onCreated?: () => void;
}

export function CreateBackupButton({ siteId, onCreated }: CreateBackupButtonProps) {
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    const result = await createBackupAction(siteId);
    
    if (result.success) {
      toast.success("Backup created successfully");
      onCreated?.();
    } else {
      toast.error("Backup failed", { description: result.error });
    }
    
    setCreating(false);
  }

  return (
    <Button onClick={handleCreate} disabled={creating}>
      {creating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <HardDrive className="mr-2 h-4 w-4" />
      )}
      Create Backup
    </Button>
  );
}
```

---

## ✅ Completion Checklist

- [ ] Verified `src/lib/backup/manager.ts` exists
- [ ] Server actions created (if needed)
- [ ] Backup list component created
- [ ] Create backup button created
- [ ] Restore functionality works
- [ ] Delete functionality works
- [ ] Integrated into site settings

---

## 📝 Notes for AI Agent

1. **DON'T RECREATE** - Use existing backup functions!
2. **UI ONLY** - Just add components
3. **STORAGE BUCKET** - Verify `backups` bucket exists in Supabase
4. **TEST RESTORE** - Most important feature to test
5. **MINIMAL CHANGES** - Core system is complete!
