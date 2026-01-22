/**
 * Phase EM-31: Webhook Service
 * Manages webhooks for external integrations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface Webhook {
  id: string;
  site_id: string;
  module_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  headers: Record<string, string>;
  is_active: boolean;
  success_count: number;
  failure_count: number;
  last_triggered_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  payload: any;
  status: 'pending' | 'success' | 'failed';
  status_code: number | null;
  response: string | null;
  attempts: number;
  max_attempts: number;
  next_retry_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
}

export interface UpdateWebhookInput {
  name?: string;
  url?: string;
  events?: string[];
  headers?: Record<string, string>;
  isActive?: boolean;
}

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export class WebhookService {
  private siteId: string;
  private moduleId: string;
  private supabase: SupabaseClient;

  constructor(siteId: string, moduleId: string, supabaseClient?: SupabaseClient) {
    this.siteId = siteId;
    this.moduleId = moduleId;
    this.supabase = supabaseClient || getServiceClient();
  }

  // ============================================================
  // WEBHOOK MANAGEMENT
  // ============================================================

  /**
   * Create a new webhook
   */
  async createWebhook(input: CreateWebhookInput, createdBy?: string): Promise<{
    webhook: Webhook;
    secret: string;
  }> {
    // Validate URL
    if (!this.isValidWebhookUrl(input.url)) {
      throw new Error('Invalid webhook URL. Must be HTTPS.');
    }

    // Validate events
    if (!input.events || input.events.length === 0) {
      throw new Error('At least one event is required');
    }

    // Generate secret
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;

    const { data, error } = await this.supabase
      .from('module_webhooks')
      .insert({
        site_id: this.siteId,
        module_id: this.moduleId,
        name: input.name,
        url: input.url,
        secret,
        events: input.events,
        headers: input.headers || {},
        is_active: true,
        created_by: createdBy || null
      })
      .select()
      .single();

    if (error) throw error;

    return {
      webhook: data,
      secret // Only returned once
    };
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(webhookId: string): Promise<Webhook | null> {
    const { data, error } = await this.supabase
      .from('module_webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('module_id', this.moduleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Get all webhooks for the module
   */
  async getWebhooks(): Promise<Webhook[]> {
    const { data, error } = await this.supabase
      .from('module_webhooks')
      .select('*')
      .eq('module_id', this.moduleId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get active webhooks for an event
   */
  async getWebhooksForEvent(event: string): Promise<Webhook[]> {
    const { data, error } = await this.supabase
      .from('module_webhooks')
      .select('*')
      .eq('module_id', this.moduleId)
      .eq('is_active', true)
      .contains('events', [event]);

    if (error) throw error;
    return data || [];
  }

  /**
   * Update webhook
   */
  async updateWebhook(webhookId: string, input: UpdateWebhookInput): Promise<Webhook> {
    const updateData: Record<string, any> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.url !== undefined) {
      if (!this.isValidWebhookUrl(input.url)) {
        throw new Error('Invalid webhook URL. Must be HTTPS.');
      }
      updateData.url = input.url;
    }
    if (input.events !== undefined) updateData.events = input.events;
    if (input.headers !== undefined) updateData.headers = input.headers;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await this.supabase
      .from('module_webhooks')
      .update(updateData)
      .eq('id', webhookId)
      .eq('module_id', this.moduleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    const { error } = await this.supabase
      .from('module_webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('module_id', this.moduleId);

    if (error) throw error;
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateSecret(webhookId: string): Promise<string> {
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;

    const { error } = await this.supabase
      .from('module_webhooks')
      .update({ secret })
      .eq('id', webhookId)
      .eq('module_id', this.moduleId);

    if (error) throw error;
    return secret;
  }

  // ============================================================
  // EVENT TRIGGERING
  // ============================================================

  /**
   * Trigger a webhook event
   */
  async trigger(event: string, payload: any): Promise<string[]> {
    // Find all webhooks subscribed to this event
    const webhooks = await this.getWebhooksForEvent(event);
    
    if (webhooks.length === 0) {
      return [];
    }

    const deliveryIds: string[] = [];

    // Create delivery records and process
    for (const webhook of webhooks) {
      const delivery = await this.createDelivery(webhook.id, event, payload);
      deliveryIds.push(delivery.id);
      
      // Process immediately (in production, use a queue like BullMQ)
      this.processDelivery(delivery.id, webhook, event, payload).catch(err => {
        console.error(`Failed to process webhook delivery ${delivery.id}:`, err);
      });
    }

    return deliveryIds;
  }

  /**
   * Trigger webhook event async (fire and forget)
   */
  triggerAsync(event: string, payload: any): void {
    this.trigger(event, payload).catch(err => {
      console.error(`Failed to trigger webhook event ${event}:`, err);
    });
  }

  /**
   * Create a delivery record
   */
  private async createDelivery(
    webhookId: string,
    event: string,
    payload: any
  ): Promise<WebhookDelivery> {
    const { data, error } = await this.supabase
      .from('module_webhook_deliveries')
      .insert({
        webhook_id: webhookId,
        event,
        payload,
        status: 'pending',
        attempts: 0,
        max_attempts: 3
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Process a webhook delivery
   */
  private async processDelivery(
    deliveryId: string,
    webhook: Webhook,
    event: string,
    payload: any
  ): Promise<void> {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(webhook.secret, timestamp, payload);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Dramac-Webhook/1.0',
      'X-Webhook-Event': event,
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-Delivery-ID': deliveryId,
      ...webhook.headers
    };

    let status: 'success' | 'failed' = 'failed';
    let statusCode: number | null = null;
    let responseBody: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event,
          payload,
          timestamp: parseInt(timestamp, 10),
          delivery_id: deliveryId
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      statusCode = response.status;
      responseBody = await response.text().catch(() => null);
      status = response.ok ? 'success' : 'failed';
    } catch (error: any) {
      responseBody = error.name === 'AbortError' 
        ? 'Request timeout (30s)' 
        : error.message;
    }

    // Update delivery record
    await this.supabase
      .from('module_webhook_deliveries')
      .update({
        status,
        status_code: statusCode,
        response: responseBody?.slice(0, 1000),
        attempts: 1,
        completed_at: status === 'success' ? new Date().toISOString() : null,
        next_retry_at: status === 'failed' 
          ? new Date(Date.now() + this.getRetryDelay(1)).toISOString() 
          : null
      })
      .eq('id', deliveryId);
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(secret: string, timestamp: string, payload: any): string {
    const data = `${timestamp}.${JSON.stringify(payload)}`;
    return `sha256=${crypto.createHmac('sha256', secret).update(data).digest('hex')}`;
  }

  /**
   * Get retry delay based on attempt number (exponential backoff)
   */
  private getRetryDelay(attempt: number): number {
    // 1 min, 5 min, 30 min
    const delays = [60 * 1000, 5 * 60 * 1000, 30 * 60 * 1000];
    return delays[Math.min(attempt - 1, delays.length - 1)];
  }

  // ============================================================
  // DELIVERY MANAGEMENT
  // ============================================================

  /**
   * Get delivery history for a webhook
   */
  async getDeliveries(webhookId: string, options?: {
    limit?: number;
    status?: 'pending' | 'success' | 'failed';
  }): Promise<WebhookDelivery[]> {
    let query = this.supabase
      .from('module_webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    } else {
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific delivery
   */
  async getDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
    const { data, error } = await this.supabase
      .from('module_webhook_deliveries')
      .select('*, webhook:module_webhooks(*)')
      .eq('id', deliveryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Retry a failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<void> {
    const { data: delivery, error } = await this.supabase
      .from('module_webhook_deliveries')
      .select('*, webhook:module_webhooks(*)')
      .eq('id', deliveryId)
      .single();

    if (error || !delivery) {
      throw new Error('Delivery not found');
    }

    if (!delivery.webhook) {
      throw new Error('Webhook not found');
    }

    // Reset status and process
    await this.supabase
      .from('module_webhook_deliveries')
      .update({ status: 'pending', next_retry_at: null })
      .eq('id', deliveryId);

    await this.processDelivery(
      deliveryId,
      delivery.webhook,
      delivery.event,
      delivery.payload
    );
  }

  /**
   * Process pending retries
   */
  async processPendingRetries(): Promise<number> {
    // Find deliveries that need retry
    const { data: deliveries, error } = await this.supabase
      .from('module_webhook_deliveries')
      .select('*, webhook:module_webhooks(*)')
      .eq('status', 'failed')
      .lt('attempts', 3)
      .lt('next_retry_at', new Date().toISOString())
      .limit(100);

    if (error) throw error;
    if (!deliveries || deliveries.length === 0) return 0;

    let processed = 0;

    for (const delivery of deliveries) {
      if (!delivery.webhook || !delivery.webhook.is_active) continue;

      try {
        // Update attempt count
        await this.supabase
          .from('module_webhook_deliveries')
          .update({ 
            status: 'pending',
            attempts: delivery.attempts + 1
          })
          .eq('id', delivery.id);

        await this.processDelivery(
          delivery.id,
          delivery.webhook,
          delivery.event,
          delivery.payload
        );
        
        processed++;
      } catch (err) {
        console.error(`Failed to retry delivery ${delivery.id}:`, err);
      }
    }

    return processed;
  }

  // ============================================================
  // SIGNATURE VERIFICATION
  // ============================================================

  /**
   * Verify webhook signature (for incoming webhooks)
   */
  static verifySignature(
    secret: string,
    signature: string,
    timestamp: string,
    payload: any,
    toleranceSeconds: number = 300
  ): { valid: boolean; error?: string } {
    // Check timestamp to prevent replay attacks
    const now = Date.now();
    const ts = parseInt(timestamp, 10);
    
    if (isNaN(ts)) {
      return { valid: false, error: 'Invalid timestamp' };
    }

    if (Math.abs(now - ts) > toleranceSeconds * 1000) {
      return { valid: false, error: 'Timestamp too old or too far in the future' };
    }

    // Compute expected signature
    const data = `${timestamp}.${JSON.stringify(payload)}`;
    const expected = `sha256=${crypto.createHmac('sha256', secret).update(data).digest('hex')}`;

    // Constant-time comparison
    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      );
      return { valid: isValid };
    } catch {
      return { valid: false, error: 'Signature verification failed' };
    }
  }

  /**
   * Parse and verify incoming webhook request
   */
  static parseWebhookRequest(
    secret: string,
    headers: Headers,
    body: string
  ): { valid: boolean; event?: string; payload?: any; error?: string } {
    const signature = headers.get('x-webhook-signature');
    const timestamp = headers.get('x-webhook-timestamp');
    const event = headers.get('x-webhook-event');

    if (!signature || !timestamp) {
      return { valid: false, error: 'Missing signature or timestamp header' };
    }

    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      return { valid: false, error: 'Invalid JSON body' };
    }

    const verification = WebhookService.verifySignature(
      secret,
      signature,
      timestamp,
      payload.payload || payload
    );

    if (!verification.valid) {
      return { valid: false, error: verification.error };
    }

    return {
      valid: true,
      event: event || payload.event,
      payload: payload.payload || payload
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Validate webhook URL
   */
  private isValidWebhookUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      
      // Allow localhost for development
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return true;
      }

      // Must be HTTPS in production
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Test a webhook (send test payload)
   */
  async testWebhook(webhookId: string): Promise<{
    success: boolean;
    statusCode?: number;
    response?: string;
    error?: string;
  }> {
    const webhook = await this.getWebhook(webhookId);
    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    const testPayload = {
      test: true,
      message: 'This is a test webhook delivery',
      timestamp: Date.now()
    };

    const timestamp = Date.now().toString();
    const signature = this.generateSignature(webhook.secret, timestamp, testPayload);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Dramac-Webhook/1.0',
      'X-Webhook-Event': 'test',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp,
      ...webhook.headers
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event: 'test',
          payload: testPayload,
          timestamp: parseInt(timestamp, 10)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text().catch(() => '');

      return {
        success: response.ok,
        statusCode: response.status,
        response: responseText.slice(0, 500)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.name === 'AbortError' ? 'Request timeout' : error.message
      };
    }
  }
}

// ============================================================
// PREDEFINED EVENTS
// ============================================================

export const WebhookEvents = {
  // Module events
  MODULE_INSTALLED: 'module.installed',
  MODULE_UNINSTALLED: 'module.uninstalled',
  MODULE_UPDATED: 'module.updated',
  MODULE_ENABLED: 'module.enabled',
  MODULE_DISABLED: 'module.disabled',

  // Data events
  DATA_CREATED: 'data.created',
  DATA_UPDATED: 'data.updated',
  DATA_DELETED: 'data.deleted',

  // User events
  USER_SIGNED_UP: 'user.signed_up',
  USER_SIGNED_IN: 'user.signed_in',
  USER_UPDATED: 'user.updated',

  // Form events
  FORM_SUBMITTED: 'form.submitted',

  // Payment events
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_FAILED: 'payment.failed',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',

  // Custom event prefix
  CUSTOM: 'custom.'
} as const;

export type WebhookEventType = typeof WebhookEvents[keyof typeof WebhookEvents];
