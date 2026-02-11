'use server'

/**
 * Social Media Module - Team Permission Actions
 * 
 * Phase EM-54: Social Media Management Module
 * Server actions for managing team permissions and approval workflows
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getRoleDefaults } from '../lib/team-utils'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { 
  TeamPermission, 
  TeamRole, 
  ApprovalWorkflow, 
  ApprovalRequest,
  ApprovalRequestStatus 
} from '../types'

// ============================================================================
// TEAM PERMISSIONS
// ============================================================================

/**
 * Get team permissions for a site
 */
export async function getTeamPermissions(
  siteId: string
): Promise<{ permissions: TeamPermission[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('social_team_permissions')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return { permissions: mapRecords<TeamPermission>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting team permissions:', error)
    return { permissions: [], error: (error as Error).message }
  }
}

/**
 * Get permission for a specific user
 */
export async function getUserPermission(
  siteId: string,
  userId: string
): Promise<{ permission: TeamPermission | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('social_team_permissions')
      .select('*')
      .eq('site_id', siteId)
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    return { permission: data ? mapRecord<TeamPermission>(data) : null, error: null }
  } catch (error) {
    console.error('[Social] Error getting user permission:', error)
    return { permission: null, error: (error as Error).message }
  }
}

/**
 * Create or update team permission
 */
export async function upsertTeamPermission(
  siteId: string,
  userId: string,
  data: {
    role: TeamRole
    canManageAccounts?: boolean
    canConnectAccounts?: boolean
    canCreatePosts?: boolean
    canEditAllPosts?: boolean
    canSchedulePosts?: boolean
    canPublishPosts?: boolean
    canApprovePosts?: boolean
    canDeletePosts?: boolean
    canViewAnalytics?: boolean
    canExportData?: boolean
    canManageInbox?: boolean
    canRespondInbox?: boolean
    canManageCampaigns?: boolean
    canManageTeam?: boolean
    canUseAiFeatures?: boolean
    allowedAccounts?: string[]
    restrictedAccounts?: string[]
  }
): Promise<{ permission: TeamPermission | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get default permissions based on role
    const roleDefaults = getRoleDefaults(data.role)
    
    const { data: permission, error } = await (supabase as any)
      .from('social_team_permissions')
      .upsert({
        site_id: siteId,
        user_id: userId,
        role: data.role,
        can_manage_accounts: data.canManageAccounts ?? roleDefaults.canManageAccounts,
        can_connect_accounts: data.canConnectAccounts ?? roleDefaults.canConnectAccounts,
        can_create_posts: data.canCreatePosts ?? roleDefaults.canCreatePosts,
        can_edit_all_posts: data.canEditAllPosts ?? roleDefaults.canEditAllPosts,
        can_schedule_posts: data.canSchedulePosts ?? roleDefaults.canSchedulePosts,
        can_publish_posts: data.canPublishPosts ?? roleDefaults.canPublishPosts,
        can_approve_posts: data.canApprovePosts ?? roleDefaults.canApprovePosts,
        can_delete_posts: data.canDeletePosts ?? roleDefaults.canDeletePosts,
        can_view_analytics: data.canViewAnalytics ?? roleDefaults.canViewAnalytics,
        can_export_data: data.canExportData ?? roleDefaults.canExportData,
        can_manage_inbox: data.canManageInbox ?? roleDefaults.canManageInbox,
        can_respond_inbox: data.canRespondInbox ?? roleDefaults.canRespondInbox,
        can_manage_campaigns: data.canManageCampaigns ?? roleDefaults.canManageCampaigns,
        can_manage_team: data.canManageTeam ?? roleDefaults.canManageTeam,
        can_use_ai_features: data.canUseAiFeatures ?? roleDefaults.canUseAiFeatures,
        allowed_accounts: data.allowedAccounts || [],
        restricted_accounts: data.restrictedAccounts || [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'site_id,user_id' })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/settings`)
    return { permission: permission ? mapRecord<TeamPermission>(permission) : null, error: null }
  } catch (error) {
    console.error('[Social] Error upserting team permission:', error)
    return { permission: null, error: (error as Error).message }
  }
}

/**
 * Delete team permission
 */
export async function deleteTeamPermission(
  siteId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_team_permissions')
      .delete()
      .eq('site_id', siteId)
      .eq('user_id', userId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/settings`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error deleting team permission:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Check if user has specific permission
 */
export async function checkPermission(
  siteId: string,
  userId: string,
  permission: keyof Omit<TeamPermission, 'id' | 'siteId' | 'userId' | 'role' | 'allowedAccounts' | 'restrictedAccounts' | 'createdAt' | 'updatedAt'>
): Promise<boolean> {
  try {
    const { permission: userPerm } = await getUserPermission(siteId, userId)
    
    if (!userPerm) {
      // No permission record means no access (or check site admin status)
      return false
    }
    
    // Convert camelCase to snake_case for database lookup
    const snakeCase = permission.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    return userPerm[snakeCase as keyof TeamPermission] === true
  } catch {
    return false
  }
}

// ============================================================================
// APPROVAL WORKFLOWS
// ============================================================================

/**
 * Get approval workflows for a site
 */
export async function getApprovalWorkflows(
  siteId: string
): Promise<{ workflows: ApprovalWorkflow[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('social_approval_workflows')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return { workflows: mapRecords<ApprovalWorkflow>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting approval workflows:', error)
    return { workflows: [], error: (error as Error).message }
  }
}

/**
 * Create an approval workflow
 */
export async function createApprovalWorkflow(
  siteId: string,
  tenantId: string,
  userId: string,
  data: {
    name: string
    description?: string
    isDefault?: boolean
    triggerConditions: {
      platforms?: string[]
      containsKeywords?: string[]
      campaignIds?: string[]
      always?: boolean
    }
    steps: Array<{
      order: number
      approvers: string[]
      type: 'any' | 'all'
      timeoutHours: number
    }>
  }
): Promise<{ workflow: ApprovalWorkflow | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await (supabase as any)
        .from('social_approval_workflows')
        .update({ is_default: false })
        .eq('site_id', siteId)
    }
    
    const { data: workflow, error } = await (supabase as any)
      .from('social_approval_workflows')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        name: data.name,
        description: data.description || null,
        is_active: true,
        is_default: data.isDefault || false,
        trigger_conditions: data.triggerConditions,
        steps: data.steps,
        created_by: userId,
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/settings`)
    return { workflow: workflow ? mapRecord<ApprovalWorkflow>(workflow) : null, error: null }
  } catch (error) {
    console.error('[Social] Error creating approval workflow:', error)
    return { workflow: null, error: (error as Error).message }
  }
}

/**
 * Update an approval workflow
 */
export async function updateApprovalWorkflow(
  workflowId: string,
  siteId: string,
  updates: Partial<{
    name: string
    description: string
    isActive: boolean
    isDefault: boolean
    triggerConditions: any
    steps: any[]
  }>
): Promise<{ workflow: ApprovalWorkflow | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // If this is set as default, unset other defaults
    if (updates.isDefault) {
      await (supabase as any)
        .from('social_approval_workflows')
        .update({ is_default: false })
        .eq('site_id', siteId)
    }
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault
    if (updates.triggerConditions !== undefined) updateData.trigger_conditions = updates.triggerConditions
    if (updates.steps !== undefined) updateData.steps = updates.steps
    
    const { data: workflow, error } = await (supabase as any)
      .from('social_approval_workflows')
      .update(updateData)
      .eq('id', workflowId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/settings`)
    return { workflow: workflow ? mapRecord<ApprovalWorkflow>(workflow) : null, error: null }
  } catch (error) {
    console.error('[Social] Error updating approval workflow:', error)
    return { workflow: null, error: (error as Error).message }
  }
}

