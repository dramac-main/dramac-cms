/**
 * Module Types V2 - Enterprise Module Type System
 * 
 * Phase EM-10: Comprehensive module classification and capability system
 * 
 * This module defines:
 * - Module types (widget, app, integration, system, custom)
 * - Module capabilities
 * - Database resources and schema definitions
 * - Runtime requirements
 * 
 * Related phases:
 * - EM-11: Database provisioning (uses these types)
 * - EM-12: API gateway (uses these types)
 */

// =============================================================
// MODULE TYPES
// =============================================================

export type ModuleType = 'widget' | 'app' | 'integration' | 'system' | 'custom'

export type DatabaseIsolation = 'none' | 'tables' | 'schema'

// =============================================================
// MODULE CAPABILITIES
// =============================================================

export interface ModuleCapabilities {
  // Data capabilities
  has_database: boolean      // Creates its own tables
  has_api: boolean           // Exposes REST/GraphQL endpoints
  has_webhooks: boolean      // Receives external webhooks
  has_oauth: boolean         // Requires OAuth for integrations
  
  // UI capabilities
  has_multi_page: boolean    // Multiple views/pages
  has_roles: boolean         // Role-based access control
  has_workflows: boolean     // Automation/workflow engine
  has_reporting: boolean     // Analytics/reports dashboard
  
  // Deployment capabilities
  embeddable: boolean        // Can embed in websites
  standalone: boolean        // Can run as standalone app
  requires_setup: boolean    // Needs configuration wizard
}

// =============================================================
// DATABASE SCHEMA DEFINITIONS
// =============================================================

export type ColumnType = 
  | 'uuid' 
  | 'text' 
  | 'integer' 
  | 'decimal' 
  | 'boolean' 
  | 'jsonb' 
  | 'timestamp' 
  | 'date' 
  | 'time'
  | 'text[]'
  | 'integer[]'

export interface ColumnDefinition {
  type: ColumnType
  nullable: boolean
  default?: string
  references?: { 
    table: string
    column: string 
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  }
  unique?: boolean
  description?: string
}

export interface RLSPolicy {
  name: string
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  using: string
  with_check?: string
  roles?: string[]  // Default: all roles
}

export interface ModuleTable {
  name: string
  description: string
  schema: Record<string, ColumnDefinition>
  rls_policies: RLSPolicy[]
  indexes: string[]
  triggers?: TriggerDefinition[]
  // Set after provisioning
  actual_name?: string
}

export interface TriggerDefinition {
  name: string
  timing: 'BEFORE' | 'AFTER'
  events: ('INSERT' | 'UPDATE' | 'DELETE')[]
  function: string
}

// =============================================================
// SERVERLESS & JOBS
// =============================================================

export interface EdgeFunction {
  name: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  auth_required: boolean
  handler?: string  // Handler function name or reference
  handlerCode?: string  // Inline handler code (for simple handlers)
}

export interface ScheduledJob {
  name: string
  schedule: string  // cron expression (e.g., "0 * * * *" for hourly)
  handler: string
  description: string
  enabled?: boolean
  timeout_seconds?: number
}

export interface WebhookEndpoint {
  name: string
  path: string
  description: string
  verification_method: 'signature' | 'token' | 'none'
  secret_env_var?: string  // Environment variable name for secret
}

// =============================================================
// MODULE RESOURCES
// =============================================================

export interface ModuleResources {
  // Database resources
  tables: ModuleTable[]
  
  // Storage
  storage_buckets: StorageBucket[]
  
  // Serverless
  edge_functions: EdgeFunction[]
  
  // Background jobs
  scheduled_jobs: ScheduledJob[]
  
  // Webhooks
  webhooks: WebhookEndpoint[]
}

export interface StorageBucket {
  name: string
  public: boolean
  allowed_mime_types?: string[]
  max_file_size_mb?: number
  description?: string
}

// =============================================================
// MODULE REQUIREMENTS
// =============================================================

export interface ModuleRequirements {
  min_platform_version: string
  required_permissions: string[]
  required_integrations: string[]  // Other modules that must be installed
  required_modules: string[]       // Module dependencies
}

// =============================================================
// MODULE TYPE CONFIGURATIONS
// =============================================================

export interface ModuleTypeConfig {
  label: string
  description: string
  icon: string
  defaultCapabilities: Partial<ModuleCapabilities>
  allowedCapabilities: (keyof ModuleCapabilities)[]
  defaultIsolation: DatabaseIsolation
  developmentTime: string
  complexity: 'low' | 'medium' | 'high' | 'variable'
}

