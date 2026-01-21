import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

// ============================================================================
// Types
// ============================================================================

export interface ModuleInvitationRecord {
  id: string;
  module_id: string;
  site_id: string;
  email: string;
  role_id: string;
  token: string;
  invited_by: string;
  message: string | null;
  status: string | null;
  created_at: string | null;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
}

export interface CreateInvitationInput {
  moduleId: string;
  siteId: string;
  email: string;
  roleId: string;
  invitedBy: string;
  message?: string;
  expiresInDays?: number;
}

export interface InvitationWithRole {
  id: string;
  email: string;
  status: string | null;
  createdAt: string | null;
  expiresAt: string;
  message: string | null;
  roleName: string;
}

export interface AcceptedInvitation {
  moduleId: string;
  siteId: string;
  roleId: string;
  email: string;
}

// ============================================================================
// Token Generation
// ============================================================================

/**
 * Generate a secure random token for invitations
 */
function generateSecureToken(): string {
  // Use crypto.getRandomValues for browser compatibility
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Node.js fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

// ============================================================================
// Invitation CRUD
// ============================================================================

/**
 * Create an invitation to a module
 */
export async function createInvitation(
  input: CreateInvitationInput
): Promise<InvitationWithRole> {
  const supabase = createClient();
  
  // Generate secure token
  const token = generateSecureToken();
  
  // Calculate expiry (default 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 7));
  
  // Check if there's already a pending invitation for this email
  const { data: existing } = await supabase
    .from('module_invitations')
    .select('id')
    .eq('module_id', input.moduleId)
    .eq('site_id', input.siteId)
    .eq('email', input.email.toLowerCase())
    .eq('status', 'pending')
    .limit(1);
  
  if (existing && existing.length > 0) {
    throw new Error('An invitation is already pending for this email');
  }
  
  const { data, error } = await supabase
    .from('module_invitations')
    .insert({
      module_id: input.moduleId,
      site_id: input.siteId,
      email: input.email.toLowerCase().trim(),
      role_id: input.roleId,
      token,
      invited_by: input.invitedBy,
      message: input.message || null,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    })
    .select(`
      id,
      email,
      status,
      created_at,
      expires_at,
      message,
      role:module_roles(name)
    `)
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    email: data.email,
    status: data.status as ModuleInvitationRecord['status'],
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    message: data.message,
    roleName: data.role?.name || 'Unknown'
  };
}

/**
 * Get an invitation by token
 */
export async function getInvitationByToken(
  token: string
): Promise<ModuleInvitationRecord | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_invitations')
    .select('*')
    .eq('token', token)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
}

/**
 * Get an invitation by ID
 */
export async function getInvitation(
  invitationId: string
): Promise<ModuleInvitationRecord | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_invitations')
    .select('*')
    .eq('id', invitationId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
}

/**
 * List invitations for a module
 */
export async function listInvitations(
  moduleId: string, 
  siteId: string,
  options?: {
    status?: ModuleInvitationRecord['status'];
    limit?: number;
    offset?: number;
  }
): Promise<InvitationWithRole[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('module_invitations')
    .select(`
      id,
      email,
      status,
      created_at,
      expires_at,
      message,
      role:module_roles(name)
    `)
    .eq('module_id', moduleId)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });
  
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return (data || []).map(d => ({
    id: d.id,
    email: d.email,
    status: d.status as ModuleInvitationRecord['status'],
    createdAt: d.created_at,
    expiresAt: d.expires_at,
    message: d.message,
    roleName: d.role?.name || 'Unknown'
  }));
}

/**
 * List pending invitations for a specific email
 */
export async function listPendingInvitationsForEmail(
  email: string
): Promise<Array<{
  id: string;
  moduleId: string;
  siteId: string;
  roleName: string;
  expiresAt: string;
  message: string | null;
}>> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_invitations')
    .select(`
      id,
      module_id,
      site_id,
      expires_at,
      message,
      role:module_roles(name)
    `)
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());
  
  if (error) throw error;
  
  return (data || []).map(d => ({
    id: d.id,
    moduleId: d.module_id,
    siteId: d.site_id,
    roleName: d.role?.name || 'Unknown',
    expiresAt: d.expires_at,
    message: d.message
  }));
}

// ============================================================================
// Invitation Actions
// ============================================================================

/**
 * Accept an invitation
 */
