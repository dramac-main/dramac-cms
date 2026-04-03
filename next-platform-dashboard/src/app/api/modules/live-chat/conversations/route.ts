/**
 * Live Chat Conversations API
 *
 * PHASE LC-04: Public endpoint for widget conversation management
 *
 * POST — Create new conversation + visitor from widget
 * GET  — Fetch conversation details + messages for widget display
 */

import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapRecord,
  mapRecords,
  toDbRecord,
} from "@/modules/live-chat/lib/map-db-record";
import type {
  ChatConversation,
  ChatMessage,
  ChatVisitor,
} from "@/modules/live-chat/types";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/modules/live-chat/conversations
 * Creates a new conversation + visitor from widget
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      siteId,
      visitorData,
      departmentId,
      initialMessage,
      orderContext,
      quoteContext,
    } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createAdminClient();

    // 1. Create or find existing visitor
    let visitorId: string;

    // Check if visitor with this email already exists
    if (visitorData?.email) {
      const { data: existingVisitor } = await (supabase as any)
        .from("mod_chat_visitors")
        .select("id")
        .eq("site_id", siteId)
        .eq("email", visitorData.email)
        .eq("channel", "widget")
        .maybeSingle();

      if (existingVisitor) {
        visitorId = existingVisitor.id;

        // Update tracking data
        const updates: Record<string, unknown> = {
          last_seen_at: new Date().toISOString(),
          total_visits: (supabase as any).rpc ? undefined : 1, // increment handled below
        };
        if (visitorData.name) updates.name = visitorData.name;
        if (visitorData.phone) updates.phone = visitorData.phone;
        if (visitorData.browser) updates.browser = visitorData.browser;
        if (visitorData.os) updates.os = visitorData.os;
        if (visitorData.device) updates.device = visitorData.device;
        if (visitorData.currentPageUrl)
          updates.current_page_url = visitorData.currentPageUrl;
        if (visitorData.currentPageTitle)
          updates.current_page_title = visitorData.currentPageTitle;
        if (visitorData.referrerUrl)
          updates.referrer_url = visitorData.referrerUrl;

        await (supabase as any)
          .from("mod_chat_visitors")
          .update(updates)
          .eq("id", visitorId);
      } else {
        // Create new visitor
        const visitorInsert: Record<string, unknown> = {
          site_id: siteId,
          channel: "widget",
          name: visitorData?.name || null,
          email: visitorData?.email || null,
          phone: visitorData?.phone || null,
          browser: visitorData?.browser || null,
          os: visitorData?.os || null,
          device: visitorData?.device || null,
          current_page_url: visitorData?.currentPageUrl || null,
          current_page_title: visitorData?.currentPageTitle || null,
          referrer_url: visitorData?.referrerUrl || null,
          landing_page_url: visitorData?.landingPageUrl || null,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          total_visits: 1,
          total_conversations: 0,
          total_messages: 0,
          tags: [],
          custom_data: {},
        };

        const { data: newVisitor, error: visitorError } = await (
          supabase as any
        )
          .from("mod_chat_visitors")
          .insert(visitorInsert)
          .select("id")
          .single();

        if (visitorError) throw visitorError;
        visitorId = newVisitor.id;
      }
    } else {
      // Create anonymous visitor
      const visitorInsert: Record<string, unknown> = {
        site_id: siteId,
        channel: "widget",
        name: visitorData?.name || "Visitor",
        browser: visitorData?.browser || null,
        os: visitorData?.os || null,
        device: visitorData?.device || null,
        current_page_url: visitorData?.currentPageUrl || null,
        current_page_title: visitorData?.currentPageTitle || null,
        referrer_url: visitorData?.referrerUrl || null,
        landing_page_url: visitorData?.landingPageUrl || null,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        total_visits: 1,
        total_conversations: 0,
        total_messages: 0,
        tags: [],
        custom_data: {},
      };

      const { data: newVisitor, error: visitorError } = await (supabase as any)
        .from("mod_chat_visitors")
        .insert(visitorInsert)
        .select("id")
        .single();

      if (visitorError) throw visitorError;
      visitorId = newVisitor.id;
    }

    // 2. Per-order conversation isolation
    // Each order gets its own conversation. General support (no order) gets its own too.
    // This prevents multiple orders from mixing in the same chat thread.
    let conversationId = "";
    let isExisting = false;
    let assignedAgentId: string | null = null;

    const orderNumber = orderContext?.orderNumber
      ? String(orderContext.orderNumber).trim()
      : null;
    const quoteNumber = quoteContext?.quoteNumber
      ? String(quoteContext.quoteNumber).trim()
      : null;

    if (orderNumber) {
      // ORDER-SPECIFIC: Find existing conversation for THIS specific order
      const { data: allActiveConvs } = await (supabase as any)
        .from("mod_chat_conversations")
        .select("id, assigned_agent_id, metadata")
        .eq("site_id", siteId)
        .eq("visitor_id", visitorId)
        .in("status", ["active", "pending", "open", "waiting"])
        .order("created_at", { ascending: false });

      const existingOrderConv = (allActiveConvs || []).find(
        (c: { metadata?: Record<string, unknown> }) =>
          c.metadata &&
          typeof c.metadata === "object" &&
          (c.metadata as Record<string, unknown>).order_number === orderNumber,
      );

      if (existingOrderConv) {
        // Reuse the conversation for this specific order
        conversationId = existingOrderConv.id;
        isExisting = true;
        assignedAgentId = existingOrderConv.assigned_agent_id || null;
      }
    } else if (quoteNumber) {
      // QUOTE-SPECIFIC: Find existing conversation for THIS specific quote
      const { data: allActiveConvs } = await (supabase as any)
        .from("mod_chat_conversations")
        .select("id, assigned_agent_id, metadata")
        .eq("site_id", siteId)
        .eq("visitor_id", visitorId)
        .in("status", ["active", "pending", "open", "waiting"])
        .order("created_at", { ascending: false });

      const existingQuoteConv = (allActiveConvs || []).find(
        (c: { metadata?: Record<string, unknown> }) =>
          c.metadata &&
          typeof c.metadata === "object" &&
          (c.metadata as Record<string, unknown>).quote_number === quoteNumber,
      );

      if (existingQuoteConv) {
        conversationId = existingQuoteConv.id;
        isExisting = true;
        assignedAgentId = existingQuoteConv.assigned_agent_id || null;
      }
    } else {
      // GENERAL SUPPORT: Find existing conversation that has NO order_number
      const { data: allActiveConvs } = await (supabase as any)
        .from("mod_chat_conversations")
        .select("id, assigned_agent_id, metadata")
        .eq("site_id", siteId)
        .eq("visitor_id", visitorId)
        .in("status", ["active", "pending", "open", "waiting"])
        .order("created_at", { ascending: false });

      const existingGeneralConv = (allActiveConvs || []).find(
        (c: { metadata?: Record<string, unknown> }) => {
          const meta = c.metadata as Record<string, unknown> | null;
          return (
            !meta ||
            !meta.order_number ||
            (typeof meta.order_number === "string" &&
              meta.order_number.trim() === "")
          );
        },
      );

      if (existingGeneralConv) {
        conversationId = existingGeneralConv.id;
        isExisting = true;
        assignedAgentId = existingGeneralConv.assigned_agent_id || null;
      }
    }

    if (!isExisting) {
      // Create new conversation — one per order, one per quote, or one for general support
      const convInsert: Record<string, unknown> = {
        site_id: siteId,
        visitor_id: visitorId,
        status: "pending",
        channel: "widget",
        priority: "normal",
        message_count: 0,
        unread_agent_count: 0,
        unread_visitor_count: 0,
        tags: orderNumber
          ? ["order", "payment"]
          : quoteNumber
            ? ["quote", "quotation"]
            : ["general"],
        metadata: orderNumber
          ? {
              order_number: orderNumber,
              payment_guidance_active: true,
            }
          : quoteNumber
            ? {
                quote_number: quoteNumber,
                quote_guidance_active: true,
              }
            : {},
        subject: orderNumber
          ? `Order ${orderNumber}`
          : quoteNumber
            ? `Quote ${quoteNumber}`
            : null,
      };

      if (departmentId) convInsert.department_id = departmentId;

      // Auto-assign to available online agent (not 'away' — away agents shouldn't get new chats)
      const { data: availableAgents } = await (supabase as any)
        .from("mod_chat_agents")
        .select("id, current_chat_count, max_concurrent_chats")
        .eq("site_id", siteId)
        .eq("is_active", true)
        .eq("status", "online")
        .order("current_chat_count", { ascending: true });

      // Filter to agents with capacity (can't do column-to-column comparison in Supabase client)
      const availableAgent = (availableAgents || []).find(
        (a: { current_chat_count: number; max_concurrent_chats: number }) =>
          (a.current_chat_count || 0) < (a.max_concurrent_chats || 5),
      );

      if (availableAgent) {
        convInsert.assigned_agent_id = availableAgent.id;
        convInsert.status = "active";
      }

      const { data: convData, error: convError } = await (supabase as any)
        .from("mod_chat_conversations")
        .insert(convInsert)
        .select()
        .single();

      if (convError) throw convError;
      conversationId = convData.id;
      assignedAgentId = convData.assigned_agent_id || null;
    }

    // 3. Send initial message if provided
    // For existing conversations: only send if order/quote context is present
    // For new conversations: always send initial message
    const shouldSendMessage =
      initialMessage &&
      (!isExisting || !!orderContext?.orderNumber || !!quoteNumber);
    if (shouldSendMessage) {
      const msgInsert: Record<string, unknown> = {
        conversation_id: conversationId,
        site_id: siteId,
        sender_type: "visitor",
        sender_id: visitorId,
        sender_name: visitorData?.name || "Visitor",
        content: initialMessage,
        content_type: "text",
        status: "sent",
        is_internal_note: false,
      };

      await (supabase as any).from("mod_chat_messages").insert(msgInsert);

      // Update conversation last message
      await (supabase as any)
        .from("mod_chat_conversations")
        .update({
          last_message_text: initialMessage.substring(0, 255),
          last_message_at: new Date().toISOString(),
          last_message_by: "visitor",
          message_count: 1,
          unread_agent_count: 1,
        })
        .eq("id", conversationId);

      // Update visitor stats
      await (supabase as any)
        .from("mod_chat_visitors")
        .update({
          total_conversations: 1,
          total_messages: 1,
        })
        .eq("id", visitorId);

      // Trigger AI auto-response
      // Payment/order messages ALWAYS trigger AI (co-pilot mode alongside agent)
      // Other messages only trigger AI when no agent is assigned
      const isPaymentMsg =
        (initialMessage &&
          /\border(?:er)?\s*(?:#|num|number)?\s*(?:ORD[-\s]?\d+|\d{3,})/i.test(
            initialMessage,
          )) ||
        /need\s+help\s+with\s+payment/i.test(initialMessage || "") ||
        /just\s+placed\s+(?:an?\s+)?order/i.test(initialMessage || "");

      const isQuoteMsg =
        !!quoteNumber ||
        /\bquot(?:e|ation)\s*(?:#|request|num)/i.test(initialMessage || "") ||
        /just\s+(?:submitted|sent|requested)\s+(?:a\s+)?quot/i.test(
          initialMessage || "",
        );

      if (isPaymentMsg || isQuoteMsg || !assignedAgentId) {
        // Use after() to keep Vercel Lambda alive until AI work completes
        // Without this, the Lambda is killed after returning 201 and the
        // Claude API call (2-5s) never finishes
        const capturedSiteId = siteId;
        const capturedConvId = conversationId;
        const capturedMsg = initialMessage;
        const capturedVisitorId = visitorId;
        const capturedIsPayment = !!isPaymentMsg || !!isQuoteMsg;

        after(async () => {
          try {
            const { handleNewVisitorMessage } =
              await import("@/modules/live-chat/lib/auto-response-handler");
            const result = await handleNewVisitorMessage(
              capturedSiteId,
              capturedConvId,
              capturedMsg,
              capturedVisitorId,
              { forcePaymentGuidance: capturedIsPayment },
            );
            console.log(
              "[LiveChat] AI auto-response result:",
              JSON.stringify(result),
            );
          } catch (err) {
            console.error(
              "[LiveChat] Auto-response error on initial message:",
              err,
            );
          }
        });
      }
    }

    return NextResponse.json(
      { conversationId, visitorId, isExisting },
      { status: isExisting ? 200 : 201, headers: corsHeaders },
    );
  } catch (error) {
    console.error("[LiveChat Conversations API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500, headers: corsHeaders },
    );
  }
}

