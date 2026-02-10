/**
 * Agency CRM Stats Server Action
 * 
 * Phase FIX-02 Task 8c: Replace TODO stub with real aggregate queries
 * 
 * Fetches aggregate CRM stats across all sites for an agency
 */
'use server'

import { createClient } from '@/lib/supabase/server'

const CRM_SHORT_ID = 'crmmod01'
const TABLE_PREFIX = `mod_${CRM_SHORT_ID}`

export interface AgencyCRMStats {
  totalContacts: number
  totalCompanies: number
  totalDeals: number
  pipelineValue: number
  dealsWonThisMonth: number
  conversionRate: number
}

export async function getAgencyCRMStats(
  agencyId: string,
  siteIds: string[]
): Promise<AgencyCRMStats> {
  if (!siteIds.length) {
    return {
      totalContacts: 0,
      totalCompanies: 0,
      totalDeals: 0,
      pipelineValue: 0,
      dealsWonThisMonth: 0,
      conversionRate: 0,
    }
  }

  const supabase = (await createClient()) as any

  try {
    // Fetch counts in parallel
    const [contactsRes, companiesRes, dealsRes] = await Promise.all([
      supabase
        .from(`${TABLE_PREFIX}_contacts`)
        .select('id', { count: 'exact', head: true })
        .in('site_id', siteIds),
      supabase
        .from(`${TABLE_PREFIX}_companies`)
        .select('id', { count: 'exact', head: true })
        .in('site_id', siteIds),
      supabase
        .from(`${TABLE_PREFIX}_deals`)
        .select('id, amount, status, closed_at')
        .in('site_id', siteIds),
    ])

    const totalContacts = contactsRes.count ?? 0
    const totalCompanies = companiesRes.count ?? 0
    const allDeals = (dealsRes.data ?? []) as Array<{
      id: string
      amount: number | null
      status: string
      closed_at: string | null
    }>

    const totalDeals = allDeals.filter(d => d.status === 'open').length
    const pipelineValue = allDeals
      .filter(d => d.status === 'open')
      .reduce((sum, d) => sum + (d.amount || 0), 0)

    // Deals won this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const dealsWonThisMonth = allDeals.filter(
      d => d.status === 'won' && d.closed_at && d.closed_at >= startOfMonth
    ).length

    // Conversion rate = won / (won + lost)
    const wonCount = allDeals.filter(d => d.status === 'won').length
    const lostCount = allDeals.filter(d => d.status === 'lost').length
    const conversionRate =
      wonCount + lostCount > 0
        ? Math.round((wonCount / (wonCount + lostCount)) * 100)
        : 0

    return {
      totalContacts,
      totalCompanies,
      totalDeals,
      pipelineValue,
      dealsWonThisMonth,
      conversionRate,
    }
  } catch (error) {
    console.error('Failed to fetch agency CRM stats:', error)
    return {
      totalContacts: 0,
      totalCompanies: 0,
      totalDeals: 0,
      pipelineValue: 0,
      dealsWonThisMonth: 0,
      conversionRate: 0,
    }
  }
}
