-- migrations/20260122_module_authentication.sql
-- Phase EM-13: Module Authentication & Authorization
-- Creates tables for module-level RBAC, sessions, and invitations

-- ============================================================================
-- MODULE ROLES (Custom roles per module)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  module_id UUID NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Role definition
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- Permissions (array of permission strings)
  permissions TEXT[] DEFAULT '{}',
  
  -- Hierarchy (higher = more access)
  hierarchy_level INTEGER DEFAULT 0,
  
  -- System flags
  is_default BOOLEAN DEFAULT false,  -- Auto-assign to new users
  is_system BOOLEAN DEFAULT false,   -- Cannot be deleted
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, site_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_module_roles_lookup ON module_roles(module_id, site_id);

-- ============================================================================
-- MODULE USER ROLES (User ↔ Role assignments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Assignment
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES module_roles(id) ON DELETE CASCADE,
  
  -- Context
  module_id UUID NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Validity
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_module_user_roles_user ON module_user_roles(user_id, module_id, site_id);
CREATE INDEX IF NOT EXISTS idx_module_user_roles_site ON module_user_roles(site_id, module_id);

-- ============================================================================
-- MODULE PERMISSIONS (Granular permissions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Definition
  module_id UUID NOT NULL,
  
  -- Permission details
  name TEXT NOT NULL,           -- e.g., "Manage Contacts"
  key TEXT NOT NULL,            -- e.g., "contacts.manage"
  description TEXT,
  
  -- Grouping
  category TEXT,                -- e.g., "Contacts", "Deals"
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(module_id, key)
);

CREATE INDEX IF NOT EXISTS idx_module_permissions_module ON module_permissions(module_id);

-- ============================================================================
-- MODULE SESSIONS (For embedded contexts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  module_id UUID NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Session data
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  
  -- Source
  source TEXT DEFAULT 'platform',  -- 'platform', 'embed', 'api'
  referrer_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_module_sessions_token ON module_sessions(session_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_module_sessions_user ON module_sessions(user_id, module_id);

-- ============================================================================
-- MODULE INVITATIONS (Invite users to modules)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  module_id UUID NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Invitation
  email TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES module_roles(id) ON DELETE CASCADE,
  
  -- Token
  token TEXT NOT NULL UNIQUE,
  
  -- Sender
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  message TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_module_invitations_email ON module_invitations(email, status);
CREATE INDEX IF NOT EXISTS idx_module_invitations_token ON module_invitations(token) WHERE status = 'pending';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE module_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_invitations ENABLE ROW LEVEL SECURITY;

-- Module Roles policies
CREATE POLICY "Users can view roles for their sites" ON module_roles
  FOR SELECT USING (
    site_id IN (
      SELECT s.id FROM sites s
      INNER JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage module roles" ON module_roles
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      INNER JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid() 
      AND am.role IN ('owner', 'admin')
    )
  );

-- Module User Roles policies
CREATE POLICY "Users can view their own module roles" ON module_user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage module user roles" ON module_user_roles
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      INNER JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid() 
      AND am.role IN ('owner', 'admin')
    )
  );

-- Module Permissions policies
CREATE POLICY "Anyone can view module permissions" ON module_permissions
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage permissions" ON module_permissions
  FOR ALL USING (auth.role() = 'service_role');

-- Module Sessions policies
CREATE POLICY "Users can view their own sessions" ON module_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions" ON module_sessions
  FOR ALL USING (user_id = auth.uid());

-- Module Invitations policies
CREATE POLICY "Users can view invitations for their sites" ON module_invitations
  FOR SELECT USING (
    site_id IN (
      SELECT s.id FROM sites s
      INNER JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can create invitations" ON module_invitations
  FOR INSERT WITH CHECK (
    site_id IN (
      SELECT s.id FROM sites s
      INNER JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid() 
      AND am.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update invitations" ON module_invitations
  FOR UPDATE USING (
    site_id IN (
      SELECT s.id FROM sites s
      INNER JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid() 
      AND am.role IN ('owner', 'admin')
    )
    OR (
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'pending'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has a specific permission in a module
CREATE OR REPLACE FUNCTION check_module_permission(
  p_user_id UUID,
  p_module_id UUID,
  p_site_id UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := false;
  v_permissions TEXT[];
BEGIN
  -- Get all permissions for the user in this module
  SELECT array_agg(DISTINCT unnest(mr.permissions))
  INTO v_permissions
  FROM module_user_roles mur
  JOIN module_roles mr ON mr.id = mur.role_id
  WHERE mur.user_id = p_user_id
    AND mur.module_id = p_module_id
    AND mur.site_id = p_site_id
    AND mur.is_active = true
    AND (mur.expires_at IS NULL OR mur.expires_at > NOW());
  
  -- Check for wildcard permission
  IF '*' = ANY(v_permissions) THEN
    RETURN true;
  END IF;
  
  -- Check for exact permission match
  IF p_permission = ANY(v_permissions) THEN
    RETURN true;
  END IF;
  
  -- Check for category wildcard (e.g., 'contacts.*' matches 'contacts.view')
  DECLARE
    v_perm TEXT;
  BEGIN
    FOREACH v_perm IN ARRAY v_permissions LOOP
      IF v_perm LIKE '%.*' THEN
        IF p_permission LIKE (replace(v_perm, '.*', '') || '.%') THEN
          RETURN true;
        END IF;
      END IF;
    END LOOP;
  END;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's highest role hierarchy level in a module
CREATE OR REPLACE FUNCTION get_module_role_level(
  p_user_id UUID,
  p_module_id UUID,
  p_site_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_level INTEGER := 0;
BEGIN
  SELECT MAX(mr.hierarchy_level)
  INTO v_level
  FROM module_user_roles mur
  JOIN module_roles mr ON mr.id = mur.role_id
  WHERE mur.user_id = p_user_id
    AND mur.module_id = p_module_id
    AND mur.site_id = p_site_id
    AND mur.is_active = true
    AND (mur.expires_at IS NULL OR mur.expires_at > NOW());
  
  RETURN COALESCE(v_level, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_module_sessions() RETURNS void AS $$
BEGIN
  UPDATE module_sessions
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
  
  DELETE FROM module_sessions
  WHERE is_active = false AND expires_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session activity
CREATE OR REPLACE FUNCTION touch_module_session(p_session_token TEXT) RETURNS void AS $$
BEGIN
  UPDATE module_sessions
  SET last_activity_at = NOW()
  WHERE session_token = p_session_token AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for module_roles
CREATE OR REPLACE FUNCTION update_module_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_module_roles_updated_at ON module_roles;
CREATE TRIGGER trigger_module_roles_updated_at
  BEFORE UPDATE ON module_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_module_roles_updated_at();

-- Auto-assign default role when user is added to a module
CREATE OR REPLACE FUNCTION auto_assign_default_module_role()
RETURNS TRIGGER AS $$
DECLARE
  v_default_role_id UUID;
BEGIN
  -- Check if user already has a role for this module
  IF EXISTS (
    SELECT 1 FROM module_user_roles
    WHERE user_id = NEW.user_id
      AND module_id = NEW.module_id
      AND site_id = NEW.site_id
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Get the default role for this module
  SELECT id INTO v_default_role_id
  FROM module_roles
  WHERE module_id = NEW.module_id
    AND site_id = NEW.site_id
    AND is_default = true
  LIMIT 1;
  
  -- If a default role exists and user doesn't have it, assign it
  IF v_default_role_id IS NOT NULL THEN
    INSERT INTO module_user_roles (user_id, role_id, module_id, site_id, is_active)
    VALUES (NEW.user_id, v_default_role_id, NEW.module_id, NEW.site_id, true)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
