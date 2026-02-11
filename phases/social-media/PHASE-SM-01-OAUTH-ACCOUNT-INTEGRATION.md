# PHASE SM-01: OAuth & Account Integration

**Phase**: SM-01  
**Name**: OAuth & Account Integration  
**Independence**: Fully independent — no other SM phase required  
**Connection Points**: Provides connected accounts for SM-02 (Publishing), SM-03 (Analytics), SM-04 (Inbox)  
**Estimated Files**: ~15 new/modified files

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md
memory-bank/techContext.md
memory-bank/activeContext.md
phases/social-media/PHASE-SM-00-MASTER-PLAN.md
src/modules/social-media/manifest.ts
src/modules/social-media/types/index.ts
src/modules/social-media/actions/account-actions.ts
src/app/(dashboard)/dashboard/sites/[siteId]/social/accounts/page.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/layout.tsx
migrations/em-54-social-media-flat-tables.sql
```

---

## Context

The social media module has a complete UI shell for account management but zero actual platform integration. The `accounts/page.tsx` renders platform cards with connect buttons, but clicking them shows a toast saying "requires configuration". This phase builds the entire OAuth flow, token management, and account sync infrastructure.

### Current State
- `social_accounts` table exists with columns for `access_token`, `refresh_token`, `token_expires_at`, `scopes`
- `SocialAccount` TypeScript type is fully defined
- `account-actions.ts` has CRUD but `refreshAccountToken()` just marks as expired, `syncAccountStats()` only updates timestamp
- Zero API routes exist for OAuth
- Zero platform SDK packages installed

### Target State
- Users can click a platform → OAuth redirect → callback → account saved
- Tokens auto-refresh before expiry
- Account stats (followers, following, posts) sync from real platform APIs
- Account health monitoring detects expired/rate-limited accounts
- Bluesky uses App Password flow (not OAuth)

---

## Task 1: Install Platform SDK Dependencies

### Action
Add required npm packages for social media platform APIs.

```bash
cd next-platform-dashboard
pnpm add @atproto/api  # Bluesky AT Protocol SDK
```

**Note**: Most platforms use REST APIs with fetch — no SDK needed. Only Bluesky needs a specific SDK. Facebook, Twitter, LinkedIn, TikTok, YouTube, Pinterest, Threads, Mastodon all use standard OAuth2 + REST.

### Why Minimal Dependencies
- Facebook/Instagram → Meta Graph API (REST, no SDK needed)
- Twitter/X → Twitter API v2 (REST, no SDK needed)
- LinkedIn → LinkedIn API (REST, no SDK needed)
- TikTok → TikTok API (REST, no SDK needed)
- YouTube → YouTube Data API v3 (REST, no SDK needed)
- Pinterest → Pinterest API v5 (REST, no SDK needed)
- Threads → Threads API via Meta (REST, no SDK needed)
- Mastodon → Mastodon API (REST, no SDK needed)
- Bluesky → AT Protocol (`@atproto/api` SDK)

---

## Task 2: Create Platform OAuth Configuration

### Create `src/modules/social-media/lib/platform-oauth-config.ts`

This file defines OAuth endpoints, scopes, and configuration for each platform. It reads credentials from environment variables.

```typescript
'use server'

/**
 * Platform OAuth Configuration
 * 
 * PHASE SM-01: OAuth & Account Integration
 * Centralized OAuth config for all 10 supported platforms.
 * Credentials come from environment variables — never hardcoded.
 */

export type OAuthPlatform = 
  | 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok'
  | 'youtube' | 'pinterest' | 'threads' | 'bluesky' | 'mastodon'

