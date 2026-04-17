/**
 * Invoicing Module - Constants
 *
 * Phase INV-01: Database Foundation
 *
 * Table name mappings, status configurations, and labels.
 */

import type {
  InvoiceStatus,
  InvoiceSourceType,
  ItemType,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  RecurringStatus,
  RecurringFrequency,
  CreditNoteStatus,
  ExpenseStatus,
  BillStatus,
  POStatus,
  ActivityEntityType,
  ActivityActorType,
  TaxType,
} from "../types";

// ─── Table Names ───────────────────────────────────────────────
export const INV_TABLES = {
  settings: "mod_invmod01_settings",
  taxRates: "mod_invmod01_tax_rates",
  items: "mod_invmod01_items",
  invoices: "mod_invmod01_invoices",
  invoiceLineItems: "mod_invmod01_invoice_line_items",
  payments: "mod_invmod01_payments",
  recurringInvoices: "mod_invmod01_recurring_invoices",
  recurringLineItems: "mod_invmod01_recurring_line_items",
  creditNotes: "mod_invmod01_credit_notes",
  creditNoteLineItems: "mod_invmod01_credit_note_line_items",
  creditApplications: "mod_invmod01_credit_applications",
  expenses: "mod_invmod01_expenses",
  expenseCategories: "mod_invmod01_expense_categories",
  vendors: "mod_invmod01_vendors",
  bills: "mod_invmod01_bills",
  billLineItems: "mod_invmod01_bill_line_items",
  purchaseOrders: "mod_invmod01_purchase_orders",
  invoiceActivity: "mod_invmod01_invoice_activity",
} as const;

// ─── Invoice Status ────────────────────────────────────────────
export const INVOICE_STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; color: string; bgColor: string; description: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    description: "Invoice is being composed",
  },
  sent: {
    label: "Sent",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    description: "Invoice has been sent to client",
  },
  viewed: {
    label: "Viewed",
    color: "text-indigo-700 dark:text-indigo-300",
    bgColor: "bg-indigo-100 dark:bg-indigo-900",
    description: "Client has viewed the invoice",
  },
  partial: {
    label: "Partial",
    color: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
    description: "Partially paid",
  },
  paid: {
    label: "Paid",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900",
    description: "Fully paid",
  },
  overdue: {
    label: "Overdue",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900",
    description: "Payment is past due",
  },
  void: {
    label: "Void",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    description: "Invoice has been voided",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900",
    description: "Invoice was cancelled",
  },
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  partial: "Partial",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
  cancelled: "Cancelled",
};

export const VALID_INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> =
  {
    draft: ["sent", "void"],
    sent: ["viewed", "partial", "paid", "overdue", "void"],
    viewed: ["partial", "paid", "overdue", "void"],
    partial: ["paid", "overdue", "void"],
    paid: [],
    overdue: ["partial", "paid", "void"],
    void: [],
    cancelled: [],
  };

// ─── Invoice Source Types ──────────────────────────────────────
export const INVOICE_SOURCE_LABELS: Record<InvoiceSourceType, string> = {
  manual: "Manual",
  recurring: "Recurring",
  booking: "Booking",
  ecommerce: "E-Commerce",
  crm_deal: "CRM Deal",
  automation: "Automation",
  quote_conversion: "Quote Conversion",
};

// ─── Item Types ────────────────────────────────────────────────
export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  service: "Service",
  product: "Product",
  expense: "Expense",
};

// ─── Payment Methods ───────────────────────────────────────────
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  mobile_money: "Mobile Money",
  card: "Card",
  cheque: "Cheque",
  paypal: "PayPal",
  other: "Other",
  online: "Online",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  payment: "Payment",
  refund: "Refund",
};

// ─── Recurring Frequency ───────────────────────────────────────
export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annually: "Semi-Annually",
  annually: "Annually",
  custom: "Custom",
};

export const RECURRING_STATUS_LABELS: Record<RecurringStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const RECURRING_STATUS_CONFIG: Record<
  RecurringStatus,
  { label: string; color: string; bgColor: string }
> = {
  active: {
    label: "Active",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
  paused: {
    label: "Paused",
    color: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
  },
  completed: {
    label: "Completed",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900",
  },
};

// ─── Credit Note Status ────────────────────────────────────────
export const CREDIT_NOTE_STATUS_LABELS: Record<CreditNoteStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  partially_applied: "Partially Applied",
  fully_applied: "Fully Applied",
  void: "Void",
};

