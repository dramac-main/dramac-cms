// src/lib/resellerclub/client.ts
// ResellerClub API Client with Rate Limiting and Retry Logic

import { RESELLERCLUB_CONFIG, isConfigured, getApiUrl } from './config';
import { DEFAULT_CURRENCY } from '@/lib/locale-config'
import { 
  ResellerClubError, 
  ConfigurationError,
  RequestTimeoutError,
  parseApiError,
} from './errors';

type HttpMethod = 'GET' | 'POST';

interface RequestOptions {
  method?: HttpMethod;
  params?: Record<string, string | number | boolean | string[] | undefined>;
  /** Override the base URL for this request (e.g., domaincheck.httpapi.com) */
  baseUrlOverride?: string;
  timeout?: number;
}

/**
 * ResellerClub API Client
 * 
 * Provides rate-limited, retry-enabled access to the ResellerClub API.
 * 
 * @example
 * ```typescript
 * const client = getResellerClubClient();
 * const balance = await client.getBalance();
 * ```
 */
export class ResellerClubClient {
  private baseUrl: string;
  private resellerId: string;
  private apiKey: string;
  private requestQueue: Promise<unknown> = Promise.resolve();
  private lastRequestTime = 0;
  
  constructor() {
    if (!isConfigured()) {
      throw new ConfigurationError(
        'ResellerClub API not configured. Set RESELLERCLUB_RESELLER_ID and RESELLERCLUB_API_KEY environment variables.'
      );
    }
    
    this.baseUrl = getApiUrl();
    this.resellerId = RESELLERCLUB_CONFIG.resellerId;
    this.apiKey = RESELLERCLUB_CONFIG.apiKey;
  }
  