export interface PlatformOAuthConfig {
  platform: OAuthPlatform
  authType: 'oauth2' | 'app_password' | 'oauth2_pkce'
  authorizationUrl: string
  tokenUrl: string
  revokeUrl?: string
  clientId: string
  clientSecret: string
  scopes: string[]
  /** Some platforms need additional params (e.g. response_type, access_type) */
  extraAuthParams?: Record<string, string>
  /** Base URL for API calls */
  apiBaseUrl: string
  /** User info endpoint to fetch profile after auth */
  userInfoEndpoint: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CALLBACK_URL = `${APP_URL}/api/social/oauth/callback`

export function getPlatformOAuthConfig(platform: OAuthPlatform): PlatformOAuthConfig | null {
  const configs: Record<string, () => PlatformOAuthConfig> = {
    facebook: () => ({
      platform: 'facebook',
      authType: 'oauth2',
      authorizationUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
      revokeUrl: 'https://graph.facebook.com/v21.0/me/permissions',
      clientId: process.env.META_APP_ID || '',
      clientSecret: process.env.META_APP_SECRET || '',
      scopes: [
        'pages_show_list', 'pages_read_engagement', 'pages_manage_posts',
        'pages_read_user_content', 'pages_manage_engagement',
        'read_insights', 'business_management'
      ],
      apiBaseUrl: 'https://graph.facebook.com/v21.0',
      userInfoEndpoint: '/me?fields=id,name,picture,accounts{name,id,access_token,picture,category,fan_count}',
    }),

    instagram: () => ({
      platform: 'instagram',
      authType: 'oauth2',
      authorizationUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
      clientId: process.env.META_APP_ID || '',
      clientSecret: process.env.META_APP_SECRET || '',
      scopes: [
        'instagram_basic', 'instagram_content_publish', 'instagram_manage_comments',
        'instagram_manage_insights', 'pages_show_list', 'pages_read_engagement',
        'business_management'
      ],
      extraAuthParams: { config_id: '' }, // Set if using Meta Login Config
      apiBaseUrl: 'https://graph.facebook.com/v21.0',
      userInfoEndpoint: '/me/accounts?fields=id,name,instagram_business_account{id,name,username,profile_picture_url,followers_count,media_count}',
    }),

    twitter: () => ({
      platform: 'twitter',
      authType: 'oauth2_pkce',
      authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      revokeUrl: 'https://api.twitter.com/2/oauth2/revoke',
      clientId: process.env.TWITTER_API_KEY || '',
      clientSecret: process.env.TWITTER_API_SECRET || '',
      scopes: [
        'tweet.read', 'tweet.write', 'users.read', 'follows.read',
        'follows.write', 'offline.access', 'like.read', 'like.write',
        'dm.read', 'dm.write'
      ],
      extraAuthParams: { code_challenge_method: 'S256' },
      apiBaseUrl: 'https://api.twitter.com/2',
      userInfoEndpoint: '/users/me?user.fields=id,name,username,profile_image_url,public_metrics,description',
    }),

    linkedin: () => ({
      platform: 'linkedin',
      authType: 'oauth2',
      authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      scopes: ['openid', 'profile', 'email', 'w_member_social', 'r_organization_social', 'w_organization_social', 'r_organization_admin'],
      apiBaseUrl: 'https://api.linkedin.com/v2',
      userInfoEndpoint: '/userinfo',
    }),

    tiktok: () => ({
      platform: 'tiktok',
      authType: 'oauth2',
      authorizationUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      revokeUrl: 'https://open.tiktokapis.com/v2/oauth/revoke/',
      clientId: process.env.TIKTOK_CLIENT_KEY || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      scopes: ['user.info.basic', 'user.info.stats', 'video.publish', 'video.list', 'video.upload'],
      apiBaseUrl: 'https://open.tiktokapis.com/v2',
      userInfoEndpoint: '/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count,following_count,video_count',
    }),

    youtube: () => ({
      platform: 'youtube',
      authType: 'oauth2',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      revokeUrl: 'https://oauth2.googleapis.com/revoke',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      scopes: [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/yt-analytics.readonly'
      ],
      extraAuthParams: { access_type: 'offline', prompt: 'consent' },
      apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
      userInfoEndpoint: '/channels?part=snippet,statistics&mine=true',
    }),

    pinterest: () => ({
      platform: 'pinterest',
      authType: 'oauth2',
      authorizationUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      clientId: process.env.PINTEREST_APP_ID || '',
      clientSecret: process.env.PINTEREST_APP_SECRET || '',
      scopes: ['boards:read', 'pins:read', 'pins:write', 'user_accounts:read', 'boards:write'],
      apiBaseUrl: 'https://api.pinterest.com/v5',
      userInfoEndpoint: '/user_account',
    }),

    threads: () => ({
      platform: 'threads',
      authType: 'oauth2',
      authorizationUrl: 'https://threads.net/oauth/authorize',
      tokenUrl: 'https://graph.threads.net/oauth/access_token',
      clientId: process.env.META_APP_ID || '',
      clientSecret: process.env.META_APP_SECRET || '',
      scopes: ['threads_basic', 'threads_content_publish', 'threads_manage_insights', 'threads_manage_replies', 'threads_read_replies'],
      apiBaseUrl: 'https://graph.threads.net/v1.0',
      userInfoEndpoint: '/me?fields=id,username,threads_profile_picture_url,threads_biography',
    }),

    bluesky: () => ({
      platform: 'bluesky',
      authType: 'app_password',
      authorizationUrl: '', // Not used — Bluesky uses App Passwords
      tokenUrl: 'https://bsky.social/xrpc/com.atproto.server.createSession',
      clientId: '', // Not used
      clientSecret: '', // Not used
      scopes: [],
      apiBaseUrl: 'https://bsky.social/xrpc',
      userInfoEndpoint: 'com.atproto.server.getSession', // Returns DID + handle
    }),

    mastodon: () => ({
      platform: 'mastodon',
      authType: 'oauth2',
      authorizationUrl: '', // Instance-specific: https://{instance}/oauth/authorize
      tokenUrl: '', // Instance-specific: https://{instance}/oauth/token
      revokeUrl: '', // Instance-specific: https://{instance}/oauth/revoke
      clientId: '', // Registered per-instance via /api/v1/apps
      clientSecret: '', // Registered per-instance via /api/v1/apps
      scopes: ['read', 'write', 'follow', 'push'],
      apiBaseUrl: '', // Instance-specific: https://{instance}/api/v1
      userInfoEndpoint: '/accounts/verify_credentials',
    }),
  }

  const configFn = configs[platform]
  if (!configFn) return null
  
  const config = configFn()
  
  // Validate required credentials (except Bluesky which uses app passwords, and Mastodon which registers per-instance)
  if (platform !== 'bluesky' && platform !== 'mastodon') {
    if (!config.clientId || !config.clientSecret) {
      return null // Credentials not configured
    }
  }
  
  return config
}

/**
 * Get the OAuth callback URL
 */
export function getOAuthCallbackUrl(): string {
  return CALLBACK_URL
}

/**
 * Check which platforms have credentials configured
 */
export async function getConfiguredPlatforms(): Promise<OAuthPlatform[]> {
  const allPlatforms: OAuthPlatform[] = [
    'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok',
    'youtube', 'pinterest', 'threads', 'bluesky', 'mastodon'
  ]
  
  const configured: OAuthPlatform[] = []
  for (const platform of allPlatforms) {
    // Bluesky always available (app passwords, no server config needed)
    if (platform === 'bluesky') {
      configured.push(platform)
      continue
    }
    // Mastodon always available (registers per-instance dynamically)
    if (platform === 'mastodon') {
      configured.push(platform)
      continue
    }
    const config = getPlatformOAuthConfig(platform)
    if (config) {
      configured.push(platform)
    }
  }
  return configured
}
```

---

## Task 3: Create OAuth State Management Utility

### Create `src/modules/social-media/lib/oauth-state.ts`

Manages OAuth state tokens to prevent CSRF attacks. Stores state in a temporary table or cookie.

```typescript
'use server'

/**
 * OAuth State Management
 *
 * PHASE SM-01: Generates and validates OAuth state tokens
 * to prevent CSRF attacks during the OAuth flow.
 * State includes: platform, siteId, userId, PKCE code_verifier (for Twitter)
 */

import { createClient } from '@/lib/supabase/server'
import { randomBytes, createHash } from 'crypto'

export interface OAuthState {
  platform: string
  siteId: string
  userId: string
  codeVerifier?: string // For PKCE (Twitter)
  mastodonInstance?: string // For Mastodon
  createdAt: string
}

/**
 * Generate a random state token and store it in the database
 */
export async function createOAuthState(params: {
  platform: string
  siteId: string
  userId: string
  mastodonInstance?: string
}): Promise<{ state: string; codeVerifier?: string; error?: string }> {
  const supabase = await createClient()
  
  const stateToken = randomBytes(32).toString('hex')
  let codeVerifier: string | undefined
  
  // Generate PKCE code verifier for Twitter
  if (params.platform === 'twitter') {
    codeVerifier = randomBytes(32).toString('base64url')
  }
  
  const stateData: OAuthState = {
    platform: params.platform,
    siteId: params.siteId,
    userId: params.userId,
    codeVerifier,
    mastodonInstance: params.mastodonInstance,
    createdAt: new Date().toISOString(),
  }
  
  // Store in social_oauth_states table (created in this phase's migration)
  const { error } = await (supabase as any)
    .from('social_oauth_states')
    .insert({
      state_token: stateToken,
      state_data: stateData,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    })
  
  if (error) {
    return { state: '', error: `Failed to create OAuth state: ${error.message}` }
  }
  
  return { state: stateToken, codeVerifier }
}

/**
 * Validate and consume a state token (one-time use)
 */
export async function validateOAuthState(stateToken: string): Promise<{ data: OAuthState | null; error?: string }> {
  const supabase = await createClient()
  
  const { data, error } = await (supabase as any)
    .from('social_oauth_states')
    .select('state_data, expires_at')
    .eq('state_token', stateToken)
    .single()
  
  if (error || !data) {
    return { data: null, error: 'Invalid or expired OAuth state' }
  }
  
  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    // Clean up expired state
    await (supabase as any)
      .from('social_oauth_states')
      .delete()
      .eq('state_token', stateToken)
    return { data: null, error: 'OAuth state has expired. Please try again.' }
  }
  