export const CREDIT_NOTE_STATUS_CONFIG: Record<
  CreditNoteStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  issued: {
    label: "Issued",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900",
  },
  partially_applied: {
    label: "Partially Applied",
    color: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
  },
  fully_applied: {
    label: "Fully Applied",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
  void: {
    label: "Void",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
};

// ─── Expense Status ────────────────────────────────────────────
export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
  void: "Void",
};

export const EXPENSE_STATUS_CONFIG: Record<
  ExpenseStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: "Pending",
    color: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
  },
  approved: {
    label: "Approved",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900",
  },
  paid: {
    label: "Paid",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
  void: {
    label: "Void",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
};

// ─── Bill Status ───────────────────────────────────────────────
export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  draft: "Draft",
  received: "Received",
  partial: "Partial",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export const BILL_STATUS_CONFIG: Record<
  BillStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  received: {
    label: "Received",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900",
  },
  partial: {
    label: "Partial",
    color: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
  },
  paid: {
    label: "Paid",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
  overdue: {
    label: "Overdue",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900",
  },
  void: {
    label: "Void",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
};

// ─── Purchase Order Status ─────────────────────────────────────
export const PO_STATUS_LABELS: Record<POStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  acknowledged: "Acknowledged",
  partially_received: "Partially Received",
  received: "Received",
  cancelled: "Cancelled",
};

export const PO_STATUS_CONFIG: Record<
  POStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  sent: {
    label: "Sent",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900",
  },
  acknowledged: {
    label: "Acknowledged",
    color: "text-indigo-700 dark:text-indigo-300",
    bgColor: "bg-indigo-100 dark:bg-indigo-900",
  },
  partially_received: {
    label: "Partially Received",
    color: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
  },
  received: {
    label: "Received",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900",
  },
};

// ─── Activity Types ────────────────────────────────────────────
export const ACTIVITY_ENTITY_TYPE_LABELS: Record<ActivityEntityType, string> = {
  invoice: "Invoice",
  credit_note: "Credit Note",
  bill: "Bill",
  purchase_order: "Purchase Order",
  payment: "Payment",
  expense: "Expense",
  recurring: "Recurring Invoice",
};

export const ACTIVITY_ACTOR_TYPE_LABELS: Record<ActivityActorType, string> = {
  user: "User",
  system: "System",
  client: "Client",
  automation: "Automation",
};

// ─── Tax Types ─────────────────────────────────────────────────
export const TAX_TYPE_LABELS: Record<TaxType, string> = {
  inclusive: "Inclusive",
  exclusive: "Exclusive",
};

// ─── Default Expense Categories (for bootstrap) ────────────────
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Office Supplies", color: "#3B82F6", icon: "Package" },
  { name: "Travel", color: "#8B5CF6", icon: "Plane" },
  { name: "Software", color: "#06B6D4", icon: "Monitor" },
  { name: "Utilities", color: "#F59E0B", icon: "Zap" },
  { name: "Rent", color: "#EF4444", icon: "Home" },
  { name: "Marketing", color: "#EC4899", icon: "Megaphone" },
  { name: "Professional Services", color: "#10B981", icon: "Briefcase" },
  { name: "Insurance", color: "#6366F1", icon: "Shield" },
  { name: "Equipment", color: "#F97316", icon: "Wrench" },
  { name: "Miscellaneous", color: "#6B7280", icon: "MoreHorizontal" },
] as const;

// ─── Default Settings ──────────────────────────────────────────
export const DEFAULT_INVOICING_SETTINGS = {
  invoicePrefix: "INV",
  invoiceNextNumber: 1,
  invoiceNumberFormat: "{prefix}-{year}-{number}",
  invoicePadding: 4,
  creditNotePrefix: "CN",
  creditNoteNextNumber: 1,
  billPrefix: "BILL",
  billNextNumber: 1,
  poPrefix: "PO",
  poNextNumber: 1,
  defaultCurrency: "ZMW",
  defaultPaymentTermsDays: 30,
  defaultPaymentTermsLabel: "Net 30",
  lateFeeEnabled: false,
  lateFeeType: "percentage" as const,
  lateFeeAmount: 200,
  lateFeeGraceDays: 7,
  overdueReminderEnabled: true,
  overdueReminderSchedule: [7, 14, 30],
  brandColor: "#000000",
  onlinePaymentEnabled: false,
  timezone: "Africa/Lusaka",
} as const;

// ─── Limits ────────────────────────────────────────────────────
export const INV_LIMITS = {
  maxLineItems: 100,
  maxTags: 20,
  maxNoteLength: 5000,
  maxTermsLength: 10000,
  maxAttachmentSizeMB: 10,
} as const;
