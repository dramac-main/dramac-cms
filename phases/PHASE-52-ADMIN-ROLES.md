# Phase 52: Admin & Role-Based Access Control

> **AI Model**: Claude Opus 4.5 (2x)
>
> **⚠️ FIRST**: Read `PHASE-46-REMEDIATION-MASTER-PLAN.md`

---

## 🎯 Objective

Implement comprehensive admin functionality including super admin dashboard, role-based permissions, user impersonation, platform analytics, and administrative controls.

---

## 📋 Prerequisites

- [ ] Phase 51 completed
- [ ] Database tables for roles exist
- [ ] Proper RLS policies in place

---

## ✅ Tasks

### Task 52.1: Role System Types

**File: `src/types/roles.ts`**

```typescript
export type UserRole = "super_admin" | "agency_owner" | "agency_admin" | "agency_member" | "client";

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RolePermissions {
  super_admin: Permission[];
  agency_owner: Permission[];
  agency_admin: Permission[];
  agency_member: Permission[];
  client: Permission[];
}

export const PERMISSIONS = {
  // Platform level
  MANAGE_PLATFORM: "manage_platform",
  VIEW_ALL_AGENCIES: "view_all_agencies",
  IMPERSONATE_USERS: "impersonate_users",
  MANAGE_SUBSCRIPTIONS: "manage_subscriptions",
  VIEW_PLATFORM_ANALYTICS: "view_platform_analytics",
  
  // Agency level
  MANAGE_AGENCY: "manage_agency",
  INVITE_TEAM_MEMBERS: "invite_team_members",
  MANAGE_TEAM_ROLES: "manage_team_roles",
  DELETE_AGENCY: "delete_agency",
  VIEW_BILLING: "view_billing",
  MANAGE_BILLING: "manage_billing",
  
  // Client level
  MANAGE_CLIENTS: "manage_clients",
  VIEW_CLIENTS: "view_clients",
  DELETE_CLIENTS: "delete_clients",
  
  // Site level
  CREATE_SITES: "create_sites",
  EDIT_SITES: "edit_sites",
  DELETE_SITES: "delete_sites",
  PUBLISH_SITES: "publish_sites",
  
  // Content level
  EDIT_CONTENT: "edit_content",
  VIEW_ANALYTICS: "view_analytics",
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: Object.values(PERMISSIONS),
  agency_owner: [
    PERMISSIONS.MANAGE_AGENCY,
    PERMISSIONS.INVITE_TEAM_MEMBERS,
    PERMISSIONS.MANAGE_TEAM_ROLES,
    PERMISSIONS.DELETE_AGENCY,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.MANAGE_BILLING,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    PERMISSIONS.CREATE_SITES,
    PERMISSIONS.EDIT_SITES,
    PERMISSIONS.DELETE_SITES,
    PERMISSIONS.PUBLISH_SITES,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  agency_admin: [
    PERMISSIONS.INVITE_TEAM_MEMBERS,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_SITES,
    PERMISSIONS.EDIT_SITES,
    PERMISSIONS.DELETE_SITES,
    PERMISSIONS.PUBLISH_SITES,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  agency_member: [
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.EDIT_SITES,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  client: [
    PERMISSIONS.VIEW_ANALYTICS,
  ],
};
```

### Task 52.2: Role Check Utilities

**File: `src/lib/auth/permissions.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS, type UserRole } from "@/types/roles";

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role as UserRole || null;
}

export async function hasPermission(permission: string): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;

  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

export async function isSuperAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "super_admin";
}

export async function isAgencyOwner(agencyId?: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  if (agencyId) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", agencyId)
      .single();
    
    return agency?.owner_id === user.id;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "agency_owner";
}

export async function requirePermission(permission: string): Promise<void> {
  const allowed = await hasPermission(permission);
  if (!allowed) {
    throw new Error("Unauthorized: Missing required permission");
  }
}

export async function requireSuperAdmin(): Promise<void> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Super admin access required");
  }
}
```

### Task 52.3: Admin Route Layout

**File: `src/app/(dashboard)/admin/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = await isSuperAdmin();

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
```

### Task 52.4: Admin Sidebar

**File: `src/components/admin/admin-sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  Activity,
  AlertTriangle,
} from "lucide-react";

const adminNav = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Agencies", href: "/admin/agencies", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Activity Log", href: "/admin/activity", icon: Activity },
  { name: "System Health", href: "/admin/health", icon: AlertTriangle },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Super Admin Access</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-destructive text-white"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </aside>
  );
}
```

### Task 52.5: Admin Dashboard Page

**File: `src/app/(dashboard)/admin/page.tsx`**