/**
 * GET /api/modules/live-chat/conversations
 *
 * Mode 1 (single): ?conversationId=xxx&visitorId=xxx
 *   Returns conversation details + messages for widget display
 *
 * Mode 2 (list): ?visitorId=xxx&siteId=xxx&list=true
 *   Returns all conversations for this visitor (for conversation list UI)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const visitorId = searchParams.get("visitorId");
    const siteId = searchParams.get("siteId");
    const isList = searchParams.get("list") === "true";

    if (!visitorId) {
      return NextResponse.json(
        { error: "visitorId is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createAdminClient();

    // --- Mode 2: List all conversations for visitor ---
    if (isList && siteId) {
      const { data: convRows, error: listError } = await (supabase as any)
        .from("mod_chat_conversations")
        .select(
          "id, status, subject, last_message_text, last_message_at, unread_visitor_count, message_count, metadata, created_at, updated_at, assigned_agent_id",
        )
        .eq("site_id", siteId)
        .eq("visitor_id", visitorId)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(50);

      if (listError) {
        console.error("[LiveChat] Conversation list error:", listError);
        return NextResponse.json(
          { error: "Failed to fetch conversations" },
          { status: 500, headers: corsHeaders },
        );
      }

      // Fetch agent names for assigned conversations
      const agentIds = [
        ...new Set(
          (convRows || [])
            .map((c: Record<string, unknown>) => c.assigned_agent_id)
            .filter(Boolean),
        ),
      ];
      let agentMap: Record<string, string> = {};
      if (agentIds.length > 0) {
        const { data: agents } = await (supabase as any)
          .from("mod_chat_agents")
          .select("id, display_name")
          .in("id", agentIds);
        if (agents) {
          agentMap = Object.fromEntries(
            (agents as { id: string; display_name: string }[]).map((a) => [
              a.id,
              a.display_name,
            ]),
          );
        }
      }

      const conversations = (convRows || []).map(
        (c: Record<string, unknown>) => {
          const meta =
            c.metadata && typeof c.metadata === "object"
              ? (c.metadata as Record<string, unknown>)
              : null;
          return {
            id: c.id,
            status: c.status,
            subject: c.subject || null,
            orderNumber: meta?.order_number ? String(meta.order_number) : null,
            lastMessageText: c.last_message_text || null,
            lastMessageAt: c.last_message_at || c.updated_at || c.created_at,
            unreadCount: c.unread_visitor_count || 0,
            messageCount: c.message_count || 0,
            createdAt: c.created_at,
            agentName: c.assigned_agent_id
              ? agentMap[c.assigned_agent_id as string] || null
              : null,
          };
        },
      );

      return NextResponse.json({ conversations }, { headers: corsHeaders });
    }

    // --- Mode 1: Single conversation with messages ---
    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    // Fetch conversation and validate visitorId
    const { data: convData, error: convError } = await (supabase as any)
      .from("mod_chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convError || !convData) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    // Security: validate visitor owns this conversation
    if (convData.visitor_id !== visitorId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403, headers: corsHeaders },
      );
    }

    const conversation = mapRecord<ChatConversation>(convData);

    // Fetch messages
    const { data: msgData, count } = await (supabase as any)
      .from("mod_chat_messages")
      .select("*", { count: "exact" })
      .eq("conversation_id", conversationId)
      .eq("is_internal_note", false) // Don't show internal notes to visitors
      .order("created_at", { ascending: true });

    const messages = mapRecords<ChatMessage>(msgData || []);

    // Mark visitor messages as read
    await (supabase as any)
      .from("mod_chat_conversations")
      .update({ unread_visitor_count: 0 })
      .eq("id", conversationId);

    return NextResponse.json(
      { conversation, messages, total: count || 0 },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("[LiveChat Conversations API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500, headers: corsHeaders },
    );
  }
}
