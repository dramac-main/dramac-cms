/**
 * Phase EM-33: Webhook Delivery Service
 * 
 * Handles webhook delivery with:
 * - Async delivery queue
 * - Retry logic with exponential backoff
 * - Payload signing with HMAC-SHA256
 * - Delivery logging and analytics
 * 
 * @see phases/enterprise-modules/PHASE-EM-33-API-ONLY-MODE.md
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  attemptNumber: number;
  nextRetryAt: string | null;
  errorMessage: string | null;
  responseStatusCode: number | null;
  responseBody: string | null;
  responseTimeMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface WebhookConfig {
  id: string;
  url: string;
  secret: string | null;
  events: string[];
  customHeaders: Record<string, string>;
  maxRetries: number;
  retryDelaySeconds: number;
  timeoutSeconds: number;
  isActive: boolean;
}

export interface DeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  responseTimeMs?: number;
  error?: string;
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
// WEBHOOK DELIVERY SERVICE
// ============================================================

export class WebhookDeliveryService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || getServiceClient();
  }

  // ============================================================
  // QUEUE MANAGEMENT
  // ============================================================

  /**
   * Queue a webhook delivery
   */
  async queueDelivery(
    webhookId: string,
    event: string,
    payload: any
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('module_api_webhook_deliveries')
      .insert({
        webhook_id: webhookId,
        event,
        payload,
        status: 'pending',
        attempt_number: 1
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Get pending deliveries ready for processing
   */
  async getPendingDeliveries(limit: number = 100): Promise<WebhookDelivery[]> {
    const { data, error } = await this.supabase
      .from('module_api_webhook_deliveries')
      .select(`
        id,
        webhook_id,
        event,
        payload,
        status,
        attempt_number,
        next_retry_at,
        error_message,
        response_status_code,
        response_body,
        response_time_ms,
        created_at,
        completed_at
      `)
      .in('status', ['pending', 'processing'])
      .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      webhookId: d.webhook_id,
      event: d.event,
      payload: d.payload,
      status: d.status,
      attemptNumber: d.attempt_number,
      nextRetryAt: d.next_retry_at,
      errorMessage: d.error_message,
      responseStatusCode: d.response_status_code,
      responseBody: d.response_body,
      responseTimeMs: d.response_time_ms,
      createdAt: d.created_at,
      completedAt: d.completed_at
    }));
  }

  // ============================================================
  // DELIVERY EXECUTION
  // ============================================================

  /**
   * Process a single delivery
   */
  async processDelivery(deliveryId: string): Promise<DeliveryResult> {
    // Mark as processing
    await this.updateDeliveryStatus(deliveryId, 'processing');

    // Get delivery details
    const { data: delivery, error: fetchError } = await this.supabase
      .from('module_api_webhook_deliveries')
      .select(`
        *,
        webhook:module_api_webhooks (
          url,
          secret,
          custom_headers,
          max_retries,
          retry_delay_seconds,
          timeout_seconds,
          is_active
        )
      `)
      .eq('id', deliveryId)
      .single();

    if (fetchError || !delivery) {
      return { success: false, error: 'Delivery not found' };
    }

    const webhook = delivery.webhook;
    if (!webhook || !webhook.is_active) {
      await this.updateDeliveryStatus(deliveryId, 'cancelled', 'Webhook is inactive');
      return { success: false, error: 'Webhook is inactive' };
    }

    // Prepare payload
    const payloadBody = JSON.stringify({
      event: delivery.event,
      data: delivery.payload,
      timestamp: new Date().toISOString(),
      deliveryId: delivery.id
    });

    // Sign payload if secret is configured
    const signature = webhook.secret
      ? this.signPayload(payloadBody, webhook.secret)
      : null;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'DRAMAC-Webhook/1.0',
      'X-Webhook-Event': delivery.event,
      'X-Webhook-Delivery-ID': delivery.id,
      ...(webhook.custom_headers || {}),
      ...(signature && { 'X-Signature': `sha256=${signature}` })
    };

    // Deliver webhook
    const result = await this.deliverWebhook(
      webhook.url,
      payloadBody,
      headers,
      webhook.timeout_seconds * 1000
    );

    // Update delivery record
    if (result.success) {
      await this.markDeliverySuccess(deliveryId, result);
      await this.updateWebhookStats(delivery.webhook_id, true);
    } else {
      const shouldRetry = delivery.attempt_number < webhook.max_retries;
      
      if (shouldRetry) {
        const nextRetry = this.calculateNextRetry(
          delivery.attempt_number,
          webhook.retry_delay_seconds
        );
        await this.scheduleRetry(deliveryId, nextRetry, result.error || 'Unknown error');
      } else {
        await this.markDeliveryFailed(deliveryId, result);
        await this.updateWebhookStats(delivery.webhook_id, false, result.error);
      }
    }

    return result;
  }

  /**
   * Deliver webhook HTTP request
   */
  private async deliverWebhook(
    url: string,
    body: string,
    headers: Record<string, string>,
    timeoutMs: number
  ): Promise<DeliveryResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;

      let responseBody: string;
      try {
        responseBody = await response.text();
      } catch {
        responseBody = '';
      }

      // Consider 2xx status codes as success
      const success = response.status >= 200 && response.status < 300;

      return {
        success,
        statusCode: response.status,
        responseBody: responseBody.substring(0, 10000), // Limit stored response
        responseTimeMs,
        ...(success ? {} : { error: `HTTP ${response.status}` })
      };
    } catch (error: any) {
      const responseTimeMs = Date.now() - startTime;

      if (error.name === 'AbortError') {
        return {
          success: false,
          responseTimeMs,
          error: 'Request timeout'
        };
      }

      return {
        success: false,
        responseTimeMs,
        error: error.message || 'Network error'
      };
    }
  }

  // ============================================================
  // STATUS UPDATES
  // ============================================================

  private async updateDeliveryStatus(
    deliveryId: string,
    status: WebhookDelivery['status'],
    errorMessage?: string
  ): Promise<void> {
    await this.supabase
      .from('module_api_webhook_deliveries')
      .update({
        status,
        error_message: errorMessage || null,
        ...(status === 'success' || status === 'failed' 
          ? { completed_at: new Date().toISOString() } 
          : {})
      })
      .eq('id', deliveryId);
  }

  private async markDeliverySuccess(
    deliveryId: string,
    result: DeliveryResult
  ): Promise<void> {
    await this.supabase
      .from('module_api_webhook_deliveries')
      .update({
        status: 'success',
        response_status_code: result.statusCode,
        response_body: result.responseBody,
        response_time_ms: result.responseTimeMs,
        completed_at: new Date().toISOString()
      })
      .eq('id', deliveryId);
  }

  private async markDeliveryFailed(
    deliveryId: string,
    result: DeliveryResult
  ): Promise<void> {
    await this.supabase
      .from('module_api_webhook_deliveries')
      .update({
        status: 'failed',
        error_message: result.error,
        response_status_code: result.statusCode,
        response_body: result.responseBody,
        response_time_ms: result.responseTimeMs,
        completed_at: new Date().toISOString()
      })
      .eq('id', deliveryId);
  }

  private async scheduleRetry(
    deliveryId: string,
    nextRetryAt: Date,
    errorMessage: string
  ): Promise<void> {
    await this.supabase
      .from('module_api_webhook_deliveries')
      .update({
        status: 'pending',
        error_message: errorMessage,
        next_retry_at: nextRetryAt.toISOString(),
        attempt_number: this.supabase.rpc('increment_delivery_attempt', { delivery_id: deliveryId })
      })
      .eq('id', deliveryId);

    // Manual increment if rpc doesn't exist
    const { data } = await this.supabase
      .from('module_api_webhook_deliveries')
      .select('attempt_number')
      .eq('id', deliveryId)
      .single();

    if (data) {
      await this.supabase
        .from('module_api_webhook_deliveries')
        .update({
          attempt_number: data.attempt_number + 1,
          next_retry_at: nextRetryAt.toISOString(),
          error_message: errorMessage
        })
        .eq('id', deliveryId);
    }
  }

  private async updateWebhookStats(
    webhookId: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    // Use RPC if available, otherwise manual update
    try {
      await this.supabase.rpc('update_webhook_stats', {
        p_webhook_id: webhookId,
        p_success: success,
        p_error: error || null
      });
    } catch {
      // Fallback to manual update if RPC doesn't exist
      const { data: webhook } = await (this.supabase
        .from('module_api_webhooks')
        .select('total_deliveries, successful_deliveries, failed_deliveries')
        .eq('id', webhookId)
        .single() as any);

      if (webhook) {
        await (this.supabase
          .from('module_api_webhooks')
          .update({
            total_deliveries: (webhook.total_deliveries || 0) + 1,
            successful_deliveries: (webhook.successful_deliveries || 0) + (success ? 1 : 0),
            failed_deliveries: (webhook.failed_deliveries || 0) + (success ? 0 : 1),
            last_delivery_at: new Date().toISOString(),
            ...(success 
              ? { last_success_at: new Date().toISOString() }
              : { last_error: error }),
            updated_at: new Date().toISOString()
          })
          .eq('id', webhookId) as any);
      }
    }
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Sign payload with HMAC-SHA256
   */
  private signPayload(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetry(attemptNumber: number, baseDelaySeconds: number): Date {
    // Exponential backoff: baseDelay * 2^attempt (capped at 1 hour)
    const delaySeconds = Math.min(
      baseDelaySeconds * Math.pow(2, attemptNumber - 1),
      3600
    );
    
    // Add jitter (±10%)
    const jitter = delaySeconds * 0.1 * (Math.random() * 2 - 1);
    
    return new Date(Date.now() + (delaySeconds + jitter) * 1000);
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // ============================================================
  // BATCH PROCESSING
  // ============================================================

  /**
   * Process all pending deliveries
   */
  async processAllPending(
    concurrency: number = 10
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    const pending = await this.getPendingDeliveries(100);
    
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < pending.length; i += concurrency) {
      const batch = pending.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map(d => this.processDelivery(d.id))
      );

      for (const result of results) {
        processed++;
        if (result.status === 'fulfilled' && result.value.success) {
          succeeded++;
        } else {
          failed++;
        }
      }
    }

    return { processed, succeeded, failed };
  }

  /**
   * Cancel all pending deliveries for a webhook
   */
  async cancelPendingForWebhook(webhookId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('module_api_webhook_deliveries')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('webhook_id', webhookId)
      .in('status', ['pending', 'processing'])
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  }

  /**
   * Retry a failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<void> {
    await this.supabase
      .from('module_api_webhook_deliveries')
      .update({
        status: 'pending',
        attempt_number: 1,
        next_retry_at: null,
        error_message: null
      })
      .eq('id', deliveryId);
  }

  // ============================================================
  // ANALYTICS
  // ============================================================

  /**
   * Get delivery statistics for a webhook
   */
  async getWebhookStats(webhookId: string, days: number = 7): Promise<{
    totalDeliveries: number;
    successRate: number;
    averageResponseTime: number;
    deliveriesByStatus: Record<string, number>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await this.supabase
      .from('module_api_webhook_deliveries')
      .select('status, response_time_ms')
      .eq('webhook_id', webhookId)
      .gte('created_at', since);

    if (!data || data.length === 0) {
      return {
        totalDeliveries: 0,
        successRate: 0,
        averageResponseTime: 0,
        deliveriesByStatus: {}
      };
    }

    const byStatus: Record<string, number> = {};
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    for (const d of data) {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
      if (d.response_time_ms) {
        totalResponseTime += d.response_time_ms;
        responseTimeCount++;
      }
    }

    return {
      totalDeliveries: data.length,
      successRate: (byStatus['success'] || 0) / data.length * 100,
      averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
      deliveriesByStatus: byStatus
    };
  }
}

// ============================================================
// FACTORY & EXPORTS
// ============================================================

export function createWebhookDeliveryService(): WebhookDeliveryService {
  return new WebhookDeliveryService();
}
