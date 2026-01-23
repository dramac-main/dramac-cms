/**
 * Module Storage API Route
 * 
 * Handles file storage operations for modules.
 * Supports upload, download, delete, and list operations.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  uploadFile,
  downloadFile,
  deleteFile,
  listFiles,
  getStorageQuota,
  getSignedUrl,
} from "@/lib/modules/module-storage";

interface RouteContext {
  params: Promise<{ moduleId: string }>;
}

/**
 * GET /api/modules/[moduleId]/storage
 * List files or get storage quota
 * Query params:
 *   - siteId: Required site context
 *   - action: "list" | "quota" | "download" | "signed-url"
 *   - path: File path (for download/signed-url)
 *   - prefix: Optional path prefix filter (for list)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const action = searchParams.get("action") || "list";
    const path = searchParams.get("path") || "";
    const prefix = searchParams.get("prefix") || "";

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Verify user has access to this site
    const hasAccess = await verifyModuleAccess(supabase, moduleId, siteId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    switch (action) {
      case "list": {
        const result = await listFiles(moduleId, siteId, { path: prefix });
        return NextResponse.json(result);
      }

      case "quota": {
        const quota = await getStorageQuota(moduleId, siteId);
        return NextResponse.json(quota);
      }

      case "download": {
        if (!path) {
          return NextResponse.json({ error: "path is required" }, { status: 400 });
        }
        const result = await downloadFile(moduleId, siteId, path);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 404 });
        }
        return NextResponse.json({ data: result.data, contentType: result.contentType });
      }

      case "signed-url": {
        if (!path) {
          return NextResponse.json({ error: "path is required" }, { status: 400 });
        }
        const expiresIn = parseInt(searchParams.get("expiresIn") || "3600");
        const result = await getSignedUrl(moduleId, siteId, path, expiresIn);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 404 });
        }
        return NextResponse.json({ url: result.url });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Storage GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/modules/[moduleId]/storage
 * Upload a file
 * Body: FormData with file and path
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const siteId = formData.get("siteId") as string;
    const path = formData.get("path") as string;
    const file = formData.get("file") as File;

    if (!siteId || !path || !file) {
      return NextResponse.json(
        { error: "siteId, path, and file are required" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await verifyModuleAccess(supabase, moduleId, siteId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get ArrayBuffer from File for upload
    const arrayBuffer = await file.arrayBuffer();

    const result = await uploadFile(moduleId, siteId, path, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      path: result.path,
      size: result.file?.size || 0,
    });
  } catch (error) {
    console.error("Storage POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/modules/[moduleId]/storage
 * Delete a file
 * Query params:
 *   - siteId: Required site context
 *   - path: File path to delete
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const path = searchParams.get("path");

    if (!siteId || !path) {
      return NextResponse.json(
        { error: "siteId and path are required" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await verifyModuleAccess(supabase, moduleId, siteId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const result = await deleteFile(moduleId, siteId, path);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Storage DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Verify user has access to module for this site
 */
async function verifyModuleAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  moduleId: string,
  siteId: string,
  userId: string
): Promise<boolean> {
  // Check if user is admin/owner of the site's client
  const { data: site } = await supabase
    .from("sites")
    .select("client_id")
    .eq("id", siteId)
    .single();

  if (!site) return false;

  // Check if user has access to this client - use type assertion for agency_members table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: access } = await (supabase as any)
    .from("agency_members")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (!access) return false;

  // Admins and owners have full access
  if (access.role === "admin" || access.role === "owner") {
    return true;
  }

  // Check if module is installed on this site
  const { data: installation } = await supabase
    .from("site_module_installations")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .eq("is_active", true)
    .single();

  return !!installation;
}