  // Delete the state (one-time use)
  await (supabase as any)
    .from('social_oauth_states')
    .delete()
    .eq('state_token', stateToken)
  
  return { data: data.state_data as OAuthState }
}

/**
 * Generate PKCE code challenge from code verifier (for Twitter OAuth 2.0)
 */
export function generateCodeChallenge(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url')
}

/**
 * Clean up expired states (call periodically or via cron)
 */
export async function cleanupExpiredStates(): Promise<void> {
  const supabase = await createClient()
  await (supabase as any)
    .from('social_oauth_states')
    .delete()
    .lt('expires_at', new Date().toISOString())
}
```

---

## Task 4: Create Database Migration for OAuth States Table

### Create `migrations/sm-01-oauth-states.sql`

```sql
-- ============================================================================
-- PHASE SM-01: OAuth State Management Table
-- Temporary storage for OAuth state tokens (CSRF prevention)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.social_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_token TEXT NOT NULL UNIQUE,
  state_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_social_oauth_states_token ON public.social_oauth_states(state_token);
CREATE INDEX IF NOT EXISTS idx_social_oauth_states_expires ON public.social_oauth_states(expires_at);

-- RLS: Only authenticated users can create states
ALTER TABLE public.social_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_oauth_states_policy ON public.social_oauth_states
  FOR ALL USING (true); -- States are validated by token, not user-based access

