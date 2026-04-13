/**
 * Invoicing Module - Activity Types
 *
 * Phase INV-01: Database Foundation
 *
 * Types for the invoice activity audit trail.
 * Maps to mod_invmod01_invoice_activity table.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type ActivityEntityType =
  | "invoice"
  | "credit_note"
  | "bill"
  | "purchase_order"
  | "payment"
  | "expense"
  | "recurring";

export type ActivityActorType = "user" | "system" | "client" | "automation";

// ============================================================================
// INVOICE ACTIVITY
// ============================================================================

export interface InvoiceActivity {
  id: string;
  siteId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  description: string | null;
  actorType: ActivityActorType | null;
  actorId: string | null;
  actorName: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
