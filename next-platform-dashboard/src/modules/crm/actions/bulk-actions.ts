/**
 * CRM Bulk Actions Server
 * 
 * Bulk operations for contacts: delete, update status, tag, reassign, export.
 * Also includes contact merge/dedup and CSV import.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { logAutomationEvent } from '@/modules/automation/services/event-processor'
import type { 
  Contact, BulkActionResult, MergeCandidate, ImportResult,
  FormCapture, TimelineEvent
} from '../types/crm-types'

const TABLE_PREFIX = 'mod_crmmod01'

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

/**
 * Bulk delete contacts
 */
export async function bulkDeleteContacts(siteId: string, contactIds: string[]): Promise<BulkActionResult> {
  const supabase = await getModuleClient()
  let processed = 0
  let failed = 0
  const errors: string[] = []
  
  for (const id of contactIds) {
    try {
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_contacts`)
        .delete()
        .eq('site_id', siteId)
        .eq('id', id)
      
      if (error) {
        errors.push(`${id}: ${error.message}`)
        failed++
      } else {
        processed++
      }
    } catch (err) {
      errors.push(`${id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      failed++
    }
  }
  
  return { success: failed === 0, processed, failed, errors: errors.length > 0 ? errors : undefined }
}

/**
 * Bulk update contact status
 */
export async function bulkUpdateContactStatus(
  siteId: string, 
  contactIds: string[], 
  status: string
): Promise<BulkActionResult> {
  const supabase = await getModuleClient()
  
  const { error, count } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .update({ status })
    .eq('site_id', siteId)
    .in('id', contactIds)
  
  if (error) {
    return { success: false, processed: 0, failed: contactIds.length, errors: [error.message] }
  }
  
  return { success: true, processed: count || contactIds.length, failed: 0 }
}

/**
 * Bulk update lead status
 */
export async function bulkUpdateLeadStatus(
  siteId: string, 
  contactIds: string[], 
  leadStatus: string
): Promise<BulkActionResult> {
  const supabase = await getModuleClient()
  
  const { error, count } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .update({ lead_status: leadStatus })
    .eq('site_id', siteId)
    .in('id', contactIds)
  
  if (error) {
    return { success: false, processed: 0, failed: contactIds.length, errors: [error.message] }
  }
  
  return { success: true, processed: count || contactIds.length, failed: 0 }
}

/**
 * Bulk update contact owner
 */
export async function bulkUpdateOwner(
  siteId: string, 
  contactIds: string[], 
  ownerId: string
): Promise<BulkActionResult> {
  const supabase = await getModuleClient()
  
  const { error, count } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .update({ owner_id: ownerId })
    .eq('site_id', siteId)
    .in('id', contactIds)
  
  if (error) {
    return { success: false, processed: 0, failed: contactIds.length, errors: [error.message] }
  }
  
  return { success: true, processed: count || contactIds.length, failed: 0 }
}

/**
 * Bulk add tags to contacts
 */
export async function bulkAddTags(
  siteId: string, 
  contactIds: string[], 
  tags: string[]
): Promise<BulkActionResult> {
  const supabase = await getModuleClient()
  let processed = 0
  let failed = 0
  
  for (const id of contactIds) {
    try {
      // Get current tags
      const { data: contact } = await supabase
        .from(`${TABLE_PREFIX}_contacts`)
        .select('tags')
        .eq('site_id', siteId)
        .eq('id', id)
        .single()
      
      if (!contact) { failed++; continue }
      
      const currentTags = contact.tags || []
      const newTags = [...new Set([...currentTags, ...tags])]
      
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_contacts`)
        .update({ tags: newTags })
        .eq('site_id', siteId)
        .eq('id', id)
      
      if (error) { failed++ } else { processed++ }
    } catch {
      failed++
    }
  }
  
  return { success: failed === 0, processed, failed }
}

/**
 * Bulk remove tags from contacts
 */
export async function bulkRemoveTags(
  siteId: string, 
  contactIds: string[], 
  tags: string[]
): Promise<BulkActionResult> {
  const supabase = await getModuleClient()
  let processed = 0
  let failed = 0
  
  for (const id of contactIds) {
    try {
      const { data: contact } = await supabase
        .from(`${TABLE_PREFIX}_contacts`)
        .select('tags')
        .eq('site_id', siteId)
        .eq('id', id)
        .single()
      
      if (!contact) { failed++; continue }
      
      const currentTags = (contact.tags || []) as string[]
      const newTags = currentTags.filter(t => !tags.includes(t))
      
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_contacts`)
        .update({ tags: newTags })
        .eq('site_id', siteId)
        .eq('id', id)
      
      if (error) { failed++ } else { processed++ }
    } catch {
      failed++
    }
  }
  
  return { success: failed === 0, processed, failed }
}

