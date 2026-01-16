import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgencyModulePricing,
  setAgencyModuleMarkup,
} from "@/lib/modules/services/pricing-service";

// =============================================================
// GET /api/modules/v2/agency/[agencyId]/pricing
// =============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const supabase = await createClient();
    const { agencyId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check agency access
    const hasAccess = await checkAgencyAccess(supabase, user.id, agencyId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const pricing = await getAgencyModulePricing(agencyId);
    
    return NextResponse.json({ pricing });
  } catch (error) {
    console.error("[API /agency/pricing] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH /api/modules/v2/agency/[agencyId]/pricing - Set markup
// =============================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const supabase = await createClient();
    const { agencyId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check agency access (admin only)
    const hasAccess = await checkAgencyAdminAccess(supabase, user.id, agencyId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const body = await request.json();
    const {
      moduleId,
      markupType,
      markupPercentage,
      markupFixedAmount,
      customPriceMonthly,
      customPriceYearly,
    } = body;
    
    if (!moduleId || !markupType) {
      return NextResponse.json(
        { error: "moduleId and markupType are required" },
        { status: 400 }
      );
    }
    
    // Validate markup type
    const validTypes = ["percentage", "fixed", "custom", "passthrough"];
    if (!validTypes.includes(markupType)) {
      return NextResponse.json(
        { error: "Invalid markupType" },
        { status: 400 }
      );
    }
    
    const result = await setAgencyModuleMarkup({
      agencyId,
      moduleId,
      markupType,
      markupPercentage,
      markupFixedAmount,
      customPriceMonthly,
      customPriceYearly,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /agency/pricing] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// HELPERS
// =============================================================

async function checkAgencyAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  agencyId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, agency_id")
    .eq("id", userId)
    .single();
  
  if (!profile) return false;
  if (profile.role === "super_admin") return true;
  if (profile.agency_id === agencyId) return true;
  
  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", agencyId)
    .eq("user_id", userId)
    .single();
  
  return !!membership;
}

async function checkAgencyAdminAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  agencyId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, agency_id")
    .eq("id", userId)
    .single();
  
  if (!profile) return false;
  if (profile.role === "super_admin") return true;
  
  // Check if user is agency owner
  const { data: agency } = await supabase
    .from("agencies")
    .select("owner_id")
    .eq("id", agencyId)
    .single();
  
  if (agency?.owner_id === userId) return true;
  
  // Check agency_members for admin role
  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", agencyId)
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .single();
  
  return !!membership;
}
