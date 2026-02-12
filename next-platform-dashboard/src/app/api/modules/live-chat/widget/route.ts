/**
 * Live Chat Widget Settings API
 *
 * PHASE LC-04: Public endpoint for widget initialization
 * GET /api/modules/live-chat/widget?siteId=xxx
 *
 * Returns public widget configuration for rendering the chat widget.
 * Uses admin client (service role) since anonymous visitors have no auth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapRecord } from '@/modules/live-chat/lib/map-db-record'
import type { ChatWidgetSettings } from '@/modules/live-chat/types'

export const dynamic = 'force-dynamic'

// CORS headers for cross-origin widget requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createAdminClient()

    // Check if live-chat module is enabled for this site
    // Use site_module_installations + modules_v2 (the correct modern tables)
    const { data: installations } = await supabase
      .from('site_module_installations')
      .select('module_id')
      .eq('site_id', siteId)
      .eq('is_enabled', true)

    let isLiveChatEnabled = false
    if (installations && installations.length > 0) {
      const moduleIds = installations.map((i: any) => i.module_id)
      const { data: modulesData } = await (supabase as any)
        .from('modules_v2')
        .select('id, slug')
        .in('id', moduleIds)
        .eq('slug', 'live-chat')
        .maybeSingle()
      isLiveChatEnabled = !!modulesData
    }

    if (!isLiveChatEnabled) {
      return NextResponse.json(
        { error: 'Live chat is not enabled for this site' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Fetch widget settings
    const { data: settingsData, error } = await (supabase as any)
      .from('mod_chat_widget_settings')
      .select('*')
      .eq('site_id', siteId)
      .maybeSingle()

    if (error) {
      console.error('[LiveChat Widget API] Error fetching settings:', error)
      return NextResponse.json(
        { error: 'Failed to load widget settings' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Return default settings if none configured
    if (!settingsData) {
      return NextResponse.json(
        {
          settings: {
            primaryColor: '#2563eb',
            textColor: '#ffffff',
            position: 'bottom-right',
            launcherIcon: 'MessageCircle',
            launcherSize: 56,
            borderRadius: 16,
            zIndex: 2147483647,
            companyName: null,
            welcomeMessage: 'Hi there! How can we help you today?',
            awayMessage: 'We\'re currently away. Leave a message and we\'ll get back to you.',
            offlineMessage: 'We\'re currently offline. Please leave a message and we\'ll respond as soon as possible.',
            preChatEnabled: true,
            preChatNameRequired: true,
            preChatEmailRequired: true,
            preChatPhoneEnabled: false,
            preChatPhoneRequired: false,
            preChatMessageRequired: true,
            preChatDepartmentSelector: false,
            businessHoursEnabled: false,
            businessHours: {},
            timezone: 'Africa/Lusaka',
            autoOpenDelaySeconds: 0,
            logoUrl: null,
            showAgentAvatar: true,
            showAgentName: true,
            showTypingIndicator: true,
            enableFileUploads: false,
            enableEmoji: true,
            enableSoundNotifications: true,
            enableSatisfactionRating: true,
            language: 'en',
          },
          departments: [],
        },
        { headers: corsHeaders }
      )
    }

    const settings = mapRecord<ChatWidgetSettings>(settingsData)

    // Only return public-facing fields (strip sensitive data)
    const publicSettings = {
      primaryColor: settings.primaryColor,
      textColor: settings.textColor,
      position: settings.position,
      launcherIcon: settings.launcherIcon,
      launcherSize: settings.launcherSize,
      borderRadius: settings.borderRadius,
      zIndex: settings.zIndex,
      companyName: settings.companyName,
      welcomeMessage: settings.welcomeMessage,
      awayMessage: settings.awayMessage,
      offlineMessage: settings.offlineMessage,
      logoUrl: settings.logoUrl,
      preChatEnabled: settings.preChatEnabled,
      preChatNameRequired: settings.preChatNameRequired,
      preChatEmailRequired: settings.preChatEmailRequired,
      preChatPhoneEnabled: settings.preChatPhoneEnabled,
      preChatPhoneRequired: settings.preChatPhoneRequired,
      preChatMessageRequired: settings.preChatMessageRequired,
      preChatDepartmentSelector: settings.preChatDepartmentSelector,
      businessHoursEnabled: settings.businessHoursEnabled,
      businessHours: settings.businessHours,
      timezone: settings.timezone,
      autoOpenDelaySeconds: settings.autoOpenDelaySeconds,
      showAgentAvatar: settings.showAgentAvatar,
      showAgentName: settings.showAgentName,
      showTypingIndicator: settings.showTypingIndicator,
      enableFileUploads: settings.enableFileUploads,
      enableEmoji: settings.enableEmoji,
      enableSoundNotifications: settings.enableSoundNotifications,
      enableSatisfactionRating: settings.enableSatisfactionRating,
      language: settings.language,
    }

    // Fetch departments if department selector is enabled
    let departments: { id: string; name: string }[] = []
    if (settings.preChatDepartmentSelector) {
      const { data: deptData } = await (supabase as any)
        .from('mod_chat_departments')
        .select('id, name')
        .eq('site_id', siteId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      departments = (deptData || []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        name: d.name as string,
      }))
    }

    return NextResponse.json(
      { settings: publicSettings, departments },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('[LiveChat Widget API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