  /**
   * Rate-limited request method
   * Queues requests to respect API rate limits
   */
  private async rateLimitedRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue = this.requestQueue.then(async () => {
        // Enforce rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = 1000 / RESELLERCLUB_CONFIG.maxRequestsPerSecond;
        
        if (timeSinceLastRequest < minInterval) {
          await this.delay(minInterval - timeSinceLastRequest);
        }
        
        try {
          const result = await this.executeRequest<T>(endpoint, options);
          this.lastRequestTime = Date.now();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  
  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T>(
    endpoint: string,
    options: RequestOptions = {},
    retryCount = 0
  ): Promise<T> {
    const { 
      method = 'GET', 
      params = {}, 
      baseUrlOverride,
      timeout = RESELLERCLUB_CONFIG.requestTimeout 
    } = options;
    
    // Use override URL if provided (e.g., domaincheck.httpapi.com for availability)
    const effectiveBaseUrl = baseUrlOverride || this.baseUrl;
    
    // Build URL with auth params
    const authParams: Record<string, string | number | boolean> = {
      'auth-userid': this.resellerId,
      'api-key': this.apiKey,
    };
    
    // Merge auth params with request params
    const allParams: Record<string, string | number | boolean | string[] | undefined> = { ...authParams, ...params };
    
    // Build query string, filtering undefined values
    // Supports array values for repeated keys (e.g., tlds=com&tlds=net)
    // ResellerClub uses repeated key format, NOT indexed brackets
    const queryParams = new URLSearchParams();
    Object.entries(allParams).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) {
        // Repeated keys for array values (e.g., tlds=com&tlds=net&domain-name=test)
        value.forEach(v => queryParams.append(key, String(v)));
      } else {
        queryParams.append(key, String(value));
      }
    });
    
    // For GET: all params in URL. For POST: auth in URL, rest in body
    let url: string;
    let body: string | undefined;
    
    if (method === 'POST') {
      // POST: Auth params in URL, all other params as form-encoded body
      const authQuery = new URLSearchParams();
      Object.entries(authParams).forEach(([key, value]) => {
        authQuery.append(key, String(value));
      });
      url = `${effectiveBaseUrl}/${endpoint}?${authQuery.toString()}`;
      
      // Build form body from non-auth params
      const bodyParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined) return;
        if (Array.isArray(value)) {
          value.forEach(v => bodyParams.append(key, String(v)));
        } else {
          bodyParams.append(key, String(value));
        }
      });
      body = bodyParams.toString();
    } else {
      // GET: All params in URL
      url = `${effectiveBaseUrl}/${endpoint}?${queryParams.toString()}`;
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Use a custom env var so Vercel build does NOT see it (HTTPS_PROXY/HTTP_PROXY break the build).
    // Set RESELLERCLUB_PROXY_URL or FIXIE_URL (Fixie integration) for static IP at runtime only.
    const proxyUrl = process.env.RESELLERCLUB_PROXY_URL || process.env.FIXIE_URL;
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      ...(body ? { body } : {}),
      signal: controller.signal,
    };
    
    try {
      let response: Response;
      if (proxyUrl && typeof process !== 'undefined' && process.versions?.node) {
        // Node runtime: use undici fetch with ProxyAgent (only at runtime, not build)
        const { fetch: undiciFetch, ProxyAgent } = await import('undici');
        const dispatcher = new ProxyAgent(proxyUrl);
        response = await undiciFetch(url, { ...fetchOptions, dispatcher }) as Response;
      } else {
        response = await fetch(url, fetchOptions);
      }
      
      clearTimeout(timeoutId);
      
      // Handle HTTP error status codes BEFORE parsing the body.
      // ResellerClub returns 403 for invalid credentials, blocked IPs, or when
      // sandbox credentials are used against production endpoints.
      // Cloudflare WAF also returns 403 with HTML body.
      if (!response.ok) {
        const statusText = response.statusText || 'Unknown';
        
        // Try to get response body for better error messages
        let bodySnippet = '';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json') || contentType?.includes('text/plain')) {
            const text = await response.text();
            bodySnippet = text.substring(0, 200);
          }
        } catch {
          // Ignore body read errors
        }
        
        console.error(`[ResellerClub] HTTP ${response.status} ${statusText} from ${endpoint}`, 
          bodySnippet ? `Body: ${bodySnippet}` : '');
        
        // HTTP 429 (rate limit) and 5xx (server errors) are retryable
        const isRetryableStatus = response.status === 429 || response.status >= 500;
        
        throw new ResellerClubError(
          `API returned HTTP ${response.status} ${statusText}${bodySnippet ? ': ' + bodySnippet : ''}`,
          response.status === 403 ? 'AUTH_ERROR' : isRetryableStatus ? 'RETRYABLE_ERROR' : 'NETWORK_ERROR',
          response.status,
          bodySnippet ? { body: bodySnippet } : undefined
        );
      }
      
      // Parse response
      const contentType = response.headers.get('content-type');
      let data: unknown;
      
      // Reject HTML responses — these come from Cloudflare WAF blocks or error pages
      if (contentType?.includes('text/html')) {
        console.error(`[ResellerClub] Received HTML response from ${endpoint} (likely Cloudflare block)`);
        throw new ResellerClubError(
          'API returned HTML instead of JSON (possible WAF block)',
          'NETWORK_ERROR'
        );
      }
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        // Some endpoints return plain text
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          // Not JSON — could be an error page or unexpected response
          console.error(`[ResellerClub] Non-JSON response from ${endpoint}:`, text.substring(0, 200));
          throw new ResellerClubError(
            'API returned non-JSON response',
            'NETWORK_ERROR'
          );
        }
      }
      
      // Check for API errors in response body
      if (typeof data === 'object' && data !== null) {
        const res = data as Record<string, unknown>;
        
        // ResellerClub returns errors in various formats
        if (res.status === 'ERROR' || res.status === 'error') {
          throw parseApiError(data);
        }
        
        if (res.actionstatus === 'Failed') {
          throw parseApiError(data);
        }
        
        // Check for error field
        if (res.error && typeof res.error === 'string') {
          throw parseApiError(data);
        }
      }
      
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new RequestTimeoutError(endpoint);
      }
      
      // Retry logic: retry on network errors and retryable status codes (429, 5xx)
      if (error instanceof ResellerClubError) {
        // Only retry if it's explicitly marked as retryable
        if (error.code === 'RETRYABLE_ERROR' && retryCount < RESELLERCLUB_CONFIG.maxRetries) {
          const backoffDelay = RESELLERCLUB_CONFIG.retryDelay * Math.pow(2, retryCount);
          console.log(`[ResellerClub] Retrying ${endpoint} after ${backoffDelay}ms (attempt ${retryCount + 1}/${RESELLERCLUB_CONFIG.maxRetries})`);
          await this.delay(backoffDelay);
          return this.executeRequest<T>(endpoint, options, retryCount + 1);
        }
        // Don't retry business logic errors (AUTH_ERROR, etc.)
        throw error;
      }
      
      // Retry on network errors (fetch failures, etc.)
      if (retryCount < RESELLERCLUB_CONFIG.maxRetries && this.isRetryable(error)) {
        const backoffDelay = RESELLERCLUB_CONFIG.retryDelay * Math.pow(2, retryCount);
        console.log(`[ResellerClub] Retrying ${endpoint} after ${backoffDelay}ms due to network error (attempt ${retryCount + 1}/${RESELLERCLUB_CONFIG.maxRetries})`);
        await this.delay(backoffDelay);
        return this.executeRequest<T>(endpoint, options, retryCount + 1);
      }
      
      // Wrap unknown errors
      if (error instanceof Error) {
        throw new ResellerClubError(error.message, 'NETWORK_ERROR');
      }
      
      throw new ResellerClubError('Unknown error occurred', 'UNKNOWN');
    }
  }
  
  /**
   * Check if an error is retryable
   */
  private isRetryable(error: unknown): boolean {
    // Don't retry business logic errors
    if (error instanceof ResellerClubError) {
      return false;
    }
    
    // Retry network/fetch errors
    if (error instanceof TypeError) {
      return true;
    }
    
    return true;
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ============================================================================
  // Public Methods
  // ============================================================================
  
  /**
   * Make a GET request to the API
   */
  async get<T>(
    endpoint: string, 
    params?: Record<string, string | number | boolean | string[] | undefined>,
    baseUrlOverride?: string
  ): Promise<T> {
    return this.rateLimitedRequest<T>(endpoint, { method: 'GET', params, baseUrlOverride });
  }
  
  /**
   * Make a POST request to the API
   */
  async post<T>(
    endpoint: string, 
    params?: Record<string, string | number | boolean | string[] | undefined>,
    baseUrlOverride?: string
  ): Promise<T> {
    return this.rateLimitedRequest<T>(endpoint, { method: 'POST', params, baseUrlOverride });
  }
  
  /**
   * Get reseller account balance
   * 
   * Uses billing/reseller-balance.json with reseller-id param.
   * The RC API requires reseller-id even when querying your own balance.
   * We pass auth-userid (our own reseller ID) as the reseller-id.
   */
  async getBalance(): Promise<{ balance: number; currency: string }> {
    const data = await this.get<Record<string, unknown>>(
      'billing/reseller-balance.json',
      { 'reseller-id': this.resellerId }
    );
    return {
      balance: Number(data.sellingcurrencybalance || data.resellerbalance || 0),
      currency: String(data.sellingcurrency || DEFAULT_CURRENCY),
    };
  }
  
  /**
   * Check API connectivity using a lightweight availability check
   * (more reliable than billing/reseller-balance.json)
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use domain availability check - it's lightweight, directly tied to search,
      // and uses the optimized domaincheck endpoint
      const { getDomainCheckUrl } = await import('./config');
      await this.get<Record<string, unknown>>(
        'domains/available.json',
        { 
          'domain-name': ['test'],
          'tlds': ['com']
        },
        getDomainCheckUrl()
      );
      return true;
    } catch (error) {
      console.error('[ResellerClub] Health check failed:', error);
      return false;
    }
  }
}

// ============================================================================
// Singleton Instance Management
// ============================================================================

let clientInstance: ResellerClubClient | null = null;

/**
 * Get the ResellerClub API client instance
 * Creates a new instance if one doesn't exist
 */
export function getResellerClubClient(): ResellerClubClient {
  if (!clientInstance) {
    clientInstance = new ResellerClubClient();
  }
  return clientInstance;
}

/**
 * Reset the client instance
 * Useful for testing or when configuration changes
 */
export function resetClient(): void {
  clientInstance = null;
}

/**
 * Check if the client is available without throwing
 */
export function isClientAvailable(): boolean {
  try {
    if (!isConfigured()) {
      return false;
    }
    getResellerClubClient();
    return true;
  } catch {
    return false;
  }
}
