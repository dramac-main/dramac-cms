# PHASE-ECOM-43A: Integrations & Webhooks - Schema & Actions

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 4-5 hours
> **Prerequisites**: PHASE-ECOM-42A Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create the database schema and server actions for integrations and webhooks, enabling external service connections, API key management, webhook event delivery, and third-party app integrations. This phase delivers the foundation for extending the e-commerce platform.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] PHASE-ECOM-42A complete (marketing schema exists)
- [ ] Run existing migrations: `npx supabase migration up`
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Integrations Architecture (Phase 43A)
├── API Keys
│   ├── Key generation & rotation
│   ├── Scope permissions
│   ├── Rate limiting per key
│   └── Usage tracking
│
├── Webhooks
│   ├── Endpoint registration
│   ├── Event subscriptions
│   ├── Delivery & retries
│   └── Payload signing
│
├── External Integrations
│   ├── Payment gateways (Stripe, PayPal)
│   ├── Shipping carriers (UPS, FedEx, USPS)
│   ├── Email services (SendGrid, Mailchimp)
│   └── Accounting (QuickBooks, Xero)
│
└── Event System
    ├── Event types registry
    ├── Event logging
    └── Async delivery queue
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `migrations/YYYYMMDD_integrations_schema.sql` | Create | Integration tables |
| `modules/ecommerce/types/integration-types.ts` | Create | Type definitions |
| `modules/ecommerce/actions/integration-actions.ts` | Create | Server actions |
| `lib/ecommerce/webhook-utils.ts` | Create | Webhook utilities |
| `lib/ecommerce/api-key-utils.ts` | Create | API key utilities |

---

## 📋 Implementation Tasks

### Task 43A.1: Create Integration Schema

**File**: `next-platform-dashboard/migrations/YYYYMMDD_integrations_schema.sql`
**Action**: Create