// ============================================================================
// CONTACT MERGE / DEDUPLICATION
// ============================================================================

/**
 * Find duplicate contacts by email or phone
 */
export async function findDuplicateContacts(siteId: string): Promise<MergeCandidate[][]> {
  const supabase = await getModuleClient()
  
  const { data: contacts } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select('*')
    .eq('site_id', siteId)
    .order('created_at')
  
  if (!contacts?.length) return []
  
  const duplicateGroups: MergeCandidate[][] = []
  const processedEmails = new Set<string>()
  const processedPhones = new Set<string>()
  
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i] as Contact
    const group: MergeCandidate[] = []
    
    // Check email duplicates
    if (contact.email && !processedEmails.has(contact.email.toLowerCase())) {
      const emailMatches = contacts.filter(
        (c: Contact, j: number) => j !== i && c.email?.toLowerCase() === contact.email?.toLowerCase()
      ) as Contact[]
      
      if (emailMatches.length > 0) {
        group.push({ contact, matchType: 'email', confidence: 95 })
        emailMatches.forEach(match => {
          group.push({ contact: match, matchType: 'email', confidence: 95 })
        })
        processedEmails.add(contact.email.toLowerCase())
      }
    }
    
    // Check phone duplicates (if no email match found)
    if (group.length === 0 && contact.phone && !processedPhones.has(contact.phone)) {
      const phoneMatches = contacts.filter(
        (c: Contact, j: number) => j !== i && c.phone === contact.phone
      ) as Contact[]
      
      if (phoneMatches.length > 0) {
        group.push({ contact, matchType: 'phone', confidence: 80 })
        phoneMatches.forEach(match => {
          group.push({ contact: match, matchType: 'phone', confidence: 80 })
        })
        processedPhones.add(contact.phone)
      }
    }
    
    if (group.length > 1) {
      duplicateGroups.push(group)
    }
  }
  
  return duplicateGroups
}

/**
 * Merge contacts - keeps the primary contact and merges data from secondary contacts
 */
