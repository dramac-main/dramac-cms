# Phase EM-53: Live Chat Module

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 15-18 hours
> **Prerequisites**: EM-01, EM-05, EM-40
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Build a **real-time live chat module** for customer support:
1. Embeddable chat widget
2. Real-time messaging with WebSockets
3. Agent dashboard with conversation management
4. Canned responses and shortcuts
5. Conversation history and analytics
6. Offline message handling

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                       LIVE CHAT SYSTEM                            │
├────────────────┬────────────────┬─────────────────────────────────┤
│   WIDGET       │   REAL-TIME    │      AGENT DASHBOARD            │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Chat Bubble    │ WebSocket Hub  │ Conversation List               │
│ Message UI     │ Presence       │ Chat Window                     │
│ Pre-chat Form  │ Typing Status  │ Visitor Info                    │
│ File Uploads   │ Notifications  │ Canned Responses                │
└────────────────┴────────────────┴─────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (2 hours)

```sql
-- migrations/em-53-live-chat-schema.sql

-- ==========================================
-- LIVE CHAT MODULE DATABASE SCHEMA
-- Uses mod_chat_ prefix per EM-05 conventions
-- ==========================================

-- Chat Visitors (website visitors)
CREATE TABLE mod_chat_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Visitor identification
  fingerprint TEXT, -- Browser fingerprint for returning visitors
  user_id UUID REFERENCES users(id), -- If logged in
  
  -- Contact info (from pre-chat form)
  name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Context
  current_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  ip_address INET,
  country_code TEXT,
  city TEXT,
  
  -- Custom data from pre-chat form
  custom_data JSONB DEFAULT '{}',
  
  -- Status
  is_online BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE mod_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Participants
  visitor_id UUID NOT NULL REFERENCES mod_chat_visitors(id) ON DELETE CASCADE,
  assigned_agent_id UUID REFERENCES users(id),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Waiting for agent
    'active',     -- In progress
    'resolved',   -- Marked as resolved
    'closed'      -- Closed by visitor
  )),
  
  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Tags/labels
  tags TEXT[] DEFAULT '{}',
  
  -- Subject (auto-generated or from first message)
  subject TEXT,
  
  -- Rating (after conversation)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  rating_feedback TEXT,
  
  -- Timestamps
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE mod_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES mod_chat_conversations(id) ON DELETE CASCADE,
  
  -- Sender
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent', 'system', 'bot')),
  sender_id UUID, -- visitor_id or agent user_id
  sender_name TEXT,
  
  -- Content
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text', 'image', 'file', 'system', 'typing'
  )),
  content TEXT,
  
  -- Attachments
  attachments JSONB DEFAULT '[]', -- [{url, name, type, size}]
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Read status
  read_by_visitor BOOLEAN DEFAULT false,
  read_by_agent BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Delivery status
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents (chat-specific settings)
CREATE TABLE mod_chat_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Display
  display_name TEXT,
  avatar_url TEXT,
  title TEXT, -- "Support Agent", "Sales Rep"
  
  -- Status
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  status_message TEXT,
  
  -- Capacity
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  
  -- Auto-assignment
  accept_new_chats BOOLEAN DEFAULT true,
  departments TEXT[] DEFAULT '{}',
  
  -- Stats
  total_conversations INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, user_id)
);

-- Canned Responses
CREATE TABLE mod_chat_canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  shortcut TEXT, -- "/hello" triggers the response
  content TEXT NOT NULL,
  
  -- Organization
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Scope
  is_personal BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Widget Settings
CREATE TABLE mod_chat_widget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Appearance
  primary_color TEXT DEFAULT '#0066FF',
  position TEXT DEFAULT 'bottom-right' CHECK (position IN (
    'bottom-right', 'bottom-left'
  )),
  widget_title TEXT DEFAULT 'Chat with us',
  welcome_message TEXT DEFAULT 'Hi! How can we help you today?',
  offline_message TEXT DEFAULT 'We''re offline right now. Leave a message!',
  
  -- Avatar
  avatar_url TEXT,
  show_agent_avatar BOOLEAN DEFAULT true,
  
  -- Behavior
  auto_open_delay INTEGER, -- Seconds before auto-opening (null = never)
  show_on_mobile BOOLEAN DEFAULT true,
  require_email BOOLEAN DEFAULT false,
  
  -- Pre-chat form
  pre_chat_enabled BOOLEAN DEFAULT false,
  pre_chat_fields JSONB DEFAULT '[]', -- [{name, label, type, required}]
  
  -- Business hours
  business_hours_enabled BOOLEAN DEFAULT false,
  business_hours JSONB DEFAULT '{}', -- {mon: [{start: "09:00", end: "17:00"}], ...}
  timezone TEXT DEFAULT 'UTC',
  
  -- Sound
  sound_enabled BOOLEAN DEFAULT true,
  notification_sound TEXT DEFAULT 'default',
  
  -- Language
  language TEXT DEFAULT 'en',
  custom_translations JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id)
);

-- Chat Analytics (daily aggregates)
CREATE TABLE mod_chat_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Volume
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  
  -- Response times
  avg_first_response_seconds INTEGER,
  avg_resolution_seconds INTEGER,
  
  -- Satisfaction
  conversations_rated INTEGER DEFAULT 0,
  total_rating_sum INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),
  
  -- Status breakdown
  conversations_resolved INTEGER DEFAULT 0,
  conversations_missed INTEGER DEFAULT 0,
  
  -- Agent stats
  messages_by_agents JSONB DEFAULT '{}', -- {agent_id: count}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, date)
);

-- Indexes
CREATE INDEX idx_chat_visitors_site ON mod_chat_visitors(site_id);
CREATE INDEX idx_chat_visitors_fingerprint ON mod_chat_visitors(site_id, fingerprint);
CREATE INDEX idx_chat_conversations_site ON mod_chat_conversations(site_id);
CREATE INDEX idx_chat_conversations_status ON mod_chat_conversations(site_id, status);
CREATE INDEX idx_chat_conversations_agent ON mod_chat_conversations(assigned_agent_id);
CREATE INDEX idx_chat_messages_conversation ON mod_chat_messages(conversation_id);
CREATE INDEX idx_chat_agents_site ON mod_chat_agents(site_id);
CREATE INDEX idx_chat_agents_status ON mod_chat_agents(site_id, status);

-- RLS Policies
ALTER TABLE mod_chat_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_chat_widget_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_isolation" ON mod_chat_visitors
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON mod_chat_conversations
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON mod_chat_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM mod_chat_conversations 
      WHERE site_id = current_setting('app.site_id', true)::uuid
    )
  );
  
CREATE POLICY "site_isolation" ON mod_chat_agents
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON mod_chat_widget_settings
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
```

