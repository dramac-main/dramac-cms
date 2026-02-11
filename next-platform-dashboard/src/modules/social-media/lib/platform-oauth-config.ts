/**
 * Platform OAuth Configuration
 *
 * PHASE-SM-01: OAuth & Account Integration
 * Centralised configuration for all social platform OAuth flows.
 *
 * Env vars required (set in Vercel / .env.local):
 *   NEXT_PUBLIC_APP_URL            – e.g. https://cms.dramac.com
 *   FACEBOOK_APP_ID / SECRET       – Meta Business App
 *   TWITTER_CLIENT_ID / SECRET     – X/Twitter OAuth 2.0 PKCE
 *   LINKEDIN_CLIENT_ID / SECRET
 *   TIKTOK_CLIENT_KEY / SECRET
 *   PINTEREST_APP_ID / SECRET
 *   GOOGLE_CLIENT_ID / SECRET      – YouTube
 *   THREADS_APP_ID / SECRET
 */

// ============================================================================
// TYPES
// ============================================================================

export type OAuthPlatform =
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'tiktok'
  | 'pinterest'
  | 'youtube'
  | 'threads'
  // Bluesky & Mastodon use credential-based auth, not OAuth redirects
  | 'bluesky'
  | 'mastodon'

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  authorizeUrl: string
  tokenUrl: string
  scopes: string[]
  /** Extra query params for the authorize URL */
  extraAuthParams?: Record<string, string>
  /** Whether this platform uses PKCE (proof-key for code exchange) */
  usePKCE?: boolean
}

// ============================================================================
// HELPERS
// ============================================================================

function env(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

const CALLBACK_BASE = () =>
  `${env('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')}/api/social/oauth/callback`

// ============================================================================
// CONFIGS
// ============================================================================

export function getOAuthConfig(platform: OAuthPlatform): OAuthConfig | null {
  switch (platform) {
    // ---- Meta (Facebook + Instagram share the same app) ----
    case 'facebook':
      return {
        clientId: env('FACEBOOK_APP_ID'),
        clientSecret: env('FACEBOOK_APP_SECRET'),
        authorizeUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
        scopes: [
          'pages_show_list',
          'pages_read_engagement',
          'pages_manage_posts',
          'pages_manage_metadata',
          'pages_read_user_content',
          'read_insights',
        ],
      }

    case 'instagram':
      return {
        clientId: env('FACEBOOK_APP_ID'),
        clientSecret: env('FACEBOOK_APP_SECRET'),
        authorizeUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
        scopes: [
          'instagram_basic',
          'instagram_content_publish',
          'instagram_manage_insights',
          'pages_show_list',
          'pages_read_engagement',
        ],
      }

    // ---- Twitter / X (OAuth 2.0 with PKCE) ----
    case 'twitter':
      return {
        clientId: env('TWITTER_CLIENT_ID'),
        clientSecret: env('TWITTER_CLIENT_SECRET'),
        authorizeUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        scopes: [
          'tweet.read',
          'tweet.write',
          'users.read',
          'offline.access',
        ],
        usePKCE: true,
        extraAuthParams: { response_type: 'code' },
      }

    // ---- LinkedIn ----
    case 'linkedin':
      return {
        clientId: env('LINKEDIN_CLIENT_ID'),
        clientSecret: env('LINKEDIN_CLIENT_SECRET'),
        authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        scopes: [
          'openid',
          'profile',
          'w_member_social',
          'r_organization_social',
          'w_organization_social',
          'r_organization_admin',
        ],
      }

    // ---- TikTok ----
    case 'tiktok':
      return {
        clientId: env('TIKTOK_CLIENT_KEY'),
        clientSecret: env('TIKTOK_CLIENT_SECRET'),
        authorizeUrl: 'https://www.tiktok.com/v2/auth/authorize/',
        tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
        scopes: [
          'user.info.basic',
          'user.info.stats',
          'video.publish',
          'video.list',
        ],
      }

    // ---- Pinterest ----
    case 'pinterest':
      return {
        clientId: env('PINTEREST_APP_ID'),
        clientSecret: env('PINTEREST_APP_SECRET'),
        authorizeUrl: 'https://www.pinterest.com/oauth/',
        tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
        scopes: [
          'boards:read',
          'boards:write',
          'pins:read',
          'pins:write',
          'user_accounts:read',
        ],
      }

    // ---- YouTube (Google OAuth) ----
    case 'youtube':
      return {
        clientId: env('GOOGLE_CLIENT_ID'),
        clientSecret: env('GOOGLE_CLIENT_SECRET'),
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: [
          'https://www.googleapis.com/auth/youtube.readonly',
          'https://www.googleapis.com/auth/youtube.upload',
          'https://www.googleapis.com/auth/yt-analytics.readonly',
        ],
        extraAuthParams: { access_type: 'offline', prompt: 'consent' },
      }

    // ---- Threads (Meta) ----
    case 'threads':
      return {
        clientId: env('THREADS_APP_ID', env('FACEBOOK_APP_ID')),
        clientSecret: env('THREADS_APP_SECRET', env('FACEBOOK_APP_SECRET')),
        authorizeUrl: 'https://threads.net/oauth/authorize',
        tokenUrl: 'https://graph.threads.net/oauth/access_token',
        scopes: [
          'threads_basic',
          'threads_content_publish',
          'threads_manage_insights',
          'threads_manage_replies',
        ],
      }

    // Bluesky & Mastodon do not use OAuth redirects
    case 'bluesky':
    case 'mastodon':
      return null

    default:
      return null
  }
}

/**
 * Build the full authorize URL for an OAuth platform.
 */
export function buildAuthorizeUrl(
  platform: OAuthPlatform,
  state: string,
  codeChallenge?: string,
): string | null {
  const config = getOAuthConfig(platform)
  if (!config) return null

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${CALLBACK_BASE()}`,
    scope: config.scopes.join(' '),
    state,
    response_type: 'code',
    ...config.extraAuthParams,
  })

  if (config.usePKCE && codeChallenge) {
    params.set('code_challenge', codeChallenge)
    params.set('code_challenge_method', 'S256')
  }

  return `${config.authorizeUrl}?${params.toString()}`
}
