/**
 * Automation Module Manifest
 * 
 * Phase EM-57A: Automation Engine - Core Infrastructure
 * 
 * This manifest defines the Automation module metadata, capabilities,
 * and integration points for the DRAMAC CMS platform.
 * 
 * Module ID: automation (short_id: autom01)
 */

// ============================================================================
// MODULE METADATA (custom structure for automation module)
// ============================================================================

interface AutomationModuleMetadata {
  id: string
  shortId: string
  name: string
  description: string
  version: string
  author: string
  category: string
  tags: string[]
  minimumPlatformVersion: string
  capabilities: string[]
  dependencies: string[]
  optionalDependencies: string[]
  hooks: {
    onInstall: string
    onUninstall: string
    onActivate: string
    onDeactivate: string
  }
}

export const moduleMetadata: AutomationModuleMetadata = {
  id: 'automation',
  shortId: 'autom01',
  name: 'Automation Engine',
  description: 'Create powerful automated workflows that connect your business operations. Trigger actions based on events, schedules, or webhooks.',
  version: '1.0.0',
  author: 'DRAMAC Platform',
  
  // Categorization
  category: 'productivity',
  tags: ['automation', 'workflows', 'integrations', 'business-logic', 'triggers'],
  
  // Requirements
  minimumPlatformVersion: '1.0.0',
  
  // Module capabilities
  capabilities: [
    'workflow-builder',
    'event-triggers',
    'scheduled-triggers',
    'webhook-triggers',
    'manual-triggers',
    'conditional-logic',
    'delay-actions',
    'external-integrations',
    'crm-integration',
    'email-integration',
    'notification-integration',
  ],
  
  // Dependencies on other modules
  dependencies: [],
  optionalDependencies: ['crm', 'email-marketing', 'forms', 'booking', 'ecommerce'],
  
  // Lifecycle hooks
  hooks: {
    onInstall: 'runMigrations',
    onUninstall: 'cleanupData',
    onActivate: 'startWorkers',
    onDeactivate: 'stopWorkers',
  },
}

// ============================================================================
// AUTOMATION MODULE MANIFEST (custom extended structure)
// ============================================================================

interface AutomationNavigationItem {
  name: string
  href: string
}

interface AutomationNavigationGroup {
  name: string
  href: string
  icon: string
  badge: string | null
  children: AutomationNavigationItem[]
}

interface AutomationPermission {
  key: string
  name: string
  description: string
}

interface AutomationEvent {
  type: string
  description: string
}

interface AutomationTrigger {
  type: string
  description: string
}

interface AutomationAction {
  type: string
  description: string
}

interface AutomationApiRoute {
  path: string
  method: string
  description: string
}

interface AutomationWidget {
  id: string
  name: string
  component: string
  defaultSize: { width: number; height: number }
}

interface AutomationManifest extends AutomationModuleMetadata {
  tables: string[]
  navigation: AutomationNavigationGroup[]
  permissions: AutomationPermission[]
  settingsSchema: {
    type: string
    properties: Record<string, {
      type: string
      title: string
      description: string
      default: number | boolean
      minimum?: number
      maximum?: number
    }>
  }
  events: AutomationEvent[]
  triggers: AutomationTrigger[]
  actions: AutomationAction[]
  apiRoutes: AutomationApiRoute[]
  widgets: AutomationWidget[]
}

