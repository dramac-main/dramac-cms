/**
 * Marketing Module - Sequence Execution Engine
 *
 * Phase MKT-04: Drip Sequences & Marketing Automation
 *
 * Processes active sequence enrollments by evaluating the current step
 * for each enrollment, executing it (send email, apply delay, evaluate
 * condition, perform action, handle split), then advancing to the next step.
 *
 * Called by the cron job (/api/cron/marketing-scheduler) on a schedule.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { MKT_TABLES } from "../lib/marketing-constants";
import { renderTemplate } from "./template-renderer";
import { encodeTrackingToken } from "./tracking-utils";
import type {
  Sequence,
  SequenceStep,
  SequenceEnrollment,
  CompletedStep,
} from "../types/sequence-types";

// ============================================================================
// TYPES
// ============================================================================

interface ProcessResult {
  sequencesProcessed: number;
  enrollmentsProcessed: number;
  emailsSent: number;
  errors: number;
  details: Array<{
    enrollmentId: string;
    stepId: string;
    action: string;
    success: boolean;
    error?: string;
  }>;
}

interface StepResult {
  success: boolean;
  action: string;
  nextStepId?: string | null;
  error?: string;
  completedAt: string;
}

// ============================================================================
// MAIN PROCESSOR
// ============================================================================

/**
 * Process all active sequence enrollments that are due for their next step.
 * Called by the cron scheduler.
 */
export async function processSequences(): Promise<ProcessResult> {
  const supabase = createAdminClient() as any;
  const now = new Date().toISOString();

  const result: ProcessResult = {
    sequencesProcessed: 0,
    enrollmentsProcessed: 0,
    emailsSent: 0,
    errors: 0,
    details: [],
  };

  // 1. Find all active sequences
  const { data: activeSequences, error: seqError } = await supabase
    .from(MKT_TABLES.sequences)
    .select("*")
    .eq("status", "active");

  if (seqError || !activeSequences?.length) {
    return result;
  }

  // 2. For each sequence, find enrollments that are due
  for (const seq of activeSequences) {
    const sequence = seq as any;
    const steps: SequenceStep[] = sequence.steps || [];
    if (steps.length === 0) continue;

    result.sequencesProcessed++;

    // Find active enrollments where next_step_at <= now
    const { data: dueEnrollments, error: enrollError } = await supabase
      .from(MKT_TABLES.sequenceEnrollments)
      .select("*")
      .eq("sequence_id", sequence.id)
      .eq("status", "active")
      .lte("next_step_at", now)
      .order("next_step_at", { ascending: true })
      .limit(100); // Process in batches of 100 per sequence

    if (enrollError || !dueEnrollments?.length) continue;

    for (const enrollment of dueEnrollments) {
      const enr = enrollment as any;
      try {
        const stepResult = await processEnrollmentStep(
          supabase,
          sequence,
          steps,
          enr,
        );

        result.enrollmentsProcessed++;
        result.details.push({
          enrollmentId: enr.id,
          stepId: enr.current_step_id || "unknown",
          action: stepResult.action,
          success: stepResult.success,
          error: stepResult.error,
        });

        if (stepResult.action === "email_sent") {
          result.emailsSent++;
        }
        if (!stepResult.success) {
          result.errors++;
        }
      } catch (e) {
        result.errors++;
        result.details.push({
          enrollmentId: enr.id,
          stepId: enr.current_step_id || "unknown",
          action: "error",
          success: false,
          error: e instanceof Error ? e.message : "Unknown error",
        });

        // Mark enrollment as failed on unexpected errors
        await supabase
          .from(MKT_TABLES.sequenceEnrollments)
          .update({
            status: "failed",
            exit_reason: e instanceof Error ? e.message : "Processing error",
          })
          .eq("id", enr.id);
      }
    }
  }

  return result;
}

// ============================================================================
// STEP PROCESSING
// ============================================================================

/**
 * Process a single enrollment step: execute the current step,
 * record completion, and advance to the next step.
 */
