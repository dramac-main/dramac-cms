import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check for impersonation cookie (for portal access)
    const cookieStore = await cookies();
    const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;
    
    let clientId: string | undefined;
    
    if (impersonatingClientId) {
      // Impersonation mode
      clientId = impersonatingClientId;
    } else {
      // Direct user mode - get from user metadata or profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Try to get client_id from user metadata
      clientId = user.user_metadata?.client_id;
    }

    if (!clientId) {
      return NextResponse.json({ error: "No client found" }, { status: 400 });
    }

    // Get installed modules from client_module_installations
    // Using separate queries to avoid FK relationship issues
    // Note: custom_name/custom_icon don't exist in schema - use settings JSONB if needed
    const { data: rawInstallations, error: installError } = await supabase
      .from("client_module_installations")
      .select("id, module_id, installed_at, settings")
      .eq("client_id", clientId)
      .eq("is_enabled", true)
      .order("installed_at", { ascending: false });

    if (installError) {
      console.error("Fetch installations error:", installError);
      return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
    }

    // Fetch modules separately if there are installations
    let modules: Array<{
      id: string;
      module_id: string;
      installed_at: string | null;
      settings: Record<string, unknown>;
      module: Record<string, unknown> | null;
    }> = [];

    if (rawInstallations?.length) {
      const moduleIds = rawInstallations.map((i) => i.module_id);
      const { data: moduleData, error: modulesError } = await supabase
        .from("modules_v2")
        .select("*")
        .in("id", moduleIds)
        .eq("is_active", true);

      if (modulesError) {
        console.error("Fetch modules error:", modulesError);
      }

      const moduleMap = new Map((moduleData || []).map((m) => [m.id, m]));

      modules = rawInstallations.map((i) => ({
        id: i.id,
        module_id: i.module_id,
        installed_at: i.installed_at,
        settings: (i.settings || {}) as Record<string, unknown>,
        module: moduleMap.get(i.module_id) || null,
      }));
    }

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Fetch modules error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
