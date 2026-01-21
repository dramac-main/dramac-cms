# Phase EM-13: Module Authentication & Authorization

> **Priority**: 🟠 HIGH
> **Estimated Time**: 6-8 hours
> **Prerequisites**: EM-01, EM-12
> **Status**: ✅ IMPLEMENTED (2026-01-21)

---

## 📁 Files Created

- `migrations/20260122_module_authentication.sql` - Database schema with RLS policies
- `src/lib/modules/auth/index.ts` - Main exports
- `src/lib/modules/auth/module-auth-context.tsx` - React context provider
- `src/lib/modules/auth/permission-guard.tsx` - Guards and HOCs
- `src/lib/modules/auth/role-management.ts` - Role CRUD operations
- `src/lib/modules/auth/invitation-service.ts` - User invitation system
- `src/lib/modules/auth/session-management.ts` - Module session handling
- `src/lib/modules/auth/permission-definitions.ts` - Pre-built permission sets

---

## 🎯 Objective

Create a **comprehensive authentication and authorization system** for modules that:
1. Enables SSO (Single Sign-On) across modules
2. Provides role-based access control (RBAC) within modules
3. Supports module-specific permissions
4. Handles user sessions across embedded contexts
5. Integrates with the main platform authentication

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Platform Auth (Supabase)                  │
│                    User → JWT → Session                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Module Auth Layer                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Role Check  │ │  Permission  │ │   Module     │        │
│  │    RBAC      │ │    Check     │ │   Scopes     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌───────────┐       ┌───────────┐       ┌───────────┐
    │ CRM Module│       │  Booking  │       │ E-Commerce│
    │  Roles:   │       │  Module   │       │  Module   │
    │  - Admin  │       │  Roles:   │       │  Roles:   │
    │  - Sales  │       │  - Staff  │       │  - Manager│
    │  - Viewer │       │  - Viewer │       │  - Staff  │
    └───────────┘       └───────────┘       └───────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (1 hour)

```sql
-- migrations/20260122_module_authentication.sql

-- ============================================================================
-- MODULE ROLES (Custom roles per module)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  module_id UUID NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Role definition
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- Permissions (array of permission strings)
  permissions TEXT[] DEFAULT '{}',
  
  -- Hierarchy (higher = more access)
  hierarchy_level INTEGER DEFAULT 0,
  
  -- System flags
  is_default BOOLEAN DEFAULT false,  -- Auto-assign to new users
  is_system BOOLEAN DEFAULT false,   -- Cannot be deleted
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, site_id, slug)
);

CREATE INDEX idx_module_roles_lookup ON module_roles(module_id, site_id);

-- ============================================================================
-- MODULE USER ROLES (User ↔ Role assignments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Assignment
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES module_roles(id) ON DELETE CASCADE,
  
  -- Context
  module_id UUID NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Validity
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_module_user_roles_user ON module_user_roles(user_id, module_id, site_id);
CREATE INDEX idx_module_user_roles_site ON module_user_roles(site_id, module_id);

-- ============================================================================
-- MODULE PERMISSIONS (Granular permissions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Definition
  module_id UUID NOT NULL,
  
  -- Permission details
  name TEXT NOT NULL,           -- e.g., "Manage Contacts"
  key TEXT NOT NULL,            -- e.g., "contacts.manage"
  description TEXT,
  
  -- Grouping
  category TEXT,                -- e.g., "Contacts", "Deals"
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(module_id, key)
);

CREATE INDEX idx_module_permissions_module ON module_permissions(module_id);

-- ============================================================================
-- MODULE SESSIONS (For embedded contexts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  module_id UUID NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Session data
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  
  -- Source
  source TEXT DEFAULT 'platform',  -- 'platform', 'embed', 'api'
  referrer_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_module_sessions_token ON module_sessions(session_token) WHERE is_active = true;
CREATE INDEX idx_module_sessions_user ON module_sessions(user_id, module_id);

-- ============================================================================
-- MODULE INVITATIONS (Invite users to modules)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  module_id UUID NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Invitation
  email TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES module_roles(id) ON DELETE CASCADE,
  
  -- Token
  token TEXT NOT NULL UNIQUE,
  
  -- Sender
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  message TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_module_invitations_email ON module_invitations(email, status);
CREATE INDEX idx_module_invitations_token ON module_invitations(token) WHERE status = 'pending';
```

---

### Task 2: Authentication Context Provider (2 hours)

