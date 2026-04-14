/**
 * Marketing Audience Filters — Invoicing Financial Segmentation
 *
 * Phase INV-13: Cross-Module Deep Integration
 * Provides financial filter definitions for marketing audience builder.
 */

export interface AudienceFilter {
  id: string;
  label: string;
  description: string;
  category: string;
  type: "number" | "date" | "select" | "boolean";
  operators: string[];
  /** For select type: available options */
  options?: { value: string; label: string }[];
  /** Table to query for this filter value */
  sourceTable: string;
  /** Column or expression to evaluate */
  sourceField: string;
}

/**
 * Financial segmentation filters for the marketing audience builder.
 * These let marketers build segments based on invoicing/payment behaviour.
 */
export const INVOICING_AUDIENCE_FILTERS: AudienceFilter[] = [
  {
    id: "inv_total_invoiced",
    label: "Total Invoiced",
    description: "Total amount invoiced to the contact (in cents)",
    category: "Financial",
    type: "number",
    operators: ["equals", "greater_than", "less_than", "between"],
    sourceTable: "mod_invmod01_invoices",
    sourceField: "total_amount_cents",
  },
  {
    id: "inv_total_paid",
    label: "Total Paid",
    description: "Total amount paid by the contact (in cents)",
    category: "Financial",
    type: "number",
    operators: ["equals", "greater_than", "less_than", "between"],
    sourceTable: "mod_invmod01_payments",
    sourceField: "amount_cents",
  },
  {
    id: "inv_outstanding_balance",
    label: "Outstanding Balance",
    description: "Current outstanding balance across all invoices (in cents)",
    category: "Financial",
    type: "number",
    operators: ["equals", "greater_than", "less_than", "between"],
    sourceTable: "mod_invmod01_invoices",
    sourceField: "total_amount_cents - amount_paid_cents",
  },
  {
    id: "inv_last_invoice_date",
    label: "Last Invoice Date",
    description: "Date of the most recent invoice",
    category: "Financial",
    type: "date",
    operators: ["before", "after", "between", "within_last_days"],
    sourceTable: "mod_invmod01_invoices",
    sourceField: "issue_date",
  },
  {
    id: "inv_last_payment_date",
    label: "Last Payment Date",
    description: "Date of the most recent payment",
    category: "Financial",
    type: "date",
    operators: ["before", "after", "between", "within_last_days"],
    sourceTable: "mod_invmod01_payments",
    sourceField: "payment_date",
  },
  {
    id: "inv_payment_risk",
    label: "Payment Risk",
    description: "Client payment risk rating based on payment history",
    category: "Financial",
    type: "select",
    operators: ["equals", "not_equals"],
    options: [
      { value: "low", label: "Low Risk" },
      { value: "medium", label: "Medium Risk" },
      { value: "high", label: "High Risk" },
    ],
    sourceTable: "mod_invmod01_invoices",
    sourceField: "payment_risk",
  },
  {
    id: "inv_is_active_client",
    label: "Is Active Client",
    description: "Whether the contact has an invoice in the last 90 days",
    category: "Financial",
    type: "boolean",
    operators: ["equals"],
    sourceTable: "mod_invmod01_invoices",
    sourceField: "issue_date",
  },
  {
    id: "inv_overdue_count",
    label: "Overdue Invoices Count",
    description: "Number of currently overdue invoices",
    category: "Financial",
    type: "number",
    operators: ["equals", "greater_than", "less_than"],
    sourceTable: "mod_invmod01_invoices",
    sourceField: "status",
  },
  {
    id: "inv_average_days_to_pay",
    label: "Average Days to Pay",
    description: "Average number of days between invoice date and payment",
    category: "Financial",
    type: "number",
    operators: ["equals", "greater_than", "less_than", "between"],
    sourceTable: "mod_invmod01_payments",
    sourceField: "payment_date - invoice.issue_date",
  },
];

/**
 * Get all invoicing audience filters.
 */
export function getInvoicingAudienceFilters(): AudienceFilter[] {
  return INVOICING_AUDIENCE_FILTERS;
}

/**
 * Get a specific filter by ID.
 */
export function getInvoicingAudienceFilter(
  filterId: string,
): AudienceFilter | undefined {
  return INVOICING_AUDIENCE_FILTERS.find((f) => f.id === filterId);
}