```sql
-- ============================================================================
-- PHASE ECOM-43A: Integrations & Webhooks Schema
-- ============================================================================
-- Module: ecommod01 (E-Commerce)
-- 
-- This migration creates tables for:
-- - API keys and authentication
-- - Webhook endpoints and events
-- - External service integrations
-- - Event logging and delivery
-- ============================================================================

-- ============================================================================
-- API KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Key identification
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,  -- First 10 chars for identification
    key_hash VARCHAR(255) NOT NULL,   -- SHA-256 hash of full key
    
    -- Permissions (JSON array of scopes)
    scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example: ["read:products", "write:orders", "read:customers"]
    
    -- Rate limiting
    rate_limit_requests INTEGER DEFAULT 1000,   -- Per hour
    rate_limit_window INTEGER DEFAULT 3600,     -- Window in seconds
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    -- Restrictions
    allowed_ips JSONB DEFAULT '[]'::jsonb,  -- IP whitelist
    allowed_origins JSONB DEFAULT '[]'::jsonb,  -- CORS origins
    
    -- Metadata
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT unique_key_hash UNIQUE(key_hash)
);

CREATE INDEX idx_api_keys_site_id ON mod_ecommod01_api_keys(site_id);
CREATE INDEX idx_api_keys_key_prefix ON mod_ecommod01_api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON mod_ecommod01_api_keys(site_id, is_active);

-- ============================================================================
-- WEBHOOK ENDPOINTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Endpoint configuration
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    
    -- Security
    secret VARCHAR(255) NOT NULL,  -- For signing payloads
    secret_version INTEGER DEFAULT 1,
    
    -- Event subscriptions (JSON array of event types)
    events JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example: ["order.created", "order.paid", "product.updated"]
    
    -- Delivery settings
    active BOOLEAN DEFAULT true,
    timeout_seconds INTEGER DEFAULT 30,
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    
    -- Headers to include
    custom_headers JSONB DEFAULT '{}'::jsonb,
    
    -- Status tracking
    last_triggered_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_endpoints_site_id ON mod_ecommod01_webhook_endpoints(site_id);
CREATE INDEX idx_webhook_endpoints_active ON mod_ecommod01_webhook_endpoints(site_id, active);

-- ============================================================================
-- WEBHOOK EVENTS TABLE (Event Types Registry)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_webhook_event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identification
    event_type VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,  -- order, product, customer, etc.
    
    -- Documentation
    name VARCHAR(255) NOT NULL,
    description TEXT,
    payload_schema JSONB,  -- JSON Schema for payload validation
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default event types
INSERT INTO mod_ecommod01_webhook_event_types (event_type, category, name, description) VALUES
-- Order events
('order.created', 'order', 'Order Created', 'Fired when a new order is placed'),
('order.paid', 'order', 'Order Paid', 'Fired when payment is confirmed'),
('order.fulfilled', 'order', 'Order Fulfilled', 'Fired when order is shipped/completed'),
('order.cancelled', 'order', 'Order Cancelled', 'Fired when an order is cancelled'),
('order.refunded', 'order', 'Order Refunded', 'Fired when a refund is processed'),

-- Product events
('product.created', 'product', 'Product Created', 'Fired when a product is created'),
('product.updated', 'product', 'Product Updated', 'Fired when a product is modified'),
('product.deleted', 'product', 'Product Deleted', 'Fired when a product is deleted'),
('product.out_of_stock', 'product', 'Product Out of Stock', 'Fired when stock reaches zero'),
('product.back_in_stock', 'product', 'Product Back in Stock', 'Fired when stock is replenished'),

-- Customer events
('customer.created', 'customer', 'Customer Created', 'Fired when a customer account is created'),
('customer.updated', 'customer', 'Customer Updated', 'Fired when customer info changes'),

-- Inventory events
('inventory.low_stock', 'inventory', 'Low Stock Alert', 'Fired when stock falls below threshold'),
('inventory.adjusted', 'inventory', 'Inventory Adjusted', 'Fired when stock is manually adjusted'),

-- Cart events
('cart.abandoned', 'cart', 'Cart Abandoned', 'Fired when cart is abandoned (configurable delay)'),

-- Review events
('review.created', 'review', 'Review Created', 'Fired when a review is submitted'),
('review.approved', 'review', 'Review Approved', 'Fired when a review is approved')
ON CONFLICT (event_type) DO NOTHING;

-- ============================================================================
-- WEBHOOK DELIVERIES TABLE (Delivery Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES mod_ecommod01_webhook_endpoints(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL,
    event_id UUID NOT NULL,  -- Reference to the triggering event
    
    -- Payload
    payload JSONB NOT NULL,
    
    -- Delivery tracking
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending, delivered, failed, retrying
    
    -- Response details
    response_status INTEGER,
    response_body TEXT,
    response_headers JSONB,
    response_time_ms INTEGER,
    
    -- Error tracking
    error_message TEXT,
    
    -- Timing
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_endpoint ON mod_ecommod01_webhook_deliveries(endpoint_id);
CREATE INDEX idx_webhook_deliveries_status ON mod_ecommod01_webhook_deliveries(status, scheduled_at);
CREATE INDEX idx_webhook_deliveries_event ON mod_ecommod01_webhook_deliveries(event_type, event_id);

-- ============================================================================
-- EXTERNAL INTEGRATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Integration identification
    provider VARCHAR(100) NOT NULL,
    -- stripe, paypal, ups, fedex, usps, sendgrid, mailchimp, quickbooks, etc.
    
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    -- payment, shipping, email, accounting, analytics, etc.
    
    -- Configuration (encrypted in production)
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- API keys, account IDs, environment settings
    
    -- Credentials (should be encrypted)
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Feature flags
    features JSONB DEFAULT '{}'::jsonb,
    -- Which features are enabled for this integration
    
    -- Status
    status VARCHAR(20) DEFAULT 'disconnected',
    -- disconnected, connected, error, pending
    
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_test_mode BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_site_provider UNIQUE(site_id, provider)
);

CREATE INDEX idx_integrations_site_id ON mod_ecommod01_integrations(site_id);
CREATE INDEX idx_integrations_category ON mod_ecommod01_integrations(site_id, category);
CREATE INDEX idx_integrations_provider ON mod_ecommod01_integrations(provider);

-- ============================================================================
-- INTEGRATION LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES mod_ecommod01_integrations(id) ON DELETE CASCADE,
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    direction VARCHAR(10) NOT NULL,  -- inbound, outbound
    
    -- Request/Response
    request_data JSONB,
    response_data JSONB,
    
    -- Status
    status VARCHAR(20) NOT NULL,  -- success, error, timeout
    error_message TEXT,
    
    -- Performance
    duration_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_integration_logs_integration ON mod_ecommod01_integration_logs(integration_id);
CREATE INDEX idx_integration_logs_created ON mod_ecommod01_integration_logs(created_at DESC);

-- ============================================================================
-- SYNC JOBS TABLE (For scheduled syncs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES mod_ecommod01_integrations(id) ON DELETE CASCADE,
    
    -- Job details
    job_type VARCHAR(100) NOT NULL,
    -- products_sync, orders_sync, inventory_sync, customers_sync
    
    -- Scheduling
    schedule JSONB,  -- Cron expression or interval
    next_run_at TIMESTAMPTZ,
    last_run_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',  -- active, paused, completed, failed
    
    -- Progress tracking
    total_items INTEGER,
    processed_items INTEGER,
    failed_items INTEGER,
    
    -- Results
    last_result JSONB,
    last_error TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_jobs_integration ON mod_ecommod01_sync_jobs(integration_id);
CREATE INDEX idx_sync_jobs_next_run ON mod_ecommod01_sync_jobs(next_run_at) WHERE status = 'active';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE mod_ecommod01_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for API keys
CREATE POLICY api_keys_site_access ON mod_ecommod01_api_keys
    FOR ALL USING (
        site_id IN (
            SELECT site_id FROM site_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Policies for webhook endpoints
CREATE POLICY webhook_endpoints_site_access ON mod_ecommod01_webhook_endpoints
    FOR ALL USING (
        site_id IN (
            SELECT site_id FROM site_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policies for webhook deliveries
CREATE POLICY webhook_deliveries_access ON mod_ecommod01_webhook_deliveries
    FOR ALL USING (
        endpoint_id IN (
            SELECT id FROM mod_ecommod01_webhook_endpoints
            WHERE site_id IN (
                SELECT site_id FROM site_members WHERE user_id = auth.uid()
            )
        )
    );

-- Policies for integrations
CREATE POLICY integrations_site_access ON mod_ecommod01_integrations
    FOR ALL USING (
        site_id IN (
            SELECT site_id FROM site_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Policies for integration logs
CREATE POLICY integration_logs_access ON mod_ecommod01_integration_logs
    FOR ALL USING (
        integration_id IN (
            SELECT id FROM mod_ecommod01_integrations
            WHERE site_id IN (
                SELECT site_id FROM site_members WHERE user_id = auth.uid()
            )
        )
    );

-- Policies for sync jobs
CREATE POLICY sync_jobs_access ON mod_ecommod01_sync_jobs
    FOR ALL USING (
        integration_id IN (
            SELECT id FROM mod_ecommod01_integrations
            WHERE site_id IN (
                SELECT site_id FROM site_members WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate secure API key
CREATE OR REPLACE FUNCTION generate_api_key(prefix TEXT DEFAULT 'sk')
RETURNS TEXT AS $$
DECLARE
    key_bytes BYTEA;
    key_str TEXT;
BEGIN
    key_bytes := gen_random_bytes(32);
    key_str := prefix || '_' || encode(key_bytes, 'base64');
    -- Remove non-URL-safe characters
    key_str := replace(replace(key_str, '+', ''), '/', '');
    RETURN substring(key_str, 1, 48);
END;
$$ LANGUAGE plpgsql;

-- Function to generate webhook signature
CREATE OR REPLACE FUNCTION generate_webhook_signature(
    payload TEXT,
    secret TEXT,
    timestamp BIGINT
)
RETURNS TEXT AS $$
DECLARE
    message TEXT;
BEGIN
    message := timestamp::TEXT || '.' || payload;
    RETURN encode(
        hmac(message::bytea, secret::bytea, 'sha256'),
        'hex'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to rotate API key
CREATE OR REPLACE FUNCTION rotate_api_key(key_id UUID)
RETURNS TABLE(new_key TEXT, new_prefix VARCHAR(10)) AS $$
DECLARE
    new_api_key TEXT;
    new_key_prefix VARCHAR(10);
BEGIN
    new_api_key := generate_api_key('sk');
    new_key_prefix := substring(new_api_key, 1, 10);
    
    UPDATE mod_ecommod01_api_keys
    SET 
        key_prefix = new_key_prefix,
        key_hash = encode(sha256(new_api_key::bytea), 'hex'),
        updated_at = NOW()
    WHERE id = key_id;
    
    RETURN QUERY SELECT new_api_key, new_key_prefix;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_integration_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_webhook_endpoints_updated
    BEFORE UPDATE ON mod_ecommod01_webhook_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_timestamps();

CREATE TRIGGER trigger_integrations_updated
    BEFORE UPDATE ON mod_ecommod01_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_timestamps();

CREATE TRIGGER trigger_sync_jobs_updated
    BEFORE UPDATE ON mod_ecommod01_sync_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_timestamps();

-- Track consecutive webhook failures
CREATE OR REPLACE FUNCTION track_webhook_failures()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'failed' THEN
        UPDATE mod_ecommod01_webhook_endpoints
        SET 
            consecutive_failures = consecutive_failures + 1,
            last_failure_at = NOW()
        WHERE id = NEW.endpoint_id;
    ELSIF NEW.status = 'delivered' THEN
        UPDATE mod_ecommod01_webhook_endpoints
        SET 
            consecutive_failures = 0,
            last_success_at = NOW(),
            last_triggered_at = NOW()
        WHERE id = NEW.endpoint_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_webhook_delivery
    AFTER INSERT OR UPDATE ON mod_ecommod01_webhook_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION track_webhook_failures();

-- Auto-disable webhooks after too many failures
CREATE OR REPLACE FUNCTION auto_disable_failing_webhook()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.consecutive_failures >= 10 THEN
        NEW.active = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_disable_webhook
    BEFORE UPDATE ON mod_ecommod01_webhook_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION auto_disable_failing_webhook();
```

