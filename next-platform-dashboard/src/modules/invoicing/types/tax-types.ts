/**
 * Invoicing Module - Tax Types
 *
 * Phase INV-01: Database Foundation
 *
 * Types for tax rates. Maps to mod_invmod01_tax_rates table.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type TaxType = "inclusive" | "exclusive";

// ============================================================================
// TAX RATES
// ============================================================================

export interface TaxRate {
  id: string;
  siteId: string;
  name: string;
  rate: number;
  type: TaxType;
  isCompound: boolean;
  isDefault: boolean;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateTaxRateInput {
  name: string;
  rate: number;
  type?: TaxType;
  isCompound?: boolean;
  isDefault?: boolean;
  description?: string | null;
  sortOrder?: number;
}
