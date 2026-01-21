/**
 * API Key Management Service
 * 
 * Phase EM-12: Module API Gateway
 * 
 * Provides functionality for creating, managing, and revoking API keys
 * that allow external access to module APIs.
 * 
 * @see phases/enterprise-modules/PHASE-EM-12-MODULE-API-GATEWAY.md
 */

import { createClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'

// =============================================================
// TYPES
// =============================================================

export interface CreateApiKeyInput {
  moduleId: string
  siteId: string
  agencyId: string
  name: string
  scopes?: string[]
  expiresInDays?: number
  rateLimitPerMinute?: number
  rateLimitPerDay?: number
  allowedIps?: string[]
  allowedOrigins?: string[]
}

export interface ApiKeyResult {
  id: string
  key: string  // Only returned once on creation!
  keyPrefix: string
  name: string
  scopes: string[]
  expiresAt: string | null
  createdAt: string
}

export interface ApiKeyListItem {
  id: string
  keyPrefix: string
  name: string
  scopes: string[]
  isActive: boolean
  expiresAt: string | null
  lastUsedAt: string | null
  requestCount: number
  createdAt: string
}

export interface ApiKeyStats {
  totalRequests: number
  requestsToday: number
  requestsThisWeek: number
  lastUsed: string | null
}

// =============================================================
// API KEY CREATION
// =============================================================

/**
 * Generate a new API key
 * 
 * IMPORTANT: The full key is only returned once during creation.
 * Store it securely - it cannot be retrieved later.
 * 
 * @param input - Configuration for the new API key
 * @param userId - ID of the user creating the key
 * @returns The created API key with the full key value
 */
export async function createApiKey(
  input: CreateApiKeyInput,
  userId: string
): Promise<ApiKeyResult> {
  // Cast to any until migration is run and types regenerated
  const supabase = createAdminClient()
  
  // Generate secure random key
  const keyBytes = new Uint8Array(32)
  crypto.getRandomValues(keyBytes)
  const keyHex = Array.from(keyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  const key = `dmc_live_${keyHex}`
  const keyPrefix = key.substring(0, 12)
  
  // Hash for storage
  const keyHash = await hashKey(key)
  
  // Calculate expiry
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null
  
  const { data, error } = await supabase
    .from('module_api_keys')
    .insert({
      module_id: input.moduleId,
      site_id: input.siteId,
      agency_id: input.agencyId,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      name: input.name,
      scopes: input.scopes || ['*'],
      rate_limit_per_minute: input.rateLimitPerMinute || 60,
      rate_limit_per_day: input.rateLimitPerDay || 10000,
      allowed_ips: input.allowedIps || [],
      allowed_origins: input.allowedOrigins || [],
      expires_at: expiresAt,
      created_by: userId
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create API key:', error)
    throw new Error(`Failed to create API key: ${error.message}`)
  }
  
  return {
    id: data.id,
    key,  // Return the actual key (only time it's visible!)
    keyPrefix,
    name: data.name,
    scopes: data.scopes || [],
    expiresAt: data.expires_at,
    createdAt: data.created_at ?? new Date().toISOString()
  }
}

// =============================================================
// API KEY LISTING
// =============================================================

/**
 * List API keys for a module/site combination
 * 
 * Note: The full key is never returned - only the prefix for identification.
 * 
 * @param moduleId - The module ID
 * @param siteId - The site ID
 * @returns List of API keys (without full key values)
 */
export async function listApiKeys(
  moduleId: string,
  siteId: string
): Promise<ApiKeyListItem[]> {
  // Cast to any until migration is run and types regenerated
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('module_api_keys')
    .select('id, key_prefix, name, scopes, is_active, expires_at, last_used_at, request_count, created_at')
    .eq('module_id', moduleId)
    .eq('site_id', siteId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Failed to list API keys:', error)
    throw new Error(`Failed to list API keys: ${error.message}`)
  }

  return (data || []).map((key) => ({
    id: key.id,
    keyPrefix: key.key_prefix,
    name: key.name,
    scopes: key.scopes || [],
    isActive: key.is_active ?? true,
    expiresAt: key.expires_at,
    lastUsedAt: key.last_used_at,
    requestCount: key.request_count || 0,
    createdAt: key.created_at ?? new Date().toISOString()
  }))
}

/**
 * Get a single API key by ID
 * 
 * @param keyId - The API key ID
 * @returns The API key details (without full key value)
 */
export async function getApiKey(keyId: string): Promise<ApiKeyListItem | null> {
  // Cast to any until migration is run and types regenerated
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('module_api_keys')
    .select('id, key_prefix, name, scopes, is_active, expires_at, last_used_at, request_count, created_at')
    .eq('id', keyId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return {
    id: data.id,
    keyPrefix: data.key_prefix,
    name: data.name,
    scopes: data.scopes || [],
    isActive: data.is_active ?? true,
    expiresAt: data.expires_at,
    lastUsedAt: data.last_used_at,
    requestCount: data.request_count || 0,
    createdAt: data.created_at ?? new Date().toISOString()
  }
}

// =============================================================
// API KEY MANAGEMENT
// =============================================================

/**
 * Revoke an API key
 * 
 * Once revoked, the key cannot be used and cannot be re-activated.
 * 
 * @param keyId - The API key ID to revoke
 * @param userId - ID of the user revoking the key
 */
export async function revokeApiKey(
  keyId: string,
  userId: string
): Promise<void> {
  // Cast to any until migration is run and types regenerated
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('module_api_keys')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: userId
    })
    .eq('id', keyId)
  
  if (error) {
    console.error('Failed to revoke API key:', error)
    throw new Error(`Failed to revoke API key: ${error.message}`)
  }
}

/**
 * Update API key settings
 * 
 * Note: The key value itself cannot be changed.
 * 
 * @param keyId - The API key ID
 * @param updates - The fields to update
 */
export async function updateApiKey(
  keyId: string,
  updates: {
    name?: string
    scopes?: string[]
    rateLimitPerMinute?: number
    rateLimitPerDay?: number
    allowedIps?: string[]
    allowedOrigins?: string[]
  }
): Promise<void> {
  // Cast to any until migration is run and types regenerated
  const supabase = await createClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {}
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.scopes !== undefined) updateData.scopes = updates.scopes
  if (updates.rateLimitPerMinute !== undefined) updateData.rate_limit_per_minute = updates.rateLimitPerMinute
  if (updates.rateLimitPerDay !== undefined) updateData.rate_limit_per_day = updates.rateLimitPerDay
  if (updates.allowedIps !== undefined) updateData.allowed_ips = updates.allowedIps
  if (updates.allowedOrigins !== undefined) updateData.allowed_origins = updates.allowedOrigins
  
  if (Object.keys(updateData).length === 0) {
    return // Nothing to update
  }
  
  const { error } = await supabase
    .from('module_api_keys')
    .update(updateData)
    .eq('id', keyId)
  
  if (error) {
    console.error('Failed to update API key:', error)
    throw new Error(`Failed to update API key: ${error.message}`)
  }
}

/**
 * Regenerate an API key (creates new key, revokes old one)
 * 
 * @param keyId - The API key ID to regenerate
 * @param userId - ID of the user regenerating the key
 * @returns The new API key with the full key value
 */
export async function regenerateApiKey(
  keyId: string,
  userId: string
): Promise<ApiKeyResult> {
  // Cast to any until migration is run and types regenerated
  const supabase = await createClient()
  
  // Get the existing key details
  const { data: existingKey, error: fetchError } = await supabase
    .from('module_api_keys')
    .select('*')
    .eq('id', keyId)
    .single()
  
  if (fetchError || !existingKey) {
    throw new Error('API key not found')
  }
  
  // Revoke the old key
  await revokeApiKey(keyId, userId)
  
  // Create a new key with the same settings
  return await createApiKey({
    moduleId: existingKey.module_id,
    siteId: existingKey.site_id,
    agencyId: existingKey.agency_id,
    name: existingKey.name,
    scopes: existingKey.scopes ?? undefined,
    rateLimitPerMinute: existingKey.rate_limit_per_minute ?? undefined,
    rateLimitPerDay: existingKey.rate_limit_per_day ?? undefined,
    allowedIps: existingKey.allowed_ips ?? undefined,
    allowedOrigins: existingKey.allowed_origins ?? undefined
  }, userId)
}

// =============================================================
// API KEY STATISTICS
// =============================================================

/**
 * Get usage statistics for an API key
 * 
 * @param keyId - The API key ID
 * @returns Usage statistics
 */
export async function getApiKeyStats(keyId: string): Promise<ApiKeyStats> {
  // Cast to any until migration is run and types regenerated
  const supabase = createAdminClient()
  
  const { data, error } = await supabase.rpc('get_api_key_stats', {
    p_api_key_id: keyId
  })
  
  if (error || !data?.[0]) {
    return {
      totalRequests: 0,
      requestsToday: 0,
      requestsThisWeek: 0,
      lastUsed: null
    }
  }
  
  const stats = data[0]
  return {
    totalRequests: stats.total_requests || 0,
    requestsToday: stats.requests_today || 0,
    requestsThisWeek: stats.requests_this_week || 0,
    lastUsed: stats.last_used
  }
}

// =============================================================
// SCOPES
// =============================================================

/**
 * Common API scopes
 */
export const API_SCOPES = {
  // Wildcard
  ALL: '*',
  
  // Read operations
  READ_ALL: 'read:*',
  READ_CONTACTS: 'read:contacts',
  READ_COMPANIES: 'read:companies',
  READ_DEALS: 'read:deals',
  READ_PRODUCTS: 'read:products',
  READ_ORDERS: 'read:orders',
  READ_APPOINTMENTS: 'read:appointments',
  
  // Write operations
  WRITE_ALL: 'write:*',
  WRITE_CONTACTS: 'write:contacts',
  WRITE_COMPANIES: 'write:companies',
  WRITE_DEALS: 'write:deals',
  WRITE_PRODUCTS: 'write:products',
  WRITE_ORDERS: 'write:orders',
  WRITE_APPOINTMENTS: 'write:appointments',
  
  // Delete operations
  DELETE_ALL: 'delete:*',
  DELETE_CONTACTS: 'delete:contacts',
  DELETE_COMPANIES: 'delete:companies',
  DELETE_DEALS: 'delete:deals',
  DELETE_PRODUCTS: 'delete:products',
  DELETE_ORDERS: 'delete:orders',
  DELETE_APPOINTMENTS: 'delete:appointments',
  
  // Admin operations
  ADMIN: 'admin:*',
  ADMIN_USERS: 'admin:users',
  ADMIN_SETTINGS: 'admin:settings'
} as const

/**
 * Check if a set of scopes includes a required scope
 * 
 * @param userScopes - The scopes the user/key has
 * @param requiredScope - The scope required for the operation
 * @returns True if the user has the required scope
 */
export function hasScope(userScopes: string[], requiredScope: string): boolean {
  // Wildcard matches everything
  if (userScopes.includes('*')) return true
  
  // Exact match
  if (userScopes.includes(requiredScope)) return true
  
  // Check category wildcards (e.g., 'read:*' matches 'read:contacts')
  const [action, resource] = requiredScope.split(':')
  if (resource && userScopes.includes(`${action}:*`)) return true
  
  return false
}

// =============================================================
// HELPERS
// =============================================================

/**
 * Hash a key for secure storage
 */
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate an API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Keys should be: dmc_live_ followed by 64 hex characters
  return /^dmc_live_[a-f0-9]{64}$/.test(key)
}

/**
 * Mask an API key for display (show only prefix)
 */
export function maskApiKey(key: string): string {
  if (key.length < 12) return '****'
  return key.substring(0, 12) + '****...****'
}
