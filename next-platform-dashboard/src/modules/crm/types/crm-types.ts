/**
 * CRM Module TypeScript Types
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * These types define the data structures for all CRM entities
 */

// ============================================================================
// TYPE ALIASES (for component use)
// ============================================================================

export type ContactStatus = 'active' | 'inactive' | 'archived'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
export type CompanyStatus = 'active' | 'inactive' | 'archived'
export type CompanyType = 'prospect' | 'customer' | 'partner' | 'competitor' | 'other'
export type DealStatus = 'open' | 'won' | 'lost'

// ============================================================================
// CONTACTS
// ============================================================================

export interface Contact {
  id: string
  site_id: string
  owner_id?: string | null
  
  // Basic Info
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  job_title?: string | null
  department?: string | null
  
  // Company
  company_id?: string | null
  company?: Company | null
  
  // Address
  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  
  // Status
  status: ContactStatus
  lead_status?: LeadStatus | null
  
  // Source
  source?: string | null
  source_details?: string | null
  
  // Social
  linkedin_url?: string | null
  twitter_url?: string | null
  website_url?: string | null
  
  // Custom
  custom_fields: Record<string, unknown>
  tags: string[]
  
  // Scoring
  lead_score: number
  
  // Timestamps
  last_contacted_at?: string | null
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  activities?: Activity[]
  deals?: Deal[]
}

export type ContactInput = Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'company' | 'activities' | 'deals'>
export type ContactUpdate = Partial<ContactInput>

// ============================================================================
// COMPANIES
// ============================================================================

export interface Company {
  id: string
  site_id: string
  owner_id?: string | null
  
  // Basic Info
  name: string
  domain?: string | null
  description?: string | null
  industry?: string | null
  website?: string | null
  phone?: string | null
  
  // Size
  employee_count?: number | null
  annual_revenue?: number | null
  
  // Address
  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  
  // Status
  status: CompanyStatus
  account_type?: CompanyType | null
  
  // Custom
  custom_fields: Record<string, unknown>
  tags: string[]
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  contacts?: Contact[]
  deals?: Deal[]
}

export type CompanyInput = Omit<Company, 'id' | 'created_at' | 'updated_at' | 'contacts' | 'deals'>
export type CompanyUpdate = Partial<CompanyInput>

// ============================================================================
// DEALS / OPPORTUNITIES
// ============================================================================

export interface Deal {
  id: string
  site_id: string
  owner_id?: string | null
  
  // Relations
  contact_id?: string | null
  contact?: Contact | null
  company_id?: string | null
  company?: Company | null
  
  // Deal Info
  name: string
  description?: string | null
  
  // Pipeline
  pipeline_id?: string | null
  pipeline?: Pipeline | null
  stage_id?: string | null
  stage?: PipelineStage | null
  
  // Value
  amount?: number | null
  currency: string
  probability: number
  weighted_value?: number | null
  
  // Status
  status: 'open' | 'won' | 'lost'
  close_reason?: string | null
  
  // Dates
  expected_close_date?: string | null
  actual_close_date?: string | null
  
  // Custom
  custom_fields: Record<string, unknown>
  tags: string[]
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  activities?: Activity[]
}

export type DealInput = Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'weighted_value' | 'contact' | 'company' | 'pipeline' | 'stage' | 'activities'>
export type DealUpdate = Partial<DealInput>

// ============================================================================
// PIPELINES
// ============================================================================

export interface Pipeline {
  id: string
  site_id: string
  
  name: string
  description?: string | null
  is_default: boolean
  is_active: boolean
  
  // Configuration
  deal_rotting_days: number
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  stages?: PipelineStage[]
}

export type PipelineInput = Omit<Pipeline, 'id' | 'created_at' | 'updated_at' | 'stages'>
export type PipelineUpdate = Partial<PipelineInput>

// ============================================================================
// PIPELINE STAGES
// ============================================================================

export interface PipelineStage {
  id: string
  pipeline_id: string
  
  name: string
  description?: string | null
  color: string
  
  position: number
  probability: number
  stage_type: 'open' | 'won' | 'lost'
  
  created_at: string
}

export type PipelineStageInput = Omit<PipelineStage, 'id' | 'created_at'>
export type PipelineStageUpdate = Partial<PipelineStageInput>

// ============================================================================
// ACTIVITIES
// ============================================================================

export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note' | 'sms' | 'chat'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type CallDirection = 'inbound' | 'outbound'

export interface Activity {
  id: string
  site_id: string
  
  activity_type: ActivityType
  
  // Relations
  contact_id?: string | null
  contact?: Contact | null
  company_id?: string | null
  company?: Company | null
  deal_id?: string | null
  deal?: Deal | null
  
