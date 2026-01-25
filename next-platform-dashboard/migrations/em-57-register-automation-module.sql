-- =============================================================
-- Phase EM-57: Register Automation Module in modules_v2
-- =============================================================
-- This inserts the automation module into the database so it can be
-- subscribed to by agencies and installed on sites.
-- =============================================================

-- Insert automation module into modules_v2
INSERT INTO public.modules_v2 (
  slug,
  name,
  description,
  long_description,
  icon,
  category,
  tags,
  install_level,
  pricing_type,
  wholesale_price_monthly,
  wholesale_price_yearly,
  suggested_retail_monthly,
  suggested_retail_yearly,
  status,
  features,
  provided_hooks,
  author_name,
  author_verified,
  is_featured,
  is_premium,
  settings_schema,
  default_settings,
  manifest
) VALUES (
  'automation',
  'Automation Engine',
  'Visual workflow builder to automate repetitive tasks and business processes',
  'Powerful automation engine with visual workflow builder, 20+ pre-built templates, and integrations with 14+ external services. Perfect for automating lead nurturing, customer onboarding, notifications, and data synchronization.

## Features
- Visual drag-and-drop workflow builder
- 20+ pre-built workflow templates
- Event-based, scheduled, and webhook triggers
- Conditional branching and loops
- 14+ external service integrations
- AI-powered actions (text generation, summarization, sentiment)
- Real-time analytics and execution monitoring
- Error handling with automatic retries
- Template gallery with one-click deployment

## Trigger Types
- **Events**: CRM events (contact created, deal updated, etc.)
- **Webhooks**: External API triggers
- **Scheduled**: Cron-based recurring automations
- **Manual**: On-demand execution

## Integrations
- **Communication**: Slack, Discord, Twilio, SendGrid, Resend
- **Business Tools**: HubSpot, Salesforce, Google Sheets
- **Analytics**: Google Analytics, Segment
- **AI**: OpenAI, Claude

## Perfect For
- Lead Nurturing Sequences
- Customer Onboarding Flows
- Internal Notifications
- Data Synchronization
- Scheduled Reports
- Abandoned Cart Recovery
- CRM Automation',
  '⚡',
  'business',
  ARRAY['automation', 'workflows', 'triggers', 'integrations', 'ai', 'crm', 'notifications', 'scheduling'],
  'site', -- Site-level installation
  'monthly',
  3999, -- $39.99/month wholesale (what agencies pay)
  39990, -- $399.90/year wholesale
  5999, -- $59.99/month suggested retail
  59990, -- $599.90/year suggested retail
  'active',
  ARRAY[
    'Visual workflow builder',
    'Drag-and-drop step editor',
    '20+ pre-built templates',
    'Event-based triggers',
    'Webhook triggers',
    'Scheduled/cron triggers',
    'Conditional branching',
    'Loop actions',
    'Delay and wait steps',
    '14+ external integrations',
    'AI-powered actions',
    'Real-time analytics',
    'Execution monitoring',
    'Error handling & retries',
    'Template gallery'
  ],
  ARRAY['site:dashboard:tab', 'dashboard:site:tab'],
  'DRAMAC',
  true,
  true, -- Featured
  true, -- Premium
  '{
    "type": "object",
    "properties": {
      "maxConcurrentWorkflows": {
        "type": "number",
        "title": "Max Concurrent Workflows",
        "description": "Maximum number of workflows that can run simultaneously",
        "default": 10
      },
      "defaultRetryAttempts": {
        "type": "number",
        "title": "Default Retry Attempts",
        "description": "Default number of retry attempts for failed actions",
        "default": 3
      },
      "retryDelaySeconds": {
        "type": "number",
        "title": "Retry Delay (seconds)",
        "description": "Delay between retry attempts",
        "default": 60
      },
      "enableAIActions": {
        "type": "boolean",
        "title": "Enable AI Actions",
        "description": "Allow AI-powered automation actions",
        "default": true
      },
      "executionTimeoutMinutes": {
        "type": "number",
        "title": "Execution Timeout (minutes)",
        "description": "Maximum execution time for a single workflow",
        "default": 30
      },
      "webhookSecretKey": {
        "type": "string",
        "title": "Webhook Secret Key",
        "description": "Secret key for validating incoming webhooks",
        "default": ""
      },
      "notifyOnFailure": {
        "type": "boolean",
        "title": "Notify on Failure",
        "description": "Send email notification when a workflow fails",
        "default": true
      }
    }
  }',
  '{
    "maxConcurrentWorkflows": 10,
    "defaultRetryAttempts": 3,
    "retryDelaySeconds": 60,
    "enableAIActions": true,
    "executionTimeoutMinutes": 30,
    "webhookSecretKey": "",
    "notifyOnFailure": true
  }',
  '{
    "id": "automation",
    "name": "Automation Engine",
    "version": "1.0.0",
    "description": "Visual workflow builder to automate repetitive tasks and business processes",
    "author": "DRAMAC",
    "category": "business",
    "icon": "⚡",
    "routes": [
      {
        "path": "/dashboard/[siteId]/automation",
        "name": "Dashboard"
      },
      {
        "path": "/dashboard/[siteId]/automation/workflows",
        "name": "Workflows"
      },
      {
        "path": "/dashboard/[siteId]/automation/templates",
        "name": "Templates"
      },
      {
        "path": "/dashboard/[siteId]/automation/analytics",
        "name": "Analytics"
      },
      {
        "path": "/dashboard/[siteId]/automation/connections",
        "name": "Connections"
      }
    ],
    "hooks": ["site:dashboard:tab", "dashboard:site:tab"],
    "dependencies": [],
    "settings_schema": {
      "maxConcurrentWorkflows": { "type": "number", "default": 10 },
      "defaultRetryAttempts": { "type": "number", "default": 3 },
      "enableAIActions": { "type": "boolean", "default": true }
    }
  }'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  install_level = EXCLUDED.install_level,
  pricing_type = EXCLUDED.pricing_type,
  wholesale_price_monthly = EXCLUDED.wholesale_price_monthly,
  wholesale_price_yearly = EXCLUDED.wholesale_price_yearly,
  suggested_retail_monthly = EXCLUDED.suggested_retail_monthly,
  suggested_retail_yearly = EXCLUDED.suggested_retail_yearly,
  status = EXCLUDED.status,
  features = EXCLUDED.features,
  provided_hooks = EXCLUDED.provided_hooks,
  is_featured = EXCLUDED.is_featured,
  is_premium = EXCLUDED.is_premium,
  settings_schema = EXCLUDED.settings_schema,
  default_settings = EXCLUDED.default_settings,
  manifest = EXCLUDED.manifest,
  updated_at = NOW();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Automation module registered in modules_v2 marketplace';
  RAISE NOTICE 'Agencies can now subscribe at /marketplace';
  RAISE NOTICE 'After subscription, agencies can install on sites at Site > Modules tab';
  RAISE NOTICE 'Module dashboard available at /dashboard/[siteId]/automation';
END $$;
