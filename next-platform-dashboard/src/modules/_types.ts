/**
 * Module System Types
 * 
 * Core type definitions for the DRAMAC module system
 */

// Basic Module interface
export interface Module {
  id: string
  name: string
  description: string
  version: string
}

// Module Feature
export interface ModuleFeature {
  id: string
  name: string
  description: string
  enabled: boolean
  requiresSetup?: boolean
}

// Module Permission
export interface ModulePermission {
  id: string
  name: string
  description: string
}

// Module Author
export interface ModuleAuthor {
  name: string
  email?: string
  url?: string
}

// Module Schema Definition
export interface ModuleSchema {
  prefix: string
  tables: string[]
  migrations: string[]
}

// Module Navigation
export interface ModuleNavigation {
  mainMenu: {
    label: string
    icon: string
    href: string
    order: number
  }
  subMenu?: Array<{
    label: string
    href: string
    icon?: string
  }>
}

// Module API Route
export interface ModuleAPIRoute {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  path: string
  handler: string
}

// Module Webhook
export interface ModuleWebhook {
  event: string
  description: string
}

// Module Pricing Plan
export interface ModulePricingPlan {
  id: string
  name: string
  price: number
  limits: Record<string, number>
}

// Module Screenshot
export interface ModuleScreenshot {
  url: string
  title: string
  description: string
}

// Full Module Manifest
export interface ModuleManifest {
  // Identity
  id: string
  shortId: string
  name: string
  displayName: string
  description: string
  version: string
  
  // Classification
  type: 'core' | 'enterprise' | 'community' | 'custom'
  category: string
  
  // Author & License
  author: ModuleAuthor
  license: string
  
  // Technical
  minPlatformVersion: string
  dependencies: string[]
  peerDependencies: string[]
  
  // Database
  schema: ModuleSchema
  
  // Features
  features: ModuleFeature[]
  
  // Permissions
  permissions: ModulePermission[]
  
  // Settings Schema (JSON Schema format)
  settings?: Record<string, any>
  
  // Navigation
  navigation: ModuleNavigation
  
  // API
  api?: {
    prefix: string
    routes: ModuleAPIRoute[]
  }
  
  // Webhooks
  webhooks?: ModuleWebhook[]
  
  // Lifecycle
  lifecycle?: {
    onInstall?: string
    onUninstall?: string
    onUpgrade?: string
    onEnable?: string
    onDisable?: string
  }
  
  // Components
  components?: {
    dashboard?: string
    settings?: string
    [key: string]: string | undefined
  }
  
  // Search
  keywords?: string[]
  
  // Marketplace
  screenshots?: ModuleScreenshot[]
  
  // Pricing
  pricing?: {
    type: 'free' | 'subscription' | 'one-time'
    plans?: ModulePricingPlan[]
  }
}