export const MODULE_TYPE_CONFIGS: Record<ModuleType, ModuleTypeConfig> = {
  widget: {
    label: 'Widget',
    description: 'Simple embeddable component',
    icon: '🧩',
    complexity: 'low',
    developmentTime: '1-4 hours',
    defaultIsolation: 'none',
    defaultCapabilities: {
      embeddable: true,
      has_database: false,
      has_api: false,
      standalone: false,
      has_multi_page: false,
      has_roles: false,
      has_workflows: false,
      has_reporting: false,
      has_webhooks: false,
      has_oauth: false,
      requires_setup: false
    },
    allowedCapabilities: ['embeddable', 'has_api', 'requires_setup']
  },
  app: {
    label: 'App',
    description: 'Multi-page application',
    icon: '📱',
    complexity: 'medium',
    developmentTime: '1-2 weeks',
    defaultIsolation: 'tables',
    defaultCapabilities: {
      embeddable: true,
      standalone: true,
      has_database: true,
      has_api: true,
      has_multi_page: true,
      has_roles: false,
      has_workflows: false,
      has_reporting: false,
      has_webhooks: false,
      has_oauth: false,
      requires_setup: true
    },
    allowedCapabilities: [
      'embeddable', 'standalone', 'has_database', 'has_api', 
      'has_multi_page', 'has_roles', 'requires_setup', 'has_webhooks'
    ]
  },
  integration: {
    label: 'Integration',
    description: 'Third-party service connector',
    icon: '🔗',
    complexity: 'medium',
    developmentTime: '2-5 days',
    defaultIsolation: 'none',
    defaultCapabilities: {
      has_api: true,
      has_oauth: true,
      has_webhooks: true,
      requires_setup: true,
      embeddable: false,
      standalone: false,
      has_database: false,
      has_multi_page: false,
      has_roles: false,
      has_workflows: false,
      has_reporting: false
    },
    allowedCapabilities: [
      'has_api', 'has_oauth', 'has_webhooks', 'has_database', 'requires_setup',
      'embeddable', 'standalone'
    ]
  },
  system: {
    label: 'Full System',
    description: 'Complete business application',
    icon: '🏢',
    complexity: 'high',
    developmentTime: '2-8 weeks',
    defaultIsolation: 'schema',
    defaultCapabilities: {
      embeddable: true,
      standalone: true,
      has_database: true,
      has_api: true,
      has_multi_page: true,
      has_roles: true,
      has_workflows: true,
      has_reporting: true,
      requires_setup: true,
      has_webhooks: false,
      has_oauth: false
    },
    allowedCapabilities: [
      'embeddable', 'standalone', 'has_database', 'has_api', 
      'has_multi_page', 'has_roles', 'has_workflows', 'has_reporting',
      'has_webhooks', 'has_oauth', 'requires_setup'
    ]
  },
  custom: {
    label: 'Custom Solution',
    description: 'Bespoke client-specific module',
    icon: '⚙️',
    complexity: 'variable',
    developmentTime: 'Variable',
    defaultIsolation: 'schema',
    defaultCapabilities: {
      embeddable: true,
      standalone: true,
      has_database: true,
      has_api: true,
      has_multi_page: true,
      has_roles: false,
      has_workflows: false,
      has_reporting: false,
      has_webhooks: false,
      has_oauth: false,
      requires_setup: true
    },
    allowedCapabilities: [
      'embeddable', 'standalone', 'has_database', 'has_api', 
      'has_multi_page', 'has_roles', 'has_workflows', 'has_reporting',
      'has_webhooks', 'has_oauth', 'requires_setup'
    ]
  }
}

// =============================================================
// CAPABILITY METADATA
// =============================================================

export interface CapabilityInfo {
  key: keyof ModuleCapabilities
  title: string
  description: string
  icon: string
  category: 'data' | 'ui' | 'deployment'
}

