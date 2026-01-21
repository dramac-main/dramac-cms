import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

// ============================================================================
// Types
// ============================================================================

import type { Json } from '@/types/database';

export interface ModuleSessionRecord {
  id: string;
  module_id: string;
  site_id: string;
  user_id: string | null;
  session_token: string;
  device_info: Json;
  source: string | null;
  referrer_url: string | null;
  created_at: string | null;
  last_activity_at: string | null;
  expires_at: string;
  is_active: boolean | null;
}

export interface CreateSessionInput {
  moduleId: string;
  siteId: string;
  userId?: string;
  source?: 'platform' | 'embed' | 'api';
  deviceInfo?: Record<string, unknown>;
  referrerUrl?: string;
  expiresInHours?: number;
}

export interface SessionValidationResult {
  valid: boolean;
  session: ModuleSessionRecord | null;
  error?: string;
}

// ============================================================================
// Token Generation
// ============================================================================

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(48);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto');
  return crypto.randomBytes(48).toString('hex');
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Create a new module session
 */
export async function createModuleSession(
  input: CreateSessionInput
): Promise<ModuleSessionRecord> {
  const supabase = createClient();
  
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (input.expiresInHours ?? 24));
  
  const { data, error } = await supabase
    .from('module_sessions')
    .insert({
      module_id: input.moduleId,
      site_id: input.siteId,
      user_id: input.userId || null,
      session_token: token,
      source: input.source ?? 'platform',
      device_info: (input.deviceInfo ?? {}) as Json,
      referrer_url: input.referrerUrl || null,
      expires_at: expiresAt.toISOString(),
      is_active: true
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get a session by token
 */
export async function getSessionByToken(
  token: string
): Promise<ModuleSessionRecord | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_sessions')
    .select('*')
    .eq('session_token', token)
    .eq('is_active', true)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
}

/**
 * Validate a session token
 */
export async function validateSession(
  token: string
): Promise<SessionValidationResult> {
  const session = await getSessionByToken(token);
  
  if (!session) {
    return { valid: false, session: null, error: 'Session not found' };
  }
  
  if (!session.is_active) {
    return { valid: false, session, error: 'Session is inactive' };
  }
  
  if (new Date(session.expires_at) < new Date()) {
    // Auto-deactivate expired session
    await deactivateSession(token);
    return { valid: false, session, error: 'Session has expired' };
  }
  
  return { valid: true, session };
}

/**
 * Update session activity timestamp (touch)
 */
export async function touchSession(token: string): Promise<void> {
  const supabase = createClient();
  
  await supabase
    .from('module_sessions')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('session_token', token)
    .eq('is_active', true);
}

/**
 * Extend session expiration
 */
export async function extendSession(
  token: string,
  additionalHours = 24
): Promise<ModuleSessionRecord | null> {
  const supabase = createClient();
  
  const session = await getSessionByToken(token);
  if (!session) return null;
  
  const newExpiry = new Date();
  newExpiry.setHours(newExpiry.getHours() + additionalHours);
  
  const { data, error } = await supabase
    .from('module_sessions')
    .update({
      expires_at: newExpiry.toISOString(),
      last_activity_at: new Date().toISOString()
    })
    .eq('session_token', token)
    .eq('is_active', true)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Deactivate a session
 */
export async function deactivateSession(token: string): Promise<void> {
  const supabase = createClient();
  
  await supabase
    .from('module_sessions')
    .update({ is_active: false })
    .eq('session_token', token);
}

/**
 * Deactivate all sessions for a user in a module
 */
export async function deactivateUserSessions(
  userId: string,
  moduleId: string,
  siteId?: string
): Promise<number> {
  const supabase = createClient();
  
  let query = supabase
    .from('module_sessions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('is_active', true);
  
  if (siteId) {
    query = query.eq('site_id', siteId);
  }
  
  const { data, error } = await query.select('id');
  
  if (error) throw error;
  return data?.length || 0;
}

/**
 * Delete a session permanently
 */
export async function deleteSession(token: string): Promise<void> {
  const supabase = createClient();
  
  await supabase
    .from('module_sessions')
    .delete()
    .eq('session_token', token);
}

// ============================================================================
// Session Queries
// ============================================================================

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(
  userId: string,
  moduleId?: string
): Promise<ModuleSessionRecord[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('module_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('last_activity_at', { ascending: false });
  
  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

/**
 * Get session count for a module
 */
export async function getActiveSessionCount(
  moduleId: string,
  siteId: string
): Promise<number> {
  const supabase = createClient();
  
  const { count, error } = await supabase
    .from('module_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('module_id', moduleId)
    .eq('site_id', siteId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());
  
  if (error) throw error;
  return count || 0;
}

// ============================================================================
// Cleanup Operations
// ============================================================================

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const supabase = createAdminClient();
  
  // Deactivate expired sessions
  const { data: deactivated } = await supabase
    .from('module_sessions')
    .update({ is_active: false })
    .lt('expires_at', new Date().toISOString())
    .eq('is_active', true)
    .select('id');
  
  // Delete old inactive sessions (> 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await supabase
    .from('module_sessions')
    .delete()
    .eq('is_active', false)
    .lt('expires_at', thirtyDaysAgo.toISOString());
  
  return deactivated?.length || 0;
}

// ============================================================================
// Embed Session Helpers
// ============================================================================

/**
 * Create a session for embedded module context
 */
export async function createEmbedSession(
  moduleId: string,
  siteId: string,
  options?: {
    referrerUrl?: string;
    deviceInfo?: Record<string, unknown>;
    expiresInHours?: number;
  }
): Promise<{ token: string; expiresAt: string }> {
  const session = await createModuleSession({
    moduleId,
    siteId,
    source: 'embed',
    referrerUrl: options?.referrerUrl,
    deviceInfo: options?.deviceInfo,
    expiresInHours: options?.expiresInHours ?? 4 // Shorter expiry for embeds
  });
  
  return {
    token: session.session_token,
    expiresAt: session.expires_at
  };
}

/**
 * Validate and get user from embed session
 */
export async function validateEmbedSession(
  token: string
): Promise<{ valid: boolean; userId?: string; moduleId?: string; siteId?: string }> {
  const result = await validateSession(token);
  
  if (!result.valid || !result.session) {
    return { valid: false };
  }
  
  if (result.session.source !== 'embed') {
    return { valid: false };
  }
  
  // Touch the session to keep it alive
  await touchSession(token);
  
  return {
    valid: true,
    userId: result.session.user_id || undefined,
    moduleId: result.session.module_id,
    siteId: result.session.site_id
  };
}

// ============================================================================
// API Session Helpers
// ============================================================================

/**
 * Create an API session (longer-lived)
 */
export async function createApiSession(
  moduleId: string,
  siteId: string,
  userId: string,
  expiresInDays = 30
): Promise<{ token: string; expiresAt: string }> {
  const session = await createModuleSession({
    moduleId,
    siteId,
    userId,
    source: 'api',
    expiresInHours: expiresInDays * 24
  });
  
  return {
    token: session.session_token,
    expiresAt: session.expires_at
  };
}

/**
 * Validate API session and return user ID
 */
export async function validateApiSession(
  token: string
): Promise<{ valid: boolean; userId?: string; moduleId?: string; siteId?: string }> {
  const result = await validateSession(token);
  
  if (!result.valid || !result.session) {
    return { valid: false };
  }
  
  if (result.session.source !== 'api') {
    return { valid: false };
  }
  
  // Touch the session
  await touchSession(token);
  
  return {
    valid: true,
    userId: result.session.user_id || undefined,
    moduleId: result.session.module_id,
    siteId: result.session.site_id
  };
}