-- Auto-cleanup: Delete states older than 15 minutes via Supabase pg_cron (optional)
-- SELECT cron.schedule('cleanup-oauth-states', '*/5 * * * *', 
--   $$DELETE FROM public.social_oauth_states WHERE expires_at < NOW()$$);

-- ============================================================================
-- Add encrypted token storage columns to social_accounts (if not exists)
-- These columns already exist in the flat tables migration,
-- but ensure they support longer tokens
-- ============================================================================
ALTER TABLE public.social_accounts 
  ALTER COLUMN access_token TYPE TEXT,
  ALTER COLUMN refresh_token TYPE TEXT;

-- Add column for token metadata if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_accounts' AND column_name = 'token_metadata'
  ) THEN
    ALTER TABLE public.social_accounts ADD COLUMN token_metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;
```

**Run this migration in your Supabase SQL Editor before testing.**

---

## Task 5: Create OAuth API Route — Initiate Flow

### Create `src/app/api/social/oauth/[platform]/route.ts`

This route generates the OAuth authorization URL and redirects the user to the platform's consent screen.

**Implementation Requirements:**
1. Validate the `platform` param is one of the 10 supported platforms
2. Validate `siteId` query param exists
3. Check user is authenticated
4. Get platform OAuth config — if null, return error (credentials not configured)
5. Create OAuth state token with `createOAuthState()`
6. For Twitter: Generate PKCE code_challenge from code_verifier
7. Build the authorization URL with all required params
8. Return a JSON response with `{ url: authorizationUrl }` (the client redirects)

**For Bluesky:**
- This route is NOT used. Bluesky uses App Password auth, handled by a separate server action (Task 7).

**For Mastodon:**
- Requires an `instance` query param (e.g., `mastodon.social`)
- First registers the app on the instance via `POST /api/v1/apps`
- Then generates the auth URL

**Response format:**
```json
{ "url": "https://facebook.com/v21.0/dialog/oauth?client_id=...&state=...&redirect_uri=..." }
```

**Error responses:**
- 401 if not authenticated
- 400 if platform not supported or credentials not configured
- 500 on unexpected errors

---

## Task 6: Create OAuth API Route — Callback Handler

### Create `src/app/api/social/oauth/callback/route.ts`

This route handles the OAuth callback from all platforms (except Bluesky).

**Implementation Requirements:**
1. Extract `code` and `state` from query params
2. Validate the state token with `validateOAuthState()`
3. Exchange the authorization code for access/refresh tokens using the platform's token URL
4. Fetch user profile info from the platform API using the new access token
5. Upsert the account into `social_accounts` table with:
   - `platform`, `platform_account_id`, `account_name`, `account_handle`
   - `account_avatar`, `access_token`, `refresh_token`, `token_expires_at`
   - `scopes`, `followers_count`, `following_count`, `posts_count`
   - `status: 'active'`, `health_score: 100`
6. Redirect to `/dashboard/sites/[siteId]/social/accounts?connected=[platform]`

**Token exchange implementation per platform:**

For **Facebook/Instagram/Threads**: 
- Exchange code → short-lived token → exchange for long-lived token (60 days)
- For Facebook Pages: store the Page access token (not user token)
- For Instagram: find the `instagram_business_account` from the Page

For **Twitter/X**:
- Send PKCE `code_verifier` with the token request
- Include `grant_type: 'authorization_code'`

For **LinkedIn**:
- Exchange code → access token (60-day expiry)
- Fetch user profile from `/userinfo` endpoint

For **YouTube/Google**:
- Exchange code → access + refresh token (offline access)
- `access_type=offline` ensures refresh token is returned

For **TikTok**:
- Token endpoint returns `open_id` as the unique user identifier

For **Pinterest**:
- Exchange code → access token (standard OAuth2)

For **Mastodon**:
- Use the instance-specific token URL from the state data

**Error handling:**
- If code exchange fails → redirect with `?error=token_exchange_failed`
- If profile fetch fails → redirect with `?error=profile_fetch_failed`
- If DB upsert fails → redirect with `?error=save_failed`

---

## Task 7: Create Bluesky App Password Connection

### Add to `src/modules/social-media/actions/account-actions.ts`

Since Bluesky uses App Passwords instead of OAuth, create a server action:

```typescript
/**
 * Connect a Bluesky account using App Password
 * Bluesky doesn't use OAuth — users generate an App Password at:
 * https://bsky.app/settings/app-passwords
 */
