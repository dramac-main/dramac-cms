/**
 * OAuth Initiation Route
 *
 * PHASE-SM-01: GET /api/social/oauth/[platform]
 *
 * Query params: siteId, tenantId
 * Redirects the user to the platform's OAuth consent screen.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getOAuthConfig,
  buildAuthorizeUrl,
  type OAuthPlatform,
} from '@/modules/social-media/lib/platform-oauth-config'
import {
  createOAuthState,
  generateCodeVerifier,
  generateCodeChallenge,
} from '@/modules/social-media/lib/oauth-state'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params
  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get('siteId')
  const tenantId = searchParams.get('tenantId')

  if (!siteId || !tenantId) {
    return NextResponse.json(
      { error: 'Missing siteId or tenantId' },
      { status: 400 },
    )
  }

  // Verify the user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const oauthPlatform = platform as OAuthPlatform
  const config = getOAuthConfig(oauthPlatform)

  if (!config) {
    return NextResponse.json(
      { error: `Platform "${platform}" does not support OAuth redirect flow` },
      { status: 400 },
    )
  }

  // Create CSRF state
  const { state, codeVerifier } = await createOAuthState({
    platform,
    siteId,
    tenantId,
    userId: user.id,
    usePKCE: config.usePKCE,
  })

  // Build authorize URL
  let codeChallenge: string | undefined
  if (config.usePKCE && codeVerifier) {
    codeChallenge = generateCodeChallenge(codeVerifier)
  }

  const authorizeUrl = buildAuthorizeUrl(oauthPlatform, state, codeChallenge)

  if (!authorizeUrl) {
    return NextResponse.json(
      { error: 'Failed to build authorize URL' },
      { status: 500 },
    )
  }

  return NextResponse.redirect(authorizeUrl)
}
