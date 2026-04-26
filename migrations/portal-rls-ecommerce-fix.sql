-- =============================================================================
-- Portal RLS Fix: E-Commerce Module
-- =============================================================================
-- The ecommerce module tables use a direct agency_members check instead of
-- can_access_site(). Since can_access_site() already delegates to
-- is_portal_user_for_site(), adding portal-user policies here grants clients
-- full access to their own site's data.
--
-- Safety notes:
--   - All policies are ADDITIVE. No existing policies are altered.
--   - Portal users can only access data for sites where:
--       clients.portal_user_id = auth.uid()
--       AND clients.has_portal_access = true
--       AND sites.client_id = clients.id
-- =============================================================================

-- ─── Helper: portal user for site via product ─────────────────────────────
-- Used by product-linked tables that lack a direct site_id column
CREATE OR REPLACE FUNCTION public.is_portal_user_for_product(check_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.mod_ecommod01_products p
      JOIN public.sites s ON s.id = p.site_id
      JOIN public.clients c ON c.id = s.client_id
     WHERE p.id = check_product_id
       AND c.portal_user_id = auth.uid()
       AND c.has_portal_access = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_portal_user_for_product(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_portal_user_for_product(uuid) TO authenticated;

-- ─── Helper: portal user for order ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_portal_user_for_order(check_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.mod_ecommod01_orders o
      JOIN public.sites s ON s.id = o.site_id
      JOIN public.clients c ON c.id = s.client_id
     WHERE o.id = check_order_id
       AND c.portal_user_id = auth.uid()
       AND c.has_portal_access = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_portal_user_for_order(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_portal_user_for_order(uuid) TO authenticated;

-- ─── Helper: portal user for customer ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_portal_user_for_ecom_customer(check_customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.mod_ecommod01_customers cu
      JOIN public.sites s ON s.id = cu.site_id
      JOIN public.clients c ON c.id = s.client_id
     WHERE cu.id = check_customer_id
       AND c.portal_user_id = auth.uid()
       AND c.has_portal_access = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_portal_user_for_ecom_customer(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_portal_user_for_ecom_customer(uuid) TO authenticated;

-- =============================================================================
-- Site-scoped tables (have direct site_id column)
-- =============================================================================

-- mod_ecommod01_products
DROP POLICY IF EXISTS portal_user_all_products ON public.mod_ecommod01_products;
CREATE POLICY portal_user_all_products ON public.mod_ecommod01_products
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_categories
DROP POLICY IF EXISTS portal_user_all_categories ON public.mod_ecommod01_categories;
CREATE POLICY portal_user_all_categories ON public.mod_ecommod01_categories
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_customers
DROP POLICY IF EXISTS portal_user_all_customers ON public.mod_ecommod01_customers;
CREATE POLICY portal_user_all_customers ON public.mod_ecommod01_customers
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_discounts
DROP POLICY IF EXISTS portal_user_all_discounts ON public.mod_ecommod01_discounts;
CREATE POLICY portal_user_all_discounts ON public.mod_ecommod01_discounts
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_settings
DROP POLICY IF EXISTS portal_user_all_settings ON public.mod_ecommod01_settings;
CREATE POLICY portal_user_all_settings ON public.mod_ecommod01_settings
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_quotes
DROP POLICY IF EXISTS portal_user_all_quotes ON public.mod_ecommod01_quotes;
CREATE POLICY portal_user_all_quotes ON public.mod_ecommod01_quotes
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_quote_settings
DROP POLICY IF EXISTS portal_user_all_quote_settings ON public.mod_ecommod01_quote_settings;
CREATE POLICY portal_user_all_quote_settings ON public.mod_ecommod01_quote_settings
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_quote_templates
DROP POLICY IF EXISTS portal_user_all_quote_templates ON public.mod_ecommod01_quote_templates;
CREATE POLICY portal_user_all_quote_templates ON public.mod_ecommod01_quote_templates
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_bundles
DROP POLICY IF EXISTS portal_user_all_bundles ON public.mod_ecommod01_bundles;
CREATE POLICY portal_user_all_bundles ON public.mod_ecommod01_bundles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_flash_sales
DROP POLICY IF EXISTS portal_user_all_flash_sales ON public.mod_ecommod01_flash_sales;
CREATE POLICY portal_user_all_flash_sales ON public.mod_ecommod01_flash_sales
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_gift_cards
DROP POLICY IF EXISTS portal_user_all_gift_cards ON public.mod_ecommod01_gift_cards;
CREATE POLICY portal_user_all_gift_cards ON public.mod_ecommod01_gift_cards
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_loyalty_config
DROP POLICY IF EXISTS portal_user_all_loyalty_config ON public.mod_ecommod01_loyalty_config;
CREATE POLICY portal_user_all_loyalty_config ON public.mod_ecommod01_loyalty_config
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_loyalty_points
DROP POLICY IF EXISTS portal_user_all_loyalty_points ON public.mod_ecommod01_loyalty_points;
CREATE POLICY portal_user_all_loyalty_points ON public.mod_ecommod01_loyalty_points
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_loyalty_transactions
DROP POLICY IF EXISTS portal_user_all_loyalty_transactions ON public.mod_ecommod01_loyalty_transactions;
CREATE POLICY portal_user_all_loyalty_transactions ON public.mod_ecommod01_loyalty_transactions
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_inventory_locations
DROP POLICY IF EXISTS portal_user_all_inventory_locations ON public.mod_ecommod01_inventory_locations;
CREATE POLICY portal_user_all_inventory_locations ON public.mod_ecommod01_inventory_locations
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_inventory_movements (has site_id)
DROP POLICY IF EXISTS portal_user_select_inventory_movements ON public.mod_ecommod01_inventory_movements;
CREATE POLICY portal_user_select_inventory_movements ON public.mod_ecommod01_inventory_movements
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_location_stock
DROP POLICY IF EXISTS portal_user_all_location_stock ON public.mod_ecommod01_location_stock;
CREATE POLICY portal_user_all_location_stock ON public.mod_ecommod01_location_stock
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_stock_alerts
DROP POLICY IF EXISTS portal_user_all_stock_alerts ON public.mod_ecommod01_stock_alerts;
CREATE POLICY portal_user_all_stock_alerts ON public.mod_ecommod01_stock_alerts
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_integrations
DROP POLICY IF EXISTS portal_user_all_integrations ON public.mod_ecommod01_integrations;
CREATE POLICY portal_user_all_integrations ON public.mod_ecommod01_integrations
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_analytics_snapshots
DROP POLICY IF EXISTS portal_user_select_analytics_snapshots ON public.mod_ecommod01_analytics_snapshots;
CREATE POLICY portal_user_select_analytics_snapshots ON public.mod_ecommod01_analytics_snapshots
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_report_history
DROP POLICY IF EXISTS portal_user_all_report_history ON public.mod_ecommod01_report_history;
CREATE POLICY portal_user_all_report_history ON public.mod_ecommod01_report_history
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_saved_reports
DROP POLICY IF EXISTS portal_user_all_saved_reports ON public.mod_ecommod01_saved_reports;
CREATE POLICY portal_user_all_saved_reports ON public.mod_ecommod01_saved_reports
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_customer_groups
DROP POLICY IF EXISTS portal_user_all_customer_groups ON public.mod_ecommod01_customer_groups;
CREATE POLICY portal_user_all_customer_groups ON public.mod_ecommod01_customer_groups
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_webhook_endpoints
DROP POLICY IF EXISTS portal_user_all_webhook_endpoints ON public.mod_ecommod01_webhook_endpoints;
CREATE POLICY portal_user_all_webhook_endpoints ON public.mod_ecommod01_webhook_endpoints
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- mod_ecommod01_api_keys
DROP POLICY IF EXISTS portal_user_all_api_keys ON public.mod_ecommod01_api_keys;
CREATE POLICY portal_user_all_api_keys ON public.mod_ecommod01_api_keys
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_site(site_id))
  WITH CHECK (public.is_portal_user_for_site(site_id));

-- =============================================================================
-- Product-linked tables (join to products to get site_id)
-- =============================================================================

-- mod_ecommod01_product_variants
DROP POLICY IF EXISTS portal_user_all_product_variants ON public.mod_ecommod01_product_variants;
CREATE POLICY portal_user_all_product_variants ON public.mod_ecommod01_product_variants
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_product(product_id))
  WITH CHECK (public.is_portal_user_for_product(product_id));

-- mod_ecommod01_product_options
DROP POLICY IF EXISTS portal_user_all_product_options ON public.mod_ecommod01_product_options;
CREATE POLICY portal_user_all_product_options ON public.mod_ecommod01_product_options
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_product(product_id))
  WITH CHECK (public.is_portal_user_for_product(product_id));

-- mod_ecommod01_product_categories (junction)
DROP POLICY IF EXISTS portal_user_all_product_categories ON public.mod_ecommod01_product_categories;
CREATE POLICY portal_user_all_product_categories ON public.mod_ecommod01_product_categories
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_product(product_id))
  WITH CHECK (public.is_portal_user_for_product(product_id));

-- mod_ecommod01_bundle_items
DROP POLICY IF EXISTS portal_user_all_bundle_items ON public.mod_ecommod01_bundle_items;
CREATE POLICY portal_user_all_bundle_items ON public.mod_ecommod01_bundle_items
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_product(product_id))
  WITH CHECK (public.is_portal_user_for_product(product_id));

-- mod_ecommod01_flash_sale_products
DROP POLICY IF EXISTS portal_user_all_flash_sale_products ON public.mod_ecommod01_flash_sale_products;
CREATE POLICY portal_user_all_flash_sale_products ON public.mod_ecommod01_flash_sale_products
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_product(product_id))
  WITH CHECK (public.is_portal_user_for_product(product_id));

