"use server";

/**
 * Invoicing Module — Email Template Service
 *
 * Phase INVFIX-09: Expanded email template system with 10 template types,
 * variable interpolation, per-site customization, and preview capability.
 *
 * Template types:
 * - invoice_sent, payment_received, overdue_reminder, late_fee_applied (existing)
 * - credit_note_issued, recurring_invoice, account_statement (new)
 * - dunning_warning, dunning_final, dunning_writeoff (new dunning stages)
 */

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type EmailTemplateType =
  | "invoice_sent"
  | "payment_received"
  | "overdue_reminder"
  | "late_fee_applied"
  | "credit_note_issued"
  | "recurring_invoice"
  | "account_statement"
  | "dunning_warning"
  | "dunning_final"
  | "dunning_writeoff";

export interface EmailTemplate {
  type: EmailTemplateType;
  label: string;
  description: string;
  defaultSubject: string;
  defaultBody: string;
  availableVariables: TemplateVariable[];
  category: "invoicing" | "payments" | "dunning";
}

export interface TemplateVariable {
  key: string;
  label: string;
  example: string;
}

export interface SiteEmailTemplateOverride {
  siteId: string;
  templateType: EmailTemplateType;
  subject: string | null;
  body: string | null;
  enabled: boolean;
}

export interface RenderedEmail {
  subject: string;
  body: string;
}

// ═══════════════════════════════════════════════════════════════
// SHARED VARIABLES
// ═══════════════════════════════════════════════════════════════

const COMMON_VARIABLES: TemplateVariable[] = [
  { key: "{{client_name}}", label: "Client Name", example: "John Doe" },
  { key: "{{company_name}}", label: "Company Name", example: "Acme Corp" },
  { key: "{{invoice_number}}", label: "Invoice Number", example: "INV-0042" },
  { key: "{{currency}}", label: "Currency Code", example: "ZMW" },
];

const AMOUNT_VARIABLES: TemplateVariable[] = [
  { key: "{{amount_due}}", label: "Amount Due", example: "K 1,500.00" },
  { key: "{{due_date}}", label: "Due Date", example: "15 March 2026" },
];

const OVERDUE_VARIABLES: TemplateVariable[] = [
  { key: "{{days_overdue}}", label: "Days Overdue", example: "14" },
];

const PAYMENT_VARIABLES: TemplateVariable[] = [
  { key: "{{amount_paid}}", label: "Amount Paid", example: "K 1,500.00" },
  {
    key: "{{payment_method}}",
    label: "Payment Method",
    example: "Bank Transfer",
  },
  {
    key: "{{remaining_balance}}",
    label: "Remaining Balance",
    example: "K 0.00",
  },
];