---

### Task 43A.2: Create Integration Types

**File**: `src/modules/ecommerce/types/integration-types.ts`
**Action**: Create

```typescript
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
  event_type: WebhookEventType
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
```

---

### Task 43A.3: Create API Key Utilities

**File**: `src/lib/ecommerce/api-key-utils.ts`
**Action**: Create

```typescript
/**
 * API Key Utilities
 * 
 * Phase ECOM-43A: Integrations & Webhooks - Schema & Actions
 * 
 * Utilities for generating, validating, and managing API keys.
 */

import crypto from 'crypto'
import type { ApiKeyScope } from '@/modules/ecommerce/types/integration-types'

// ============================================================================
// CONSTANTS
// ============================================================================

const API_KEY_PREFIX = 'sk'
const API_KEY_LENGTH = 48

// ============================================================================
// KEY GENERATION
// ============================================================================

/**
 * Generate a secure API key
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const randomBytes = crypto.randomBytes(32)
  const base64 = randomBytes.toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '')
  
  const key = `${API_KEY_PREFIX}_${base64}`.substring(0, API_KEY_LENGTH)
  const prefix = key.substring(0, 10)
  const hash = hashApiKey(key)
  
  return { key, prefix, hash }
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(key: string): string {
  return crypto
    .createHash('sha256')
    .update(key)
    .digest('hex')
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  const computedHash = hashApiKey(key)
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(hash, 'hex')
  )
}

// ============================================================================
// KEY VALIDATION
// ============================================================================

/**
 * Check if an API key format is valid
 */
export function isValidApiKeyFormat(key: string): boolean {
  // sk_xxxxx format, 48 chars total
  const pattern = /^sk_[A-Za-z0-9]{45}$/
  return pattern.test(key)
}

/**
 * Extract prefix from API key
 */
export function extractKeyPrefix(key: string): string {
  return key.substring(0, 10)
}

// ============================================================================
// SCOPE CHECKING
// ============================================================================

/**
 * All available API key scopes
 */
export const ALL_SCOPES: ApiKeyScope[] = [
  'read:products',
  'write:products',
  'read:orders',
  'write:orders',
  'read:customers',
  'write:customers',
  'read:inventory',
  'write:inventory',
  'read:analytics',
  'webhooks:manage'
]

/**
 * Scope descriptions for UI
 */
export const SCOPE_DESCRIPTIONS: Record<ApiKeyScope, string> = {
  'read:products': 'View products and variants',
  'write:products': 'Create, update, delete products',
  'read:orders': 'View orders and order history',
  'write:orders': 'Create and update orders',
  'read:customers': 'View customer information',
  'write:customers': 'Create and update customers',
  'read:inventory': 'View inventory levels',
  'write:inventory': 'Adjust inventory',
  'read:analytics': 'View analytics and reports',
  'webhooks:manage': 'Manage webhook endpoints'
}

/**
 * Group scopes by resource
 */
export function groupScopesByResource(scopes: ApiKeyScope[]): Record<string, ApiKeyScope[]> {
  const groups: Record<string, ApiKeyScope[]> = {}
  
  for (const scope of scopes) {
    const [action, resource] = scope.split(':')
    if (!groups[resource]) {
      groups[resource] = []
    }
    groups[resource].push(scope)
  }
  
  return groups
}

/**
 * Check if scopes include a specific permission
 */
export function hasScope(scopes: ApiKeyScope[], required: ApiKeyScope): boolean {
  return scopes.includes(required)
}

/**
 * Check if scopes include any of the required permissions
 */
export function hasAnyScope(scopes: ApiKeyScope[], required: ApiKeyScope[]): boolean {
  return required.some(r => scopes.includes(r))
}

/**
 * Check if scopes include all required permissions
 */
export function hasAllScopes(scopes: ApiKeyScope[], required: ApiKeyScope[]): boolean {
  return required.every(r => scopes.includes(r))
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Default rate limit settings
 */
export const DEFAULT_RATE_LIMIT = {
  requests: 1000,
  window: 3600 // 1 hour in seconds
}

/**
 * Rate limit presets
 */
export const RATE_LIMIT_PRESETS = {
  low: { requests: 100, window: 3600 },
  standard: { requests: 1000, window: 3600 },
  high: { requests: 10000, window: 3600 },
  unlimited: { requests: -1, window: 3600 }
}

// ============================================================================
// KEY MASKING
// ============================================================================

/**
 * Mask an API key for display (show only prefix)
 */
export function maskApiKey(key: string): string {
  if (key.length < 10) return '***'
  return `${key.substring(0, 10)}${'•'.repeat(Math.min(key.length - 10, 20))}`
}

/**
 * Format key for display with last 4 characters
 */
export function formatKeyForDisplay(keyPrefix: string): string {
  return `${keyPrefix}${'•'.repeat(20)}`
}
```

