"use server";

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import { emitAutomationEvent } from "@/modules/automation/lib/automation-engine";
import { sendInvoiceEmail } from "./email-service";
import type { InvoicingSettings } from "../types";

// ═══════════════════════════════════════════════════════════════
// OVERDUE DETECTION & REMINDER SERVICE
// ═══════════════════════════════════════════════════════════════

export interface OverdueCheckResult {
  sitesProcessed: number;
  newOverdue: number;
  remindersSent: number;
  lateFeesApplied: number;
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
          `Site ${siteId}: ${err instanceof Error ? err.message : "unknown error"}`
        );
      }
    }
  } catch (err) {
    result.errors.push(
      `Global error: ${err instanceof Error ? err.message : "unknown error"}`
    );
  }

  return result;
}

async function processSiteOverdue(
  supabase: any,
  siteId: string,
  today: string,
  result: OverdueCheckResult
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
      (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 1. Mark newly overdue invoices
    if (invoice.status !== "overdue") {
      await markInvoiceOverdue(supabase, siteId, invoice, daysOverdue);
      result.newOverdue++;
    }

    // 2. Check and send reminders
    if (settings.overdue_reminder_enabled) {
      const reminderSchedule: number[] =
        settings.overdue_reminder_schedule || [7, 14, 30];
      const sent = await checkAndSendReminder(
        supabase,
        siteId,
        invoice,
        daysOverdue,
        reminderSchedule,
        settings
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
        settings
      );
      if (applied) result.lateFeesApplied++;
    }
  }
}

// ─── Mark Invoice as Overdue ─────────────────────────────────

async function markInvoiceOverdue(
  supabase: any,
  siteId: string,
  invoice: any,
  daysOverdue: number
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
    await sendInvoiceEmail("overdue_reminder", {
      siteId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientName: invoice.client_name,
      clientEmail: invoice.client_email,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
      dueDate: invoice.due_date,
      daysOverdue,
      paymentToken: invoice.payment_token,
      companyName: null, // Will be loaded from settings in email service
    });
  }
}

// ─── Check and Send Reminder ─────────────────────────────────

async function checkAndSendReminder(
  supabase: any,
  siteId: string,
  invoice: any,
  daysOverdue: number,
  reminderSchedule: number[],
  settings: any
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
    await sendInvoiceEmail("overdue_reminder", {
      siteId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientName: invoice.client_name,
      clientEmail: invoice.client_email,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
      dueDate: invoice.due_date,
      daysOverdue,
      paymentToken: invoice.payment_token,
      companyName: settings.company_name || null,
      reminderTier: reminderCount + 1,
    });
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
  settings: any
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
    lateFeeInCents = Math.round(
      (invoice.amount_due * feeAmount) / 10000
    );
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
    old_value: JSON.stringify({ total: invoice.total, amountDue: invoice.amount_due }),
    new_value: JSON.stringify({ total: newTotal, amountDue: newAmountDue, lateFee: lateFeeInCents }),
  });

  // Send late fee notice email
  if (invoice.client_email) {
    await sendInvoiceEmail("late_fee_applied", {
      siteId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientName: invoice.client_name,
      clientEmail: invoice.client_email,
      lateFeeAmount: lateFeeInCents,
      newTotal: newTotal,
      amountDue: newAmountDue,
      currency: invoice.currency,
      paymentToken: invoice.payment_token,
      companyName: settings.company_name || null,
    });
  }

  return true;
}