export async function connectBlueskyAccount(
  siteId: string,
  handle: string, // e.g. "user.bsky.social" or custom domain
  appPassword: string
): Promise<{ account: SocialAccount | null; error: string | null }> {
  // Implementation:
  // 1. Call AT Protocol createSession: POST https://bsky.social/xrpc/com.atproto.server.createSession
  //    body: { identifier: handle, password: appPassword }
  // 2. On success, get { did, handle, accessJwt, refreshJwt }
  // 3. Fetch profile: GET https://bsky.social/xrpc/app.bsky.actor.getProfile?actor={did}
  //    → { displayName, avatar, followersCount, followsCount, postsCount, description }
  // 4. Upsert into social_accounts table with:
  //    - platform: 'bluesky'
  //    - platform_account_id: did
  //    - access_token: accessJwt
  //    - refresh_token: refreshJwt
  //    - account_name: displayName
  //    - account_handle: handle
  //    - account_avatar: avatar
  //    - followers_count, following_count, posts_count
  //    - status: 'active'
  // 5. Return the account
}
```

---

## Task 8: Create Mastodon Instance Registration

### Add to `src/modules/social-media/actions/account-actions.ts`

Mastodon requires registering an app on each instance before OAuth:

```typescript
/**
 * Register DRAMAC app on a Mastodon instance
 * Required before OAuth flow — each instance needs a separate app registration
 */
