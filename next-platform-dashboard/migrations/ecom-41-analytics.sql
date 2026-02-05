-- ============================================================================
-- Phase ECOM-41A: Analytics & Reports - Database Migration
-- ============================================================================
-- Tables for analytics snapshots, saved reports, and report history
-- 
-- Run with: pnpm supabase db push (or via Supabase dashboard)
-- ============================================================================

-- ============================================================================
-- ANALYTICS SNAPSHOTS TABLE
-- ============================================================================
-- Stores periodic snapshots of analytics data for performance and historical tracking

CREATE TABLE IF NOT EXISTS mod_ecommod01_analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Snapshot info
    snapshot_date DATE NOT NULL,
    snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly')),
    
    -- Sales metrics
    total_revenue_cents BIGINT DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    average_order_value_cents INTEGER DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    items_sold INTEGER DEFAULT 0,
    
    -- Product metrics
    top_products JSONB DEFAULT '[]'::jsonb,
    top_categories JSONB DEFAULT '[]'::jsonb,
    
    -- Conversion metrics
    cart_abandonment_rate DECIMAL(5,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Channel breakdown
    sales_by_channel JSONB DEFAULT '{}'::jsonb,
    
    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate snapshots
    UNIQUE(site_id, snapshot_date, snapshot_type)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_site_date 
    ON mod_ecommod01_analytics_snapshots(site_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_type 
    ON mod_ecommod01_analytics_snapshots(snapshot_type);

-- ============================================================================
-- SAVED REPORTS TABLE
-- ============================================================================
-- Stores user-created custom reports with their configurations

CREATE TABLE IF NOT EXISTS mod_ecommod01_saved_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Report info
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL CHECK (report_type IN (
        'sales_overview',
        'product_performance', 
        'customer_insights',
        'conversion_funnel',
        'revenue_breakdown',
        'category_analysis',
        'custom'
    )),
    
    -- Report configuration
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Config includes:
    -- - date_range: { start, end, preset }
    -- - metrics: string[]
    -- - filters: Record<string, any>
    -- - group_by: string
    -- - chart_type: string
    -- - columns: string[]
    
    -- User preferences
    is_favorite BOOLEAN DEFAULT FALSE,
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_config JSONB DEFAULT NULL,
    -- schedule_config includes:
    -- - frequency: 'daily' | 'weekly' | 'monthly'
    -- - day_of_week: number (for weekly)
    -- - day_of_month: number (for monthly)
    -- - recipients: string[] (emails)
    
    -- Audit
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_run_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_reports_site 
    ON mod_ecommod01_saved_reports(site_id);

CREATE INDEX IF NOT EXISTS idx_saved_reports_type 
    ON mod_ecommod01_saved_reports(report_type);

CREATE INDEX IF NOT EXISTS idx_saved_reports_favorite 
    ON mod_ecommod01_saved_reports(site_id, is_favorite) 
    WHERE is_favorite = TRUE;

CREATE INDEX IF NOT EXISTS idx_saved_reports_scheduled 
    ON mod_ecommod01_saved_reports(is_scheduled) 
    WHERE is_scheduled = TRUE;

-- ============================================================================
-- REPORT HISTORY TABLE
-- ============================================================================
-- Stores execution history of reports for audit and caching

CREATE TABLE IF NOT EXISTS mod_ecommod01_report_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    report_id UUID REFERENCES mod_ecommod01_saved_reports(id) ON DELETE CASCADE,
    
    -- Execution info
    report_type TEXT NOT NULL,
    config JSONB NOT NULL,
    
    -- Results (cached)
    result_data JSONB,
    result_summary TEXT,
    
    -- Execution metadata
    execution_time_ms INTEGER,
    row_count INTEGER,
    
    -- Export info
    exported_format TEXT CHECK (exported_format IN ('pdf', 'csv', 'excel', NULL)),
    exported_at TIMESTAMPTZ,
    
    -- Audit
    executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history lookups
CREATE INDEX IF NOT EXISTS idx_report_history_site 
    ON mod_ecommod01_report_history(site_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_history_report 
    ON mod_ecommod01_report_history(report_id, executed_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE mod_ecommod01_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_report_history ENABLE ROW LEVEL SECURITY;

-- Analytics Snapshots policies
CREATE POLICY "Users can view analytics snapshots for their sites"
    ON mod_ecommod01_analytics_snapshots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sites s
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE s.id = site_id AND am.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage analytics snapshots"
    ON mod_ecommod01_analytics_snapshots FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Saved Reports policies
CREATE POLICY "Users can view saved reports for their sites"
    ON mod_ecommod01_saved_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sites s
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE s.id = site_id AND am.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create saved reports for their sites"
    ON mod_ecommod01_saved_reports FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sites s
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE s.id = site_id AND am.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own saved reports"
    ON mod_ecommod01_saved_reports FOR UPDATE
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM sites s
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can delete their own saved reports"
    ON mod_ecommod01_saved_reports FOR DELETE
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM sites s
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
        )
    );

-- Report History policies
CREATE POLICY "Users can view report history for their sites"
    ON mod_ecommod01_report_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sites s
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE s.id = site_id AND am.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create report history for their sites"
    ON mod_ecommod01_report_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sites s
            JOIN agency_members am ON am.agency_id = s.agency_id
            WHERE s.id = site_id AND am.user_id = auth.uid()
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate daily analytics snapshot
CREATE OR REPLACE FUNCTION generate_daily_analytics_snapshot(p_site_id UUID, p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot_id UUID;
    v_start_ts TIMESTAMPTZ;
    v_end_ts TIMESTAMPTZ;
    v_revenue BIGINT;
    v_orders INTEGER;
    v_customers INTEGER;
    v_new_customers INTEGER;
    v_items INTEGER;
    v_top_products JSONB;
BEGIN
    -- Set date range
    v_start_ts := p_date::TIMESTAMPTZ;
    v_end_ts := (p_date + 1)::TIMESTAMPTZ;
    
    -- Calculate metrics
    SELECT 
        COALESCE(SUM(total_cents), 0),
        COUNT(*),
        COUNT(DISTINCT customer_id)
    INTO v_revenue, v_orders, v_customers
    FROM mod_ecommod01_orders
    WHERE site_id = p_site_id
        AND created_at >= v_start_ts
        AND created_at < v_end_ts
        AND status IN ('completed', 'shipped', 'delivered');
    
    -- Get items sold
    SELECT COALESCE(SUM(oi.quantity), 0)
    INTO v_items
    FROM mod_ecommod01_order_items oi
    JOIN mod_ecommod01_orders o ON o.id = oi.order_id
    WHERE o.site_id = p_site_id
        AND o.created_at >= v_start_ts
        AND o.created_at < v_end_ts
        AND o.status IN ('completed', 'shipped', 'delivered');
    
    -- Get top products
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'product_id', product_id,
            'product_name', product_name,
            'units_sold', units,
            'revenue', revenue
        )
    ), '[]'::jsonb)
    INTO v_top_products
    FROM (
        SELECT 
            oi.product_id,
            oi.product_name,
            SUM(oi.quantity) as units,
            SUM(oi.total_cents) as revenue
        FROM mod_ecommod01_order_items oi
        JOIN mod_ecommod01_orders o ON o.id = oi.order_id
        WHERE o.site_id = p_site_id
            AND o.created_at >= v_start_ts
            AND o.created_at < v_end_ts
            AND o.status IN ('completed', 'shipped', 'delivered')
        GROUP BY oi.product_id, oi.product_name
        ORDER BY revenue DESC
        LIMIT 10
    ) top;
    
    -- Insert or update snapshot
    INSERT INTO mod_ecommod01_analytics_snapshots (
        site_id,
        snapshot_date,
        snapshot_type,
        total_revenue_cents,
        total_orders,
        average_order_value_cents,
        total_customers,
        items_sold,
        top_products
    ) VALUES (
        p_site_id,
        p_date,
        'daily',
        v_revenue,
        v_orders,
        CASE WHEN v_orders > 0 THEN v_revenue / v_orders ELSE 0 END,
        v_customers,
        v_items,
        v_top_products
    )
    ON CONFLICT (site_id, snapshot_date, snapshot_type)
    DO UPDATE SET
        total_revenue_cents = EXCLUDED.total_revenue_cents,
        total_orders = EXCLUDED.total_orders,
        average_order_value_cents = EXCLUDED.average_order_value_cents,
        total_customers = EXCLUDED.total_customers,
        items_sold = EXCLUDED.items_sold,
        top_products = EXCLUDED.top_products
    RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for saved reports
CREATE OR REPLACE FUNCTION update_saved_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saved_report_timestamp ON mod_ecommod01_saved_reports;
CREATE TRIGGER trigger_update_saved_report_timestamp
    BEFORE UPDATE ON mod_ecommod01_saved_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_report_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mod_ecommod01_analytics_snapshots IS 'Periodic snapshots of analytics data for performance and historical analysis';
COMMENT ON TABLE mod_ecommod01_saved_reports IS 'User-created custom reports with configurations';
COMMENT ON TABLE mod_ecommod01_report_history IS 'Execution history of reports for audit and caching';
COMMENT ON FUNCTION generate_daily_analytics_snapshot IS 'Generates a daily analytics snapshot for a site';
