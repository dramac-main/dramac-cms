/**
 * Auto-Response Handler
 *
 * PHASE LC-06: Orchestrates the AI auto-response flow when a new
 * visitor message arrives and no agent is available.
 *
 * PHASE LC-11: Payment Guidance Mode — AI always responds for
 * payment/order-related conversations, even when agents are online.
 * Works alongside the human agent as a "co-pilot".
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateAutoResponse,
  shouldAutoRespond,
  analyzeSentiment,
} from "./ai-responder";
import { routeConversation } from "./routing-engine";
import {
  runScriptedFlow,
  startFlowBySlug,
  bumpFlowAnalytics,
  type ScriptedFlowState,
  type ScriptedFlowResult,
} from "./scripted-flows";

// =============================================================================
// PAYMENT / ORDER MESSAGE DETECTION
// =============================================================================

const PAYMENT_ORDER_PATTERNS = [
  /\border(?:er)?\s*(?:#|num|number)?\s*(?:ORD[-\s]?\d+|\d{3,})/i,
  /\bjust\s+placed\s+(?:an?\s+)?order\b/i,
  /\bneed\s+help\s+with\s+payment\b/i,
  /\bhow\s+(?:do|can|should)\s+I\s+pay\b/i,
  /\bpayment\s+(?:instructions?|details?|method|reference)\b/i,
  /\bbank\s+(?:transfer|deposit|details?|account)\b/i,
  /\bmobile\s+money\b/i,
  /\bproof\s+of\s+payment\b/i,
  /\bmanual\s+payment\b/i,
  /\bcomplete\s+(?:my\s+)?payment\b/i,
  /\bupload(?:ed)?\s+(?:my\s+)?(?:payment\s+)?proof\b/i,
  /\bquot(?:e|ation)\s*(?:#|num|number)?\s*(?:QUO[-\s]?\d+|\d{3,})/i,
  /\bmy\s+quot(?:e|ation)\b/i,
  /\baccept(?:ed)?\s+(?:the\s+)?quot(?:e|ation)\b/i,
  /\bquot(?:e|ation)\s+(?:status|update|converted)\b/i,
];

/** Returns true if the message is about orders/payment and should trigger AI payment guidance */
export function isPaymentRelatedMessage(message: string): boolean {
  return PAYMENT_ORDER_PATTERNS.some((pattern) => pattern.test(message));
}

// =============================================================================
// HANDLE NEW VISITOR MESSAGE
// =============================================================================

export interface HandleMessageOptions {
  /** Force AI payment guidance — bypasses agent routing & shouldAutoRespond checks */
  forcePaymentGuidance?: boolean;
}

