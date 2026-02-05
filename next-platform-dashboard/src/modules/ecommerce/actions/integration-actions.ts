/**
 * Integration Server Actions
 * 
 * Phase ECOM-43A: Integrations & Webhooks - Schema & Actions
 * 
 * Server actions for managing API keys, webhooks, and integrations.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  ApiKey,
  ApiKeyWithSecret,
  CreateApiKeyInput,
  UpdateApiKeyInput,
  WebhookEndpoint,
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookDelivery,
  WebhookEventTypeInfo,
  Integration,
  ConnectIntegrationInput,
  UpdateIntegrationInput,
  IntegrationLog,
  SyncJob,
  CreateSyncJobInput
} from '../types/integration-types'

const TABLE_PREFIX = 'mod_ecommod01'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get supabase client with any type to allow dynamic table names
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getModuleClient(): Promise<any> {
  const supabase = await createClient()
  return supabase
}

/**
 * Generate a secure API key (server-side)
 */
function generateSecureApiKey(): { key: string; prefix: string; hash: string } {
  const crypto = require('crypto')
  const randomBytes = crypto.randomBytes(32)
  const base64 = randomBytes.toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '')
  
  const key = `sk_${base64}`.substring(0, 48)
  const prefix = key.substring(0, 10)
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  
  return { key, prefix, hash }
}

/**
 * Generate webhook secret (server-side)
 */
function generateSecureWebhookSecret(): string {
  const crypto = require('crypto')
  const randomBytes = crypto.randomBytes(24)
  const base64 = randomBytes.toString('base64url')
  return `whsec_${base64}`
}

// ============================================================================
// API KEYS
// ============================================================================

/**
 * Get all API keys for a site
 */
export async function getApiKeys(siteId: string): Promise<ApiKey[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_api_keys`)
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data as ApiKey[]
  } catch (error) {
    console.error('Error getting API keys:', error)
    return []
  }
}

/**
 * Create a new API key
 * Returns the full key only once - it cannot be retrieved later
 */
export async function createApiKey(
  siteId: string,
  input: CreateApiKeyInput
): Promise<{ success: boolean; key?: ApiKeyWithSecret; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Generate key
    const { key: secretKey, prefix, hash } = generateSecureApiKey()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_api_keys`)
      .insert({
        site_id: siteId,
        name: input.name,
        key_prefix: prefix,
        key_hash: hash,
        scopes: input.scopes,
        rate_limit_requests: input.rate_limit_requests ?? 1000,
        rate_limit_window: input.rate_limit_window ?? 3600,
        allowed_ips: input.allowed_ips ?? [],
        allowed_origins: input.allowed_origins ?? [],
        expires_at: input.expires_at,
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/dashboard/[siteId]/settings')
    
    return {
      success: true,
      key: {
        ...(data as ApiKey),
        secret_key: secretKey
      }
    }
  } catch (error) {
    console.error('Error creating API key:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create API key' }
  }
}

/**
 * Update an API key
 */
export async function updateApiKey(
  keyId: string,
  input: UpdateApiKeyInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_api_keys`)
      .update(input)
      .eq('id', keyId)
    
    if (error) throw error
    
    revalidatePath('/dashboard/[siteId]/settings')
    return { success: true }
  } catch (error) {
    console.error('Error updating API key:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update API key' }
  }
}

/**
 * Revoke (delete) an API key
 */
export async function revokeApiKey(
  keyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_api_keys`)
      .delete()
      .eq('id', keyId)
    
    if (error) throw error
    
    revalidatePath('/dashboard/[siteId]/settings')
    return { success: true }
  } catch (error) {
    console.error('Error revoking API key:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to revoke API key' }
  }
}

/**
 * Rotate an API key (generate new key, same permissions)
 */
export async function rotateApiKey(
  keyId: string
): Promise<{ success: boolean; key?: ApiKeyWithSecret; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Get existing key
    const { data: existing, error: fetchError } = await supabase
      .from(`${TABLE_PREFIX}_api_keys`)
      .select('*')
      .eq('id', keyId)
      .single()
    
    if (fetchError || !existing) {
      return { success: false, error: 'API key not found' }
    }
    
    // Generate new key
    const { key: secretKey, prefix, hash } = generateSecureApiKey()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_api_keys`)
      .update({
        key_prefix: prefix,
        key_hash: hash
      })
      .eq('id', keyId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/dashboard/[siteId]/settings')
    
    return {
      success: true,
      key: {
        ...(data as ApiKey),
        secret_key: secretKey
      }
    }
  } catch (error) {
    console.error('Error rotating API key:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to rotate API key' }
  }
}

// ============================================================================
// WEBHOOKS
// ============================================================================

/**
 * Get all webhook endpoints for a site
 */
export async function getWebhookEndpoints(siteId: string): Promise<WebhookEndpoint[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_webhook_endpoints`)
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data as WebhookEndpoint[]
  } catch (error) {
    console.error('Error getting webhook endpoints:', error)
    return []
  }
}

/**
 * Get all available webhook event types
 */
