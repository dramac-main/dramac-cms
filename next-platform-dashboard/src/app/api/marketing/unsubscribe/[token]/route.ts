/**
 * Unsubscribe API Route
 *
 * Phase MKT-02: Email Campaign Engine
 *
 * Handles email unsubscribe requests via signed tokens.
 * GET  → Renders JSON response with unsubscribe info
 * POST → Processes the unsubscribe action
 *
 * Route: /api/marketing/unsubscribe/[token]
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeUnsubscribeToken } from "@/modules/marketing/services/tracking-utils";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const { campaignId, subscriberId } = decodeUnsubscribeToken(token);

    const supabase = createAdminClient() as any;

    const { data: subscriber } = await supabase
      .from(MKT_TABLES.subscribers)
      .select("email, first_name, status")
      .eq("id", subscriberId)
      .single();

    if (!subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 },
      );
    }

    const { data: campaign } = await supabase
      .from(MKT_TABLES.campaigns)
      .select("name")
      .eq("id", campaignId)
      .single();

    return NextResponse.json({
      email: subscriber.email,
      firstName: subscriber.first_name,
      campaignName: campaign?.name || "Unknown",
      alreadyUnsubscribed: subscriber.status === "unsubscribed",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or expired unsubscribe link" },
      { status: 400 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const { campaignId, subscriberId, sendId } = decodeUnsubscribeToken(token);

    let body: { reason?: string } = {};
    try {
      body = await request.json();
    } catch {
      // No body is fine
    }

    const supabase = createAdminClient() as any;

    // Update subscriber status
    const { data: subscriber, error: subError } = await supabase
      .from(MKT_TABLES.subscribers)
      .update({
        status: "unsubscribed",
        email_opt_in: false,
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_reason: body.reason || null,
      })
      .eq("id", subscriberId)
      .select("email, site_id")
      .single();

    if (subError) {
      return NextResponse.json(
        { error: "Failed to unsubscribe" },
        { status: 500 },
      );
    }

    // Update the specific send record
    await supabase
      .from(MKT_TABLES.campaignSends)
      .update({
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", sendId);

    // Increment campaign unsubscribe count
    const { data: campaign } = await supabase
      .from(MKT_TABLES.campaigns)
      .select("total_unsubscribed, site_id")
      .eq("id", campaignId)
      .single();

    if (campaign) {
      await supabase
        .from(MKT_TABLES.campaigns)
        .update({ total_unsubscribed: (campaign.total_unsubscribed || 0) + 1 })
        .eq("id", campaignId);
    }

    // Also update CRM contact if linked
    if (subscriber) {
      const { data: sub } = await supabase
        .from(MKT_TABLES.subscribers)
        .select("crm_contact_id")
        .eq("id", subscriberId)
        .single();

      if (sub?.crm_contact_id) {
        await supabase
          .from("mod_crmmod01_contacts")
          .update({ email_opt_in: false })
          .eq("id", sub.crm_contact_id);
      }
    }

    // Fire automation event
    const siteId = campaign?.site_id || subscriber?.site_id;
    if (siteId) {
      try {
        await logAutomationEvent(
          siteId,
          "marketing.contact.unsubscribed",
          {
            subscriber_id: subscriberId,
            campaign_id: campaignId,
            email: subscriber?.email,
            reason: body.reason,
          },
          {
            sourceModule: "marketing",
            sourceEntityType: "subscriber",
            sourceEntityId: subscriberId,
          },
        );
      } catch (e) {
        console.error("[Marketing] Unsubscribe automation event error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or expired unsubscribe link" },
      { status: 400 },
    );
  }
}
