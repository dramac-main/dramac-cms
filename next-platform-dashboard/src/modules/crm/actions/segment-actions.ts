/**
 * CRM Segment Server Actions
 * 
 * Smart Lists / Dynamic Contact Segments
 * Supports dynamic segments (auto-evaluated based on filter criteria)
 * and static segments (manually managed member lists)
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { 
  Contact, Segment, SegmentInput, SegmentUpdate, SegmentFilter 
} from '../types/crm-types'

const TABLE_PREFIX = 'mod_crmmod01'

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

// ============================================================================
// SEGMENT CRUD
// ============================================================================

export async function getSegments(siteId: string): Promise<Segment[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_segments`)
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('name')
  
  if (error) throw new Error(error.message)
  return (data || []) as Segment[]
}

export async function getSegment(siteId: string, id: string): Promise<Segment | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_segments`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Segment
}

export async function createSegment(siteId: string, input: Partial<SegmentInput>): Promise<Segment> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_segments`)
    .insert({
      site_id: siteId,
      name: input.name || 'New Segment',
      description: input.description || null,
      color: input.color || '#6366f1',
      filters: input.filters || [],
      filter_logic: input.filter_logic || 'and',
      segment_type: input.segment_type || 'dynamic',
      is_active: true,
      created_by: input.created_by || null,
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  const segment = data as Segment
  
  // Evaluate segment immediately to get initial count
  if (segment.segment_type === 'dynamic') {
    await evaluateSegment(siteId, segment.id)
  }
  
  return segment
}

export async function updateSegment(siteId: string, id: string, input: SegmentUpdate): Promise<Segment> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_segments`)
    .update(input)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  const segment = data as Segment
  
  // Re-evaluate if filters changed
  if (input.filters && segment.segment_type === 'dynamic') {
    await evaluateSegment(siteId, segment.id)
  }
  
  return segment
}

export async function deleteSegment(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  // Soft delete
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_segments`)
    .update({ is_active: false })
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// SEGMENT EVALUATION (Dynamic Segments)
// ============================================================================

/**
 * Evaluate a dynamic segment's filters against all contacts
 * and return the count + update the cached count
 */
export async function evaluateSegment(siteId: string, segmentId: string): Promise<{ contacts: Contact[]; count: number }> {
  const supabase = await getModuleClient()
  
  // Get the segment
  const { data: segment } = await supabase
    .from(`${TABLE_PREFIX}_segments`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', segmentId)
    .single()
  
  if (!segment) throw new Error('Segment not found')
  
  // Get all contacts for the site
  const { data: contacts } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select('*')
    .eq('site_id', siteId)
  
  if (!contacts) return { contacts: [], count: 0 }
  
  const filters = (segment.filters || []) as SegmentFilter[]
  const logic = segment.filter_logic || 'and'
  
  // Apply filters
  const matchingContacts = contacts.filter((contact: Record<string, unknown>) => {
    if (filters.length === 0) return true
    
    const results = filters.map(filter => evaluateFilter(contact, filter))
    
    if (logic === 'and') {
      return results.every(Boolean)
    } else {
      return results.some(Boolean)
    }
  }) as Contact[]
  
  // Update cached count
  await supabase
    .from(`${TABLE_PREFIX}_segments`)
    .update({ 
      contact_count: matchingContacts.length,
      last_evaluated_at: new Date().toISOString()
    })
    .eq('id', segmentId)
  
  return { contacts: matchingContacts, count: matchingContacts.length }
}

/**
 * Get contacts that match a segment's criteria
 */
export async function getSegmentContacts(siteId: string, segmentId: string): Promise<Contact[]> {
  const supabase = await getModuleClient()
  
  const { data: segment } = await supabase
    .from(`${TABLE_PREFIX}_segments`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', segmentId)
    .single()
  
  if (!segment) throw new Error('Segment not found')
  
  if (segment.segment_type === 'static') {
    // For static segments, get members
    const { data: members } = await supabase
      .from(`${TABLE_PREFIX}_segment_members`)
      .select(`contact_id`)
      .eq('segment_id', segmentId)
    
    if (!members?.length) return []
    
    const contactIds = members.map((m: { contact_id: string }) => m.contact_id)
    
    const { data: contacts } = await supabase
      .from(`${TABLE_PREFIX}_contacts`)
      .select('*')
      .eq('site_id', siteId)
      .in('id', contactIds)
    
    return (contacts || []) as Contact[]
  } else {
    // For dynamic segments, evaluate filters
    const result = await evaluateSegment(siteId, segmentId)
    return result.contacts
  }
}

// ============================================================================
// STATIC SEGMENT MEMBERS
// ============================================================================

export async function addContactToSegment(segmentId: string, contactId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_segment_members`)
    .upsert({ segment_id: segmentId, contact_id: contactId })
  
  if (error) throw new Error(error.message)
}

export async function removeContactFromSegment(segmentId: string, contactId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_segment_members`)
    .delete()
    .eq('segment_id', segmentId)
    .eq('contact_id', contactId)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// FILTER EVALUATION HELPERS
// ============================================================================

function evaluateFilter(contact: Record<string, unknown>, filter: SegmentFilter): boolean {
  const { field, operator, value } = filter
  const contactValue = contact[field]
  
  switch (operator) {
    case 'equals':
      return String(contactValue ?? '') === String(value ?? '')
    case 'not_equals':
      return String(contactValue ?? '') !== String(value ?? '')
    case 'contains':
      return String(contactValue ?? '').toLowerCase().includes(String(value ?? '').toLowerCase())
    case 'not_contains':
      return !String(contactValue ?? '').toLowerCase().includes(String(value ?? '').toLowerCase())
    case 'starts_with':
      return String(contactValue ?? '').toLowerCase().startsWith(String(value ?? '').toLowerCase())
    case 'ends_with':
      return String(contactValue ?? '').toLowerCase().endsWith(String(value ?? '').toLowerCase())
    case 'greater_than':
      return Number(contactValue || 0) > Number(value || 0)
    case 'less_than':
      return Number(contactValue || 0) < Number(value || 0)
    case 'greater_or_equal':
      return Number(contactValue || 0) >= Number(value || 0)
    case 'less_or_equal':
      return Number(contactValue || 0) <= Number(value || 0)
    case 'is_empty':
      return !contactValue || contactValue === '' || (Array.isArray(contactValue) && contactValue.length === 0)
    case 'is_not_empty':
      return !!contactValue && contactValue !== '' && !(Array.isArray(contactValue) && contactValue.length === 0)
    case 'in':
      return Array.isArray(value) && value.includes(String(contactValue ?? ''))
    case 'not_in':
      return Array.isArray(value) && !value.includes(String(contactValue ?? ''))
    case 'is_true':
      return contactValue === true || contactValue === 'true'
    case 'is_false':
      return contactValue === false || contactValue === 'false' || !contactValue
    case 'date_before':
      return new Date(String(contactValue || '')).getTime() < new Date(String(value || '')).getTime()
    case 'date_after':
      return new Date(String(contactValue || '')).getTime() > new Date(String(value || '')).getTime()
    default:
      return false
  }
}
