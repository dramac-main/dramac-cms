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
import { parsePaymentMethods } from "./payment-method-parser";

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
  // Payment method selection — visitor clicked a payment method button
  /\bI(?:'d like| would like| will|'ll)?\s+(?:to\s+)?pay\s+(?:using|with|via|by|through)\b/i,
  /\bpay(?:ing)?\s+(?:using|with|via|by|through)\b/i,
  /\b(?:use|using|choose|choosing|select(?:ing)?|go(?:ing)?\s+with)\s+(?:airtel|mtn|momo|zanaco|mobile\s+money|bank\s+transfer|card)\b/i,
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
      "ai_auto_response_enabled, ai_payment_guidance_enabled, scripted_flows_enabled, scripted_flows_require_approval, ai_responses_require_approval",
    )
    .eq("site_id", siteId)
    .single();

  const aiAutoEnabled = aiSettings?.ai_auto_response_enabled !== false; // default true
  const aiPaymentEnabled = aiSettings?.ai_payment_guidance_enabled !== false; // default true
  const flowsEnabled = aiSettings?.scripted_flows_enabled !== false; // default true
  // When true, scripted-flow messages are staged for agent approval before the customer sees them
  const flowsRequireApproval =
    aiSettings?.scripted_flows_require_approval !== false; // default TRUE (safe-by-default)
  // GLOBAL APPROVAL GATE — every AI-generated message (free-form AI replies AND
  // payment-guidance messages such as the `payment_method_select` button card)
  // must be reviewed by a human agent before reaching the customer, unless the
  // site explicitly opts out by setting `ai_responses_require_approval = false`.
  const aiRequireApproval = aiSettings?.ai_responses_require_approval !== false; // default TRUE

  // ── PRIORITY 0: Payment method selection from a prior payment_method_select ──
  // When the visitor clicked one of the payment method buttons (e.g. "Airtel Money")
  // we immediately resolve their selection with the exact site-configured payment
  // details — no AI call, no scripted flow re-prompt. This runs unconditionally so
  // it works whether or not the Anthropic API key is configured.
  const paymentSelectionHandled = await resolvePaymentMethodSelection(
    supabase,
    siteId,
    conversationId,
    visitorMessage,
    aiRequireApproval,
  );
  if (paymentSelectionHandled) {
    return { handled: true, aiResponded: false, routedToAgent: false };
  }

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
          flowsRequireApproval,
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
        flowsRequireApproval,
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

      // Save AI response — when the global approval gate is active, the
      // message is staged as `pending_approval` (hidden from customer until
      // an agent approves it from the dashboard). Otherwise it is sent
      // straight to the visitor as before.
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
          status: aiRequireApproval ? "pending_approval" : "sent",
          is_ai_generated: true,
          ai_confidence: aiResult.confidence,
          is_internal_note: aiRequireApproval,
          metadata: aiRequireApproval ? { pending_agent_approval: true } : {},
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
          flowsRequireApproval,
        )) ??
        (await tryStartScriptedFlowBySlug(
          supabase,
          siteId,
          conversationId,
          "payment_methods",
          flowsRequireApproval,
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
          flowsRequireApproval,
        )) ??
        // No keyword matched — still give the visitor a deterministic exit
        // (talk-to-human handoff) so the conversation never dies silently.
        (await tryStartScriptedFlowBySlug(
          supabase,
          siteId,
          conversationId,
          "talk_to_human",
          flowsRequireApproval,
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

  // 4. Save AI response as a message — gate behind the global approval setting.
  const { error: stdInsertError } = await supabase
    .from("mod_chat_messages")
    .insert({
      conversation_id: conversationId,
      site_id: siteId,
      sender_type: "ai",
      sender_name: aiResult.assistantName || "Chiko",
      content: aiResult.response,
      content_type: "text",
      status: aiRequireApproval ? "pending_approval" : "sent",
      is_ai_generated: true,
      ai_confidence: aiResult.confidence,
      is_internal_note: aiRequireApproval,
      metadata: aiRequireApproval ? { pending_agent_approval: true } : {},
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
  requireApproval = false,
): Promise<void> {
  // When requireApproval is true, stage the message as an internal note pending
  // agent review — the customer won't see it until an agent approves it.
  const pendingApproval = requireApproval;
  const { error: insertError } = await supabase
    .from("mod_chat_messages")
    .insert({
      conversation_id: conversationId,
      site_id: siteId,
      sender_type: "ai",
      sender_name: "Assistant",
      content: result.response,
      content_type: result.contentType,
      status: pendingApproval ? "pending_approval" : "sent",
      is_ai_generated: false, // scripted, not AI
      ai_confidence: 1,
      is_internal_note: pendingApproval,
      ...(pendingApproval
        ? { metadata: { pending_agent_approval: true } }
        : {}),
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
  requireApproval = false,
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
    requireApproval,
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
  requireApproval = false,
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
    requireApproval,
  );
  void bumpFlowAnalytics(result.flowId, "usage");
  return result;
}

// =============================================================================
// PAYMENT METHOD SELECTION RESOLVER
// =============================================================================

/**
 * When a visitor clicks a payment method button from a `payment_method_select`
 * message, their reply (e.g. "I'd like to pay using Airtel Money") should
 * produce the exact payment instructions for that method — no re-prompting,
 * no hardcoded fallbacks, no AI call required.
 *
 * Returns true if a payment method was matched and a details message was
 * inserted; false otherwise (caller should continue normal routing).
 */
async function resolvePaymentMethodSelection(
  supabase: any,
  siteId: string,
  conversationId: string,
  visitorMessage: string,
  requireApproval: boolean,
): Promise<boolean> {
  // 1. Look for a prior payment_method_select in this conversation
  const { data: priorSelects } = await supabase
    .from("mod_chat_messages")
    .select("content, content_type, status, metadata")
    .eq("conversation_id", conversationId)
    .eq("content_type", "payment_method_select")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!priorSelects?.length) return false;

  // Accept both approved (status = 'sent') and still-pending selects
  const selectMsg =
    priorSelects.find(
      (m: { status: string }) =>
        m.status === "sent" || m.status === "pending_approval",
    ) ?? null;
  if (!selectMsg) return false;

  // 2. Parse the buttons from the prior select message
  let parsed: { text?: string; buttons?: { id: string; label: string }[] } =
    {};
  try {
    parsed = JSON.parse(selectMsg.content as string);
  } catch {
    return false;
  }

  const buttons = parsed.buttons;
  if (!buttons?.length) return false;

  // 3. Check if the visitor message contains a button label (e.g. "Airtel Money")
  const lower = visitorMessage.toLowerCase();
  const matched = buttons.find((btn: { id: string; label: string }) =>
    lower.includes(btn.label.toLowerCase()),
  );
  if (!matched) return false;

  console.log(
    `[AutoResponse] Payment method selection detected: "${matched.label}" for conversation ${conversationId}`,
  );

  // 4. Fetch the site's payment instructions (ecommerce takes priority, then bookings)
  const [{ data: ecomSettings }, { data: bookSettings }] = await Promise.all([
    supabase
      .from("mod_ecommod01_settings")
      .select("manual_payment_instructions")
      .eq("site_id", siteId)
      .maybeSingle(),
    supabase
      .from("mod_bookmod01_settings")
      .select("manual_payment_instructions")
      .eq("site_id", siteId)
      .maybeSingle(),
  ]);

  const instructions: string =
    ecomSettings?.manual_payment_instructions ||
    bookSettings?.manual_payment_instructions ||
    "";

  // 5. Parse the instructions into individual methods and find the match
  let methodDetails: string | null = null;
  if (instructions) {
    const methods = parsePaymentMethods(instructions);
    if (methods) {
      const matchedMethod = methods.find(
        (m) =>
          m.label.toLowerCase().includes(matched.label.toLowerCase()) ||
          matched.label.toLowerCase().includes(m.label.toLowerCase()),
      );
      if (matchedMethod) {
        methodDetails = matchedMethod.details;
      }
    }
    // If parsePaymentMethods couldn't split the instructions, use them in full
    if (!methodDetails) {
      methodDetails = instructions;
    }
  }

  if (!methodDetails) {
    // No payment instructions configured — can't generate a meaningful response
    return false;
  }

  // 6. Build the details message
  const content =
    `Here are the **${matched.label}** payment details:\n\n${methodDetails}\n\n` +
    `Please use your order/booking number as the payment reference when sending.`;

  // 7. Insert the details message (staged for approval if required)
  const { error: insertError } = await supabase
    .from("mod_chat_messages")
    .insert({
      conversation_id: conversationId,
      site_id: siteId,
      sender_type: "ai",
      sender_name: "Chiko",
      content,
      content_type: "text",
      status: requireApproval ? "pending_approval" : "sent",
      is_ai_generated: false,
      ai_confidence: 1.0,
      is_internal_note: requireApproval,
      metadata: requireApproval ? { pending_agent_approval: true } : {},
    });

  if (insertError) {
    console.error(
      "[AutoResponse] Failed to insert payment method details:",
      insertError,
    );
    return false;
  }

  // 8. Record the selected method in conversation metadata
  const { data: convMeta } = await supabase
    .from("mod_chat_conversations")
    .select("metadata")
    .eq("id", conversationId)
    .single();

  await supabase
    .from("mod_chat_conversations")
    .update({
      metadata: {
        ...(convMeta?.metadata || {}),
        selected_payment_method: matched.id,
        payment_guidance_active: true,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  console.log(
    `[AutoResponse] Payment method details sent for "${matched.label}" in conversation ${conversationId}`,
  );
  return true;
}