---

### Task 2: Real-time WebSocket Hub (3 hours)

```typescript
// src/lib/modules/livechat/services/websocket-hub.ts

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ConnectedClient {
  socketId: string;
  type: 'visitor' | 'agent';
  siteId: string;
  visitorId?: string;
  userId?: string;
  conversationId?: string;
}

export class ChatWebSocketHub {
  private io: SocketIOServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private visitorSockets: Map<string, string> = new Map(); // visitorId -> socketId
  private agentSockets: Map<string, Set<string>> = new Map(); // agentId -> Set<socketId>

  constructor(httpServer: any) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST']
      },
      path: '/api/modules/livechat/ws'
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      // ========== Authentication ==========
      socket.on('authenticate', async (data: {
        type: 'visitor' | 'agent';
        siteId: string;
        visitorId?: string;
        userId?: string;
        token?: string;
      }) => {
        // Validate site exists
        const { data: site } = await supabase
          .from('sites')
          .select('id')
          .eq('id', data.siteId)
          .single();

        if (!site) {
          socket.emit('error', { message: 'Invalid site' });
          socket.disconnect();
          return;
        }

        // For agents, verify token
        if (data.type === 'agent' && data.token) {
          // Verify JWT token
          const { data: user } = await supabase.auth.getUser(data.token);
          if (!user.user) {
            socket.emit('error', { message: 'Invalid token' });
            socket.disconnect();
            return;
          }
          data.userId = user.user.id;
        }

        // Register client
        const client: ConnectedClient = {
          socketId: socket.id,
          type: data.type,
          siteId: data.siteId,
          visitorId: data.visitorId,
          userId: data.userId
        };

        this.clients.set(socket.id, client);

        if (data.type === 'visitor' && data.visitorId) {
          this.visitorSockets.set(data.visitorId, socket.id);
          await this.updateVisitorOnlineStatus(data.visitorId, true);
        } else if (data.type === 'agent' && data.userId) {
          if (!this.agentSockets.has(data.userId)) {
            this.agentSockets.set(data.userId, new Set());
          }
          this.agentSockets.get(data.userId)!.add(socket.id);
          await this.updateAgentStatus(data.siteId, data.userId, 'online');
        }

        // Join site room
        socket.join(`site:${data.siteId}`);

        socket.emit('authenticated', { success: true });
      });

      // ========== Visitor Events ==========
      socket.on('visitor:start_chat', async (data: {
        name?: string;
        email?: string;
        customData?: Record<string, any>;
      }) => {
        const client = this.clients.get(socket.id);
        if (!client || client.type !== 'visitor') return;

        // Create or get conversation
        const conversation = await this.createConversation(client, data);
        client.conversationId = conversation.id;

        socket.join(`conversation:${conversation.id}`);
        socket.emit('conversation:started', conversation);

        // Notify agents
        this.io.to(`site:${client.siteId}:agents`).emit('conversation:new', conversation);
      });

      socket.on('visitor:send_message', async (data: { content: string; attachments?: any[] }) => {
        const client = this.clients.get(socket.id);
        if (!client || !client.conversationId) return;

        const message = await this.saveMessage({
          conversationId: client.conversationId,
          senderType: 'visitor',
          senderId: client.visitorId,
          content: data.content,
          attachments: data.attachments
        });

        // Broadcast to conversation room
        this.io.to(`conversation:${client.conversationId}`).emit('message:new', message);
      });

      socket.on('visitor:typing', (data: { isTyping: boolean }) => {
        const client = this.clients.get(socket.id);
        if (!client || !client.conversationId) return;

        socket.to(`conversation:${client.conversationId}`).emit('visitor:typing', {
          conversationId: client.conversationId,
          isTyping: data.isTyping
        });
      });

      // ========== Agent Events ==========
      socket.on('agent:join_conversation', async (conversationId: string) => {
        const client = this.clients.get(socket.id);
        if (!client || client.type !== 'agent') return;

        socket.join(`conversation:${conversationId}`);
        
        // Auto-assign if not assigned
        const { data: conv } = await supabase
          .from('mod_chat_conversations')
          .select('assigned_agent_id')
          .eq('id', conversationId)
          .single();

        if (conv && !conv.assigned_agent_id) {
          await supabase
            .from('mod_chat_conversations')
            .update({ 
              assigned_agent_id: client.userId,
              status: 'active'
            })
            .eq('id', conversationId);

          this.io.to(`conversation:${conversationId}`).emit('conversation:assigned', {
            conversationId,
            agentId: client.userId
          });
        }
      });

      socket.on('agent:send_message', async (data: { 
        conversationId: string;
        content: string;
        attachments?: any[];
      }) => {
        const client = this.clients.get(socket.id);
        if (!client || client.type !== 'agent') return;

        // Get agent display name
        const { data: agent } = await supabase
          .from('mod_chat_agents')
          .select('display_name')
          .eq('site_id', client.siteId)
          .eq('user_id', client.userId)
          .single();

        const message = await this.saveMessage({
          conversationId: data.conversationId,
          senderType: 'agent',
          senderId: client.userId,
          senderName: agent?.display_name,
          content: data.content,
          attachments: data.attachments
        });

        // Update first response time if needed
        await this.updateFirstResponseTime(data.conversationId);

        // Broadcast to conversation room
        this.io.to(`conversation:${data.conversationId}`).emit('message:new', message);
      });

      socket.on('agent:typing', (data: { conversationId: string; isTyping: boolean }) => {
        const client = this.clients.get(socket.id);
        if (!client || client.type !== 'agent') return;

        socket.to(`conversation:${data.conversationId}`).emit('agent:typing', {
          conversationId: data.conversationId,
          isTyping: data.isTyping
        });
      });

      socket.on('agent:resolve_conversation', async (conversationId: string) => {
        const client = this.clients.get(socket.id);
        if (!client || client.type !== 'agent') return;

        await supabase
          .from('mod_chat_conversations')
          .update({ 
            status: 'resolved',
            resolved_at: new Date().toISOString()
          })
          .eq('id', conversationId);

        this.io.to(`conversation:${conversationId}`).emit('conversation:resolved', {
          conversationId
        });
      });

      socket.on('agent:transfer_conversation', async (data: {
        conversationId: string;
        toAgentId: string;
      }) => {
        const client = this.clients.get(socket.id);
        if (!client || client.type !== 'agent') return;

        await supabase
          .from('mod_chat_conversations')
          .update({ assigned_agent_id: data.toAgentId })
          .eq('id', data.conversationId);

        // Notify new agent
        const newAgentSockets = this.agentSockets.get(data.toAgentId);
        if (newAgentSockets) {
          newAgentSockets.forEach(socketId => {
            this.io.to(socketId).emit('conversation:transferred', {
              conversationId: data.conversationId
            });
          });
        }
      });

      // ========== Status Updates ==========
      socket.on('agent:set_status', async (status: 'online' | 'away' | 'busy' | 'offline') => {
        const client = this.clients.get(socket.id);
        if (!client || client.type !== 'agent') return;

        await this.updateAgentStatus(client.siteId, client.userId!, status);

        // Broadcast to other agents
        this.io.to(`site:${client.siteId}:agents`).emit('agent:status_changed', {
          agentId: client.userId,
          status
        });
      });

      // ========== Disconnect ==========
      socket.on('disconnect', async () => {
        const client = this.clients.get(socket.id);
        if (!client) return;

        if (client.type === 'visitor' && client.visitorId) {
          this.visitorSockets.delete(client.visitorId);
          await this.updateVisitorOnlineStatus(client.visitorId, false);
        } else if (client.type === 'agent' && client.userId) {
          const agentSockets = this.agentSockets.get(client.userId);
          if (agentSockets) {
            agentSockets.delete(socket.id);
            if (agentSockets.size === 0) {
              this.agentSockets.delete(client.userId);
              await this.updateAgentStatus(client.siteId, client.userId, 'offline');
            }
          }
        }

        this.clients.delete(socket.id);
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private async createConversation(client: ConnectedClient, data: any) {
    // Update visitor info
    if (client.visitorId) {
      await supabase
        .from('mod_chat_visitors')
        .update({
          name: data.name,
          email: data.email,
          custom_data: data.customData,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.visitorId);
    }

    // Get agency_id from site
    const { data: site } = await supabase
      .from('sites')
      .select('agency_id')
      .eq('id', client.siteId)
      .single();

    // Create conversation
    const { data: conversation, error } = await supabase
      .from('mod_chat_conversations')
      .insert({
        site_id: client.siteId,
        agency_id: site!.agency_id,
        visitor_id: client.visitorId,
        status: 'pending',
        first_message_at: new Date().toISOString()
      })
      .select(`
        *,
        visitor:mod_chat_visitors(name, email)
      `)
      .single();

    if (error) throw error;
    return conversation;
  }

  private async saveMessage(data: {
    conversationId: string;
    senderType: string;
    senderId?: string;
    senderName?: string;
    content: string;
    attachments?: any[];
  }) {
    const { data: message, error } = await supabase
      .from('mod_chat_messages')
      .insert({
        conversation_id: data.conversationId,
        sender_type: data.senderType,
        sender_id: data.senderId,
        sender_name: data.senderName,
        content: data.content,
        attachments: data.attachments || [],
        status: 'sent'
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last_message_at
    await supabase
      .from('mod_chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', data.conversationId);

    return message;
  }

  private async updateFirstResponseTime(conversationId: string) {
    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('first_response_at')
      .eq('id', conversationId)
      .single();

    if (conv && !conv.first_response_at) {
      await supabase
        .from('mod_chat_conversations')
        .update({ first_response_at: new Date().toISOString() })
        .eq('id', conversationId);
    }
  }

  private async updateVisitorOnlineStatus(visitorId: string, isOnline: boolean) {
    await supabase
      .from('mod_chat_visitors')
      .update({
        is_online: isOnline,
        last_seen_at: new Date().toISOString()
      })
      .eq('id', visitorId);
  }

  private async updateAgentStatus(siteId: string, userId: string, status: string) {
    await supabase
      .from('mod_chat_agents')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('site_id', siteId)
      .eq('user_id', userId);
  }

  // Public method to send message programmatically
  public sendToConversation(conversationId: string, event: string, data: any) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }
}
```

