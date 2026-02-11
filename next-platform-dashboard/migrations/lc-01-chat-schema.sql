-- ============================================================================
-- PHASE LC-01: Live Chat Module — Complete Database Schema
-- Run in Supabase SQL Editor
-- ============================================================================

-- 1. DEPARTMENTS (routing groups for conversations)
CREATE TABLE IF NOT EXISTS mod_chat_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  auto_assign BOOLEAN DEFAULT TRUE,
  max_concurrent_chats INTEGER DEFAULT 5,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AGENTS (support staff linked to auth users)
CREATE TABLE IF NOT EXISTS mod_chat_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'supervisor', 'admin')),
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  department_id UUID REFERENCES mod_chat_departments(id) ON DELETE SET NULL,
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  total_chats_handled INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, user_id)
);

-- 3. WIDGET SETTINGS (per-site widget customization)
CREATE TABLE IF NOT EXISTS mod_chat_widget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  -- Appearance
  primary_color TEXT DEFAULT '#2563eb',
  text_color TEXT DEFAULT '#ffffff',
  position TEXT DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left')),
  launcher_icon TEXT DEFAULT 'message-circle',
  launcher_size INTEGER DEFAULT 60,
  border_radius INTEGER DEFAULT 16,
  z_index INTEGER DEFAULT 9999,
  -- Branding
  company_name TEXT,
  welcome_message TEXT DEFAULT 'Hi there! How can we help you today?',
  away_message TEXT DEFAULT 'We''re currently away. Leave us a message and we''ll get back to you.',
  offline_message TEXT DEFAULT 'We''re offline right now. Please leave your details and we''ll reach out.',
  logo_url TEXT,
  -- Pre-chat form
  pre_chat_enabled BOOLEAN DEFAULT TRUE,
  pre_chat_name_required BOOLEAN DEFAULT TRUE,
  pre_chat_email_required BOOLEAN DEFAULT TRUE,
  pre_chat_phone_enabled BOOLEAN DEFAULT FALSE,
  pre_chat_phone_required BOOLEAN DEFAULT FALSE,
  pre_chat_message_required BOOLEAN DEFAULT FALSE,
  pre_chat_department_selector BOOLEAN DEFAULT FALSE,
  -- Business hours
  business_hours_enabled BOOLEAN DEFAULT FALSE,
  business_hours JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'Africa/Lusaka',
  -- Behavior
  auto_open_delay_seconds INTEGER DEFAULT 0,
  show_agent_avatar BOOLEAN DEFAULT TRUE,
  show_agent_name BOOLEAN DEFAULT TRUE,
  show_typing_indicator BOOLEAN DEFAULT TRUE,
  enable_file_uploads BOOLEAN DEFAULT TRUE,
  enable_emoji BOOLEAN DEFAULT TRUE,
  enable_sound_notifications BOOLEAN DEFAULT TRUE,
  enable_satisfaction_rating BOOLEAN DEFAULT TRUE,
  -- Language
  language TEXT DEFAULT 'en',
  custom_translations JSONB DEFAULT '{}',
  -- WhatsApp
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_phone_number TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_business_account_id TEXT,
  whatsapp_welcome_template TEXT,
  -- Advanced
  allowed_domains TEXT[] DEFAULT '{}',
  blocked_ips TEXT[] DEFAULT '{}',
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_file_types TEXT[] DEFAULT ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  --
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id)
);

