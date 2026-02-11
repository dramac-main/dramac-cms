'use server'

/**
 * Social Media Module - Report Actions
 * 
 * Phase SM-07/SM-08: Reports Engine
 * Server actions for report management and generation
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { Report, ReportType } from '../types'

// ============================================================================
// REPORT CRUD
// ============================================================================

/**
 * Get all reports for a site
 */
export async function getReports(
  siteId: string
): Promise<{ reports: Report[]; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('social_reports')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { reports: mapRecords<Report>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting reports:', error)
    return { reports: [], error: (error as Error).message }
  }
}

/**
 * Get a single report
 */
export async function getReport(
  reportId: string
): Promise<{ report: Report | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('social_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (error) throw error

    return { report: data ? mapRecord<Report>(data) : null, error: null }
  } catch (error) {
    console.error('[Social] Error getting report:', error)
    return { report: null, error: (error as Error).message }
  }
}

/**
 * Create a new report
 */
export async function createReport(
  siteId: string,
  tenantId: string,
  userId: string,
  data: {
    name: string
    description?: string
    reportType: ReportType
    metrics?: string[]
    filters?: Record<string, unknown>
    dateRangeType?: string
    accountIds?: string[]
  }
): Promise<{ report: Report | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: report, error } = await (supabase as any)
      .from('social_reports')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        name: data.name,
        description: data.description || null,
        report_type: data.reportType,
        metrics: data.metrics || [],
        filters: data.filters || {},
        date_range_type: data.dateRangeType || '30d',
        account_ids: data.accountIds || [],
        is_scheduled: false,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/reports`)
    return { report: report ? mapRecord<Report>(report) : null, error: null }
  } catch (error) {
    console.error('[Social] Error creating report:', error)
    return { report: null, error: (error as Error).message }
  }
}

/**
 * Update a report
 */
export async function updateReport(
  reportId: string,
  siteId: string,
  updates: Partial<{
    name: string
    description: string
    reportType: ReportType
    metrics: string[]
    filters: Record<string, unknown>
    dateRangeType: string
    accountIds: string[]
    isScheduled: boolean
    scheduleFrequency: string
    scheduleDay: number
    scheduleTime: string
    scheduleRecipients: string[]
  }>
): Promise<{ report: Report | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.reportType !== undefined) updateData.report_type = updates.reportType
    if (updates.metrics !== undefined) updateData.metrics = updates.metrics
    if (updates.filters !== undefined) updateData.filters = updates.filters
    if (updates.dateRangeType !== undefined) updateData.date_range_type = updates.dateRangeType
    if (updates.accountIds !== undefined) updateData.account_ids = updates.accountIds
    if (updates.isScheduled !== undefined) updateData.is_scheduled = updates.isScheduled
    if (updates.scheduleFrequency !== undefined) updateData.schedule_frequency = updates.scheduleFrequency
    if (updates.scheduleDay !== undefined) updateData.schedule_day = updates.scheduleDay
    if (updates.scheduleTime !== undefined) updateData.schedule_time = updates.scheduleTime
    if (updates.scheduleRecipients !== undefined) updateData.schedule_recipients = updates.scheduleRecipients

    const { data: report, error } = await (supabase as any)
      .from('social_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/reports`)
    return { report: report ? mapRecord<Report>(report) : null, error: null }
  } catch (error) {
    console.error('[Social] Error updating report:', error)
    return { report: null, error: (error as Error).message }
  }
}

/**
 * Delete a report
 */
export async function deleteReport(
  reportId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('social_reports')
      .delete()
      .eq('id', reportId)

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/reports`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error deleting report:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Duplicate a report
 */
export async function duplicateReport(
  reportId: string,
  siteId: string
): Promise<{ report: Report | null; error: string | null }> {
  try {
    const supabase = await createClient()

    // Get original report
    const { data: original, error: fetchError } = await (supabase as any)
      .from('social_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (fetchError) throw fetchError
    if (!original) throw new Error('Report not found')

    // Create copy
    const { data: report, error } = await (supabase as any)
      .from('social_reports')
      .insert({
        site_id: original.site_id,
        tenant_id: original.tenant_id,
        name: `${original.name} (Copy)`,
        description: original.description,
        report_type: original.report_type,
        metrics: original.metrics,
        filters: original.filters,
        date_range_type: original.date_range_type,
        account_ids: original.account_ids,
        is_scheduled: false,
        created_by: original.created_by,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/reports`)
    return { report: report ? mapRecord<Report>(report) : null, error: null }
  } catch (error) {
    console.error('[Social] Error duplicating report:', error)
    return { report: null, error: (error as Error).message }
  }
}