---

### Task 3: Conversation Service (2 hours)

```typescript
// src/lib/modules/livechat/services/conversation-service.ts

import { createClient } from '@supabase/supabase-js';
import { setTenantContext } from '@/lib/modules/multi-tenant/tenant-context';

export interface Conversation {
  id: string;
  site_id: string;
  visitor_id: string;
  assigned_agent_id: string | null;
  status: 'pending' | 'active' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  subject: string | null;
  rating: number | null;
  rating_feedback: string | null;
  first_message_at: string | null;
  last_message_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  created_at: string;
  
  // Relations
  visitor?: Visitor;
  agent?: Agent;
  messages?: Message[];
  unread_count?: number;
}

export interface Visitor {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  current_url: string | null;
  country_code: string | null;
  city: string | null;
  is_online: boolean;
  last_seen_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  title: string | null;
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'visitor' | 'agent' | 'system' | 'bot';
  sender_id: string | null;
  sender_name: string | null;
  message_type: 'text' | 'image' | 'file' | 'system';
  content: string | null;
  attachments: Attachment[];
  read_by_visitor: boolean;
  read_by_agent: boolean;
  status: string;
  created_at: string;
}

export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class ConversationService {
  private siteId: string;
  private agencyId: string;

  constructor(siteId: string, agencyId: string) {
    this.siteId = siteId;
    this.agencyId = agencyId;
  }

  /**
   * Get all conversations with filters
   */
  async getConversations(filters: {
    status?: string;
    agentId?: string;
    priority?: string;
    search?: string;
    unassigned?: boolean;
  } = {}, page = 1, limit = 20): Promise<{ conversations: Conversation[]; total: number }> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    let query = supabase
      .from('mod_chat_conversations')
      .select(`
        *,
        visitor:mod_chat_visitors(id, name, email, is_online, last_seen_at, current_url, country_code),
        agent:mod_chat_agents!assigned_agent_id(user_id, display_name, avatar_url, status)
      `, { count: 'exact' });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.agentId) query = query.eq('assigned_agent_id', filters.agentId);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.unassigned) query = query.is('assigned_agent_id', null);
    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%`);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order('last_message_at', { ascending: false });

    const { data, count, error } = await query;
    if (error) throw error;

    return { conversations: data || [], total: count || 0 };
  }

  /**
   * Get single conversation with messages
   */
  async getConversation(id: string, includeMessages = true): Promise<Conversation | null> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_chat_conversations')
      .select(`
        *,
        visitor:mod_chat_visitors(*),
        agent:mod_chat_agents!assigned_agent_id(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    if (includeMessages) {
      const { data: messages } = await supabase
        .from('mod_chat_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      data.messages = messages || [];
    }

    return data;
  }

  /**
   * Assign conversation to agent
   */
  async assignToAgent(conversationId: string, agentId: string): Promise<Conversation> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_chat_conversations')
      .update({
        assigned_agent_id: agentId,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;

    // Increment agent chat count
    await supabase.rpc('mod_chat_increment_agent_count', { p_agent_id: agentId });

    return data;
  }

  /**
   * Update conversation status
   */
  async updateStatus(conversationId: string, status: string): Promise<Conversation> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('mod_chat_conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update conversation priority
   */
  async updatePriority(conversationId: string, priority: string): Promise<Conversation> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_chat_conversations')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add/remove tags
   */
  async updateTags(conversationId: string, tags: string[]): Promise<Conversation> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_chat_conversations')
      .update({ tags, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Submit rating
   */
  async submitRating(conversationId: string, rating: number, feedback?: string): Promise<void> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    await supabase
      .from('mod_chat_conversations')
      .update({
        rating,
        rating_feedback: feedback,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    // Update agent average rating
    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('assigned_agent_id')
      .eq('id', conversationId)
      .single();

    if (conv?.assigned_agent_id) {
      await supabase.rpc('mod_chat_update_agent_rating', {
        p_site_id: this.siteId,
        p_user_id: conv.assigned_agent_id
      });
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, before?: string, limit = 50): Promise<Message[]> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    let query = supabase
      .from('mod_chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).reverse();
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, readBy: 'visitor' | 'agent'): Promise<void> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const field = readBy === 'visitor' ? 'read_by_visitor' : 'read_by_agent';
    
    await supabase
      .from('mod_chat_messages')
      .update({ [field]: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq(field, false);
  }

  /**
   * Get conversation statistics
   */
  async getStats(dateFrom?: Date, dateTo?: Date): Promise<{
    totalConversations: number;
    pendingCount: number;
    activeCount: number;
    resolvedCount: number;
    avgFirstResponseMs: number;
    avgResolutionMs: number;
    avgRating: number;
  }> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    let query = supabase
      .from('mod_chat_conversations')
      .select('status, first_message_at, first_response_at, resolved_at, rating');

    if (dateFrom) query = query.gte('created_at', dateFrom.toISOString());
    if (dateTo) query = query.lte('created_at', dateTo.toISOString());

    const { data, error } = await query;
    if (error) throw error;

    const conversations = data || [];
    
    const pendingCount = conversations.filter(c => c.status === 'pending').length;
    const activeCount = conversations.filter(c => c.status === 'active').length;
    const resolvedCount = conversations.filter(c => c.status === 'resolved').length;

    // Calculate average first response time
    const responseTimes = conversations
      .filter(c => c.first_message_at && c.first_response_at)
      .map(c => new Date(c.first_response_at).getTime() - new Date(c.first_message_at).getTime());
    
    const avgFirstResponseMs = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Calculate average resolution time
    const resolutionTimes = conversations
      .filter(c => c.first_message_at && c.resolved_at)
      .map(c => new Date(c.resolved_at).getTime() - new Date(c.first_message_at).getTime());
    
    const avgResolutionMs = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    // Calculate average rating
    const ratings = conversations.filter(c => c.rating).map(c => c.rating!);
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    return {
      totalConversations: conversations.length,
      pendingCount,
      activeCount,
      resolvedCount,
      avgFirstResponseMs,
      avgResolutionMs,
      avgRating
    };
  }
}
```

---

### Task 4: Chat Widget (3 hours)

```tsx
// src/lib/modules/livechat/widgets/ChatWidget.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WidgetSettings {
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  widgetTitle: string;
  welcomeMessage: string;
  offlineMessage: string;
  avatarUrl?: string;
  showAgentAvatar: boolean;
  requireEmail: boolean;
  preChatEnabled: boolean;
  preChatFields: PreChatField[];
  soundEnabled: boolean;
}

interface PreChatField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

interface Message {
  id: string;
  sender_type: 'visitor' | 'agent' | 'system';
  sender_name?: string;
  content: string;
  attachments?: { url: string; name: string; type: string }[];
  created_at: string;
}

interface ChatWidgetProps {
  siteId: string;
  apiBaseUrl?: string;
}

export function ChatWidget({ siteId, apiBaseUrl = '' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [agentsOnline, setAgentsOnline] = useState(false);
  
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [showPreChat, setShowPreChat] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/modules/livechat/widget/settings?site_id=${siteId}`);
        const data = await response.json();
        setSettings(data);
        setShowPreChat(data.preChatEnabled);
      } catch (error) {
        console.error('Failed to load chat settings:', error);
      }
    }
    loadSettings();
  }, [siteId, apiBaseUrl]);

  // Initialize socket connection
  useEffect(() => {
    if (!isOpen || !settings) return;

    // Get or create visitor ID
    let storedVisitorId = localStorage.getItem(`chat_visitor_${siteId}`);
    if (!storedVisitorId) {
      storedVisitorId = crypto.randomUUID();
      localStorage.setItem(`chat_visitor_${siteId}`, storedVisitorId);
    }
    setVisitorId(storedVisitorId);

    // Connect to WebSocket
    const newSocket = io(apiBaseUrl || window.location.origin, {
      path: '/api/modules/livechat/ws',
      query: { siteId }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('authenticate', {
        type: 'visitor',
        siteId,
        visitorId: storedVisitorId
      });
    });

    newSocket.on('authenticated', () => {
      // Check for existing conversation
      checkExistingConversation(storedVisitorId!);
    });

    newSocket.on('conversation:started', (conversation) => {
      setConversationId(conversation.id);
      setShowPreChat(false);
    });

    newSocket.on('message:new', (message: Message) => {
      setMessages(prev => [...prev, message]);
      if (settings?.soundEnabled && message.sender_type === 'agent') {
        playNotificationSound();
      }
    });

    newSocket.on('agent:typing', ({ isTyping }) => {
      setAgentTyping(isTyping);
    });

    newSocket.on('conversation:resolved', () => {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender_type: 'system',
          content: 'This conversation has been resolved.',
          created_at: new Date().toISOString()
        }
      ]);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isOpen, settings, siteId, apiBaseUrl]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function checkExistingConversation(visitorId: string) {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/modules/livechat/visitor/conversation?site_id=${siteId}&visitor_id=${visitorId}`
      );
      const data = await response.json();
      
      if (data.conversation) {
        setConversationId(data.conversation.id);
        setMessages(data.messages || []);
        setShowPreChat(false);
      }
      
      setAgentsOnline(data.agentsOnline);
    } catch (error) {
      console.error('Failed to check existing conversation:', error);
    }
  }

  function handlePreChatSubmit(data: Record<string, any>) {
    if (!socket || !isConnected) return;
    
    socket.emit('visitor:start_chat', {
      name: data.name,
      email: data.email,
      customData: data
    });
  }

  function sendMessage() {
    if (!inputValue.trim() || !socket || !conversationId) return;

    socket.emit('visitor:send_message', {
      content: inputValue.trim()
    });

    setInputValue('');
    handleTyping(false);
  }

  function handleTyping(typing: boolean) {
    if (isTyping !== typing) {
      setIsTyping(typing);
      socket?.emit('visitor:typing', { isTyping: typing });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 3000);
    }
  }

  function playNotificationSound() {
    const audio = new Audio('/sounds/chat-notification.mp3');
    audio.play().catch(() => {});
  }

  if (!settings) return null;

  const positionClasses = settings.position === 'bottom-left' 
    ? 'left-4' 
    : 'right-4';

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-4 ${positionClasses} w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50`}
          style={{ backgroundColor: settings.primaryColor }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2} 
            stroke="white" 
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-4 ${positionClasses} w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden`}
        >
          {/* Header */}
          <div 
            className="p-4 flex items-center gap-3"
            style={{ backgroundColor: settings.primaryColor }}
          >
            {settings.avatarUrl && (
              <img 
                src={settings.avatarUrl} 
                alt="" 
                className="w-10 h-10 rounded-full bg-white/20"
              />
            )}
            <div className="flex-1 text-white">
              <h3 className="font-semibold">{settings.widgetTitle}</h3>
              <p className="text-xs opacity-80">
                {agentsOnline ? 'Online' : 'Leave a message'}
              </p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Pre-chat Form */}
          {showPreChat && settings.preChatEnabled ? (
            <PreChatForm
              fields={settings.preChatFields}
              onSubmit={handlePreChatSubmit}
              primaryColor={settings.primaryColor}
            />
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Welcome message */}
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>{agentsOnline ? settings.welcomeMessage : settings.offlineMessage}</p>
                  </div>
                )}

                {messages.map(message => (
                  <MessageBubble 
                    key={message.id} 
                    message={message}
                    showAgentAvatar={settings.showAgentAvatar}
                    primaryColor={settings.primaryColor}
                  />
                ))}

                {agentTyping && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    Agent is typing...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                {!conversationId && !showPreChat ? (
                  <button
                    onClick={() => setShowPreChat(true)}
                    className="w-full py-3 rounded-lg font-medium text-white"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    Start a conversation
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={e => {
                        setInputValue(e.target.value);
                        handleTyping(e.target.value.length > 0);
                      }}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': settings.primaryColor } as any}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputValue.trim()}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-50"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ============= Sub-components =============

interface PreChatFormProps {
  fields: PreChatField[];
  onSubmit: (data: Record<string, any>) => void;
  primaryColor: string;
}

function PreChatForm({ fields, onSubmit, primaryColor }: PreChatFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formData);
  }

  const defaultFields = fields.length === 0 ? [
    { name: 'name', label: 'Your name', type: 'text' as const, required: true },
    { name: 'email', label: 'Email', type: 'email' as const, required: true }
  ] : fields;

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 overflow-y-auto">
      <p className="text-gray-600 text-sm">
        Please fill in the form to start chatting.
      </p>
      
      {defaultFields.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label} {field.required && '*'}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              value={formData[field.name] || ''}
              onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
              required={field.required}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
              rows={3}
            />
          ) : field.type === 'select' ? (
            <select
              value={formData[field.name] || ''}
              onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
              required={field.required}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            >
              <option value="">Select...</option>
              {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              value={formData[field.name] || ''}
              onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
              required={field.required}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            />
          )}
        </div>
      ))}
      
      <button
        type="submit"
        className="w-full py-3 rounded-lg font-medium text-white"
        style={{ backgroundColor: primaryColor }}
      >
        Start Chat
      </button>
    </form>
  );
}

interface MessageBubbleProps {
  message: Message;
  showAgentAvatar: boolean;
  primaryColor: string;
}

function MessageBubble({ message, showAgentAvatar, primaryColor }: MessageBubbleProps) {
  const isVisitor = message.sender_type === 'visitor';
  const isSystem = message.sender_type === 'system';

  if (isSystem) {
    return (
      <div className="text-center text-gray-500 text-sm py-2">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[80%] ${isVisitor ? 'flex-row-reverse' : ''}`}>
        {!isVisitor && showAgentAvatar && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-sm">
            {message.sender_name?.[0] || 'A'}
          </div>
        )}
        <div>
          {!isVisitor && message.sender_name && (
            <p className="text-xs text-gray-500 mb-1">{message.sender_name}</p>
          )}
          <div
            className={`px-4 py-2 rounded-2xl ${
              isVisitor 
                ? 'text-white rounded-br-sm' 
                : 'bg-gray-100 rounded-bl-sm'
            }`}
            style={isVisitor ? { backgroundColor: primaryColor } : undefined}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(message.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 5: Agent Dashboard Components (3 hours)

```tsx
// src/lib/modules/livechat/components/AgentDashboard.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ConversationService, Conversation, Message } from '../services/conversation-service';

interface AgentDashboardProps {
  siteId: string;
  agencyId: string;
  userId: string;
  authToken: string;
}

export function AgentDashboard({ siteId, agencyId, userId, authToken }: AgentDashboardProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<'all' | 'mine' | 'unassigned'>('all');
  const [agentStatus, setAgentStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      path: '/api/modules/livechat/ws'
    });

    newSocket.on('connect', () => {
      newSocket.emit('authenticate', {
        type: 'agent',
        siteId,
        userId,
        token: authToken
      });
    });

    newSocket.on('authenticated', () => {
      loadConversations();
    });

    newSocket.on('conversation:new', (conversation: Conversation) => {
      setConversations(prev => [conversation, ...prev]);
      playSound();
    });

    newSocket.on('message:new', (message: Message) => {
      setMessages(prev => [...prev, message]);
      if (message.sender_type === 'visitor') {
        playSound();
      }
    });

    newSocket.on('visitor:typing', ({ conversationId, isTyping }) => {
      // Update typing indicator for conversation
    });

    newSocket.on('conversation:resolved', ({ conversationId }) => {
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, status: 'resolved' } : c)
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [siteId, userId, authToken]);

  async function loadConversations() {
    const service = new ConversationService(siteId, agencyId);
    const result = await service.getConversations({
      status: 'pending,active',
      agentId: filter === 'mine' ? userId : undefined,
      unassigned: filter === 'unassigned'
    });
    setConversations(result.conversations);
  }

  async function selectConversation(conversation: Conversation) {
    setSelectedConversation(conversation);
    
    // Join conversation room
    socket?.emit('agent:join_conversation', conversation.id);
    
    // Load messages
    const service = new ConversationService(siteId, agencyId);
    const conv = await service.getConversation(conversation.id);
    if (conv) {
      setMessages(conv.messages || []);
      await service.markAsRead(conversation.id, 'agent');
    }
  }

  function sendMessage() {
    if (!inputValue.trim() || !socket || !selectedConversation) return;

    socket.emit('agent:send_message', {
      conversationId: selectedConversation.id,
      content: inputValue.trim()
    });

    setInputValue('');
  }

  function resolveConversation() {
    if (!socket || !selectedConversation) return;
    socket.emit('agent:resolve_conversation', selectedConversation.id);
  }

  function changeStatus(status: typeof agentStatus) {
    setAgentStatus(status);
    socket?.emit('agent:set_status', status);
  }

  function playSound() {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(() => {});
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Agent Status */}
        <div className="p-4 border-b">
          <select
            value={agentStatus}
            onChange={e => changeStatus(e.target.value as typeof agentStatus)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="online">🟢 Online</option>
            <option value="away">🟡 Away</option>
            <option value="busy">🔴 Busy</option>
            <option value="offline">⚫ Offline</option>
          </select>
        </div>

        {/* Filters */}
        <div className="flex border-b">
          {(['all', 'mine', 'unassigned'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-sm font-medium ${
                filter === f ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={`w-full p-4 border-b text-left hover:bg-gray-50 ${
                selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {conv.visitor?.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">
                      {conv.visitor?.name || conv.visitor?.email || 'Visitor'}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      conv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      conv.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conv.visitor?.current_url}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    {conv.visitor?.is_online && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Online
                      </span>
                    )}
                    {conv.last_message_at && (
                      <span>
                        {new Date(conv.last_message_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  {selectedConversation.visitor?.name || 'Visitor'}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedConversation.visitor?.email}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={resolveConversation}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Resolve
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <AgentMessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>

      {/* Visitor Info Panel */}
      {selectedConversation && (
        <div className="w-72 border-l p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Visitor Info</h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p>{selectedConversation.visitor?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p>{selectedConversation.visitor?.email || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-gray-500">Location</p>
              <p>
                {selectedConversation.visitor?.city}, {selectedConversation.visitor?.country_code}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Current Page</p>
              <p className="truncate">{selectedConversation.visitor?.current_url}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Seen</p>
              <p>
                {selectedConversation.visitor?.last_seen_at 
                  ? new Date(selectedConversation.visitor.last_seen_at).toLocaleString()
                  : 'Unknown'}
              </p>
            </div>
          </div>

          <hr className="my-4" />

          <h3 className="font-semibold mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {selectedConversation.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AgentMessageBubble({ message }: { message: Message }) {
  const isAgent = message.sender_type === 'agent';
  const isSystem = message.sender_type === 'system';

  if (isSystem) {
    return (
      <div className="text-center text-gray-500 text-sm py-2">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isAgent ? 'text-right' : ''}`}>
        <div
          className={`inline-block px-4 py-2 rounded-2xl ${
            isAgent 
              ? 'bg-blue-600 text-white rounded-br-sm' 
              : 'bg-gray-100 rounded-bl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Widget loads and displays correctly
- [ ] WebSocket connection establishes
- [ ] Messages send/receive in real-time
- [ ] Typing indicators work
- [ ] Pre-chat form captures data
- [ ] Agent dashboard shows conversations
- [ ] Conversation assignment works
- [ ] Status changes propagate
- [ ] Message history persists
- [ ] Sound notifications work

---

## 📍 Dependencies

- **Requires**: EM-01, EM-05 (naming), EM-40 (multi-tenant)
- **Required by**: Customer support features
- **External**: Socket.io for real-time