```typescript
// src/lib/modules/auth/module-auth-context.tsx

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export interface ModuleRole {
  id: string;
  name: string;
  slug: string;
  permissions: string[];
  hierarchyLevel: number;
}

export interface ModuleAuthState {
  // User
  user: User | null;
  isLoading: boolean;
  
  // Module context
  moduleId: string;
  siteId: string;
  
  // Roles & permissions
  roles: ModuleRole[];
  permissions: string[];
  
  // Helper methods
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (roleSlug: string) => boolean;
  isAtLeastRole: (roleSlug: string) => boolean;
}

const ModuleAuthContext = createContext<ModuleAuthState | null>(null);

export function useModuleAuth() {
  const context = useContext(ModuleAuthContext);
  if (!context) {
    throw new Error('useModuleAuth must be used within ModuleAuthProvider');
  }
  return context;
}

interface ModuleAuthProviderProps {
  children: React.ReactNode;
  moduleId: string;
  siteId: string;
}

export function ModuleAuthProvider({
  children,
  moduleId,
  siteId
}: ModuleAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<ModuleRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadUserRoles(user.id);
      } else {
        setIsLoading(false);
      }
    });
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserRoles(session.user.id);
        } else {
          setRoles([]);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [moduleId, siteId]);
  
  async function loadUserRoles(userId: string) {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('module_user_roles')
        .select(`
          role:module_roles(
            id,
            name,
            slug,
            permissions,
            hierarchy_level
          )
        `)
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .eq('site_id', siteId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const userRoles = (data || [])
        .filter(d => d.role)
        .map(d => ({
          id: d.role.id,
          name: d.role.name,
          slug: d.role.slug,
          permissions: d.role.permissions || [],
          hierarchyLevel: d.role.hierarchy_level
        }));
      
      setRoles(userRoles);
    } catch (error) {
      console.error('Failed to load module roles:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Aggregate all permissions from all roles
  const permissions = React.useMemo(() => {
    const allPerms = new Set<string>();
    roles.forEach(role => {
      role.permissions.forEach(p => allPerms.add(p));
    });
    return Array.from(allPerms);
  }, [roles]);
  
  // Helper methods
  function hasPermission(permission: string): boolean {
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  }
  
  function hasAnyPermission(perms: string[]): boolean {
    return perms.some(p => hasPermission(p));
  }
  
  function hasAllPermissions(perms: string[]): boolean {
    return perms.every(p => hasPermission(p));
  }
  
  function hasRole(roleSlug: string): boolean {
    return roles.some(r => r.slug === roleSlug);
  }
  
  function isAtLeastRole(roleSlug: string): boolean {
    const targetRole = roles.find(r => r.slug === roleSlug);
    if (!targetRole) return false;
    return roles.some(r => r.hierarchyLevel >= targetRole.hierarchyLevel);
  }
  
  const value: ModuleAuthState = {
    user,
    isLoading,
    moduleId,
    siteId,
    roles,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAtLeastRole
  };
  
  return (
    <ModuleAuthContext.Provider value={value}>
      {children}
    </ModuleAuthContext.Provider>
  );
}
```

---

### Task 3: Permission Guard Components (1 hour)

```typescript
// src/lib/modules/auth/permission-guard.tsx

'use client';

import React from 'react';
import { useModuleAuth } from './module-auth-context';

interface PermissionGuardProps {
  children: React.ReactNode;
  
  // Permission requirements (any of these)
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  
  // Role requirements
  role?: string;
  minRole?: string;
  
  // Fallback
  fallback?: React.ReactNode;
  
  // Loading state
  loading?: React.ReactNode;
}

/**
 * Guard component that only renders children if user has permission
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  minRole,
  fallback = null,
  loading = null
}: PermissionGuardProps) {
  const auth = useModuleAuth();
  
  if (auth.isLoading) {
    return <>{loading}</>;
  }
  
  // Check role requirements
  if (role && !auth.hasRole(role)) {
    return <>{fallback}</>;
  }
  
  if (minRole && !auth.isAtLeastRole(minRole)) {
    return <>{fallback}</>;
  }
  
  // Check permission requirements
  if (permission && !auth.hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  if (permissions?.length) {
    const hasAccess = requireAll
      ? auth.hasAllPermissions(permissions)
      : auth.hasAnyPermission(permissions);
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }
  
  return <>{children}</>;
}

/**
 * Hook for conditional permission checks
 */
export function usePermission(permission: string): boolean {
  const auth = useModuleAuth();
  return auth.hasPermission(permission);
}

/**
 * Higher-order component for permission protection
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string,
  Fallback?: React.ComponentType
) {
  return function WithPermissionComponent(props: P) {
    const hasPermission = usePermission(permission);
    
    if (!hasPermission) {
      return Fallback ? <Fallback /> : null;
    }
    
    return <WrappedComponent {...props} />;
  };
}

/**
 * Require authentication wrapper
 */
interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RequireAuth({ 
  children, 
  fallback,
  redirectTo 
}: RequireAuthProps) {
  const auth = useModuleAuth();
  
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  
  if (!auth.user) {
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }
    return <>{fallback || <DefaultLoginPrompt />}</>;
  }
  
  return <>{children}</>;
}

function DefaultLoginPrompt() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <h2 className="text-xl font-semibold">Authentication Required</h2>
      <p className="text-muted-foreground">
        Please log in to access this module.
      </p>
    </div>
  );
}
```

