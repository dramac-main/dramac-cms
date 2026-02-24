/**
 * CRM Email Server Actions
 * 
 * Send emails from the CRM using Resend (platform's configured email provider).
 * Track email activities, manage templates, and log all communications.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { getResend, isEmailEnabled, getEmailFrom } from '@/lib/email/resend-client'
import { logAutomationEvent } from '@/modules/automation/services/event-processor'
import type { 
  EmailCompose, EmailSendResult, EmailTemplate, EmailMessage, ContactNote
} from '../types/crm-types'

const TABLE_PREFIX = 'mod_crmmod01'

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

// ============================================================================
// SEND EMAIL FROM CRM
// ============================================================================

/**
 * Send an email from the CRM and track it as an activity on the contact
 */
export async function sendCrmEmail(
  siteId: string, 
  email: EmailCompose
): Promise<EmailSendResult> {
  if (!isEmailEnabled()) {
    return { success: false, error: 'Email is not configured. Set RESEND_API_KEY in environment.' }
  }
  
  const resend = getResend()
  if (!resend) {
    return { success: false, error: 'Email service unavailable' }
  }
  
  const supabase = await getModuleClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  try {
    // Send via Resend
    const result = await resend.emails.send({
      from: getEmailFrom(),
      to: email.to,
      cc: email.cc || [],
      bcc: email.bcc || [],
      subject: email.subject,
      html: email.body_html,
      text: email.body_text || email.body_html.replace(/<[^>]*>/g, ''),
    })
    
    const messageId = (result as any)?.data?.id || (result as any)?.id || ''
    
    // Store the email message in CRM
    await supabase
      .from(`${TABLE_PREFIX}_email_messages`)
      .insert({
        site_id: siteId,
        user_id: user?.id || null,
        message_id: messageId,
        contact_id: email.contact_id || null,
        deal_id: email.deal_id || null,
        from_address: getEmailFrom(),
        from_name: 'CRM',
        to_addresses: email.to.map(e => ({ email: e })),
        cc_addresses: (email.cc || []).map(e => ({ email: e })),
        subject: email.subject,
        body_html: email.body_html,
        body_text: email.body_text || null,
        sent_at: new Date().toISOString(),
        is_read: true,
        is_outbound: true,
        has_attachments: false,
      })
    
    // Log as CRM activity on the contact
    if (email.contact_id) {
      await supabase
        .from(`${TABLE_PREFIX}_activities`)
        .insert({
          site_id: siteId,
          activity_type: 'email',
          contact_id: email.contact_id,
          deal_id: email.deal_id || null,
          subject: `Email: ${email.subject}`,
          description: `Sent email to ${email.to.join(', ')}`,
          email_message_id: messageId,
          created_by: user?.id || null,
        })
      
      // Update last_contacted_at
      await supabase
        .from(`${TABLE_PREFIX}_contacts`)
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', email.contact_id)
    }
    
    // Emit automation event
    await logAutomationEvent(siteId, 'crm.email.sent', {
      contact_id: email.contact_id,
      deal_id: email.deal_id,
      to: email.to,
      subject: email.subject,
      message_id: messageId,
    }, {
      sourceModule: 'crm',
      sourceEntityType: 'email',
      sourceEntityId: messageId,
    }).catch(err => console.error('[CRM] Failed to emit email event:', err))
    
    return { success: true, message_id: messageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    console.error('[CRM] Email send error:', error)
    return { success: false, error: message }
  }
}

// ============================================================================
// EMAIL HISTORY
// ============================================================================

/**
 * Get email history for a contact
 */
export async function getContactEmails(siteId: string, contactId: string): Promise<EmailMessage[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_email_messages`)
    .select('*')
    .eq('site_id', siteId)
    .eq('contact_id', contactId)
    .order('sent_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return (data || []) as EmailMessage[]
}

/**
 * Get email history for a deal
 */
export async function getDealEmails(siteId: string, dealId: string): Promise<EmailMessage[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_email_messages`)
    .select('*')
    .eq('site_id', siteId)
    .eq('deal_id', dealId)
    .order('sent_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return (data || []) as EmailMessage[]
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export async function getEmailTemplates(siteId: string): Promise<EmailTemplate[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_email_templates`)
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('name')
  
  if (error) throw new Error(error.message)
  return (data || []) as EmailTemplate[]
}

export async function createEmailTemplate(
  siteId: string, 
  input: { name: string; subject: string; body_html: string; category?: string }
): Promise<EmailTemplate> {
  const supabase = await getModuleClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_email_templates`)
    .insert({
      site_id: siteId,
      name: input.name,
      subject: input.subject,
      body_html: input.body_html,
      category: input.category || 'general',
      is_active: true,
      created_by: user?.id || null,
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as EmailTemplate
}

export async function updateEmailTemplate(
  siteId: string,
  id: string,
  input: Partial<{ name: string; subject: string; body_html: string; category: string; is_active: boolean }>
): Promise<EmailTemplate> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_email_templates`)
    .update(input)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as EmailTemplate
}

export async function deleteEmailTemplate(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_email_templates`)
    .update({ is_active: false })
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// CONTACT NOTES (Rich Text)
// ============================================================================

export async function getContactNotes(
  siteId: string, 
  entityId: string, 
  entityType: 'contact' | 'company' | 'deal' = 'contact'
): Promise<ContactNote[]> {
  const supabase = await getModuleClient()
  
  const fieldName = entityType === 'contact' ? 'contact_id' 
    : entityType === 'company' ? 'company_id' 
    : 'deal_id'
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_contact_notes`)
    .select('*')
    .eq('site_id', siteId)
    .eq(fieldName, entityId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return (data || []) as ContactNote[]
}

export async function createContactNote(
  siteId: string,
  input: Partial<Omit<ContactNote, 'id' | 'created_at' | 'updated_at'>>
): Promise<ContactNote> {
  const supabase = await getModuleClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_contact_notes`)
    .insert({
      site_id: siteId,
      contact_id: input.contact_id || null,
      company_id: input.company_id || null,
      deal_id: input.deal_id || null,
      title: input.title || null,
      content: input.content || '',
      content_plain: input.content_plain || input.content?.replace(/<[^>]*>/g, '') || '',
      is_pinned: input.is_pinned ?? false,
      created_by: user?.id || null,
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as ContactNote
}

export async function updateContactNote(
  siteId: string,
  id: string,
  input: Partial<{ title: string; content: string; content_plain: string; is_pinned: boolean }>
): Promise<ContactNote> {
  const supabase = await getModuleClient()
  
  const updateData: Record<string, unknown> = { ...input }
  if (input.content) {
    updateData.content_plain = input.content.replace(/<[^>]*>/g, '')
  }
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_contact_notes`)
    .update(updateData)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as ContactNote
}

export async function deleteContactNote(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_contact_notes`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}
