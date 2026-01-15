"use server";

import { 
  createBackup, 
  listBackups, 
  deleteBackup, 
  restoreFromBackup,
  downloadBackup,
  getBackupStats,
  cleanupOldBackups,
  type BackupRecord 
} from "@/lib/backup/manager";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBackupAction(siteId: string): Promise<{
  success: boolean;
  backup?: BackupRecord;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user has access to this site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return { success: false, error: "Site not found or access denied" };
    }

    const result = await createBackup(siteId, "manual");
    
    if (result.success) {
      revalidatePath(`/dashboard/sites/${siteId}/settings`);
    }
    
    return result;
  } catch (error) {
    console.error("Create backup action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Backup creation failed",
    };
  }
}

export async function listBackupsAction(siteId: string): Promise<{
  success: boolean;
  backups?: BackupRecord[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    return listBackups(siteId);
  } catch (error) {
    console.error("List backups action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list backups",
    };
  }
}

export async function deleteBackupAction(backupId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    return deleteBackup(backupId);
  } catch (error) {
    console.error("Delete backup action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

export async function restoreBackupAction(
  backupId: string, 
  siteId: string
): Promise<{
  success: boolean;
  error?: string;
  details?: {
    pagesRestored: number;
    modulesRestored: number;
  };
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await restoreFromBackup(backupId, siteId, true);
    
    if (result.success) {
      revalidatePath(`/dashboard/sites/${siteId}`);
      revalidatePath(`/dashboard/sites/${siteId}/pages`);
    }
    
    return result;
  } catch (error) {
    console.error("Restore backup action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Restore failed",
    };
  }
}

export async function downloadBackupAction(backupId: string): Promise<{
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    return downloadBackup(backupId);
  } catch (error) {
    console.error("Download backup action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Download failed",
    };
  }
}

export async function getBackupStatsAction(siteId: string): Promise<{
  success: boolean;
  stats?: {
    totalBackups: number;
    totalSize: number;
    latestBackup: string | null;
    oldestBackup: string | null;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    return getBackupStats(siteId);
  } catch (error) {
    console.error("Get backup stats action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get stats",
    };
  }
}

export async function cleanupOldBackupsAction(
  siteId: string,
  keepCount: number = 10
): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await cleanupOldBackups(siteId, keepCount);
    
    if (result.success) {
      revalidatePath(`/dashboard/sites/${siteId}/settings`);
    }
    
    return result;
  } catch (error) {
    console.error("Cleanup backups action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Cleanup failed",
    };
  }
}

/**
 * Create automatic backup (for scheduled jobs)
 */
export async function createAutomaticBackupAction(siteId: string): Promise<{
  success: boolean;
  backup?: BackupRecord;
  error?: string;
}> {
  try {
    const result = await createBackup(siteId, "automatic");
    
    // Cleanup old backups after creating automatic one
    if (result.success) {
      await cleanupOldBackups(siteId, 10);
    }
    
    return result;
  } catch (error) {
    console.error("Create automatic backup action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Automatic backup failed",
    };
  }
}