export async function registerMastodonApp(
  instanceUrl: string // e.g. "mastodon.social"
): Promise<{ clientId: string; clientSecret: string; error?: string }> {
  // Implementation:
  // 1. POST https://{instanceUrl}/api/v1/apps
  //    body: { 
  //      client_name: 'DRAMAC Social Media Manager',
  //      redirect_uris: CALLBACK_URL,
  //      scopes: 'read write follow push',
  //      website: APP_URL
  //    }
  // 2. Response: { id, client_id, client_secret, redirect_uri }
  // 3. Store client_id and client_secret (they're needed for the token exchange)
  // 4. Return { clientId, clientSecret }
}
```

---

## Task 9: Create Token Refresh Service

### Create `src/modules/social-media/lib/token-refresh.ts`

```typescript
'use server'

/**
 * Token Refresh Service
 * 
 * PHASE SM-01: Handles automatic token refresh for all platforms
 * Called before any API request to ensure tokens are valid
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Ensure the access token for an account is valid.
 * If expired or about to expire (within 5 minutes), refresh it.
 * Returns the valid access token.
 */
export async function ensureValidToken(accountId: string): Promise<{ 
  accessToken: string | null
  error?: string 
}> {
  // Implementation:
  // 1. Fetch account from social_accounts (access_token, refresh_token, token_expires_at, platform)
  // 2. If token_expires_at is NULL or > 5 minutes from now → return current access_token
  // 3. If expired or expiring soon:
  //    a. For Facebook/Instagram/Threads: 
  //       GET https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=...&client_secret=...&fb_exchange_token={current_token}
  //    b. For Twitter:
  //       POST https://api.twitter.com/2/oauth2/token with grant_type=refresh_token
  //    c. For LinkedIn:
  //       POST https://www.linkedin.com/oauth/v2/accessToken with grant_type=refresh_token
  //    d. For YouTube/Google:
  //       POST https://oauth2.googleapis.com/token with grant_type=refresh_token
  //    e. For TikTok:
  //       POST https://open.tiktokapis.com/v2/oauth/token/ with grant_type=refresh_token
  //    f. For Pinterest:
  //       POST https://api.pinterest.com/v5/oauth/token with grant_type=refresh_token
  //    g. For Bluesky:
  //       POST https://bsky.social/xrpc/com.atproto.server.refreshSession (uses refreshJwt as Bearer)
  //    h. For Mastodon:
  //       Mastodon tokens don't expire by default — return current token
  // 4. Update social_accounts with new access_token, refresh_token (if changed), token_expires_at
  // 5. If refresh fails → update status to 'expired', health_score to 0
  // 6. Return the new access_token
}

/**
 * Make an authenticated API request to a platform
 * Automatically refreshes token if needed
 */
