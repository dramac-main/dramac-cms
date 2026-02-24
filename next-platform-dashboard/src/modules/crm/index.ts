/**
 * CRM Module - Main Index
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Production-ready CRM module with contacts, companies, deals, 
 * pipeline management, activities, and reporting.
 */

// Types
export * from './types/crm-types'

// Server Actions
export * from './actions/crm-actions'
export * from './actions/segment-actions'
export * from './actions/lead-scoring-actions'
export * from './actions/email-actions'
export * from './actions/bulk-actions'

// Context
export { CRMProvider, useCRM, useContact, useCompany, useDeal, usePipelineDeals, useContactActivities, useDealActivities } from './context/crm-context'

// Components
export * from './components'

// Module Manifest
export { CRMModuleManifest } from './manifest'