---

### Task 4: Role Management Service (1.5 hours)

```typescript
// src/lib/modules/auth/role-management.ts

import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

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

export interface AssignRoleInput {
  userId: string;
  roleId: string;
  moduleId: string;
  siteId: string;
  grantedBy: string;
  expiresAt?: string;
}

/**
 * Create a new role for a module
 */
export async function createModuleRole(input: CreateRoleInput) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_roles')
    .insert({
      module_id: input.moduleId,
      site_id: input.siteId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      permissions: input.permissions,
      hierarchy_level: input.hierarchyLevel || 0,
      is_default: input.isDefault || false
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get all roles for a module
 */
export async function getModuleRoles(moduleId: string, siteId: string) {
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
  updates: Partial<CreateRoleInput>
) {
  const supabase = createClient();
  
  const updateData: any = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.permissions) updateData.permissions = updates.permissions;
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
 * Delete a role (if not system role)
 */
export async function deleteModuleRole(roleId: string) {
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

/**
 * Assign a role to a user
 */
export async function assignRole(input: AssignRoleInput) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_user_roles')
    .upsert({
      user_id: input.userId,
      role_id: input.roleId,
      module_id: input.moduleId,
      site_id: input.siteId,
      granted_by: input.grantedBy,
      expires_at: input.expiresAt,
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
 * Remove a role from a user
 */
export async function removeRole(userId: string, roleId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('module_user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);
  
  if (error) throw error;
}

/**
 * Get users with roles for a module
 */
export async function getModuleUsers(moduleId: string, siteId: string) {
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
  return data || [];
}

/**
 * Setup default roles for a module
 */
export async function setupDefaultRoles(
  moduleId: string,
  siteId: string,
  roleDefinitions: Array<{
    name: string;
    slug: string;
    permissions: string[];
    hierarchyLevel: number;
    isDefault?: boolean;
  }>
) {
  const supabase = createAdminClient();
  
  for (const role of roleDefinitions) {
    await supabase
      .from('module_roles')
      .upsert({
        module_id: moduleId,
        site_id: siteId,
        name: role.name,
        slug: role.slug,
        permissions: role.permissions,
        hierarchy_level: role.hierarchyLevel,
        is_default: role.isDefault || false,
        is_system: true
      }, {
        onConflict: 'module_id,site_id,slug'
      });
  }
}
```

---

### Task 5: Invitation System (1 hour)

```typescript
// src/lib/modules/auth/invitation-service.ts

import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { randomBytes } from 'crypto';

export interface CreateInvitationInput {
  moduleId: string;
  siteId: string;
  email: string;
  roleId: string;
  invitedBy: string;
  message?: string;
  expiresInDays?: number;
}

/**
 * Create an invitation
 */
export async function createInvitation(input: CreateInvitationInput) {
  const supabase = createClient();
  
  // Generate secure token
  const token = randomBytes(32).toString('hex');
  
  // Default 7-day expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays || 7));
  
  const { data, error } = await supabase
    .from('module_invitations')
    .insert({
      module_id: input.moduleId,
      site_id: input.siteId,
      email: input.email.toLowerCase(),
      role_id: input.roleId,
      token,
      invited_by: input.invitedBy,
      message: input.message,
      expires_at: expiresAt.toISOString()
    })
    .select(`
      id,
      email,
      token,
      expires_at,
      role:module_roles(name)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(token: string, userId: string) {
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
    await supabase
      .from('module_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    throw new Error('Invitation has expired');
  }
  
  // Assign the role
  await supabase
    .from('module_user_roles')
    .insert({
      user_id: userId,
      role_id: invitation.role_id,
      module_id: invitation.module_id,
      site_id: invitation.site_id,
      granted_by: invitation.invited_by,
      is_active: true
    });
  
  // Mark invitation as accepted
  await supabase
    .from('module_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: userId
    })
    .eq('id', invitation.id);
  
  return invitation;
}