/**
 * Delete an approval workflow
 */
export async function deleteApprovalWorkflow(
  workflowId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_approval_workflows')
      .delete()
      .eq('id', workflowId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/settings`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error deleting approval workflow:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================================
// APPROVAL REQUESTS
// ============================================================================

/**
 * Get pending approval requests
 */
export async function getPendingApprovals(
  siteId: string,
  options?: {
    approverId?: string
    limit?: number
  }
): Promise<{ requests: any[]; total: number; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get posts pending approval for this site
    let query = (supabase as any)
      .from('social_posts')
      .select(`
        *,
        social_approval_requests!inner(*)
      `, { count: 'exact' })
      .eq('site_id', siteId)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    const { data, count, error } = await query
    
    if (error) throw error
    
    return { requests: mapRecords<any>(data || []), total: count || 0, error: null }
  } catch (error) {
    console.error('[Social] Error getting pending approvals:', error)
    return { requests: [], total: 0, error: (error as Error).message }
  }
}

/**
 * Create an approval request
 */
export async function createApprovalRequest(
  postId: string,
  workflowId: string
): Promise<{ request: ApprovalRequest | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get workflow to determine expiration
    const { data: workflow } = await (supabase as any)
      .from('social_approval_workflows')
      .select('steps')
      .eq('id', workflowId)
      .single()
    
    const firstStep = workflow?.steps?.[0]
    const expiresAt = firstStep?.timeoutHours 
      ? new Date(Date.now() + firstStep.timeoutHours * 60 * 60 * 1000).toISOString()
      : null
    
    const { data: request, error } = await (supabase as any)
      .from('social_approval_requests')
      .insert({
        workflow_id: workflowId,
        post_id: postId,
        status: 'pending',
        current_step: 0,
        expires_at: expiresAt,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { request: request ? mapRecord<ApprovalRequest>(request) : null, error: null }
  } catch (error) {
    console.error('[Social] Error creating approval request:', error)
    return { request: null, error: (error as Error).message }
  }
}

/**
 * Update approval request status
 */
export async function updateApprovalRequest(
  requestId: string,
  userId: string,
  status: ApprovalRequestStatus,
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_approval_requests')
      .update({
        status,
        decided_by: userId,
        decided_at: new Date().toISOString(),
        decision_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error updating approval request:', error)
    return { success: false, error: (error as Error).message }
  }
}
