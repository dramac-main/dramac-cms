import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

// ============================================================================
// Types
// ============================================================================

export interface ModuleRoleRecord {
  id: string;
  module_id: string;
  site_id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[] | null;
  hierarchy_level: number | null;
  is_default: boolean | null;
  is_system: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ModuleUserRoleRecord {
  id: string;
  user_id: string;
  role_id: string;
  module_id: string;
  site_id: string;
  granted_at: string | null;
  granted_by: string | null;
  expires_at: string | null;
  is_active: boolean | null;
}

export interface CreateRoleInput {
  moduleId: string;
  siteId: string;
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  hierarchyLevel?: number;
  isDefault?: boolean;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  permissions?: string[];
  hierarchyLevel?: number;
  isDefault?: boolean;
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
  moduleId: string;
  siteId: string;
  grantedBy: string;
  expiresAt?: string;
}

export interface ModuleUserWithRoles {
  id: string;
  userId: string;
  grantedAt: string | null;
  expiresAt: string | null;
  isActive: boolean | null;
  role: {
    id: string;
    name: string;
    slug: string;
    permissions: string[];
    hierarchyLevel: number | null;
  };
}

export interface RoleDefinition {
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  hierarchyLevel: number;
  isDefault?: boolean;
}

// ============================================================================
// Role CRUD Operations
// ============================================================================

/**
 * Create a new role for a module
 */
export async function createModuleRole(input: CreateRoleInput): Promise<ModuleRoleRecord> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_roles')
    .insert({
      module_id: input.moduleId,
      site_id: input.siteId,
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      permissions: input.permissions,
      hierarchy_level: input.hierarchyLevel ?? 0,
      is_default: input.isDefault ?? false,
      is_system: false
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get a role by ID
 */
export async function getModuleRole(roleId: string): Promise<ModuleRoleRecord | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_roles')
    .select('*')
    .eq('id', roleId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

/**
 * Get all roles for a module
 */
export async function getModuleRoles(
  moduleId: string, 
  siteId: string
): Promise<ModuleRoleRecord[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_roles')
    .select('*')
    .eq('module_id', moduleId)
    .eq('site_id', siteId)
    .order('hierarchy_level', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Update a role
 */
export async function updateModuleRole(
  roleId: string,
  updates: UpdateRoleInput
): Promise<ModuleRoleRecord> {
  const supabase = createClient();
  
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
  if (updates.hierarchyLevel !== undefined) updateData.hierarchy_level = updates.hierarchyLevel;
  if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
  
  const { data, error } = await supabase
    .from('module_roles')
    .update(updateData)
    .eq('id', roleId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Delete a role (if not a system role)
 */
export async function deleteModuleRole(roleId: string): Promise<void> {
  const supabase = createClient();
  
  // Check if system role
  const { data: role } = await supabase
    .from('module_roles')
    .select('is_system')
    .eq('id', roleId)
    .single();
  
  if (role?.is_system) {
    throw new Error('Cannot delete system role');
  }
  
  const { error } = await supabase
    .from('module_roles')
    .delete()
    .eq('id', roleId);
  
  if (error) throw error;
}

// ============================================================================
// Role Assignment Operations
// ============================================================================

/**
 * Assign a role to a user
 */
export async function assignRole(input: AssignRoleInput): Promise<ModuleUserRoleRecord> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_user_roles')
    .upsert({
      user_id: input.userId,
      role_id: input.roleId,
      module_id: input.moduleId,
      site_id: input.siteId,
      granted_by: input.grantedBy,
      expires_at: input.expiresAt || null,
      is_active: true,
      granted_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,role_id'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Assign multiple roles to a user
 */
export async function assignRoles(
  userId: string,
  roleIds: string[],
  moduleId: string,
  siteId: string,
  grantedBy: string
): Promise<ModuleUserRoleRecord[]> {
  const supabase = createClient();
  
  const records = roleIds.map(roleId => ({
    user_id: userId,
    role_id: roleId,
    module_id: moduleId,
    site_id: siteId,
    granted_by: grantedBy,
    is_active: true,
    granted_at: new Date().toISOString()
  }));
  
  const { data, error } = await supabase
    .from('module_user_roles')
    .upsert(records, { onConflict: 'user_id,role_id' })
    .select();
  
  if (error) throw error;
  return data || [];
}

/**
 * Remove a role from a user
 */
export async function removeRole(userId: string, roleId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('module_user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);
  
  if (error) throw error;
}

/**
 * Remove all roles from a user for a specific module
 */
export async function removeAllUserRoles(
  userId: string,
  moduleId: string,
  siteId: string
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('module_user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('site_id', siteId);
  
  if (error) throw error;
}

/**
 * Deactivate a user's role (soft delete)
 */
export async function deactivateRole(userId: string, roleId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('module_user_roles')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('role_id', roleId);
  
  if (error) throw error;
}

/**
 * Reactivate a user's role
 */
export async function reactivateRole(userId: string, roleId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('module_user_roles')
    .update({ is_active: true })
    .eq('user_id', userId)
    .eq('role_id', roleId);
  
  if (error) throw error;
}

// ============================================================================
// User Role Queries
// ============================================================================

/**
 * Get all users with roles for a module
 */
export async function getModuleUsers(
  moduleId: string, 
  siteId: string
): Promise<ModuleUserWithRoles[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_user_roles')
    .select(`
      id,
      user_id,
      granted_at,
      expires_at,
      is_active,
      role:module_roles(id, name, slug, permissions, hierarchy_level)
    `)
    .eq('module_id', moduleId)
    .eq('site_id', siteId);
  
  if (error) throw error;
  
  return (data || [])
    .filter((d): d is typeof d & { role: NonNullable<typeof d.role> } => d.role !== null)
    .map(d => ({
      id: d.id,
      userId: d.user_id,
      grantedAt: d.granted_at,
      expiresAt: d.expires_at,
      isActive: d.is_active,
      role: {
        id: d.role.id,
        name: d.role.name,
        slug: d.role.slug,
        permissions: d.role.permissions || [],
        hierarchyLevel: d.role.hierarchy_level
      }
    }));
}

/**
 * Get a user's roles for a specific module
 */
export async function getUserModuleRoles(
  userId: string,
  moduleId: string,
  siteId: string
): Promise<ModuleRoleRecord[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_user_roles')
    .select('role:module_roles(*)')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('site_id', siteId)
    .eq('is_active', true);
  
  if (error) throw error;
  
  return (data || [])
    .filter((d): d is { role: ModuleRoleRecord } => d.role !== null)
    .map(d => d.role);
}

/**
 * Check if a user has a specific role
 */
export async function userHasRole(
  userId: string,
  moduleId: string,
  siteId: string,
  roleSlug: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_user_roles')
    .select('id, role:module_roles!inner(slug)')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('site_id', siteId)
    .eq('is_active', true)
    .eq('role.slug', roleSlug)
    .limit(1);
  
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// ============================================================================
// Default Role Setup
// ============================================================================

/**
 * Setup default roles for a module (called during module installation)
 */
export async function setupDefaultRoles(
  moduleId: string,
  siteId: string,
  roleDefinitions: RoleDefinition[]
): Promise<ModuleRoleRecord[]> {
  const supabase = createAdminClient();
  const results: ModuleRoleRecord[] = [];
  
  for (const role of roleDefinitions) {
    const { data, error } = await supabase
      .from('module_roles')
      .upsert({
        module_id: moduleId,
        site_id: siteId,
        name: role.name,
        slug: role.slug,
        description: role.description || null,
        permissions: role.permissions,
        hierarchy_level: role.hierarchyLevel,
        is_default: role.isDefault ?? false,
        is_system: true
      }, {
        onConflict: 'module_id,site_id,slug'
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Failed to create role ${role.slug}:`, error);
      continue;
    }
    
    if (data) results.push(data);
  }
  
  return results;
}

/**
 * Assign default role to a user when they first access a module
 */
export async function assignDefaultRole(
  userId: string,
  moduleId: string,
  siteId: string
): Promise<ModuleUserRoleRecord | null> {
  const supabase = createClient();
  
  // Find the default role
  const { data: defaultRole, error: roleError } = await supabase
    .from('module_roles')
    .select('id')
    .eq('module_id', moduleId)
    .eq('site_id', siteId)
    .eq('is_default', true)
    .limit(1)
    .single();
  
  if (roleError || !defaultRole) {
    return null;
  }
  
  // Check if user already has a role
  const { data: existingRole } = await supabase
    .from('module_user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('site_id', siteId)
    .limit(1);
  
  if (existingRole && existingRole.length > 0) {
    return null; // User already has a role
  }
  
  // Assign the default role
  const { data, error } = await supabase
    .from('module_user_roles')
    .insert({
      user_id: userId,
      role_id: defaultRole.id,
      module_id: moduleId,
      site_id: siteId,
      is_active: true,
      granted_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================================
// Role Utilities
// ============================================================================

/**
 * Get aggregated permissions for a user in a module
 */
export async function getUserPermissions(
  userId: string,
  moduleId: string,
  siteId: string
): Promise<string[]> {
  const roles = await getUserModuleRoles(userId, moduleId, siteId);
  const allPermissions = new Set<string>();
  
  roles.forEach(role => {
    (role.permissions || []).forEach(p => allPermissions.add(p));
  });
  
  return Array.from(allPermissions);
}

/**
 * Check if a user has a specific permission in a module
 */
export async function userHasPermission(
  userId: string,
  moduleId: string,
  siteId: string,
  permission: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, moduleId, siteId);
  
  // Check wildcard
  if (permissions.includes('*')) return true;
  
  // Check exact match
  if (permissions.includes(permission)) return true;
  
  // Check category wildcard
  const [category] = permission.split('.');
  if (permissions.includes(`${category}.*`)) return true;
  
  return false;
}

/**
 * Clone roles from one site to another (useful for templates)
 */
export async function cloneRoles(
  moduleId: string,
  fromSiteId: string,
  toSiteId: string
): Promise<ModuleRoleRecord[]> {
  const supabase = createAdminClient();
  
  // Get source roles
  const { data: sourceRoles, error: fetchError } = await supabase
    .from('module_roles')
    .select('*')
    .eq('module_id', moduleId)
    .eq('site_id', fromSiteId);
  
  if (fetchError) throw fetchError;
  if (!sourceRoles?.length) return [];
  
  // Create cloned roles
  const clonedRoles = sourceRoles.map(role => ({
    module_id: moduleId,
    site_id: toSiteId,
    name: role.name,
    slug: role.slug,
    description: role.description,
    permissions: role.permissions,
    hierarchy_level: role.hierarchy_level,
    is_default: role.is_default,
    is_system: role.is_system
  }));
  
  const { data, error } = await supabase
    .from('module_roles')
    .insert(clonedRoles)
    .select();
  
  if (error) throw error;
  return data || [];
}
