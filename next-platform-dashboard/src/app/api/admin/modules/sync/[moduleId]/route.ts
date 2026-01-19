import { NextRequest, NextResponse } from "next/server";
import { syncStudioModuleToCatalog, moduleNeedsSync } from "@/lib/modules/module-catalog-sync";
import { isSuperAdmin } from "@/lib/auth/permissions";

/**
 * GET /api/admin/modules/sync/[moduleId]
 * Check if a specific module needs syncing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin required" },
        { status: 403 }
      );
    }

    const { moduleId } = await params;
    const status = await moduleNeedsSync(moduleId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("[API] Check sync error:", error);
    return NextResponse.json(
      { error: "Failed to check sync status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/modules/sync/[moduleId]
 * Sync a specific studio module to the catalog
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin required" },
        { status: 403 }
      );
    }

    const { moduleId } = await params;
    const result = await syncStudioModuleToCatalog(moduleId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Sync module error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
