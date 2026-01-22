'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Validate an embed token
 */
export async function validateEmbedToken(
  token: string,
  siteId: string,
  moduleId: string
): Promise<boolean> {
  if (!token) return false

  try {
    // Decode token
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString())
    
    // Check expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return false
    }

    // Verify siteId and moduleId match
    if (decoded.siteId !== siteId || decoded.moduleId !== moduleId) {
      return false
    }

    // Optional: Check against stored tokens for revocation
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data: storedToken } = await db
      .from('module_embed_tokens')
      .select('id, is_revoked')
      .eq('site_id', siteId)
      .eq('module_id', moduleId)
      .single()

    if (storedToken?.is_revoked) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Revoke an embed token
 */
export async function revokeEmbedToken(
  siteId: string,
  moduleId: string
): Promise<boolean> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  
  const { error } = await db
    .from('module_embed_tokens')
    .update({ is_revoked: true, updated_at: new Date().toISOString() })
    .eq('site_id', siteId)
    .eq('module_id', moduleId)

  return !error
}

/**
 * Regenerate an embed token (revokes old one and creates new)
 */
export async function regenerateEmbedToken(
  siteId: string,
  moduleId: string,
  expiresInDays: number = 365
): Promise<{ token: string; expiresAt: Date }> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  // Generate new secure token
  const tokenData = {
    siteId,
    moduleId,
    exp: expiresAt.getTime(),
    regenerated: Date.now() // Ensures new token is different
  }
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64url')

  // Update token in database (replaces old one)
  await db
    .from('module_embed_tokens')
    .upsert({
      site_id: siteId,
      module_id: moduleId,
      token_hash: Buffer.from(token).toString('base64'),
      is_revoked: false,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'site_id,module_id'
    })

  return { token, expiresAt }
}

/**
 * Check if a token exists and is valid for a site/module combination
 */
export async function checkTokenStatus(
  siteId: string,
  moduleId: string
): Promise<{
  exists: boolean
  isRevoked: boolean
  isExpired: boolean
  expiresAt: Date | null
}> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  
  const { data } = await db
    .from('module_embed_tokens')
    .select('is_revoked, expires_at')
    .eq('site_id', siteId)
    .eq('module_id', moduleId)
    .single()

  if (!data) {
    return {
      exists: false,
      isRevoked: false,
      isExpired: false,
      expiresAt: null
    }
  }

  const expiresAt = new Date(data.expires_at)
  const isExpired = expiresAt < new Date()

  return {
    exists: true,
    isRevoked: data.is_revoked || false,
    isExpired,
    expiresAt
  }
}