---

### Task 43A.4: Create Webhook Utilities

**File**: `src/lib/ecommerce/webhook-utils.ts`
**Action**: Create

```typescript
/**
 * Webhook Utilities
 * 
 * Phase ECOM-43A: Integrations & Webhooks - Schema & Actions
 * 
 * Utilities for signing, verifying, and delivering webhooks.
 */

import crypto from 'crypto'
import type { 
  WebhookPayload,
  WebhookEventType,
  WebhookEndpoint 
} from '@/modules/ecommerce/types/integration-types'

// ============================================================================
// CONSTANTS
// ============================================================================

const WEBHOOK_SIGNATURE_HEADER = 'X-Webhook-Signature'
const WEBHOOK_TIMESTAMP_HEADER = 'X-Webhook-Timestamp'
const WEBHOOK_ID_HEADER = 'X-Webhook-ID'
const SIGNATURE_TOLERANCE_SECONDS = 300 // 5 minutes

// ============================================================================
// SECRET GENERATION
// ============================================================================

/**
 * Generate a webhook signing secret
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('base64url')}`
}

// ============================================================================
// SIGNATURE GENERATION & VERIFICATION
// ============================================================================

/**
 * Generate signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const message = `${timestamp}.${payload}`
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex')
}

/**
 * Create signature header value
 */
