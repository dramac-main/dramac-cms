/**
 * Live Chat Module — Manifest
 *
 * Defines metadata, navigation, permissions, events, and API routes
 * following the ModuleManifest interface from _types.ts
 */

import type { ModuleManifest } from '../_types'
import { DEFAULT_TIMEZONE } from '@/lib/locale-config'

// ============================================================================
// MODULE MANIFEST
// ============================================================================

export const LiveChatModuleManifest: ModuleManifest = {
  // Identity
  id: 'live-chat',
  shortId: 'chatmod01',
  name: 'Live Chat',
  displayName: 'Live Chat & Omnichannel Messaging',
  description:
    'Real-time customer messaging with WhatsApp integration, AI auto-responder, smart routing, and comprehensive agent dashboard. Industry-standard live chat rivaling Intercom, Zendesk, and Crisp.',
  version: '1.0.0',

  // Classification
  type: 'enterprise',
  category: 'communication',

  // Author & License
  author: {
    name: 'DRAMAC CMS',
    email: 'support@dramac.dev',
    url: 'https://dramac.dev',
  },
  license: 'proprietary',

  // Technical
  minPlatformVersion: '1.0.0',
  dependencies: [],
  peerDependencies: ['crm'],

  // Database
  schema: {
    prefix: 'mod_chat',
    tables: [
      'mod_chat_departments',
      'mod_chat_agents',
      'mod_chat_widget_settings',
      'mod_chat_visitors',
      'mod_chat_conversations',
      'mod_chat_messages',
      'mod_chat_canned_responses',
      'mod_chat_knowledge_base',
      'mod_chat_analytics',
    ],
    migrations: ['lc-01-chat-schema.sql'],
  },

  // Features
  features: [
    { id: 'widget', name: 'Embeddable Chat Widget', description: 'Customizable chat widget for any website', enabled: true },
    { id: 'conversations', name: 'Conversation Management', description: 'Full conversation lifecycle management', enabled: true },
    { id: 'agents', name: 'Agent Management', description: 'Multi-agent support with roles and departments', enabled: true },
    { id: 'whatsapp', name: 'WhatsApp Integration', description: 'Two-way WhatsApp messaging via Meta Cloud API', enabled: true, requiresSetup: true },
    { id: 'ai-responder', name: 'AI Auto-Responder', description: 'AI-powered automatic responses using knowledge base', enabled: true, requiresSetup: true },
    { id: 'smart-routing', name: 'Smart Routing', description: 'Intelligent conversation routing to available agents', enabled: true },
    { id: 'canned-responses', name: 'Canned Responses', description: 'Quick reply templates with shortcut triggers', enabled: true },
    { id: 'knowledge-base', name: 'Knowledge Base', description: 'Articles for AI auto-responder training', enabled: true },
    { id: 'analytics', name: 'Analytics & Reporting', description: 'Comprehensive chat analytics and agent performance', enabled: true },
    { id: 'satisfaction-rating', name: 'Satisfaction Rating', description: 'Post-chat satisfaction surveys', enabled: true },
    { id: 'file-sharing', name: 'File Sharing', description: 'Send and receive files in conversations', enabled: true },
    { id: 'crm-integration', name: 'CRM Integration', description: 'Link chat visitors to CRM contacts', enabled: true },
  ],

  // Permissions
  permissions: [
    { id: 'live-chat.conversations.view', name: 'View Conversations', description: 'View chat conversations' },
    { id: 'live-chat.conversations.reply', name: 'Reply to Conversations', description: 'Send messages in conversations' },
    { id: 'live-chat.conversations.assign', name: 'Assign Conversations', description: 'Assign conversations to agents' },
    { id: 'live-chat.conversations.resolve', name: 'Resolve Conversations', description: 'Resolve and close conversations' },
    { id: 'live-chat.agents.manage', name: 'Manage Agents', description: 'Add, edit, and remove agents' },
    { id: 'live-chat.departments.manage', name: 'Manage Departments', description: 'Create and configure departments' },
    { id: 'live-chat.canned.manage', name: 'Manage Canned Responses', description: 'Create and edit canned responses' },
    { id: 'live-chat.kb.manage', name: 'Manage Knowledge Base', description: 'Manage knowledge base articles' },
    { id: 'live-chat.analytics.view', name: 'View Analytics', description: 'View chat analytics and reports' },
    { id: 'live-chat.settings.manage', name: 'Manage Settings', description: 'Configure widget and integration settings' },
    { id: 'live-chat.whatsapp.manage', name: 'Manage WhatsApp', description: 'Configure WhatsApp integration' },
    { id: 'live-chat.export', name: 'Export Data', description: 'Export chat transcripts and analytics' },
  ],

  // Settings
  settings: {
    defaultTimezone: DEFAULT_TIMEZONE,
    maxFileSize: 10,
    maxConcurrentChatsDefault: 5,
    aiAutoResponderEnabled: false,
    businessHoursEnabled: false,
  },

  // Navigation
  navigation: {
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
      { label: 'Analytics', href: '/dashboard/sites/[siteId]/live-chat/analytics', icon: 'BarChart3' },
      { label: 'Settings', href: '/dashboard/sites/[siteId]/live-chat/settings', icon: 'Settings' },
    ],
  },

  // API
  api: {
    prefix: '/api/modules/live-chat',
    routes: [
      { method: 'GET', path: '/widget', handler: 'getWidgetSettings' },
      { method: 'POST', path: '/conversations', handler: 'createConversation' },
      { method: 'GET', path: '/conversations', handler: 'listConversations' },
      { method: 'POST', path: '/messages', handler: 'sendMessage' },
      { method: 'GET', path: '/messages', handler: 'getMessages' },
      { method: 'POST', path: '/visitors', handler: 'createVisitor' },
      { method: 'GET', path: '/webhooks/whatsapp', handler: 'whatsappVerify' },
      { method: 'POST', path: '/webhooks/whatsapp', handler: 'whatsappWebhook' },
      { method: 'GET', path: '/embed', handler: 'getEmbedScript' },
    ],
  },

  // Webhooks
  webhooks: [
    { event: 'chat.conversation.created', description: 'New conversation started' },
    { event: 'chat.conversation.assigned', description: 'Conversation assigned to agent' },
    { event: 'chat.conversation.resolved', description: 'Conversation resolved' },
    { event: 'chat.conversation.closed', description: 'Conversation closed' },
    { event: 'chat.conversation.missed', description: 'Conversation missed (no agent responded)' },
    { event: 'chat.conversation.rated', description: 'Visitor rated the conversation' },
    { event: 'chat.message.received', description: 'New message received' },
    { event: 'chat.message.sent', description: 'Message sent by agent' },
    { event: 'chat.whatsapp.message_received', description: 'WhatsApp message received' },
    { event: 'chat.whatsapp.message_sent', description: 'WhatsApp message sent' },
    { event: 'chat.agent.status_changed', description: 'Agent status changed' },
  ],

  // Lifecycle
  lifecycle: {
    onInstall: 'Initialize widget settings with defaults for the site',
    onUninstall: 'Clean up all chat data, unsubscribe from realtime channels',
    onEnable: 'Activate widget embed, start realtime subscriptions',
    onDisable: 'Deactivate widget, stop accepting new conversations',
  },

  // Components
  components: {
    dashboard: 'LiveChatDashboard',
    settings: 'LiveChatSettings',
    widget: 'ChatWidget',
  },

  // Search
  keywords: [
    'chat', 'live-chat', 'support', 'messaging', 'whatsapp',
    'customer-service', 'helpdesk', 'conversations', 'agents',
    'widget', 'embed', 'ai', 'auto-responder', 'knowledge-base',
  ],

  // Marketplace
  screenshots: [
    { url: '/screenshots/live-chat/dashboard.png', title: 'Chat Dashboard', description: 'Overview of all conversations, agents, and analytics' },
    { url: '/screenshots/live-chat/conversation.png', title: 'Conversation View', description: 'Real-time messaging with visitor info panel' },
    { url: '/screenshots/live-chat/widget.png', title: 'Chat Widget', description: 'Embeddable chat widget on a website' },
  ],

  // Pricing
  pricing: {
    type: 'subscription',
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        price: 24.99,
        limits: { agents: 3, conversations: 500, departments: 2 },
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 49.99,
        limits: { agents: 10, conversations: 5000, departments: 10 },
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99.99,
        limits: { agents: -1, conversations: -1, departments: -1 },
      },
    ],
  },
}

// ============================================================================
// EXPORTED CONSTANTS
// ============================================================================

export const MODULE_TABLES = LiveChatModuleManifest.schema.tables

export const MODULE_NAVIGATION = LiveChatModuleManifest.navigation

export const MODULE_PERMISSIONS = LiveChatModuleManifest.permissions

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
  },
} as const

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
} as const

export default LiveChatModuleManifest