export const automationManifest: AutomationManifest = {
  ...moduleMetadata,
  
  // Database tables (created via migrations)
  tables: [
    'automation_workflows',
    'workflow_steps',
    'workflow_executions',
    'step_execution_logs',
    'workflow_variables',
    'automation_event_subscriptions',
    'automation_events_log',
    'automation_scheduled_jobs',
    'automation_connections',
    'automation_webhook_endpoints',
  ],
  
  // Navigation items for dashboard
  navigation: [
    {
      name: 'Automations',
      href: '/dashboard/sites/[siteId]/automation',
      icon: 'Workflow',
      badge: null,
      children: [
        { name: 'All Workflows', href: '/dashboard/sites/[siteId]/automation' },
        { name: 'Create Workflow', href: '/dashboard/sites/[siteId]/automation/workflows' },
        { name: 'Executions', href: '/dashboard/sites/[siteId]/automation/executions' },
        { name: 'Connections', href: '/dashboard/sites/[siteId]/automation/connections' },
        { name: 'Settings', href: '/dashboard/sites/[siteId]/automation/templates' },
      ],
    },
  ],
  
  // Permissions for RBAC
  permissions: [
    { key: 'automation.view', name: 'View Automations', description: 'View automation workflows and executions' },
    { key: 'automation.create', name: 'Create Automations', description: 'Create new automation workflows' },
    { key: 'automation.edit', name: 'Edit Automations', description: 'Edit existing workflows' },
    { key: 'automation.delete', name: 'Delete Automations', description: 'Delete workflows' },
    { key: 'automation.execute', name: 'Execute Automations', description: 'Manually trigger workflows' },
    { key: 'automation.manage_connections', name: 'Manage Connections', description: 'Manage external service connections' },
  ],
  
  // Settings schema for module configuration
  settingsSchema: {
    type: 'object',
    properties: {
      maxConcurrentExecutions: {
        type: 'number',
        title: 'Max Concurrent Executions',
        description: 'Maximum number of workflow executions that can run simultaneously',
        default: 10,
        minimum: 1,
        maximum: 100,
      },
      defaultTimeout: {
        type: 'number',
        title: 'Default Timeout (seconds)',
        description: 'Default timeout for workflow execution',
        default: 300,
        minimum: 30,
        maximum: 3600,
      },
      retryFailedSteps: {
        type: 'boolean',
        title: 'Auto-retry Failed Steps',
        description: 'Automatically retry failed steps based on error handling config',
        default: true,
      },
      logRetentionDays: {
        type: 'number',
        title: 'Log Retention (days)',
        description: 'Number of days to retain execution logs',
        default: 30,
        minimum: 7,
        maximum: 365,
      },
      enableWebhooks: {
        type: 'boolean',
        title: 'Enable Webhooks',
        description: 'Allow workflows to be triggered via webhooks',
        default: true,
      },
      enableScheduledTriggers: {
        type: 'boolean',
        title: 'Enable Scheduled Triggers',
        description: 'Allow time-based scheduled workflow triggers',
        default: true,
      },
    },
  },
  
  // Events this module emits
  events: [
    { type: 'automation.workflow_created', description: 'Emitted when a new workflow is created' },
    { type: 'automation.workflow_activated', description: 'Emitted when a workflow is activated' },
    { type: 'automation.workflow_paused', description: 'Emitted when a workflow is paused' },
    { type: 'automation.workflow_deleted', description: 'Emitted when a workflow is deleted' },
    { type: 'automation.execution_started', description: 'Emitted when a workflow execution starts' },
    { type: 'automation.execution_completed', description: 'Emitted when a workflow execution completes successfully' },
    { type: 'automation.execution_failed', description: 'Emitted when a workflow execution fails' },
    { type: 'automation.step_completed', description: 'Emitted when a workflow step completes' },
    { type: 'automation.step_failed', description: 'Emitted when a workflow step fails' },
  ],
  
  // Events this module can listen to (triggers)
  triggers: [
    // CRM Events
    { type: 'crm.contact_created', description: 'When a new contact is created' },
    { type: 'crm.contact_updated', description: 'When a contact is updated' },
    { type: 'crm.deal_created', description: 'When a new deal is created' },
    { type: 'crm.deal_stage_changed', description: 'When a deal moves to a new stage' },
    { type: 'crm.deal_won', description: 'When a deal is marked as won' },
    { type: 'crm.deal_lost', description: 'When a deal is marked as lost' },
    { type: 'crm.task_completed', description: 'When a task is completed' },
    
    // Form Events
    { type: 'form.submitted', description: 'When a form is submitted' },
    
    // Booking Events
    { type: 'booking.created', description: 'When a new booking is created' },
    { type: 'booking.confirmed', description: 'When a booking is confirmed' },
    { type: 'booking.cancelled', description: 'When a booking is cancelled' },
    { type: 'booking.reminder', description: 'Before a scheduled booking' },
    
    // E-Commerce Events
    { type: 'ecommerce.order_created', description: 'When a new order is placed' },
    { type: 'ecommerce.order_paid', description: 'When an order is paid' },
    { type: 'ecommerce.order_shipped', description: 'When an order is shipped' },
    { type: 'ecommerce.cart_abandoned', description: 'When a cart is abandoned' },
    
    // System Events
    { type: 'user.signed_up', description: 'When a new user signs up' },
    { type: 'user.logged_in', description: 'When a user logs in' },
    
    // Manual & Webhook
    { type: 'manual', description: 'Manually triggered workflows' },
    { type: 'webhook', description: 'Triggered via webhook endpoint' },
    { type: 'scheduled', description: 'Triggered on a schedule (cron)' },
  ],
  
  // Action types this module provides
  actions: [
    // CRM Actions
    { type: 'crm.create_contact', description: 'Create a new CRM contact' },
    { type: 'crm.update_contact', description: 'Update an existing contact' },
    { type: 'crm.add_tag', description: 'Add a tag to a contact' },
    { type: 'crm.remove_tag', description: 'Remove a tag from a contact' },
    { type: 'crm.find_contact', description: 'Find a contact by field' },
    { type: 'crm.create_deal', description: 'Create a new deal' },
    { type: 'crm.move_deal_stage', description: 'Move a deal to a new stage' },
    { type: 'crm.create_task', description: 'Create a new task' },
    { type: 'crm.log_activity', description: 'Log an activity for a contact' },
    
    // Email Actions
    { type: 'email.send', description: 'Send a custom email' },
    { type: 'email.send_template', description: 'Send an email using a template' },
    
    // Notification Actions
    { type: 'notification.in_app', description: 'Send an in-app notification' },
    { type: 'notification.send_slack', description: 'Send a Slack message' },
    { type: 'notification.send_discord', description: 'Send a Discord message' },
    { type: 'notification.send_sms', description: 'Send an SMS message' },
    
    // Webhook Actions
    { type: 'webhook.send', description: 'Send an HTTP request' },
    
    // Data Actions
    { type: 'data.lookup', description: 'Look up a record' },
    { type: 'data.create', description: 'Create a record' },
    { type: 'data.update', description: 'Update a record' },
    { type: 'data.delete', description: 'Delete a record' },
    
    // Flow Control
    { type: 'flow.delay', description: 'Wait for a specified duration' },
    { type: 'flow.condition', description: 'Branch based on conditions' },
    { type: 'flow.stop', description: 'Stop workflow execution' },
    
    // Transform Actions
    { type: 'transform.map', description: 'Map data fields' },
    { type: 'transform.filter', description: 'Filter array data' },
    { type: 'transform.aggregate', description: 'Aggregate numeric data' },
    { type: 'transform.format_date', description: 'Format a date value' },
    { type: 'transform.template', description: 'Render a text template' },
    { type: 'transform.math', description: 'Perform math operations' },
  ],
  
  // API routes (if module exposes API endpoints)
  apiRoutes: [
    { path: '/api/webhooks/automation/:path', method: 'POST', description: 'Webhook endpoint for triggering workflows' },
  ],
  
  // Widget components for dashboard
  widgets: [
    {
      id: 'automation-overview',
      name: 'Automation Overview',
      component: 'AutomationOverviewWidget',
      defaultSize: { width: 2, height: 1 },
    },
    {
      id: 'recent-executions',
      name: 'Recent Executions',
      component: 'RecentExecutionsWidget',
      defaultSize: { width: 2, height: 2 },
    },
  ],
}

// ============================================================================
// EXPORTS
// ============================================================================

export default automationManifest
