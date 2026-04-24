/**
 * Portal Chiko AI Business Assistant API
 *
 * POST /api/portal/chiko
 * Body: { question: string, conversationId?: string }
 * Returns: { answer: string, category: string, conversationId: string }
 *
 * Hard tenancy: scoped to the authenticated portal client's sites only.
 * Uses Claude Haiku 4.5 for fast, cost-effective responses.
 * Usage tracked against the agency's `ai_actions` quota.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalUser } from "@/lib/portal/portal-auth";
import { resolveClientSites } from "@/lib/portal/permission-resolver";
import { buildPortalContext } from "@/components/chiko/portal-chiko-query-builder";
import { usageTracker } from "@/lib/paddle/usage-tracker";

export const maxDuration = 60;

const CHIKO_PORTAL_SYSTEM_PROMPT = `You are Chiko, an AI business insights assistant for a small-business owner.

Guidelines:
- Be friendly, professional, and concise.
- Answer based ONLY on the data provided in the user's message. Do not invent numbers.
- Format money as "$1,234.56" (amounts supplied to you are already in dollars unless labeled otherwise).
- Use bullet points for lists; keep responses under 300 words unless the user asks for detail.
- If the data is empty or unavailable for a question, say so clearly and suggest what the user could do next (e.g., "start accepting bookings", "send invoices").
- Never mention other clients, other businesses, or the underlying platform ("DRAMAC", "agency", etc.).
- When helpful, offer one short, actionable insight at the end.

You have access to this business's: revenue, invoices, orders, products, bookings, customers/contacts, live chat, marketing campaigns, and form submissions.`;

export async function POST(request: NextRequest) {
  try {
    // Portal auth
    const portalUser = await getPortalUser();
    if (!portalUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body
    const body = await request.json().catch(() => ({}));
    const question = body?.question;
    const conversationId = body?.conversationId;

    if (
      !question ||
      typeof question !== "string" ||
      question.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 },
      );
    }
    if (question.length > 1000) {
      return NextResponse.json(
        { error: "Question too long (max 1000 characters)" },
        { status: 400 },
      );
    }

    // Agency-level AI quota
    const usageCheck = await usageTracker.checkUsageLimit(
      portalUser.agencyId,
      "ai_actions",
    );
    if (!usageCheck.allowed && !usageCheck.isOverage) {
      return NextResponse.json(
        {
          error:
            "AI usage limit reached for your account. Please contact your account manager.",
        },
        { status: 429 },
      );
    }

    // Resolve tenant-scoped sites for this portal client
    const sites = await resolveClientSites(portalUser.clientId);
    const siteIds = sites.map((s) => s.id);

    // Build context scoped to client's sites only
    const { category, context } = await buildPortalContext(
      {
        clientId: portalUser.clientId,
        agencyId: portalUser.agencyId,
        siteIds,
        clientName: portalUser.fullName,
        companyName: portalUser.companyName,
      },
      question,
    );

    // Call Claude Haiku
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 },
      );
    }

    const claudeResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: CHIKO_PORTAL_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Business data for "${portalUser.companyName || portalUser.fullName}":\n\n${context}\n\nQuestion: ${question}`,
            },
          ],
        }),
      },
    );

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("[Portal Chiko] Claude API error:", errorText);
      return NextResponse.json(
        { error: "AI service temporarily unavailable" },
        { status: 502 },
      );
    }

    const claudeData = await claudeResponse.json();
    const answer =
      claudeData.content?.[0]?.text || "I couldn't generate a response.";

    // Track usage against the agency's AI quota (portal AI share)
    const firstSiteId = siteIds[0] ?? "";
    await usageTracker.recordUsage(
      portalUser.agencyId,
      firstSiteId,
      "ai_actions",
      1,
    );

    // Persist conversation
    const admin = createAdminClient();
    let savedConversationId = conversationId as string | undefined;
    const nowIso = new Date().toISOString();

    if (conversationId) {
      const { data: existing } = await (admin as any)
        .from("chiko_conversations")
        .select("messages")
        .eq("id", conversationId)
        .eq("client_id", portalUser.clientId)
        .eq("user_id", portalUser.userId)
        .eq("scope", "portal")
        .maybeSingle();

      if (existing) {
        const messages = [...(existing.messages || [])];
        messages.push({
          role: "user",
          content: question,
          timestamp: nowIso,
        });
        messages.push({
          role: "assistant",
          content: answer,
          category,
          timestamp: nowIso,
        });

        await (admin as any)
          .from("chiko_conversations")
          .update({ messages, updated_at: nowIso })
          .eq("id", conversationId)
          .eq("client_id", portalUser.clientId)
          .eq("user_id", portalUser.userId);
      }
    } else {
      const messages = [
        { role: "user", content: question, timestamp: nowIso },
        { role: "assistant", content: answer, category, timestamp: nowIso },
      ];
      const title =
        question.length > 60 ? question.slice(0, 60) + "..." : question;

      const { data: newConv } = await (admin as any)
        .from("chiko_conversations")
        .insert({
          agency_id: portalUser.agencyId,
          client_id: portalUser.clientId,
          user_id: portalUser.userId,
          messages,
          title,
          scope: "portal",
        })
        .select("id")
        .single();

      if (newConv) savedConversationId = newConv.id;
    }

    return NextResponse.json({
      answer,
      category,
      conversationId: savedConversationId,
    });
  } catch (error) {
    console.error("[Portal Chiko] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
