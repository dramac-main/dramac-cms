// src/lib/cloudflare/client.ts
// Cloudflare API Client with Error Handling

import { CLOUDFLARE_CONFIG, isCloudflareConfigured } from './config';
import type { CloudflareResponse, CloudflareError } from './types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  params?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
}

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Configuration error for missing Cloudflare settings
 */
export class CloudflareConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloudflareConfigError';
  }
}

/**
 * API error from Cloudflare
 */
export class CloudflareApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public errors: CloudflareError[]
  ) {
    super(message);
    this.name = 'CloudflareApiError';
  }
  
  /**
   * Create error from Cloudflare API response errors
   */
  static fromResponse(errors: CloudflareError[]): CloudflareApiError {
    const mainError = errors[0] || { code: 0, message: 'Unknown error' };
    return new CloudflareApiError(mainError.message, mainError.code, errors);
  }
  
  /**
   * Check if error is a specific type
   */
  hasErrorCode(code: number): boolean {
    return this.errors.some(e => e.code === code);
  }
  
  /**
   * Check if zone already exists (common error)
   */
  isZoneAlreadyExists(): boolean {
    return this.hasErrorCode(1061);
  }
  
  /**
   * Check if record already exists
   */
  isRecordAlreadyExists(): boolean {
    return this.hasErrorCode(81053) || this.hasErrorCode(81057);
  }
  
  /**
   * Check if not found error
   */
  isNotFound(): boolean {
    return this.hasErrorCode(7003);
  }
}

// ============================================================================
// Cloudflare Client
// ============================================================================

/**
 * Cloudflare API Client
 * 
 * Provides typed access to Cloudflare's REST API.
 * 
 * @example
 * ```typescript
 * const client = getCloudflareClient();
 * const zones = await client.get<Zone[]>('/zones');
 * ```
 */
export class CloudflareClient {
  private baseUrl = 'https://api.cloudflare.com/client/v4';
  private apiToken: string;
  
  constructor() {
    if (!isCloudflareConfigured()) {
      throw new CloudflareConfigError(
        'Cloudflare API not configured. Set CLOUDFLARE_API_TOKEN environment variable.'
      );
    }
    this.apiToken = CLOUDFLARE_CONFIG.apiToken;
  }
  
  /**
   * Execute HTTP request to Cloudflare API
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', params, body } = options;
    
    // Build URL with query params
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CLOUDFLARE_CONFIG.requestTimeout
    );
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new CloudflareApiError(
          `Unexpected response: ${text.substring(0, 100)}`,
          response.status,
          []
        );
      }
      
      const data = await response.json() as CloudflareResponse<T>;
      
      if (!data.success) {
        throw CloudflareApiError.fromResponse(data.errors);
      }
      
      return data.result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Re-throw Cloudflare API errors
      if (error instanceof CloudflareApiError) {
        throw error;
      }
      
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new CloudflareApiError('Request timeout', 408, [
          { code: 408, message: 'Request timeout' }
        ]);
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new CloudflareApiError(
          'Network error: Unable to reach Cloudflare API',
          0,
          [{ code: 0, message: 'Network error' }]
        );
      }
      
      // Generic error
      throw new CloudflareApiError(
        error instanceof Error ? error.message : 'Unknown error',
        500,
        [{ code: 500, message: error instanceof Error ? error.message : 'Unknown error' }]
      );
    }
  }
  
  // ============================================================================
  // Public HTTP Methods
  // ============================================================================
  
  /**
   * GET request
   */
  async get<T>(
    endpoint: string, 
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }
  
  /**
   * POST request
   */
  async post<T>(
    endpoint: string, 
    body?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }
  
  /**
   * PUT request
   */
  async put<T>(
    endpoint: string, 
    body?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }
  
  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string, 
    body?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }
  
  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
  
  // ============================================================================
  // Utility Methods
  // ============================================================================
  
  /**
   * Verify API token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      await this.get('/user/tokens/verify');
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get current user info
   */
  async getUserInfo(): Promise<{
    id: string;
    email: string;
    username?: string;
  }> {
    return this.get('/user');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let clientInstance: CloudflareClient | null = null;

/**
 * Get Cloudflare client singleton
 * 
 * @throws {CloudflareConfigError} If Cloudflare is not configured
 */
export function getCloudflareClient(): CloudflareClient {
  if (!clientInstance) {
    clientInstance = new CloudflareClient();
  }
  return clientInstance;
}

/**
 * Reset client singleton (useful for testing)
 */
export function resetClient(): void {
  clientInstance = null;
}

/**
 * Check if client can be created (configuration exists)
 */
export function canCreateClient(): boolean {
  return isCloudflareConfigured();
}
