// src/lib/resellerclub/config.ts
// ResellerClub API Configuration

export const RESELLERCLUB_CONFIG = {
  // API Configuration — Always use the live API URL.
  // The test URL (test.httpapi.com) with live credentials still charges real money.
  apiUrl: process.env.RESELLERCLUB_API_URL || 'https://httpapi.com/api',
  resellerId: process.env.RESELLERCLUB_RESELLER_ID || '',
  apiKey: process.env.RESELLERCLUB_API_KEY || '',
  sandbox: process.env.RESELLERCLUB_SANDBOX === 'true',

  // ⚠️ SAFETY: Must be explicitly set to 'true' to allow operations that spend money
  // (domain registration, renewal, transfer, privacy purchase, email orders).
  // When false, only read-only operations (search, availability, pricing, details) are allowed.
  allowPurchases: process.env.RESELLERCLUB_ALLOW_PURCHASES === 'true',
  
  // Default settings
  defaultPrivacy: true,
  defaultAutoRenew: true,
  defaultTransferLock: true,
  
  // Rate limiting
  maxRequestsPerSecond: 5,
  requestTimeout: 30000,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
} as const;

export const TLD_CATEGORIES = {
  popular: ['.com', '.net', '.org', '.io', '.co', '.app'],
  country: ['.uk', '.us', '.de', '.fr', '.au', '.ca', '.in'],
  business: ['.biz', '.company', '.agency', '.studio', '.consulting'],
  tech: ['.dev', '.tech', '.digital', '.cloud', '.online'],
  creative: ['.design', '.art', '.media', '.photography'],
} as const;

export const SUPPORTED_TLDS = Object.values(TLD_CATEGORIES).flat();

/**
 * Check if ResellerClub API is properly configured
 */
export function isConfigured(): boolean {
  return !!(
    RESELLERCLUB_CONFIG.resellerId &&
    RESELLERCLUB_CONFIG.apiKey
  );
}

/**
 * Get the API URL.
 * 
 * NOTE: ResellerClub's test.httpapi.com with live credentials still performs
 * REAL operations and charges REAL money. The test URL is only meant for
 * browser-based GET testing with a Demo Reseller Account.
 * We always use the production URL and rely on the allowPurchases flag instead.
 */
export function getApiUrl(): string {
  return RESELLERCLUB_CONFIG.apiUrl;
}

/**
 * Check if money-spending operations (register, renew, transfer, email orders) are allowed.
 * Returns false unless RESELLERCLUB_ALLOW_PURCHASES=true is explicitly set.
 * 
 * Read-only operations (search, availability, pricing, details) always work
 * regardless of this setting.
 */
export function arePurchasesAllowed(): boolean {
  return RESELLERCLUB_CONFIG.allowPurchases;
}