async function processEnrollmentStep(
  supabase: any,
  sequence: any,
  steps: SequenceStep[],
  enrollment: any,
): Promise<StepResult> {
  const currentStepId = enrollment.current_step_id;
  const currentStep = steps.find((s) => s.id === currentStepId);

  if (!currentStep) {
    // No current step means enrollment is done
    await completeEnrollment(supabase, enrollment, sequence);
    return {
      success: true,
      action: "completed",
      completedAt: new Date().toISOString(),
    };
  }

  let stepResult: StepResult;

  switch (currentStep.type) {
    case "email":
      stepResult = await processEmailStep(
        supabase,
        sequence,
        currentStep,
        enrollment,
      );
      break;

    case "delay":
      stepResult = await processDelayStep(currentStep);
      break;

    case "condition":
      stepResult = await processConditionStep(
        supabase,
        sequence,
        currentStep,
        enrollment,
      );
      break;

    case "action":
      stepResult = await processActionStep(
        supabase,
        sequence,
        currentStep,
        enrollment,
      );
      break;

    case "split":
      stepResult = await processSplitStep(currentStep);
      break;

    default:
      stepResult = {
        success: false,
        action: "unknown_step_type",
        error: `Unknown step type: ${currentStep.type}`,
        completedAt: new Date().toISOString(),
      };
  }

  if (!stepResult.success) return stepResult;

  // Record step completion
  const completedSteps: CompletedStep[] = [
    ...(enrollment.steps_completed || []),
    {
      stepId: currentStep.id,
      completedAt: stepResult.completedAt,
      result: stepResult.action,
    },
  ];

  // Determine next step
  const nextStepId =
    stepResult.nextStepId !== undefined
      ? stepResult.nextStepId
      : currentStep.nextStepId || null;

  const nextStep = nextStepId ? steps.find((s) => s.id === nextStepId) : null;

  if (!nextStep) {
    // Sequence complete
    await supabase
      .from(MKT_TABLES.sequenceEnrollments)
      .update({
        current_step_id: null,
        status: "completed",
        completed_at: new Date().toISOString(),
        next_step_at: null,
        steps_completed: completedSteps,
      })
      .eq("id", enrollment.id);

    // Update sequence completed count
    await supabase
      .rpc("increment_field", {
        table_name: MKT_TABLES.sequences,
        row_id: sequence.id,
        field_name: "total_completed",
        amount: 1,
      })
      .catch(() => {
        // Fallback: direct update if RPC not available
        return supabase
          .from(MKT_TABLES.sequences)
          .update({
            total_completed: (sequence.total_completed || 0) + 1,
          })
          .eq("id", sequence.id);
      });

    try {
      await logAutomationEvent(
        sequence.site_id,
        "marketing.sequence.enrollment_completed",
        { sequenceId: sequence.id, enrollmentId: enrollment.id },
        {
          sourceModule: "marketing",
          sourceEntityType: "sequence",
          sourceEntityId: sequence.id,
        },
      );
    } catch {
      // Non-critical
    }

    return stepResult;
  }

  // Advance to next step
  const nextStepAt = calculateNextStepAt(nextStep);

  await supabase
    .from(MKT_TABLES.sequenceEnrollments)
    .update({
      current_step_id: nextStep.id,
      next_step_at: nextStepAt,
      steps_completed: completedSteps,
    })
    .eq("id", enrollment.id);

  return stepResult;
}

// ============================================================================
// STEP TYPE HANDLERS
// ============================================================================

/**
 * Send an email for the current step.
 */