export async function platformFetch(
  accountId: string,
  url: string,
  options?: RequestInit
): Promise<{ data: any; error?: string }> {
  // Implementation:
  // 1. Call ensureValidToken(accountId)
  // 2. Make fetch request with Authorization: Bearer {token}
  // 3. If 401 → try refresh once more, then retry
  // 4. If still 401 → mark account as expired
  // 5. If 429 → mark account as rate_limited, return error
  // 6. Return parsed JSON response
}
```

---

## Task 10: Update Account Actions — Real Platform Data

### Modify `src/modules/social-media/actions/account-actions.ts`

**Changes to existing functions:**

1. **`refreshAccountToken()`** — Replace the "marks as expired" stub:
   - Import `ensureValidToken` from `../lib/token-refresh`
   - Call `ensureValidToken(accountId)` to do actual token refresh
   - On success: update status to 'active', health_score to 100
   - On failure: update status to 'expired', health_score to 0

2. **`syncAccountStats()`** — Replace the "only updates timestamp" stub:
   - Import `platformFetch` from `../lib/token-refresh`
   - For each platform, fetch real follower/following/post counts:
     - **Facebook Page**: `GET /{pageId}?fields=fan_count,followers_count,new_like_count`
     - **Instagram**: `GET /{igUserId}?fields=followers_count,follows_count,media_count`
     - **Twitter**: `GET /users/{id}?user.fields=public_metrics`
     - **LinkedIn**: `GET /organizations/{orgId}?fields=followersCount`
     - **TikTok**: `GET /user/info/?fields=follower_count,following_count,video_count`
     - **YouTube**: `GET /channels?part=statistics&id={channelId}`
     - **Pinterest**: `GET /user_account` → follower_count, pin_count
     - **Threads**: `GET /{threadsUserId}?fields=threads_profile_picture_url,threads_biography`
     - **Bluesky**: `GET com.atproto.repo.describeRepo` + `app.bsky.actor.getProfile`
     - **Mastodon**: `GET /api/v1/accounts/verify_credentials`
   - Update `followers_count`, `following_count`, `posts_count`, `engagement_rate`, `last_synced_at`

3. **`getAccountHealth()`** — Enhance with real checks:
   - Check if token is expired → health -= 50
   - Check last_synced_at age → if > 24h health -= 10
   - Check last_error → if recent error health -= 20
   - Check rate_limited status → health -= 30

4. **Add new function `disconnectSocialAccount()`** — Revoke platform tokens:
   - For Facebook: `DELETE /{userId}/permissions`
   - For Twitter: `POST /2/oauth2/revoke`
   - For LinkedIn: No revocation endpoint — just delete locally
   - For Google/YouTube: `POST https://oauth2.googleapis.com/revoke?token={token}`
   - For Pinterest: No revocation — delete locally
   - For Bluesky: `POST com.atproto.server.deleteSession`
   - For Mastodon: `POST /oauth/revoke`
   - Then delete from `social_accounts` table

---

## Task 11: Update Accounts Page UI

### Modify `src/app/(dashboard)/dashboard/sites/[siteId]/social/accounts/page.tsx`

**Changes:**
1. **Remove** the "requires configuration" toast from connect buttons
2. **Add** a server fetch for configured platforms using `getConfiguredPlatforms()`
3. **For each platform card:**
   - If configured → show "Connect" button that calls the OAuth API route
   - If not configured → show "Not Configured" badge with tooltip explaining which env vars are needed
   - If Bluesky → show inline handle + app password form
   - If Mastodon → show instance URL input + connect button
4. **For connected accounts:**
   - Show real follower/following/post counts (from DB, synced by `syncAccountStats`)
   - Show account health indicator (green/yellow/red based on `health_score`)
   - Show "Sync Now" button that calls `syncAccountStats()`
   - Show "Refresh Token" button that calls `refreshAccountToken()`
   - Show "Disconnect" button with confirmation dialog
5. **Add** a success banner when returning from OAuth callback with `?connected=[platform]` param
6. **Add** error handling for `?error=[type]` params from callback

