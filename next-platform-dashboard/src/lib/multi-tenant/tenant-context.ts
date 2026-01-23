/**
 * Multi-Tenant Context Management
 * 
 * This module provides tenant context management for the multi-tenant architecture.
 * It handles the Agency → Client → Site hierarchy and ensures proper data isolation.
 * 
 * @module multi-tenant/tenant-context
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

// Helper type to bypass strict Supabase typing for tables not in generated types
type AnySupabaseClient = any;

/**
 * Represents the tenant context for a request
 */
export interface TenantContext {
  /** The agency (organization) ID */
  agencyId: string;
  /** The current site ID (optional, set during site selection) */
  siteId?: string;
  /** The authenticated user ID */
  userId?: string;
  /** The user's role within the agency */
  role?: 'owner' | 'admin' | 'member' | 'viewer';
  /** Array of permission strings for fine-grained access control */
  permissions?: string[];
  /** The agency's subscription tier */
  subscriptionTier?: string;
}

/**
 * Extended tenant context with agency details
 */
export interface FullTenantContext extends TenantContext {
  agency?: {
    id: string;
    name: string;
    subscriptionTier: string;
    maxSites: number;
    maxUsers: number;
    features: Record<string, boolean>;
  };
  site?: {
    id: string;
    name: string;
    domain?: string;
  };
}

/**
 * Get current tenant context from session/cookies
 * This is the primary method to retrieve tenant context in server components and API routes
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  try {
    const supabase = await createClient() as AnySupabaseClient;
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }
    
    // Get site from cookie (set during site selection)
    const cookieStore = await cookies();
    const siteId = cookieStore.get('current_site_id')?.value;
    
    // Get user's agency membership
    const { data: membership, error: membershipError } = await supabase
      .from('agency_members')
      .select('agency_id, role')
      .eq('user_id', user.id)
      .single();
    
    if (membershipError || !membership) {
      return null;
    }
    
    // Verify site belongs to agency if provided
    if (siteId) {
      const { data: site, error: siteError } = await supabase
        .from('sites')
        .select('agency_id')
        .eq('id', siteId)
        .single();
      
      if (siteError || !site || site.agency_id !== membership.agency_id) {
        // Site doesn't belong to user's agency, return context without site
        return {
          agencyId: membership.agency_id,
          userId: user.id,
          role: membership.role as TenantContext['role']
        };
      }
    }
    
    return {
      agencyId: membership.agency_id,
      siteId: siteId || undefined,
      userId: user.id,
      role: membership.role as TenantContext['role']
    };
  } catch (error) {
    console.error('Error getting tenant context:', error);
    return null;
  }
}

/**
 * Get full tenant context with agency and site details
 */
export async function getFullTenantContext(): Promise<FullTenantContext | null> {
  const context = await getTenantContext();
  if (!context) return null;
  
  const supabase = await createClient() as AnySupabaseClient;
  
  // Get agency details
  const { data: agency } = await supabase
    .from('agencies')
    .select('id, name, subscription_tier, max_sites, max_users, features')
    .eq('id', context.agencyId)
    .single();
  
  // Get site details if available
  let site = null;
  if (context.siteId) {
    const { data: siteData } = await supabase
      .from('sites')
      .select('id, name, domain')
      .eq('id', context.siteId)
      .single();
    site = siteData;
  }
  
  return {
    ...context,
    subscriptionTier: agency?.subscription_tier,
    agency: agency ? {
      id: agency.id,
      name: agency.name,
      subscriptionTier: agency.subscription_tier || 'free',
      maxSites: agency.max_sites || 5,
      maxUsers: agency.max_users || 10,
      features: (agency.features as Record<string, boolean>) || {}
    } : undefined,
    site: site ? {
      id: site.id,
      name: site.name,
      domain: site.domain
    } : undefined
  };
}

/**
 * Set tenant context in database session
 * This must be called before executing queries that rely on RLS policies
 */
export async function setDatabaseContext(context: TenantContext): Promise<void> {
  const supabase = createAdminClient() as AnySupabaseClient;
  
  await supabase.rpc('set_tenant_context', {
    p_agency_id: context.agencyId,
    p_site_id: context.siteId || null,
    p_user_id: context.userId || null
  });
}

/**
 * Create a tenant-scoped Supabase client
 * This client automatically has tenant context set for RLS policies
 */