export async function handleNewVisitorMessage(
  siteId: string,
  conversationId: string,
  visitorMessage: string,
  visitorId: string,
  options?: HandleMessageOptions,
): Promise<{
  handled: boolean;
  aiResponded: boolean;
  routedToAgent: boolean;
  agentId?: string;
}> {
  const supabase = createAdminClient() as any;

  // Detect payment guidance mode: forced by caller OR detected from message content
  const paymentGuidance =
    options?.forcePaymentGuidance || isPaymentRelatedMessage(visitorMessage);

  // ── Check site AI settings ────────────────────────────────────────────────
  const { data: aiSettings } = await supabase
    .from("mod_chat_widget_settings")
    .select(
      "ai_auto_response_enabled, ai_payment_guidance_enabled, scripted_flows_enabled",
    )
    .eq("site_id", siteId)
    .single();

  const aiAutoEnabled = aiSettings?.ai_auto_response_enabled !== false; // default true
  const aiPaymentEnabled = aiSettings?.ai_payment_guidance_enabled !== false; // default true
  const flowsEnabled = aiSettings?.scripted_flows_enabled !== false; // default true

  // ── PRIORITY 1: Continue an in-flight scripted flow ───────────────────────
  // Once a scripted flow is mid-step, we MUST finish it deterministically.
  // Never silently switch back to AI mid-tree.
  if (flowsEnabled) {
    const { data: convForFlow } = await supabase
      .from("mod_chat_conversations")
      .select("metadata")
      .eq("id", conversationId)
      .single();

    const activeFlowState: ScriptedFlowState | null =
      convForFlow?.metadata?.scripted_flow ?? null;

    if (activeFlowState) {
      const next = await runScriptedFlow(
        siteId,
        visitorMessage,
        activeFlowState,
      );
      if (next) {
        await persistScriptedStep(
          supabase,
          siteId,
          conversationId,
          next,
          convForFlow?.metadata,
        );
        return {
          handled: true,
          aiResponded: false,
          routedToAgent: next.shouldHandoff,
        };
      }
      // Flow ran out of steps — clear state, fall through.
      await supabase
        .from("mod_chat_conversations")
        .update({
          metadata: { ...(convForFlow?.metadata || {}), scripted_flow: null },
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    }
  }

  // If site owner disabled ALL AI, exit early
  if (!aiAutoEnabled && !paymentGuidance) {
    // Last-chance: try to start a scripted flow before giving up
    if (flowsEnabled) {
      const started = await tryStartScriptedFlow(
        supabase,
        siteId,
        conversationId,
        visitorMessage,
      );
      if (started) {
        return {
          handled: true,
          aiResponded: false,
          routedToAgent: started.shouldHandoff,
        };
      }
    }
    return { handled: false, aiResponded: false, routedToAgent: false };
  }

  // If payment guidance specifically disabled by site owner
  if (paymentGuidance && !aiPaymentEnabled) {
    console.log(
      "[AutoResponse] Payment guidance disabled by site owner for site:",
      siteId,
    );
    // Fall through to standard path below
  } else if (paymentGuidance && aiPaymentEnabled) {
    console.log(
      "[AutoResponse] Payment guidance mode — forcing AI response for conversation:",
      conversationId,
    );

    const aiResult = await generateAutoResponse(
      conversationId,
      visitorMessage,
      siteId,
    );

    if (aiResult) {
      console.log(
        "[AutoResponse] AI generated response, confidence:",
        aiResult.confidence,
        "length:",
        aiResult.response.length,
      );

      // Save AI response — use actual DB columns (no metadata column on this table)
      // PHASE LC-12: content_type may be 'payment_method_select' for button messages
      const { error: insertError } = await supabase
        .from("mod_chat_messages")
        .insert({
          conversation_id: conversationId,
          site_id: siteId,
          sender_type: "ai",
          sender_name: aiResult.assistantName || "Chiko",
          content: aiResult.response,
          content_type: aiResult.contentType || "text",
          status: "sent",
          is_ai_generated: true,
          ai_confidence: aiResult.confidence,
          is_internal_note: false,
        });

      if (insertError) {
        console.error(
          "[AutoResponse] FAILED to insert AI message:",
          insertError,
        );
      } else {
        console.log("[AutoResponse] AI message saved to DB successfully");
      }

      // Analyze sentiment
      const sentiment = analyzeSentiment(visitorMessage);

      // Update conversation metadata — mark as payment-guidance active
      const { data: existingConv } = await supabase
        .from("mod_chat_conversations")
        .select("metadata")
        .eq("id", conversationId)
        .single();

      await supabase
        .from("mod_chat_conversations")
        .update({
          metadata: {
            ...(existingConv?.metadata || {}),
            ai_responded: true,
            ai_confidence: aiResult.confidence,
            last_sentiment: sentiment.sentiment,
            payment_guidance_active: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      return {
        handled: true,
        aiResponded: true,
        routedToAgent: false,
      };
    }

    // AI failed (credits exhausted, rate-limit, no API key, etc.) — try the
    // deterministic payment_methods scripted flow first so the visitor still
    // gets immediate, accurate payment guidance with the actual configured
    // bank/mobile-money/etc. options. Only if that flow is unavailable do we
    // fall through to standard routing.
    if (flowsEnabled) {
      const backup =
        (await tryStartScriptedFlow(
          supabase,
          siteId,
          conversationId,
          visitorMessage,
        )) ??
        (await tryStartScriptedFlowBySlug(
          supabase,
          siteId,
          conversationId,
          "payment_methods",
        ));
      if (backup) {
        console.warn(
          "[AutoResponse] Payment-guidance AI unavailable — served scripted flow:",
          backup.flowId,
        );
        return {
          handled: true,
          aiResponded: false,
          routedToAgent: backup.shouldHandoff,
        };
      }
    }
    console.warn(
      "[AutoResponse] Payment guidance AI failed — falling back to normal routing",
    );
  }

  // ── Standard Path ─────────────────────────────────────────────────────────
  // 1. Try to route to an available agent first
  const routingResult = await routeConversation(
    siteId,
    conversationId,
    visitorMessage,
  );

  if (routingResult.agentId) {
    return {
      handled: true,
      aiResponded: false,
      routedToAgent: true,
      agentId: routingResult.agentId,
    };
  }

  // 2. No agent available — check if AI auto-response is enabled by site owner
  if (!aiAutoEnabled) {
    return { handled: false, aiResponded: false, routedToAgent: false };
  }

  // 3. Check if we should auto-respond (API key set, no agent assigned, etc.)
  const canAutoRespond = await shouldAutoRespond(siteId, conversationId);

  if (!canAutoRespond) {
    return {
      handled: false,
      aiResponded: false,
      routedToAgent: false,
    };
  }

  // 3. Generate AI response
  const aiResult = await generateAutoResponse(
    conversationId,
    visitorMessage,
    siteId,
  );

  if (!aiResult) {
    // AI returned no usable response — fall back to scripted flows.
    if (flowsEnabled) {
      const started =
        (await tryStartScriptedFlow(
          supabase,
          siteId,
          conversationId,
          visitorMessage,
        )) ??
        // No keyword matched — still give the visitor a deterministic exit
        // (talk-to-human handoff) so the conversation never dies silently.
        (await tryStartScriptedFlowBySlug(
          supabase,
          siteId,
          conversationId,
          "talk_to_human",
        ));
      if (started) {
        return {
          handled: true,
          aiResponded: false,
          routedToAgent: started.shouldHandoff,
        };
      }
    }
    return { handled: false, aiResponded: false, routedToAgent: false };
  }

  // 4. Save AI response as a message — use actual DB columns
  const { error: stdInsertError } = await supabase
    .from("mod_chat_messages")
    .insert({
      conversation_id: conversationId,
      site_id: siteId,
      sender_type: "ai",
      sender_name: aiResult.assistantName || "Chiko",
      content: aiResult.response,
      content_type: "text",
      status: "sent",
      is_ai_generated: true,
      ai_confidence: aiResult.confidence,
      is_internal_note: false,
    });

  if (stdInsertError) {
    console.error(
      "[AutoResponse] FAILED to insert AI message (standard path):",
      stdInsertError,
    );
  } else {
    console.log("[AutoResponse] AI message saved to DB (standard path)");
  }

  // 5. Analyze sentiment
  const sentiment = analyzeSentiment(visitorMessage);

  // 6. Update conversation metadata
  await supabase
    .from("mod_chat_conversations")
    .update({
      metadata: {
        ai_responded: true,
        ai_confidence: aiResult.confidence,
        last_sentiment: sentiment.sentiment,
        queue_position: routingResult.queuePosition,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  // 7. If AI confidence is low or handoff requested, queue for agent
  if (aiResult.shouldHandoff) {
    await supabase
      .from("mod_chat_conversations")
      .update({ status: "waiting" })
      .eq("id", conversationId);
  }

  return {
    handled: true,
    aiResponded: true,
    routedToAgent: false,
  };
}

// =============================================================================
// SCRIPTED FLOW HELPERS
// =============================================================================

/**
 * Insert the scripted-flow step's payload as a chat message AND persist the
 * updated flow state on the conversation. Bumps analytics counters.
 */
async function persistScriptedStep(
  supabase: any,
  siteId: string,
  conversationId: string,
  result: ScriptedFlowResult,
  existingMetadata: Record<string, unknown> | null | undefined,
): Promise<void> {
  // Insert the message bubble
  const { error: insertError } = await supabase
    .from("mod_chat_messages")
    .insert({
      conversation_id: conversationId,
      site_id: siteId,
      sender_type: "ai",
      sender_name: "Assistant",
      content: result.response,
      content_type: result.contentType,
      status: "sent",
      is_ai_generated: false, // scripted, not AI
      ai_confidence: 1,
      is_internal_note: false,
    });

  if (insertError) {
    console.error("[ScriptedFlow] Failed to insert step message:", insertError);
    return;
  }

  // Persist updated flow state
  await supabase
    .from("mod_chat_conversations")
    .update({
      metadata: {
        ...(existingMetadata || {}),
        scripted_flow: result.state,
      },
      ...(result.shouldHandoff ? { status: "waiting" } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  // Analytics
  if (!result.state) {
    void bumpFlowAnalytics(
      result.flowId,
      result.shouldHandoff ? "handoff" : "completion",
    );
  }
}

/**
 * Attempt to start a brand new scripted flow based on the visitor's message.
 * Returns the result if a flow matched and a step was persisted; otherwise null.
 */
async function tryStartScriptedFlow(
  supabase: any,
  siteId: string,
  conversationId: string,
  visitorMessage: string,
): Promise<ScriptedFlowResult | null> {
  const result = await runScriptedFlow(siteId, visitorMessage, null);
  if (!result) return null;

  const { data: conv } = await supabase
    .from("mod_chat_conversations")
    .select("metadata")
    .eq("id", conversationId)
    .single();

  await persistScriptedStep(
    supabase,
    siteId,
    conversationId,
    result,
    conv?.metadata,
  );
  void bumpFlowAnalytics(result.flowId, "usage");
  return result;
}

/**
 * Force-start a scripted flow by slug (e.g. payment_methods) regardless of
 * whether the visitor's message matched any keywords. Used as the deterministic
 * backup when AI generation fails.
 */
async function tryStartScriptedFlowBySlug(
  supabase: any,
  siteId: string,
  conversationId: string,
  slug: string,
): Promise<ScriptedFlowResult | null> {
  const result = await startFlowBySlug(siteId, slug);
  if (!result) return null;

  const { data: conv } = await supabase
    .from("mod_chat_conversations")
    .select("metadata")
    .eq("id", conversationId)
    .single();

  await persistScriptedStep(
    supabase,
    siteId,
    conversationId,
    result,
    conv?.metadata,
  );
  void bumpFlowAnalytics(result.flowId, "usage");
  return result;
}