export function createSignatureHeader(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const signature = generateWebhookSignature(payload, secret, timestamp)
  return `t=${timestamp},v1=${signature}`
}

/**
 * Parse signature header
 */
export function parseSignatureHeader(header: string): {
  timestamp: number
  signatures: string[]
} | null {
  const parts = header.split(',')
  let timestamp = 0
  const signatures: string[] = []
  
  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') {
      timestamp = parseInt(value, 10)
    } else if (key.startsWith('v')) {
      signatures.push(value)
    }
  }
  
  if (timestamp === 0 || signatures.length === 0) {
    return null
  }
  
  return { timestamp, signatures }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  header: string,
  secret: string,
  toleranceSeconds: number = SIGNATURE_TOLERANCE_SECONDS
): { valid: boolean; error?: string } {
  const parsed = parseSignatureHeader(header)
  
  if (!parsed) {
    return { valid: false, error: 'Invalid signature header format' }
  }
  
  const { timestamp, signatures } = parsed
  
  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return { valid: false, error: 'Timestamp outside tolerance window' }
  }
  
  // Generate expected signature
  const expectedSignature = generateWebhookSignature(payload, secret, timestamp)
  
  // Compare signatures (timing-safe)
  const isValid = signatures.some(sig => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(sig, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    } catch {
      return false
    }
  })
  
  if (!isValid) {
    return { valid: false, error: 'Signature mismatch' }
  }
  
  return { valid: true }
}

// ============================================================================
// PAYLOAD CONSTRUCTION
// ============================================================================

/**
 * Create a webhook payload
 */
export function createWebhookPayload<T>(
  eventType: WebhookEventType,
  data: T,
  siteId: string,
  apiVersion: string = '2024-01-01'
): WebhookPayload<T> {
  return {
    id: crypto.randomUUID(),
    event_type: eventType,
    created_at: new Date().toISOString(),
    data,
    metadata: {
      site_id: siteId,
      api_version: apiVersion,
      attempt_number: 1
    }
  }
}

/**
 * Serialize payload for signing
 */
export function serializePayload(payload: WebhookPayload): string {
  return JSON.stringify(payload)
}

// ============================================================================
// DELIVERY
// ============================================================================

interface DeliveryOptions {
  timeout?: number
  headers?: Record<string, string>
}

interface DeliveryResult {
  success: boolean
  status?: number
  body?: string
  headers?: Record<string, string>
  error?: string
  duration_ms: number
}

/**
 * Deliver a webhook to an endpoint
 */
export async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string,
  options: DeliveryOptions = {}
): Promise<DeliveryResult> {
  const { timeout = 30000, headers = {} } = options
  const startTime = Date.now()
  
  try {
    const payloadString = serializePayload(payload)
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = createSignatureHeader(payloadString, secret, timestamp)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [WEBHOOK_SIGNATURE_HEADER]: signature,
        [WEBHOOK_TIMESTAMP_HEADER]: String(timestamp),
        [WEBHOOK_ID_HEADER]: payload.id,
        ...headers
      },
      body: payloadString,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    const duration_ms = Date.now() - startTime
    const body = await response.text()
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })
    
    return {
      success: response.ok,
      status: response.status,
      body,
      headers: responseHeaders,
      duration_ms
    }
  } catch (error) {
    const duration_ms = Date.now() - startTime
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out',
          duration_ms
        }
      }
      return {
        success: false,
        error: error.message,
        duration_ms
      }
    }
    
    return {
      success: false,
      error: 'Unknown error',
      duration_ms
    }
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Calculate next retry delay with exponential backoff
 */
export function calculateRetryDelay(
  attemptNumber: number,
  baseDelaySeconds: number = 60,
  maxDelaySeconds: number = 86400 // 24 hours
): number {
  const delay = baseDelaySeconds * Math.pow(2, attemptNumber - 1)
  return Math.min(delay, maxDelaySeconds)
}

/**
 * Determine if delivery should be retried
 */
export function shouldRetry(
  status: number | undefined,
  attemptNumber: number,
  maxRetries: number
): boolean {
  // Don't retry if max attempts reached
  if (attemptNumber >= maxRetries) {
    return false
  }
  
  // Retry on network errors (no status)
  if (status === undefined) {
    return true
  }
  
  // Retry on 5xx server errors
  if (status >= 500 && status < 600) {
    return true
  }
  
  // Retry on 429 rate limit
  if (status === 429) {
    return true
  }
  
  // Don't retry on 4xx client errors (except 429)
  return false
}

// ============================================================================
// EVENT CATEGORIES
// ============================================================================

/**
 * Get category for an event type
 */
export function getEventCategory(eventType: WebhookEventType): string {
  return eventType.split('.')[0]
}

/**
 * Group events by category
 */
export function groupEventsByCategory(
  events: WebhookEventType[]
): Record<string, WebhookEventType[]> {
  const groups: Record<string, WebhookEventType[]> = {}
  
  for (const event of events) {
    const category = getEventCategory(event)
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(event)
  }
  
  return groups
}

