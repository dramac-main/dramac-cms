/**
 * OAuth Callback Route
 *
 * PHASE-SM-01: GET /api/social/oauth/callback
 *
 * Handles the redirect back from the social platform,
 * exchanges the code for tokens, creates the social_accounts row,
 * and redirects to the accounts page.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consumeOAuthState } from '@/modules/social-media/lib/oauth-state'
import { getOAuthConfig, type OAuthPlatform } from '@/modules/social-media/lib/platform-oauth-config'

// ============================================================================
// CALLBACK HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Handle OAuth errors
  if (errorParam) {
    const msg = encodeURIComponent(errorDescription || errorParam)
    return NextResponse.redirect(`${appUrl}/dashboard?error=oauth_denied&message=${msg}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=missing_params`)
  }

  // Validate CSRF state
  const stateData = await consumeOAuthState(state)
  if (!stateData) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=invalid_state`)
  }

  const { platform, siteId, tenantId, userId, codeVerifier } = stateData
  const oauthPlatform = platform as OAuthPlatform
  const config = getOAuthConfig(oauthPlatform)

  if (!config) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=unsupported_platform`)
  }

  try {
    // Exchange code for tokens
    const tokenBody: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${appUrl}/api/social/oauth/callback`,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }

    if (config.usePKCE && codeVerifier) {
      tokenBody.code_verifier = codeVerifier
    }

    const tokenRes = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenBody),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error(`Token exchange failed for ${platform}:`, errText)
      return NextResponse.redirect(
        `${appUrl}/dashboard/sites/${siteId}/social/accounts?error=token_exchange_failed`,
      )
    }

    const tokens = await tokenRes.json()
    const accessToken = tokens.access_token
    const refreshToken = tokens.refresh_token || null
    const expiresIn = tokens.expires_in ? Number(tokens.expires_in) : null

    // Fetch the user's profile from the platform
    const profile = await fetchPlatformProfile(platform, accessToken)

    // Upsert the social account
    const supabase = await createClient()
    const now = new Date().toISOString()

    const accountData: Record<string, any> = {
      site_id: siteId,
      tenant_id: tenantId,
      user_id: userId,
      platform,
      platform_account_id: profile.platformAccountId,
      account_name: profile.displayName,
      account_handle: profile.handle || null,
      account_avatar: profile.avatarUrl || null,
      account_url: profile.profileUrl || null,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null,
      status: 'active',
      last_error: null,
      followers_count: profile.followersCount || 0,
      following_count: profile.followingCount || 0,
      connected_at: now,
      last_synced_at: now,
      updated_at: now,
    }

    // Upsert by (site_id, platform, platform_account_id) to avoid duplicates
    const { error: upsertError } = await (supabase as any)
      .from('social_accounts')
      .upsert(accountData, {
        onConflict: 'site_id,platform,platform_account_id',
        ignoreDuplicates: false,
      })

    if (upsertError) {
      console.error('Failed to upsert social account:', upsertError)
      // Fall back to insert
      await (supabase as any).from('social_accounts').insert(accountData)
    }

    return NextResponse.redirect(
      `${appUrl}/dashboard/sites/${siteId}/social/accounts?connected=${platform}`,
    )
  } catch (err: any) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      `${appUrl}/dashboard/sites/${siteId}/social/accounts?error=callback_failed&message=${encodeURIComponent(err.message?.slice(0, 100) || 'Unknown error')}`,
    )
  }
}

// ============================================================================
// PLATFORM PROFILE FETCHERS
// ============================================================================

interface PlatformProfile {
  platformAccountId: string
  displayName: string
  handle?: string
  avatarUrl?: string
  profileUrl?: string
  followersCount?: number
  followingCount?: number
}

async function fetchPlatformProfile(
  platform: string,
  accessToken: string,
): Promise<PlatformProfile> {
  switch (platform) {
    case 'facebook':
      return fetchFacebookProfile(accessToken)
    case 'instagram':
      return fetchInstagramProfile(accessToken)
    case 'twitter':
      return fetchTwitterProfile(accessToken)
    case 'linkedin':
      return fetchLinkedinProfile(accessToken)
    case 'tiktok':
      return fetchTiktokProfile(accessToken)
    case 'pinterest':
      return fetchPinterestProfile(accessToken)
    case 'youtube':
      return fetchYoutubeProfile(accessToken)
    case 'threads':
      return fetchThreadsProfile(accessToken)
    default:
      return {
        platformAccountId: `${platform}_${Date.now()}`,
        displayName: `${platform} Account`,
      }
  }
}

async function fetchFacebookProfile(token: string): Promise<PlatformProfile> {
  // Get the first page the user manages
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture,fan_count,link&access_token=${token}`,
  )
  const data = await res.json()
  const page = data.data?.[0]

  if (!page) {
    // Fallback to personal profile
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,picture&access_token=${token}`,
    )
    const me = await meRes.json()
    return {
      platformAccountId: me.id,
      displayName: me.name,
      avatarUrl: me.picture?.data?.url,
    }
  }

  return {
    platformAccountId: page.id,
    displayName: page.name,
    avatarUrl: page.picture?.data?.url,
    profileUrl: page.link,
    followersCount: page.fan_count || 0,
  }
}

async function fetchInstagramProfile(token: string): Promise<PlatformProfile> {
  // Get IG business accounts connected to Facebook pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account{id,name,username,profile_picture_url,followers_count,follows_count}&access_token=${token}`,
  )
  const pagesData = await pagesRes.json()
  const igAccount = pagesData.data?.[0]?.instagram_business_account

  if (!igAccount) {
    return {
      platformAccountId: `ig_${Date.now()}`,
      displayName: 'Instagram Account',
    }
  }

  return {
    platformAccountId: igAccount.id,
    displayName: igAccount.name || igAccount.username,
    handle: igAccount.username,
    avatarUrl: igAccount.profile_picture_url,
    profileUrl: `https://instagram.com/${igAccount.username}`,
    followersCount: igAccount.followers_count || 0,
    followingCount: igAccount.follows_count || 0,
  }
}

async function fetchTwitterProfile(token: string): Promise<PlatformProfile> {
  const res = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url,public_metrics',
    { headers: { Authorization: `Bearer ${token}` } },
  )
  const data = await res.json()
  const user = data.data

  return {
    platformAccountId: user?.id || `tw_${Date.now()}`,
    displayName: user?.name || 'Twitter User',
    handle: user?.username,
    avatarUrl: user?.profile_image_url,
    profileUrl: user?.username ? `https://x.com/${user.username}` : undefined,
    followersCount: user?.public_metrics?.followers_count || 0,
    followingCount: user?.public_metrics?.following_count || 0,
  }
}

async function fetchLinkedinProfile(token: string): Promise<PlatformProfile> {
  const res = await fetch(
    'https://api.linkedin.com/v2/userinfo',
    { headers: { Authorization: `Bearer ${token}` } },
  )
  const data = await res.json()

  return {
    platformAccountId: data.sub || `li_${Date.now()}`,
    displayName: data.name || `${data.given_name} ${data.family_name}`,
    avatarUrl: data.picture,
    profileUrl: `https://linkedin.com/in/me`,
  }
}

async function fetchTiktokProfile(token: string): Promise<PlatformProfile> {
  const res = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,follower_count,following_count',
    { headers: { Authorization: `Bearer ${token}` } },
  )
  const data = await res.json()
  const user = data.data?.user

  return {
    platformAccountId: user?.open_id || `tt_${Date.now()}`,
    displayName: user?.display_name || 'TikTok User',
    avatarUrl: user?.avatar_url,
    followersCount: user?.follower_count || 0,
    followingCount: user?.following_count || 0,
  }
}

async function fetchPinterestProfile(token: string): Promise<PlatformProfile> {
  const res = await fetch('https://api.pinterest.com/v5/user_account', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()

  return {
    platformAccountId: data.id || `pin_${Date.now()}`,
    displayName: data.business_name || data.username || 'Pinterest User',
    handle: data.username,
    avatarUrl: data.profile_image,
    profileUrl: data.website_url,
    followersCount: data.follower_count || 0,
    followingCount: data.following_count || 0,
  }
}

async function fetchYoutubeProfile(token: string): Promise<PlatformProfile> {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    { headers: { Authorization: `Bearer ${token}` } },
  )
  const data = await res.json()
  const channel = data.items?.[0]

  return {
    platformAccountId: channel?.id || `yt_${Date.now()}`,
    displayName: channel?.snippet?.title || 'YouTube Channel',
    handle: channel?.snippet?.customUrl,
    avatarUrl: channel?.snippet?.thumbnails?.default?.url,
    profileUrl: channel?.id
      ? `https://youtube.com/channel/${channel.id}`
      : undefined,
    followersCount: Number(channel?.statistics?.subscriberCount) || 0,
  }
}

async function fetchThreadsProfile(token: string): Promise<PlatformProfile> {
  const res = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url&access_token=${token}`,
  )
  const data = await res.json()

  return {
    platformAccountId: data.id || `threads_${Date.now()}`,
    displayName: data.username || 'Threads User',
    handle: data.username,
    avatarUrl: data.threads_profile_picture_url,
    profileUrl: data.username
      ? `https://threads.net/@${data.username}`
      : undefined,
  }
}
