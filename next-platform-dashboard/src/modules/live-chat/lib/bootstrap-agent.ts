/**
 * Bootstrap the site owner as the first live chat agent.
 *
 * Called whenever live-chat is installed on a site (via any path):
 * - createSiteAction → installCoreModules
 * - AI Designer auto-install
 * - Marketplace manual install
 *
 * Without an agent, conversations pile up as "pending" with nobody to assign to.
 * The agent starts as "online" so chat routing works immediately.
 */

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Ensure the site owner is registered as the first live chat agent.
 * Uses the admin client for RLS bypass — safe for any calling context.
 *
 * @returns The agent ID if created, or null if already exists.
 */
export async function bootstrapLiveChatAgent(
  siteId: string,
  userId: string,
): Promise<string | null> {
  const supabase = createAdminClient()

  // Check if an agent already exists for this user on this site
  const { data: existing } = await (supabase as any)
    .from('mod_chat_agents')
    .select('id')
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return null // Already an agent — skip

  // Get user's profile info for display name
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('name, full_name, email, avatar_url')
    .eq('id', userId)
    .single()

  const displayName =
    profile?.name || profile?.full_name || profile?.email || 'Site Owner'

  const { data: agent, error } = await (supabase as any)
    .from('mod_chat_agents')
    .insert({
      site_id: siteId,
      user_id: userId,
      display_name: displayName,
      email: profile?.email || null,
      avatar_url: profile?.avatar_url || null,
      role: 'admin',
      status: 'online',
      is_active: true,
      max_concurrent_chats: 5,
      current_chat_count: 0,
    })
    .select('id')
    .single()

  if (error) {
    // 23505 = unique violation (agent already exists, race condition)
    if (error.code === '23505') return null
    throw error
  }

  console.log(
    `[LiveChat] Bootstrap: ${displayName} registered as agent for site ${siteId}`,
  )
  return agent?.id ?? null
}

/**
 * Resolve the site owner's user ID from a site ID.
 * Follows: sites → agency_id → agencies.owner_id
 */
export async function getSiteOwnerUserId(
  siteId: string,
): Promise<string | null> {
  const supabase = createAdminClient()

  const { data: site } = await (supabase as any)
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single()

  if (!site?.agency_id) return null

  const { data: agency } = await (supabase as any)
    .from('agencies')
    .select('owner_id')
    .eq('id', site.agency_id)
    .single()

  return agency?.owner_id ?? null
}
