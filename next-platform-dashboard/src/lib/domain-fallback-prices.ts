// src/lib/domain-fallback-prices.ts
// Centralized fallback domain prices (wholesale/cost basis).
// Used when the ResellerClub API is unavailable or not configured.
// These approximate the RC reseller-cost prices so that markup still produces
// reasonable retail prices.
//
// IMPORTANT: Keep this as the SINGLE source of truth. Both the domain search
// action (domains.ts) and the billing/checkout action (domain-billing.ts) import
// from here so prices stay synchronized.

export type FallbackPriceEntry = {
  register: Record<number, number>;
  renew: Record<number, number>;
  transfer: number;
};

/**
 * Fallback wholesale (cost) prices by TLD.
 * Approximate ResellerClub reseller-cost pricing.
 * All values are PER-YEAR rates in USD (matching RC API format).
 * Consumer code computes total as: register[N] * N.
 */
export const FALLBACK_PRICES: Record<string, FallbackPriceEntry> = {
  // --- Popular gTLDs ---
  '.com':  { register: { 1: 9.99 },  renew: { 1: 10.99 }, transfer: 9.99 },
  '.net':  { register: { 1: 11.99 }, renew: { 1: 12.99 }, transfer: 11.99 },
  '.org':  { register: { 1: 10.99 }, renew: { 1: 11.99 }, transfer: 10.99 },
  '.info': { register: { 1: 3.99 },  renew: { 1: 18.99 }, transfer: 9.99 },
  '.biz':  { register: { 1: 12.99 }, renew: { 1: 15.99 }, transfer: 12.99 },
  '.name': { register: { 1: 9.99 },  renew: { 1: 10.99 }, transfer: 9.99 },

  // --- Tech TLDs ---
  '.io':       { register: { 1: 35.99 },  renew: { 1: 39.99 },  transfer: 35.99 },
  '.co':       { register: { 1: 25.99 },  renew: { 1: 28.99 },  transfer: 25.99 },
  '.app':      { register: { 1: 15.99 },  renew: { 1: 17.99 },  transfer: 15.99 },
  '.dev':      { register: { 1: 13.99 },  renew: { 1: 15.99 },  transfer: 13.99 },
  '.tech':     { register: { 1: 5.99 },   renew: { 1: 39.99 },  transfer: 35.99 },
  '.ai':       { register: { 1: 69.99 },  renew: { 1: 69.99 },  transfer: 69.99 },
  '.cloud':    { register: { 1: 9.99 },   renew: { 1: 21.99 },  transfer: 9.99 },
  '.digital':  { register: { 1: 3.99 },   renew: { 1: 29.99 },  transfer: 25.99 },
  '.software': { register: { 1: 25.99 },  renew: { 1: 29.99 },  transfer: 25.99 },
  '.systems':  { register: { 1: 19.99 },  renew: { 1: 22.99 },  transfer: 19.99 },
  '.solutions':{ register: { 1: 9.99 },   renew: { 1: 22.99 },  transfer: 19.99 },
  '.website':  { register: { 1: 2.99 },   renew: { 1: 22.99 },  transfer: 19.99 },
  '.site':     { register: { 1: 2.99 },   renew: { 1: 29.99 },  transfer: 25.99 },
  '.online':   { register: { 1: 2.99 },   renew: { 1: 29.99 },  transfer: 25.99 },
  '.space':    { register: { 1: 2.99 },   renew: { 1: 19.99 },  transfer: 15.99 },
  '.host':     { register: { 1: 79.99 },  renew: { 1: 79.99 },  transfer: 79.99 },
  '.hosting':  { register: { 1: 299.99 }, renew: { 1: 299.99 }, transfer: 299.99 },
  '.network':  { register: { 1: 19.99 },  renew: { 1: 22.99 },  transfer: 19.99 },

  // --- Business TLDs ---
  '.store':       { register: { 1: 3.99 },  renew: { 1: 49.99 },  transfer: 39.99 },
  '.shop':        { register: { 1: 2.99 },  renew: { 1: 29.99 },  transfer: 25.99 },
  '.agency':      { register: { 1: 9.99 },  renew: { 1: 22.99 },  transfer: 19.99 },
  '.company':     { register: { 1: 9.99 },  renew: { 1: 12.99 },  transfer: 9.99 },
  '.consulting':  { register: { 1: 25.99 }, renew: { 1: 29.99 },  transfer: 25.99 },
  '.services':    { register: { 1: 9.99 },  renew: { 1: 29.99 },  transfer: 25.99 },
  '.pro':         { register: { 1: 3.99 },  renew: { 1: 18.99 },  transfer: 14.99 },
  '.media':       { register: { 1: 9.99 },  renew: { 1: 29.99 },  transfer: 25.99 },
  '.studio':      { register: { 1: 19.99 }, renew: { 1: 24.99 },  transfer: 19.99 },
  '.design':      { register: { 1: 39.99 }, renew: { 1: 44.99 },  transfer: 39.99 },
  '.marketing':   { register: { 1: 25.99 }, renew: { 1: 29.99 },  transfer: 25.99 },
  '.ventures':    { register: { 1: 39.99 }, renew: { 1: 45.99 },  transfer: 39.99 },
  '.enterprises': { register: { 1: 25.99 }, renew: { 1: 29.99 },  transfer: 25.99 },
  '.group':       { register: { 1: 15.99 }, renew: { 1: 18.99 },  transfer: 15.99 },
  '.global':      { register: { 1: 59.99 }, renew: { 1: 64.99 },  transfer: 59.99 },
  '.world':       { register: { 1: 3.99 },  renew: { 1: 29.99 },  transfer: 25.99 },
  '.international':{ register: { 1: 19.99 },renew: { 1: 22.99 },  transfer: 19.99 },

  // --- Creative & Community TLDs ---
  '.blog':        { register: { 1: 2.99 },  renew: { 1: 25.99 },  transfer: 19.99 },
  '.art':         { register: { 1: 12.99 }, renew: { 1: 14.99 },  transfer: 12.99 },
  '.photography': { register: { 1: 19.99 }, renew: { 1: 22.99 },  transfer: 19.99 },
  '.graphics':    { register: { 1: 19.99 }, renew: { 1: 22.99 },  transfer: 19.99 },
  '.community':   { register: { 1: 25.99 }, renew: { 1: 29.99 },  transfer: 25.99 },
  '.social':      { register: { 1: 25.99 }, renew: { 1: 29.99 },  transfer: 25.99 },
  '.education':   { register: { 1: 19.99 }, renew: { 1: 22.99 },  transfer: 19.99 },

  // --- Country-code TLDs ---
  '.us':    { register: { 1: 9.99 },  renew: { 1: 10.99 }, transfer: 9.99 },
  '.uk':    { register: { 1: 7.99 },  renew: { 1: 8.99 },  transfer: 7.99 },
  '.ca':    { register: { 1: 12.99 }, renew: { 1: 14.99 }, transfer: 12.99 },
  '.de':    { register: { 1: 8.99 },  renew: { 1: 9.99 },  transfer: 8.99 },
  '.eu':    { register: { 1: 7.99 },  renew: { 1: 9.99 },  transfer: 7.99 },
  '.in':    { register: { 1: 8.99 },  renew: { 1: 9.99 },  transfer: 8.99 },
  '.au':    { register: { 1: 14.99 }, renew: { 1: 16.99 }, transfer: 14.99 },
  '.me':    { register: { 1: 5.99 },  renew: { 1: 17.99 }, transfer: 14.99 },
  '.tv':    { register: { 1: 29.99 }, renew: { 1: 34.99 }, transfer: 29.99 },
  '.cc':    { register: { 1: 9.99 },  renew: { 1: 12.99 }, transfer: 9.99 },
  '.co.za': { register: { 1: 5.99 },  renew: { 1: 6.99 },  transfer: 5.99 },
  '.za':    { register: { 1: 5.99 },  renew: { 1: 6.99 },  transfer: 5.99 },
  '.fr':    { register: { 1: 9.99 },  renew: { 1: 11.99 }, transfer: 9.99 },
  '.africa':{ register: { 1: 15.99 }, renew: { 1: 17.99 }, transfer: 15.99 },

  // --- Lifestyle ---
  '.life':  { register: { 1: 3.99 },  renew: { 1: 29.99 }, transfer: 25.99 },
  '.live':  { register: { 1: 3.99 },  renew: { 1: 22.99 }, transfer: 19.99 },
  '.email': { register: { 1: 3.99 },  renew: { 1: 22.99 }, transfer: 19.99 },

  // --- Other popular ---
  '.xyz':   { register: { 1: 1.99 },  renew: { 1: 12.99 }, transfer: 9.99 },
  '.club':  { register: { 1: 3.99 },  renew: { 1: 15.99 }, transfer: 12.99 },
  '.today': { register: { 1: 3.99 },  renew: { 1: 22.99 }, transfer: 19.99 },
  '.news':  { register: { 1: 19.99 }, renew: { 1: 22.99 }, transfer: 19.99 },
  '.guru':  { register: { 1: 9.99 },  renew: { 1: 29.99 }, transfer: 25.99 },
  '.zone':  { register: { 1: 9.99 },  renew: { 1: 29.99 }, transfer: 25.99 },
  '.rocks': { register: { 1: 3.99 },  renew: { 1: 14.99 }, transfer: 12.99 },
  '.top':   { register: { 1: 2.99 },  renew: { 1: 8.99 },  transfer: 6.99 },
  '.mobi':  { register: { 1: 5.99 },  renew: { 1: 19.99 }, transfer: 15.99 },

  // --- Professional ---
  '.expert':   { register: { 1: 39.99 }, renew: { 1: 49.99 }, transfer: 39.99 },
  '.academy':  { register: { 1: 25.99 }, renew: { 1: 29.99 }, transfer: 25.99 },
  '.training': { register: { 1: 25.99 }, renew: { 1: 29.99 }, transfer: 25.99 },
};

