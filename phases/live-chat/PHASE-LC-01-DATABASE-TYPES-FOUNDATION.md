# PHASE LC-01: Database Schema, Types & Module Foundation

**Phase**: LC-01  
**Module**: Live Chat & Omnichannel Messaging  
**Goal**: Create all database tables, TypeScript types, module manifest, map-db-record utility, and module barrel exports — the complete foundation everything else builds on  
**Independence**: Fully independent — no dependencies  
**Estimated Files**: ~10 files created  
**Prerequisites**: None

---

## CRITICAL RULES

1. Read `/memory-bank/systemPatterns.md` for ALL platform patterns before starting
2. ALL money values use `formatCurrency()` from `@/lib/locale-config`
3. ALL icons use Lucide React — NEVER emoji
4. ALL DB columns are snake_case, ALL TypeScript properties are camelCase
5. Use `(supabase as any).from('mod_chat_...')` since these tables aren't in generated DB types
6. ZERO mock data, ZERO hardcoded numbers, ZERO placeholders
7. Run `npx tsc --noEmit` at the end — must be zero errors

---

## Task 1: Database Migration

**File**: `next-platform-dashboard/migrations/lc-01-chat-schema.sql`

```sql
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

-- INDEXES
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

-- UPDATED_AT TRIGGERS
CREATE OR REPLACE TRIGGER update_chat_departments_updated_at BEFORE UPDATE ON mod_chat_departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_agents_updated_at BEFORE UPDATE ON mod_chat_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_widget_settings_updated_at BEFORE UPDATE ON mod_chat_widget_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_visitors_updated_at BEFORE UPDATE ON mod_chat_visitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON mod_chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON mod_chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_canned_responses_updated_at BEFORE UPDATE ON mod_chat_canned_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_kb_updated_at BEFORE UPDATE ON mod_chat_knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_analytics_updated_at BEFORE UPDATE ON mod_chat_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS POLICIES
ALTER TABLE mod_chat_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_analytics ENABLE ROW LEVEL SECURITY;

-- RLS: Site isolation via agency_members
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

-- PUBLIC ACCESS for widget (anonymous visitors)
-- Widget settings need to be readable by anyone to render the widget
CREATE POLICY "chat_widget_settings_public_read" ON mod_chat_widget_settings
  FOR SELECT USING (true);

-- Visitors can be created by anonymous users (widget users)
CREATE POLICY "chat_visitors_public_insert" ON mod_chat_visitors
  FOR INSERT WITH CHECK (true);

-- Conversations can be created by anonymous users
CREATE POLICY "chat_conversations_public_insert" ON mod_chat_conversations
  FOR INSERT WITH CHECK (true);

-- Messages can be created by anyone (visitors send messages)
CREATE POLICY "chat_messages_public_insert" ON mod_chat_messages
  FOR INSERT WITH CHECK (true);

-- Visitors can read their own conversations (by visitor_id in conversation)
-- This is handled at the API level, not RLS, since anonymous users don't have auth.uid()

-- MESSAGE COUNT TRIGGER: Auto-update conversation message count
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

-- VISITOR STATS TRIGGER: Auto-update visitor conversation/message counts
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
```

---

## Task 2: TypeScript Types

**File**: `next-platform-dashboard/src/modules/live-chat/types/index.ts`

Create a complete types file with ALL interfaces and types used across the module. Every type must use camelCase properties (DB mapping handles the conversion).