// ============================================================================
// HEADER CONSTANTS (for export)
// ============================================================================

export const WEBHOOK_HEADERS = {
  SIGNATURE: WEBHOOK_SIGNATURE_HEADER,
  TIMESTAMP: WEBHOOK_TIMESTAMP_HEADER,
  ID: WEBHOOK_ID_HEADER
}
```

---

### Task 43A.5: Create Integration Actions

**File**: `src/modules/ecommerce/actions/integration-actions.ts`
**Action**: Create

```typescript
/**
 * Integration Server Actions
 * 
 * Phase ECOM-43A: Integrations & Webhooks - Schema & Actions
 * 
 * Server actions for managing API keys, webhooks, and integrations.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateApiKey, hashApiKey } from '@/lib/ecommerce/api-key-utils'
import { generateWebhookSecret } from '@/lib/ecommerce/webhook-utils'
import type {
  ApiKey,
  ApiKeyWithSecret,
  CreateApiKeyInput,
  UpdateApiKeyInput,
  WebhookEndpoint,
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookDelivery,
  WebhookEventTypeInfo,
  Integration,
  ConnectIntegrationInput,
  UpdateIntegrationInput,
  IntegrationLog,
  SyncJob,
  CreateSyncJobInput
} from '@/modules/ecommerce/types/integration-types'

// ============================================================================
// API KEYS
// ============================================================================

/**
 * Get all API keys for a site
 */
export async function getApiKeys(siteId: string): Promise<ApiKey[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_api_keys')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Failed to fetch API keys:', error)
    return []
  }
  
  return data as ApiKey[]
}

/**
 * Create a new API key
 * Returns the full key only once - it cannot be retrieved later
 */