/**
 * List pending invitations
 */
export async function listInvitations(moduleId: string, siteId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_invitations')
    .select(`
      id,
      email,
      status,
      created_at,
      expires_at,
      role:module_roles(name)
    `)
    .eq('module_id', moduleId)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(invitationId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('module_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId)
    .eq('status', 'pending');
  
  if (error) throw error;
}
```

---

## 📝 Example: CRM Module Permissions

```typescript
// How CRM module defines its permissions

const CRM_PERMISSIONS = [
  // Contacts
  { key: 'contacts.view', name: 'View Contacts', category: 'Contacts' },
  { key: 'contacts.create', name: 'Create Contacts', category: 'Contacts' },
  { key: 'contacts.edit', name: 'Edit Contacts', category: 'Contacts' },
  { key: 'contacts.delete', name: 'Delete Contacts', category: 'Contacts' },
  { key: 'contacts.export', name: 'Export Contacts', category: 'Contacts' },
  { key: 'contacts.import', name: 'Import Contacts', category: 'Contacts' },
  
  // Companies
  { key: 'companies.view', name: 'View Companies', category: 'Companies' },
  { key: 'companies.create', name: 'Create Companies', category: 'Companies' },
  { key: 'companies.edit', name: 'Edit Companies', category: 'Companies' },
  { key: 'companies.delete', name: 'Delete Companies', category: 'Companies' },
  
  // Deals
  { key: 'deals.view', name: 'View Deals', category: 'Deals' },
  { key: 'deals.create', name: 'Create Deals', category: 'Deals' },
  { key: 'deals.edit', name: 'Edit Deals', category: 'Deals' },
  { key: 'deals.delete', name: 'Delete Deals', category: 'Deals' },
  
  // Admin
  { key: 'settings.manage', name: 'Manage Settings', category: 'Admin' },
  { key: 'users.manage', name: 'Manage Users', category: 'Admin' },
];

const CRM_DEFAULT_ROLES = [
  {
    name: 'Admin',
    slug: 'admin',
    permissions: ['*'],  // Full access
    hierarchyLevel: 100,
  },
  {
    name: 'Sales Manager',
    slug: 'sales-manager',
    permissions: [
      'contacts.*',
      'companies.*',
      'deals.*',
    ],
    hierarchyLevel: 50,
  },
  {
    name: 'Sales Rep',
    slug: 'sales-rep',
    permissions: [
      'contacts.view',
      'contacts.create',
      'contacts.edit',
      'companies.view',
      'deals.view',
      'deals.create',
      'deals.edit',
    ],
    hierarchyLevel: 25,
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    permissions: [
      'contacts.view',
      'companies.view',
      'deals.view',
    ],
    hierarchyLevel: 10,
    isDefault: true,
  },
];

// On module installation
await setupDefaultRoles(moduleId, siteId, CRM_DEFAULT_ROLES);
```

---

## 📝 Usage in Components

```tsx
// Example: Protected component

import { PermissionGuard, useModuleAuth } from '@/lib/modules/auth';

function ContactsPage() {
  const { hasPermission } = useModuleAuth();
  
  return (
    <div>
      <h1>Contacts</h1>
      
      {/* Only show add button if user can create */}
      <PermissionGuard permission="contacts.create">
        <Button>Add Contact</Button>
      </PermissionGuard>
      
      {/* Conditional rendering */}
      {hasPermission('contacts.export') && (
        <Button variant="outline">Export</Button>
      )}
      
      {/* Require multiple permissions */}
      <PermissionGuard 
        permissions={['contacts.edit', 'contacts.delete']}
        requireAll
      >
        <BulkActions />
      </PermissionGuard>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [x] Roles created and stored correctly
- [x] User role assignments work
- [x] Permission checks are accurate
- [x] Wildcard permissions (*) work
- [x] Role hierarchy respected
- [x] Invitations sent and accepted
- [x] Session management works
- [x] Auth context propagates correctly

> **Note**: Run the migration in Supabase and regenerate types before use:
> ```bash
> pnpm supabase gen types typescript --project-id <project-id> > src/types/database.ts
> ```

---

## 📍 Dependencies

- **Requires**: EM-01, EM-12 (API Gateway)
- **Required by**: EM-50 (CRM), EM-51 (Booking), all modules