// ═══════════════════════════════════════════════════════════════
// DEFAULT TEMPLATES
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  // ─── Invoicing ─────────────────────────────────────────
  {
    type: "invoice_sent",
    label: "Invoice Sent",
    description: "Sent when a new invoice is issued to a client",
    category: "invoicing",
    defaultSubject: "Invoice {{invoice_number}} from {{company_name}}",
    defaultBody:
      "Hi {{client_name}},\n\nA new invoice has been created for you.\n\nInvoice: {{invoice_number}}\nAmount Due: {{amount_due}}\nDue Date: {{due_date}}\n\nPlease review and make payment at your earliest convenience.",
    availableVariables: [...COMMON_VARIABLES, ...AMOUNT_VARIABLES],
  },
  {
    type: "credit_note_issued",
    label: "Credit Note Issued",
    description: "Sent when a credit note is issued against an invoice",
    category: "invoicing",
    defaultSubject: "Credit Note for Invoice {{invoice_number}}",
    defaultBody:
      "Hi {{client_name}},\n\nA credit note has been issued against invoice {{invoice_number}}.\n\nCredit Amount: {{credit_amount}}\nReason: {{credit_reason}}\n\nThis credit has been applied to your account.",
    availableVariables: [
      ...COMMON_VARIABLES,
      { key: "{{credit_amount}}", label: "Credit Amount", example: "K 200.00" },
      {
        key: "{{credit_reason}}",
        label: "Credit Reason",
        example: "Goods returned",
      },
    ],
  },
  {
    type: "recurring_invoice",
    label: "Recurring Invoice Generated",
    description: "Sent when a recurring invoice is automatically generated",
    category: "invoicing",
    defaultSubject: "Recurring Invoice {{invoice_number}} — {{company_name}}",
    defaultBody:
      "Hi {{client_name}},\n\nYour recurring invoice has been generated.\n\nInvoice: {{invoice_number}}\nAmount Due: {{amount_due}}\nDue Date: {{due_date}}\n\nThis is an automatically scheduled invoice as per your agreement.",
    availableVariables: [...COMMON_VARIABLES, ...AMOUNT_VARIABLES],
  },
  {
    type: "account_statement",
    label: "Account Statement",
    description: "Periodic account statement sent to clients",
    category: "invoicing",
    defaultSubject: "Account Statement — {{company_name}}",
    defaultBody:
      "Hi {{client_name}},\n\nPlease find your account statement attached for the period ending {{statement_date}}.\n\nTotal Outstanding: {{total_outstanding}}\n\nPlease contact us if you have any queries regarding your account.",
    availableVariables: [
      ...COMMON_VARIABLES,
      {
        key: "{{statement_date}}",
        label: "Statement Date",
        example: "31 January 2026",
      },
      {
        key: "{{total_outstanding}}",
        label: "Total Outstanding",
        example: "K 5,200.00",
      },
    ],
  },

  // ─── Payments ──────────────────────────────────────────
  {
    type: "payment_received",
    label: "Payment Received",
    description: "Confirmation sent when a payment is recorded",
    category: "payments",
    defaultSubject: "Payment Received — {{invoice_number}}",
    defaultBody:
      "Hi {{client_name}},\n\nWe have received your payment for invoice {{invoice_number}}. Thank you!\n\nAmount Paid: {{amount_paid}}\nMethod: {{payment_method}}\nRemaining Balance: {{remaining_balance}}",
    availableVariables: [...COMMON_VARIABLES, ...PAYMENT_VARIABLES],
  },
  {
    type: "late_fee_applied",
    label: "Late Fee Applied",
    description: "Notification when a late fee is added to an overdue invoice",
    category: "payments",
    defaultSubject: "Late Fee Applied — {{invoice_number}}",
    defaultBody:
      "Hi {{client_name}},\n\nA late fee has been applied to invoice {{invoice_number}} due to overdue payment.\n\nLate Fee: {{late_fee_amount}}\nNew Total: {{new_total}}\nAmount Due: {{amount_due}}\n\nTo avoid additional charges, please make your payment promptly.",
    availableVariables: [
      ...COMMON_VARIABLES,
      ...AMOUNT_VARIABLES,
      {
        key: "{{late_fee_amount}}",
        label: "Late Fee Amount",
        example: "K 75.00",
      },
      {
        key: "{{new_total}}",
        label: "New Invoice Total",
        example: "K 1,575.00",
      },
    ],
  },

  // ─── Dunning ───────────────────────────────────────────
  {
    type: "overdue_reminder",
    label: "Overdue Reminder",
    description: "Friendly reminder for slightly overdue invoices (Day 1-7)",
    category: "dunning",
    defaultSubject: "Friendly Reminder: Invoice {{invoice_number}} is Past Due",
    defaultBody:
      "Hi {{client_name}},\n\nJust a friendly reminder that invoice {{invoice_number}} is now {{days_overdue}} days past due.\n\nAmount Due: {{amount_due}}\nOriginal Due Date: {{due_date}}\n\nPlease arrange payment at your earliest convenience. If you have already paid, please disregard this notice.",
    availableVariables: [
      ...COMMON_VARIABLES,
      ...AMOUNT_VARIABLES,
      ...OVERDUE_VARIABLES,
    ],
  },
  {
    type: "dunning_warning",
    label: "Dunning Warning",
    description: "Firm reminder for invoices 14-30 days overdue",
    category: "dunning",
    defaultSubject:
      "Payment Overdue — {{invoice_number}} ({{days_overdue}} days)",
    defaultBody:
      "Hi {{client_name}},\n\nThis is a formal reminder that invoice {{invoice_number}} is now {{days_overdue}} days past due.\n\nAmount Due: {{amount_due}}\n\nPlease arrange immediate payment to bring your account current. Continued non-payment may result in service disruption or additional fees.\n\nIf you are experiencing difficulties, please contact us to discuss payment arrangements.",
    availableVariables: [
      ...COMMON_VARIABLES,
      ...AMOUNT_VARIABLES,
      ...OVERDUE_VARIABLES,
    ],
  },
  {
    type: "dunning_final",
    label: "Final Notice",
    description: "Final notice before escalation (30-45 days overdue)",
    category: "dunning",
    defaultSubject:
      "FINAL NOTICE: Immediate Payment Required — {{invoice_number}}",
    defaultBody:
      "Hi {{client_name}},\n\nThis is a FINAL NOTICE regarding invoice {{invoice_number}}, which is now {{days_overdue}} days overdue.\n\nAmount Due: {{amount_due}}\n\nImmediate payment is required. Failure to settle this invoice within 7 days may result in:\n- Suspension of services\n- Referral to collections\n- Additional late fees\n\nPlease make payment immediately or contact us to arrange a payment plan.",
    availableVariables: [
      ...COMMON_VARIABLES,
      ...AMOUNT_VARIABLES,
      ...OVERDUE_VARIABLES,
    ],
  },
  {
    type: "dunning_writeoff",
    label: "Write-Off Notice",
    description:
      "Account flagged for write-off or collections (60+ days overdue)",
    category: "dunning",
    defaultSubject: "Account Referred for Collection — {{invoice_number}}",
    defaultBody:
      "Hi {{client_name}},\n\nDespite previous notices, invoice {{invoice_number}} remains unpaid ({{days_overdue}} days overdue).\n\nAmount Due: {{amount_due}}\n\nYour account has been flagged for write-off and may be referred to a collections agency. To prevent this, please contact us immediately to arrange payment.\n\nThis is our final communication regarding this matter before escalation.",
    availableVariables: [
      ...COMMON_VARIABLES,
      ...AMOUNT_VARIABLES,
      ...OVERDUE_VARIABLES,
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════

/**
 * Get all available email templates with per-site overrides merged in.
 */
export async function getEmailTemplates(
  siteId: string,
): Promise<
  (EmailTemplate & {
    customSubject?: string | null;
    customBody?: string | null;
    enabled: boolean;
  })[]
> {
  const supabase = (await createClient()) as any;

  // Load site-level overrides from settings metadata
  const { data: settings } = await supabase
    .from(INV_TABLES.settings)
    .select("metadata")
    .eq("site_id", siteId)
    .single();

  const metadata = (settings?.metadata as Record<string, unknown>) || {};
  const overrides =
    (metadata.email_template_overrides as Record<
      string,
      SiteEmailTemplateOverride
    >) || {};

  return DEFAULT_TEMPLATES.map((template) => {
    const override = overrides[template.type];
    return {
      ...template,
      customSubject: override?.subject ?? null,
      customBody: override?.body ?? null,
      enabled: override?.enabled ?? true,
    };
  });
}

/**
 * Save a per-site template override (subject, body, enabled toggle).
 */
export async function saveEmailTemplateOverride(
  siteId: string,
  templateType: EmailTemplateType,
  override: {
    subject?: string | null;
    body?: string | null;
    enabled?: boolean;
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = (await createClient()) as any;

  try {
    // Load current metadata
    const { data: settings } = await supabase
      .from(INV_TABLES.settings)
      .select("metadata")
      .eq("site_id", siteId)
      .single();

    const metadata = (settings?.metadata as Record<string, unknown>) || {};
    const overrides =
      (metadata.email_template_overrides as Record<string, any>) || {};

    overrides[templateType] = {
      ...(overrides[templateType] || {}),
      siteId,
      templateType,
      ...override,
    };

    await supabase
      .from(INV_TABLES.settings)
      .update({
        metadata: { ...metadata, email_template_overrides: overrides },
        updated_at: new Date().toISOString(),
      })
      .eq("site_id", siteId);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save template",
    };
  }
}

/**
 * Render a template with variables replaced by actual data.
 * Accepts camelCase variable keys and normalizes them to {{snake_case}} for interpolation.
 * Loads per-site overrides from settings metadata.
 */
export async function renderTemplate(
  siteId: string,
  templateType: EmailTemplateType,
  variables: Record<string, string>,
): Promise<RenderedEmail> {
  const template = DEFAULT_TEMPLATES.find((t) => t.type === templateType);
  if (!template) {
    return { subject: "Notification", body: "" };
  }

  // Load per-site overrides
  let customSubject: string | null = null;
  let customBody: string | null = null;
  try {
    const supabase = (await createClient()) as any;
    const { data: settings } = await supabase
      .from(INV_TABLES.settings)
      .select("metadata")
      .eq("site_id", siteId)
      .single();
    const metadata = (settings?.metadata as Record<string, unknown>) || {};
    const overrides =
      (metadata.email_template_overrides as Record<string, any>) || {};
    const override = overrides[templateType];
    if (override) {
      customSubject = override.subject ?? null;
      customBody = override.body ?? null;
    }
  } catch {
    // Fall back to defaults if override loading fails
  }

  // Normalize camelCase variables to {{snake_case}} format
  const normalized = normalizeVariables(variables);

  const subject = interpolate(
    customSubject || template.defaultSubject,
    normalized,
  );
  const body = interpolate(customBody || template.defaultBody, normalized);

  return { subject, body };
}

/**
 * Preview a template with example variable values.
 * Synchronous — uses only default template examples.
 */
export function previewTemplate(
  templateType: EmailTemplateType,
  customSubject?: string | null,
  customBody?: string | null,
): RenderedEmail {
  const template = DEFAULT_TEMPLATES.find((t) => t.type === templateType);
  if (!template) {
    return { subject: "Preview", body: "Template not found" };
  }

  // Build example variables map — already in {{key}} format
  const variables: Record<string, string> = {};
  for (const v of template.availableVariables) {
    variables[v.key] = v.example;
  }

  const subject = interpolate(
    customSubject || template.defaultSubject,
    variables,
  );
  const body = interpolate(customBody || template.defaultBody, variables);

  return { subject, body };
}

/**
 * Check if a specific email type is enabled for this site.
 */
export async function isEmailTypeEnabled(
  siteId: string,
  templateType: EmailTemplateType,
): Promise<boolean> {
  const supabase = (await createClient()) as any;

  const { data: settings } = await supabase
    .from(INV_TABLES.settings)
    .select("metadata")
    .eq("site_id", siteId)
    .single();

  const metadata = (settings?.metadata as Record<string, unknown>) || {};
  const overrides =
    (metadata.email_template_overrides as Record<string, any>) || {};
  const override = overrides[templateType];

  // Default is enabled unless explicitly disabled
  return override?.enabled !== false;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Convert camelCase variable keys to {{snake_case}} format for template interpolation.
 * e.g. { clientName: "Acme" } → { "{{client_name}}": "Acme" }
 * Keys already in {{...}} format are passed through unchanged.
 */
function normalizeVariables(
  vars: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    if (key.startsWith("{{") && key.endsWith("}}")) {
      result[key] = value;
    } else {
      // Convert camelCase to snake_case and wrap in {{ }}
      const snake = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      result[`{{${snake}}}`] = value;
    }
  }
  return result;
}

function interpolate(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    // Escape the value to prevent injection in rendered emails
    const safeValue = value.replace(/[<>&"]/g, (char) => {
      switch (char) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case '"':
          return "&quot;";
        default:
          return char;
      }
    });
    result = result.replaceAll(key, safeValue);
  }
  return result;
}
