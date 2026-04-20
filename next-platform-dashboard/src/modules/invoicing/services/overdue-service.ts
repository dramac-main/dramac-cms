"use server";

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import { emitAutomationEvent } from "@/modules/automation/lib/automation-engine";
import {
  autoSendDunningEmail,
  autoSendOverdueReminderEmail,
  autoSendLateFeeEmail,
} from "./email-autosend-service";
import type { InvoicingSettings } from "../types";

// ═══════════════════════════════════════════════════════════════
// OVERDUE DETECTION & REMINDER SERVICE
// ═══════════════════════════════════════════════════════════════

export interface OverdueCheckResult {
  sitesProcessed: number;
  newOverdue: number;
  remindersSent: number;
  lateFeesApplied: number;
  dunningEscalations: number;
  errors: string[];
  timestamp: string;
}

/**
 * Process overdue invoices across ALL sites.
 * Called daily by the cron endpoint at 07:00 UTC.
 *
 * Logic per site:
 * 1. Query invoices where status IN ('sent','viewed','partial') AND due_date < today
 * 2. Mark newly overdue (status -> 'overdue')
 * 3. Check reminder schedule thresholds & send reminders
 * 4. Apply late fees if enabled
 */
export async function checkOverdueInvoices(): Promise<OverdueCheckResult> {
  const supabase = (await createClient()) as any;
  const today = new Date().toISOString().split("T")[0];

  const result: OverdueCheckResult = {
    sitesProcessed: 0,
    newOverdue: 0,
    remindersSent: 0,
    lateFeesApplied: 0,
    dunningEscalations: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Get all sites with invoicing module installed
    const { data: sites, error: sitesError } = await supabase
      .from("site_modules")
      .select("site_id")
      .eq("module_slug", "invoicing")
      .eq("is_active", true);

    if (sitesError || !sites?.length) {
      if (sitesError) result.errors.push(`Sites query: ${sitesError.message}`);
      return result;
    }

    for (const { site_id: siteId } of sites) {
      try {
        await processSiteOverdue(supabase, siteId, today, result);
        result.sitesProcessed++;
      } catch (err) {
        result.errors.push(
          `Site ${siteId}: ${err instanceof Error ? err.message : "unknown error"}`,
        );
      }
    }
  } catch (err) {
    result.errors.push(
      `Global error: ${err instanceof Error ? err.message : "unknown error"}`,
    );
  }

  return result;
}