async function processEmailStep(
  supabase: any,
  sequence: any,
  step: SequenceStep,
  enrollment: any,
): Promise<StepResult> {
  const config = step.config as {
    subject?: string;
    previewText?: string;
    templateId?: string;
    contentHtml?: string;
  };

  // Load subscriber
  const { data: subscriber } = await supabase
    .from(MKT_TABLES.subscribers)
    .select("*")
    .eq("id", enrollment.subscriber_id)
    .single();

  if (!subscriber) {
    return {
      success: false,
      action: "email_skipped",
      error: "Subscriber not found",
      completedAt: new Date().toISOString(),
    };
  }

  // Skip if subscriber is not active
  if (subscriber.status !== "active") {
    return {
      success: true,
      action: "email_skipped_inactive",
      completedAt: new Date().toISOString(),
    };
  }

  // Get email content - from template or inline
  let htmlContent = config.contentHtml || "";
  const templateId = step.templateId || config.templateId;

  if (!htmlContent && templateId) {
    const { data: template } = await supabase
      .from(MKT_TABLES.emailTemplates)
      .select("content_html")
      .eq("id", templateId)
      .single();

    if (template) {
      htmlContent = template.content_html;
    }
  }

  if (!htmlContent) {
    return {
      success: false,
      action: "email_skipped",
      error: "No email content",
      completedAt: new Date().toISOString(),
    };
  }

  // Load settings
  const { data: settings } = await supabase
    .from(MKT_TABLES.settings)
    .select("*")
    .eq("site_id", sequence.site_id)
    .single();

  const fromName = settings?.default_from_name || "No Reply";
  const fromEmail =
    settings?.default_from_email || "noreply@app.dramacagency.com";

  // Create a send record for tracking
  const sendId = crypto.randomUUID();

  // Personalize content
  const personalizedHtml = renderTemplate(htmlContent, {
    firstName: subscriber.first_name || "",
    lastName: subscriber.last_name || "",
    email: subscriber.email,
    unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/marketing/unsubscribe/${encodeTrackingToken(sequence.id, subscriber.id, sendId)}`,
    trackingPixel: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/marketing/track/open/${encodeTrackingToken(sequence.id, subscriber.id, sendId)}`,
  });

  // Send via Resend (lazy-loaded to avoid import issues if not configured)
  try {
    const { getResend, isEmailEnabled } =
      await import("@/lib/email/resend-client");

    if (!isEmailEnabled()) {
      console.log(
        `[SequenceEngine] Email not configured, skipping send for enrollment ${enrollment.id}`,
      );
      return {
        success: true,
        action: "email_skipped_not_configured",
        completedAt: new Date().toISOString(),
      };
    }

    const resend = getResend();
    if (!resend) {
      return {
        success: true,
        action: "email_skipped_not_configured",
        completedAt: new Date().toISOString(),
      };
    }

    const subject = config.subject || step.name || "Message";

    const { error: sendError } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [subscriber.email],
      subject,
      html: personalizedHtml,
      headers: {
        "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL || ""}/api/marketing/unsubscribe/${encodeTrackingToken(sequence.id, subscriber.id, sendId)}>`,
      },
    });

    if (sendError) {
      return {
        success: false,
        action: "email_failed",
        error: sendError.message,
        completedAt: new Date().toISOString(),
      };
    }

    // Update subscriber stats
    await supabase
      .from(MKT_TABLES.subscribers)
      .update({ last_email_sent_at: new Date().toISOString() })
      .eq("id", subscriber.id);

    return {
      success: true,
      action: "email_sent",
      completedAt: new Date().toISOString(),
    };
  } catch (e) {
    return {
      success: false,
      action: "email_failed",
      error: e instanceof Error ? e.message : "Send failed",
      completedAt: new Date().toISOString(),
    };
  }
}

/**
 * Process a delay step - delays are handled by next_step_at scheduling.
 * When we reach this point, the delay has already elapsed.
 */
async function processDelayStep(step: SequenceStep): Promise<StepResult> {
  // Delay steps are pre-calculated via next_step_at.
  // If we're here, the delay has passed.
  return {
    success: true,
    action: "delay_completed",
    completedAt: new Date().toISOString(),
  };
}

/**
 * Evaluate a condition and branch accordingly.
 */
