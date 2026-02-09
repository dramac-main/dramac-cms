/**
 * Email Preferences API
 * 
 * Phase WL-02: Public API for managing email notification preferences.
 * Used by the /unsubscribe page and email footer links.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/email-preferences?uid=<user_id>
 * Fetch current email preferences for a user.
 */
export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid");
  
  if (!uid) {
    return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("email_marketing, email_security, email_updates, email_team, email_billing")
      .eq("user_id", uid)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
    }

    // Return defaults if no preferences exist
    const preferences = data || {
      email_marketing: true,
      email_security: true,
      email_updates: true,
      email_team: true,
      email_billing: true,
    };

    return NextResponse.json({ preferences });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/email-preferences
 * Update email preferences for a user.
 * Body: { uid: string, preferences: { email_marketing, email_security, ... } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, preferences } = body;

    if (!uid || !preferences) {
      return NextResponse.json({ error: "Missing uid or preferences" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify user exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", uid)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Invalid user" }, { status: 404 });
    }

    // Upsert preferences
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: uid,
        email_marketing: preferences.email_marketing ?? true,
        email_security: true, // Always true — cannot opt out of security emails
        email_updates: preferences.email_updates ?? true,
        email_team: preferences.email_team ?? true,
        email_billing: preferences.email_billing ?? true,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("[EmailPrefs] Error updating:", error);
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