async function processSiteOverdue(
  supabase: any,
  siteId: string,
  today: string,
  result: OverdueCheckResult,
): Promise<void> {
  // Load site settings
  const { data: settings } = await supabase
    .from(INV_TABLES.settings)
    .select("*")
    .eq("site_id", siteId)
    .single();

  if (!settings) return;

  // Query all past-due invoices that haven't been fully paid or voided
  const { data: pastDueInvoices, error } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("site_id", siteId)
    .in("status", ["sent", "viewed", "partial", "overdue"])
    .lt("due_date", today)
    .order("due_date", { ascending: true });

  if (error || !pastDueInvoices?.length) return;

  for (const invoice of pastDueInvoices) {
    const dueDate = new Date(invoice.due_date);
    const todayDate = new Date(today);
    const daysOverdue = Math.floor(
      (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // 1. Mark newly overdue invoices
    if (invoice.status !== "overdue") {
      await markInvoiceOverdue(supabase, siteId, invoice, daysOverdue);
      result.newOverdue++;
    }

    // 2. Check and send reminders
    if (settings.overdue_reminder_enabled) {
      const reminderSchedule: number[] = settings.overdue_reminder_schedule || [
        7, 14, 30,
      ];
      const sent = await checkAndSendReminder(
        supabase,
        siteId,
        invoice,
        daysOverdue,
        reminderSchedule,
        settings,
      );
      if (sent) result.remindersSent++;
    }

    // 3. Apply late fees
    if (settings.late_fee_enabled) {
      const applied = await checkAndApplyLateFee(
        supabase,
        siteId,
        invoice,
        daysOverdue,
        settings,
      );
      if (applied) result.lateFeesApplied++;
    }

    // 4. Staged dunning escalation (after reminders exhaust)
    const escalated = await checkAndEscalateDunning(
      supabase,
      siteId,
      invoice,
      daysOverdue,
      settings,
    );
    if (escalated) result.dunningEscalations++;
  }
}

// ─── Mark Invoice as Overdue ─────────────────────────────────

async function markInvoiceOverdue(
  supabase: any,
  siteId: string,
  invoice: any,
  daysOverdue: number,
): Promise<void> {
  await supabase
    .from(INV_TABLES.invoices)
    .update({
      status: "overdue",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id);

  // Log activity
  await supabase.from(INV_TABLES.invoiceActivity).insert({
    site_id: siteId,
    entity_type: "invoice",
    entity_id: invoice.id,
    action: "marked_overdue",
    description: `Invoice ${invoice.invoice_number} marked as overdue (${daysOverdue} days past due)`,
    actor_type: "system",
    actor_id: null,
    actor_name: "Overdue Service",
    old_value: invoice.status,
    new_value: "overdue",
  });

  // Fire automation event
  await emitAutomationEvent(siteId, "accounting.invoice.overdue", {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
    contactId: invoice.contact_id,
    clientName: invoice.client_name,
    clientEmail: invoice.client_email,
    amount_due: invoice.amount_due,
    days_overdue: daysOverdue,
    dueDate: invoice.due_date,
    currency: invoice.currency,
  });

  // Send initial overdue notification email
  if (invoice.client_email) {
    await autoSendOverdueReminderEmail(siteId, invoice.id);
  }
}

// ─── Check and Send Reminder ─────────────────────────────────

async function checkAndSendReminder(
  supabase: any,
  siteId: string,
  invoice: any,
  daysOverdue: number,
  reminderSchedule: number[],
  settings: any,
): Promise<boolean> {
  const reminderCount = invoice.reminder_count || 0;
  const sortedSchedule = [...reminderSchedule].sort((a, b) => a - b);

  // Find the next reminder threshold that hasn't been sent yet
  if (reminderCount >= sortedSchedule.length) return false;

  const nextThreshold = sortedSchedule[reminderCount];
  if (daysOverdue < nextThreshold) return false;

  // Check if we already sent for this threshold (avoid double-sends)
  const lastSent = invoice.last_reminder_sent_at;
  if (lastSent) {
    const lastSentDate = new Date(lastSent);
    const hoursSinceLastSend =
      (Date.now() - lastSentDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastSend < 20) return false; // Don't send more than once per day
  }

  // Send reminder email
  if (invoice.client_email) {
    await autoSendOverdueReminderEmail(siteId, invoice.id);
  }

  // Update invoice reminder tracking
  await supabase
    .from(INV_TABLES.invoices)
    .update({
      last_reminder_sent_at: new Date().toISOString(),
      reminder_count: reminderCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id);

  // Log activity
  await supabase.from(INV_TABLES.invoiceActivity).insert({
    site_id: siteId,
    entity_type: "invoice",
    entity_id: invoice.id,
    action: "overdue_reminder_sent",
    description: `Overdue reminder #${reminderCount + 1} sent (${daysOverdue} days overdue)`,
    actor_type: "system",
    actor_id: null,
    actor_name: "Overdue Service",
    old_value: null,
    new_value: `reminder_${reminderCount + 1}`,
  });

  return true;
}

// ─── Check and Apply Late Fee ────────────────────────────────

async function checkAndApplyLateFee(
  supabase: any,
  siteId: string,
  invoice: any,
  daysOverdue: number,
  settings: any,
): Promise<boolean> {
  const graceDays = settings.late_fee_grace_days || 0;
  const feeAmount = settings.late_fee_amount || 0;

  // Skip if late fee conditions not met
  if (daysOverdue <= graceDays) return false;
  if (feeAmount <= 0) return false;
  if (invoice.late_fee_applied_at) return false; // Already applied

  // Calculate late fee
  let lateFeeInCents: number;
  if (settings.late_fee_type === "percentage") {
    // late_fee_amount is stored in basis points (200 = 2%)
    lateFeeInCents = Math.round((invoice.amount_due * feeAmount) / 10000);
  } else {
    // Fixed amount in cents
    lateFeeInCents = feeAmount;
  }

  if (lateFeeInCents <= 0) return false;

  // Apply late fee: update totals
  const newTotal = invoice.total + lateFeeInCents;
  const newAmountDue = invoice.amount_due + lateFeeInCents;

  await supabase
    .from(INV_TABLES.invoices)
    .update({
      late_fee_amount: lateFeeInCents,
      late_fee_applied_at: new Date().toISOString(),
      total: newTotal,
      amount_due: newAmountDue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id);

  // Log activity
  await supabase.from(INV_TABLES.invoiceActivity).insert({
    site_id: siteId,
    entity_type: "invoice",
    entity_id: invoice.id,
    action: "late_fee_applied",
    description: `Late fee of ${lateFeeInCents} cents applied (${daysOverdue} days overdue, grace: ${graceDays} days)`,
    actor_type: "system",
    actor_id: null,
    actor_name: "Overdue Service",
    old_value: JSON.stringify({
      total: invoice.total,
      amountDue: invoice.amount_due,
    }),
    new_value: JSON.stringify({
      total: newTotal,
      amountDue: newAmountDue,
      lateFee: lateFeeInCents,
    }),
  });

  // Send late fee notice email
  if (invoice.client_email) {
    await autoSendLateFeeEmail(siteId, invoice.id, lateFeeInCents);
  }

  return true;
}

// ─── Staged Dunning Escalation ───────────────────────────────

/**
 * DUNNING STAGES (days overdue):
 *   1  → gentle reminder (auto covered by initial overdue detection)
 *   7  → reminder (covered by overdue_reminder_schedule)
 *  14  → urgent (first formal dunning)
 *  21  → final notice
 *  30  → late fee stage / second formal
 *  45  → admin follow-up flag
 *  60  → write-off candidate
 *
 * Stages 1-3 (days 14/21/30) → dunning_warning template
 * Stage 4 (day 45) → dunning_final template
 * Stage 5 (day 60) → dunning_writeoff template
 *
 * Escalation only fires if:
 * - All normal reminders have been exhausted (reminder_count >= schedule length)
 * - The dunning_stage hasn't already reached this level
 * - At least 24 hours since last dunning email
 */

const DUNNING_STAGES = [
  { days: 14, stage: 1, type: "warning" as const },
  { days: 21, stage: 2, type: "warning" as const },
  { days: 30, stage: 3, type: "warning" as const },
  { days: 45, stage: 4, type: "final" as const },
  { days: 60, stage: 5, type: "writeoff" as const },
];

async function checkAndEscalateDunning(
  supabase: any,
  siteId: string,
  invoice: any,
  daysOverdue: number,
  settings: any,
): Promise<boolean> {
  // Only escalate if overdue reminders have been exhausted
  const reminderSchedule: number[] = settings.overdue_reminder_schedule || [
    1, 7,
  ];
  const reminderCount = invoice.reminder_count || 0;
  if (reminderCount < reminderSchedule.length) return false;

  // Get current dunning stage
  const currentStage = invoice.dunning_stage || 0;

  // Find the next applicable stage
  const nextStage = DUNNING_STAGES.find(
    (s) => daysOverdue >= s.days && s.stage > currentStage,
  );
  if (!nextStage) return false;

  // Debounce: at least 24 hours since last dunning action
  if (invoice.last_dunning_at) {
    const hoursSince =
      (Date.now() - new Date(invoice.last_dunning_at).getTime()) / 3600000;
    if (hoursSince < 24) return false;
  }

  // Send dunning email
  if (invoice.client_email) {
    await autoSendDunningEmail(siteId, invoice.id, nextStage.type);
  }

  // Update invoice dunning stage
  const updatePayload: Record<string, unknown> = {
    dunning_stage: nextStage.stage,
    last_dunning_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // At stage 5 (writeoff), flag for review
  if (nextStage.stage === 5) {
    updatePayload.write_off_flagged = true;
  }

  await supabase
    .from(INV_TABLES.invoices)
    .update(updatePayload)
    .eq("id", invoice.id);

  // Log activity
  const stageLabels: Record<number, string> = {
    1: "Dunning Warning — Urgent",
    2: "Dunning Warning — Final Notice",
    3: "Dunning Warning — Second Formal",
    4: "Dunning Final Notice — Admin Flag",
    5: "Flagged for Write-Off",
  };

  await supabase.from(INV_TABLES.invoiceActivity).insert({
    site_id: siteId,
    entity_type: "invoice",
    entity_id: invoice.id,
    action: "dunning_escalation",
    description: `${stageLabels[nextStage.stage]} — ${daysOverdue} days overdue`,
    actor_type: "system",
    actor_id: null,
    actor_name: "Dunning Service",
    old_value: JSON.stringify({ stage: currentStage }),
    new_value: JSON.stringify({ stage: nextStage.stage, type: nextStage.type }),
  });

  // Fire automation event for dunning
  try {
    await emitAutomationEvent(siteId, "accounting.invoice.dunning_escalated", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientName: invoice.client_name,
      daysOverdue,
      dunningStage: nextStage.stage,
      dunningType: nextStage.type,
      writeOffFlagged: nextStage.stage === 4,
    });
  } catch {
    // Non-blocking
  }

  return true;
}