-- mod_ecommod01_quote_items (via product_id)
DROP POLICY IF EXISTS portal_user_all_quote_items ON public.mod_ecommod01_quote_items;
CREATE POLICY portal_user_all_quote_items ON public.mod_ecommod01_quote_items
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_product(product_id))
  WITH CHECK (public.is_portal_user_for_product(product_id));

-- =============================================================================
-- Order-linked tables (join to orders to get site_id)
-- =============================================================================

-- mod_ecommod01_order_items
DROP POLICY IF EXISTS portal_user_all_order_items ON public.mod_ecommod01_order_items;
CREATE POLICY portal_user_all_order_items ON public.mod_ecommod01_order_items
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_order(order_id))
  WITH CHECK (public.is_portal_user_for_order(order_id));

-- mod_ecommod01_order_notes
DROP POLICY IF EXISTS portal_user_all_order_notes ON public.mod_ecommod01_order_notes;
CREATE POLICY portal_user_all_order_notes ON public.mod_ecommod01_order_notes
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_order(order_id))
  WITH CHECK (public.is_portal_user_for_order(order_id));

-- mod_ecommod01_order_refunds
DROP POLICY IF EXISTS portal_user_all_order_refunds ON public.mod_ecommod01_order_refunds;
CREATE POLICY portal_user_all_order_refunds ON public.mod_ecommod01_order_refunds
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_order(order_id))
  WITH CHECK (public.is_portal_user_for_order(order_id));

