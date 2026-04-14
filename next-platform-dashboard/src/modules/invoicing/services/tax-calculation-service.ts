/**
 * Invoicing Module - Tax Calculation Service
 *
 * Phase INV-08: Tax Management, Multi-Currency & Compliance
 *
 * Handles inclusive, exclusive, and compound tax calculations.
 * All amounts are in CENTS (integers).
 */

import type { TaxRate } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface TaxCalculationInput {
  /** Line subtotal after discount, in CENTS */
  subtotal: number;
  /** Tax rates to apply */
  taxRates: TaxRate[];
}

export interface TaxCalculationResult {
  /** Subtotal (pre-tax amount) in CENTS */
  subtotal: number;
  /** Total tax amount in CENTS */
  taxAmount: number;
  /** Line total (subtotal + tax for exclusive; equals original for inclusive) in CENTS */
  total: number;
  /** Breakdown by tax rate */
  breakdown: TaxBreakdownItem[];
}

export interface TaxBreakdownItem {
  taxRateId: string;
  taxRateName: string;
  rate: number;
  type: "inclusive" | "exclusive";
  isCompound: boolean;
  taxAmount: number; // in CENTS
}

// ============================================================================
// EXCLUSIVE TAX (most common — Zambia default)
// ============================================================================

/**
 * Exclusive tax: tax is ADDED on top of the subtotal.
 *
 * line_subtotal = quantity × unit_price - discount
 * tax_amount = line_subtotal × (tax_rate / 100)
 * line_total = line_subtotal + tax_amount
 */
function calculateExclusiveTax(subtotal: number, rate: number): number {
  return Math.round((subtotal * rate) / 100);
}

// ============================================================================
// INCLUSIVE TAX (price already includes tax)
// ============================================================================

/**
 * Inclusive tax: tax is extracted FROM the total.
 *
 * line_total = quantity × unit_price - discount (this IS the total)
 * tax_amount = line_total × (tax_rate / (100 + tax_rate))
 * line_subtotal = line_total - tax_amount
 */
function calculateInclusiveTax(total: number, rate: number): number {
  return Math.round((total * rate) / (100 + rate));
}

// ============================================================================
// COMPOUND TAX (tax on tax)
// ============================================================================

/**
 * Compound tax: applied on top of subtotal + sum of non-compound taxes.
 *
 * base_tax = subtotal × (base_rate / 100)
 * compound_tax = (subtotal + base_tax) × (compound_rate / 100)
 * total_tax = base_tax + compound_tax
 */

// ============================================================================
// MAIN CALCULATION
// ============================================================================

/**
 * Calculate taxes for a line item given one or more tax rates.
 *
 * Supports:
 * - Single exclusive tax
 * - Single inclusive tax
 * - Multiple tax rates (non-compound first, then compound)
 * - Mixed inclusive/exclusive *not* supported — all rates on a line item
 *   should be the same type. If mixed, exclusive takes precedence.
 */
export function calculateTaxes(
  input: TaxCalculationInput,
): TaxCalculationResult {
  const { subtotal, taxRates } = input;

  if (!taxRates.length || subtotal === 0) {
    return {
      subtotal,
      taxAmount: 0,
      total: subtotal,
      breakdown: [],
    };
  }

  // Separate compound vs non-compound
  const nonCompound = taxRates.filter((r) => !r.isCompound);
  const compound = taxRates.filter((r) => r.isCompound);

  // Determine tax type from the first rate (all should match)
  const taxType = taxRates[0].type || "exclusive";

  const breakdown: TaxBreakdownItem[] = [];

  if (taxType === "inclusive") {
    // For inclusive: the subtotal parameter IS the total (tax-inclusive amount)
    const inclusiveTotal = subtotal;

    // Combined rate for proper extraction
    const nonCompoundTotalRate = nonCompound.reduce(
      (sum, r) => sum + r.rate,
      0,
    );

    // Calculate non-compound taxes (extract from total)
    let nonCompoundTaxTotal = 0;
    for (const rate of nonCompound) {
      const taxAmount = calculateInclusiveTax(inclusiveTotal, rate.rate);
      nonCompoundTaxTotal += taxAmount;
      breakdown.push({
        taxRateId: rate.id,
        taxRateName: rate.name,
        rate: rate.rate,
        type: "inclusive",
        isCompound: false,
        taxAmount,
      });
    }

    // For compound taxes on inclusive, extract from (total - non-compound taxes)
    let compoundTaxTotal = 0;
    const baseForCompound = inclusiveTotal - nonCompoundTaxTotal;
    for (const rate of compound) {
      const taxAmount = calculateInclusiveTax(baseForCompound, rate.rate);
      compoundTaxTotal += taxAmount;
      breakdown.push({
        taxRateId: rate.id,
        taxRateName: rate.name,
        rate: rate.rate,
        type: "inclusive",
        isCompound: true,
        taxAmount,
      });
    }

    const totalTax = nonCompoundTaxTotal + compoundTaxTotal;
    const actualSubtotal = inclusiveTotal - totalTax;

    return {
      subtotal: actualSubtotal,
      taxAmount: totalTax,
      total: inclusiveTotal,
      breakdown,
    };
  }

  // EXCLUSIVE tax (default)
  let nonCompoundTaxTotal = 0;
  for (const rate of nonCompound) {
    const taxAmount = calculateExclusiveTax(subtotal, rate.rate);
    nonCompoundTaxTotal += taxAmount;
    breakdown.push({
      taxRateId: rate.id,
      taxRateName: rate.name,
      rate: rate.rate,
      type: "exclusive",
      isCompound: false,
      taxAmount,
    });
  }

  // Compound taxes are applied on (subtotal + non-compound taxes)
  let compoundTaxTotal = 0;
  const compoundBase = subtotal + nonCompoundTaxTotal;
  for (const rate of compound) {
    const taxAmount = calculateExclusiveTax(compoundBase, rate.rate);
    compoundTaxTotal += taxAmount;
    breakdown.push({
      taxRateId: rate.id,
      taxRateName: rate.name,
      rate: rate.rate,
      type: "exclusive",
      isCompound: true,
      taxAmount,
    });
  }

  const totalTax = nonCompoundTaxTotal + compoundTaxTotal;

  return {
    subtotal,
    taxAmount: totalTax,
    total: subtotal + totalTax,
    breakdown,
  };
}

/**
 * Calculate line item totals with multi-tax support.
 * Enhanced version of the original calculateLineItemTotals.
 */
export function calculateLineItemTotalsWithTax(
  quantity: number,
  unitPrice: number,
  discountType: "percentage" | "fixed" | null,
  discountValue: number,
  taxRates: TaxRate[],
): TaxCalculationResult & { discountAmount: number; rawSubtotal: number } {
  const rawSubtotal = Math.round(quantity * unitPrice);

  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = Math.round((rawSubtotal * discountValue) / 10000);
  } else if (discountType === "fixed") {
    discountAmount = discountValue;
  }

  const afterDiscount = rawSubtotal - discountAmount;

  const result = calculateTaxes({
    subtotal: afterDiscount,
    taxRates,
  });

  return {
    ...result,
    discountAmount,
    rawSubtotal,
  };
}