async function processConditionStep(
  supabase: any,
  sequence: any,
  step: SequenceStep,
  enrollment: any,
): Promise<StepResult> {
  const field = step.conditionField || (step.config as any)?.field;
  const operator = step.conditionOperator || (step.config as any)?.operator;
  const value = step.conditionValue || (step.config as any)?.value;

  if (!field || !operator) {
    // No condition configured, take the true branch
    return {
      success: true,
      action: "condition_default_true",
      nextStepId: step.trueStepId || step.nextStepId,
      completedAt: new Date().toISOString(),
    };
  }

  // Load subscriber to evaluate condition
  const { data: subscriber } = await supabase
    .from(MKT_TABLES.subscribers)
    .select("*")
    .eq("id", enrollment.subscriber_id)
    .single();

  if (!subscriber) {
    return {
      success: true,
      action: "condition_subscriber_missing",
      nextStepId: step.falseStepId || step.nextStepId,
      completedAt: new Date().toISOString(),
    };
  }

  const subscriberValue = String(subscriber[field] || "");
  const conditionMet = evaluateCondition(
    subscriberValue,
    operator,
    value || "",
  );

  return {
    success: true,
    action: conditionMet ? "condition_true" : "condition_false",
    nextStepId: conditionMet
      ? step.trueStepId || step.nextStepId
      : step.falseStepId || step.nextStepId,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Execute an action step (tag subscriber, update field, etc.)
 */
async function processActionStep(
  supabase: any,
  sequence: any,
  step: SequenceStep,
  enrollment: any,
): Promise<StepResult> {
  const config = step.config as {
    actionType?: string;
    value?: string;
  };

  if (!config.actionType) {
    return {
      success: true,
      action: "action_skipped",
      completedAt: new Date().toISOString(),
    };
  }

  try {
    switch (config.actionType) {
      case "add_tag": {
        if (!config.value) break;
        // Append tag to subscriber
        const { data: sub } = await supabase
          .from(MKT_TABLES.subscribers)
          .select("tags")
          .eq("id", enrollment.subscriber_id)
          .single();

        const currentTags: string[] = sub?.tags || [];
        if (!currentTags.includes(config.value)) {
          await supabase
            .from(MKT_TABLES.subscribers)
            .update({ tags: [...currentTags, config.value] })
            .eq("id", enrollment.subscriber_id);
        }
        break;
      }

      case "remove_tag": {
        if (!config.value) break;
        const { data: sub } = await supabase
          .from(MKT_TABLES.subscribers)
          .select("tags")
          .eq("id", enrollment.subscriber_id)
          .single();

        const tags: string[] = sub?.tags || [];
        await supabase
          .from(MKT_TABLES.subscribers)
          .update({ tags: tags.filter((t: string) => t !== config.value) })
          .eq("id", enrollment.subscriber_id);
        break;
      }

      case "update_status": {
        if (!config.value) break;
        await supabase
          .from(MKT_TABLES.subscribers)
          .update({ status: config.value })
          .eq("id", enrollment.subscriber_id);
        break;
      }

      case "add_to_list": {
        if (!config.value) break;
        // Add subscriber to mailing list (upsert to avoid duplicates)
        await supabase.from(MKT_TABLES.listSubscribers).upsert(
          {
            list_id: config.value,
            subscriber_id: enrollment.subscriber_id,
            status: "active",
          },
          { onConflict: "list_id,subscriber_id" },
        );
        break;
      }

      case "remove_from_list": {
        if (!config.value) break;
        await supabase
          .from(MKT_TABLES.listSubscribers)
          .delete()
          .eq("list_id", config.value)
          .eq("subscriber_id", enrollment.subscriber_id);
        break;
      }

      case "emit_event": {
        if (!config.value) break;
        await logAutomationEvent(
          sequence.site_id,
          config.value,
          {
            sequenceId: sequence.id,
            enrollmentId: enrollment.id,
            subscriberId: enrollment.subscriber_id,
          },
          {
            sourceModule: "marketing",
            sourceEntityType: "sequence",
            sourceEntityId: sequence.id,
          },
        );
        break;
      }

      default:
        break;
    }

    return {
      success: true,
      action: `action_${config.actionType}`,
      completedAt: new Date().toISOString(),
    };
  } catch (e) {
    return {
      success: false,
      action: `action_${config.actionType}_failed`,
      error: e instanceof Error ? e.message : "Action failed",
      completedAt: new Date().toISOString(),
    };
  }
}

/**
 * Process a split test step - randomly assign to a branch
 * based on configured ratios.
 */
async function processSplitStep(step: SequenceStep): Promise<StepResult> {
  const config = step.config as {
    splitA?: { ratio?: number; nextStepId?: string };
    splitB?: { ratio?: number; nextStepId?: string };
  };

  const ratioA = config.splitA?.ratio || 50;
  const roll = Math.random() * 100;

  const branch = roll < ratioA ? "A" : "B";
  const nextStepId =
    branch === "A" ? config.splitA?.nextStepId : config.splitB?.nextStepId;

  return {
    success: true,
    action: `split_${branch.toLowerCase()}`,
    nextStepId: nextStepId || step.nextStepId,
    completedAt: new Date().toISOString(),
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculate when the next step should run based on step type.
 */
function calculateNextStepAt(step: SequenceStep): string {
  if (step.type === "delay" && step.delayMinutes) {
    const future = new Date();
    future.setMinutes(future.getMinutes() + step.delayMinutes);
    return future.toISOString();
  }

  // Email, condition, action, split steps execute immediately
  return new Date().toISOString();
}

/**
 * Mark an enrollment as completed when there are no more steps.
 */
async function completeEnrollment(
  supabase: any,
  enrollment: any,
  sequence: any,
): Promise<void> {
  await supabase
    .from(MKT_TABLES.sequenceEnrollments)
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      current_step_id: null,
      next_step_at: null,
    })
    .eq("id", enrollment.id);

  // Increment completed count
  await supabase
    .from(MKT_TABLES.sequences)
    .update({
      total_completed: (sequence.total_completed || 0) + 1,
    })
    .eq("id", sequence.id);
}

/**
 * Evaluate a simple condition against a subscriber field value.
 */
function evaluateCondition(
  actual: string,
  operator: string,
  expected: string,
): boolean {
  const a = actual.toLowerCase();
  const e = expected.toLowerCase();

  switch (operator) {
    case "equals":
      return a === e;
    case "not_equals":
      return a !== e;
    case "contains":
      return a.includes(e);
    case "not_contains":
      return !a.includes(e);
    case "starts_with":
      return a.startsWith(e);
    case "ends_with":
      return a.endsWith(e);
    case "is_empty":
      return a === "";
    case "is_not_empty":
      return a !== "";
    case "greater_than":
      return parseFloat(actual) > parseFloat(expected);
    case "less_than":
      return parseFloat(actual) < parseFloat(expected);
    default:
      return false;
  }
}

/**
 * Enroll a contact into a sequence. Called from triggers
 * (e.g., subscriber_added event, form submission, manual enroll).
 */
export async function enrollContact(
  siteId: string,
  sequenceId: string,
  subscriberId: string,
): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
  const supabase = createAdminClient() as any;

  // Load sequence
  const { data: sequence } = await supabase
    .from(MKT_TABLES.sequences)
    .select("*")
    .eq("id", sequenceId)
    .eq("site_id", siteId)
    .single();

  if (!sequence || sequence.status !== "active") {
    return { success: false, error: "Sequence not active" };
  }

  const steps: SequenceStep[] = sequence.steps || [];
  if (steps.length === 0) {
    return { success: false, error: "Sequence has no steps" };
  }

  // Check enrollment limit
  if (sequence.enrollment_limit) {
    const { count } = await supabase
      .from(MKT_TABLES.sequenceEnrollments)
      .select("*", { count: "exact", head: true })
      .eq("sequence_id", sequenceId);

    if (count && count >= sequence.enrollment_limit) {
      return { success: false, error: "Enrollment limit reached" };
    }
  }

  // Check re-enrollment
  if (!sequence.re_enrollment) {
    const { data: existing } = await supabase
      .from(MKT_TABLES.sequenceEnrollments)
      .select("id, status")
      .eq("sequence_id", sequenceId)
      .eq("subscriber_id", subscriberId)
      .limit(1);

    if (existing?.length) {
      return {
        success: false,
        error: "Already enrolled (re-enrollment disabled)",
      };
    }
  }

  // Sort steps by position, take the first
  const sortedSteps = [...steps].sort((a, b) => a.position - b.position);
  const firstStep = sortedSteps[0];
  const nextStepAt = calculateNextStepAt(firstStep);

  // Create enrollment
  const { data: enrollment, error } = await supabase
    .from(MKT_TABLES.sequenceEnrollments)
    .insert({
      sequence_id: sequenceId,
      subscriber_id: subscriberId,
      current_step_id: firstStep.id,
      status: "active",
      enrolled_at: new Date().toISOString(),
      next_step_at: nextStepAt,
      steps_completed: [],
      metadata: {},
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Increment enrolled count
  await supabase
    .from(MKT_TABLES.sequences)
    .update({
      total_enrolled: (sequence.total_enrolled || 0) + 1,
    })
    .eq("id", sequenceId);

  try {
    await logAutomationEvent(
      siteId,
      "marketing.sequence.enrollment_started",
      {
        sequenceId,
        enrollmentId: enrollment.id,
        subscriberId,
      },
      {
        sourceModule: "marketing",
        sourceEntityType: "sequence",
        sourceEntityId: sequenceId,
      },
    );
  } catch {
    // Non-critical
  }

  return { success: true, enrollmentId: enrollment.id };
}
