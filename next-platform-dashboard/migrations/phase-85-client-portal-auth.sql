-- Phase 85: Client Portal Auth Schema
-- IMPORTANT: We use Supabase Auth for client users
-- The clients.portal_user_id links to auth.users.id

-- Add permissions columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS can_edit_content BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS can_view_invoices BOOLEAN DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_last_login TIMESTAMPTZ;

-- Client permissions table (for more granular control per site)
CREATE TABLE IF NOT EXISTS client_site_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  can_view BOOLEAN DEFAULT TRUE,
  can_edit_content BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT TRUE,
  can_publish BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_client_site_permissions_client ON client_site_permissions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_site_permissions_site ON client_site_permissions(site_id);
CREATE INDEX IF NOT EXISTS idx_client_site_permissions_lookup ON client_site_permissions(client_id, site_id);

-- RLS for client_site_permissions
ALTER TABLE client_site_permissions ENABLE ROW LEVEL SECURITY;

-- Agency users can manage permissions for their clients
CREATE POLICY "Agency members can view client permissions" ON client_site_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN profiles p ON p.agency_id = c.agency_id
      WHERE c.id = client_site_permissions.client_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Agency members can manage client permissions" ON client_site_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN profiles p ON p.agency_id = c.agency_id
      WHERE c.id = client_site_permissions.client_id
      AND p.id = auth.uid()
    )
  );

-- Clients can view their own permissions
CREATE POLICY "Clients can view own permissions" ON client_site_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_site_permissions.client_id
      AND c.portal_user_id = auth.uid()
      AND c.has_portal_access = true
    )
  );
