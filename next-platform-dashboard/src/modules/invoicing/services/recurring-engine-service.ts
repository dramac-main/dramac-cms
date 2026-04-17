"use server";

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import { calculateNextDate } from "../lib/invoicing-utils";
import { _generateInvoiceFromTemplate } from "../actions/recurring-actions";
import { emitAutomationEvent } from "@/modules/automation/lib/automation-engine";
import { getResend, isEmailEnabled } from "@/lib/email/resend-client";

// ═══════════════════════════════════════════════════════════════
// PROCESS RECURRING INVOICES (cron entry point)
// ═══════════════════════════════════════════════════════════════

export interface RecurringProcessResult {
  processed: number;
  generated: string[];
  errors: string[];
  skipped: number;
  timestamp: string;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s exponential
const STALE_LOCK_MINUTES = 10; // processing_started_at older than this is considered stale

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff.
 * Returns the result on success, throws on all retries exhausted.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }
  throw lastError || new Error(`${label}: all ${maxRetries} retries exhausted`);
}

/**
 * Process all due recurring invoices.
 * Called daily by the cron endpoint.
 *
 * Logic:
 * 1. Query active recurring invoices where next_generate_date <= today
 * 2. Claim each with a processing_lock to prevent duplicate generation
 * 3. For each, generate an invoice from template (with retry)
 * 4. Update next_generate_date, occurrences, and status
 * 5. Log success/failure to activity table
 * 6. Return summary
 */
