/**
 * CRM Form Capture API Route
 * 
 * PUBLIC endpoint (no auth required) that receives form submissions
 * from websites and creates CRM contacts automatically.
 * 
 * This is what industry leaders like HubSpot do:
 * Website Form → API → CRM Contact → Automation Trigger
 * 
 * Supports: Contact Forms, Newsletter Signups, Lead Capture Forms
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 30

const TABLE_PREFIX = 'mod_crmmod01'

// ============================================================================
// CORS HEADERS (forms submit from external sites)
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Site-ID',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// ============================================================================
// POST - Receive Form Submission
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      siteId,
      formType = 'contact',
      formName,
      pageUrl,
      // Contact fields
      name,
      firstName,
      first_name,
      lastName,
      last_name,
      email,
      phone,
      mobile,
      company,
      companyName,
      company_name,
      jobTitle,
      job_title,
      subject,
      message,
      // Newsletter
      subscribeEmail,
      // UTM tracking
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      referrer,
      // All other fields go into form_data
      ...otherFields
    } = body
    
    // Validate required fields
    if (!siteId) {
      return NextResponse.json(
        { success: false, error: 'siteId is required' },
        { status: 400, headers: CORS_HEADERS }
      )
    }
    
    const contactEmail = email || subscribeEmail || ''
    if (!contactEmail && !name && !firstName && !first_name) {
      return NextResponse.json(
        { success: false, error: 'At least an email or name is required' },
        { status: 400, headers: CORS_HEADERS }
      )
    }
    
    // Basic spam check
    if (isSpam(body)) {
      // Silently accept to not tip off spammers
      return NextResponse.json(
        { success: true, message: 'Form submitted successfully' },
        { status: 200, headers: CORS_HEADERS }
      )
    }
    
    const supabase = createAdminClient() as any
    
    // Verify site exists
    const { data: site } = await supabase
      .from('sites')
      .select('id, agency_id')
      .eq('id', siteId)
      .single()
    
    if (!site) {
      return NextResponse.json(
        { success: false, error: 'Invalid site' },
        { status: 404, headers: CORS_HEADERS }
      )
    }
    
    // Parse name
    const resolvedFirstName = firstName || first_name || (name ? name.split(' ')[0] : '') || ''
    const resolvedLastName = lastName || last_name || (name ? name.split(' ').slice(1).join(' ') : '') || ''
    const resolvedCompany = company || companyName || company_name || ''
    const resolvedJobTitle = jobTitle || job_title || ''
    
    // Check for existing contact by email
    let contactId: string | null = null
    let isNewContact = true
    let formCaptureStatus = 'processed'
    
    if (contactEmail) {
      const { data: existing } = await supabase
        .from(`${TABLE_PREFIX}_contacts`)
        .select('id')
        .eq('site_id', siteId)
        .eq('email', contactEmail.toLowerCase().trim())
        .limit(1)
      
      if (existing?.length > 0) {
        contactId = existing[0].id
        isNewContact = false
        formCaptureStatus = 'duplicate'
        
        // Update contact with any new info
        const updateData: Record<string, unknown> = {}
        if (resolvedFirstName && !existing[0].first_name) updateData.first_name = resolvedFirstName
        if (resolvedLastName && !existing[0].last_name) updateData.last_name = resolvedLastName
        if (phone && !existing[0].phone) updateData.phone = phone
        
        if (Object.keys(updateData).length > 0) {
          await supabase
            .from(`${TABLE_PREFIX}_contacts`)
            .update(updateData)
            .eq('id', contactId)
        }
      }
    }
    
    // Create new contact if not found
    if (!contactId) {
      const { data: newContact, error: contactError } = await supabase
        .from(`${TABLE_PREFIX}_contacts`)
        .insert({
          site_id: siteId,
          first_name: resolvedFirstName || null,
          last_name: resolvedLastName || null,
          email: contactEmail ? contactEmail.toLowerCase().trim() : null,
          phone: phone || mobile || null,
          mobile: mobile || null,
          job_title: resolvedJobTitle || null,
          status: 'active',
          lead_status: 'new',
          source: formType === 'newsletter' ? 'newsletter' : 'website_form',
          source_details: formName || pageUrl || null,
          custom_fields: {},
          tags: formType === 'newsletter' ? ['newsletter'] : ['website-lead'],
          lead_score: 0,
        })
        .select('id')
        .single()
      
      if (contactError) {
        console.error('[CRM Form Capture] Error creating contact:', contactError)
        return NextResponse.json(
          { success: false, error: 'Failed to save contact' },
          { status: 500, headers: CORS_HEADERS }
        )
      }
      
      contactId = newContact.id
      formCaptureStatus = 'processed'
    }
    
    // Store form capture record
    const formData: Record<string, unknown> = {
      name: name || `${resolvedFirstName} ${resolvedLastName}`.trim(),
      email: contactEmail,
      phone: phone || mobile || '',
      company: resolvedCompany,
      job_title: resolvedJobTitle,
      subject: subject || '',
      message: message || '',
      ...otherFields,
    }
    
    await supabase
      .from(`${TABLE_PREFIX}_form_captures`)
      .insert({
        site_id: siteId,
        form_type: formType,
        form_name: formName || null,
        page_url: pageUrl || null,
        form_data: formData,
        contact_id: contactId,
        status: formCaptureStatus,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        referrer_url: referrer || null,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      })
    
    // Create an activity note on the contact
    if (contactId && message) {
      await supabase
        .from(`${TABLE_PREFIX}_activities`)
        .insert({
          site_id: siteId,
          activity_type: 'note',
          contact_id: contactId,
          subject: subject ? `Form: ${subject}` : `Website Form Submission`,
          description: message,
        })
    }
    
    // Trigger automation event
    try {
      // We can't use logAutomationEvent directly in API routes easily,
      // so we'll insert into the automation_events_log directly
      await supabase
        .from('automation_events_log')
        .insert({
          site_id: siteId,
          event_type: isNewContact ? 'crm.contact.created' : 'crm.form.submitted',
          payload: {
            contact_id: contactId,
            form_type: formType,
            form_name: formName,
            email: contactEmail,
            first_name: resolvedFirstName,
            last_name: resolvedLastName,
            source: 'website_form',
            is_new_contact: isNewContact,
          },
          source_module: 'crm',
          source_entity_type: 'form_capture',
          status: 'pending',
        })
    } catch (automationError) {
      console.error('[CRM Form Capture] Automation event error:', automationError)
    }
    
    // Also save to the platform's form_submissions table for backward compat
    try {
      await supabase
        .from('form_submissions')
        .insert({
          site_id: siteId,
          form_id: formName || 'crm-contact-form',
          data: formData,
          status: 'new',
          source_url: pageUrl || null,
        })
    } catch {
      // Non-critical — CRM form capture is the primary record
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Form submitted successfully',
        contactId: contactId,
        isNew: isNewContact,
      },
      { status: 200, headers: CORS_HEADERS }
    )
    
  } catch (error) {
    console.error('[CRM Form Capture] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

// ============================================================================
// SPAM DETECTION
// ============================================================================

function isSpam(data: Record<string, unknown>): boolean {
  const text = JSON.stringify(data).toLowerCase()
  
  // Honeypot field check
  if (data.website_url_hp || data.fax_number || data.honeypot) return true
  
  // Common spam patterns
  const spamPatterns = [
    /\b(viagra|cialis|pharmacy|casino|poker|lottery|crypto\s*invest)\b/i,
    /\b(buy\s*now|free\s*money|click\s*here|act\s*now|limited\s*time)\b/i,
    /https?:\/\/[^\s]+\.(ru|cn|tk|ml|ga|cf)\b/i,
  ]
  
  for (const pattern of spamPatterns) {
    if (pattern.test(text)) return true
  }
  
  // Too many URLs
  const urlCount = (text.match(/https?:\/\//g) || []).length
  if (urlCount > 3) return true
  
  return false
}
