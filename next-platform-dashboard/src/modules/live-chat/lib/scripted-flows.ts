/**
 * Live Chat — Scripted Flows Runtime
 *
 * Deterministic, AI-independent fallback for the chat widget. When the AI
 * responder is disabled, rate-limited, or returns a hard error, the runtime
 * matches the visitor message against site-configured flows and steps the
 * conversation through a predefined script.
 *
 * Flow shape (`mod_chat_scripted_flows.steps`, jsonb):
 * [
 *   {
 *     "id": "step_welcome",
 *     "type": "message",
 *     "content": "Hi! How can I help with your order today?",
 *     "next": "step_options"
 *   },
 *   {
 *     "id": "step_options",
 *     "type": "choice",
 *     "content": "Pick one:",
 *     "buttons": [
 *       { "id": "track", "label": "Track my order", "next": "step_track" },
 *       { "id": "human", "label": "Talk to a human", "next": "step_handoff" }
 *     ]
 *   },
 *   { "id": "step_track", "type": "message",
 *     "content": "Sure — please share your order number (ORD-XXXX).",
 *     "next": null
 *   },
 *   { "id": "step_handoff", "type": "handoff",
 *     "content": "Connecting you with a human agent now."
 *   }
 * ]
 *
 * The current step id and flow id are persisted in
 * `mod_chat_conversations.metadata.scripted_flow = { flowId, stepId, started_at }`.
 *
 * Server-side only. Never imported from the public widget bundle.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ScriptedStepType = "message" | "choice" | "handoff" | "collect";

export interface ScriptedStepButton {
  id: string;
  label: string;
  next?: string | null;
}

export interface ScriptedStep {
  id: string;
  type: ScriptedStepType;
  content: string;
  next?: string | null;
  buttons?: ScriptedStepButton[];
  /** Field key under conversation metadata to store the visitor's reply (collect step). */
  collectKey?: string;
  /** Optional intent label emitted to analytics when this step runs. */
  intent?: string;
}

export interface ScriptedFlow {
  id: string;
  site_id: string;
  slug: string;
  name: string;
  description: string | null;
  trigger_keywords: string[];
  trigger_intents: string[];
  is_enabled: boolean;
  priority: number;
  steps: ScriptedStep[];
}

export interface ScriptedFlowState {
  flowId: string;
  stepId: string;
  startedAt: string;
  /** Field collected via `collect` steps. */
  collected?: Record<string, string>;
}

export interface ScriptedFlowResult {
  /** The AI/system message to insert into the conversation. */
  response: string;
  contentType: "text" | "flow_choice" | "flow_handoff";
  shouldHandoff: boolean;
  flowId: string;
  stepId: string;
  /** Updated metadata.scripted_flow value to persist on the conversation. */
  state: ScriptedFlowState | null; // null = flow finished
}

// ─── Loaders ────────────────────────────────────────────────────────────────

export async function loadEnabledFlows(
  siteId: string,
): Promise<ScriptedFlow[]> {
  const supabase = createAdminClient() as any;

  const { data, error } = await supabase
    .from("mod_chat_scripted_flows")
    .select(
      "id, site_id, slug, name, description, trigger_keywords, trigger_intents, is_enabled, priority, steps",
    )
    .eq("site_id", siteId)
    .eq("is_enabled", true)
    .order("priority", { ascending: false });

  if (error || !data) return [];
  return data as ScriptedFlow[];
}

// ─── Matching ───────────────────────────────────────────────────────────────

export function matchFlow(
  message: string,
  flows: ScriptedFlow[],
): ScriptedFlow | null {
  const lower = message.toLowerCase();

  // Exact keyword first (longer matches > shorter)
  let best: { flow: ScriptedFlow; score: number } | null = null;
  for (const flow of flows) {
    for (const keyword of flow.trigger_keywords) {
      const k = keyword.trim().toLowerCase();
      if (!k) continue;
      if (lower.includes(k)) {
        const score = k.length + flow.priority;
        if (!best || score > best.score) best = { flow, score };
      }
    }
  }
  return best?.flow ?? null;
}

// ─── Stepping ───────────────────────────────────────────────────────────────

function findStep(flow: ScriptedFlow, stepId: string): ScriptedStep | null {
  return flow.steps.find((s) => s.id === stepId) ?? null;
}

function resolveStepContent(step: ScriptedStep): {
  response: string;
  contentType: ScriptedFlowResult["contentType"];
  shouldHandoff: boolean;
} {
  if (step.type === "choice") {
    const payload = JSON.stringify({
      text: step.content,
      stepId: step.id,
      buttons: (step.buttons || []).map((b) => ({ id: b.id, label: b.label })),
    });
    return {
      response: payload,
      contentType: "flow_choice",
      shouldHandoff: false,
    };
  }
  if (step.type === "handoff") {
    return {
      response: step.content,
      contentType: "flow_handoff",
      shouldHandoff: true,
    };
  }
  return { response: step.content, contentType: "text", shouldHandoff: false };
}

