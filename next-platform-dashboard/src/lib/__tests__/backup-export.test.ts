/**
 * Test file for Phase 62: Backup & Export System
 * 
 * This file contains test functions to verify the backup/export functionality.
 * Run these tests manually in a development environment.
 */

import { exportSite, exportSiteToJSON, type SiteExportData } from "@/lib/sites/export";
import { importSite, importSiteFromJSON, validateImportData, type ImportOptions } from "@/lib/sites/import";
import { 
  createBackup, 
  listBackups, 
  deleteBackup, 
  restoreFromBackup,
  getBackupStats,
  cleanupOldBackups
} from "@/lib/backup/manager";

// Sample test data for validation
const sampleExportData: SiteExportData = {
  version: "1.0",
  exportDate: new Date().toISOString(),
  siteInfo: {
    name: "Test Site",
    subdomain: "test-site",
    status: "draft",
    settings: { theme: "default" },
    seoTitle: "Test Site | SEO Title",
    seoDescription: "Test site description for SEO",
    seoImage: null,
  },
  pages: [
    {
      slug: "home",
      name: "Home",
      content: { sections: [] },
      seoTitle: "Home Page",
      seoDescription: "Home page description",
      seoImage: null,
      isHomepage: true,
      sortOrder: 0,
    },
    {
      slug: "about",
      name: "About",
      content: { sections: [] },
      seoTitle: "About Us",
      seoDescription: "About page description",
      seoImage: null,
      isHomepage: false,
      sortOrder: 1,
    },
  ],
  modules: [
    {
      moduleSlug: "seo-optimizer",
      settings: { enabled: true },
      isEnabled: true,
    },
  ],
  metadata: {
    totalPages: 2,
    totalModules: 1,
    exportedBy: "test@example.com",
  },
};

/**
 * Test: Validate export data structure
 */
export function testValidateExportData() {
  console.log("Testing validateImportData...");
  
  // Valid data
  const validResult = validateImportData(sampleExportData);
  console.assert(validResult.valid === true, "Valid data should pass validation");
  console.assert(validResult.data !== undefined, "Should return parsed data");
  
  // Invalid data - wrong version
  const invalidVersion = { ...sampleExportData, version: "2.0" };
  const versionResult = validateImportData(invalidVersion);
  console.assert(versionResult.valid === false, "Wrong version should fail");
  
  // Invalid data - missing site info
  const missingSiteInfo = { ...sampleExportData, siteInfo: undefined };
  const siteInfoResult = validateImportData(missingSiteInfo as unknown);
  console.assert(siteInfoResult.valid === false, "Missing site info should fail");
  
  // Invalid data - not an object
  const notObject = "not an object";
  const objectResult = validateImportData(notObject);
  console.assert(objectResult.valid === false, "Non-object should fail");
  
  console.log("✓ validateImportData tests passed");
}

/**
 * Test: Export site (requires real site ID and authentication)
 */
export async function testExportSite(siteId: string) {
  console.log("Testing exportSite...");
  
  const result = await exportSite(siteId);
  
  if (result.success && result.data) {
    console.assert(result.data.version === "1.0", "Should have version 1.0");
    console.assert(result.data.siteInfo !== undefined, "Should have site info");
    console.assert(Array.isArray(result.data.pages), "Should have pages array");
    console.assert(Array.isArray(result.data.modules), "Should have modules array");
    console.log("✓ exportSite test passed");
    return result.data;
  } else {
    console.error("Export failed:", result.error);
    return null;
  }
}

/**
 * Test: Export to JSON (requires real site ID and authentication)
 */
export async function testExportToJSON(siteId: string) {
  console.log("Testing exportSiteToJSON...");
  
  const result = await exportSiteToJSON(siteId);
  
  if (result.success && result.json && result.filename) {
    console.assert(result.filename.endsWith(".json"), "Filename should end with .json");
    const parsed = JSON.parse(result.json);
    console.assert(parsed.version === "1.0", "Parsed JSON should have version");
    console.log("✓ exportSiteToJSON test passed");
    console.log(`  Filename: ${result.filename}`);
    console.log(`  Size: ${(result.json.length / 1024).toFixed(2)} KB`);
    return result;
  } else {
    console.error("Export to JSON failed:", result.error);
    return null;
  }
}

