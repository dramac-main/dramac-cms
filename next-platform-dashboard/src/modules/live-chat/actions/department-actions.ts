'use server'

/**
 * Live Chat Module — Department Actions
 *
 * Server actions for department CRUD and management.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { ChatDepartment } from '../types'

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

function liveChatPath(siteId: string) {
  return `/dashboard/sites/${siteId}/live-chat`
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getDepartments(
  siteId: string
): Promise<{ departments: (ChatDepartment & { agentCount: number })[]; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_departments')
      .select('*')
      .eq('site_id', siteId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    const departments = mapRecords<ChatDepartment>(data || [])

    // Get agent counts per department
    const result: (ChatDepartment & { agentCount: number })[] = []

    for (const dept of departments) {
      const { count } = await supabase
        .from('mod_chat_agents')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', dept.id)
        .eq('is_active', true)

      result.push({ ...dept, agentCount: count || 0 })
    }

    return { departments: result, error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting departments:', error)
    return { departments: [], error: (error as Error).message }
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createDepartment(data: {
  siteId: string
  name: string
  description?: string
  autoAssign?: boolean
  maxConcurrentChats?: number
}): Promise<{ department: ChatDepartment | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    // Check if this is the first department (make it default)
    const { count } = await supabase
      .from('mod_chat_departments')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', data.siteId)

    const isFirst = (count || 0) === 0

    const insertData: Record<string, unknown> = {
      site_id: data.siteId,
      name: data.name,
      is_default: isFirst,
      auto_assign: data.autoAssign ?? true,
      max_concurrent_chats: data.maxConcurrentChats ?? 5,
    }

    if (data.description) insertData.description = data.description

    const { data: deptData, error } = await supabase
      .from('mod_chat_departments')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    revalidatePath(liveChatPath(data.siteId))
    return { department: mapRecord<ChatDepartment>(deptData), error: null }
  } catch (error) {
    console.error('[LiveChat] Error creating department:', error)
    return { department: null, error: (error as Error).message }
  }
}

export async function updateDepartment(
  departmentId: string,
  data: {
    name?: string
    description?: string
    isActive?: boolean
    autoAssign?: boolean
    maxConcurrentChats?: number
    sortOrder?: number
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const updates: Record<string, unknown> = {}

    if (data.name !== undefined) updates.name = data.name
    if (data.description !== undefined) updates.description = data.description
    if (data.isActive !== undefined) updates.is_active = data.isActive
    if (data.autoAssign !== undefined) updates.auto_assign = data.autoAssign
    if (data.maxConcurrentChats !== undefined) updates.max_concurrent_chats = data.maxConcurrentChats
    if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder

    const { data: dept } = await supabase
      .from('mod_chat_departments')
      .select('site_id')
      .eq('id', departmentId)
      .single()

    const { error } = await supabase
      .from('mod_chat_departments')
      .update(updates)
      .eq('id', departmentId)

    if (error) throw error

    if (dept) revalidatePath(liveChatPath(dept.site_id))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating department:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteDepartment(
  departmentId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    // Check if default
    const { data: dept } = await supabase
      .from('mod_chat_departments')
      .select('site_id, is_default')
      .eq('id', departmentId)
      .single()

    if (!dept) return { success: false, error: 'Department not found' }
    if (dept.is_default) return { success: false, error: 'Cannot delete the default department' }

    // Get default department to reassign agents
    const { data: defaultDept } = await supabase
      .from('mod_chat_departments')
      .select('id')
      .eq('site_id', dept.site_id)
      .eq('is_default', true)
      .single()

    // Move agents to default department
    if (defaultDept) {
      await supabase
        .from('mod_chat_agents')
        .update({ department_id: defaultDept.id })
        .eq('department_id', departmentId)
    }

    // Delete department
    const { error } = await supabase
      .from('mod_chat_departments')
      .delete()
      .eq('id', departmentId)

    if (error) throw error

    revalidatePath(liveChatPath(dept.site_id))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error deleting department:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function setDefaultDepartment(
  siteId: string,
  departmentId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    // Unset all defaults
    await supabase
      .from('mod_chat_departments')
      .update({ is_default: false })
      .eq('site_id', siteId)

    // Set new default
    const { error } = await supabase
      .from('mod_chat_departments')
      .update({ is_default: true })
      .eq('id', departmentId)

    if (error) throw error

    revalidatePath(liveChatPath(siteId))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error setting default department:', error)
    return { success: false, error: (error as Error).message }
  }
}