export async function createApiKey(
  siteId: string,
  input: CreateApiKeyInput
): Promise<{ success: boolean; key?: ApiKeyWithSecret; error?: string }> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }
  
  // Generate key
  const { key: secretKey, prefix, hash } = generateApiKey()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_api_keys')
    .insert({
      site_id: siteId,
      name: input.name,
      key_prefix: prefix,
      key_hash: hash,
      scopes: input.scopes,
      rate_limit_requests: input.rate_limit_requests ?? 1000,
      rate_limit_window: input.rate_limit_window ?? 3600,
      allowed_ips: input.allowed_ips ?? [],
      allowed_origins: input.allowed_origins ?? [],
      expires_at: input.expires_at,
      created_by: user.id
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create API key:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/dashboard/[siteId]/settings/api')
  
  return {
    success: true,
    key: {
      ...(data as ApiKey),
      secret_key: secretKey
    }
  }
}

/**
 * Update an API key
 */
export async function updateApiKey(
  keyId: string,
  input: UpdateApiKeyInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mod_ecommod01_api_keys')
    .update(input)
    .eq('id', keyId)
  
  if (error) {
    console.error('Failed to update API key:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/dashboard/[siteId]/settings/api')
  return { success: true }
}

/**
 * Revoke (delete) an API key
 */
export async function revokeApiKey(
  keyId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mod_ecommod01_api_keys')
    .delete()
    .eq('id', keyId)
  
  if (error) {
    console.error('Failed to revoke API key:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/dashboard/[siteId]/settings/api')
  return { success: true }
}

/**
 * Rotate an API key (generate new key, same permissions)
 */
export async function rotateApiKey(
  keyId: string
): Promise<{ success: boolean; key?: ApiKeyWithSecret; error?: string }> {
  const supabase = await createClient()
  
  // Get existing key
  const { data: existing } = await supabase
    .from('mod_ecommod01_api_keys')
    .select('*')
    .eq('id', keyId)
    .single()
  
  if (!existing) {
    return { success: false, error: 'API key not found' }
  }
  
  // Generate new key
  const { key: secretKey, prefix, hash } = generateApiKey()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_api_keys')
    .update({
      key_prefix: prefix,
      key_hash: hash
    })
    .eq('id', keyId)
    .select()
    .single()
  
  if (error) {
    console.error('Failed to rotate API key:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/dashboard/[siteId]/settings/api')
  
  return {
    success: true,
    key: {
      ...(data as ApiKey),
      secret_key: secretKey
    }
  }
}

// ============================================================================
// WEBHOOKS
// ============================================================================

/**
 * Get all webhook endpoints for a site
 */
export async function getWebhookEndpoints(siteId: string): Promise<WebhookEndpoint[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_webhook_endpoints')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Failed to fetch webhook endpoints:', error)
    return []
  }
  
  return data as WebhookEndpoint[]
}

/**
 * Get all available webhook event types
 */
export async function getWebhookEventTypes(): Promise<WebhookEventTypeInfo[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_webhook_event_types')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
  
  if (error) {
    console.error('Failed to fetch event types:', error)
    return []
  }
  
  return data as WebhookEventTypeInfo[]
}

/**
 * Create a new webhook endpoint
 */
export async function createWebhookEndpoint(
  siteId: string,
  input: CreateWebhookInput
): Promise<{ success: boolean; endpoint?: WebhookEndpoint; error?: string }> {
  const supabase = await createClient()
  
  const secret = generateWebhookSecret()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_webhook_endpoints')
    .insert({
      site_id: siteId,
      name: input.name,
      url: input.url,
      description: input.description,
      secret,
      events: input.events,
      timeout_seconds: input.timeout_seconds ?? 30,
      max_retries: input.max_retries ?? 3,
      retry_delay_seconds: input.retry_delay_seconds ?? 60,
      custom_headers: input.custom_headers ?? {}
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create webhook endpoint:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/dashboard/[siteId]/settings/webhooks')
  return { success: true, endpoint: data as WebhookEndpoint }
}

/**
 * Update a webhook endpoint
 */
export async function updateWebhookEndpoint(
  endpointId: string,
  input: UpdateWebhookInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mod_ecommod01_webhook_endpoints')
    .update(input)
    .eq('id', endpointId)
  
  if (error) {
    console.error('Failed to update webhook endpoint:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/dashboard/[siteId]/settings/webhooks')
  return { success: true }
}

/**
 * Delete a webhook endpoint
 */
export async function deleteWebhookEndpoint(
  endpointId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mod_ecommod01_webhook_endpoints')
    .delete()
    .eq('id', endpointId)
  
  if (error) {
    console.error('Failed to delete webhook endpoint:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/dashboard/[siteId]/settings/webhooks')
  return { success: true }
}

/**
 * Rotate webhook secret
 */
export async function rotateWebhookSecret(
  endpointId: string
): Promise<{ success: boolean; secret?: string; error?: string }> {
  const supabase = await createClient()
  
  const newSecret = generateWebhookSecret()
  
  // Get current version
  const { data: current } = await supabase
    .from('mod_ecommod01_webhook_endpoints')
    .select('secret_version')
    .eq('id', endpointId)
    .single()
  
  const { error } = await supabase
    .from('mod_ecommod01_webhook_endpoints')
    .update({
      secret: newSecret,
      secret_version: (current?.secret_version ?? 0) + 1
    })
    .eq('id', endpointId)
  
  if (error) {
    console.error('Failed to rotate webhook secret:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/dashboard/[siteId]/settings/webhooks')
  return { success: true, secret: newSecret }
}

/**
 * Get webhook delivery history
 */
export async function getWebhookDeliveries(
  endpointId: string,
  limit: number = 50
): Promise<WebhookDelivery[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_webhook_deliveries')
    .select('*')
    .eq('endpoint_id', endpointId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Failed to fetch webhook deliveries:', error)
    return []
  }
  
  return data as WebhookDelivery[]
}

/**
 * Test a webhook endpoint
 */
export async function testWebhookEndpoint(
  endpointId: string
): Promise<{ success: boolean; delivery?: WebhookDelivery; error?: string }> {
  const supabase = await createClient()
  
  // Get endpoint
  const { data: endpoint } = await supabase
    .from('mod_ecommod01_webhook_endpoints')
    .select('*')
    .eq('id', endpointId)
    .single()
  
  if (!endpoint) {
    return { success: false, error: 'Endpoint not found' }
  }
  
  // Create test payload
  const testPayload = {
    id: crypto.randomUUID(),
    event_type: 'test.ping',
    created_at: new Date().toISOString(),
    data: { message: 'This is a test webhook' },
    metadata: {
      site_id: endpoint.site_id,
      api_version: '2024-01-01',
      attempt_number: 1
    }
  }
  
  // Record delivery attempt
  const { data: delivery, error: insertError } = await supabase
    .from('mod_ecommod01_webhook_deliveries')
    .insert({
      endpoint_id: endpointId,
      event_type: 'test.ping',
      event_id: testPayload.id,
      payload: testPayload,
      status: 'pending'
    })
    .select()
    .single()
  
  if (insertError) {
    return { success: false, error: 'Failed to create delivery record' }
  }
  
  // Deliver webhook (in production, this would be done async)
  try {
    const startTime = Date.now()
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...endpoint.custom_headers
      },
      body: JSON.stringify(testPayload)
    })
    
    const duration = Date.now() - startTime
    const body = await response.text()
    
    // Update delivery record
    await supabase
      .from('mod_ecommod01_webhook_deliveries')
      .update({
        status: response.ok ? 'delivered' : 'failed',
        response_status: response.status,
        response_body: body.substring(0, 1000),
        response_time_ms: duration,
        delivered_at: new Date().toISOString()
      })
      .eq('id', delivery.id)
    
    return { 
      success: response.ok, 
      delivery: delivery as WebhookDelivery,
      error: response.ok ? undefined : `HTTP ${response.status}`
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    
    await supabase
      .from('mod_ecommod01_webhook_deliveries')
      .update({
        status: 'failed',
        error_message: errorMessage
      })
      .eq('id', delivery.id)
    
    return { success: false, error: errorMessage }
  }
}

// ============================================================================
// EXTERNAL INTEGRATIONS
// ============================================================================

/**
 * Get all integrations for a site
 */
export async function getIntegrations(siteId: string): Promise<Integration[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_integrations')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Failed to fetch integrations:', error)
    return []
  }
  
  // Remove sensitive credential data
  return (data as Integration[]).map(i => ({
    ...i,
    credentials: {} // Don't expose credentials
  }))
}

/**
 * Get integration by provider
 */
export async function getIntegrationByProvider(
  siteId: string,
  provider: string
): Promise<Integration | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_integrations')
    .select('*')
    .eq('site_id', siteId)
    .eq('provider', provider)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return {
    ...(data as Integration),
    credentials: {} // Don't expose credentials
  }
}

/**
 * Connect a new integration
 */
export async function connectIntegration(
  siteId: string,
  input: ConnectIntegrationInput
): Promise<{ success: boolean; integration?: Integration; error?: string }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_integrations')
    .insert({
      site_id: siteId,
      provider: input.provider,
      name: input.name,
      category: input.category,
      config: input.config,
      credentials: input.credentials,
      features: input.features ?? {},
      is_test_mode: input.is_test_mode ?? false,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to connect integration:', error)
    return { success: false, error: error.message }
  }
  
  // In production, verify connection here
  // For now, just mark as connected
  await supabase
    .from('mod_ecommod01_integrations')
    .update({ status: 'connected' })
    .eq('id', data.id)
  
  revalidatePath('/dashboard/[siteId]/settings/integrations')
  
  return { 
    success: true, 
    integration: { ...(data as Integration), credentials: {} } 
  }
}

/**
 * Update an integration
 */
export async function updateIntegration(
  integrationId: string,
  input: UpdateIntegrationInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mod_ecommod01_integrations')
    .update(input)
    .eq('id', integrationId)
  
  if (error) {
    console.error('Failed to update integration:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/dashboard/[siteId]/settings/integrations')
  return { success: true }
}

/**
 * Disconnect an integration
 */
export async function disconnectIntegration(
  integrationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mod_ecommod01_integrations')
    .delete()
    .eq('id', integrationId)
  
  if (error) {
    console.error('Failed to disconnect integration:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/dashboard/[siteId]/settings/integrations')
  return { success: true }
}

/**
 * Get integration logs
 */
export async function getIntegrationLogs(
  integrationId: string,
  limit: number = 100
): Promise<IntegrationLog[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_integration_logs')
    .select('*')
    .eq('integration_id', integrationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Failed to fetch integration logs:', error)
    return []
  }
  
  return data as IntegrationLog[]
}

// ============================================================================
// SYNC JOBS
// ============================================================================

/**
 * Get sync jobs for an integration
 */
export async function getSyncJobs(integrationId: string): Promise<SyncJob[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_sync_jobs')
    .select('*')
    .eq('integration_id', integrationId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Failed to fetch sync jobs:', error)
    return []
  }
  
  return data as SyncJob[]
}

/**
 * Create a sync job
 */
export async function createSyncJob(
  integrationId: string,
  input: CreateSyncJobInput
): Promise<{ success: boolean; job?: SyncJob; error?: string }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mod_ecommod01_sync_jobs')
    .insert({
      integration_id: integrationId,
      job_type: input.job_type,
      schedule: input.schedule,
      status: 'active'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create sync job:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, job: data as SyncJob }
}

/**
 * Toggle sync job status
 */
export async function toggleSyncJob(
  jobId: string,
  status: 'active' | 'paused'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mod_ecommod01_sync_jobs')
    .update({ status })
    .eq('id', jobId)
  
  if (error) {
    console.error('Failed to toggle sync job:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

/**
 * Run a sync job manually
 */
export async function runSyncJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // Mark job as running
  await supabase
    .from('mod_ecommod01_sync_jobs')
    .update({
      last_run_at: new Date().toISOString(),
      processed_items: 0,
      failed_items: 0
    })
    .eq('id', jobId)
  
  // In production, this would trigger the actual sync
  // For now, just simulate completion
  await supabase
    .from('mod_ecommod01_sync_jobs')
    .update({
      last_result: { status: 'completed', message: 'Sync completed' }
    })
    .eq('id', jobId)
  
  return { success: true }
}
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Migration runs successfully
- [ ] API key generation works
- [ ] API key hash verification works
- [ ] Webhook secret generation works
- [ ] Webhook signature verification works
- [ ] All server actions function correctly
- [ ] RLS policies work correctly

---

## 🔄 Rollback Plan

If issues occur:

```bash
# Revert migration
npx supabase migration repair YYYYMMDD_integrations_schema --status reverted

# Restore files
git checkout HEAD~1 -- src/modules/ecommerce/types/integration-types.ts
git checkout HEAD~1 -- src/modules/ecommerce/actions/integration-actions.ts
git checkout HEAD~1 -- src/lib/ecommerce/api-key-utils.ts
git checkout HEAD~1 -- src/lib/ecommerce/webhook-utils.ts
```

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add PHASE-ECOM-43A completion note
- `progress.md`: Update Wave 5 section - Integrations schema complete

---

## ✨ Success Criteria

- [ ] All integration tables created
- [ ] API key CRUD operations work
- [ ] Webhook endpoint CRUD operations work
- [ ] Webhook delivery logging works
- [ ] Integration connection flow works
- [ ] Sync job management works
- [ ] RLS policies enforce access control
- [ ] Zero TypeScript errors
