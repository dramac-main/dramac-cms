/**
 * Phase EM-33: API Consumer Service
 * 
 * Manages API consumers with:
 * - Consumer CRUD operations
 * - API key generation and validation
 * - Rate limit checking
 * - Scope management
 * - Request logging
 * 
 * @see phases/enterprise-modules/PHASE-EM-33-API-ONLY-MODE.md
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================

export interface APIConsumer {
  id: string;
  siteModuleInstallationId: string;
  name: string;
  description: string | null;
  apiKey: string;
  scopes: string[];
  allowedEndpoints: string[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  allowedIps: string[] | null;
  isActive: boolean;
  totalRequests: number;
  lastRequestAt: string | null;
  metadata: Record<string, any>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsumerInput {
  siteModuleInstallationId: string;
  name: string;
  description?: string;
  scopes?: string[];
  allowedEndpoints?: string[];
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
  allowedIps?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateConsumerInput {
  name?: string;
  description?: string;
  scopes?: string[];
  allowedEndpoints?: string[];
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
  allowedIps?: string[];
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limitType: 'minute' | 'day';
}

export interface ValidatedConsumer {
  id: string;
  siteModuleInstallationId: string;
  scopes: string[];
  allowedEndpoints: string[];
  isActive: boolean;
}

export interface ConsumerUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageResponseTime: number;
  successRate: number;
  topEndpoints: Array<{ path: string; count: number }>;
  errorsByType: Record<string, number>;
}

// ============================================================
// SERVICE CLIENT
// ============================================================

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================
// API CONSUMER SERVICE
// ============================================================

export class APIConsumerService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || getServiceClient();
  }

  // ============================================================
  // CONSUMER MANAGEMENT
  // ============================================================

  /**
   * Create a new API consumer
   */
  async createConsumer(
    input: CreateConsumerInput,
    createdBy?: string
  ): Promise<{ consumer: APIConsumer; apiKey: string }> {
    // Generate API key
    const apiKey = this.generateApiKey();

    const { data, error } = await this.supabase
      .from('module_api_consumers')
      .insert({
        site_module_installation_id: input.siteModuleInstallationId,
        name: input.name,
        description: input.description || null,
        api_key: apiKey,
        scopes: input.scopes || ['read'],
        allowed_endpoints: input.allowedEndpoints || ['*'],
        rate_limit_per_minute: input.rateLimitPerMinute || 60,
        rate_limit_per_day: input.rateLimitPerDay || 10000,
        allowed_ips: input.allowedIps || null,
        metadata: input.metadata || {},
        created_by: createdBy || null
      })
      .select()
      .single();

    if (error) throw error;

    return {
      consumer: this.mapToConsumer(data),
      apiKey // Return full key only on creation
    };
  }

  /**
   * Get consumer by ID
   */
  async getConsumer(consumerId: string): Promise<APIConsumer | null> {
    const { data, error } = await this.supabase
      .from('module_api_consumers')
      .select()
      .eq('id', consumerId)
      .single();

    if (error || !data) return null;
    return this.mapToConsumer(data);
  }

  /**
   * List consumers for a site module installation
   */
  async listConsumers(
    siteModuleInstallationId: string,
    includeInactive: boolean = false
  ): Promise<APIConsumer[]> {
    let query = this.supabase
      .from('module_api_consumers')
      .select()
      .eq('site_module_installation_id', siteModuleInstallationId)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(d => this.mapToConsumer(d, true));
  }

  /**
   * Update consumer
   */
  async updateConsumer(
    consumerId: string,
    input: UpdateConsumerInput
  ): Promise<APIConsumer> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.scopes !== undefined) updateData.scopes = input.scopes;
    if (input.allowedEndpoints !== undefined) updateData.allowed_endpoints = input.allowedEndpoints;
    if (input.rateLimitPerMinute !== undefined) updateData.rate_limit_per_minute = input.rateLimitPerMinute;
    if (input.rateLimitPerDay !== undefined) updateData.rate_limit_per_day = input.rateLimitPerDay;
    if (input.allowedIps !== undefined) updateData.allowed_ips = input.allowedIps;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const { data, error } = await this.supabase
      .from('module_api_consumers')
      .update(updateData)
      .eq('id', consumerId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToConsumer(data, true);
  }

  /**
   * Delete consumer
   */
  async deleteConsumer(consumerId: string): Promise<void> {
    const { error } = await this.supabase
      .from('module_api_consumers')
      .delete()
      .eq('id', consumerId);

    if (error) throw error;
  }

  /**
   * Regenerate API key for consumer
   */
  async regenerateApiKey(consumerId: string): Promise<string> {
    const apiKey = this.generateApiKey();

    const { error } = await this.supabase
      .from('module_api_consumers')
      .update({
        api_key: apiKey,
        updated_at: new Date().toISOString()
      })
      .eq('id', consumerId);

    if (error) throw error;
    return apiKey;
  }

  // ============================================================
  // API KEY VALIDATION
  // ============================================================

  /**
   * Validate API key and return consumer context
   */
  async validateApiKey(apiKey: string): Promise<ValidatedConsumer | null> {
    const { data, error } = await this.supabase
      .from('module_api_consumers')
      .select('id, site_module_installation_id, scopes, allowed_endpoints, is_active, allowed_ips')
      .eq('api_key', apiKey)
      .single();

    if (error || !data || !data.is_active) return null;

    return {
      id: data.id,
      siteModuleInstallationId: data.site_module_installation_id,
      scopes: data.scopes || [],
      allowedEndpoints: data.allowed_endpoints || ['*'],
      isActive: data.is_active
    };
  }

  /**
   * Validate API key with IP check
   */
  async validateApiKeyWithIP(
    apiKey: string,
    clientIp: string
  ): Promise<ValidatedConsumer | null> {
    const consumer = await this.validateApiKey(apiKey);
    if (!consumer) return null;

    // Get IP restrictions
    const { data } = await this.supabase
      .from('module_api_consumers')
      .select('allowed_ips')
      .eq('id', consumer.id)
      .single();

    if (data?.allowed_ips && data.allowed_ips.length > 0) {
      const isAllowed = data.allowed_ips.some((ip: string) => {
        if (ip.includes('/')) {
          // CIDR notation - simplified check
          const [subnet, bits] = ip.split('/');
          return clientIp.startsWith(subnet.split('.').slice(0, parseInt(bits) / 8).join('.'));
        }
        return ip === clientIp;
      });

      if (!isAllowed) return null;
    }

    return consumer;
  }

  // ============================================================
  // RATE LIMITING
  // ============================================================

  /**
   * Check rate limits for a consumer
   */
  async checkRateLimit(consumerId: string): Promise<RateLimitStatus> {
    // Check minute limit
    const minuteResult = await this.checkMinuteLimit(consumerId);
    if (!minuteResult.allowed) {
      return minuteResult;
    }

    // Check daily limit
    const dayResult = await this.checkDailyLimit(consumerId);
    if (!dayResult.allowed) {
      return dayResult;
    }

    // Return the most restrictive remaining
    return minuteResult.remaining < dayResult.remaining ? minuteResult : dayResult;
  }

  private async checkMinuteLimit(consumerId: string): Promise<RateLimitStatus> {
    // Get consumer's rate limit
    const { data: consumer } = await this.supabase
      .from('module_api_consumers')
      .select('rate_limit_per_minute')
      .eq('id', consumerId)
      .single();

    if (!consumer) {
      return { allowed: false, remaining: 0, resetAt: new Date(), limitType: 'minute' };
    }

    const limit = consumer.rate_limit_per_minute;
    const windowStart = new Date(Date.now() - 60 * 1000);

    // Count requests in window
    const { count } = await this.supabase
      .from('module_api_requests')
      .select('id', { count: 'exact', head: true })
      .eq('consumer_id', consumerId)
      .gte('created_at', windowStart.toISOString());

    const requestCount = count || 0;
    const remaining = Math.max(0, limit - requestCount);
    const resetAt = new Date(Date.now() + 60 * 1000);

    return {
      allowed: requestCount < limit,
      remaining,
      resetAt,
      limitType: 'minute'
    };
  }

  private async checkDailyLimit(consumerId: string): Promise<RateLimitStatus> {
    // Get consumer's daily limit
    const { data: consumer } = await this.supabase
      .from('module_api_consumers')
      .select('rate_limit_per_day')
      .eq('id', consumerId)
      .single();

    if (!consumer) {
      return { allowed: false, remaining: 0, resetAt: new Date(), limitType: 'day' };
    }

    const limit = consumer.rate_limit_per_day;
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);

    // Count requests today
    const { count } = await this.supabase
      .from('module_api_requests')
      .select('id', { count: 'exact', head: true })
      .eq('consumer_id', consumerId)
      .gte('created_at', dayStart.toISOString());

    const requestCount = count || 0;
    const remaining = Math.max(0, limit - requestCount);
    
    const resetAt = new Date(dayStart);
    resetAt.setDate(resetAt.getDate() + 1);

    return {
      allowed: requestCount < limit,
      remaining,
      resetAt,
      limitType: 'day'
    };
  }

  // ============================================================
  // REQUEST LOGGING
  // ============================================================

  /**
   * Log an API request
   */
  async logRequest(
    consumerId: string | null,
    siteModuleInstallationId: string,
    request: {
      method: string;
      path: string;
      queryParams?: Record<string, any>;
      requestBody?: Record<string, any>;
    },
    response: {
      statusCode: number;
      responseTimeMs: number;
      responseSizeBytes?: number;
      errorMessage?: string;
    },
    client: {
      ipAddress?: string;
      userAgent?: string;
    },
    graphql?: {
      operationName?: string;
      operationType?: 'query' | 'mutation' | 'subscription';
    }
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('module_api_requests')
      .insert({
        consumer_id: consumerId,
        site_module_installation_id: siteModuleInstallationId,
        method: request.method,
        path: request.path,
        query_params: request.queryParams || null,
        request_body: request.requestBody || null,
        status_code: response.statusCode,
        response_time_ms: response.responseTimeMs,
        response_size_bytes: response.responseSizeBytes || null,
        ip_address: client.ipAddress || null,
        user_agent: client.userAgent || null,
        error_message: response.errorMessage || null,
        is_graphql: !!graphql,
        graphql_operation_name: graphql?.operationName || null,
        graphql_operation_type: graphql?.operationType || null
      })
      .select('id')
      .single();

    if (error) throw error;

    // Update consumer stats
    if (consumerId) {
      try {
        await this.supabase.rpc('increment_consumer_requests', {
          p_consumer_id: consumerId
        });
      } catch {
        // Fallback if RPC doesn't exist - manual update
        const { data: consumer } = await (this.supabase
          .from('module_api_consumers')
          .select('total_requests')
          .eq('id', consumerId)
          .single() as any);
        
        if (consumer) {
          await (this.supabase
            .from('module_api_consumers')
            .update({
              total_requests: (consumer.total_requests || 0) + 1,
              last_request_at: new Date().toISOString()
            })
            .eq('id', consumerId) as any);
        }
      }
    }

    return data.id;
  }

  // ============================================================
  // USAGE STATISTICS
  // ============================================================

  /**
   * Get usage statistics for a consumer
   */
  async getUsageStats(
    consumerId: string,
    days: number = 30
  ): Promise<ConsumerUsageStats> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(today);
    monthStart.setDate(monthStart.getDate() - 30);

    // Get all requests in range
    const { data: requests } = await this.supabase
      .from('module_api_requests')
      .select('path, status_code, response_time_ms, error_message, created_at')
      .eq('consumer_id', consumerId)
      .gte('created_at', since.toISOString());

    if (!requests || requests.length === 0) {
      return {
        totalRequests: 0,
        requestsToday: 0,
        requestsThisWeek: 0,
        requestsThisMonth: 0,
        averageResponseTime: 0,
        successRate: 0,
        topEndpoints: [],
        errorsByType: {}
      };
    }

    // Calculate stats
    const requestsToday = requests.filter(r => new Date(r.created_at) >= today).length;
    const requestsThisWeek = requests.filter(r => new Date(r.created_at) >= weekStart).length;
    const requestsThisMonth = requests.filter(r => new Date(r.created_at) >= monthStart).length;

    const totalResponseTime = requests.reduce((sum, r) => sum + (r.response_time_ms || 0), 0);
    const successCount = requests.filter(r => r.status_code >= 200 && r.status_code < 300).length;

    // Top endpoints
    const endpointCounts: Record<string, number> = {};
    for (const r of requests) {
      endpointCounts[r.path] = (endpointCounts[r.path] || 0) + 1;
    }
    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // Errors by type
    const errorsByType: Record<string, number> = {};
    for (const r of requests) {
      if (r.status_code >= 400) {
        const type = r.status_code >= 500 ? 'server_error' : 
                     r.status_code === 429 ? 'rate_limited' :
                     r.status_code === 401 ? 'unauthorized' :
                     r.status_code === 404 ? 'not_found' : 'client_error';
        errorsByType[type] = (errorsByType[type] || 0) + 1;
      }
    }

    return {
      totalRequests: requests.length,
      requestsToday,
      requestsThisWeek,
      requestsThisMonth,
      averageResponseTime: requests.length > 0 ? totalResponseTime / requests.length : 0,
      successRate: requests.length > 0 ? (successCount / requests.length) * 100 : 0,
      topEndpoints,
      errorsByType
    };
  }

  // ============================================================
  // WEBHOOKS MANAGEMENT
  // ============================================================

  /**
   * Create webhook for consumer
   */
  async createWebhook(
    consumerId: string,
    input: {
      name: string;
      url: string;
      events: string[];
      customHeaders?: Record<string, string>;
      maxRetries?: number;
    }
  ): Promise<{ id: string; secret: string }> {
    const secret = this.generateWebhookSecret();

    const { data, error } = await this.supabase
      .from('module_api_webhooks')
      .insert({
        consumer_id: consumerId,
        name: input.name,
        url: input.url,
        events: input.events,
        secret,
        custom_headers: input.customHeaders || {},
        max_retries: input.maxRetries || 3
      })
      .select('id')
      .single();

    if (error) throw error;
    return { id: data.id, secret };
  }

  /**
   * List webhooks for consumer
   */
  async listWebhooks(consumerId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('module_api_webhooks')
      .select('id, name, url, events, is_active, total_deliveries, successful_deliveries, last_delivery_at, last_error, created_at')
      .eq('consumer_id', consumerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    const { error } = await this.supabase
      .from('module_api_webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) throw error;
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Generate API key
   */
  private generateApiKey(): string {
    const bytes = crypto.randomBytes(24);
    return `dk_${bytes.toString('base64').replace(/[+/=]/g, '')}`;
  }

  /**
   * Generate webhook secret
   */
  private generateWebhookSecret(): string {
    return `whsec_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Map database row to APIConsumer
   */
  private mapToConsumer(data: any, maskApiKey: boolean = false): APIConsumer {
    return {
      id: data.id,
      siteModuleInstallationId: data.site_module_installation_id,
      name: data.name,
      description: data.description,
      apiKey: maskApiKey ? `${data.api_key.substring(0, 7)}...` : data.api_key,
      scopes: data.scopes || [],
      allowedEndpoints: data.allowed_endpoints || ['*'],
      rateLimitPerMinute: data.rate_limit_per_minute,
      rateLimitPerDay: data.rate_limit_per_day,
      allowedIps: data.allowed_ips,
      isActive: data.is_active,
      totalRequests: data.total_requests || 0,
      lastRequestAt: data.last_request_at,
      metadata: data.metadata || {},
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

// ============================================================
// FACTORY & EXPORTS
// ============================================================

export function createAPIConsumerService(): APIConsumerService {
  return new APIConsumerService();
}
