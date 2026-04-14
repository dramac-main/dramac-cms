"use server";

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import { calculateNextDate } from "../lib/invoicing-utils";
import { _generateInvoiceFromTemplate } from "../actions/recurring-actions";
import { emitAutomationEvent } from "@/modules/automation/lib/automation-engine";

// ═══════════════════════════════════════════════════════════════
// PROCESS RECURRING INVOICES (cron entry point)
// ═══════════════════════════════════════════════════════════════

export interface RecurringProcessResult {
  processed: number;
  generated: string[];
  errors: string[];
  timestamp: string;
}

/**
 * Process all due recurring invoices.
 * Called daily by the cron endpoint.
 *
 * Logic:
 * 1. Query active recurring invoices where next_generate_date <= today
 * 2. For each, generate an invoice from template
 * 3. Update next_generate_date, occurrences, and status
 * 4. Return summary
 */
export async function processRecurringInvoices(): Promise<RecurringProcessResult> {
  const supabase = (await createClient()) as any;
  const today = new Date().toISOString().split("T")[0];

  const result: RecurringProcessResult = {
    processed: 0,
    generated: [],
    errors: [],
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

      // Fetch template line items
      const { data: templateItems } = await supabase
        .from(INV_TABLES.recurringLineItems)
        .select("*")
        .eq("recurring_invoice_id", recurring.id)
        .order("sort_order", { ascending: true });

      if (!templateItems || templateItems.length === 0) {
        result.errors.push(`${recurring.name}: No line items, skipping`);
        continue;
      }

      // Generate invoice from template
      const invoice = await _generateInvoiceFromTemplate(
        supabase,
        recurring,
        templateItems,
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

      // Update recurring invoice
      await supabase
        .from(INV_TABLES.recurringInvoices)
        .update({
          next_generate_date: nextDate,
          occurrences_generated: newOccurrences,
          last_generated_at: new Date().toISOString(),
          status: isCompleted ? "completed" : "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", recurring.id);

      // Log activity on the recurring invoice
      await supabase.from(INV_TABLES.invoiceActivity).insert({
        site_id: recurring.site_id,
        entity_type: "recurring_invoice",
        entity_id: recurring.id,
        action: "generated",
        description: `Invoice ${invoice.invoiceNumber} auto-generated from recurring "${recurring.name}"`,
        actor_type: "system",
        actor_id: null,
        actor_name: "Cron Engine",
        old_value: null,
        new_value: null,
      });

      result.generated.push(invoice.invoiceNumber);
      result.processed++;
    } catch (err) {
      result.errors.push(
        `${recurring.name}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  return result;
}
