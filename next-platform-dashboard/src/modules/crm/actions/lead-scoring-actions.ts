/**
 * CRM Lead Scoring Server Actions
 * 
 * Automatic lead scoring engine that evaluates contacts against
 * configurable rules and assigns scores automatically.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { 
  Contact, LeadScoringRule, LeadScoringRuleInput, LeadScoringRuleUpdate,
  ScoringCondition
} from '../types/crm-types'

const TABLE_PREFIX = 'mod_crmmod01'

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

// ============================================================================
// LEAD SCORING RULES CRUD
// ============================================================================

export async function getLeadScoringRules(siteId: string): Promise<LeadScoringRule[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_lead_scoring_rules`)
    .select('*')
    .eq('site_id', siteId)
    .order('priority', { ascending: false })
  
  if (error) throw new Error(error.message)
  return (data || []) as LeadScoringRule[]
}

export async function createLeadScoringRule(
  siteId: string, 
  input: Partial<LeadScoringRuleInput>
): Promise<LeadScoringRule> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_lead_scoring_rules`)
    .insert({
      site_id: siteId,
      name: input.name || 'New Rule',
      description: input.description || null,
      category: input.category || 'demographic',
      condition: input.condition || { field: 'email', operator: 'is_not_empty', value: null },
      points: input.points ?? 10,
      max_applications: input.max_applications ?? 1,
      is_active: input.is_active ?? true,
      priority: input.priority ?? 0,
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as LeadScoringRule
}

export async function updateLeadScoringRule(
  siteId: string, 
  id: string, 
  input: LeadScoringRuleUpdate
): Promise<LeadScoringRule> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_lead_scoring_rules`)
    .update(input)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as LeadScoringRule
}

export async function deleteLeadScoringRule(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_lead_scoring_rules`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// LEAD SCORE CALCULATION ENGINE
// ============================================================================

/**
 * Calculate the lead score for a single contact based on all active rules
 */
