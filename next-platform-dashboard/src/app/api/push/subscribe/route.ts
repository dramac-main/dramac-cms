import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */
// push_subscriptions table is not yet in generated Supabase types — will be after migration
const PUSH_TABLE = "push_subscriptions" as any;

/**
 * POST /api/push/subscribe — Save a push subscription
 * Body: { subscription: PushSubscription, context: 'agent' | 'customer', siteId?: string, conversationId?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, context, siteId, conversationId } = body;

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // Agent context: use auth client (requires login)
    // Customer context: use admin client (public widget, no auth session)
    let userId: string | null = null;
    let supabase;

    if (context === "agent") {
      supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
    } else {
      // Customer context - no auth session, use admin client
      supabase = createAdminClient();
    }

    // Upsert the subscription (keyed on endpoint)
    const { error } = await supabase
      .from(PUSH_TABLE)
      .upsert(
        {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh || "",
          auth: subscription.keys?.auth || "",
          user_id: userId,
          context: context || "agent",
          site_id: siteId || null,
          conversation_id: conversationId || null,
          user_agent: req.headers.get("user-agent") || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("Push subscribe error:", error);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/push/subscribe — Remove a push subscription
 * Body: { endpoint: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    const supabase = createAdminClient();
    await supabase
      .from(PUSH_TABLE)
      .delete()
      .eq("endpoint", endpoint);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push unsubscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
