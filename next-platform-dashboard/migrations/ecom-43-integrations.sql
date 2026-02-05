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
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_api_key_hash UNIQUE(key_hash)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_site_id ON mod_ecommod01_api_keys(site_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON mod_ecommod01_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON mod_ecommod01_api_keys(site_id, is_active);

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

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_site_id ON mod_ecommod01_webhook_endpoints(site_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON mod_ecommod01_webhook_endpoints(site_id, active);

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

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON mod_ecommod01_webhook_deliveries(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON mod_ecommod01_webhook_deliveries(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON mod_ecommod01_webhook_deliveries(event_type, event_id);

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

CREATE INDEX IF NOT EXISTS idx_integrations_site_id ON mod_ecommod01_integrations(site_id);
CREATE INDEX IF NOT EXISTS idx_integrations_category ON mod_ecommod01_integrations(site_id, category);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON mod_ecommod01_integrations(provider);

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

CREATE INDEX IF NOT EXISTS idx_integration_logs_integration ON mod_ecommod01_integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created ON mod_ecommod01_integration_logs(created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_sync_jobs_integration ON mod_ecommod01_sync_jobs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_next_run ON mod_ecommod01_sync_jobs(next_run_at) WHERE status = 'active';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE mod_ecommod01_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for API keys (site isolation through agency_members)
CREATE POLICY ecommod01_api_keys_site_access ON mod_ecommod01_api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sites s
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE s.id = site_id AND am.user_id = auth.uid()
        )
    );

-- Policies for webhook endpoints
CREATE POLICY ecommod01_webhook_endpoints_site_access ON mod_ecommod01_webhook_endpoints
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sites s
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE s.id = site_id AND am.user_id = auth.uid()
        )
    );

-- Policies for webhook deliveries
CREATE POLICY ecommod01_webhook_deliveries_access ON mod_ecommod01_webhook_deliveries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM mod_ecommod01_webhook_endpoints we
            JOIN sites s ON s.id = we.site_id
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE we.id = endpoint_id AND am.user_id = auth.uid()
        )
    );

-- Policies for integrations
CREATE POLICY ecommod01_integrations_site_access ON mod_ecommod01_integrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sites s
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE s.id = site_id AND am.user_id = auth.uid()
        )
    );

-- Policies for integration logs
CREATE POLICY ecommod01_integration_logs_access ON mod_ecommod01_integration_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM mod_ecommod01_integrations i
            JOIN sites s ON s.id = i.site_id
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE i.id = integration_id AND am.user_id = auth.uid()
        )
    );

-- Policies for sync jobs
CREATE POLICY ecommod01_sync_jobs_access ON mod_ecommod01_sync_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM mod_ecommod01_integrations i
            JOIN sites s ON s.id = i.site_id
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE i.id = integration_id AND am.user_id = auth.uid()
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_ecommod01_integration_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_webhook_endpoints_updated ON mod_ecommod01_webhook_endpoints;
CREATE TRIGGER trigger_webhook_endpoints_updated
    BEFORE UPDATE ON mod_ecommod01_webhook_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_ecommod01_integration_timestamps();

DROP TRIGGER IF EXISTS trigger_integrations_updated ON mod_ecommod01_integrations;
CREATE TRIGGER trigger_integrations_updated
    BEFORE UPDATE ON mod_ecommod01_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_ecommod01_integration_timestamps();

DROP TRIGGER IF EXISTS trigger_sync_jobs_updated ON mod_ecommod01_sync_jobs;
CREATE TRIGGER trigger_sync_jobs_updated
    BEFORE UPDATE ON mod_ecommod01_sync_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_ecommod01_integration_timestamps();

-- Track consecutive webhook failures
CREATE OR REPLACE FUNCTION track_ecommod01_webhook_failures()
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

DROP TRIGGER IF EXISTS trigger_track_webhook_delivery ON mod_ecommod01_webhook_deliveries;
CREATE TRIGGER trigger_track_webhook_delivery
    AFTER INSERT OR UPDATE ON mod_ecommod01_webhook_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION track_ecommod01_webhook_failures();

-- Auto-disable webhooks after too many failures
CREATE OR REPLACE FUNCTION auto_disable_failing_ecommod01_webhook()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.consecutive_failures >= 10 THEN
        NEW.active = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_disable_webhook ON mod_ecommod01_webhook_endpoints;
CREATE TRIGGER trigger_auto_disable_webhook
    BEFORE UPDATE ON mod_ecommod01_webhook_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION auto_disable_failing_ecommod01_webhook();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mod_ecommod01_api_keys IS 'API keys for programmatic access to e-commerce module';
COMMENT ON TABLE mod_ecommod01_webhook_endpoints IS 'Webhook endpoints for event notifications';
COMMENT ON TABLE mod_ecommod01_webhook_event_types IS 'Registry of available webhook event types';
COMMENT ON TABLE mod_ecommod01_webhook_deliveries IS 'Log of webhook delivery attempts';
COMMENT ON TABLE mod_ecommod01_integrations IS 'External service integrations (payment, shipping, etc.)';
COMMENT ON TABLE mod_ecommod01_integration_logs IS 'Log of integration API calls';
COMMENT ON TABLE mod_ecommod01_sync_jobs IS 'Scheduled sync jobs for integrations';
