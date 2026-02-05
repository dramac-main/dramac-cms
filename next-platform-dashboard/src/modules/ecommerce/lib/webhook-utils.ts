/**
 * Webhook Utilities
 * 
 * Phase ECOM-43A: Integrations & Webhooks - Schema & Actions
 * 
 * Utilities for signing, verifying, and delivering webhooks.
 */

import type { 
  WebhookPayload,
  WebhookEventType 
} from '@/modules/ecommerce/types/integration-types'

// ============================================================================
// CONSTANTS
// ============================================================================

export const WEBHOOK_SIGNATURE_HEADER = 'X-Webhook-Signature'
export const WEBHOOK_TIMESTAMP_HEADER = 'X-Webhook-Timestamp'
export const WEBHOOK_ID_HEADER = 'X-Webhook-ID'
const SIGNATURE_TOLERANCE_SECONDS = 300 // 5 minutes

// ============================================================================
// SECRET GENERATION
// ============================================================================

/**
 * Generate a webhook signing secret
 */
export function generateWebhookSecret(): string {
  const array = new Uint8Array(24)
  if (typeof window !== 'undefined') {
    window.crypto.getRandomValues(array)
  } else if (typeof globalThis.crypto !== 'undefined') {
    globalThis.crypto.getRandomValues(array)
  }
  
  const base64 = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  return `whsec_${base64}`
}

// ============================================================================
// SIGNATURE GENERATION & VERIFICATION
// ============================================================================

/**
 * Generate signature for webhook payload (async)
 */
export async function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number
): Promise<string> {
  const message = `${timestamp}.${payload}`
  const encoder = new TextEncoder()
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Create signature header value
 */
export async function createSignatureHeader(
  payload: string,
  secret: string,
  timestamp: number
): Promise<string> {
  const signature = await generateWebhookSignature(payload, secret, timestamp)
  return `t=${timestamp},v1=${signature}`
}

/**
 * Parse signature header
 */
export function parseSignatureHeader(header: string): {
  timestamp: number
  signatures: string[]
} | null {
  const parts = header.split(',')
  let timestamp = 0
  const signatures: string[] = []
  
  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') {
      timestamp = parseInt(value, 10)
    } else if (key.startsWith('v')) {
      signatures.push(value)
    }
  }
  
  if (timestamp === 0 || signatures.length === 0) {
    return null
  }
  
  return { timestamp, signatures }
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  payload: string,
  header: string,
  secret: string,
  toleranceSeconds: number = SIGNATURE_TOLERANCE_SECONDS
): Promise<{ valid: boolean; error?: string }> {
  const parsed = parseSignatureHeader(header)
  
  if (!parsed) {
    return { valid: false, error: 'Invalid signature header format' }
  }
  
  const { timestamp, signatures } = parsed
  
  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return { valid: false, error: 'Timestamp outside tolerance window' }
  }
  
  // Generate expected signature
  const expectedSignature = await generateWebhookSignature(payload, secret, timestamp)
  
  // Compare signatures
  const isValid = signatures.some(sig => sig === expectedSignature)
  
  if (!isValid) {
    return { valid: false, error: 'Signature mismatch' }
  }
  
  return { valid: true }
}

// ============================================================================
// PAYLOAD CONSTRUCTION
// ============================================================================

/**
 * Create a webhook payload
 */
export function createWebhookPayload<T>(
  eventType: WebhookEventType,
  data: T,
  siteId: string,
  apiVersion: string = '2024-01-01'
): WebhookPayload<T> {
  return {
    id: crypto.randomUUID(),
    event_type: eventType,
    created_at: new Date().toISOString(),
    data,
    metadata: {
      site_id: siteId,
      api_version: apiVersion,
      attempt_number: 1
    }
  }
}

/**
 * Serialize payload for signing
 */
export function serializePayload(payload: WebhookPayload): string {
  return JSON.stringify(payload)
}

// ============================================================================
// DELIVERY
// ============================================================================

interface DeliveryOptions {
  timeout?: number
  headers?: Record<string, string>
}

interface DeliveryResult {
  success: boolean
  status?: number
  body?: string
  headers?: Record<string, string>
  error?: string
  duration_ms: number
}

/**
 * Deliver a webhook to an endpoint
 */
export async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string,
  options: DeliveryOptions = {}
): Promise<DeliveryResult> {
  const { timeout = 30000, headers = {} } = options
  const startTime = Date.now()
  
  try {
    const payloadString = serializePayload(payload)
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = await createSignatureHeader(payloadString, secret, timestamp)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [WEBHOOK_SIGNATURE_HEADER]: signature,
        [WEBHOOK_TIMESTAMP_HEADER]: String(timestamp),
        [WEBHOOK_ID_HEADER]: payload.id,
        ...headers
      },
      body: payloadString,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    const duration_ms = Date.now() - startTime
    const body = await response.text()
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })
    
    return {
      success: response.ok,
      status: response.status,
      body,
      headers: responseHeaders,
      duration_ms
    }
  } catch (error) {
    const duration_ms = Date.now() - startTime
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out',
          duration_ms
        }
      }
      return {
        success: false,
        error: error.message,
        duration_ms
      }
    }
    
    return {
      success: false,
      error: 'Unknown error',
      duration_ms
    }
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Calculate next retry delay with exponential backoff
 */
export function calculateRetryDelay(
  attemptNumber: number,
  baseDelaySeconds: number = 60,
  maxDelaySeconds: number = 86400 // 24 hours
): number {
  const delay = baseDelaySeconds * Math.pow(2, attemptNumber - 1)
  return Math.min(delay, maxDelaySeconds)
}

/**
 * Determine if delivery should be retried
 */
export function shouldRetry(
  status: number | undefined,
  attemptNumber: number,
  maxRetries: number
): boolean {
  // Don't retry if max attempts reached
  if (attemptNumber >= maxRetries) {
    return false
  }
  
  // Retry on network errors (no status)
  if (status === undefined) {
    return true
  }
  
  // Retry on 5xx server errors
  if (status >= 500 && status < 600) {
    return true
  }
  
  // Retry on 429 rate limit
  if (status === 429) {
    return true
  }
  
  // Don't retry on 4xx client errors (except 429)
  return false
}

// ============================================================================
// EVENT CATEGORIES
// ============================================================================

/**
 * Get category for an event type
 */
export function getEventCategory(eventType: WebhookEventType): string {
  return eventType.split('.')[0]
}

/**
 * Group events by category
 */
export function groupEventsByCategory(
  events: WebhookEventType[]
): Record<string, WebhookEventType[]> {
  const groups: Record<string, WebhookEventType[]> = {}
  
  for (const event of events) {
    const category = getEventCategory(event)
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(event)
  }
  
  return groups
}

// ============================================================================
// HEADER CONSTANTS (for export)
// ============================================================================

export const WEBHOOK_HEADERS = {
  SIGNATURE: WEBHOOK_SIGNATURE_HEADER,
  TIMESTAMP: WEBHOOK_TIMESTAMP_HEADER,
  ID: WEBHOOK_ID_HEADER
}