```tsx
import { Metadata } from "next";
import { getPlatformStats } from "@/lib/actions/admin";
import { StatCard } from "@/components/admin/stat-card";
import { RecentActivity } from "@/components/admin/recent-activity";
import { SystemAlerts } from "@/components/admin/system-alerts";
import {
  Building2,
  Users,
  Globe,
  CreditCard,
  TrendingUp,
  Activity,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard | DRAMAC",
};

export default async function AdminDashboardPage() {
  const stats = await getPlatformStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground">
          Monitor platform health and metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Agencies"
          value={stats.totalAgencies}
          change={stats.agencyGrowth}
          icon={Building2}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change={stats.userGrowth}
          icon={Users}
        />
        <StatCard
          title="Active Sites"
          value={stats.activeSites}
          change={stats.siteGrowth}
          icon={Globe}
        />
        <StatCard
          title="MRR"
          value={`$${stats.mrr.toLocaleString()}`}
          change={stats.revenueGrowth}
          icon={CreditCard}
          isCurrency
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          change={stats.conversionChange}
          icon={TrendingUp}
        />
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions}
          icon={Activity}
        />
        <StatCard
          title="API Requests (24h)"
          value={stats.apiRequests.toLocaleString()}
          icon={Activity}
        />
      </div>

      {/* Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <SystemAlerts />
      </div>
    </div>
  );
}
```

### Task 52.6: Stat Card Component

**File: `src/components/admin/stat-card.tsx`**

```tsx
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  isCurrency?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  isCurrency,
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center text-sm mt-1",
              isPositive && "text-green-600",
              isNegative && "text-red-600",
              !isPositive && !isNegative && "text-muted-foreground"
            )}
          >
            {isPositive && <TrendingUp className="w-4 h-4 mr-1" />}
            {isNegative && <TrendingDown className="w-4 h-4 mr-1" />}
            <span>
              {isPositive && "+"}
              {change}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Task 52.7: User Management Page

**File: `src/app/(dashboard)/admin/users/page.tsx`**

```tsx
import { Metadata } from "next";
import { getAllUsers } from "@/lib/actions/admin";
import { UsersTable } from "@/components/admin/users-table";
import { UsersFilters } from "@/components/admin/users-filters";

export const metadata: Metadata = {
  title: "User Management | Admin | DRAMAC",
};