```typescript
// =============================================================================
// LIVE CHAT MODULE — TypeScript Types
// =============================================================================

// ─── Enums / Union Types ─────────────────────────────────────────────────────

export type AgentRole = 'agent' | 'supervisor' | 'admin'
export type AgentStatus = 'online' | 'away' | 'busy' | 'offline'

export type ConversationStatus = 'pending' | 'active' | 'waiting' | 'resolved' | 'closed' | 'missed'
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ConversationChannel = 'widget' | 'whatsapp' | 'api'

export type MessageSenderType = 'visitor' | 'agent' | 'system' | 'ai'
export type MessageContentType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'location' | 'system' | 'note' | 'whatsapp_template'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type WidgetPosition = 'bottom-right' | 'bottom-left'

export type VisitorChannel = 'widget' | 'whatsapp' | 'api'

// ─── Department ──────────────────────────────────────────────────────────────

export interface ChatDepartment {
  id: string
  siteId: string
  name: string
  description: string | null
  isDefault: boolean
  isActive: boolean
  autoAssign: boolean
  maxConcurrentChats: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ─── Agent ───────────────────────────────────────────────────────────────────

export interface ChatAgent {
  id: string
  siteId: string
  userId: string
  displayName: string
  avatarUrl: string | null
  email: string | null
  role: AgentRole
  status: AgentStatus
  departmentId: string | null
  maxConcurrentChats: number
  currentChatCount: number
  totalChatsHandled: number
  avgResponseTimeSeconds: number
  avgRating: number
  totalRatings: number
  isActive: boolean
  lastActiveAt: string | null
  createdAt: string
  updatedAt: string
}

// ─── Widget Settings ─────────────────────────────────────────────────────────

export interface ChatWidgetSettings {
  id: string
  siteId: string
  // Appearance
  primaryColor: string
  textColor: string
  position: WidgetPosition
  launcherIcon: string
  launcherSize: number
  borderRadius: number
  zIndex: number
  // Branding
  companyName: string | null
  welcomeMessage: string
  awayMessage: string
  offlineMessage: string
  logoUrl: string | null
  // Pre-chat form
  preChatEnabled: boolean
  preChatNameRequired: boolean
  preChatEmailRequired: boolean
  preChatPhoneEnabled: boolean
  preChatPhoneRequired: boolean
  preChatMessageRequired: boolean
  preChatDepartmentSelector: boolean
  // Business hours
  businessHoursEnabled: boolean
  businessHours: BusinessHoursConfig
  timezone: string
  // Behavior
  autoOpenDelaySeconds: number
  showAgentAvatar: boolean
  showAgentName: boolean
  showTypingIndicator: boolean
  enableFileUploads: boolean
  enableEmoji: boolean
  enableSoundNotifications: boolean
  enableSatisfactionRating: boolean
  // Language
  language: string
  customTranslations: Record<string, string>
  // WhatsApp
  whatsappEnabled: boolean
  whatsappPhoneNumber: string | null
  whatsappPhoneNumberId: string | null
  whatsappBusinessAccountId: string | null
  whatsappWelcomeTemplate: string | null
  // Advanced
  allowedDomains: string[]
  blockedIps: string[]
  maxFileSizeMb: number
  allowedFileTypes: string[]
  //
  createdAt: string
  updatedAt: string
}

export interface BusinessHoursConfig {
  monday?: DayHours
  tuesday?: DayHours
  wednesday?: DayHours
  thursday?: DayHours
  friday?: DayHours
  saturday?: DayHours
  sunday?: DayHours
}

export interface DayHours {
  enabled: boolean
  start: string // "09:00"
  end: string   // "17:00"
}

// ─── Visitor ─────────────────────────────────────────────────────────────────

export interface ChatVisitor {
  id: string
  siteId: string
  externalId: string | null
  name: string | null
  email: string | null
  phone: string | null
  avatarUrl: string | null
  // Tracking
  browser: string | null
  os: string | null
  device: string | null
  ipAddress: string | null
  country: string | null
  city: string | null
  // Page tracking
  currentPageUrl: string | null
  currentPageTitle: string | null
  referrerUrl: string | null
  landingPageUrl: string | null
  // Engagement
  totalVisits: number
  totalConversations: number
  totalMessages: number
  firstSeenAt: string
  lastSeenAt: string
  // CRM
  crmContactId: string | null
  // Tags
  tags: string[]
  notes: string | null
  customData: Record<string, unknown>
  // Channel
  channel: VisitorChannel
  whatsappPhone: string | null
  //
  createdAt: string
  updatedAt: string
}

// ─── Conversation ────────────────────────────────────────────────────────────

export interface ChatConversation {
  id: string
  siteId: string
  visitorId: string
  // Assignment
  assignedAgentId: string | null
  departmentId: string | null
  // Status
  status: ConversationStatus
  priority: ConversationPriority
  // Channel
  channel: ConversationChannel
  // Content summary
  subject: string | null
  lastMessageText: string | null
  lastMessageAt: string | null
  lastMessageBy: MessageSenderType | null
  // Counts
  messageCount: number
  unreadAgentCount: number
  unreadVisitorCount: number
  // Timing
  firstResponseTimeSeconds: number | null
  resolutionTimeSeconds: number | null
  waitTimeSeconds: number | null
  // Rating
  rating: number | null
  ratingComment: string | null
  ratedAt: string | null
  // Tags & metadata
  tags: string[]
  internalNotes: string | null
  metadata: Record<string, unknown>
  // WhatsApp
  whatsappConversationId: string | null
  whatsappWindowExpiresAt: string | null
  //
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  closedAt: string | null
  // Joined data (optional)
  visitor?: ChatVisitor
  assignedAgent?: ChatAgent
  department?: ChatDepartment
}

// ─── Message ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  conversationId: string
  siteId: string
  // Sender
  senderType: MessageSenderType
  senderId: string | null
  senderName: string | null
  senderAvatar: string | null
  // Content
  content: string | null
  contentType: MessageContentType
  // File
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileMimeType: string | null
  // Status
  status: MessageStatus
  isInternalNote: boolean
  // WhatsApp
  whatsappMessageId: string | null
  whatsappStatus: string | null
  // AI
  isAiGenerated: boolean
  aiConfidence: number | null
  //
  createdAt: string
  updatedAt: string
}

// ─── Canned Response ─────────────────────────────────────────────────────────

export interface CannedResponse {
  id: string
  siteId: string
  title: string
  content: string
  shortcut: string | null
  category: string | null
  tags: string[]
  usageCount: number
  lastUsedAt: string | null
  createdBy: string | null
  isShared: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── Knowledge Base ──────────────────────────────────────────────────────────

export interface KnowledgeBaseArticle {
  id: string
  siteId: string
  title: string
  content: string
  category: string | null
  tags: string[]
  isActive: boolean
  usageCount: number
  lastMatchedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface ChatAnalytics {
  id: string
  siteId: string
  date: string
  // Volume
  totalConversations: number
  totalMessages: number
  newVisitors: number
  returningVisitors: number
  // Channel
  widgetConversations: number
  whatsappConversations: number
  // Status
  resolvedConversations: number
  missedConversations: number
  // Performance
  avgFirstResponseSeconds: number
  avgResolutionSeconds: number
  avgWaitSeconds: number
  avgMessagesPerConversation: number
  // Satisfaction
  avgRating: number
  totalRatings: number
  satisfactionScore: number
  // AI
  aiAutoResponses: number
  aiResolved: number
  // Agent
  agentId: string | null
  //
  createdAt: string
  updatedAt: string
}

// ─── UI / Component Types ────────────────────────────────────────────────────

export interface ConversationFilters {
  status?: ConversationStatus | 'all'
  channel?: ConversationChannel | 'all'
  assignedAgentId?: string | 'unassigned' | 'all'
  departmentId?: string | 'all'
  priority?: ConversationPriority | 'all'
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface ChatOverviewStats {
  activeConversations: number
  pendingConversations: number
  onlineAgents: number
  avgResponseTime: number
  todayConversations: number
  todayResolved: number
  todayMissed: number
  satisfactionScore: number
}

export interface AgentPerformanceData {
  agentId: string
  agentName: string
  avatarUrl: string | null
  totalChats: number
  resolvedChats: number
  avgResponseTime: number
  avgRating: number
  totalRatings: number
  currentLoad: number
  maxLoad: number
}

export interface ConversationListItem {
  id: string
  visitorName: string | null
  visitorEmail: string | null
  visitorAvatar: string | null
  channel: ConversationChannel
  status: ConversationStatus
  priority: ConversationPriority
  lastMessageText: string | null
  lastMessageAt: string | null
  lastMessageBy: MessageSenderType | null
  unreadCount: number
  assignedAgentName: string | null
  departmentName: string | null
  tags: string[]
  createdAt: string
}

// ─── Realtime Types ──────────────────────────────────────────────────────────

export interface RealtimeMessage {
  type: 'new_message' | 'typing_start' | 'typing_stop' | 'status_change' | 'agent_joined' | 'agent_left' | 'conversation_assigned' | 'conversation_resolved'
  conversationId: string
  data: Record<string, unknown>
}

export interface PresenceState {
  agentId: string
  status: AgentStatus
  currentChats: number
  lastSeen: string
}

// ─── WhatsApp Types ──────────────────────────────────────────────────────────

export interface WhatsAppWebhookPayload {
  object: string
  entry: WhatsAppEntry[]
}

export interface WhatsAppEntry {
  id: string
  changes: WhatsAppChange[]
}

export interface WhatsAppChange {
  value: {
    messaging_product: string
    metadata: { display_phone_number: string; phone_number_id: string }
    contacts?: Array<{ profile: { name: string }; wa_id: string }>
    messages?: WhatsAppIncomingMessage[]
    statuses?: WhatsAppMessageStatus[]
  }
  field: string
}

export interface WhatsAppIncomingMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'reaction' | 'interactive'
  text?: { body: string }
  image?: { id: string; mime_type: string; sha256: string; caption?: string }
  document?: { id: string; mime_type: string; sha256: string; filename: string; caption?: string }
  audio?: { id: string; mime_type: string; sha256: string }
  video?: { id: string; mime_type: string; sha256: string; caption?: string }
  location?: { latitude: number; longitude: number; name?: string; address?: string }
}

export interface WhatsAppMessageStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  errors?: Array<{ code: number; title: string }>
}

export interface WhatsAppTemplateMessage {
  name: string
  language: { code: string }
  components?: WhatsAppTemplateComponent[]
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button'
  parameters?: Array<{ type: 'text' | 'image'; text?: string; image?: { link: string } }>
}
```

