// src/lib/resellerclub/config.ts
// ResellerClub API Configuration

const isSandbox = process.env.RESELLERCLUB_SANDBOX === 'true';

export const RESELLERCLUB_CONFIG = {
  // API Configuration
  // Production: https://httpapi.com/api (general), https://domaincheck.httpapi.com/api (availability)
  // Sandbox:    https://test.httpapi.com/api (for ALL endpoints, including availability)
  // ⚠️ The sandbox does NOT have a separate domaincheck subdomain — test.domaincheck.httpapi.com does not exist.
  // ⚠️ The sandbox flag auto-selects the correct URL. Override with env vars if needed.
  apiUrl: process.env.RESELLERCLUB_API_URL
    || (isSandbox ? 'https://test.httpapi.com/api' : 'https://httpapi.com/api'),
  // The domain availability check endpoint uses a SEPARATE faster hostname in production.
  // In sandbox mode, there is NO separate domaincheck host — use the general sandbox URL.
  // See: https://manage.resellerclub.com/kb/answer/764
  domainCheckUrl: process.env.RESELLERCLUB_DOMAIN_CHECK_URL
    || (isSandbox ? 'https://test.httpapi.com/api' : 'https://domaincheck.httpapi.com/api'),
  resellerId: process.env.RESELLERCLUB_RESELLER_ID || '',
  apiKey: process.env.RESELLERCLUB_API_KEY || '',
  sandbox: isSandbox,

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
 * Get the main API URL (for registration, management, pricing, email, etc.)
 */
export function getApiUrl(): string {
  return RESELLERCLUB_CONFIG.apiUrl;
}

/**
 * Get the domain availability check URL.
 * ResellerClub uses a separate, faster endpoint specifically for availability checks:
 *   https://domaincheck.httpapi.com/api/domains/available.json
 * This is documented at: https://manage.resellerclub.com/kb/answer/764
 */
export function getDomainCheckUrl(): string {
  return RESELLERCLUB_CONFIG.domainCheckUrl;
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
