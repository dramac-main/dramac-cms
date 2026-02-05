/**
 * Integration Types
 * 
 * Phase ECOM-43A: Integrations & Webhooks - Schema & Actions
 * 
 * Type definitions for API keys, webhooks, and external integrations.
 */

// ============================================================================
// API KEYS
// ============================================================================

export type ApiKeyScope = 
  | 'read:products'
  | 'write:products'
  | 'read:orders'
  | 'write:orders'
  | 'read:customers'
  | 'write:customers'
  | 'read:inventory'
  | 'write:inventory'
  | 'read:analytics'
  | 'webhooks:manage'

export interface ApiKey {
  id: string
  site_id: string
  name: string
  key_prefix: string
  scopes: ApiKeyScope[]
  rate_limit_requests: number
  rate_limit_window: number
  last_used_at: string | null
  usage_count: number
  allowed_ips: string[]
  allowed_origins: string[]
  expires_at: string | null
  is_active: boolean
  created_at: string
  created_by: string | null
}

export interface CreateApiKeyInput {
  name: string
  scopes: ApiKeyScope[]
  rate_limit_requests?: number
  rate_limit_window?: number
  allowed_ips?: string[]
  allowed_origins?: string[]
  expires_at?: string
}

export interface UpdateApiKeyInput {
  name?: string
  scopes?: ApiKeyScope[]
  rate_limit_requests?: number
  allowed_ips?: string[]
  allowed_origins?: string[]
  is_active?: boolean
}

export interface ApiKeyWithSecret extends ApiKey {
  secret_key: string  // Only returned on creation
}

// ============================================================================
// WEBHOOKS
// ============================================================================

export type WebhookEventType =
  // Order events
  | 'order.created'
  | 'order.paid'
  | 'order.fulfilled'
  | 'order.cancelled'
  | 'order.refunded'
  // Product events
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.out_of_stock'
  | 'product.back_in_stock'
  // Customer events
  | 'customer.created'
  | 'customer.updated'
  // Inventory events
  | 'inventory.low_stock'
  | 'inventory.adjusted'
  // Cart events
  | 'cart.abandoned'
  // Review events
  | 'review.created'
  | 'review.approved'

export type WebhookEventCategory = 
  | 'order' 
  | 'product' 
  | 'customer' 
  | 'inventory' 
  | 'cart' 
  | 'review'

export interface WebhookEventTypeInfo {
  id: string
  event_type: string
  category: WebhookEventCategory
  name: string
  description: string | null
  payload_schema: Record<string, unknown> | null
  is_active: boolean
  created_at: string
}

export interface WebhookEndpoint {
  id: string
  site_id: string
  name: string
  url: string
  description: string | null
  secret: string
  secret_version: number
  events: WebhookEventType[]
  active: boolean
  timeout_seconds: number
  max_retries: number
  retry_delay_seconds: number
  custom_headers: Record<string, string>
  last_triggered_at: string | null
  last_success_at: string | null
  last_failure_at: string | null
  consecutive_failures: number
  created_at: string
  updated_at: string
}

export interface CreateWebhookInput {
  name: string
  url: string
  description?: string
  events: WebhookEventType[]
  timeout_seconds?: number
  max_retries?: number
  retry_delay_seconds?: number
  custom_headers?: Record<string, string>
}

export interface UpdateWebhookInput {
  name?: string
  url?: string
  description?: string
  events?: WebhookEventType[]
  active?: boolean
  timeout_seconds?: number
  max_retries?: number
  custom_headers?: Record<string, string>
}

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying'

export interface WebhookDelivery {
  id: string
  endpoint_id: string
  event_type: WebhookEventType
  event_id: string
  payload: Record<string, unknown>
  attempt_number: number
  status: WebhookDeliveryStatus
  response_status: number | null
  response_body: string | null
  response_headers: Record<string, string> | null
  response_time_ms: number | null
  error_message: string | null
  scheduled_at: string
  delivered_at: string | null
  next_retry_at: string | null
  created_at: string
}

// ============================================================================
// EXTERNAL INTEGRATIONS
// ============================================================================

export type IntegrationProvider =
  // Payment
  | 'stripe'
  | 'paypal'
  | 'square'
  // Shipping
  | 'ups'
  | 'fedex'
  | 'usps'
  | 'shipstation'
  // Email
  | 'sendgrid'
  | 'mailchimp'
  | 'klaviyo'
  // Accounting
  | 'quickbooks'
  | 'xero'
  // Analytics
  | 'google_analytics'
  | 'facebook_pixel'
  // Other
  | 'custom'

export type IntegrationCategory = 
  | 'payment'
  | 'shipping'
  | 'email'
  | 'accounting'
  | 'analytics'
  | 'marketing'
  | 'crm'
  | 'other'

export type IntegrationStatus = 
  | 'disconnected'
  | 'connected'
  | 'error'
  | 'pending'

export interface Integration {
  id: string
  site_id: string
  provider: IntegrationProvider
  name: string
  category: IntegrationCategory
  config: Record<string, unknown>
  features: Record<string, boolean>
  status: IntegrationStatus
  last_sync_at: string | null
  last_error: string | null
  is_active: boolean
  is_test_mode: boolean
  created_at: string
  updated_at: string
}

export interface ConnectIntegrationInput {
  provider: IntegrationProvider
  name: string
  category: IntegrationCategory
  config: Record<string, unknown>
  credentials: Record<string, unknown>
  features?: Record<string, boolean>
  is_test_mode?: boolean
}

export interface UpdateIntegrationInput {
  name?: string
  config?: Record<string, unknown>
  credentials?: Record<string, unknown>
  features?: Record<string, boolean>
  is_active?: boolean
  is_test_mode?: boolean
}

// ============================================================================
// INTEGRATION LOGS
// ============================================================================

export type IntegrationLogStatus = 'success' | 'error' | 'timeout'
export type IntegrationLogDirection = 'inbound' | 'outbound'

export interface IntegrationLog {
  id: string
  integration_id: string
  action: string
  direction: IntegrationLogDirection
  request_data: Record<string, unknown> | null
  response_data: Record<string, unknown> | null
  status: IntegrationLogStatus
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

// ============================================================================
// SYNC JOBS
// ============================================================================

export type SyncJobType = 
  | 'products_sync'
  | 'orders_sync'
  | 'inventory_sync'
  | 'customers_sync'

export type SyncJobStatus = 'active' | 'paused' | 'completed' | 'failed'

export interface SyncJob {
  id: string
  integration_id: string
  job_type: SyncJobType
  schedule: { cron?: string; interval_minutes?: number } | null
  next_run_at: string | null
  last_run_at: string | null
  status: SyncJobStatus
  total_items: number | null
  processed_items: number | null
  failed_items: number | null
  last_result: Record<string, unknown> | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface CreateSyncJobInput {
  job_type: SyncJobType
  schedule?: { cron?: string; interval_minutes?: number }
}

// ============================================================================
// WEBHOOK PAYLOAD TYPES
// ============================================================================

export interface WebhookPayload<T = Record<string, unknown>> {
  id: string
  event_type: WebhookEventType
  created_at: string
  data: T
  metadata: {
    site_id: string
    api_version: string
    attempt_number: number
  }
}

export interface OrderWebhookData {
  order_id: string
  order_number: string
  status: string
  total: number
  currency: string
  customer_id?: string
  customer_email?: string
  items_count: number
}

export interface ProductWebhookData {
  product_id: string
  sku: string
  name: string
  status: string
  price: number
  inventory_quantity?: number
}

export interface CustomerWebhookData {
  customer_id: string
  email: string
  first_name?: string
  last_name?: string
  total_orders?: number
}