  // Content
  subject?: string | null
  description?: string | null
  outcome?: string | null
  
  // Call-specific
  call_duration_seconds?: number | null
  call_direction?: CallDirection | null
  call_recording_url?: string | null
  
  // Email-specific
  email_thread_id?: string | null
  email_message_id?: string | null
  
  // Meeting-specific
  meeting_location?: string | null
  meeting_attendees?: MeetingAttendee[] | null
  
  // Task-specific
  task_due_date?: string | null
  task_completed: boolean
  task_priority?: TaskPriority | null
  
  // Assignment
  assigned_to?: string | null
  created_by?: string | null
  
  // Timestamps
  scheduled_at?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface MeetingAttendee {
  email: string
  name?: string
  status?: 'pending' | 'accepted' | 'declined'
}

export type ActivityInput = Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'contact' | 'company' | 'deal'>
export type ActivityUpdate = Partial<ActivityInput>

// ============================================================================
// CUSTOM FIELDS
// ============================================================================

export type CustomFieldEntityType = 'contact' | 'company' | 'deal' | 'activity'
export type CustomFieldType = 
  | 'text' 
  | 'number' 
  | 'currency' 
  | 'date' 
  | 'datetime' 
  | 'select' 
  | 'multiselect' 
  | 'checkbox' 
  | 'url' 
  | 'email' 
  | 'phone'

export interface CustomFieldOption {
  value: string
  label: string
  color?: string
}

export interface CustomField {
  id: string
  site_id: string
  
  entity_type: CustomFieldEntityType
  
  field_key: string
  field_label: string
  field_type: CustomFieldType
  
  is_required: boolean
  default_value?: string | null
  placeholder?: string | null
  
  options?: CustomFieldOption[]
  
  position: number
  is_visible: boolean
  
  created_at: string
}

export type CustomFieldInput = Omit<CustomField, 'id' | 'created_at'>
export type CustomFieldUpdate = Partial<CustomFieldInput>

// ============================================================================
// TAGS
// ============================================================================

export interface Tag {
  id: string
  site_id: string
  
  name: string
  color: string
  
  created_at: string
}

export type TagInput = Omit<Tag, 'id' | 'created_at'>

// ============================================================================
// EMAIL
// ============================================================================

export type EmailProvider = 'gmail' | 'outlook' | 'smtp'

export interface EmailConfig {
  id: string
  site_id: string
  user_id: string
  
  provider: EmailProvider
  email_address?: string | null
  
  credentials: Record<string, unknown>
  
  is_active: boolean
  last_sync_at?: string | null
  
  created_at: string
  updated_at: string
}

export interface EmailMessage {
  id: string
  site_id: string
  user_id?: string | null
  
  message_id?: string | null
  thread_id?: string | null
  
  contact_id?: string | null
  deal_id?: string | null
  
  from_address?: string | null
  from_name?: string | null
  to_addresses: EmailAddress[]
  cc_addresses?: EmailAddress[]
  
  subject?: string | null
  body_html?: string | null
  body_text?: string | null
  
  sent_at?: string | null
  is_read: boolean
  is_outbound: boolean
  has_attachments: boolean
  
  created_at: string
}

export interface EmailAddress {
  email: string
  name?: string
}

export interface EmailTemplate {
  id: string
  site_id: string
  
  name: string
  subject: string
  body_html: string
  
  category: string
  is_active: boolean
  
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface EmailDraft {
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  subject: string
  bodyHtml: string
  contactId?: string
  dealId?: string
}

// ============================================================================
// REPORTS & ANALYTICS
// ============================================================================

export interface PipelineReport {
  totalDeals: number
  totalValue: number
  weightedValue: number
  byStage: { stage: string; count: number; value: number }[]
  avgDealSize: number
  avgDaysToClose: number
}

export interface ActivityReport {
  total: number
  byType: { type: ActivityType; count: number }[]
  byDate: { date: string; count: number }[]
}

export interface RevenueReport {
  totalWon: number
  totalLost: number
  winRate: number
  byMonth: { month: string; won: number; lost: number }[]
}

// ============================================================================
// SEARCH
// ============================================================================

export interface CRMSearchResult {
  contacts: Contact[]
  companies: Company[]
  deals: Deal[]
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface CRMSettings {
  branding?: {
    logo_url?: string
    primary_color?: string
    company_name?: string
  }
  currency?: string
  date_format?: string
  features?: {
    enable_email_integration?: boolean
    enable_activity_log?: boolean
    enable_reports?: boolean
    enable_custom_fields?: boolean
  }
  lead_scoring?: {
    enabled?: boolean
    rules?: Array<{
      condition: string
      points: number
    }>
  }
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CRMApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