export async function processRecurringInvoices(): Promise<RecurringProcessResult> {
  const supabase = (await createClient()) as any;
  const today = new Date().toISOString().split("T")[0];
  const runId = crypto.randomUUID();

  const result: RecurringProcessResult = {
    processed: 0,
    generated: [],
    errors: [],
    skipped: 0,
    timestamp: new Date().toISOString(),
  };

  // Query all active recurring invoices that are due
  const { data: dueRecurring, error } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .select("*")
    .eq("status", "active")
    .lte("next_generate_date", today);

  if (error) {
    result.errors.push(`Query failed: ${error.message}`);
    return result;
  }

  if (!dueRecurring || dueRecurring.length === 0) {
    return result;
  }

  for (const recurring of dueRecurring) {
    try {
      // Check end_date
      if (recurring.end_date && today > recurring.end_date) {
        await supabase
          .from(INV_TABLES.recurringInvoices)
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", recurring.id);
        continue;
      }

      // Idempotency check: if last_generated_at is today, skip
      if (recurring.last_generated_at) {
        const lastGenDate = recurring.last_generated_at.split("T")[0];
        if (lastGenDate === today) {
          result.skipped++;
          continue;
        }
      }

      // Claim with processing lock — atomic update with stale-lock check
      const staleThreshold = new Date(
        Date.now() - STALE_LOCK_MINUTES * 60 * 1000,
      ).toISOString();
      const { data: claimed, error: claimErr } = await supabase
        .from(INV_TABLES.recurringInvoices)
        .update({ processing_started_at: new Date().toISOString() })
        .eq("id", recurring.id)
        .or(
          `processing_started_at.is.null,processing_started_at.lt.${staleThreshold}`,
        )
        .select("id")
        .maybeSingle();

      if (claimErr || !claimed) {
        result.skipped++;
        continue; // Another worker already claimed this
      }

      // Fetch template line items
      const { data: templateItems } = await supabase
        .from(INV_TABLES.recurringLineItems)
        .select("*")
        .eq("recurring_invoice_id", recurring.id)
        .order("sort_order", { ascending: true });

      if (!templateItems || templateItems.length === 0) {
        result.errors.push(`${recurring.name}: No line items, skipping`);
        await logGenerationFailure(
          supabase,
          recurring,
          "No line items configured",
          runId,
        );
        continue;
      }

      // Generate invoice with retry
      const invoice = await withRetry(
        () => _generateInvoiceFromTemplate(supabase, recurring, templateItems),
        recurring.name,
      );

      // Calculate next date
      const nextDate = calculateNextDate(
        recurring.next_generate_date,
        recurring.frequency,
        recurring.custom_interval_days,
      );
      const newOccurrences = (recurring.occurrences_generated || 0) + 1;
      const isCompleted =
        recurring.max_occurrences &&
        newOccurrences >= recurring.max_occurrences;

      // Update recurring invoice and release processing lock
      await supabase
        .from(INV_TABLES.recurringInvoices)
        .update({
          next_generate_date: nextDate,
          occurrences_generated: newOccurrences,
          last_generated_at: new Date().toISOString(),
          processing_started_at: null,
          status: isCompleted ? "completed" : "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", recurring.id);

      // Log success with structured metadata
      await supabase.from(INV_TABLES.invoiceActivity).insert({
        site_id: recurring.site_id,
        entity_type: "recurring_invoice",
        entity_id: recurring.id,
        action: "generated",
        description: `Invoice ${invoice.invoiceNumber} auto-generated from recurring "${recurring.name}" (run: ${runId})`,
        actor_type: "system",
        actor_id: null,
        actor_name: "Cron Engine",
        old_value: null,
        new_value: JSON.stringify({
          run_id: runId,
          invoice_number: invoice.invoiceNumber,
          invoice_id: invoice.id,
          occurrence: newOccurrences,
          next_date: nextDate,
          completed: isCompleted || false,
        }),
      });

      result.generated.push(invoice.invoiceNumber);
      result.processed++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "unknown error";
      result.errors.push(`${recurring.name}: ${errorMsg}`);

      // Release processing lock on failure
      await supabase
        .from(INV_TABLES.recurringInvoices)
        .update({ processing_started_at: null })
        .eq("id", recurring.id);

      // Log failure to activity table
      await logGenerationFailure(supabase, recurring, errorMsg, runId);
    }
  }

  // Send alert email if there were errors
  if (result.errors.length > 0) {
    await sendCronAlertEmail(supabase, dueRecurring[0]?.site_id, result, runId);
  }

  return result;
}

/**
 * Log a recurring generation failure to the activity table.
 */
async function logGenerationFailure(
  supabase: any,
  recurring: any,
  errorMessage: string,
  runId: string,
) {
  try {
    await supabase.from(INV_TABLES.invoiceActivity).insert({
      site_id: recurring.site_id,
      entity_type: "recurring_invoice",
      entity_id: recurring.id,
      action: "generation_failed",
      description: `Failed to generate invoice from recurring "${recurring.name}": ${errorMessage}`,
      actor_type: "system",
      actor_id: null,
      actor_name: "Cron Engine",
      old_value: null,
      new_value: JSON.stringify({
        run_id: runId,
        error: errorMessage,
        recurring_name: recurring.name,
        frequency: recurring.frequency,
      }),
    });
  } catch {
    // Don't let logging failure block the cron loop
  }
}

/**
 * Send alert email to site owner when cron generation has errors.
 */
async function sendCronAlertEmail(
  supabase: any,
  siteId: string | null,
  result: RecurringProcessResult,
  runId: string,
) {
  if (!isEmailEnabled() || !siteId) return;

  try {
    // Get site owner email from invoicing settings
    const { data: settings } = await supabase
      .from(INV_TABLES.settings)
      .select("company_email")
      .eq("site_id", siteId)
      .maybeSingle();

    const ownerEmail = settings?.company_email;
    if (!ownerEmail) return;

    const resend = getResend();
    if (!resend) return;

    const errorList = result.errors.map((e) => `• ${e}`).join("\n");
    const summary = [
      `Processed: ${result.processed}`,
      `Generated: ${result.generated.length}`,
      `Errors: ${result.errors.length}`,
      `Skipped: ${result.skipped}`,
    ].join(" | ");

    await resend.emails.send({
      from: "DRAMAC CMS <noreply@dramac.net>",
      to: ownerEmail,
      subject: `[Alert] Recurring Invoice Errors — ${result.errors.length} failure(s)`,
      text: [
        "Recurring Invoice Cron Alert",
        "=".repeat(40),
        "",
        `Run ID: ${runId}`,
        `Time: ${result.timestamp}`,
        "",
        summary,
        "",
        "Errors:",
        errorList,
        "",
        result.generated.length > 0
          ? `Successfully generated: ${result.generated.join(", ")}`
          : "No invoices were generated successfully.",
      ].join("\n"),
    });
  } catch {
    // Don't let alert email failure propagate
  }
}
