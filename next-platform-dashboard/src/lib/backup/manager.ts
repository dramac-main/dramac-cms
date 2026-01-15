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
    const encoder = new TextEncoder();
    const sizeBytes = encoder.encode(jsonData).length;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(`${siteId}/${filename}`, jsonData, {
        contentType: "application/json",
        upsert: false,
      });

    if (uploadError) {
      // If bucket doesn't exist, return a helpful error
      if (uploadError.message.includes("bucket") || uploadError.message.includes("Bucket")) {
        return { 
          success: false, 
          error: "Backup storage bucket not configured. Please run the backups migration first." 
        };
      }
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Create backup record using admin-style raw query for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: backupRecord, error: recordError } = await (supabase as any)
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

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("backups")
      .select(`
        id,
        site_id,
        filename,
        size_bytes,
        type,
        created_at,
        created_by,
        sites!inner(name)
      `)
      .eq("site_id", siteId)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist yet, return empty array
      if (error.message.includes("does not exist") || error.code === "42P01") {
        return { success: true, backups: [] };
      }
      return { success: false, error: error.message };
    }

    const backups: BackupRecord[] = (data || []).map((b: {
      id: string;
      site_id: string;
      filename: string;
      size_bytes: number;
      type: "manual" | "automatic";
      created_at: string;
      created_by: string;
      sites: { name: string } | null;
    }) => ({
      id: b.id,
      siteId: b.site_id,
      siteName: b.sites?.name || "",
      filename: b.filename,
      sizeBytes: b.size_bytes,
      createdAt: b.created_at,
      createdBy: b.created_by,
      type: b.type,
    }));

    return { success: true, backups };
  } catch (error) {
    console.error("List backups error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list backups",
    };
  }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: backup, error: backupError } = await (supabase as any)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: backup, error: fetchError } = await (supabase as any)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from("backups")
      .delete()
      .eq("id", backupId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete backup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Download a backup file
 */
export async function downloadBackup(backupId: string): Promise<{
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Get backup record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: backup, error: fetchError } = await (supabase as any)
      .from("backups")
      .select("site_id, filename")
      .eq("id", backupId)
      .single();

    if (fetchError || !backup) {
      return { success: false, error: "Backup not found" };
    }

    // Download file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("backups")
      .download(`${backup.site_id}/${backup.filename}`);

    if (downloadError || !fileData) {
      return { success: false, error: `Download failed: ${downloadError?.message}` };
    }

    const jsonText = await fileData.text();

    return {
      success: true,
      data: jsonText,
      filename: backup.filename,
    };
  } catch (error) {
    console.error("Download backup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Download failed",
    };
  }
}

/**
 * Get backup statistics for a site
 */
export async function getBackupStats(siteId: string): Promise<{
  success: boolean;
  stats?: {
    totalBackups: number;
    totalSize: number;
    latestBackup: string | null;
    oldestBackup: string | null;
  };
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("backups")
      .select("size_bytes, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("does not exist")) {
        return {
          success: true,
          stats: {
            totalBackups: 0,
            totalSize: 0,
            latestBackup: null,
            oldestBackup: null,
          },
        };
      }
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        stats: {
          totalBackups: 0,
          totalSize: 0,
          latestBackup: null,
          oldestBackup: null,
        },
      };
    }

    const totalSize = data.reduce((sum: number, b: { size_bytes: number }) => sum + b.size_bytes, 0);

    return {
      success: true,
      stats: {
        totalBackups: data.length,
        totalSize,
        latestBackup: data[0].created_at,
        oldestBackup: data[data.length - 1].created_at,
      },
    };
  } catch (error) {
    console.error("Get backup stats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get stats",
    };
  }
}

/**
 * Cleanup old backups (keep only the last N backups)
 */
export async function cleanupOldBackups(
  siteId: string,
  keepCount: number = 10
): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Get all backups for the site
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: backups, error: listError } = await (supabase as any)
      .from("backups")
      .select("id, site_id, filename")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false });

    if (listError) {
      return { success: false, error: listError.message };
    }

    if (!backups || backups.length <= keepCount) {
      return { success: true, deletedCount: 0 };
    }

    // Get backups to delete
    const toDelete = backups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of toDelete) {
      // Delete file from storage
      await supabase.storage
        .from("backups")
        .remove([`${backup.site_id}/${backup.filename}`]);

      // Delete record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from("backups")
        .delete()
        .eq("id", backup.id);

      if (!deleteError) {
        deletedCount++;
      }
    }

    return { success: true, deletedCount };
  } catch (error) {
    console.error("Cleanup backups error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Cleanup failed",
    };
  }
}