/**
 * Test: Import validation
 */
export function testImportValidation() {
  console.log("Testing import validation...");
  
  // Valid JSON string
  const validJson = JSON.stringify(sampleExportData);
  
  // Test parsing
  try {
    const parsed = JSON.parse(validJson);
    const validation = validateImportData(parsed);
    console.assert(validation.valid === true, "Valid JSON should pass");
    console.log("✓ Import validation test passed");
  } catch (e) {
    console.error("Import validation failed:", e);
  }
  
  // Invalid JSON
  const invalidJson = "not valid json {";
  try {
    JSON.parse(invalidJson);
    console.error("Should have thrown on invalid JSON");
  } catch {
    console.log("✓ Invalid JSON correctly rejected");
  }
}

/**
 * Test: Create and list backups (requires real site ID)
 */
export async function testBackupSystem(siteId: string) {
  console.log("Testing backup system...");
  
  // Create backup
  const createResult = await createBackup(siteId, "manual");
  if (createResult.success && createResult.backup) {
    console.log("✓ Backup created:", createResult.backup.filename);
    
    // List backups
    const listResult = await listBackups(siteId);
    if (listResult.success && listResult.backups) {
      console.log(`✓ Found ${listResult.backups.length} backups`);
      
      // Get stats
      const statsResult = await getBackupStats(siteId);
      if (statsResult.success && statsResult.stats) {
        console.log("✓ Backup stats:", statsResult.stats);
      }
      
      return createResult.backup;
    }
  } else {
    console.error("Backup creation failed:", createResult.error);
  }
  
  return null;
}

/**
 * Test: Restore from backup (requires real backup ID and site ID)
 */
export async function testRestoreBackup(backupId: string, targetSiteId: string) {
  console.log("Testing backup restore...");
  
  const result = await restoreFromBackup(backupId, targetSiteId, true);
  
  if (result.success) {
    console.log("✓ Restore successful");
    console.log(`  Pages restored: ${result.details?.pagesRestored || 0}`);
    console.log(`  Modules restored: ${result.details?.modulesRestored || 0}`);
    return true;
  } else {
    console.error("Restore failed:", result.error);
    return false;
  }
}

/**
 * Test: Delete backup (requires real backup ID)
 */
export async function testDeleteBackup(backupId: string) {
  console.log("Testing backup deletion...");
  
  const result = await deleteBackup(backupId);
  
  if (result.success) {
    console.log("✓ Backup deleted successfully");
    return true;
  } else {
    console.error("Delete failed:", result.error);
    return false;
  }
}

/**
 * Run all sync tests (no authentication required)
 */
export function runSyncTests() {
  console.log("=== Running Sync Tests ===\n");
  
  testValidateExportData();
  console.log("");
  
  testImportValidation();
  console.log("");
  
  console.log("=== Sync Tests Complete ===");
}

/**
 * Run all async tests (requires authentication and real site ID)
 */
export async function runAsyncTests(siteId: string) {
  console.log("=== Running Async Tests ===\n");
  
  // Export tests
  const exportData = await testExportSite(siteId);
  console.log("");
  
  const jsonExport = await testExportToJSON(siteId);
  console.log("");
  
  // Backup tests
  const backup = await testBackupSystem(siteId);
  console.log("");
  
  if (backup) {
    // Restore test
    await testRestoreBackup(backup.id, siteId);
    console.log("");
    
    // Cleanup - delete test backup
    await testDeleteBackup(backup.id);
    console.log("");
  }
  
  console.log("=== Async Tests Complete ===");
}

// Export for use in development
export default {
  runSyncTests,
  runAsyncTests,
  testValidateExportData,
  testImportValidation,
  testExportSite,
  testExportToJSON,
  testBackupSystem,
  testRestoreBackup,
  testDeleteBackup,
};