---

## Task 3: DB Record Mapper

**File**: `next-platform-dashboard/src/modules/live-chat/lib/map-db-record.ts`

Follow the exact same pattern as `src/modules/social-media/lib/map-db-record.ts`:

```typescript
/**
 * Maps a snake_case DB record to camelCase TypeScript interface.
 * Supabase returns snake_case columns, but all our TS types use camelCase.
 */

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function mapRecord<T>(record: Record<string, unknown>): T {
  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    mapped[snakeToCamel(key)] = value
  }
  return mapped as T
}

export function mapRecords<T>(records: Record<string, unknown>[]): T[] {
  return records.map((r) => mapRecord<T>(r))
}
```

---

## Task 4: Module Manifest

**File**: `next-platform-dashboard/src/modules/live-chat/manifest.ts`

Create the module manifest following the social-media and booking module patterns:

```typescript
/**
 * Live Chat Module Manifest
 * Defines metadata, navigation, permissions, events, and API routes
 */

export const liveChatModuleMetadata = {
  id: 'live-chat',
  shortId: 'chatmod01',
  name: 'Live Chat',
  description: 'Real-time customer messaging with WhatsApp integration, AI auto-responder, and agent dashboard.',
  version: '1.0.0',
  author: {
    name: 'DRAMAC',
    verified: true,
  },
  category: 'communication',
  tags: ['chat', 'support', 'messaging', 'whatsapp', 'customer-service', 'live-chat'],
  minimumPlatformVersion: '1.0.0',
  capabilities: ['realtime', 'storage', 'ai', 'webhooks', 'notifications', 'embed'],
  dependencies: [],
  optionalDependencies: ['crm', 'booking', 'ecommerce'],
}

export const MODULE_TABLES = [
  'mod_chat_departments',
  'mod_chat_agents',
  'mod_chat_widget_settings',
  'mod_chat_visitors',
  'mod_chat_conversations',
  'mod_chat_messages',
  'mod_chat_canned_responses',
  'mod_chat_knowledge_base',
  'mod_chat_analytics',
]

export const MODULE_NAVIGATION = {
  mainMenu: {
    label: 'Live Chat',
    icon: 'MessageCircle',
    href: '/dashboard/sites/[siteId]/live-chat',
    order: 7,
  },
  subMenu: [
    { label: 'Overview', href: '/dashboard/sites/[siteId]/live-chat', icon: 'LayoutDashboard' },
    { label: 'Conversations', href: '/dashboard/sites/[siteId]/live-chat/conversations', icon: 'MessagesSquare' },
    { label: 'WhatsApp', href: '/dashboard/sites/[siteId]/live-chat/whatsapp', icon: 'MessageCircle' },
    { label: 'Agents', href: '/dashboard/sites/[siteId]/live-chat/agents', icon: 'Users' },
    { label: 'Canned Responses', href: '/dashboard/sites/[siteId]/live-chat/canned-responses', icon: 'Zap' },
    { label: 'Knowledge Base', href: '/dashboard/sites/[siteId]/live-chat/knowledge-base', icon: 'BookOpen' },
    { label: 'Analytics', href: '/dashboard/sites/[siteId]/live-chat/analytics', icon: 'ChartBar' },
    { label: 'Settings', href: '/dashboard/sites/[siteId]/live-chat/settings', icon: 'Settings' },
  ],
}

export const MODULE_PERMISSIONS = [
  { key: 'live-chat.conversations.view', name: 'View Conversations', description: 'View chat conversations' },
  { key: 'live-chat.conversations.reply', name: 'Reply to Conversations', description: 'Send messages in conversations' },
  { key: 'live-chat.conversations.assign', name: 'Assign Conversations', description: 'Assign conversations to agents' },
  { key: 'live-chat.conversations.resolve', name: 'Resolve Conversations', description: 'Resolve and close conversations' },
  { key: 'live-chat.agents.manage', name: 'Manage Agents', description: 'Add, edit, and remove agents' },
  { key: 'live-chat.canned.manage', name: 'Manage Canned Responses', description: 'Create and edit canned responses' },
  { key: 'live-chat.kb.manage', name: 'Manage Knowledge Base', description: 'Manage knowledge base articles' },
  { key: 'live-chat.analytics.view', name: 'View Analytics', description: 'View chat analytics and reports' },
  { key: 'live-chat.settings.manage', name: 'Manage Settings', description: 'Configure widget and integration settings' },
  { key: 'live-chat.whatsapp.manage', name: 'Manage WhatsApp', description: 'Configure WhatsApp integration' },
]

export const MODULE_EVENTS = {
  conversations: {
    created: 'chat.conversation.created',
    assigned: 'chat.conversation.assigned',
    resolved: 'chat.conversation.resolved',
    closed: 'chat.conversation.closed',
    missed: 'chat.conversation.missed',
    rated: 'chat.conversation.rated',
  },
  messages: {
    received: 'chat.message.received',
    sent: 'chat.message.sent',
  },
  agents: {
    statusChanged: 'chat.agent.status_changed',
  },
  whatsapp: {
    messageReceived: 'chat.whatsapp.message_received',
    messageSent: 'chat.whatsapp.message_sent',
    templateSent: 'chat.whatsapp.template_sent',
  },
}

export const MODULE_ACTIONS = {
  conversations: {
    assign: 'chat.conversation.assign',
    resolve: 'chat.conversation.resolve',
    addTag: 'chat.conversation.add_tag',
    setPriority: 'chat.conversation.set_priority',
  },
  messages: {
    send: 'chat.message.send',
    sendTemplate: 'chat.whatsapp.send_template',
  },
}

export const MODULE_API_ROUTES = [
  { path: '/api/modules/live-chat/widget', method: 'GET', description: 'Get widget settings for embed' },
  { path: '/api/modules/live-chat/messages', method: 'POST', description: 'Send a message' },
  { path: '/api/modules/live-chat/conversations', method: 'GET', description: 'List conversations' },
  { path: '/api/modules/live-chat/conversations', method: 'POST', description: 'Create a conversation' },
  { path: '/api/modules/live-chat/webhooks/whatsapp', method: 'GET', description: 'WhatsApp webhook verification' },
  { path: '/api/modules/live-chat/webhooks/whatsapp', method: 'POST', description: 'WhatsApp webhook receiver' },
  { path: '/api/modules/live-chat/embed', method: 'GET', description: 'Widget embed script' },
]

const liveChatManifest = {
  ...liveChatModuleMetadata,
  tables: MODULE_TABLES,
  navigation: MODULE_NAVIGATION,
  permissions: MODULE_PERMISSIONS,
  events: MODULE_EVENTS,
  actions: MODULE_ACTIONS,
  apiRoutes: MODULE_API_ROUTES,
}

export default liveChatManifest
```

