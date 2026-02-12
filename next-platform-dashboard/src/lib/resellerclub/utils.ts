// src/lib/resellerclub/utils.ts
// ResellerClub Utility Functions

import { SUPPORTED_TLDS, TLD_CATEGORIES } from './config';

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
/**
 * Parse a domain name into its components
 */
export function parseDomainName(domainName: string): {
  sld: string;
  tld: string;
  full: string;
} {
  const normalized = domainName.toLowerCase().trim();
  const parts = normalized.split('.');
  
  return {
    sld: parts.slice(0, -1).join('.'),
    tld: '.' + parts[parts.length - 1],
    full: normalized,
  };
}

/**
 * Validate domain name format
 */
export function isValidDomainName(domainName: string): boolean {
  const normalized = domainName.toLowerCase().trim();
  
  // Basic pattern check
  const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/;
  if (!pattern.test(normalized)) {
    return false;
  }
  
  // Check SLD length
  const parts = normalized.split('.');
  const sld = parts[0];
  if (sld.length < 2 || sld.length > 63) {
    return false;
  }
  
  // Check for consecutive hyphens
  if (sld.includes('--')) {
    return false;
  }
  
  return true;
}

/**
 * Check if TLD is supported
 */
export function isSupportedTld(tld: string): boolean {
  const normalizedTld = tld.startsWith('.') ? tld : '.' + tld;
  return SUPPORTED_TLDS.includes(normalizedTld as (typeof SUPPORTED_TLDS)[number]);
}

/**
 * Get TLD category
 */
export function getTldCategory(tld: string): string | null {
  const normalizedTld = tld.startsWith('.') ? tld : '.' + tld;
  
  for (const [category, tlds] of Object.entries(TLD_CATEGORIES)) {
    if ((tlds as readonly string[]).includes(normalizedTld)) {
      return category;
    }
  }
  
  return null;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate years until expiry
 */
export function yearsUntilExpiry(expiryDate: string | Date): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.floor(diffYears));
}

/**
 * Calculate days until expiry
 */
export function daysUntilExpiry(expiryDate: string | Date): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.floor(diffDays));
}

/**
 * Check if domain is expiring soon (within X days)
 */
export function isExpiringSoon(expiryDate: string | Date, days = 30): boolean {
  return daysUntilExpiry(expiryDate) <= days;
}

/**
 * Check if domain has expired
 */
export function isExpired(expiryDate: string | Date): boolean {
  return new Date(expiryDate) < new Date();
}

/**
 * Format expiry date for display
 */
export function formatExpiryDate(expiryDate: string | Date): string {
  const date = new Date(expiryDate);
  return date.toLocaleDateString(DEFAULT_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate suggestions for domain names
 */
export function generateDomainSuggestions(keyword: string, maxSuggestions = 10): string[] {
  const suggestions: string[] = [];
  const cleanKeyword = keyword.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  if (!cleanKeyword) return suggestions;
  
  // Add popular TLDs first
  for (const tld of TLD_CATEGORIES.popular) {
    suggestions.push(`${cleanKeyword}${tld}`);
    if (suggestions.length >= maxSuggestions) break;
  }
  
  // Add variations
  if (suggestions.length < maxSuggestions) {
    const prefixes = ['get', 'my', 'the'];
    const suffixes = ['app', 'hq', 'now', 'online'];
    
    for (const prefix of prefixes) {
      if (suggestions.length >= maxSuggestions) break;
      suggestions.push(`${prefix}${cleanKeyword}.com`);
    }
    
    for (const suffix of suffixes) {
      if (suggestions.length >= maxSuggestions) break;
      suggestions.push(`${cleanKeyword}${suffix}.com`);
    }
  }
  
  return suggestions.slice(0, maxSuggestions);
}

/**
 * Normalize phone number to ResellerClub format
 */
export function normalizePhoneNumber(phone: string, countryCode = '1'): {
  countryCode: string;
  phone: string;
} {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with the country code, separate it
  if (cleaned.startsWith(countryCode)) {
    return {
      countryCode,
      phone: cleaned.slice(countryCode.length),
    };
  }
  
  return {
    countryCode,
    phone: cleaned,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Convert ResellerClub timestamp to Date
 */
export function parseResellerClubDate(timestamp: string | number): Date {
  // ResellerClub returns timestamps in Unix epoch (seconds)
  if (typeof timestamp === 'number') {
    return new Date(timestamp * 1000);
  }
  
  // Try parsing as ISO string first
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try parsing as Unix timestamp string
  const unixTimestamp = parseInt(timestamp, 10);
  if (!isNaN(unixTimestamp)) {
    return new Date(unixTimestamp * 1000);
  }
  
  return new Date();
}

/**
 * Generate a secure random string for passwords/tokens
 */
export function generateSecureString(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Calculate markup price
 */
export function calculateMarkup(
  wholesalePrice: number,
  markupType: 'percentage' | 'fixed' | 'custom',
  markupValue: number,
  options?: { minMarkup?: number; maxMarkup?: number }
): number {
  let markup: number;
  
  switch (markupType) {
    case 'percentage':
      markup = wholesalePrice * (markupValue / 100);
      break;
    case 'fixed':
      markup = markupValue;
      break;
    case 'custom':
      // Custom means the markup value IS the retail price
      return markupValue;
    default:
      markup = wholesalePrice * 0.3; // Default 30% markup
  }
  
  // Apply min/max constraints
  if (options?.minMarkup !== undefined && markup < options.minMarkup) {
    markup = options.minMarkup;
  }
  if (options?.maxMarkup !== undefined && markup > options.maxMarkup) {
    markup = options.maxMarkup;
  }
  
  return wholesalePrice + markup;
}

/**
 * Get status badge color for domain status
 */
export function getStatusBadgeColor(status: string): string {
  const statusLower = (status ?? '').toLowerCase();
  
  switch (statusLower) {
    case 'active':
      return 'green';
    case 'pending':
    case 'processing':
      return 'yellow';
    case 'expired':
    case 'deleted':
    case 'cancelled':
      return 'red';
    case 'suspended':
      return 'orange';
    case 'transferred':
      return 'blue';
    default:
      return 'gray';
  }
}