-- 4. VISITORS (people who initiate conversations)
CREATE TABLE IF NOT EXISTS mod_chat_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  -- Identity
  external_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  -- Tracking
  browser TEXT,
  os TEXT,
  device TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  -- Page tracking
  current_page_url TEXT,
  current_page_title TEXT,
  referrer_url TEXT,
  landing_page_url TEXT,
  -- Engagement
  total_visits INTEGER DEFAULT 1,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  -- CRM link
  crm_contact_id UUID,
  -- Tags/notes
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  custom_data JSONB DEFAULT '{}',
  -- Channel
  channel TEXT DEFAULT 'widget' CHECK (channel IN ('widget', 'whatsapp', 'api')),
  whatsapp_phone TEXT,
  --
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CONVERSATIONS (chat threads)
CREATE TABLE IF NOT EXISTS mod_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES mod_chat_visitors(id) ON DELETE CASCADE,
  -- Assignment
  assigned_agent_id UUID REFERENCES mod_chat_agents(id) ON DELETE SET NULL,
  department_id UUID REFERENCES mod_chat_departments(id) ON DELETE SET NULL,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'waiting', 'resolved', 'closed', 'missed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  -- Channel
  channel TEXT NOT NULL DEFAULT 'widget' CHECK (channel IN ('widget', 'whatsapp', 'api')),
  -- Content summary
  subject TEXT,
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_by TEXT CHECK (last_message_by IN ('visitor', 'agent', 'system', 'ai')),
  -- Counts
  message_count INTEGER DEFAULT 0,
  unread_agent_count INTEGER DEFAULT 0,
  unread_visitor_count INTEGER DEFAULT 0,
  -- Timing
  first_response_time_seconds INTEGER,
  resolution_time_seconds INTEGER,
  wait_time_seconds INTEGER,
  -- Rating
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  rating_comment TEXT,
  rated_at TIMESTAMPTZ,
  -- Tags & metadata
  tags TEXT[] DEFAULT '{}',
  internal_notes TEXT,
  metadata JSONB DEFAULT '{}',
  -- WhatsApp-specific
  whatsapp_conversation_id TEXT,
  whatsapp_window_expires_at TIMESTAMPTZ,
  --
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- 6. MESSAGES (individual messages within conversations)
CREATE TABLE IF NOT EXISTS mod_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES mod_chat_conversations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  -- Sender
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent', 'system', 'ai')),
  sender_id TEXT,
  sender_name TEXT,
  sender_avatar TEXT,
  -- Content
  content TEXT,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'audio', 'video', 'location', 'system', 'note', 'whatsapp_template')),
  -- File attachment
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_mime_type TEXT,
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
  is_internal_note BOOLEAN DEFAULT FALSE,
  -- WhatsApp-specific
  whatsapp_message_id TEXT,
  whatsapp_status TEXT,
  -- AI-specific
  is_ai_generated BOOLEAN DEFAULT FALSE,
  ai_confidence NUMERIC(3,2),
  --
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CANNED RESPONSES (quick reply templates)
CREATE TABLE IF NOT EXISTS mod_chat_canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID,
  is_shared BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. KNOWLEDGE BASE (articles for AI auto-responder)