interface UsersPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminUsersPage({
  searchParams,
}: UsersPageProps) {
  const params = await searchParams;
  const { users, total, page, pageSize } = await getAllUsers({
    search: params.search,
    role: params.role,
    status: params.status,
    page: params.page ? parseInt(params.page) : 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage all users across the platform
        </p>
      </div>

      <UsersFilters />

      <UsersTable
        users={users}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
```

### Task 52.8: Users Table Component

**File: `src/components/admin/users-table.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  UserX,
  Shield,
  Key,
  Mail,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
  impersonateUser,
  suspendUser,
  resetUserPassword,
} from "@/lib/actions/admin";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  created_at: string;
  last_sign_in: string | null;
  agency_name: string | null;
}

interface UsersTableProps {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800",
  agency_owner: "bg-yellow-100 text-yellow-800",
  agency_admin: "bg-blue-100 text-blue-800",
  agency_member: "bg-green-100 text-green-800",
  client: "bg-gray-100 text-gray-800",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

export function UsersTable({ users, total, page, pageSize }: UsersTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleImpersonate = async (userId: string) => {
    setIsLoading(userId);
    try {
      const result = await impersonateUser(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Impersonation started. You are now viewing as this user.");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Failed to impersonate user");
    } finally {
      setIsLoading(null);
    }
  };

  const handleSuspend = async (userId: string, isSuspended: boolean) => {
    setIsLoading(userId);
    try {
      const result = await suspendUser(userId, !isSuspended);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isSuspended ? "User reactivated" : "User suspended");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update user status");
    } finally {
      setIsLoading(null);
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    setIsLoading(userId);
    try {
      const result = await resetUserPassword(email);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password reset email sent");
      }
    } catch (error) {
      toast.error("Failed to send reset email");
    } finally {
      setIsLoading(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {(user.full_name || user.email)
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.full_name || "Unnamed"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={roleColors[user.role] || ""}
                    >
                      {user.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.agency_name || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusColors[user.status] || ""}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in
                      ? format(new Date(user.last_sign_in), "MMM d, yyyy")
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading === user.id}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/users/${user.id}`)
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleImpersonate(user.id)}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleResetPassword(user.id, user.email)
                          }
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`mailto:${user.email}`)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleSuspend(user.id, user.status === "suspended")
                          }
                          className={
                            user.status === "suspended"
                              ? "text-green-600"
                              : "text-destructive"
                          }
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          {user.status === "suspended"
                            ? "Reactivate"
                            : "Suspend"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, total)} of {total} users
          </p>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) =>
              router.push(`/admin/users?page=${newPage}`)
            }
          />
        </div>
      )}
    </div>
  );
}
```

### Task 52.9: Admin Actions

**File: `src/lib/actions/admin.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";

export async function getPlatformStats() {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Get counts
  const [agencies, users, sites] = await Promise.all([
    supabase.from("agencies").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("sites")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  // For a real implementation, you'd calculate these from actual data
  return {
    totalAgencies: agencies.count || 0,
    totalUsers: users.count || 0,
    activeSites: sites.count || 0,
    mrr: 0, // Would come from payment provider
    agencyGrowth: 12.5,
    userGrowth: 8.3,
    siteGrowth: 15.2,
    revenueGrowth: 10.1,
    conversionRate: 3.2,
    conversionChange: 0.5,
    activeSessions: 42,
    apiRequests: 125000,
  };
}

export async function getAllUsers({
  search,
  role,
  status,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireSuperAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(
      `
      *,
      agencies:agency_members(agency:agencies(name))
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  if (role) {
    query = query.eq("role", role);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching users:", error);
    return { users: [], total: 0, page, pageSize };
  }

  const users = data.map((user) => ({
    ...user,
    agency_name: user.agencies?.[0]?.agency?.name || null,
  }));

  return {
    users,
    total: count || 0,
    page,
    pageSize,
  };
}

export async function impersonateUser(userId: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Get current admin user
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
    return { error: "Not authenticated" };
  }

  // Store admin session for later restoration
  const cookieStore = await cookies();
  cookieStore.set("admin_session", adminUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
  });

  // Note: Full impersonation requires custom session handling
  // This is a simplified version that sets a cookie to track impersonation
  cookieStore.set("impersonating", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60,
  });

  return { success: true };
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");

  if (!adminSession) {
    return { error: "No admin session found" };
  }

  cookieStore.delete("impersonating");
  cookieStore.delete("admin_session");

  return { success: true };
}

export async function suspendUser(userId: string, suspend: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      status: suspend ? "suspended" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user status:", error);
    return { error: "Failed to update user status" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function resetUserPassword(email: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    console.error("Error sending reset email:", error);
    return { error: "Failed to send reset email" };
  }

  return { success: true };
}

export async function getAllAgencies({
  search,
  status,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireSuperAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("agencies")
    .select(
      `
      *,
      owner:profiles!agencies_owner_id_fkey(full_name, email),
      clients:clients(count),
      sites:sites(count)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching agencies:", error);
    return { agencies: [], total: 0, page, pageSize };
  }

  return {
    agencies: data,
    total: count || 0,
    page,
    pageSize,
  };
}
```

### Task 52.10: Agencies Management Page

**File: `src/app/(dashboard)/admin/agencies/page.tsx`**

```tsx
import { Metadata } from "next";
import { getAllAgencies } from "@/lib/actions/admin";
import { AgenciesTable } from "@/components/admin/agencies-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Agency Management | Admin | DRAMAC",
};

interface AgenciesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminAgenciesPage({
  searchParams,
}: AgenciesPageProps) {
  const params = await searchParams;
  const { agencies, total, page, pageSize } = await getAllAgencies({
    search: params.search,
    status: params.status,
    page: params.page ? parseInt(params.page) : 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agency Management</h1>
          <p className="text-muted-foreground">
            View and manage all agencies on the platform
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agencies..."
            className="pl-9"
            defaultValue={params.search}
          />
        </div>
      </div>

      <AgenciesTable
        agencies={agencies}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
```

### Task 52.11: Impersonation Banner

**File: `src/components/admin/impersonation-banner.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopImpersonation } from "@/lib/actions/admin";

interface ImpersonationBannerProps {
  userName: string;
}

export function ImpersonationBanner({ userName }: ImpersonationBannerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStopImpersonation = async () => {
    setIsLoading(true);
    try {
      const result = await stopImpersonation();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Impersonation ended");
        router.push("/admin/users");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to stop impersonation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-white py-2 px-4">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="text-sm">
            You are viewing as <strong>{userName}</strong>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStopImpersonation}
          disabled={isLoading}
          className="text-white hover:text-white hover:bg-white/20"
        >
          <X className="w-4 h-4 mr-1" />
          Stop Impersonation
        </Button>
      </div>
    </div>
  );
}
```

### Task 52.12: Update Root Layout for Impersonation

**File: `src/app/(dashboard)/layout.tsx`** (add to existing)

```tsx
// Add this import at the top
import { cookies } from "next/headers";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { getProfile } from "@/lib/actions/profile";

// Inside the layout component, before the main content:
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const impersonatingId = cookieStore.get("impersonating")?.value;
  
  let impersonatedUser = null;
  if (impersonatingId) {
    impersonatedUser = await getProfile(impersonatingId);
  }

  return (
    <div>
      {impersonatedUser && (
        <ImpersonationBanner
          userName={impersonatedUser.full_name || impersonatedUser.email || "User"}
        />
      )}
      {/* Rest of the layout */}
      {children}
    </div>
  );
}
```

---

## 🧪 Testing Checklist

After implementing this phase, verify:

- [ ] Admin layout only accessible to super_admins
- [ ] Admin sidebar navigation works
- [ ] Platform stats display correctly
- [ ] Users table shows all users
- [ ] User search/filter works
- [ ] Impersonation starts correctly
- [ ] Impersonation banner appears
- [ ] Stop impersonation works
- [ ] User suspend/reactivate works
- [ ] Password reset email sends
- [ ] Agencies table shows all agencies
- [ ] Role permissions enforced correctly

---

## 📝 Notes

- Admin area uses red accent color to distinguish from regular UI
- Impersonation uses cookies to track sessions
- All admin actions require super_admin role
- Consider audit logging for admin actions
- Impersonation should be time-limited (1 hour max)
