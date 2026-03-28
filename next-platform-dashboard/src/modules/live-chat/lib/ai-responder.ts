/**
 * AI Auto-Responder Service
 *
 * PHASE LC-06: Claude-powered AI responses using knowledge base context.
 * Server-side only.
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCustomerContext,
  formatCustomerContext,
} from "./customer-context-bridge";
import { parsePaymentMethods } from "./payment-method-parser";

// =============================================================================
// CONFIG
// =============================================================================

const AI_ENABLED = !!process.env.ANTHROPIC_API_KEY;

if (!AI_ENABLED) {
  console.warn(
    "[AI Responder] ANTHROPIC_API_KEY is not set — AI auto-responses are DISABLED. " +
      "Set this environment variable on your hosting platform (e.g. Vercel) to enable AI features.",
  );
}
const MAX_CONTEXT_MESSAGES = 10;
const HANDOFF_KEYWORDS = [
  "human",
  "agent",
  "person",
  "speak to someone",
  "real person",
  "talk to agent",
  "live agent",
  "support agent",
  "customer service",
  "representative",
  "operator",
];
const CONFIDENCE_THRESHOLD = 0.7;

function getModel() {
  return anthropic("claude-sonnet-4-6");
}

// =============================================================================
// AUTO-RESPONSE
// =============================================================================

export async function generateAutoResponse(
  conversationId: string,
  visitorMessage: string,
  siteId: string,
): Promise<{
  response: string;
  confidence: number;
  shouldHandoff: boolean;
  matchedArticleId?: string;
  assistantName?: string;
  contentType?: string;
} | null> {
  if (!AI_ENABLED) return null;

  try {
    const supabase = createAdminClient() as any;

    // Check for handoff keywords
    const lowerMsg = visitorMessage.toLowerCase();
    if (HANDOFF_KEYWORDS.some((kw) => lowerMsg.includes(kw))) {
      return {
        response:
          "I understand you'd like to speak with a human agent. Let me connect you right away. An agent will be with you shortly!",
        confidence: 1.0,
        shouldHandoff: true,
      };
    }

    // Load context
    const [settingsRes, kbRes, messagesRes, visitorRes, convMetaRes] =
      await Promise.all([
        supabase
          .from("mod_chat_widget_settings")
          .select(
            "company_name, welcome_message, ai_response_tone, ai_custom_instructions, ai_assistant_name, ai_payment_greeting",
          )
          .eq("site_id", siteId)
          .single(),
        supabase
          .from("mod_chat_knowledge_base")
          .select("id, title, content, category, tags")
          .eq("site_id", siteId)
          .eq("is_active", true)
          .limit(20),
        supabase
          .from("mod_chat_messages")
          .select("sender_type, sender_name, content, content_type")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(MAX_CONTEXT_MESSAGES),
        supabase
          .from("mod_chat_conversations")
          .select("mod_chat_visitors(name, email, total_conversations)")
          .eq("id", conversationId)
          .single(),
        supabase
          .from("mod_chat_conversations")
          .select("metadata")
          .eq("id", conversationId)
          .single(),
      ]);

    const companyName = settingsRes.data?.company_name || "our company";
    const aiTone = settingsRes.data?.ai_response_tone || "friendly";
    const customInstructions = settingsRes.data?.ai_custom_instructions || "";
    const aiAssistantName =
      settingsRes.data?.ai_assistant_name || "AI Assistant";
    const paymentGreeting = settingsRes.data?.ai_payment_greeting || "";
    const kbArticles = kbRes.data || [];
    const previousMessages = (messagesRes.data || []).reverse();
    const visitorInfo = visitorRes.data?.mod_chat_visitors;

    // Fetch cross-module customer context (orders, bookings, CRM)
    const customerCtx = await getCustomerContext(
      siteId,
      visitorInfo?.email,
    ).catch(() => null);

    // ── Determine which specific order this conversation is about ──────────
    // Priority 1: conversation metadata.order_number (set by widget/API)
    // Priority 2: parse ORD-XXXX from visitor's latest message
    // Priority 3: first pending manual order (legacy fallback)
    const convMeta = (convMetaRes.data?.metadata || {}) as Record<
      string,
      unknown
    >;
    let targetOrderNumber: string | null =
      (convMeta.order_number as string) || null;

    if (!targetOrderNumber) {
      // Parse from the most recent visitor message containing an order number
      const visitorMessages = previousMessages.filter(
        (m: Record<string, unknown>) => m.sender_type === "visitor",
      );
      for (const msg of visitorMessages.reverse()) {
        const match = String(msg.content).match(/\bORD[-\s]?(\d+)\b/i);
        if (match) {
          targetOrderNumber = `ORD-${match[1]}`;
          break;
        }
      }
    }

    // Check if customer has a pending manual payment order — triggers payment guidance mode
    // Only trigger for manual/bank_transfer payments, not Paddle/Flutterwave pending orders
    let pendingManualOrder = customerCtx?.recentOrders?.find((o) =>
      targetOrderNumber
        ? o.orderNumber === targetOrderNumber // Match specific order from conversation
        : o.paymentStatus === "pending" &&
          o.status !== "cancelled" &&
          (!o.paymentProvider ||
            o.paymentProvider === "manual" ||
            o.paymentProvider === "bank_transfer"),
    );

    // If specific order was targeted but not found as pending manual, check if it exists at all
    if (!pendingManualOrder && targetOrderNumber) {
      pendingManualOrder = customerCtx?.recentOrders?.find(
        (o) => o.orderNumber === targetOrderNumber,
      );
    }

    // Final fallback: first pending manual order (most recent, since array is sorted DESC)
    if (!pendingManualOrder) {
      pendingManualOrder = customerCtx?.recentOrders?.find(
        (o) =>
          o.paymentStatus === "pending" &&
          o.status !== "cancelled" &&
          (!o.paymentProvider ||
            o.paymentProvider === "manual" ||
            o.paymentProvider === "bank_transfer"),
      );
    }

    // Check if the pending order has payment proof uploaded
    const proofUploaded = pendingManualOrder?.paymentProof?.hasProof || false;
    const proofStatus = pendingManualOrder?.paymentProof?.status || null;

    // Check for active quotations
    const activeQuotes =
      customerCtx?.recentQuotes?.filter((q) =>
        ["sent", "viewed", "pending_approval"].includes(q.status),
      ) || [];
    const acceptedQuotes =
      customerCtx?.recentQuotes?.filter((q) => q.status === "accepted") || [];

    // Fetch store payment instructions when relevant
    let paymentInstructions: string | null = null;
    if (pendingManualOrder) {
      const { data: ecomSettings } = await supabase
        .from("mod_ecommod01_settings")
        .select("manual_payment_instructions, store_name, currency")
        .eq("site_id", siteId)
        .single();
      paymentInstructions = ecomSettings?.manual_payment_instructions || null;
    }

    // ── PHASE LC-12: Payment method selection buttons ─────────────────────
    // If a pending manual order exists and we have structured payment instructions,
    // send interactive buttons FIRST instead of dumping all instructions at once.
    let selectedMethodDetails: string | null = null;

    if (pendingManualOrder && paymentInstructions) {
      const parsedMethods = parsePaymentMethods(paymentInstructions);

      // Check if we already sent a payment_method_select in this conversation
      const existingButtonMsg = previousMessages.find(
        (m: Record<string, unknown>) =>
          m.content_type === "payment_method_select",
      );

      if (!existingButtonMsg && parsedMethods && parsedMethods.length >= 2) {
        // First time — send interactive buttons instead of AI text
        const orderTotal = `${pendingManualOrder.currency} ${(pendingManualOrder.total / 100).toFixed(2)}`;
        const selectContent = JSON.stringify({
          text: `Great! To complete payment for order ${pendingManualOrder.orderNumber} (${orderTotal}), please choose your preferred payment method:`,
          orderNumber: pendingManualOrder.orderNumber,
          orderTotal,
          buttons: parsedMethods.map((m) => ({
            id: m.id,
            label: m.label,
          })),
        });

        return {
          response: selectContent,
          confidence: 1.0,
          shouldHandoff: false,
          assistantName: aiAssistantName,
          contentType: "payment_method_select",
        };
      }

      // Buttons were already sent — check if the user selected a specific method
      if (existingButtonMsg && parsedMethods && parsedMethods.length >= 2) {
        const lowerVisitorMsg = visitorMessage.toLowerCase();
        const matchedMethod = parsedMethods.find(
          (m) =>
            lowerVisitorMsg.includes(m.label.toLowerCase()) ||
            lowerVisitorMsg.includes(m.id.replace(/_/g, " ")),
        );
        if (matchedMethod) {
          // Restrict the AI to only this method's details
          selectedMethodDetails = `${matchedMethod.label}:\n${matchedMethod.details}`;
          console.log(
            "[AI Responder] User selected payment method:",
            matchedMethod.label,
          );
        }
      }
    }

    // Format knowledge base
    const kbText =
      kbArticles.length > 0
        ? kbArticles
            .map(
              (a: Record<string, unknown>) =>
                `## ${a.title}\n${a.content}\nCategory: ${a.category || "General"}`,
            )
            .join("\n\n")
        : "No knowledge base articles available.";

    // Format conversation history
    const historyText = previousMessages
      .map((m: Record<string, unknown>) => {
        const sender =
          m.sender_type === "visitor"
            ? "Visitor"
            : (m.sender_name as string) || "Agent";

        // Convert payment_method_select JSON to readable text for AI context
        if (m.content_type === "payment_method_select") {
          try {
            const data = JSON.parse(m.content as string);
            const buttonLabels = (data.buttons as { label: string }[])
              .map((b: { label: string }) => b.label)
              .join(", ");
            return `${sender}: [Asked customer to choose a payment method: ${buttonLabels}]`;
          } catch {
            return `${sender}: [Payment method selection message]`;
          }
        }

        return `${sender}: ${m.content}`;
      })
      .join("\n");

    const toneMap: Record<string, string> = {
      friendly: "Be warm, approachable, and use a conversational tone.",
      professional:
        "Maintain a polished, business-like tone. Be courteous but efficient.",
      casual:
        "Be relaxed and informal, like chatting with a friend. Use simple language.",
      formal:
        "Use formal language. Be respectful and measured in your responses.",
    };
    const toneInstruction = toneMap[aiTone] || toneMap.friendly;

    const systemPrompt = `You are a customer support AI assistant for ${companyName}.
You help website visitors with their questions.

TONE: ${toneInstruction}

RULES:
- Be helpful, friendly, and professional
- Keep responses concise (2-3 sentences max)
- If you don't know the answer, say so and offer to connect with a human agent
- Never make up information
- If the visitor asks to speak to a human, immediately offer to connect them
- Use the knowledge base articles below to answer questions when relevant
- If the visitor has order or booking history, use it to provide personalized support
- Respond in the same language as the visitor
${customInstructions ? `\nCUSTOM INSTRUCTIONS FROM STORE OWNER:\n${customInstructions}\n` : ""}
${
  pendingManualOrder
    ? `
PAYMENT GUIDANCE MODE — ACTIVE:
The customer has a pending order that needs payment. Your primary job right now is to help them complete payment.

ORDER DETAILS:
- Order number: ${pendingManualOrder.orderNumber}
- Total amount: ${pendingManualOrder.currency} ${(pendingManualOrder.total / 100).toFixed(2)}
- Payment status: Pending
- Placed: ${new Date(pendingManualOrder.createdAt).toLocaleDateString()}
${proofUploaded ? `\nPAYMENT PROOF STATUS:\n- Proof uploaded: Yes (${pendingManualOrder.paymentProof.fileName})\n- Proof status: ${proofStatus}\n- Uploaded at: ${pendingManualOrder.paymentProof.uploadedAt ? new Date(pendingManualOrder.paymentProof.uploadedAt).toLocaleString() : "unknown"}\n\nThe customer has ALREADY uploaded payment proof. Acknowledge this! Let them know the store owner is reviewing it. Do NOT ask them to upload proof again.` : ""}

${selectedMethodDetails ? `SELECTED PAYMENT METHOD:\nThe customer has chosen a specific payment method. Share ONLY these details:\n${selectedMethodDetails}\n\nDo NOT mention other payment methods. Only share the details above.` : paymentInstructions ? `STORE PAYMENT INSTRUCTIONS:\n${paymentInstructions}` : "No specific payment instructions configured. Ask the customer to contact the store for payment details."}

HOW TO GUIDE THE CUSTOMER:
${
  selectedMethodDetails
    ? `1. Acknowledge their payment method choice
2. Share the payment details above clearly — use simple numbered steps
3. Tell them to use their order number (${pendingManualOrder.orderNumber}) as the payment reference
4. Keep it short and clear — only the selected method, nothing else`
    : `1. Greet them warmly and confirm their order number and total
2. Share the payment instructions above in simple, clear language — break it into numbered steps
3. Tell them to use their order number (${pendingManualOrder.orderNumber}) as the payment reference`
}
${proofUploaded ? `${selectedMethodDetails ? "5" : "4"}. Their proof is ALREADY uploaded — acknowledge it and reassure them\n${selectedMethodDetails ? "6" : "5"}. Let them know the store owner will verify and process their order` : `${selectedMethodDetails ? "5" : "4"}. After they confirm payment, let them know they can upload proof of payment on their order page\n${selectedMethodDetails ? "6" : "5"}. Reassure them that once the store owner verifies payment, their order will be processed and shipped`}
${selectedMethodDetails ? "" : "6. Be conversational and friendly — like a helpful friend, not a robot\n7. If they have questions about the payment process, answer patiently and clearly\n8. Keep each message short and easy to follow — avoid walls of text"}
`
    : ""
}
${
  activeQuotes.length > 0
    ? `
ACTIVE QUOTATIONS:
The customer has ${activeQuotes.length} active quotation(s):
${activeQuotes.map((q) => `- ${q.quoteNumber}: ${q.status}, ${q.currency} ${(q.total / 100).toFixed(2)}, ${q.itemCount} item(s)${q.expiresAt ? `, expires ${new Date(q.expiresAt).toLocaleDateString()}` : ""}`).join("\n")}

If the customer asks about their quote, provide the details above. Let them know they can view and accept/reject the quote through the link sent to their email.
`
    : ""
}
${
  acceptedQuotes.length > 0
    ? `
ACCEPTED QUOTATIONS:
${acceptedQuotes.map((q) => `- ${q.quoteNumber}: accepted${q.convertedOrderNumber ? ` → converted to order ${q.convertedOrderNumber}` : " (awaiting conversion to order by store staff)"}`).join("\n")}

If a quote has been converted to an order, guide the customer to complete payment for that order.
`
    : ""
}
KNOWLEDGE BASE:
${kbText}

CONVERSATION HISTORY:
${historyText}

VISITOR INFO:
Name: ${visitorInfo?.name || "Unknown"}
Email: ${visitorInfo?.email || "Not provided"}
Previous conversations: ${visitorInfo?.total_conversations || 0}${customerCtx ? `\n\nCUSTOMER HISTORY:\n${formatCustomerContext(customerCtx)}` : ""}`;

    const result = await generateText({
      model: getModel(),
      system: systemPrompt,
      prompt: visitorMessage,
    });

    console.log(
      "[AI Responder] Claude responded, text length:",
      result.text?.length,
      "usage:",
      JSON.stringify(result.usage),
    );

    // Estimate confidence based on knowledge base match
    const responseText = result.text;
    let confidence = 0.6; // Base confidence
    let matchedArticleId: string | undefined;

    // Payment guidance mode — high confidence since we have all the context
    if (pendingManualOrder) {
      confidence = 0.95;
    }

    for (const article of kbArticles) {
      const titleLower = (
        (article as Record<string, unknown>).title as string
      ).toLowerCase();
      const contentLower = (
        (article as Record<string, unknown>).content as string
      ).toLowerCase();
      if (
        lowerMsg.includes(titleLower) ||
        titleLower.includes(lowerMsg) ||
        contentLower.includes(lowerMsg)
      ) {
        confidence = 0.85;
        matchedArticleId = (article as Record<string, unknown>).id as string;
        break;
      }
    }

    // If response suggests lack of knowledge, lower confidence
    if (
      responseText.toLowerCase().includes("i don't know") ||
      responseText.toLowerCase().includes("not sure") ||
      responseText.toLowerCase().includes("can't find")
    ) {
      confidence = 0.4;
    }

    return {
      response: responseText,
      confidence,
      shouldHandoff: confidence < CONFIDENCE_THRESHOLD,
      matchedArticleId,
      assistantName: aiAssistantName,
      ...(selectedMethodDetails && {
        contentType: "payment_upload_prompt" as const,
      }),
    };
  } catch (err) {
    console.error("[AI Responder] Error generating response:", err);
    return null;
  }
}

// =============================================================================
// SHOULD AUTO-RESPOND
// =============================================================================

export async function shouldAutoRespond(
  siteId: string,
  conversationId: string,
): Promise<boolean> {
  if (!AI_ENABLED) return false;

  try {
    const supabase = createAdminClient() as any;

    // Check if conversation already has an agent
    const { data: conv } = await supabase
      .from("mod_chat_conversations")
      .select("assigned_agent_id")
      .eq("id", conversationId)
      .single();

    if (conv?.assigned_agent_id) return false;

    // Check if any agents are online and available
    const { data: agents } = await supabase
      .from("mod_chat_agents")
      .select("id, status, current_chat_count, max_concurrent_chats")
      .eq("site_id", siteId)
      .eq("status", "online")
      .eq("is_active", true);

    if (!agents || agents.length === 0) return true;

    // Check if all agents are at capacity
    const available = agents.filter(
      (a: Record<string, unknown>) =>
        (a.current_chat_count as number) < (a.max_concurrent_chats as number),
    );

    return available.length === 0;
  } catch {
    return false;
  }
}

// =============================================================================
// SUGGEST RESPONSES
// =============================================================================

export async function suggestResponse(
  conversationId: string,
  visitorMessage: string,
  siteId: string,
): Promise<{
  suggestions: Array<{ text: string; confidence: number }>;
  error: string | null;
}> {
  if (!AI_ENABLED) {
    return { suggestions: [], error: "AI not configured" };
  }

  try {
    const supabase = createAdminClient() as any;

    const { data: kbArticles } = await supabase
      .from("mod_chat_knowledge_base")
      .select("title, content")
      .eq("site_id", siteId)
      .eq("is_active", true)
      .limit(10);

    const kbText =
      (kbArticles || [])
        .map((a: Record<string, unknown>) => `${a.title}: ${a.content}`)
        .join("\n\n") || "No knowledge base articles.";

    const result = await generateText({
      model: getModel(),
      system: `You are an assistant helping customer support agents craft replies.
Based on the visitor's message and the knowledge base, suggest 3 different response options.
Each should be 1-3 sentences, professional, and helpful.
Format: Return exactly 3 responses separated by "---".

KNOWLEDGE BASE:
${kbText}`,
      prompt: `Visitor message: "${visitorMessage}"\n\nSuggest 3 different agent responses:`,
    });

    const parts = result.text
      .split("---")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    const suggestions = parts.map((text, i) => ({
      text,
      confidence: 0.8 - i * 0.1,
    }));

    return { suggestions, error: null };
  } catch (err) {
    return {
      suggestions: [],
      error: err instanceof Error ? err.message : "AI suggestion failed",
    };
  }
}

// =============================================================================
// SUMMARIZE CONVERSATION
// =============================================================================

export async function summarizeConversation(conversationId: string): Promise<{
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  topics: string[];
  error: string | null;
}> {
  if (!AI_ENABLED) {
    return {
      summary: "",
      sentiment: "neutral",
      topics: [],
      error: "AI not configured",
    };
  }

  try {
    const supabase = createAdminClient() as any;

    const { data: messages } = await supabase
      .from("mod_chat_messages")
      .select("sender_type, sender_name, content, content_type")
      .eq("conversation_id", conversationId)
      .eq("content_type", "text")
      .order("created_at", { ascending: true })
      .limit(50);

    if (!messages || messages.length < 2) {
      return {
        summary: "Too few messages to summarize.",
        sentiment: "neutral",
        topics: [],
        error: null,
      };
    }

    const transcript = messages
      .map(
        (m: Record<string, unknown>) =>
          `${m.sender_type === "visitor" ? "Visitor" : m.sender_name || "Agent"}: ${m.content}`,
      )
      .join("\n");

    const result = await generateText({
      model: getModel(),
      system: `Summarize the support conversation below. Return EXACTLY this format:
SUMMARY: [1-2 sentence summary]
SENTIMENT: [positive|neutral|negative]
TOPICS: [comma-separated list of 2-4 topics]`,
      prompt: transcript,
    });

    const text = result.text;
    const summaryMatch = text.match(/SUMMARY:\s*(.+)/i);
    const sentimentMatch = text.match(
      /SENTIMENT:\s*(positive|neutral|negative)/i,
    );
    const topicsMatch = text.match(/TOPICS:\s*(.+)/i);

    return {
      summary: summaryMatch?.[1]?.trim() || text,
      sentiment:
        (sentimentMatch?.[1]?.toLowerCase() as
          | "positive"
          | "neutral"
          | "negative") || "neutral",
      topics:
        topicsMatch?.[1]
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean) || [],
      error: null,
    };
  } catch (err) {
    return {
      summary: "",
      sentiment: "neutral",
      topics: [],
      error: err instanceof Error ? err.message : "Summarization failed",
    };
  }
}

// =============================================================================
// INTENT DETECTION
// =============================================================================

export async function detectIntent(message: string): Promise<{
  intent: string;
  confidence: number;
  suggestedDepartment?: string;
}> {
  // Fast keyword-based detection (no API call)
  const lowerMsg = message.toLowerCase();

  const intentMap: Array<{
    keywords: string[];
    intent: string;
    department?: string;
    confidence: number;
  }> = [
    {
      keywords: [
        "price",
        "pricing",
        "cost",
        "how much",
        "quote",
        "fee",
        "rate",
      ],
      intent: "pricing_inquiry",
      department: "Sales",
      confidence: 0.85,
    },
    {
      keywords: [
        "book",
        "appointment",
        "schedule",
        "reservation",
        "availability",
      ],
      intent: "booking_request",
      department: "Sales",
      confidence: 0.85,
    },
    {
      keywords: [
        "broken",
        "not working",
        "error",
        "bug",
        "issue",
        "problem",
        "help",
      ],
      intent: "technical_support",
      department: "Support",
      confidence: 0.8,
    },
    {
      keywords: [
        "complaint",
        "unhappy",
        "disappointed",
        "terrible",
        "worst",
        "refund",
      ],
      intent: "complaint",
      department: "Support",
      confidence: 0.85,
    },
    {
      keywords: [
        "thank",
        "great",
        "awesome",
        "love",
        "amazing",
        "excellent",
        "feedback",
      ],
      intent: "feedback",
      confidence: 0.75,
    },
    {
      keywords: ["question", "what is", "how do", "can you", "where", "when"],
      intent: "question",
      confidence: 0.7,
    },
  ];

  for (const mapping of intentMap) {
    if (mapping.keywords.some((kw) => lowerMsg.includes(kw))) {
      return {
        intent: mapping.intent,
        confidence: mapping.confidence,
        suggestedDepartment: mapping.department,
      };
    }
  }

  return { intent: "general", confidence: 0.5 };
}

// =============================================================================
// SENTIMENT ANALYSIS
// =============================================================================

export function analyzeSentiment(message: string): {
  sentiment: "positive" | "neutral" | "negative";
  score: number;
} {
  const lowerMsg = message.toLowerCase();

  const positiveWords = [
    "thank",
    "thanks",
    "great",
    "awesome",
    "excellent",
    "love",
    "happy",
    "perfect",
    "wonderful",
    "amazing",
    "good",
    "helpful",
    "appreciate",
  ];
  const negativeWords = [
    "bad",
    "terrible",
    "horrible",
    "worst",
    "hate",
    "angry",
    "disappointed",
    "frustrated",
    "annoying",
    "useless",
    "stupid",
    "broken",
    "complaint",
  ];

  let score = 0;
  for (const word of positiveWords) {
    if (lowerMsg.includes(word)) score += 1;
  }
  for (const word of negativeWords) {
    if (lowerMsg.includes(word)) score -= 1;
  }

  if (score > 0)
    return { sentiment: "positive", score: Math.min(score / 3, 1) };
  if (score < 0)
    return { sentiment: "negative", score: Math.max(score / 3, -1) };
  return { sentiment: "neutral", score: 0 };
}
