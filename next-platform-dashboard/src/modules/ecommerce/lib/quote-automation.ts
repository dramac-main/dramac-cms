/**
 * Quote Automation Utilities
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * Functions for automated quote management (cron jobs)
 */

import { createClient } from '@/lib/supabase/server'
import { sendBrandedEmail } from '@/lib/email/send-branded-email'
import { addDays, differenceInDays } from 'date-fns'
import type { Quote } from '../types/ecommerce-types'

const TABLE_PREFIX = 'mod_ecommod01'

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

// ============================================================================
// TYPES
// ============================================================================

export interface AutomationResult {
  processed: number
  expired: number
  reminders_sent: number
  errors: string[]
}

export interface QuoteDue {
  quote: Quote
  days_until_expiry: number
  reminder_number: number
}

// ============================================================================
// AUTO-EXPIRATION
// ============================================================================

/**
 * Process expired quotes for a site
 * Should be called by a cron job daily
 */
export async function processExpiredQuotes(siteId: string): Promise<{ expired: number }> {
  try {
    const supabase = await getModuleClient()
    const now = new Date()
    
    // Find quotes that should be expired
    const { data: quotes, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id, quote_number')
      .eq('site_id', siteId)
      .in('status', ['sent', 'viewed'])
      .lt('valid_until', now.toISOString())
    
    if (error || !quotes || quotes.length === 0) {
      return { expired: 0 }
    }
    
    // Update each to expired
    for (const quote of quotes) {
      await supabase
        .from(`${TABLE_PREFIX}_quotes`)
        .update({ 
          status: 'expired',
          updated_at: now.toISOString()
        })
        .eq('id', quote.id)
      
      // Log activity
      await supabase.from(`${TABLE_PREFIX}_quote_activity`).insert({
        quote_id: quote.id,
        activity_type: 'expired',
        description: 'Quote expired automatically'
      })
    }
    
    return { expired: quotes.length }
  } catch (error) {
    console.error('Error processing expired quotes:', error)
    return { expired: 0 }
  }
}

// ============================================================================
// AUTO-REMINDERS
// ============================================================================

/**
 * Get quotes due for reminders
 */
export async function getQuotesDueForReminder(
  siteId: string,
  daysBefore: number = 3,
  maxReminders: number = 2
): Promise<QuoteDue[]> {
  try {
    const supabase = await getModuleClient()
    const now = new Date()
    const reminderDate = addDays(now, daysBefore)
    
    // Get quotes that:
    // 1. Are sent or viewed
    // 2. Have valid_until within reminder window
    // 3. Haven't exceeded max reminders
    const { data: quotes, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('site_id', siteId)
      .in('status', ['sent', 'viewed'])
      .lt('reminder_count', maxReminders)
      .lte('valid_until', reminderDate.toISOString())
      .gt('valid_until', now.toISOString())
    
    if (error || !quotes) {
      return []
    }
    
    return (quotes as Quote[])
      .filter((quote: Quote) => quote.valid_until != null)
      .map((quote: Quote) => ({
        quote,
        days_until_expiry: differenceInDays(new Date(quote.valid_until!), now),
        reminder_number: (quote.reminder_count || 0) + 1
      }))
  } catch (error) {
    console.error('Error getting quotes due for reminder:', error)
    return []
  }
}

/**
 * Process reminders for a site
 * Should be called by a cron job daily
 */
export async function processQuoteReminders(siteId: string): Promise<{ sent: number }> {
  try {
    const supabase = await getModuleClient()
    
    // Get settings
    const { data: settings } = await supabase
      .from(`${TABLE_PREFIX}_quote_settings`)
      .select('*')
      .eq('site_id', siteId)
      .single()
    
    if (!settings?.auto_reminder_enabled) {
      return { sent: 0 }
    }
    
    const quotesToRemind = await getQuotesDueForReminder(
      siteId,
      settings.reminder_days_before,
      settings.max_reminders
    )
    
    let sent = 0
    
    for (const { quote, reminder_number } of quotesToRemind) {
      // Update reminder count
      await supabase
        .from(`${TABLE_PREFIX}_quotes`)
        .update({
          reminder_count: reminder_number,
          last_reminder_at: new Date().toISOString()
        })
        .eq('id', quote.id)
      
      // Log activity
      await supabase.from(`${TABLE_PREFIX}_quote_activity`).insert({
        quote_id: quote.id,
        activity_type: 'reminder_sent',
        description: `Automatic reminder #${reminder_number} sent`
      })
      
      // Send reminder email
      const portalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/quote/${quote.access_token}`
      const totalAmount = quote.total || 0
      const formatted = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: quote.currency || 'ZMW' }).format(totalAmount)

      await sendBrandedEmail(quote.agency_id || null, {
        to: { email: quote.customer_email, name: quote.customer_name || undefined },
        emailType: 'quote_reminder_customer',
        data: {
          customerName: quote.customer_name || 'Customer',
          quoteNumber: quote.quote_number,
          message: `This is reminder #${reminder_number} for your pending quote.`,
          totalAmount: formatted,
          expiryDate: quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('en-ZM') : undefined,
          viewQuoteUrl: portalUrl,
          businessName: '',
        },
      })
      
      sent++
    }
    
    return { sent }
  } catch (error) {
    console.error('Error processing reminders:', error)
    return { sent: 0 }
  }
}

// ============================================================================
// FULL AUTOMATION RUN
// ============================================================================

/**
 * Run all automation tasks for a site
 * Should be called by a daily cron job
 */
export async function runQuoteAutomation(siteId: string): Promise<AutomationResult> {
  const result: AutomationResult = {
    processed: 0,
    expired: 0,
    reminders_sent: 0,
    errors: []
  }
  
  try {
    // Process expirations
    const expireResult = await processExpiredQuotes(siteId)
    result.expired = expireResult.expired
    result.processed += expireResult.expired
  } catch (error) {
    result.errors.push(`Expiration error: ${error}`)
  }
  
  try {
    // Process reminders
    const reminderResult = await processQuoteReminders(siteId)
    result.reminders_sent = reminderResult.sent
    result.processed += reminderResult.sent
  } catch (error) {
    result.errors.push(`Reminder error: ${error}`)
  }
  
  return result
}

// ============================================================================
// SCHEDULED FOLLOW-UPS
// ============================================================================

/**
 * Get quotes that need follow-up
 * - Sent but not viewed after X days
 * - Viewed but no response after X days
 */
export async function getQuotesNeedingFollowUp(
  siteId: string,
  daysWithoutView: number = 3,
  daysWithoutResponse: number = 7
): Promise<{ notViewed: Quote[]; noResponse: Quote[] }> {
  try {
    const supabase = await getModuleClient()
    const now = new Date()
    
    // Quotes sent but not viewed
    const viewCutoff = addDays(now, -daysWithoutView)
    const { data: notViewed } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('site_id', siteId)
      .eq('status', 'sent')
      .lt('sent_at', viewCutoff.toISOString())
    
    // Quotes viewed but no response
    const responseCutoff = addDays(now, -daysWithoutResponse)
    const { data: noResponse } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('site_id', siteId)
      .eq('status', 'viewed')
      .lt('first_viewed_at', responseCutoff.toISOString())
    
    return {
      notViewed: notViewed || [],
      noResponse: noResponse || []
    }
  } catch (error) {
    console.error('Error getting quotes needing follow-up:', error)
    return { notViewed: [], noResponse: [] }
  }
}
