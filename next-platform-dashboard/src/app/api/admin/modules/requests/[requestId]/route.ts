import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

// =============================================================
// GET /api/admin/modules/requests/[requestId] - Get single request
// =============================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const supabase = await createClient() as AnySupabase;
    
    // Verify super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: moduleRequest, error } = await supabase
      .from("module_requests")
      .select(`
        *,
        agency:agencies(id, name, slug),
        submitter:profiles!submitted_by(id, name, email),
        assigned:profiles!assigned_to(id, name, email),
        resulting_module:modules_v2!resulting_module_id(id, name, slug)
      `)
      .eq("id", requestId)
      .single();

    if (error || !moduleRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Get vote count
    const { count: voteCount } = await supabase
      .from("module_request_votes")
      .select("*", { count: "exact", head: true })
      .eq("request_id", requestId);

    return NextResponse.json({
      request: {
        ...moduleRequest,
        upvotes: voteCount || moduleRequest.upvotes || 0,
      },
    });
  } catch (error) {
    console.error("[API /admin/modules/requests/[id]] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// =============================================================
// PATCH /api/admin/modules/requests/[requestId] - Update request status
// =============================================================

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const supabase = await createClient() as AnySupabase;
    
    // Verify super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      status,
      admin_notes,
      assigned_to,
      resulting_module_id,
    } = body;

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      // Validate status transition
      const validStatuses = ["submitted", "reviewing", "approved", "in_progress", "completed", "rejected"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status;

      // Set completed_at when marking as completed
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    if (assigned_to !== undefined) {
      updateData.assigned_to = assigned_to;
    }

    if (resulting_module_id !== undefined) {
      updateData.resulting_module_id = resulting_module_id;
    }

    const { data: moduleRequest, error } = await supabase
      .from("module_requests")
      .update(updateData)
      .eq("id", requestId)
      .select(`
        *,
        agency:agencies(id, name),
        submitter:profiles!submitted_by(id, name, email)
      `)
      .single();

    if (error) {
      console.error("[API /admin/modules/requests/[id]] Update error:", error);
      return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
    }

    return NextResponse.json({ request: moduleRequest });
  } catch (error) {
    console.error("[API /admin/modules/requests/[id]] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// =============================================================
// DELETE /api/admin/modules/requests/[requestId] - Delete request
// =============================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const supabase = await createClient() as AnySupabase;
    
    // Verify super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("module_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      console.error("[API /admin/modules/requests/[id]] Delete error:", error);
      return NextResponse.json({ error: "Failed to delete request" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /admin/modules/requests/[id]] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
