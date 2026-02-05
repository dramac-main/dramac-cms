/**
 * Integration Hooks
 * 
 * Phase ECOM-43A/B: Integrations & Webhooks
 * 
 * React hooks for managing API keys, webhooks, and integrations.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  ApiKey,
  ApiKeyWithSecret,
  CreateApiKeyInput,
  UpdateApiKeyInput,
  WebhookEndpoint,
  WebhookEventTypeInfo,
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookDelivery,
  Integration,
  ConnectIntegrationInput,
  UpdateIntegrationInput,
  IntegrationLog,
  SyncJob,
  CreateSyncJobInput
} from '../types/integration-types'

import {
  getApiKeys,
  createApiKey,
  updateApiKey,
  revokeApiKey,
  rotateApiKey,
  getWebhookEndpoints,
  getWebhookEventTypes,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  rotateWebhookSecret,
  getWebhookDeliveries,
  testWebhookEndpoint,
  getIntegrations,
  getIntegrationByProvider,
  connectIntegration,
  updateIntegration,
  disconnectIntegration,
  getIntegrationLogs,
  getSyncJobs,
  createSyncJob,
  toggleSyncJob,
  runSyncJob
} from '../actions/integration-actions'

// ============================================================================
// API KEYS HOOK
// ============================================================================

export interface UseApiKeysReturn {
  apiKeys: ApiKey[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (input: CreateApiKeyInput) => Promise<{ success: boolean; key?: ApiKeyWithSecret; error?: string }>
  update: (keyId: string, input: UpdateApiKeyInput) => Promise<{ success: boolean; error?: string }>
  revoke: (keyId: string) => Promise<{ success: boolean; error?: string }>
  rotate: (keyId: string) => Promise<{ success: boolean; key?: ApiKeyWithSecret; error?: string }>
}

export function useApiKeys(siteId: string): UseApiKeysReturn {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!siteId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getApiKeys(siteId)
      setApiKeys(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = useCallback(async (input: CreateApiKeyInput) => {
    const result = await createApiKey(siteId, input)
    if (result.success) {
      await refresh()
    }
    return result
  }, [siteId, refresh])

  const update = useCallback(async (keyId: string, input: UpdateApiKeyInput) => {
    const result = await updateApiKey(keyId, input)
    if (result.success) {
      await refresh()
    }
    return result
  }, [refresh])

  const revoke = useCallback(async (keyId: string) => {
    const result = await revokeApiKey(keyId)
    if (result.success) {
      await refresh()
    }
    return result
  }, [refresh])

  const rotate = useCallback(async (keyId: string) => {
    const result = await rotateApiKey(keyId)
    if (result.success) {
      await refresh()
    }
    return result
  }, [refresh])

  return {
    apiKeys,
    isLoading,
    error,
    refresh,
    create,
    update,
    revoke,
    rotate
  }
}

// ============================================================================
// WEBHOOKS HOOK
// ============================================================================

export interface UseWebhooksReturn {
  webhooks: WebhookEndpoint[]
  eventTypes: WebhookEventTypeInfo[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (input: CreateWebhookInput) => Promise<{ success: boolean; endpoint?: WebhookEndpoint; error?: string }>
  update: (endpointId: string, input: UpdateWebhookInput) => Promise<{ success: boolean; error?: string }>
  remove: (endpointId: string) => Promise<{ success: boolean; error?: string }>
  rotateSecret: (endpointId: string) => Promise<{ success: boolean; secret?: string; error?: string }>
  test: (endpointId: string) => Promise<{ success: boolean; delivery?: WebhookDelivery; error?: string }>
  getDeliveries: (endpointId: string, limit?: number) => Promise<WebhookDelivery[]>
}

export function useWebhooks(siteId: string): UseWebhooksReturn {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [eventTypes, setEventTypes] = useState<WebhookEventTypeInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!siteId) return
    setIsLoading(true)
    setError(null)
    try {
      const [webhooksData, eventTypesData] = await Promise.all([
        getWebhookEndpoints(siteId),
        getWebhookEventTypes()
      ])
      setWebhooks(webhooksData)
      setEventTypes(eventTypesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch webhooks')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = useCallback(async (input: CreateWebhookInput) => {
    const result = await createWebhookEndpoint(siteId, input)
    if (result.success) {
      await refresh()
    }
    return result
  }, [siteId, refresh])

  const update = useCallback(async (endpointId: string, input: UpdateWebhookInput) => {
    const result = await updateWebhookEndpoint(endpointId, input)
    if (result.success) {
      await refresh()
    }
    return result
  }, [refresh])

  const remove = useCallback(async (endpointId: string) => {
    const result = await deleteWebhookEndpoint(endpointId)
    if (result.success) {
      await refresh()
    }
    return result
  }, [refresh])

  const rotateSecret = useCallback(async (endpointId: string) => {
    const result = await rotateWebhookSecret(endpointId)
    if (result.success) {
      await refresh()
    }
    return result
  }, [refresh])

  const test = useCallback(async (endpointId: string) => {
    return testWebhookEndpoint(endpointId)
  }, [])

  const getDeliveriesCallback = useCallback(async (endpointId: string, limit?: number) => {
    return getWebhookDeliveries(endpointId, limit)
  }, [])

  return {
    webhooks,
    eventTypes,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
    rotateSecret,
    test,
    getDeliveries: getDeliveriesCallback
  }
}

// ============================================================================
// INTEGRATIONS HOOK
// ============================================================================

export interface UseIntegrationsReturn {
  integrations: Integration[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  getByProvider: (provider: string) => Promise<Integration | null>
  connect: (input: ConnectIntegrationInput) => Promise<{ success: boolean; integration?: Integration; error?: string }>
  update: (integrationId: string, input: UpdateIntegrationInput) => Promise<{ success: boolean; error?: string }>
  disconnect: (integrationId: string) => Promise<{ success: boolean; error?: string }>
  getLogs: (integrationId: string, limit?: number) => Promise<IntegrationLog[]>
}

export function useIntegrations(siteId: string): UseIntegrationsReturn {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!siteId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getIntegrations(siteId)
      setIntegrations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const getByProvider = useCallback(async (provider: string) => {
    return getIntegrationByProvider(siteId, provider)
  }, [siteId])

  const connect = useCallback(async (input: ConnectIntegrationInput) => {
    const result = await connectIntegration(siteId, input)
    if (result.success) {
      await refresh()
    }
    return result
  }, [siteId, refresh])

  const update = useCallback(async (integrationId: string, input: UpdateIntegrationInput) => {
    const result = await updateIntegration(integrationId, input)
    if (result.success) {
      await refresh()
    }
    return result
  }, [refresh])

  const disconnect = useCallback(async (integrationId: string) => {
    const result = await disconnectIntegration(integrationId)
    if (result.success) {
      await refresh()
    }
    return result
  }, [refresh])

  const getLogs = useCallback(async (integrationId: string, limit?: number) => {
    return getIntegrationLogs(integrationId, limit)
  }, [])

  return {
    integrations,
    isLoading,
    error,
    refresh,
    getByProvider,
    connect,
    update,
    disconnect,
    getLogs
  }
}

// ============================================================================
// SYNC JOBS HOOK
// ============================================================================

export interface UseSyncJobsReturn {
  jobs: SyncJob[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (input: CreateSyncJobInput) => Promise<{ success: boolean; job?: SyncJob; error?: string }>
  toggle: (jobId: string, status: 'active' | 'paused') => Promise<{ success: boolean; error?: string }>
  run: (jobId: string) => Promise<{ success: boolean; error?: string }>
}

export function useSyncJobs(integrationId: string): UseSyncJobsReturn {
  const [jobs, setJobs] = useState<SyncJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!integrationId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getSyncJobs(integrationId)
      setJobs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sync jobs')
    } finally {
      setIsLoading(false)
    }
  }, [integrationId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = useCallback(async (input: CreateSyncJobInput) => {
    const result = await createSyncJob(integrationId, input)
    if (result.success) {
      await refresh()
    }
    return result
  }, [integrationId, refresh])

  const toggle = useCallback(async (jobId: string, status: 'active' | 'paused') => {
    const result = await toggleSyncJob(jobId, status)
    if (result.success) {
      await refresh()
    }
    return result
  }, [refresh])

  const run = useCallback(async (jobId: string) => {
    const result = await runSyncJob(jobId)
    if (result.success) {
      await refresh()
    }
    return result
  }, [refresh])

  return {
    jobs,
    isLoading,
    error,
    refresh,
    create,
    toggle,
    run
  }
}