export async function getWebhookEventTypes(): Promise<WebhookEventTypeInfo[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_webhook_event_types`)
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
    
    if (error) throw error
    
    return data as WebhookEventTypeInfo[]
  } catch (error) {
    console.error('Error getting webhook event types:', error)
    return []
  }
}

/**
 * Create a new webhook endpoint
 */
export async function createWebhookEndpoint(
  siteId: string,
  input: CreateWebhookInput
): Promise<{ success: boolean; endpoint?: WebhookEndpoint; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const secret = generateSecureWebhookSecret()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_webhook_endpoints`)
      .insert({
        site_id: siteId,
        name: input.name,
        url: input.url,
        description: input.description,
        secret,
        events: input.events,
        timeout_seconds: input.timeout_seconds ?? 30,
        max_retries: input.max_retries ?? 3,
        retry_delay_seconds: input.retry_delay_seconds ?? 60,
        custom_headers: input.custom_headers ?? {}
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/dashboard/[siteId]/settings')
    return { success: true, endpoint: data as WebhookEndpoint }
  } catch (error) {
    console.error('Error creating webhook endpoint:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create webhook endpoint' }
  }
}

/**
 * Update a webhook endpoint
 */
export async function updateWebhookEndpoint(
  endpointId: string,
  input: UpdateWebhookInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_webhook_endpoints`)
      .update(input)
      .eq('id', endpointId)
    
    if (error) throw error
    
    revalidatePath('/dashboard/[siteId]/settings')
    return { success: true }
  } catch (error) {
    console.error('Error updating webhook endpoint:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update webhook endpoint' }
  }
}

/**
 * Delete a webhook endpoint
 */
export async function deleteWebhookEndpoint(
  endpointId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_webhook_endpoints`)
      .delete()
      .eq('id', endpointId)
    
    if (error) throw error
    
    revalidatePath('/dashboard/[siteId]/settings')
    return { success: true }
  } catch (error) {
    console.error('Error deleting webhook endpoint:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete webhook endpoint' }
  }
}

/**
 * Rotate webhook secret
 */
export async function rotateWebhookSecret(
  endpointId: string
): Promise<{ success: boolean; secret?: string; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const newSecret = generateSecureWebhookSecret()
    
    // Get current version
    const { data: current } = await supabase
      .from(`${TABLE_PREFIX}_webhook_endpoints`)
      .select('secret_version')
      .eq('id', endpointId)
      .single()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_webhook_endpoints`)
      .update({
        secret: newSecret,
        secret_version: (current?.secret_version ?? 0) + 1
      })
      .eq('id', endpointId)
    
    if (error) throw error
    
    revalidatePath('/dashboard/[siteId]/settings')
    return { success: true, secret: newSecret }
  } catch (error) {
    console.error('Error rotating webhook secret:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to rotate webhook secret' }
  }
}

/**
 * Get webhook delivery history
 */
export async function getWebhookDeliveries(
  endpointId: string,
  limit: number = 50
): Promise<WebhookDelivery[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_webhook_deliveries`)
      .select('*')
      .eq('endpoint_id', endpointId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data as WebhookDelivery[]
  } catch (error) {
    console.error('Error getting webhook deliveries:', error)
    return []
  }
}

/**
 * Test a webhook endpoint
 */
export async function testWebhookEndpoint(
  endpointId: string
): Promise<{ success: boolean; delivery?: WebhookDelivery; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Get endpoint
    const { data: endpoint, error: fetchError } = await supabase
      .from(`${TABLE_PREFIX}_webhook_endpoints`)
      .select('*')
      .eq('id', endpointId)
      .single()
    
    if (fetchError || !endpoint) {
      return { success: false, error: 'Endpoint not found' }
    }
    
    const testEventId = crypto.randomUUID()
    
    // Create test payload
    const testPayload = {
      id: testEventId,
      event_type: 'test.ping',
      created_at: new Date().toISOString(),
      data: { message: 'This is a test webhook' },
      metadata: {
        site_id: endpoint.site_id,
        api_version: '2024-01-01',
        attempt_number: 1
      }
    }
    
    // Record delivery attempt
    const { data: delivery, error: insertError } = await supabase
      .from(`${TABLE_PREFIX}_webhook_deliveries`)
      .insert({
        endpoint_id: endpointId,
        event_type: 'test.ping',
        event_id: testEventId,
        payload: testPayload,
        status: 'pending'
      })
      .select()
      .single()
    
    if (insertError) {
      return { success: false, error: 'Failed to create delivery record' }
    }
    
    // Deliver webhook
    try {
      const startTime = Date.now()
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(endpoint.custom_headers || {})
        },
        body: JSON.stringify(testPayload)
      })
      
      const duration = Date.now() - startTime
      const body = await response.text()
      
      // Update delivery record
      await supabase
        .from(`${TABLE_PREFIX}_webhook_deliveries`)
        .update({
          status: response.ok ? 'delivered' : 'failed',
          response_status: response.status,
          response_body: body.substring(0, 1000),
          response_time_ms: duration,
          delivered_at: new Date().toISOString()
        })
        .eq('id', delivery.id)
      
      return { 
        success: response.ok, 
        delivery: delivery as WebhookDelivery,
        error: response.ok ? undefined : `HTTP ${response.status}`
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      
      await supabase
        .from(`${TABLE_PREFIX}_webhook_deliveries`)
        .update({
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', delivery.id)
      
      return { success: false, error: errorMessage }
    }
  } catch (error) {
    console.error('Error testing webhook endpoint:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to test webhook' }
  }
}