export async function mergeContacts(
  siteId: string, 
  primaryContactId: string, 
  secondaryContactIds: string[]
): Promise<Contact> {
  const supabase = await getModuleClient()
  
  // Get all contacts involved
  const allIds = [primaryContactId, ...secondaryContactIds]
  const { data: contacts } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select('*')
    .eq('site_id', siteId)
    .in('id', allIds)
  
  if (!contacts?.length) throw new Error('Contacts not found')
  
  const primary = contacts.find((c: Contact) => c.id === primaryContactId) as Contact
  if (!primary) throw new Error('Primary contact not found')
  
  const secondaries = contacts.filter((c: Contact) => c.id !== primaryContactId) as Contact[]
  
  // Merge data: fill empty fields from secondary contacts
  const mergedData: Record<string, unknown> = {}
  const fieldsToMerge = [
    'first_name', 'last_name', 'email', 'phone', 'mobile', 'job_title',
    'company_id', 'address_line_1', 'city', 'state', 'postal_code', 'country',
    'linkedin_url', 'twitter_url', 'website_url', 'source'
  ]
  
  for (const field of fieldsToMerge) {
    if (!primary[field as keyof Contact]) {
      for (const secondary of secondaries) {
        if (secondary[field as keyof Contact]) {
          mergedData[field] = secondary[field as keyof Contact]
          break
        }
      }
    }
  }
  
  // Merge tags
  const allTags = new Set<string>(primary.tags || [])
  for (const secondary of secondaries) {
    (secondary.tags || []).forEach(tag => allTags.add(tag))
  }
  mergedData.tags = Array.from(allTags)
  
  // Take highest lead score
  const maxScore = Math.max(primary.lead_score, ...secondaries.map(s => s.lead_score))
  if (maxScore > primary.lead_score) {
    mergedData.lead_score = maxScore
  }
  
  // Update primary contact with merged data
  if (Object.keys(mergedData).length > 0) {
    await supabase
      .from(`${TABLE_PREFIX}_contacts`)
      .update(mergedData)
      .eq('site_id', siteId)
      .eq('id', primaryContactId)
  }
  
  // Move activities from secondary contacts to primary
  for (const secondary of secondaries) {
    await supabase
      .from(`${TABLE_PREFIX}_activities`)
      .update({ contact_id: primaryContactId })
      .eq('site_id', siteId)
      .eq('contact_id', secondary.id)
    
    // Move deals
    await supabase
      .from(`${TABLE_PREFIX}_deals`)
      .update({ contact_id: primaryContactId })
      .eq('site_id', siteId)
      .eq('contact_id', secondary.id)
    
    // Move notes
    await supabase
      .from(`${TABLE_PREFIX}_contact_notes`)
      .update({ contact_id: primaryContactId })
      .eq('site_id', siteId)
      .eq('contact_id', secondary.id)
    
    // Move form captures
    await supabase
      .from(`${TABLE_PREFIX}_form_captures`)
      .update({ contact_id: primaryContactId })
      .eq('site_id', siteId)
      .eq('contact_id', secondary.id)
    
    // Move emails
    await supabase
      .from(`${TABLE_PREFIX}_email_messages`)
      .update({ contact_id: primaryContactId })
      .eq('site_id', siteId)
      .eq('contact_id', secondary.id)
  }
  
  // Delete secondary contacts
  await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .delete()
    .eq('site_id', siteId)
    .in('id', secondaryContactIds)
  
  // Emit automation event
  await logAutomationEvent(siteId, 'crm.contact.merged', {
    primary_contact_id: primaryContactId,
    merged_contact_ids: secondaryContactIds,
    merged_count: secondaryContactIds.length,
  }, {
    sourceModule: 'crm',
    sourceEntityType: 'contact',
    sourceEntityId: primaryContactId,
  }).catch(err => console.error('[CRM] Failed to emit merge event:', err))
  
  // Get and return the updated primary contact
  const { data: updated } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', primaryContactId)
    .single()
  
  return updated as Contact
}

// ============================================================================
// CSV IMPORT
// ============================================================================

/**
 * Import contacts from parsed CSV data
 */