/** Default fallback price for TLDs not in the dictionary (per-year rate) */
export const DEFAULT_FALLBACK_PRICE: FallbackPriceEntry = {
  register: { 1: 14.99 },
  renew: { 1: 16.99 },
  transfer: 14.99,
};

/**
 * Get fallback wholesale prices for a given TLD.
 * Returns a consistent price structure whether or not the TLD is known.
 * Automatically populates multi-year tenure keys (2, 3, 5, 10) with the
 * same per-year rate as the 1-year rate (no multi-year discount in fallback).
 * Consumer code computes total as: register[N] * N.
 */
export function getFallbackPrice(tld: string): FallbackPriceEntry {
  const base = FALLBACK_PRICES[tld] || DEFAULT_FALLBACK_PRICE;
  
  // Fill in missing year keys with the same per-year rate (no multi-year discount)
  const registerPerYear = base.register[1] || 14.99;
  const renewPerYear = base.renew[1] || 16.99;
  
  const register: Record<number, number> = { ...base.register };
  const renew: Record<number, number> = { ...base.renew };
  
  for (const yr of [1, 2, 3, 5, 10]) {
    if (!register[yr] || register[yr] <= 0) {
      register[yr] = registerPerYear; // same per-year rate for all tenures
    }
    if (!renew[yr] || renew[yr] <= 0) {
      renew[yr] = renewPerYear; // same per-year rate for all tenures
    }
  }
  
  return {
    register,
    renew,
    transfer: base.transfer,
  };
}
