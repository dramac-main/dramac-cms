/**
 * CRM Module Server Actions
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Server-side actions for CRUD operations on CRM entities
 * Uses schema isolation per EM-05 naming conventions
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { 
  Contact, ContactInput, ContactUpdate,
  Company, CompanyInput, CompanyUpdate,
  Deal, DealInput, DealUpdate,
  Pipeline, PipelineInput, PipelineUpdate,
  PipelineStage, PipelineStageInput, PipelineStageUpdate,
  Activity, ActivityInput, ActivityUpdate,
  Tag, TagInput,
  CustomField, CustomFieldInput, CustomFieldUpdate,
  PipelineReport,
  CRMSearchResult
} from '../types/crm-types'

// ============================================================================
// SCHEMA HELPERS
// ============================================================================

// CRM Module ID - This would typically come from module installation
// For now, we use a fixed short_id pattern
const CRM_SHORT_ID = 'crmmod01'
const TABLE_PREFIX = `mod_${CRM_SHORT_ID}`

// Helper to get untyped Supabase client for dynamic module tables
async function getModuleClient() {
  const supabase = await createClient()
  // Use 'as any' to bypass TypeScript's strict table type checking
  // Module tables are dynamically created and not in the generated types
  return supabase as any
}

// ============================================================================
// CONTACTS
// ============================================================================

export async function getContacts(siteId: string): Promise<Contact[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select(`
      *,
      company:${TABLE_PREFIX}_companies(id, name)
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching contacts:', error)
    throw new Error(error.message)
  }
  
  return (data || []) as Contact[]
}

export async function getContact(siteId: string, id: string): Promise<Contact | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select(`
      *,
      company:${TABLE_PREFIX}_companies(id, name)
    `)
    .eq('site_id', siteId)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(error.message)
  }
  
  return data as Contact
}

export async function createContact(siteId: string, input: Partial<ContactInput>): Promise<Contact> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .insert({
      site_id: siteId,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      email: input.email || null,
      phone: input.phone || null,
      mobile: input.mobile || null,
      job_title: input.job_title || null,
      company_id: input.company_id || null,
      address_line_1: input.address_line_1 || null,
      address_line_2: input.address_line_2 || null,
      city: input.city || null,
      state: input.state || null,
      postal_code: input.postal_code || null,
      country: input.country || null,
      status: input.status || 'active',
      lead_status: input.lead_status || 'new',
      source: input.source || null,
      source_details: input.source_details || null,
      linkedin_url: input.linkedin_url || null,
      twitter_url: input.twitter_url || null,
      website_url: input.website_url || null,
      custom_fields: input.custom_fields || {},
      tags: input.tags || [],
      lead_score: input.lead_score || 0,
      owner_id: input.owner_id || null,
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Contact
}

export async function updateContact(siteId: string, id: string, input: ContactUpdate): Promise<Contact> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .update(input)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Contact
}

export async function deleteContact(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// COMPANIES
// ============================================================================

export async function getCompanies(siteId: string): Promise<Company[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_companies`)
    .select('*')
    .eq('site_id', siteId)
    .order('name')
  
  if (error) throw new Error(error.message)
  return (data || []) as Company[]
}

export async function getCompany(siteId: string, id: string): Promise<Company | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_companies`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as Company
}

export async function createCompany(siteId: string, input: Partial<CompanyInput>): Promise<Company> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_companies`)
    .insert({
      site_id: siteId,
      name: input.name || 'Unnamed Company',
      industry: input.industry || null,
      website: input.website || null,
      phone: input.phone || null,
      employee_count: input.employee_count || null,
      annual_revenue: input.annual_revenue || null,
      address_line_1: input.address_line_1 || null,
      address_line_2: input.address_line_2 || null,
      city: input.city || null,
      state: input.state || null,
      postal_code: input.postal_code || null,
      country: input.country || null,
      status: input.status || 'active',
      account_type: input.account_type || 'prospect',
      custom_fields: input.custom_fields || {},
      tags: input.tags || [],
      owner_id: input.owner_id || null,
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Company
}

export async function updateCompany(siteId: string, id: string, input: CompanyUpdate): Promise<Company> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_companies`)
    .update(input)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Company
}

export async function deleteCompany(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_companies`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// DEALS
// ============================================================================

export async function getDeals(siteId: string): Promise<Deal[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .select(`
      *,
      contact:${TABLE_PREFIX}_contacts(id, first_name, last_name, email),
      company:${TABLE_PREFIX}_companies(id, name),
      stage:${TABLE_PREFIX}_pipeline_stages(id, name, color, probability, stage_type)
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return (data || []) as Deal[]
}

export async function getDeal(siteId: string, id: string): Promise<Deal | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .select(`
      *,
      contact:${TABLE_PREFIX}_contacts(id, first_name, last_name, email),
      company:${TABLE_PREFIX}_companies(id, name),
      stage:${TABLE_PREFIX}_pipeline_stages(id, name, color, probability, stage_type),
      pipeline:${TABLE_PREFIX}_pipelines(id, name)
    `)
    .eq('site_id', siteId)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as Deal
}

export async function createDeal(siteId: string, input: Partial<DealInput>): Promise<Deal> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .insert({
      site_id: siteId,
      name: input.name || 'New Deal',
      description: input.description || null,
      contact_id: input.contact_id || null,
      company_id: input.company_id || null,
      pipeline_id: input.pipeline_id || null,
      stage_id: input.stage_id || null,
      amount: input.amount || null,
      currency: input.currency || 'USD',
      probability: input.probability ?? 50,
      status: input.status || 'open',
      close_reason: input.close_reason || null,
      expected_close_date: input.expected_close_date || null,
      custom_fields: input.custom_fields || {},
      tags: input.tags || [],
      owner_id: input.owner_id || null,
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Deal
}

export async function updateDeal(siteId: string, id: string, input: DealUpdate): Promise<Deal> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .update(input)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Deal
}

export async function deleteDeal(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

export async function moveDealToStage(siteId: string, dealId: string, stageId: string): Promise<Deal> {
  const supabase = await getModuleClient()
  
  // First, get the stage to check if it's a won/lost stage
  const { data: stage } = await supabase
    .from(`${TABLE_PREFIX}_pipeline_stages`)
    .select('probability, stage_type')
    .eq('id', stageId)
    .single()
  
  const updateData: Partial<DealInput> = { 
    stage_id: stageId,
  }
  
  if (stage) {
    updateData.probability = stage.probability
    
    if (stage.stage_type === 'won') {
      updateData.status = 'won'
      updateData.actual_close_date = new Date().toISOString().split('T')[0]
    } else if (stage.stage_type === 'lost') {
      updateData.status = 'lost'
      updateData.actual_close_date = new Date().toISOString().split('T')[0]
    } else {
      updateData.status = 'open'
      updateData.actual_close_date = null
    }
  }
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .update(updateData)
    .eq('site_id', siteId)
    .eq('id', dealId)
    .select(`
      *,
      contact:${TABLE_PREFIX}_contacts(id, first_name, last_name, email),
      company:${TABLE_PREFIX}_companies(id, name),
      stage:${TABLE_PREFIX}_pipeline_stages(id, name, color, probability, stage_type)
    `)
    .single()
  
  if (error) throw new Error(error.message)
  return data as Deal
}

// ============================================================================
// PIPELINES
// ============================================================================

export async function getPipelines(siteId: string): Promise<Pipeline[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_pipelines`)
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('name')
  
  if (error) throw new Error(error.message)
  return (data || []) as Pipeline[]
}

export async function getPipeline(siteId: string, id: string): Promise<Pipeline | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_pipelines`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as Pipeline
}

export async function createPipeline(siteId: string, input: Partial<PipelineInput>): Promise<Pipeline> {
  const supabase = await getModuleClient()
  
  // If this is the first pipeline, make it default
  const { data: existingPipelines } = await supabase
    .from(`${TABLE_PREFIX}_pipelines`)
    .select('id')
    .eq('site_id', siteId)
    .limit(1)
  
  const isFirstPipeline = !existingPipelines || existingPipelines.length === 0
  
  const { data: pipeline, error: pipelineError } = await supabase
    .from(`${TABLE_PREFIX}_pipelines`)
    .insert({
      site_id: siteId,
      name: input.name || 'Sales Pipeline',
      description: input.description || null,
      is_default: input.is_default ?? isFirstPipeline,
      is_active: input.is_active ?? true,
      deal_rotting_days: input.deal_rotting_days ?? 30,
    })
    .select()
    .single()
  
  if (pipelineError) throw new Error(pipelineError.message)
  
  // Create default stages
  const defaultStages = [
    { name: 'Lead', position: 0, probability: 10, stage_type: 'open', color: '#94a3b8' },
    { name: 'Qualified', position: 1, probability: 25, stage_type: 'open', color: '#3b82f6' },
    { name: 'Proposal', position: 2, probability: 50, stage_type: 'open', color: '#8b5cf6' },
    { name: 'Negotiation', position: 3, probability: 75, stage_type: 'open', color: '#f59e0b' },
    { name: 'Won', position: 4, probability: 100, stage_type: 'won', color: '#22c55e' },
    { name: 'Lost', position: 5, probability: 0, stage_type: 'lost', color: '#ef4444' },
  ]
  
  const { error: stagesError } = await supabase
    .from(`${TABLE_PREFIX}_pipeline_stages`)
    .insert(defaultStages.map(s => ({ ...s, pipeline_id: pipeline.id })))
  
  if (stagesError) {
    console.error('Error creating default stages:', stagesError)
  }
  
  return pipeline as Pipeline
}

export async function updatePipeline(siteId: string, id: string, input: PipelineUpdate): Promise<Pipeline> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_pipelines`)
    .update(input)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Pipeline
}

export async function deletePipeline(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  // Soft delete by marking as inactive
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_pipelines`)
    .update({ is_active: false })
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// PIPELINE STAGES
// ============================================================================

export async function getStages(siteId: string): Promise<PipelineStage[]> {
  const supabase = await getModuleClient()
  
  // Get all pipelines for this site first
  const { data: pipelines } = await supabase
    .from(`${TABLE_PREFIX}_pipelines`)
    .select('id')
    .eq('site_id', siteId)
    .eq('is_active', true)
  
  if (!pipelines?.length) return []
  
  const pipelineIds = pipelines.map((p: { id: string }) => p.id)
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_pipeline_stages`)
    .select('*')
    .in('pipeline_id', pipelineIds)
    .order('position')
  
  if (error) throw new Error(error.message)
  return (data || []) as PipelineStage[]
}

export async function getStagesForPipeline(pipelineId: string): Promise<PipelineStage[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_pipeline_stages`)
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('position')
  
  if (error) throw new Error(error.message)
  return (data || []) as PipelineStage[]
}

export async function createPipelineStage(
  _siteId: string, 
  pipelineId: string, 
  input: Partial<PipelineStageInput>
): Promise<PipelineStage> {
  const supabase = await getModuleClient()
  
  // Get max position
  const { data: existingStages } = await supabase
    .from(`${TABLE_PREFIX}_pipeline_stages`)
    .select('position')
    .eq('pipeline_id', pipelineId)
    .order('position', { ascending: false })
    .limit(1)
  
  const nextPosition = existingStages?.[0]?.position !== undefined 
    ? existingStages[0].position + 1 
    : 0
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_pipeline_stages`)
    .insert({
      pipeline_id: pipelineId,
      name: input.name || 'New Stage',
      description: input.description || null,
      color: input.color || '#6366f1',
      position: input.position ?? nextPosition,
      probability: input.probability ?? 50,
      stage_type: input.stage_type || 'open',
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as PipelineStage
}

export async function updatePipelineStage(_siteId: string, id: string, input: PipelineStageUpdate): Promise<PipelineStage> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_pipeline_stages`)
    .update(input)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as PipelineStage
}

export async function deletePipelineStage(_siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_pipeline_stages`)
    .delete()
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// ACTIVITIES
// ============================================================================

export async function getActivities(siteId: string, limit = 100): Promise<Activity[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_activities`)
    .select(`
      *,
      contact:${TABLE_PREFIX}_contacts(id, first_name, last_name),
      deal:${TABLE_PREFIX}_deals(id, name)
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw new Error(error.message)
  return (data || []) as Activity[]
}

export async function getActivitiesForContact(siteId: string, contactId: string): Promise<Activity[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_activities`)
    .select('*')
    .eq('site_id', siteId)
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return (data || []) as Activity[]
}

export async function getActivitiesForDeal(siteId: string, dealId: string): Promise<Activity[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_activities`)
    .select('*')
    .eq('site_id', siteId)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return (data || []) as Activity[]
}

export async function createActivity(siteId: string, input: Partial<ActivityInput>): Promise<Activity> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_activities`)
    .insert({
      site_id: siteId,
      activity_type: input.activity_type || 'note',
      contact_id: input.contact_id || null,
      company_id: input.company_id || null,
      deal_id: input.deal_id || null,
      subject: input.subject || null,
      description: input.description || null,
      outcome: input.outcome || null,
      call_duration_seconds: input.call_duration_seconds || null,
      call_direction: input.call_direction || null,
      call_recording_url: input.call_recording_url || null,
      email_thread_id: input.email_thread_id || null,
      email_message_id: input.email_message_id || null,
      meeting_location: input.meeting_location || null,
      meeting_attendees: input.meeting_attendees || [],
      task_due_date: input.task_due_date || null,
      task_completed: input.task_completed ?? false,
      task_priority: input.task_priority || null,
      assigned_to: input.assigned_to || null,
      created_by: input.created_by || null,
      scheduled_at: input.scheduled_at || null,
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  // Update last_contacted_at on contact if applicable
  if (input.contact_id && ['call', 'email', 'meeting'].includes(input.activity_type || '')) {
    await supabase
      .from(`${TABLE_PREFIX}_contacts`)
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', input.contact_id)
  }
  
  return data as Activity
}

export async function updateActivity(siteId: string, id: string, input: ActivityUpdate): Promise<Activity> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_activities`)
    .update({
      ...input,
      completed_at: input.task_completed ? new Date().toISOString() : null,
    })
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Activity
}

export async function deleteActivity(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_activities`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// TAGS
// ============================================================================

export async function getTags(siteId: string): Promise<Tag[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_tags`)
    .select('*')
    .eq('site_id', siteId)
    .order('name')
  
  if (error) throw new Error(error.message)
  return (data || []) as Tag[]
}

export async function createTag(siteId: string, input: Partial<TagInput>): Promise<Tag> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_tags`)
    .insert({
      site_id: siteId,
      name: input.name || 'New Tag',
      color: input.color || '#6366f1',
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Tag
}

export async function deleteTag(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_tags`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// CUSTOM FIELDS
// ============================================================================

export async function getCustomFields(siteId: string, entityType?: string): Promise<CustomField[]> {
  const supabase = await getModuleClient()
  
  let query = supabase
    .from(`${TABLE_PREFIX}_custom_fields`)
    .select('*')
    .eq('site_id', siteId)
    .order('position')
  
  if (entityType) {
    query = query.eq('entity_type', entityType)
  }
  
  const { data, error } = await query
  
  if (error) throw new Error(error.message)
  return (data || []) as CustomField[]
}

export async function createCustomField(siteId: string, input: Partial<CustomFieldInput>): Promise<CustomField> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_custom_fields`)
    .insert({
      site_id: siteId,
      entity_type: input.entity_type || 'contact',
      field_key: input.field_key || `field_${Date.now()}`,
      field_label: input.field_label || 'New Field',
      field_type: input.field_type || 'text',
      is_required: input.is_required ?? false,
      default_value: input.default_value || null,
      placeholder: input.placeholder || null,
      options: input.options || [],
      position: input.position ?? 0,
      is_visible: input.is_visible ?? true,
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as CustomField
}

export async function updateCustomField(siteId: string, id: string, input: CustomFieldUpdate): Promise<CustomField> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_custom_fields`)
    .update(input)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as CustomField
}

export async function deleteCustomField(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_custom_fields`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// SEARCH
// ============================================================================

export async function globalSearch(siteId: string, query: string): Promise<CRMSearchResult> {
  const supabase = await getModuleClient()
  const searchQuery = `%${query}%`
  
  const [contactsRes, companiesRes, dealsRes] = await Promise.all([
    supabase
      .from(`${TABLE_PREFIX}_contacts`)
      .select('*')
      .eq('site_id', siteId)
      .or(`first_name.ilike.${searchQuery},last_name.ilike.${searchQuery},email.ilike.${searchQuery}`)
      .limit(10),
    supabase
      .from(`${TABLE_PREFIX}_companies`)
      .select('*')
      .eq('site_id', siteId)
      .ilike('name', searchQuery)
      .limit(10),
    supabase
      .from(`${TABLE_PREFIX}_deals`)
      .select('*')
      .eq('site_id', siteId)
      .ilike('name', searchQuery)
      .limit(10)
  ])
  
  return {
    contacts: (contactsRes.data || []) as Contact[],
    companies: (companiesRes.data || []) as Company[],
    deals: (dealsRes.data || []) as Deal[]
  }
}

// ============================================================================
// REPORTS
// ============================================================================

export async function getPipelineReport(siteId: string, pipelineId: string): Promise<PipelineReport> {
  const supabase = await getModuleClient()
  
  const { data: deals } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .select(`
      *,
      stage:${TABLE_PREFIX}_pipeline_stages(name, position)
    `)
    .eq('site_id', siteId)
    .eq('pipeline_id', pipelineId)
  
  if (!deals?.length) {
    return {
      totalDeals: 0,
      totalValue: 0,
      weightedValue: 0,
      byStage: [],
      avgDealSize: 0,
      avgDaysToClose: 0
    }
  }
  
  // Type for deal record from database
  interface DealRecord {
    status: string
    stage?: { name: string; position: number } | null
    amount?: number | null
    weighted_value?: number | null
    created_at: string
    actual_close_date?: string | null
  }
  
  const openDeals = deals.filter((d: DealRecord) => d.status === 'open')
  const wonDeals = deals.filter((d: DealRecord) => d.status === 'won')
  
  // Group by stage
  const byStageMap = new Map<string, { count: number; value: number }>()
  openDeals.forEach((d: DealRecord) => {
    const stageName = d.stage?.name || 'Unknown'
    const current = byStageMap.get(stageName) || { count: 0, value: 0 }
    byStageMap.set(stageName, {
      count: current.count + 1,
      value: current.value + (d.amount || 0)
    })
  })
  
  // Calculate average days to close
  const avgDaysToClose = wonDeals.length > 0
    ? wonDeals.reduce((sum: number, d: DealRecord) => {
        const created = new Date(d.created_at)
        const closed = new Date(d.actual_close_date || d.created_at)
        return sum + Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      }, 0) / wonDeals.length
    : 0
  
  return {
    totalDeals: openDeals.length,
    totalValue: openDeals.reduce((sum: number, d: DealRecord) => sum + (d.amount || 0), 0),
    weightedValue: openDeals.reduce((sum: number, d: DealRecord) => sum + (d.weighted_value || 0), 0),
    byStage: Array.from(byStageMap.entries()).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value
    })),
    avgDealSize: openDeals.length > 0 
      ? openDeals.reduce((sum: number, d: DealRecord) => sum + (d.amount || 0), 0) / openDeals.length 
      : 0,
    avgDaysToClose: Math.round(avgDaysToClose)
  }
}

// ============================================================================
// INSTALLATION HELPERS
// ============================================================================

export async function initializeCRMForSite(siteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if pipeline already exists
    const pipelines = await getPipelines(siteId)
    
    if (pipelines.length === 0) {
      // Create default pipeline with stages
      // Note: createPipeline automatically creates default stages
      await createPipeline(siteId, {
        name: 'Sales Pipeline',
        description: 'Default sales pipeline',
        is_default: true
      })
    }
    
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