export async function importContacts(
  siteId: string,
  rows: Record<string, string>[],
  fieldMapping: Record<string, string>,
  options: { skipDuplicates?: boolean; updateExisting?: boolean } = {}
): Promise<ImportResult> {
  const supabase = await getModuleClient()
  const { skipDuplicates = true, updateExisting = false } = options
  
  let imported = 0
  let updated = 0
  let skipped = 0
  const errors: { row: number; message: string }[] = []
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    
    try {
      // Map CSV columns to CRM fields
      const contactData: Record<string, unknown> = { site_id: siteId }
      
      for (const [csvCol, crmField] of Object.entries(fieldMapping)) {
        if (row[csvCol] !== undefined && row[csvCol] !== '') {
          contactData[crmField] = row[csvCol]
        }
      }
      
      // Validate required fields
      if (!contactData.email && !contactData.first_name && !contactData.last_name) {
        errors.push({ row: i + 1, message: 'No name or email provided' })
        skipped++
        continue
      }
      
      // Check for duplicates by email
      if (contactData.email && (skipDuplicates || updateExisting)) {
        const { data: existing } = await supabase
          .from(`${TABLE_PREFIX}_contacts`)
          .select('id')
          .eq('site_id', siteId)
          .eq('email', contactData.email)
          .limit(1)
        
        if (existing?.length > 0) {
          if (updateExisting) {
            // Update existing contact
            const { id: _id, site_id: _sid, ...updateData } = contactData
            await supabase
              .from(`${TABLE_PREFIX}_contacts`)
              .update(updateData)
              .eq('site_id', siteId)
              .eq('id', existing[0].id)
            updated++
            continue
          } else if (skipDuplicates) {
            skipped++
            continue
          }
        }
      }
      
      // Set defaults
      contactData.status = contactData.status || 'active'
      contactData.lead_status = contactData.lead_status || 'new'
      contactData.source = contactData.source || 'csv_import'
      contactData.custom_fields = {}
      contactData.tags = contactData.tags ? String(contactData.tags).split(',').map(t => t.trim()) : []
      contactData.lead_score = 0
      
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_contacts`)
        .insert(contactData)
      
      if (error) {
        errors.push({ row: i + 1, message: error.message })
      } else {
        imported++
      }
    } catch (err) {
      errors.push({ row: i + 1, message: err instanceof Error ? err.message : 'Unknown error' })
    }
  }
  
  // Emit automation event for import
  await logAutomationEvent(siteId, 'crm.contacts.imported', {
    imported,
    updated,
    skipped,
    total: rows.length,
    error_count: errors.length,
  }, {
    sourceModule: 'crm',
    sourceEntityType: 'contact',
  }).catch(err => console.error('[CRM] Failed to emit import event:', err))
  
  return { success: errors.length === 0, imported, updated, skipped, errors }
}

// ============================================================================
// FORM CAPTURES
// ============================================================================

/**
 * Get form captures for a site
 */
export async function getFormCaptures(
  siteId: string, 
  options?: { status?: string; formType?: string; limit?: number }
): Promise<FormCapture[]> {
  const supabase = await getModuleClient()
  
  let query = supabase
    .from(`${TABLE_PREFIX}_form_captures`)
    .select(`
      *,
      contact:${TABLE_PREFIX}_contacts(id, first_name, last_name, email)
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.formType) {
    query = query.eq('form_type', options.formType)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  
  if (error) throw new Error(error.message)
  return (data || []) as FormCapture[]
}

// ============================================================================
// 360° CONTACT TIMELINE
// ============================================================================

/**
 * Build a unified timeline for a contact combining:
 * - Activities (calls, emails, meetings, tasks, notes)
 * - Deals (created, stage changed, won, lost)
 * - Form submissions
 * - Notes
 * - Emails sent/received
 */
export async function getContactTimeline(siteId: string, contactId: string): Promise<TimelineEvent[]> {
  const supabase = await getModuleClient()
  
  const [activitiesRes, dealsRes, formCapturesRes, notesRes, emailsRes] = await Promise.all([
    supabase
      .from(`${TABLE_PREFIX}_activities`)
      .select('*')
      .eq('site_id', siteId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false }),
    supabase
      .from(`${TABLE_PREFIX}_deals`)
      .select('*')
      .eq('site_id', siteId)
      .eq('contact_id', contactId),
    supabase
      .from(`${TABLE_PREFIX}_form_captures`)
      .select('*')
      .eq('site_id', siteId)
      .eq('contact_id', contactId),
    supabase
      .from(`${TABLE_PREFIX}_contact_notes`)
      .select('*')
      .eq('site_id', siteId)
      .eq('contact_id', contactId),
    supabase
      .from(`${TABLE_PREFIX}_email_messages`)
      .select('*')
      .eq('site_id', siteId)
      .eq('contact_id', contactId),
  ])
  
  const timeline: TimelineEvent[] = []
  
  // Activities
  for (const activity of (activitiesRes.data || []) as any[]) {
    timeline.push({
      id: activity.id,
      type: 'activity',
      title: activity.subject || `${activity.activity_type} activity`,
      description: activity.description || null,
      metadata: {
        activity_type: activity.activity_type,
        outcome: activity.outcome,
        call_duration: activity.call_duration_seconds,
        task_completed: activity.task_completed,
      },
      created_at: activity.created_at,
      created_by: activity.created_by,
    })
  }
  
  // Deals
  for (const deal of (dealsRes.data || []) as any[]) {
    timeline.push({
      id: `deal-${deal.id}`,
      type: deal.status === 'won' ? 'deal_won' : deal.status === 'lost' ? 'deal_lost' : 'deal_created',
      title: `Deal: ${deal.name}`,
      description: deal.status === 'won' 
        ? `Deal won — ${deal.amount ? `K${(deal.amount / 100).toFixed(2)}` : 'No value'}`
        : deal.status === 'lost' ? `Deal lost — ${deal.close_reason || 'No reason'}`
        : `Deal created — ${deal.amount ? `K${(deal.amount / 100).toFixed(2)}` : 'No value'}`,
      metadata: { deal_id: deal.id, amount: deal.amount, status: deal.status },
      created_at: deal.created_at,
    })
  }
  
  // Form captures
  for (const form of (formCapturesRes.data || []) as any[]) {
    timeline.push({
      id: `form-${form.id}`,
      type: 'form_submission',
      title: `Form: ${form.form_name || form.form_type}`,
      description: `Submitted via ${form.page_url || 'website'}`,
      metadata: { form_type: form.form_type, page_url: form.page_url, form_data: form.form_data },
      created_at: form.created_at,
    })
  }
  
  // Notes
  for (const note of (notesRes.data || []) as any[]) {
    timeline.push({
      id: `note-${note.id}`,
      type: 'note',
      title: note.title || 'Note',
      description: note.content_plain || note.content?.replace(/<[^>]*>/g, '') || null,
      metadata: { is_pinned: note.is_pinned },
      created_at: note.created_at,
      created_by: note.created_by,
    })
  }
  
  // Emails
  for (const email of (emailsRes.data || []) as any[]) {
    timeline.push({
      id: `email-${email.id}`,
      type: email.is_outbound ? 'email_sent' : 'email_received',
      title: `Email: ${email.subject || '(no subject)'}`,
      description: email.is_outbound 
        ? `Sent to ${JSON.stringify(email.to_addresses)}`
        : `Received from ${email.from_address}`,
      metadata: { 
        message_id: email.message_id, 
        is_outbound: email.is_outbound,
        to: email.to_addresses,
      },
      created_at: email.sent_at || email.created_at,
    })
  }
  
  // Sort by date descending
  timeline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  return timeline
}

// ============================================================================
// TEAM MEMBERS (for owner assignment)
// ============================================================================

/**
 * Get team members who can be assigned as contact/deal owners
 */
export async function getTeamMembers(siteId: string): Promise<{ id: string; email: string; name: string }[]> {
  const supabase = await getModuleClient()
  
  // Get the agency_id for this site
  const { data: site } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single()
  
  if (!site?.agency_id) return []
  
  // Get agency members
  const { data: members } = await supabase
    .from('agency_members')
    .select(`
      user_id,
      role,
      users:user_id (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('agency_id', site.agency_id)
  
  if (!members?.length) return []
  
  return members.map((m: any) => ({
    id: m.user_id,
    email: m.users?.email || '',
    name: m.users?.raw_user_meta_data?.full_name || m.users?.email?.split('@')[0] || 'Unknown',
  })).filter((m: { email: string }) => m.email)
}