export async function acceptInvitation(
  token: string, 
  userId: string
): Promise<AcceptedInvitation> {
  const supabase = createAdminClient();
  
  // Find the invitation
  const { data: invitation, error: findError } = await supabase
    .from('module_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single();
  
  if (findError || !invitation) {
    throw new Error('Invalid or expired invitation');
  }
  
  // Check expiry
  if (new Date(invitation.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from('module_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    throw new Error('Invitation has expired');
  }
  
  // Assign the role to the user
  const { error: assignError } = await supabase
    .from('module_user_roles')
    .upsert({
      user_id: userId,
      role_id: invitation.role_id,
      module_id: invitation.module_id,
      site_id: invitation.site_id,
      granted_by: invitation.invited_by,
      is_active: true,
      granted_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,role_id'
    });
  
  if (assignError) throw assignError;
  
  // Mark invitation as accepted
  const { error: updateError } = await supabase
    .from('module_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: userId
    })
    .eq('id', invitation.id);
  
  if (updateError) throw updateError;
  
  return {
    moduleId: invitation.module_id,
    siteId: invitation.site_id,
    roleId: invitation.role_id,
    email: invitation.email
  };
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(invitationId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('module_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId)
    .eq('status', 'pending');
  
  if (error) throw error;
}

/**
 * Resend an invitation (creates new token with extended expiry)
 */
export async function resendInvitation(
  invitationId: string,
  expiresInDays = 7
): Promise<InvitationWithRole> {
  const supabase = createClient();
  
  // Get the original invitation
  const { data: original, error: fetchError } = await supabase
    .from('module_invitations')
    .select('*')
    .eq('id', invitationId)
    .single();
  
  if (fetchError || !original) {
    throw new Error('Invitation not found');
  }
  
  // Generate new token and expiry
  const newToken = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  // Update the invitation
  const { data, error } = await supabase
    .from('module_invitations')
    .update({
      token: newToken,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    })
    .eq('id', invitationId)
    .select(`
      id,
      email,
      status,
      created_at,
      expires_at,
      message,
      role:module_roles(name)
    `)
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    email: data.email,
    status: data.status as ModuleInvitationRecord['status'],
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    message: data.message,
    roleName: data.role?.name || 'Unknown'
  };
}

/**
 * Delete an invitation (permanently)
 */
export async function deleteInvitation(invitationId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('module_invitations')
    .delete()
    .eq('id', invitationId);
  
  if (error) throw error;
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Create multiple invitations at once
 */
export async function createBulkInvitations(
  moduleId: string,
  siteId: string,
  invitations: Array<{
    email: string;
    roleId: string;
    message?: string;
  }>,
  invitedBy: string,
  expiresInDays = 7
): Promise<{
  successful: InvitationWithRole[];
  failed: Array<{ email: string; error: string }>;
}> {
  const successful: InvitationWithRole[] = [];
  const failed: Array<{ email: string; error: string }> = [];
  
  for (const inv of invitations) {
    try {
      const result = await createInvitation({
        moduleId,
        siteId,
        email: inv.email,
        roleId: inv.roleId,
        invitedBy,
        message: inv.message,
        expiresInDays
      });
      successful.push(result);
    } catch (error) {
      failed.push({
        email: inv.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return { successful, failed };
}

/**
 * Clean up expired invitations
 */
export async function cleanupExpiredInvitations(
  moduleId?: string,
  siteId?: string
): Promise<number> {
  const supabase = createAdminClient();
  
  let query = supabase
    .from('module_invitations')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString());
  
  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }
  
  if (siteId) {
    query = query.eq('site_id', siteId);
  }
  
  const { data, error } = await query.select('id');
  
  if (error) throw error;
  return data?.length || 0;
}

// ============================================================================
// Email Integration (Placeholder)
// ============================================================================

export interface InvitationEmailData {
  recipientEmail: string;
  inviterName: string;
  moduleName: string;
  roleName: string;
  message?: string;
  acceptUrl: string;
  expiresAt: string;
}

/**
 * Generate the invitation accept URL
 */
export function getInvitationAcceptUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/modules/invitation/accept?token=${encodeURIComponent(token)}`;
}

/**
 * Prepare email data for an invitation
 * Note: Actual email sending should use your email service
 */
export async function prepareInvitationEmail(
  invitationId: string,
  baseUrl: string,
  inviterName: string,
  moduleName: string
): Promise<InvitationEmailData | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_invitations')
    .select(`
      email,
      token,
      message,
      expires_at,
      role:module_roles(name)
    `)
    .eq('id', invitationId)
    .eq('status', 'pending')
    .single();
  
  if (error || !data) return null;
  
  return {
    recipientEmail: data.email,
    inviterName,
    moduleName,
    roleName: data.role?.name || 'Member',
    message: data.message || undefined,
    acceptUrl: getInvitationAcceptUrl(data.token, baseUrl),
    expiresAt: data.expires_at
  };
}
