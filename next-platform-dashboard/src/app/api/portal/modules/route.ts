import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

interface ClientInstallation {
  id: string;
  module_id: string;
  installed_at: string;
  settings: Record<string, unknown>;
  custom_name: string | null;
  custom_icon: string | null;
  module: Record<string, unknown>;
}

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
    // Using raw query to work around type limitations
    const { data: installations, error } = await supabase
      .from("client_module_installations")
      .select(`
        *,
        module:modules_v2(*)
      `)
      .eq("client_id", clientId)
      .eq("is_active", true)
      .order("installed_at", { ascending: false }) as unknown as { 
        data: ClientInstallation[] | null; 
        error: Error | null 
      };

    if (error) {
      console.error("Fetch modules error:", error);
      return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
    }

    // Transform the data
    const modules = (installations || []).map(i => ({
      id: i.id,
      module_id: i.module_id,
      installed_at: i.installed_at,
      settings: i.settings,
      custom_name: i.custom_name,
      custom_icon: i.custom_icon,
      module: i.module,
    }));

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Fetch modules error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
