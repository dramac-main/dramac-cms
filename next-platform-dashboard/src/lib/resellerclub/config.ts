// src/lib/resellerclub/config.ts
// ResellerClub API Configuration

export const RESELLERCLUB_CONFIG = {
  // API Configuration
  apiUrl: process.env.RESELLERCLUB_API_URL || 'https://httpapi.com/api',
  resellerId: process.env.RESELLERCLUB_RESELLER_ID || '',
  apiKey: process.env.RESELLERCLUB_API_KEY || '',
  sandbox: process.env.RESELLERCLUB_SANDBOX === 'true',
  
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
 * Get sandbox or production API URL
 */
export function getApiUrl(): string {
  if (RESELLERCLUB_CONFIG.sandbox) {
    return 'https://test.httpapi.com/api';
  }
  return RESELLERCLUB_CONFIG.apiUrl;
}
