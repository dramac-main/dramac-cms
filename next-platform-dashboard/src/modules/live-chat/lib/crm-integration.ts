/**
 * CRM Integration for Live Chat
 *
 * PHASE LC-05: Links chat visitors to CRM contacts and logs chat activity.
 * Server-side utility (not a server action itself).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { ChatVisitor } from '../types'

// =============================================================================
// FIND OR CREATE CRM CONTACT
// =============================================================================

export async function findOrCreateCrmContact(
  siteId: string,
  visitor: ChatVisitor
): Promise<{ contactId: string | null; isNew: boolean; error: string | null }> {
  try {
    const supabase = createAdminClient()

    // Get agency_id for the site
    const { data: site } = await supabase
      .from('sites')
      .select('agency_id')
      .eq('id', siteId)
      .single()

    if (!site?.agency_id) {
      return { contactId: null, isNew: false, error: 'Site not found' }
    }

    const tenantId = site.agency_id

    // Try to find existing CRM contact by email or phone
    let contactId: string | null = null

    if (visitor.email) {
      const { data: existing } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', visitor.email)
        .single()

      if (existing) {
        contactId = existing.id
      }
    }

    if (!contactId && visitor.phone) {
      const { data: existing } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('phone', visitor.phone)
        .single()

      if (existing) {
        contactId = existing.id
      }
    }

    if (!contactId && visitor.whatsappPhone) {
      const { data: existing } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('phone', visitor.whatsappPhone)
        .single()

      if (existing) {
        contactId = existing.id
      }
    }

    // Found existing contact — link it
    if (contactId) {
      await (supabase as any)
        .from('mod_chat_visitors')
        .update({ crm_contact_id: contactId })
        .eq('id', visitor.id)

      return { contactId, isNew: false, error: null }
    }

    // Create new CRM contact
    const { data: newContact, error: createError } = await supabase
      .from('crm_contacts')
      .insert({
        tenant_id: tenantId,
        name: visitor.name || 'Chat Visitor',
        email: visitor.email || null,
        phone: visitor.phone || visitor.whatsappPhone || null,
        source: 'live_chat',
        status: 'lead',
        notes: `Created from live chat conversation.${visitor.whatsappPhone ? ` WhatsApp: ${visitor.whatsappPhone}` : ''}`,
      })
      .select('id')
      .single()

    if (createError || !newContact) {
      return {
        contactId: null,
        isNew: false,
        error: createError?.message || 'Failed to create CRM contact',
      }
    }

    // Link visitor to CRM contact
    await (supabase as any)
      .from('mod_chat_visitors')
      .update({ crm_contact_id: newContact.id })
      .eq('id', visitor.id)

    return { contactId: newContact.id, isNew: true, error: null }
  } catch (err) {
    return {
      contactId: null,
      isNew: false,
      error: err instanceof Error ? err.message : 'CRM integration error',
    }
  }
}

// =============================================================================
// LOG CHAT ACTIVITY
// =============================================================================

export async function logChatActivity(
  siteId: string,
  contactId: string,
  conversationId: string,
  summary: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createAdminClient()

    const { data: site } = await supabase
      .from('sites')
      .select('agency_id')
      .eq('id', siteId)
      .single()

    if (!site?.agency_id) {
      return { success: false, error: 'Site not found' }
    }

    // Insert CRM activity
    await supabase.from('crm_activities').insert({
      tenant_id: site.agency_id,
      contact_id: contactId,
      type: 'chat',
      title: 'Live Chat Conversation',
      description: summary,
      metadata: {
        conversation_id: conversationId,
        source: 'live_chat',
      },
    })

    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to log CRM activity',
    }
  }
}