-- mod_ecommod01_order_shipments
DROP POLICY IF EXISTS portal_user_all_order_shipments ON public.mod_ecommod01_order_shipments;
CREATE POLICY portal_user_all_order_shipments ON public.mod_ecommod01_order_shipments
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_order(order_id))
  WITH CHECK (public.is_portal_user_for_order(order_id));

-- mod_ecommod01_order_timeline
DROP POLICY IF EXISTS portal_user_all_order_timeline ON public.mod_ecommod01_order_timeline;
CREATE POLICY portal_user_all_order_timeline ON public.mod_ecommod01_order_timeline
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_order(order_id))
  WITH CHECK (public.is_portal_user_for_order(order_id));

-- =============================================================================
-- Customer-linked tables
-- =============================================================================

-- mod_ecommod01_customer_addresses
DROP POLICY IF EXISTS portal_user_all_customer_addresses ON public.mod_ecommod01_customer_addresses;
CREATE POLICY portal_user_all_customer_addresses ON public.mod_ecommod01_customer_addresses
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_ecom_customer(customer_id))
  WITH CHECK (public.is_portal_user_for_ecom_customer(customer_id));

-- mod_ecommod01_customer_group_members
DROP POLICY IF EXISTS portal_user_all_customer_group_members ON public.mod_ecommod01_customer_group_members;
CREATE POLICY portal_user_all_customer_group_members ON public.mod_ecommod01_customer_group_members
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_ecom_customer(customer_id))
  WITH CHECK (public.is_portal_user_for_ecom_customer(customer_id));

-- mod_ecommod01_customer_notes
DROP POLICY IF EXISTS portal_user_all_customer_notes ON public.mod_ecommod01_customer_notes;
CREATE POLICY portal_user_all_customer_notes ON public.mod_ecommod01_customer_notes
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_portal_user_for_ecom_customer(customer_id))
  WITH CHECK (public.is_portal_user_for_ecom_customer(customer_id));

-- =============================================================================
-- End of portal-rls-ecommerce-fix.sql
-- =============================================================================