**Client-side OAuth redirect pattern:**
```typescript
const handleConnect = async (platform: string) => {
  const response = await fetch(`/api/social/oauth/${platform}?siteId=${siteId}`)
  const data = await response.json()
  if (data.url) {
    window.location.href = data.url // Redirect to platform OAuth
  } else {
    toast.error(data.error || 'Failed to start connection')
  }
}
```

---

## Task 12: Add Platform API Helper Functions

### Create `src/modules/social-media/lib/platform-api.ts`

Generic helpers for making API calls to each platform:

```typescript
'use server'

/**
 * Platform API Helpers
 * 
 * PHASE SM-01: Standardized API call wrappers for each platform
 */

/**
 * Make an authenticated request to the Meta Graph API (Facebook, Instagram, Threads)
 */
export async function metaGraphRequest(accessToken: string, endpoint: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`https://graph.facebook.com/v21.0${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  url.searchParams.set('access_token', accessToken)
  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Meta API error: ${res.status}`)
  }
  return res.json()
}

/**
 * Make an authenticated request to the Twitter API v2
 */
export async function twitterRequest(accessToken: string, endpoint: string, options?: RequestInit): Promise<any> {
  const res = await fetch(`https://api.twitter.com/2${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Twitter API error: ${res.status}`)
  }
  return res.json()
}

// ... Similar helpers for LinkedIn, TikTok, YouTube, Pinterest, Mastodon, Bluesky
```

---

## Task 13: Wire Everything Together in Layout Navigation

### Modify `src/app/(dashboard)/dashboard/sites/[siteId]/social/layout.tsx`

Ensure the nav items include the Accounts link (already exists) and that the nav visually indicates if any accounts have expired tokens (optional badge on the Accounts nav item).

No major changes needed here — the layout already works. Just verify it renders correctly.

---

## Verification Checklist

```
□ pnpm install completes without errors
□ npx tsc --noEmit passes with zero errors
□ Migration SQL runs successfully in Supabase SQL Editor
□ Environment variables documented in .env.example or .env.local.example
□ Accounts page renders with correct platform cards
□ Platforms with configured env vars show "Connect" button
□ Platforms without env vars show "Not Configured" indicator
□ Clicking "Connect" on Facebook redirects to Facebook OAuth
□ OAuth callback saves account to social_accounts table
□ Connected accounts show real follower/following counts
□ "Sync Now" updates counts from real platform API
□ "Refresh Token" extends token expiry
□ "Disconnect" removes account (with confirmation)
□ Bluesky connect form works with handle + app password
□ Mastodon connect form asks for instance URL, then redirects to OAuth
□ Token refresh handles expired tokens gracefully
□ Account health score updates based on token/sync status
□ No mock data anywhere in accounts UI
□ All error states show meaningful messages
□ Commit: git commit -m "feat(social-media): PHASE-SM-01: OAuth & Account Integration"
```

---

## What API Keys to Get (For Testing)

To test this phase, you need at minimum ONE platform configured. The easiest to set up:

### Fastest: Bluesky (No API keys needed)
1. Go to https://bsky.app/settings/app-passwords
2. Create an App Password
3. Use your handle + app password in the connect form
4. Done — no env vars needed

### Second Fastest: Meta (Facebook/Instagram/Threads)
1. Go to https://developers.facebook.com
2. Create an App (Business type)
3. Add "Facebook Login" product
4. Get App ID and App Secret
5. Add to `.env.local`:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   ```
6. In Meta App settings, add your callback URL: `{APP_URL}/api/social/oauth/callback`
7. This gives you Facebook, Instagram, AND Threads with one set of credentials

### Third: Twitter/X
1. Go to https://developer.twitter.com
2. Create a project & app
3. Enable OAuth 2.0
4. Get API Key and API Secret
5. Add callback URL in Twitter Developer Portal
6. Add to `.env.local`:
   ```
   TWITTER_API_KEY=your_api_key
   TWITTER_API_SECRET=your_api_secret
   ```