---

## Task 5: Module Barrel Export

**File**: `next-platform-dashboard/src/modules/live-chat/index.ts`

```typescript
/**
 * Live Chat Module — Barrel Export
 */

// Types
export * from './types'

// Manifest
export { default as liveChatManifest } from './manifest'

// DB Mapping
export { mapRecord, mapRecords } from './lib/map-db-record'
```

---

## Verification Checklist

After implementing all tasks:

1. [ ] Migration file `lc-01-chat-schema.sql` is complete with all 9 tables, indexes, triggers, and RLS policies
2. [ ] Types file has ALL interfaces and types needed across the entire module
3. [ ] `map-db-record.ts` utility handles snake_case → camelCase conversion
4. [ ] `manifest.ts` follows the platform module manifest pattern
5. [ ] `index.ts` barrel export compiles
6. [ ] `npx tsc --noEmit` returns zero errors
7. [ ] All types use camelCase properties
8. [ ] All DB columns are snake_case
9. [ ] WhatsApp types are included for LC-05
10. [ ] Analytics types are included for LC-07
11. [ ] Realtime types are included for LC-02
12. [ ] No mock data, no hardcoded values, no placeholders

### Testing Instructions
1. Run the migration in Supabase SQL Editor
2. Verify all 9 tables appear in the schema
3. Verify RLS policies are applied
4. Verify triggers are working (insert a test message, check conversation count updates)
5. Run `npx tsc --noEmit` — must be zero errors
6. Commit: `git add -A && git commit -m "feat(live-chat): PHASE-LC-01: database schema, types, manifest & module foundation" && git push`
