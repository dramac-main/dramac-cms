import { NextResponse } from "next/server";
import { syncAllStudioModules, getSyncStatus } from "@/lib/modules/module-catalog-sync";
import { isSuperAdmin } from "@/lib/auth/permissions";

/**
 * GET /api/admin/modules/sync
 * Get sync status for all studio modules
 */
export async function GET() {
  try {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin required" },
        { status: 403 }
      );
    }

    const status = await getSyncStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("[API] Sync status error:", error);
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/modules/sync
 * Sync all published studio modules to the catalog
 */
export async function POST() {
  try {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin required" },
        { status: 403 }
      );
    }

    const result = await syncAllStudioModules();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
