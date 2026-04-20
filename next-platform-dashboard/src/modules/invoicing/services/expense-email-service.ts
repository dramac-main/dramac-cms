"use server";

import { getResend, isEmailEnabled, getEmailFrom } from "@/lib/email/resend-client";
import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import { formatCurrency } from "../services/currency-service";

// ═══════════════════════════════════════════════════════════════
// EXPENSE EMAIL NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export type ExpenseEmailType =
  | "submitted"
  | "auto_approved"
  | "approved"
  | "rejected";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com";

/**
 * Send expense notification email.
 * Looks up the expense + settings to build the email.
 */
export async function sendExpenseNotification(
  siteId: string,
  expenseId: string,
  type: ExpenseEmailType,
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailEnabled()) {
    return { success: false, error: "Email not configured" };
  }

  const resend = getResend();
  if (!resend) {
    return { success: false, error: "Resend client not available" };
  }

  try {
    const supabase = await createClient() as any;

    // Get the expense
    const { data: expense } = await supabase
      .from(INV_TABLES.expenses)
      .select("*")
      .eq("id", expenseId)
      .single();
    if (!expense) return { success: false, error: "Expense not found" };

    // Get settings for company name / email
    const { data: settings } = await supabase
      .from(INV_TABLES.settings)
      .select("company_name, company_email")
      .eq("site_id", siteId)
      .single();

    const companyName = settings?.company_name || "Your Company";
    const adminEmail = settings?.company_email;
    if (!adminEmail) return { success: false, error: "No admin email configured" };

    const amount = formatCurrency(expense.amount, expense.currency || "ZMW");
    const { subject, html } = renderExpenseEmail(type, {
      description: expense.description,
      amount,
      expenseNumber: expense.expense_number || expenseId.slice(0, 8),
      companyName,
      rejectionReason: expense.rejection_reason || null,
      expenseUrl: `${APP_URL}/sites/${siteId}/invoicing/expenses/${expenseId}`,
    });

    await resend.emails.send({
      from: getEmailFrom(),
      to: [adminEmail],
      subject,
      html,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send email" };
  }
}

// ─── Render ────────────────────────────────────────────────────

interface ExpenseEmailRenderData {
  description: string;
  amount: string;
  expenseNumber: string;
  companyName: string;
  rejectionReason: string | null;
  expenseUrl: string;
}

function renderExpenseEmail(
  type: ExpenseEmailType,
  data: ExpenseEmailRenderData,
): { subject: string; html: string } {
  const { description, amount, expenseNumber, companyName, rejectionReason, expenseUrl } = data;

  const wrapper = (title: string, body: string) => `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="background:#f9fafb;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
        <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">${title}</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#6b7280;">Expense</td><td style="padding:6px 0;font-weight:600;">#${expenseNumber}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Description</td><td style="padding:6px 0;">${description}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Amount</td><td style="padding:6px 0;font-weight:600;">${amount}</td></tr>
        </table>
        ${body}
        <div style="margin-top:24px;">
          <a href="${expenseUrl}" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">View Expense</a>
        </div>
      </div>
      <p style="margin-top:16px;font-size:12px;color:#9ca3af;text-align:center;">Sent by ${companyName} via DMSuite</p>
    </div>`;

  switch (type) {
    case "submitted":
      return {
        subject: `New Expense Submitted: #${expenseNumber}`,
        html: wrapper(
          "New Expense Submitted",
          `<p style="color:#6b7280;">A new expense has been submitted and is awaiting approval.</p>`,
        ),
      };

    case "auto_approved":
      return {
        subject: `Expense Auto-Approved: #${expenseNumber}`,
        html: wrapper(
          "Expense Auto-Approved",
          `<p style="color:#059669;">This expense was automatically approved because it falls below the approval threshold.</p>`,
        ),
      };

    case "approved":
      return {
        subject: `Expense Approved: #${expenseNumber}`,
        html: wrapper(
          "Expense Approved",
          `<p style="color:#059669;">This expense has been approved.</p>`,
        ),
      };

    case "rejected":
      return {
        subject: `Expense Rejected: #${expenseNumber}`,
        html: wrapper(
          "Expense Rejected",
          `<p style="color:#dc2626;">This expense has been rejected.</p>
           ${rejectionReason ? `<p style="margin-top:8px;padding:12px;background:#fef2f2;border-radius:6px;color:#991b1b;"><strong>Reason:</strong> ${rejectionReason}</p>` : ""}`,
        ),
      };
  }
}