export async function createTenantClient() {
  const context = await getTenantContext();
  if (!context) {
    throw new Error('No tenant context available');
  }
  
  const supabase = createAdminClient() as AnySupabaseClient;
  
  // Set context before returning
  await setDatabaseContext(context);
  
  return {
    supabase,
    context,
    /**
     * Execute a query with tenant context
     */
    async query<T>(
      tableName: string,
      operation: 'select' | 'insert' | 'update' | 'delete',
      data?: any
    ): Promise<T[]> {
      switch (operation) {
        case 'select':
          const { data: selectData, error: selectError } = await supabase
            .from(tableName)
            .select('*')
            .eq('site_id', context.siteId!);
          if (selectError) throw selectError;
          return selectData as T[];
          
        case 'insert':
          const insertData = Array.isArray(data) ? data : [data];
          const withTenant = insertData.map((item: any) => ({
            ...item,
            site_id: context.siteId,
            agency_id: context.agencyId,
            created_by: context.userId
          }));
          const { data: insertResult, error: insertError } = await supabase
            .from(tableName)
            .insert(withTenant)
            .select();
          if (insertError) throw insertError;
          return insertResult as T[];
          
        case 'update':
          const { data: updateResult, error: updateError } = await supabase
            .from(tableName)
            .update({ ...data, updated_by: context.userId, updated_at: new Date().toISOString() })
            .eq('site_id', context.siteId!)
            .select();
          if (updateError) throw updateError;
          return updateResult as T[];
          
        case 'delete':
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('site_id', context.siteId!);
          if (deleteError) throw deleteError;
          return [];
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    }
  };
}

/**
 * Verify user has access to a specific site
 */
export async function verifyUserSiteAccess(
  userId: string,
  siteId: string
): Promise<boolean> {
  const supabase = createAdminClient() as AnySupabaseClient;
  
  const { data, error } = await supabase.rpc('user_has_site_access', {
    p_user_id: userId,
    p_site_id: siteId
  });
  
  if (error) {
    console.error('Error verifying site access:', error);
    return false;
  }
  
  return Boolean(data);
}

/**
 * Verify user is an admin for an agency
 */
export async function verifyUserIsAdmin(
  userId: string,
  agencyId: string
): Promise<boolean> {
  const supabase = createAdminClient() as AnySupabaseClient;
  
  const { data, error } = await supabase.rpc('is_agency_admin', {
    p_user_id: userId,
    check_agency_id: agencyId
  });
  
  if (error) {
    console.error('Error verifying admin status:', error);
    return false;
  }
  
  return Boolean(data);
}

/**
 * Get all sites accessible to the current user
 */
export async function getAccessibleSites(): Promise<Array<{ id: string; name: string; domain?: string }>> {
  const context = await getTenantContext();
  if (!context) return [];
  
  const supabase = await createClient() as AnySupabaseClient;
  
  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, name, domain')
    .eq('agency_id', context.agencyId)
    .order('name');
  
  if (error) {
    console.error('Error getting accessible sites:', error);
    return [];
  }
  
  return sites || [];
}

/**
 * Set the current site in cookies
 */
export async function setCurrentSite(siteId: string): Promise<boolean> {
  const context = await getTenantContext();
  if (!context) return false;
  
  // Verify site belongs to user's agency
  const supabase = await createClient() as AnySupabaseClient;
  const { data: site, error } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single();
  
  if (error || !site || site.agency_id !== context.agencyId) {
    return false;
  }
  
  // Set the cookie
  const cookieStore = await cookies();
  cookieStore.set('current_site_id', siteId, {
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  });
  
  return true;
}

/**
 * Clear the current site selection
 */
export async function clearCurrentSite(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('current_site_id');
}

/**
 * Context validation result
 */
export interface ContextValidation {
  valid: boolean;
  reason?: string;
  context?: TenantContext;
}

/**
 * Validate tenant context for a specific operation
 */
export async function validateTenantContext(options: {
  requireSite?: boolean;
  requireAdmin?: boolean;
  allowedRoles?: TenantContext['role'][];
}): Promise<ContextValidation> {
  const context = await getTenantContext();
  
  if (!context) {
    return { valid: false, reason: 'Not authenticated' };
  }
  
  if (options.requireSite && !context.siteId) {
    return { valid: false, reason: 'No site selected', context };
  }
  
  if (options.requireAdmin && context.role !== 'owner' && context.role !== 'admin') {
    return { valid: false, reason: 'Admin access required', context };
  }
  
  if (options.allowedRoles && !options.allowedRoles.includes(context.role!)) {
    return { valid: false, reason: `Role must be one of: ${options.allowedRoles.join(', ')}`, context };
  }
  
  return { valid: true, context };
}
