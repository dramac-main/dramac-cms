/**
 * CRM Module Manifest
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Module configuration and metadata for the CRM module
 */

import type { ModuleManifest } from '../_types'

export const CRMModuleManifest: ModuleManifest = {
  // Module Identity
  id: 'crm',
  shortId: 'crmmod01',
  name: 'CRM',
  displayName: 'Customer Relationship Management',
  description: 'Complete CRM solution with contact management, company tracking, deal pipelines, activity logging, and comprehensive reporting.',
  version: '1.0.0',
  
  // Module Type & Category
  type: 'enterprise',
  category: 'sales',
  
  // Author & Licensing
  author: {
    name: 'DRAMAC CMS', // Internal module author — not shown to end users
    email: 'support@dramac.dev',
    url: 'https://dramac.dev'
  },
  license: 'proprietary',
  
  // Technical Requirements
  minPlatformVersion: '1.0.0',
  dependencies: [],
  peerDependencies: [],
  
  // Database Schema
  schema: {
    prefix: 'mod_crmmod01',
    tables: [
      'contacts',
      'companies',
      'deals',
      'pipelines',
      'pipeline_stages',
      'activities',
      'custom_fields',
      'custom_field_values',
      'tags',
      'entity_tags',
      'email_messages',
      'email_configs',
      'email_templates'
    ],
    migrations: [
      '001_crm_core_tables.sql'
    ]
  },
  
  // Features
  features: [
    {
      id: 'contacts',
      name: 'Contact Management',
      description: 'Manage contacts with full CRUD, custom fields, and tags',
      enabled: true
    },
    {
      id: 'companies',
      name: 'Company Management',
      description: 'Track companies with revenue, employee count, and associated contacts',
      enabled: true
    },
    {
      id: 'deals',
      name: 'Deal Pipeline',
      description: 'Visual kanban pipeline with drag-and-drop stage management',
      enabled: true
    },
    {
      id: 'activities',
      name: 'Activity Tracking',
      description: 'Log calls, emails, meetings, tasks, and notes',
      enabled: true
    },
    {
      id: 'reports',
      name: 'Reports & Analytics',
      description: 'Pipeline reports, win rates, and activity metrics',
      enabled: true
    },
    {
      id: 'email',
      name: 'Email Integration',
      description: 'Send and track emails directly from CRM',
      enabled: true,
      requiresSetup: true
    }
  ],
  
  // Permissions
  permissions: [
    {
      id: 'crm.view',
      name: 'View CRM',
      description: 'View CRM data including contacts, companies, and deals'
    },
    {
      id: 'crm.create',
      name: 'Create CRM Records',
      description: 'Create new contacts, companies, and deals'
    },
    {
      id: 'crm.edit',
      name: 'Edit CRM Records',
      description: 'Edit existing contacts, companies, and deals'
    },
    {
      id: 'crm.delete',
      name: 'Delete CRM Records',
      description: 'Delete contacts, companies, and deals'
    },
    {
      id: 'crm.admin',
      name: 'CRM Admin',
      description: 'Full administrative access to CRM settings and configuration'
    }
  ],
  
  // Settings Schema
  settings: {
    type: 'object',
    properties: {
      defaultPipelineId: {
        type: 'string',
        title: 'Default Pipeline',
        description: 'The default pipeline for new deals'
      },
      defaultCurrency: {
        type: 'string',
        title: 'Default Currency',
        description: 'Default currency for deal values',
        default: 'ZMW',
        enum: ['ZMW', 'USD', 'EUR', 'GBP', 'ZAR', 'CAD', 'AUD']
      },
      enableEmailTracking: {
        type: 'boolean',
        title: 'Email Tracking',
        description: 'Track email opens and clicks',
        default: true
      },
      enableActivityReminders: {
        type: 'boolean',
        title: 'Activity Reminders',
        description: 'Send reminders for upcoming activities',
        default: true
      },
      dealRotting: {
        type: 'object',
        title: 'Deal Rotting',
        description: 'Mark deals as rotting after inactivity',
        properties: {
          enabled: {
            type: 'boolean',
            default: true
          },
          daysThreshold: {
            type: 'number',
            default: 30
          }
        }
      }
    }
  },
  
  // Navigation
  navigation: {
    mainMenu: {
      label: 'CRM',
      icon: 'users',
      href: '/dashboard/crm',
      order: 5
    },
    subMenu: [
      { label: 'Dashboard', href: '/dashboard/crm', icon: 'layout-dashboard' },
      { label: 'Contacts', href: '/dashboard/crm/contacts', icon: 'user' },
      { label: 'Companies', href: '/dashboard/crm/companies', icon: 'building-2' },
      { label: 'Deals', href: '/dashboard/crm/deals', icon: 'coins' },
      { label: 'Activities', href: '/dashboard/crm/activities', icon: 'activity' },
      { label: 'Reports', href: '/dashboard/crm/reports', icon: 'bar-chart-3' },
      { label: 'Settings', href: '/dashboard/crm/settings', icon: 'settings' }
    ]
  },
  
  // API Routes
  api: {
    prefix: '/api/modules/crm',
    routes: [
      { method: 'GET', path: '/contacts', handler: 'getContacts' },
      { method: 'POST', path: '/contacts', handler: 'createContact' },
      { method: 'GET', path: '/contacts/:id', handler: 'getContact' },
      { method: 'PATCH', path: '/contacts/:id', handler: 'updateContact' },
      { method: 'DELETE', path: '/contacts/:id', handler: 'deleteContact' },
      { method: 'GET', path: '/companies', handler: 'getCompanies' },
      { method: 'POST', path: '/companies', handler: 'createCompany' },
      { method: 'GET', path: '/companies/:id', handler: 'getCompany' },
      { method: 'PATCH', path: '/companies/:id', handler: 'updateCompany' },
      { method: 'DELETE', path: '/companies/:id', handler: 'deleteCompany' },
      { method: 'GET', path: '/deals', handler: 'getDeals' },
      { method: 'POST', path: '/deals', handler: 'createDeal' },
      { method: 'GET', path: '/deals/:id', handler: 'getDeal' },
      { method: 'PATCH', path: '/deals/:id', handler: 'updateDeal' },
      { method: 'DELETE', path: '/deals/:id', handler: 'deleteDeal' },
      { method: 'POST', path: '/deals/:id/move', handler: 'moveDealToStage' },
      { method: 'GET', path: '/pipelines', handler: 'getPipelines' },
      { method: 'POST', path: '/pipelines', handler: 'createPipeline' },
      { method: 'GET', path: '/pipelines/:id/stages', handler: 'getStages' },
      { method: 'GET', path: '/activities', handler: 'getActivities' },
      { method: 'POST', path: '/activities', handler: 'createActivity' },
      { method: 'GET', path: '/search', handler: 'globalSearch' },
      { method: 'GET', path: '/reports/pipeline', handler: 'getPipelineReport' }
    ]
  },
  
  // Webhooks
  webhooks: [
    { event: 'contact.created', description: 'Triggered when a contact is created' },
    { event: 'contact.updated', description: 'Triggered when a contact is updated' },
    { event: 'contact.deleted', description: 'Triggered when a contact is deleted' },
    { event: 'company.created', description: 'Triggered when a company is created' },
    { event: 'company.updated', description: 'Triggered when a company is updated' },
    { event: 'deal.created', description: 'Triggered when a deal is created' },
    { event: 'deal.updated', description: 'Triggered when a deal is updated' },
    { event: 'deal.won', description: 'Triggered when a deal is marked as won' },
    { event: 'deal.lost', description: 'Triggered when a deal is marked as lost' },
    { event: 'deal.stage_changed', description: 'Triggered when a deal moves to a new stage' },
    { event: 'activity.created', description: 'Triggered when an activity is logged' }
  ],
  
  // Lifecycle Hooks
  lifecycle: {
    onInstall: 'initializeCRMForSite',
    onUninstall: 'cleanupCRMForSite',
    onUpgrade: 'migrateCRMData',
    onEnable: 'enableCRMModule',
    onDisable: 'disableCRMModule'
  },
  
  // UI Components
  components: {
    dashboard: 'CRMDashboard',
    settings: 'CRMSettings'
  },
  
  // Keywords for search
  keywords: [
    'crm',
    'contacts',
    'companies',
    'deals',
    'pipeline',
    'sales',
    'leads',
    'customers',
    'activities',
    'reports'
  ],
  
  // Screenshots for marketplace
  screenshots: [
    {
      url: '/modules/crm/screenshots/dashboard.png',
      title: 'CRM Dashboard',
      description: 'Overview of your CRM with quick stats and recent activity'
    },
    {
      url: '/modules/crm/screenshots/pipeline.png',
      title: 'Deal Pipeline',
      description: 'Visual kanban board for managing your sales pipeline'
    },
    {
      url: '/modules/crm/screenshots/contacts.png',
      title: 'Contact Management',
      description: 'Comprehensive contact list with filtering and search'
    }
  ],
  
  // Pricing (for marketplace)
  pricing: {
    type: 'subscription',
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        limits: {
          contacts: 100,
          companies: 50,
          deals: 50,
          pipelines: 1
        }
      },
      {
        id: 'pro',
        name: 'Professional',
        price: 29,
        limits: {
          contacts: 5000,
          companies: 1000,
          deals: 1000,
          pipelines: 5
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99,
        limits: {
          contacts: -1, // Unlimited
          companies: -1,
          deals: -1,
          pipelines: -1
        }
      }
    ]
  }
}

export default CRMModuleManifest
