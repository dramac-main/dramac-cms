/**
 * Module Database API Route
 * 
 * Provides sandboxed database access for modules.
 * Each module gets its own namespaced data storage.
 * 
 * Note: This file uses type assertions for module_data table since
 * it's created in Phase 81C migration and types may not be generated yet.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ moduleId: string }>;
}

interface ModuleDataRecord {
  id?: string;
  key: string;
  value: unknown;
  metadata?: Record<string, unknown>;
}

// Type for module_data rows (Phase 81C table - uses data_key and data_value columns)
interface ModuleDataRow {
  id: string;
  module_id: string;
  site_id: string;
  data_key: string;
  data_value: unknown;
  data_type: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/modules/[moduleId]/db
 * Query module data
 * Query params:
 *   - siteId: Required site context
 *   - key: Optional specific key to fetch
 *   - prefix: Optional key prefix for filtering
 *   - limit: Max records to return (default 100)
 *   - offset: Pagination offset
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
    const key = searchParams.get("key");
    const prefix = searchParams.get("prefix");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000);
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Verify user has access
    const hasAccess = await verifyModuleAccess(supabase, moduleId, siteId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build query - use type assertion for Phase 81C table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("module_data")
      .select("*", { count: "exact" })
      .eq("module_id", moduleId)
      .eq("site_id", siteId);

    if (key) {
      query = query.eq("data_key", key);
    } else if (prefix) {
      query = query.like("data_key", `${prefix}%`);
    }

    query = query.order("data_key").range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Module DB query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to response format
    const records = ((data || []) as ModuleDataRow[]).map((row) => ({
      id: row.id,
      key: row.data_key,
      value: row.data_value,
      dataType: row.data_type,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      records,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Module DB GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/modules/[moduleId]/db
 * Create or update module data
 * Body: { siteId, records: [{ key, value, metadata? }] }
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

    const body = await request.json();
    const { siteId, records } = body as {
      siteId: string;
      records: ModuleDataRecord[];
    };

    if (!siteId || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "siteId and records array are required" },
        { status: 400 }
      );
    }

    // Validate records
    for (const record of records) {
      if (!record.key || typeof record.key !== "string") {
        return NextResponse.json(
          { error: "Each record must have a string key" },
          { status: 400 }
        );
      }
      if (record.key.length > 255) {
        return NextResponse.json(
          { error: "Key must be 255 characters or less" },
          { status: 400 }
        );
      }
    }

    // Verify user has access
    const hasAccess = await verifyModuleAccess(supabase, moduleId, siteId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prepare upsert data (using data_key and data_value column names)
    const upsertData = records.map((record) => ({
      module_id: moduleId,
      site_id: siteId,
      data_key: record.key,
      data_value: record.value,
      data_type: typeof record.value === "object" ? "json" : 
                 typeof record.value === "number" ? "number" :
                 typeof record.value === "boolean" ? "boolean" :
                 Array.isArray(record.value) ? "array" : "text",
      updated_at: new Date().toISOString(),
    }));

    // Upsert records - use type assertion for Phase 81C table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("module_data")
      .upsert(upsertData, { 
        onConflict: "module_id,site_id,data_key",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("Module DB upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      records: ((data || []) as ModuleDataRow[]).map((row) => ({
        id: row.id,
        key: row.data_key,
        value: row.data_value,
      })),
    });
  } catch (error) {
    console.error("Module DB POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/modules/[moduleId]/db
 * Update a specific record
 * Body: { siteId, key, value, metadata? }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, key, value, metadata } = body as {
      siteId: string;
      key: string;
      value: unknown;
      metadata?: Record<string, unknown>;
    };

    if (!siteId || !key) {
      return NextResponse.json(
        { error: "siteId and key are required" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await verifyModuleAccess(supabase, moduleId, siteId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {
      data_value: value,
      updated_at: new Date().toISOString(),
    };

    if (metadata !== undefined) {
      // Metadata is not in Phase 81C schema, but we'll keep it for compatibility
      // It could be merged into data_value as a wrapper
    }

    // Update record - use type assertion for Phase 81C table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("module_data")
      .update(updateData)
      .eq("module_id", moduleId)
      .eq("site_id", siteId)
      .eq("data_key", key)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      }
      console.error("Module DB update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const record = data as ModuleDataRow;
    return NextResponse.json({
      success: true,
      record: {
        id: record.id,
        key: record.data_key,
        value: record.data_value,
      },
    });
  } catch (error) {
    console.error("Module DB PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/modules/[moduleId]/db
 * Delete module data
 * Query params:
 *   - siteId: Required site context
 *   - key: Specific key to delete
 *   - prefix: Delete all keys with this prefix
 *   - all: Delete all data for this module/site (requires "true")
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
    const key = searchParams.get("key");
    const prefix = searchParams.get("prefix");
    const deleteAll = searchParams.get("all") === "true";

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    if (!key && !prefix && !deleteAll) {
      return NextResponse.json(
        { error: "Must specify key, prefix, or all=true" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await verifyModuleAccess(supabase, moduleId, siteId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build delete query - use type assertion for Phase 81C table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("module_data")
      .delete()
      .eq("module_id", moduleId)
      .eq("site_id", siteId);

    if (key) {
      query = query.eq("data_key", key);
    } else if (prefix) {
      query = query.like("data_key", `${prefix}%`);
    }
    // If deleteAll, we don't add any key filter

    const { error, count } = await query;

    if (error) {
      console.error("Module DB delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: count || 0,
    });
  } catch (error) {
    console.error("Module DB DELETE error:", error);
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
  // Check if user is admin/owner - use type assertion for agency_users table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: access } = await (supabase as any)
    .from("agency_users")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (!access) return false;

  // Admins and owners have full access
  if (access.role === "admin" || access.role === "owner") {
    return true;
  }

  // Check site access and module installation
  const { data: site } = await supabase
    .from("sites")
    .select("client_id")
    .eq("id", siteId)
    .single();

  if (!site) return false;

  const { data: installation } = await supabase
    .from("site_module_installations")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .eq("is_active", true)
    .single();

  return !!installation;
}