/** Pick the next step id based on visitor input + step shape. */
function chooseNextStepId(
  step: ScriptedStep,
  visitorMessage: string,
): string | null {
  if (step.type === "choice" && step.buttons?.length) {
    const lower = visitorMessage.toLowerCase().trim();
    const exact = step.buttons.find(
      (b) =>
        b.label.toLowerCase() === lower ||
        b.id.toLowerCase() === lower ||
        lower.includes(b.label.toLowerCase()) ||
        lower.includes(`pay using ${b.label.toLowerCase()}`),
    );
    if (exact) return exact.next ?? null;
    // Unknown reply on a choice step — stay put so user can re-pick.
    return step.id;
  }
  return step.next ?? null;
}

/**
 * Drive the scripted flow forward.
 *
 * - If `currentState` is null, attempts to start a new flow by matching
 *   `visitorMessage` against enabled flows. Returns null if nothing matches.
 * - If `currentState` is non-null, advances the flow based on the visitor's
 *   reply and returns the next step's payload.
 */
export async function runScriptedFlow(
  siteId: string,
  visitorMessage: string,
  currentState: ScriptedFlowState | null,
): Promise<ScriptedFlowResult | null> {
  const flows = await loadEnabledFlows(siteId);
  if (flows.length === 0) return null;

  // ── Continue existing flow ────────────────────────────────────────────────
  if (currentState) {
    const flow = flows.find((f) => f.id === currentState.flowId);
    if (!flow) return null; // flow was deleted/disabled mid-conversation
    const currentStep = findStep(flow, currentState.stepId);
    if (!currentStep) return null;

    // Optionally collect a value
    let collected = currentState.collected || {};
    if (currentStep.type === "collect" && currentStep.collectKey) {
      collected = { ...collected, [currentStep.collectKey]: visitorMessage };
    }

    const nextId = chooseNextStepId(currentStep, visitorMessage);
    if (!nextId) {
      // Flow finished
      return null;
    }
    const nextStep = findStep(flow, nextId);
    if (!nextStep) return null;

    const out = resolveStepContent(nextStep);
    return {
      ...out,
      flowId: flow.id,
      stepId: nextStep.id,
      state:
        nextStep.type === "handoff" ||
        (!nextStep.next && nextStep.type !== "choice")
          ? null
          : {
              flowId: flow.id,
              stepId: nextStep.id,
              startedAt: currentState.startedAt,
              collected,
            },
    };
  }

  // ── Start a fresh flow ────────────────────────────────────────────────────
  const matched = matchFlow(visitorMessage, flows);
  if (!matched) return null;
  const firstStep = matched.steps[0];
  if (!firstStep) return null;

  const out = resolveStepContent(firstStep);
  return {
    ...out,
    flowId: matched.id,
    stepId: firstStep.id,
    state:
      firstStep.type === "handoff" ||
      (!firstStep.next && firstStep.type !== "choice")
        ? null
        : {
            flowId: matched.id,
            stepId: firstStep.id,
            startedAt: new Date().toISOString(),
            collected: {},
          },
  };
}

/**
 * Force-start a specific flow by slug, regardless of whether the visitor's
 * message matched any keywords. Used as the deterministic backup when AI
 * generation fails (e.g. Anthropic credits exhausted, rate-limited, etc.).
 *
 * Returns null only if no enabled flow with that slug exists for the site.
 */
export async function startFlowBySlug(
  siteId: string,
  slug: string,
): Promise<ScriptedFlowResult | null> {
  const flows = await loadEnabledFlows(siteId);
  const matched = flows.find((f) => f.slug === slug);
  if (!matched) return null;
  const firstStep = matched.steps[0];
  if (!firstStep) return null;

  const out = resolveStepContent(firstStep);
  return {
    ...out,
    flowId: matched.id,
    stepId: firstStep.id,
    state:
      firstStep.type === "handoff" ||
      (!firstStep.next && firstStep.type !== "choice")
        ? null
        : {
            flowId: matched.id,
            stepId: firstStep.id,
            startedAt: new Date().toISOString(),
            collected: {},
          },
  };
}

// ─── Bookkeeping ────────────────────────────────────────────────────────────

export async function bumpFlowAnalytics(
  flowId: string,
  kind: "usage" | "completion" | "handoff",
): Promise<void> {
  const supabase = createAdminClient() as any;

  // Best-effort. If the RPC is missing we silently skip — the counter is non-critical.
  try {
    const column =
      kind === "completion"
        ? "completion_count"
        : kind === "handoff"
          ? "handoff_count"
          : "usage_count";
    await supabase.rpc("mod_chat_scripted_flows_increment", {
      flow_id: flowId,
      counter: column,
    });
  } catch {
    /* ignore */
  }
}
