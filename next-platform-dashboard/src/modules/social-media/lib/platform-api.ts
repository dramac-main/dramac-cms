/**
 * Platform API Wrappers
 *
 * PHASE-SM-01: Typed helpers for each social platform's REST API.
 * These wrap platformFetch with platform-specific URL construction.
 */

import { platformFetch } from './token-refresh'

// ============================================================================
// META (Facebook / Instagram)
// ============================================================================

/**
 * Call the Meta Graph API (Facebook & Instagram).
 */
export async function metaGraphRequest(
  accountId: string,
  path: string,
  params?: Record<string, string>,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any,
): Promise<any> {
  const url = new URL(`https://graph.facebook.com/v21.0${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const options: RequestInit = { method }
  if (body && method === 'POST') {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const res = await platformFetch(accountId, url.toString(), options)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meta API ${res.status}: ${err.slice(0, 300)}`)
  }
  return res.json()
}

// ============================================================================
// TWITTER / X
// ============================================================================

/**
 * Call the Twitter v2 API.
 */
export async function twitterRequest(
  accountId: string,
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any,
): Promise<any> {
  const url = `https://api.twitter.com/2${path}`
  const options: RequestInit = { method }

  if (body && method === 'POST') {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const res = await platformFetch(accountId, url, options)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Twitter API ${res.status}: ${err.slice(0, 300)}`)
  }
  return res.json()
}

// ============================================================================
// LINKEDIN
// ============================================================================

/**
 * Call the LinkedIn API (v2 or Community Management API).
 */
export async function linkedinRequest(
  accountId: string,
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any,
): Promise<any> {
  const url = `https://api.linkedin.com/v2${path}`
  const options: RequestInit = {
    method,
    headers: { 'X-Restli-Protocol-Version': '2.0.0' },
  }

  if (body && method === 'POST') {
    ;(options.headers as Record<string, string>)['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  const res = await platformFetch(accountId, url, options)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LinkedIn API ${res.status}: ${err.slice(0, 300)}`)
  }
  return res.json()
}

// ============================================================================
// TIKTOK
// ============================================================================

/**
 * Call the TikTok Content Posting API.
 */
export async function tiktokRequest(
  accountId: string,
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
): Promise<any> {
  const url = `https://open.tiktokapis.com/v2${path}`
  const options: RequestInit = { method }

  if (body && method === 'POST') {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const res = await platformFetch(accountId, url, options)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`TikTok API ${res.status}: ${err.slice(0, 300)}`)
  }
  return res.json()
}

// ============================================================================
// PINTEREST
// ============================================================================

export async function pinterestRequest(
  accountId: string,
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any,
): Promise<any> {
  const url = `https://api.pinterest.com/v5${path}`
  const options: RequestInit = { method }

  if (body && method === 'POST') {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const res = await platformFetch(accountId, url, options)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pinterest API ${res.status}: ${err.slice(0, 300)}`)
  }
  return res.json()
}

// ============================================================================
// YOUTUBE (Google)
// ============================================================================

export async function youtubeRequest(
  accountId: string,
  path: string,
  params?: Record<string, string>,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any,
): Promise<any> {
  const url = new URL(`https://www.googleapis.com/youtube/v3${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const options: RequestInit = { method }
  if (body && method === 'POST') {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const res = await platformFetch(accountId, url.toString(), options)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`YouTube API ${res.status}: ${err.slice(0, 300)}`)
  }
  return res.json()
}

// ============================================================================
// THREADS (Meta)
// ============================================================================

export async function threadsRequest(
  accountId: string,
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
): Promise<any> {
  const url = `https://graph.threads.net/v1.0${path}`
  const options: RequestInit = { method }

  if (body && method === 'POST') {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const res = await platformFetch(accountId, url, options)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Threads API ${res.status}: ${err.slice(0, 300)}`)
  }
  return res.json()
}
