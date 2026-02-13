'use server'

/**
 * Live Chat Module — Widget Settings Actions
 *
 * Server actions for widget configuration and business hours management.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord } from '../lib/map-db-record'
import { DEFAULT_TIMEZONE } from '@/lib/locale-config'
import type { ChatWidgetSettings, BusinessHoursConfig } from '../types'

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

function liveChatPath(siteId: string) {
  return `/dashboard/sites/${siteId}/live-chat`
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getWidgetSettings(
  siteId: string
): Promise<{ settings: ChatWidgetSettings | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_widget_settings')
      .select('*')
      .eq('site_id', siteId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings yet — create defaults
        const { data: newData, error: insertError } = await supabase
          .from('mod_chat_widget_settings')
          .insert({ site_id: siteId })
          .select()
          .single()

        if (insertError) throw insertError
        return { settings: mapRecord<ChatWidgetSettings>(newData), error: null }
      }
      throw error
    }

    return { settings: mapRecord<ChatWidgetSettings>(data), error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting widget settings:', error)
    return { settings: null, error: (error as Error).message }
  }
}

export async function getPublicWidgetSettings(
  siteId: string
): Promise<{ settings: Partial<ChatWidgetSettings> | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_widget_settings')
      .select(
        'primary_color, text_color, position, launcher_icon, launcher_size, border_radius, z_index, ' +
        'company_name, welcome_message, away_message, offline_message, logo_url, ' +
        'pre_chat_enabled, pre_chat_name_required, pre_chat_email_required, ' +
        'pre_chat_phone_enabled, pre_chat_phone_required, pre_chat_message_required, pre_chat_department_selector, ' +
        'business_hours_enabled, business_hours, timezone, ' +
        'auto_open_delay_seconds, show_agent_avatar, show_agent_name, show_typing_indicator, ' +
        'enable_file_uploads, enable_emoji, enable_sound_notifications, enable_satisfaction_rating, ' +
        'language, custom_translations, whatsapp_enabled, whatsapp_phone_number, ' +
        'allowed_domains, max_file_size_mb, allowed_file_types'
      )
      .eq('site_id', siteId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { settings: null, error: null }
      throw error
    }

    return { settings: mapRecord<Partial<ChatWidgetSettings>>(data), error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting public widget settings:', error)
    return { settings: null, error: (error as Error).message }
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function updateWidgetSettings(
  siteId: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    // Convert camelCase keys to snake_case for DB
    const snakeData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      snakeData[snakeKey] = value
    }

    // Use upsert with onConflict to handle both insert and update atomically
    const { error: upsertError } = await supabase
      .from('mod_chat_widget_settings')
      .upsert(
        { site_id: siteId, ...snakeData },
        { onConflict: 'site_id' }
      )

    if (upsertError) {
      // If upsert fails (e.g., column doesn't exist), fall back to update-only
      console.warn('[LiveChat] Upsert failed, trying update-only:', upsertError.message)
      const { error: updateError } = await supabase
        .from('mod_chat_widget_settings')
        .update(snakeData)
        .eq('site_id', siteId)

      if (updateError) throw updateError
    }

    revalidatePath(liveChatPath(siteId))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating widget settings:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ─── Business Hours ──────────────────────────────────────────────────────────

export async function isWithinBusinessHours(
  siteId: string
): Promise<{ isOpen: boolean; nextOpenAt: string | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_widget_settings')
      .select('business_hours_enabled, business_hours, timezone')
      .eq('site_id', siteId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { isOpen: true, nextOpenAt: null, error: null }
      throw error
    }

    if (!data.business_hours_enabled) {
      return { isOpen: true, nextOpenAt: null, error: null }
    }

    const timezone = data.timezone || DEFAULT_TIMEZONE
    const hours = (data.business_hours || {}) as BusinessHoursConfig

    // Get current time in the configured timezone
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const parts = formatter.formatToParts(now)
    const weekday = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase() as keyof BusinessHoursConfig | undefined
    const hour = parts.find((p) => p.type === 'hour')?.value || '00'
    const minute = parts.find((p) => p.type === 'minute')?.value || '00'
    const currentTime = `${hour}:${minute}`

    if (!weekday) return { isOpen: true, nextOpenAt: null, error: null }

    const dayHours = hours[weekday]

    if (!dayHours || !dayHours.enabled) {
      return { isOpen: false, nextOpenAt: null, error: null }
    }

    const isOpen = currentTime >= dayHours.start && currentTime <= dayHours.end

    return { isOpen, nextOpenAt: isOpen ? null : dayHours.start, error: null }
  } catch (error) {
    console.error('[LiveChat] Error checking business hours:', error)
    return { isOpen: true, nextOpenAt: null, error: (error as Error).message }
  }
}