// ============================================================================
// EXTERNAL INTEGRATIONS
// ============================================================================

/**
 * Get all integrations for a site
 */
export async function getIntegrations(siteId: string): Promise<Integration[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_integrations`)
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Remove sensitive credential data
    return (data as Integration[]).map(i => ({
      ...i,
      config: {}, // Don't expose full config
    }))
  } catch (error) {
    console.error('Error getting integrations:', error)
    return []
  }
}

/**
 * Get integration by provider
 */
export async function getIntegrationByProvider(
  siteId: string,
  provider: string
): Promise<Integration | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_integrations`)
      .select('*')
      .eq('site_id', siteId)
      .eq('provider', provider)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return {
      ...(data as Integration),
      config: {} // Don't expose full config
    }
  } catch {
    return null
  }
}

/**
 * Connect a new integration
 */
export async function connectIntegration(
  siteId: string,
  input: ConnectIntegrationInput
): Promise<{ success: boolean; integration?: Integration; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_integrations`)
      .insert({
        site_id: siteId,
        provider: input.provider,
        name: input.name,
        category: input.category,
        config: input.config,
        credentials: input.credentials,
        features: input.features ?? {},
        is_test_mode: input.is_test_mode ?? false,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // In production, verify connection here
    // For now, just mark as connected
    await supabase
      .from(`${TABLE_PREFIX}_integrations`)
      .update({ status: 'connected' })
      .eq('id', data.id)
    
    revalidatePath('/dashboard/[siteId]/settings')
    
    return { 
      success: true, 
      integration: { ...(data as Integration), config: {} } 
    }
  } catch (error) {
    console.error('Error connecting integration:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to connect integration' }
  }
}

/**
 * Update an integration
 */
export async function updateIntegration(
  integrationId: string,
  input: UpdateIntegrationInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_integrations`)
      .update(input)
      .eq('id', integrationId)
    
    if (error) throw error
    
    revalidatePath('/dashboard/[siteId]/settings')
    return { success: true }
  } catch (error) {
    console.error('Error updating integration:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update integration' }
  }
}

/**
 * Disconnect an integration
 */
export async function disconnectIntegration(
  integrationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_integrations`)
      .delete()
      .eq('id', integrationId)
    
    if (error) throw error
    
    revalidatePath('/dashboard/[siteId]/settings')
    return { success: true }
  } catch (error) {
    console.error('Error disconnecting integration:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to disconnect integration' }
  }
}

/**
 * Get integration logs
 */
export async function getIntegrationLogs(
  integrationId: string,
  limit: number = 100
): Promise<IntegrationLog[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_integration_logs`)
      .select('*')
      .eq('integration_id', integrationId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data as IntegrationLog[]
  } catch (error) {
    console.error('Error getting integration logs:', error)
    return []
  }
}

// ============================================================================
// SYNC JOBS
// ============================================================================

/**
 * Get sync jobs for an integration
 */
export async function getSyncJobs(integrationId: string): Promise<SyncJob[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_sync_jobs`)
      .select('*')
      .eq('integration_id', integrationId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data as SyncJob[]
  } catch (error) {
    console.error('Error getting sync jobs:', error)
    return []
  }
}

/**
 * Create a sync job
 */
export async function createSyncJob(
  integrationId: string,
  input: CreateSyncJobInput
): Promise<{ success: boolean; job?: SyncJob; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_sync_jobs`)
      .insert({
        integration_id: integrationId,
        job_type: input.job_type,
        schedule: input.schedule,
        status: 'active'
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, job: data as SyncJob }
  } catch (error) {
    console.error('Error creating sync job:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create sync job' }
  }
}

/**
 * Toggle sync job status
 */
export async function toggleSyncJob(
  jobId: string,
  status: 'active' | 'paused'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_sync_jobs`)
      .update({ status })
      .eq('id', jobId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error toggling sync job:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to toggle sync job' }
  }
}

/**
 * Run a sync job manually
 */
export async function runSyncJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Mark job as running
    await supabase
      .from(`${TABLE_PREFIX}_sync_jobs`)
      .update({
        last_run_at: new Date().toISOString(),
        processed_items: 0,
        failed_items: 0
      })
      .eq('id', jobId)
    
    // In production, this would trigger the actual sync
    // For now, just simulate completion
    await supabase
      .from(`${TABLE_PREFIX}_sync_jobs`)
      .update({
        last_result: { status: 'completed', message: 'Sync completed' }
      })
      .eq('id', jobId)
    
    return { success: true }
  } catch (error) {
    console.error('Error running sync job:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to run sync job' }
  }
}