export const CAPABILITY_INFO: Record<keyof ModuleCapabilities, CapabilityInfo> = {
  has_database: { 
    key: 'has_database',
    title: 'Database', 
    description: 'Creates its own database tables',
    icon: '💾',
    category: 'data'
  },
  has_api: { 
    key: 'has_api',
    title: 'API', 
    description: 'Exposes REST/GraphQL endpoints',
    icon: '🔌',
    category: 'data'
  },
  has_webhooks: { 
    key: 'has_webhooks',
    title: 'Webhooks', 
    description: 'Receives external webhook calls',
    icon: '📨',
    category: 'data'
  },
  has_oauth: { 
    key: 'has_oauth',
    title: 'OAuth', 
    description: 'Third-party authentication flows',
    icon: '🔐',
    category: 'data'
  },
  has_multi_page: { 
    key: 'has_multi_page',
    title: 'Multi-Page', 
    description: 'Multiple views/screens',
    icon: '📑',
    category: 'ui'
  },
  has_roles: { 
    key: 'has_roles',
    title: 'Roles', 
    description: 'Role-based access control',
    icon: '👥',
    category: 'ui'
  },
  has_workflows: { 
    key: 'has_workflows',
    title: 'Workflows', 
    description: 'Automation engine',
    icon: '⚡',
    category: 'ui'
  },
  has_reporting: { 
    key: 'has_reporting',
    title: 'Reporting', 
    description: 'Analytics dashboard',
    icon: '📊',
    category: 'ui'
  },
  embeddable: { 
    key: 'embeddable',
    title: 'Embeddable', 
    description: 'Can embed in websites',
    icon: '🧩',
    category: 'deployment'
  },
  standalone: { 
    key: 'standalone',
    title: 'Standalone', 
    description: 'Can run as own app',
    icon: '🖥️',
    category: 'deployment'
  },
  requires_setup: { 
    key: 'requires_setup',
    title: 'Setup Wizard', 
    description: 'Needs configuration wizard',
    icon: '🔧',
    category: 'deployment'
  }
}

// =============================================================
// HELPER FUNCTIONS
// =============================================================

/**
 * Get default capabilities for a module type
 */
export function getDefaultCapabilities(moduleType: ModuleType = 'widget'): ModuleCapabilities {
  const defaults: ModuleCapabilities = {
    has_database: false,
    has_api: false,
    has_webhooks: false,
    has_oauth: false,
    has_multi_page: false,
    has_roles: false,
    has_workflows: false,
    has_reporting: false,
    embeddable: true,
    standalone: false,
    requires_setup: false
  }
  
  const typeConfig = MODULE_TYPE_CONFIGS[moduleType]
  return { ...defaults, ...typeConfig.defaultCapabilities }
}

/**
 * Get default resources structure
 */
export function getDefaultResources(): ModuleResources {
  return {
    tables: [],
    storage_buckets: [],
    edge_functions: [],
    scheduled_jobs: [],
    webhooks: []
  }
}

/**
 * Get default requirements structure
 */
export function getDefaultRequirements(): ModuleRequirements {
  return {
    min_platform_version: '1.0.0',
    required_permissions: [],
    required_integrations: [],
    required_modules: []
  }
}

/**
 * Get database isolation level based on module type
 */
export function getDefaultIsolation(moduleType: ModuleType): DatabaseIsolation {
  return MODULE_TYPE_CONFIGS[moduleType].defaultIsolation
}

/**
 * Validate capabilities against module type
 */
export function validateCapabilities(
  moduleType: ModuleType, 
  capabilities: Partial<ModuleCapabilities>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const allowedCapabilities = MODULE_TYPE_CONFIGS[moduleType].allowedCapabilities
  
  for (const [key, value] of Object.entries(capabilities)) {
    if (value === true && !allowedCapabilities.includes(key as keyof ModuleCapabilities)) {
      errors.push(`Capability '${key}' is not allowed for module type '${moduleType}'`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get database prefix for a module based on its short_id and isolation level
 */
export function getModuleDbPrefix(
  shortId: string, 
  isolation: DatabaseIsolation
): string | null {
  switch (isolation) {
    case 'tables':
      return `mod_${shortId}_`
    case 'schema':
      return `mod_${shortId}.`
    default:
      return null
  }
}

/**
 * Get full table name for a module table
 */
export function getModuleTableName(
  shortId: string,
  tableName: string,
  isolation: DatabaseIsolation
): string {
  const prefix = getModuleDbPrefix(shortId, isolation)
  if (!prefix) {
    return tableName
  }
  return `${prefix}${tableName}`
}

// =============================================================
// TYPE GUARDS
// =============================================================

export function isModuleType(value: unknown): value is ModuleType {
  return typeof value === 'string' && 
    ['widget', 'app', 'integration', 'system', 'custom'].includes(value)
}

export function isDatabaseIsolation(value: unknown): value is DatabaseIsolation {
  return typeof value === 'string' && 
    ['none', 'tables', 'schema'].includes(value)
}

export function isColumnType(value: unknown): value is ColumnType {
  return typeof value === 'string' && [
    'uuid', 'text', 'integer', 'decimal', 'boolean', 
    'jsonb', 'timestamp', 'date', 'time', 'text[]', 'integer[]'
  ].includes(value)
}