CREATE TABLE IF NOT EXISTS mod_chat_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  last_matched_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ANALYTICS (daily aggregated metrics)
CREATE TABLE IF NOT EXISTS mod_chat_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Volume
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  new_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  -- Channel breakdown
  widget_conversations INTEGER DEFAULT 0,
  whatsapp_conversations INTEGER DEFAULT 0,
  -- Status
  resolved_conversations INTEGER DEFAULT 0,
  missed_conversations INTEGER DEFAULT 0,
  -- Performance
  avg_first_response_seconds INTEGER DEFAULT 0,
  avg_resolution_seconds INTEGER DEFAULT 0,
  avg_wait_seconds INTEGER DEFAULT 0,
  avg_messages_per_conversation NUMERIC(5,2) DEFAULT 0,
  -- Satisfaction
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  satisfaction_score NUMERIC(5,2) DEFAULT 0,
  -- AI
  ai_auto_responses INTEGER DEFAULT 0,
  ai_resolved INTEGER DEFAULT 0,
  -- Agent
  agent_id UUID REFERENCES mod_chat_agents(id) ON DELETE SET NULL,
  --
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, date, agent_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_chat_agents_site ON mod_chat_agents(site_id);
CREATE INDEX IF NOT EXISTS idx_chat_agents_status ON mod_chat_agents(site_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_agents_user ON mod_chat_agents(site_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_visitors_site ON mod_chat_visitors(site_id);
CREATE INDEX IF NOT EXISTS idx_chat_visitors_email ON mod_chat_visitors(site_id, email);
CREATE INDEX IF NOT EXISTS idx_chat_visitors_whatsapp ON mod_chat_visitors(site_id, whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_site_status ON mod_chat_conversations(site_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_agent ON mod_chat_conversations(assigned_agent_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_visitor ON mod_chat_conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_channel ON mod_chat_conversations(site_id, channel);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON mod_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_site ON mod_chat_messages(site_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_site_date ON mod_chat_analytics(site_id, date);
CREATE INDEX IF NOT EXISTS idx_chat_departments_site ON mod_chat_departments(site_id);
CREATE INDEX IF NOT EXISTS idx_chat_canned_site ON mod_chat_canned_responses(site_id);
CREATE INDEX IF NOT EXISTS idx_chat_kb_site ON mod_chat_knowledge_base(site_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE TRIGGER update_chat_departments_updated_at BEFORE UPDATE ON mod_chat_departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_agents_updated_at BEFORE UPDATE ON mod_chat_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_widget_settings_updated_at BEFORE UPDATE ON mod_chat_widget_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_visitors_updated_at BEFORE UPDATE ON mod_chat_visitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON mod_chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON mod_chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_canned_responses_updated_at BEFORE UPDATE ON mod_chat_canned_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_kb_updated_at BEFORE UPDATE ON mod_chat_knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_analytics_updated_at BEFORE UPDATE ON mod_chat_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE mod_chat_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_analytics ENABLE ROW LEVEL SECURITY;

-- RLS: Site isolation via agency_members (authenticated dashboard users)
CREATE POLICY "chat_departments_site_isolation" ON mod_chat_departments
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_agents_site_isolation" ON mod_chat_agents
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_widget_settings_site_isolation" ON mod_chat_widget_settings
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_visitors_site_isolation" ON mod_chat_visitors
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_conversations_site_isolation" ON mod_chat_conversations
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_site_isolation" ON mod_chat_messages
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_canned_responses_site_isolation" ON mod_chat_canned_responses
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_knowledge_base_site_isolation" ON mod_chat_knowledge_base
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_analytics_site_isolation" ON mod_chat_analytics
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- PUBLIC ACCESS for widget (anonymous visitors without Supabase auth)
-- Widget settings must be readable to render the widget on published sites
CREATE POLICY "chat_widget_settings_public_read" ON mod_chat_widget_settings
  FOR SELECT USING (true);

-- Visitors can be created by anonymous users (widget visitors)
CREATE POLICY "chat_visitors_public_insert" ON mod_chat_visitors
  FOR INSERT WITH CHECK (true);

-- Conversations can be created by anonymous users
CREATE POLICY "chat_conversations_public_insert" ON mod_chat_conversations
  FOR INSERT WITH CHECK (true);

-- Messages can be inserted by anyone (visitors send messages via widget)
CREATE POLICY "chat_messages_public_insert" ON mod_chat_messages
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- TRIGGERS: Auto-update counters
-- ============================================================================

-- MESSAGE COUNT TRIGGER: Auto-update conversation stats on new message
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mod_chat_conversations
  SET
    message_count = message_count + 1,
    last_message_text = NEW.content,
    last_message_at = NEW.created_at,
    last_message_by = NEW.sender_type,
    unread_agent_count = CASE
      WHEN NEW.sender_type = 'visitor' THEN unread_agent_count + 1
      ELSE unread_agent_count
    END,
    unread_visitor_count = CASE
      WHEN NEW.sender_type IN ('agent', 'ai') THEN unread_visitor_count + 1
      ELSE unread_visitor_count
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER chat_message_count_trigger
  AFTER INSERT ON mod_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_message_count();

-- VISITOR STATS TRIGGER: Auto-update visitor conversation count
CREATE OR REPLACE FUNCTION update_visitor_chat_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'mod_chat_conversations' THEN
    UPDATE mod_chat_visitors
    SET total_conversations = total_conversations + 1
    WHERE id = NEW.visitor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER chat_visitor_stats_trigger
  AFTER INSERT ON mod_chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_visitor_chat_stats();