export async function calculateContactScore(
  siteId: string, 
  contactId: string
): Promise<{ score: number; breakdown: { rule: string; points: number }[] }> {
  const supabase = await getModuleClient()
  
  // Get the contact
  const { data: contact } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', contactId)
    .single()
  
  if (!contact) throw new Error('Contact not found')
  
  // Get active rules
  const { data: rules } = await supabase
    .from(`${TABLE_PREFIX}_lead_scoring_rules`)
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('priority', { ascending: false })
  
  if (!rules?.length) return { score: 0, breakdown: [] }
  
  // Get related data for behavioral scoring
  const [activitiesRes, dealsRes, formCapturesRes] = await Promise.all([
    supabase
      .from(`${TABLE_PREFIX}_activities`)
      .select('activity_type, created_at')
      .eq('site_id', siteId)
      .eq('contact_id', contactId),
    supabase
      .from(`${TABLE_PREFIX}_deals`)
      .select('status, amount')
      .eq('site_id', siteId)
      .eq('contact_id', contactId),
    supabase
      .from(`${TABLE_PREFIX}_form_captures`)
      .select('form_type, created_at')
      .eq('site_id', siteId)
      .eq('contact_id', contactId),
  ])
  
  const activities = activitiesRes.data || []
  const deals = dealsRes.data || []
  const formCaptures = formCapturesRes.data || []
  
  // Build enriched contact data for evaluation
  const enrichedContact: Record<string, unknown> = {
    ...contact,
    // Behavioral metrics
    activity_count: activities.length,
    call_count: activities.filter((a: any) => a.activity_type === 'call').length,
    email_count: activities.filter((a: any) => a.activity_type === 'email').length,
    meeting_count: activities.filter((a: any) => a.activity_type === 'meeting').length,
    deal_count: deals.length,
    open_deal_count: deals.filter((d: any) => d.status === 'open').length,
    won_deal_count: deals.filter((d: any) => d.status === 'won').length,
    total_deal_value: deals.reduce((sum: number, d: any) => sum + (d.amount || 0), 0),
    form_submission_count: formCaptures.length,
    has_email: !!contact.email,
    has_phone: !!contact.phone || !!contact.mobile,
    has_company: !!contact.company_id,
    tag_count: (contact.tags || []).length,
    days_since_created: Math.floor((Date.now() - new Date(contact.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    days_since_last_contact: contact.last_contacted_at
      ? Math.floor((Date.now() - new Date(contact.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999,
  }
  
  // Evaluate each rule
  const breakdown: { rule: string; points: number }[] = []
  let totalScore = 0
  
  for (const rule of rules as LeadScoringRule[]) {
    if (evaluateCondition(enrichedContact, rule.condition)) {
      breakdown.push({ rule: rule.name, points: rule.points })
      totalScore += rule.points
    }
  }
  
  // Clamp score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, totalScore))
  
  // Update the contact's lead score
  await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .update({ lead_score: finalScore })
    .eq('site_id', siteId)
    .eq('id', contactId)
  
  return { score: finalScore, breakdown }
}

/**
 * Recalculate lead scores for ALL contacts in a site
 */
export async function recalculateAllScores(siteId: string): Promise<{ processed: number; updated: number }> {
  const supabase = await getModuleClient()
  
  const { data: contacts } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select('id')
    .eq('site_id', siteId)
  
  if (!contacts?.length) return { processed: 0, updated: 0 }
  
  let updated = 0
  for (const contact of contacts) {
    try {
      await calculateContactScore(siteId, contact.id)
      updated++
    } catch (err) {
      console.error(`Failed to score contact ${contact.id}:`, err)
    }
  }
  
  return { processed: contacts.length, updated }
}

/**
 * Get pre-built scoring rule templates for common scenarios
 */
export async function getLeadScoringTemplates(): Promise<Partial<LeadScoringRuleInput>[]> {
  return [
    {
      name: 'Has Email Address',
      description: 'Contact has provided an email address',
      category: 'demographic',
      condition: { field: 'has_email', operator: 'is_true', value: null },
      points: 10,
      priority: 10,
    },
    {
      name: 'Has Phone Number',
      description: 'Contact has provided a phone number',
      category: 'demographic',
      condition: { field: 'has_phone', operator: 'is_true', value: null },
      points: 5,
      priority: 9,
    },
    {
      name: 'Associated with Company',
      description: 'Contact is linked to a company record',
      category: 'firmographic',
      condition: { field: 'has_company', operator: 'is_true', value: null },
      points: 15,
      priority: 8,
    },
    {
      name: 'Has Open Deal',
      description: 'Contact has at least one open deal',
      category: 'behavioral',
      condition: { field: 'open_deal_count', operator: 'greater_than', value: 0 },
      points: 25,
      priority: 7,
    },
    {
      name: 'Won a Deal',
      description: 'Contact has won deals (existing customer)',
      category: 'behavioral',
      condition: { field: 'won_deal_count', operator: 'greater_than', value: 0 },
      points: 30,
      priority: 6,
    },
    {
      name: 'High Activity (5+ interactions)',
      description: 'Contact has had 5 or more activities logged',
      category: 'engagement',
      condition: { field: 'activity_count', operator: 'greater_or_equal', value: 5 },
      points: 20,
      priority: 5,
    },
    {
      name: 'Submitted Form',
      description: 'Contact submitted at least one form on the website',
      category: 'engagement',
      condition: { field: 'form_submission_count', operator: 'greater_than', value: 0 },
      points: 15,
      priority: 4,
    },
    {
      name: 'Qualified Lead',
      description: 'Contact marked as qualified',
      category: 'demographic',
      condition: { field: 'lead_status', operator: 'equals', value: 'qualified' },
      points: 20,
      priority: 3,
    },
    {
      name: 'Inactive (30+ days no contact)',
      description: 'Contact has not been contacted in 30+ days (score decay)',
      category: 'engagement',
      condition: { field: 'days_since_last_contact', operator: 'greater_than', value: 30 },
      points: -10,
      priority: 2,
    },
    {
      name: 'Unqualified Lead',
      description: 'Contact marked as unqualified (negative score)',
      category: 'demographic',
      condition: { field: 'lead_status', operator: 'equals', value: 'unqualified' },
      points: -20,
      priority: 1,
    },
  ]
}

// ============================================================================
// CONDITION EVALUATION HELPERS
// ============================================================================

function evaluateCondition(data: Record<string, unknown>, condition: ScoringCondition): boolean {
  const { field, operator, value } = condition
  const fieldValue = data[field]
  
  switch (operator) {
    case 'equals':
      return String(fieldValue ?? '') === String(value ?? '')
    case 'not_equals':
      return String(fieldValue ?? '') !== String(value ?? '')
    case 'contains':
      return String(fieldValue ?? '').toLowerCase().includes(String(value ?? '').toLowerCase())
    case 'not_contains':
      return !String(fieldValue ?? '').toLowerCase().includes(String(value ?? '').toLowerCase())
    case 'greater_than':
      return Number(fieldValue || 0) > Number(value || 0)
    case 'less_than':
      return Number(fieldValue || 0) < Number(value || 0)
    case 'greater_or_equal':
      return Number(fieldValue || 0) >= Number(value || 0)
    case 'less_or_equal':
      return Number(fieldValue || 0) <= Number(value || 0)
    case 'is_empty':
      return !fieldValue || fieldValue === ''
    case 'is_not_empty':
      return !!fieldValue && fieldValue !== ''
    case 'is_true':
      return fieldValue === true || fieldValue === 'true' || fieldValue === 1
    case 'is_false':
      return fieldValue === false || fieldValue === 'false' || fieldValue === 0 || !fieldValue
    case 'in':
      return Array.isArray(value) && value.includes(String(fieldValue ?? ''))
    case 'not_in':
      return Array.isArray(value) && !value.includes(String(fieldValue ?? ''))
    default:
      return false
  }
}
