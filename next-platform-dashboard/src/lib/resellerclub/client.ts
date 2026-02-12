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
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        },
        ...(body ? { body } : {}),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Parse response
      const contentType = response.headers.get('content-type');
      let data: unknown;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        // Some endpoints return plain text
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          // Not JSON, treat as raw response
          data = text;
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
      
      // Don't retry ResellerClub business logic errors
      if (error instanceof ResellerClubError) {
        throw error;
      }
      
      // Retry on network errors
      if (retryCount < RESELLERCLUB_CONFIG.maxRetries && this.isRetryable(error)) {
        const backoffDelay = RESELLERCLUB_CONFIG.retryDelay * Math.pow(2, retryCount);
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
   */
  async getBalance(): Promise<{ balance: number; currency: string }> {
    const data = await this.get<Record<string, unknown>>('billing/reseller-balance.json');
    return {
      balance: Number(data.sellingcurrencybalance || data.resellerbalance || 0),
      currency: String(data.sellingcurrency || DEFAULT_CURRENCY),
    };
  }
  
  /**
   * Check API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getBalance();
      return true;
    } catch {
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
