/**
 * Chiko AI Business Assistant API
 *
 * Phase BIL-10: Chiko AI Business Assistant
 *
 * POST /api/chiko
 * Body: { question: string, conversationId?: string }
 * Returns: { answer: string, category: string, conversationId: string }
 *
 * Uses Claude Haiku 4.5 for fast, cost-effective responses.
 * All queries scoped by agency_id for multi-tenant safety.
 * Usage tracked via usageTracker.recordUsage('ai_actions').
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildContext,
  classifyQuestion,
} from "@/components/chiko/chiko-query-builder";
import { usageTracker } from "@/lib/paddle/usage-tracker";

export const maxDuration = 60;

// ============================================================================
// System Prompt
// ============================================================================

const CHIKO_SYSTEM_PROMPT = `You are Chiko, the AI business assistant for DRAMAC CMS. You help agency owners understand their business data and make informed decisions.

Guidelines:
- Be friendly, professional, and concise
- Always reference actual data when available
- Format numbers clearly (e.g., "$1,234.56" not "123456 cents")
- Use bullet points for lists
- If data is unavailable, say so honestly
- Never fabricate numbers — only report what the data shows
- Keep responses under 300 words unless the user asks for detail
- Currency is in USD unless the agency specifies otherwise
- When discussing trends, compare to previous periods when data allows
- Suggest actionable insights when appropriate

You have access to the agency's data including:
- Revenue & billing information
- Booking & appointment data
- Client/customer records
- E-commerce orders & products
- Live chat sessions
- Marketing campaigns & forms
- General agency overview

If asked about something outside your data access, politely explain your limitations.`;

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get agency_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (!profile?.agency_id) {
      return NextResponse.json({ error: "No agency found" }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
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

    // Check usage limits
    const usageCheck = await usageTracker.checkUsageLimit(
      profile.agency_id,
      "ai_actions",
    );
    if (!usageCheck.allowed && !usageCheck.isOverage) {
      return NextResponse.json(
        { error: "AI usage limit reached. Please upgrade your plan." },
        { status: 429 },
      );
    }

    // Build context from database
    const { category, context } = await buildContext(
      profile.agency_id,
      question,
    );

    // Call Claude Haiku 4.5
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
          system: CHIKO_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Here is the relevant business data for answering the question:\n\n${context}\n\nQuestion: ${question}`,
            },
          ],
        }),
      },
    );

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("[Chiko] Claude API error:", errorText);
      return NextResponse.json(
        { error: "AI service temporarily unavailable" },
        { status: 502 },
      );
    }

    const claudeData = await claudeResponse.json();
    const answer =
      claudeData.content?.[0]?.text || "I couldn't generate a response.";

    // Record usage
    await usageTracker.recordUsage(profile.agency_id, "", "ai_actions", 1);

    // Save conversation
    const admin = createAdminClient();
    let savedConversationId = conversationId;

    if (conversationId) {
      // Append to existing conversation
      const { data: existing } = await (admin as any)
        .from("chiko_conversations")
        .select("messages")
        .eq("id", conversationId)
        .eq("agency_id", profile.agency_id)
        .single();

      if (existing) {
        const messages = [...(existing.messages || [])];
        messages.push({
          role: "user",
          content: question,
          timestamp: new Date().toISOString(),
        });
        messages.push({
          role: "assistant",
          content: answer,
          category,
          timestamp: new Date().toISOString(),
        });

        await (admin as any)
          .from("chiko_conversations")
          .update({ messages, updated_at: new Date().toISOString() })
          .eq("id", conversationId)
          .eq("agency_id", profile.agency_id)
          .eq("user_id", user.id);
      }
    } else {
      // Create new conversation
      const messages = [
        {
          role: "user",
          content: question,
          timestamp: new Date().toISOString(),
        },
        {
          role: "assistant",
          content: answer,
          category,
          timestamp: new Date().toISOString(),
        },
      ];

      const title =
        question.length > 50 ? question.slice(0, 50) + "..." : question;

      const { data: newConv } = await (admin as any)
        .from("chiko_conversations")
        .insert({
          agency_id: profile.agency_id,
          user_id: user.id,
          messages,
          title,
        })
        .select("id")
        .single();

      if (newConv) {
        savedConversationId = newConv.id;
      }
    }

    return NextResponse.json({
      answer,
      category,
      conversationId: savedConversationId,
    });
  } catch (error) {
    console.error("[Chiko] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
