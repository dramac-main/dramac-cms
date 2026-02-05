/**
 * API Key Utilities
 * 
 * Phase ECOM-43A: Integrations & Webhooks - Schema & Actions
 * 
 * Utilities for generating, validating, and managing API keys.
 */

import type { ApiKeyScope } from '@/modules/ecommerce/types/integration-types'

// ============================================================================
// CONSTANTS
// ============================================================================

const API_KEY_PREFIX = 'sk'
const API_KEY_LENGTH = 48

// ============================================================================
// KEY GENERATION (Browser-safe)
// ============================================================================

/**
 * Generate a secure API key (works in both Node.js and browser)
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  // Use crypto.getRandomValues for browser compatibility
  const array = new Uint8Array(32)
  if (typeof window !== 'undefined') {
    window.crypto.getRandomValues(array)
  } else if (typeof globalThis.crypto !== 'undefined') {
    globalThis.crypto.getRandomValues(array)
  }
  
  const base64 = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '')
  
  const key = `${API_KEY_PREFIX}_${base64}`.substring(0, API_KEY_LENGTH)
  const prefix = key.substring(0, 10)
  const hash = hashApiKeySync(key)
  
  return { key, prefix, hash }
}

/**
 * Hash an API key for storage (sync version using SubtleCrypto workaround)
 */
function hashApiKeySync(key: string): string {
  // Simple hash for client-side - server will do proper SHA-256
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, '0')
}

/**
 * Hash an API key for storage (async version using SubtleCrypto)
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * Verify an API key against its hash
 */
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  const computedHash = await hashApiKey(key)
  return computedHash === hash
}

// ============================================================================
// KEY VALIDATION
// ============================================================================

/**
 * Check if an API key format is valid
 */
export function isValidApiKeyFormat(key: string): boolean {
  // sk_xxxxx format, 48 chars total
  const pattern = /^sk_[A-Za-z0-9]{45}$/
  return pattern.test(key)
}

/**
 * Extract prefix from API key
 */
export function extractKeyPrefix(key: string): string {
  return key.substring(0, 10)
}

// ============================================================================
// SCOPE CHECKING
// ============================================================================

/**
 * All available API key scopes
 */
export const ALL_SCOPES: ApiKeyScope[] = [
  'read:products',
  'write:products',
  'read:orders',
  'write:orders',
  'read:customers',
  'write:customers',
  'read:inventory',
  'write:inventory',
  'read:analytics',
  'webhooks:manage'
]

/**
 * Scope descriptions for UI
 */
export const SCOPE_DESCRIPTIONS: Record<ApiKeyScope, string> = {
  'read:products': 'View products and variants',
  'write:products': 'Create, update, delete products',
  'read:orders': 'View orders and order history',
  'write:orders': 'Create and update orders',
  'read:customers': 'View customer information',
  'write:customers': 'Create and update customers',
  'read:inventory': 'View inventory levels',
  'write:inventory': 'Adjust inventory',
  'read:analytics': 'View analytics and reports',
  'webhooks:manage': 'Manage webhook endpoints'
}

/**
 * Group scopes by resource
 */
export function groupScopesByResource(scopes: ApiKeyScope[]): Record<string, ApiKeyScope[]> {
  const groups: Record<string, ApiKeyScope[]> = {}
  
  for (const scope of scopes) {
    const [, resource] = scope.split(':')
    if (!groups[resource]) {
      groups[resource] = []
    }
    groups[resource].push(scope)
  }
  
  return groups
}

/**
 * Check if scopes include a specific permission
 */
export function hasScope(scopes: ApiKeyScope[], required: ApiKeyScope): boolean {
  return scopes.includes(required)
}

/**
 * Check if scopes include any of the required permissions
 */
export function hasAnyScope(scopes: ApiKeyScope[], required: ApiKeyScope[]): boolean {
  return required.some(r => scopes.includes(r))
}

/**
 * Check if scopes include all required permissions
 */
export function hasAllScopes(scopes: ApiKeyScope[], required: ApiKeyScope[]): boolean {
  return required.every(r => scopes.includes(r))
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Default rate limit settings
 */
export const DEFAULT_RATE_LIMIT = {
  requests: 1000,
  window: 3600 // 1 hour in seconds
}

/**
 * Rate limit presets
 */
export const RATE_LIMIT_PRESETS = {
  low: { requests: 100, window: 3600 },
  standard: { requests: 1000, window: 3600 },
  high: { requests: 10000, window: 3600 },
  unlimited: { requests: -1, window: 3600 }
}

// ============================================================================
// KEY MASKING
// ============================================================================

/**
 * Mask an API key for display (show only prefix)
 */
export function maskApiKey(key: string): string {
  if (key.length < 10) return '***'
  return `${key.substring(0, 10)}${'•'.repeat(Math.min(key.length - 10, 20))}`
}

/**
 * Format key for display with last 4 characters
 */
export function formatKeyForDisplay(keyPrefix: string): string {
  return `${keyPrefix}${'•'.repeat(20)}`
}
