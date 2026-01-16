# Phase 58: Client Management - Complete CRUD Pages

> **AI Model**: Claude Opus 4.5 (2x) ⭐ CRITICAL PHASE
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 4-6 hours

---

## 🎯 Objective

Create all missing client management pages with full CRUD functionality, including list view, detail view, create/edit forms, and delete confirmation. The current state only has a `.gitkeep` file in the clients directory.

---

## 📋 Prerequisites

- [ ] Phase 46-48 completed
- [ ] Database RLS policies configured
- [ ] User authentication working
- [ ] Agency context available via hook

---

## 📁 Files to Create

```
src/app/(dashboard)/clients/
├── page.tsx                          # Clients list page
├── loading.tsx                       # Loading state
├── error.tsx                         # Error boundary
├── [clientId]/
│   ├── page.tsx                      # Client detail page
│   ├── loading.tsx                   # Loading state
│   ├── edit/
│   │   └── page.tsx                  # Edit client page
│   └── sites/
│       └── page.tsx                  # Client's sites page

src/components/clients/
├── clients-table.tsx                 # Main clients table
├── clients-table-skeleton.tsx        # Loading skeleton
├── client-filters-bar.tsx            # Search/filter controls
├── create-client-dialog.tsx          # Create client modal
├── edit-client-dialog.tsx            # Edit client modal
├── delete-client-dialog.tsx          # Delete confirmation
├── client-detail-tabs.tsx            # Detail page tabs
├── client-overview-tab.tsx           # Overview content
├── client-sites-tab.tsx              # Client's sites
├── client-activity-tab.tsx           # Client activity log
├── client-status-badge.tsx           # Status indicator
├── client-row-actions.tsx            # Table row actions
└── impersonate-client-button.tsx     # Portal impersonation

src/lib/actions/clients.ts            # Server actions (update)
src/lib/validations/client.ts         # Zod schemas
src/types/client.ts                   # TypeScript types
src/hooks/use-clients.ts              # React Query hooks
```

---

## ✅ Tasks

### Task 58.1: Client Types Definition

**File: `src/types/client.ts`**

```typescript
export type ClientStatus = "active" | "inactive" | "archived";

export interface Client {
  id: string;
  agency_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  status: ClientStatus;
  has_portal_access: boolean;
  portal_password_hash: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  sites_count?: number;
  last_activity?: string;
}

export interface ClientWithSites extends Client {
  sites: {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    created_at: string;
  }[];
}

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  has_portal_access?: boolean;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  status?: ClientStatus;
}

export interface ClientFilters {
  search?: string;
  status?: ClientStatus | "all";
  sortBy?: "name" | "created_at" | "updated_at" | "company";
  sortOrder?: "asc" | "desc";
}
```

---

### Task 58.2: Client Validation Schemas

**File: `src/lib/validations/client.ts`**

```typescript
import { z } from "zod";

export const createClientSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "Phone must be 20 characters or less")
    .optional()
    .or(z.literal("")),
  company: z
    .string()
    .max(100, "Company must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(200, "Address must be 200 characters or less")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(100, "City must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  country: z
    .string()
    .max(100, "Country must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(1000, "Notes must be 1000 characters or less")
    .optional()
    .or(z.literal("")),
  has_portal_access: z.boolean().default(false),
});

export const updateClientSchema = createClientSchema.partial().extend({
  status: z.enum(["active", "inactive", "archived"]).optional(),
});

export const clientFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "active", "inactive", "archived"]).optional(),
  sortBy: z.enum(["name", "created_at", "updated_at", "company"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type CreateClientFormData = z.infer<typeof createClientSchema>;
export type UpdateClientFormData = z.infer<typeof updateClientSchema>;
```

---

### Task 58.3: Client Server Actions

**File: `src/lib/actions/clients.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createClientSchema, updateClientSchema } from "@/lib/validations/client";
import type { Client, ClientFilters, CreateClientInput, UpdateClientInput } from "@/types/client";

// Get current user's agency ID
async function getAgencyId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .single();

  return member?.agency_id || null;
}

// Get all clients for the agency
export async function getClients(filters?: ClientFilters): Promise<Client[]> {
  const supabase = await createClient();
  const agencyId = await getAgencyId();
  
  if (!agencyId) return [];

  let query = supabase
    .from("clients")
    .select(`
      *,
      sites:sites(count)
    `)
    .eq("agency_id", agencyId);

  // Apply filters
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
    );
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || "created_at";
  const sortOrder = filters?.sortOrder || "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching clients:", error);
    return [];
  }

  // Transform sites count
  return (data || []).map((client) => ({
    ...client,
    sites_count: client.sites?.[0]?.count || 0,
  }));
}

// Get single client by ID
export async function getClient(clientId: string): Promise<Client | null> {
  const supabase = await createClient();
  const agencyId = await getAgencyId();
  
  if (!agencyId) return null;

  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      sites:sites(id, name, subdomain, status, created_at)
    `)
    .eq("id", clientId)
    .eq("agency_id", agencyId)
    .single();

  if (error) {
    console.error("Error fetching client:", error);
    return null;
  }

  return data;
}

// Create new client
export async function createClientAction(input: CreateClientInput): Promise<{
  success: boolean;
  data?: Client;
  error?: string;
}> {
  const supabase = await createClient();
  const agencyId = await getAgencyId();
  
  if (!agencyId) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate input
  const validation = createClientSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  // Check for duplicate email within agency
  if (input.email) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("email", input.email)
      .single();

    if (existing) {
      return { success: false, error: "A client with this email already exists" };
    }
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      agency_id: agencyId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      company: input.company || null,
      address: input.address || null,
      city: input.city || null,
      country: input.country || null,
      notes: input.notes || null,
      has_portal_access: input.has_portal_access || false,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating client:", error);
    return { success: false, error: "Failed to create client" };
  }

  revalidatePath("/dashboard/clients");
  return { success: true, data };
}

// Update client
export async function updateClientAction(
  clientId: string,
  input: UpdateClientInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const agencyId = await getAgencyId();
  
  if (!agencyId) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate input
  const validation = updateClientSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  // Check ownership
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("agency_id", agencyId)
    .single();

  if (!existing) {
    return { success: false, error: "Client not found" };
  }

  // Check for duplicate email
  if (input.email) {
    const { data: duplicate } = await supabase
      .from("clients")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("email", input.email)
      .neq("id", clientId)
      .single();

    if (duplicate) {
      return { success: false, error: "A client with this email already exists" };
    }
  }

  const { error } = await supabase
    .from("clients")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (error) {
    console.error("Error updating client:", error);
    return { success: false, error: "Failed to update client" };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// Delete client
export async function deleteClientAction(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const agencyId = await getAgencyId();
  
  if (!agencyId) {
    return { success: false, error: "Not authenticated" };
  }

  // Check ownership
  const { data: existing } = await supabase
    .from("clients")
    .select("id, sites:sites(count)")
    .eq("id", clientId)
    .eq("agency_id", agencyId)
    .single();

  if (!existing) {
    return { success: false, error: "Client not found" };
  }

  // Check for associated sites
  const sitesCount = existing.sites?.[0]?.count || 0;
  if (sitesCount > 0) {
    return { 
      success: false, 
      error: `Cannot delete client with ${sitesCount} active site(s). Delete the sites first.` 
    };
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: "Failed to delete client" };
  }

  revalidatePath("/dashboard/clients");
  return { success: true };
}

// Archive client (soft delete)
export async function archiveClientAction(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  return updateClientAction(clientId, { status: "archived" });
}

// Get client count for billing
export async function getClientCount(): Promise<number> {
  const supabase = await createClient();
  const agencyId = await getAgencyId();
  
  if (!agencyId) return 0;

  const { count, error } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .eq("status", "active");

  if (error) return 0;
  return count || 0;
}
```

---

### Task 58.4: Clients React Query Hook

**File: `src/hooks/use-clients.ts`**

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getClients, 
  getClient, 
  createClientAction, 
  updateClientAction,
  deleteClientAction 
} from "@/lib/actions/clients";
import type { Client, ClientFilters, CreateClientInput, UpdateClientInput } from "@/types/client";

// Query keys
export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (filters?: ClientFilters) => [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

// Fetch all clients
export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => getClients(filters),
  });
}

// Fetch single client
export function useClient(clientId: string) {
  return useQuery({
    queryKey: clientKeys.detail(clientId),
    queryFn: () => getClient(clientId),
    enabled: !!clientId,
  });
}

// Create client mutation
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInput) => createClientAction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

// Update client mutation
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, input }: { clientId: string; input: UpdateClientInput }) =>
      updateClientAction(clientId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.clientId) });
    },
  });
}

// Delete client mutation
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => deleteClientAction(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}
```

---

### Task 58.5: Clients List Page

**File: `src/app/(dashboard)/clients/page.tsx`**

```tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientsTableSkeleton } from "@/components/clients/clients-table-skeleton";
import { ClientFiltersBar } from "@/components/clients/client-filters-bar";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Clients | DRAMAC",
  description: "Manage your client accounts",
};

interface ClientsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  
  const filters = {
    search: params.search,
    status: params.status as "all" | "active" | "inactive" | "archived" | undefined,
    sortBy: params.sortBy as "name" | "created_at" | "updated_at" | "company" | undefined,
    sortOrder: params.sortOrder as "asc" | "desc" | undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your client accounts and billing seats"
      >
        <CreateClientDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </CreateClientDialog>
      </PageHeader>

      <ClientFiltersBar />

      <Suspense fallback={<ClientsTableSkeleton />}>
        <ClientsTable filters={filters} />
      </Suspense>
    </div>
  );
}
```

---

### Task 58.6: Clients Loading State

**File: `src/app/(dashboard)/clients/loading.tsx`**

```tsx
import { PageHeader } from "@/components/layout/page-header";
import { ClientsTableSkeleton } from "@/components/clients/clients-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your client accounts and billing seats"
      >
        <Skeleton className="h-10 w-32" />
      </PageHeader>

      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      <ClientsTableSkeleton />
    </div>
  );
}
```

---

### Task 58.7: Clients Error Boundary

**File: `src/app/(dashboard)/clients/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ClientsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ClientsError({ error, reset }: ClientsErrorProps) {
  useEffect(() => {
    console.error("Clients page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md">
          We couldn't load your clients. This might be a temporary issue.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}
```

---

### Task 58.8: Clients Table Component

**File: `src/components/clients/clients-table.tsx`**

```tsx
import { getClients } from "@/lib/actions/clients";
import type { ClientFilters } from "@/types/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClientStatusBadge } from "./client-status-badge";
import { ClientRowActions } from "./client-row-actions";
import { formatDistanceToNow } from "date-fns";
import { Building2, Globe, Mail, Users } from "lucide-react";
import Link from "next/link";

interface ClientsTableProps {
  filters?: ClientFilters;
}

export async function ClientsTable({ filters }: ClientsTableProps) {
  const clients = await getClients(filters);

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/30">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No clients yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Add your first client to start building websites for them.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Client</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-center">Sites</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link 
                  href={`/dashboard/clients/${client.id}`}
                  className="flex items-center gap-3 hover:underline"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={client.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {client.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{client.name}</div>
                    {client.city && client.country && (
                      <div className="text-sm text-muted-foreground">
                        {client.city}, {client.country}
                      </div>
                    )}
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                {client.company ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{client.company}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {client.email ? (
                  <a 
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-2 text-sm hover:underline"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {client.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{client.sites_count || 0}</span>
                </div>
              </TableCell>
              <TableCell>
                <ClientStatusBadge status={client.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <ClientRowActions client={client} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

### Task 58.9: Clients Table Skeleton

**File: `src/components/clients/clients-table-skeleton.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ClientsTableSkeleton() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Client</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-center">Sites</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Skeleton className="h-4 w-8" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

### Task 58.10: Client Filters Bar

**File: `src/components/clients/client-filters-bar.tsx`**

```tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect } from "react";

export function ClientFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 300);

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });

      return newParams.toString();
    },
    [searchParams]
  );

  const updateFilters = useCallback(
    (params: Record<string, string | null>) => {
      startTransition(() => {
        const queryString = createQueryString(params);
        router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
      });
    },
    [createQueryString, pathname, router]
  );

  // Update search when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== searchParams.get("search")) {
      updateFilters({ search: debouncedSearch || null });
    }
  }, [debouncedSearch, searchParams, updateFilters]);

  const clearFilters = () => {
    setSearch("");
    router.push(pathname);
  };

  const hasFilters = search || searchParams.get("status");

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={searchParams.get("status") || "all"}
        onValueChange={(value) => updateFilters({ status: value === "all" ? null : value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("sortBy") || "created_at"}
        onValueChange={(value) => updateFilters({ sortBy: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Date Added</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="company">Company</SelectItem>
          <SelectItem value="updated_at">Last Updated</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" onClick={clearFilters} className="px-3">
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
```

---

### Task 58.11: Create Client Dialog

**File: `src/components/clients/create-client-dialog.tsx`**

```tsx
"use client";

import { useState, useTransition, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientAction } from "@/lib/actions/clients";
import { createClientSchema, type CreateClientFormData } from "@/lib/validations/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CreateClientDialogProps {
  children: ReactNode;
}

export function CreateClientDialog({ children }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      city: "",
      country: "",
      notes: "",
      has_portal_access: false,
    },
  });

  const onSubmit = (data: CreateClientFormData) => {
    startTransition(async () => {
      const result = await createClientAction(data);

      if (result.success) {
        toast.success("Client created successfully");
        form.reset();
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to create client");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Create a new client account. This will count as a billable seat.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Required Fields */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Details */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="additional">
                <AccordionTrigger className="text-sm">
                  Additional Details
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="United States" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional notes about this client..."
                            className="resize-none"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Portal Access */}
            <FormField
              control={form.control}
              name="has_portal_access"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Portal Access</FormLabel>
                    <FormDescription>
                      Allow client to view their sites in the portal
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Client
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 58.12: Client Status Badge

**File: `src/components/clients/client-status-badge.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import type { ClientStatus } from "@/types/client";

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

const statusConfig: Record<ClientStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  archived: { label: "Archived", variant: "outline" },
};

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
```

---

### Task 58.13: Client Row Actions

**File: `src/components/clients/client-row-actions.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/types/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Globe, 
  Archive,
  Trash2,
  LogIn 
} from "lucide-react";
import { EditClientDialog } from "./edit-client-dialog";
import { DeleteClientDialog } from "./delete-client-dialog";

interface ClientRowActionsProps {
  client: Client;
}

export function ClientRowActions({ client }: ClientRowActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}/sites`)}>
            <Globe className="mr-2 h-4 w-4" />
            View Sites
          </DropdownMenuItem>
          {client.has_portal_access && (
            <DropdownMenuItem onClick={() => router.push(`/portal/impersonate/${client.id}`)}>
              <LogIn className="mr-2 h-4 w-4" />
              Access Portal
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditClientDialog 
        client={client} 
        open={editOpen} 
        onOpenChange={setEditOpen} 
      />
      
      <DeleteClientDialog 
        client={client} 
        open={deleteOpen} 
        onOpenChange={setDeleteOpen} 
      />
    </>
  );
}
```

---

### Task 58.14: Edit Client Dialog

**File: `src/components/clients/edit-client-dialog.tsx`**

```tsx
"use client";

import { useState, useTransition, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateClientAction } from "@/lib/actions/clients";
import { updateClientSchema } from "@/lib/validations/client";
import { toast } from "sonner";
import type { Client, ClientStatus } from "@/types/client";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EditClientFormData = z.infer<typeof updateClientSchema>;

interface EditClientDialogProps {
  client: Client;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function EditClientDialog({ 
  client, 
  open: controlledOpen, 
  onOpenChange,
  children 
}: EditClientDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const form = useForm<EditClientFormData>({
    resolver: zodResolver(updateClientSchema),
    defaultValues: {
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      address: client.address || "",
      city: client.city || "",
      country: client.country || "",
      notes: client.notes || "",
      status: client.status,
      has_portal_access: client.has_portal_access,
    },
  });

  const onSubmit = (data: EditClientFormData) => {
    startTransition(async () => {
      const result = await updateClientAction(client.id, data);

      if (result.success) {
        toast.success("Client updated successfully");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to update client");
      }
    });
  };

  const content = (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Client</DialogTitle>
        <DialogDescription>
          Update client information and settings.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Inactive and archived clients won't count toward your billing.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="has_portal_access"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Portal Access</FormLabel>
                      <FormDescription>
                        Allow client to view their sites in the portal
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );

  if (children) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {content}
    </Dialog>
  );
}
```

---

### Task 58.15: Delete Client Dialog

**File: `src/components/clients/delete-client-dialog.tsx`**

```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteClientAction } from "@/lib/actions/clients";
import { toast } from "sonner";
import type { Client } from "@/types/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteClientDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteClientDialog({ 
  client, 
  open, 
  onOpenChange 
}: DeleteClientDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClientAction(client.id);

      if (result.success) {
        toast.success("Client deleted successfully");
        onOpenChange(false);
        router.push("/dashboard/clients");
      } else {
        toast.error(result.error || "Failed to delete client");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Client</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{client.name}</strong>?
            This action cannot be undone.
            {client.sites_count && client.sites_count > 0 && (
              <span className="block mt-2 text-destructive font-medium">
                ⚠️ This client has {client.sites_count} site(s). 
                You must delete all sites first.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending || (client.sites_count && client.sites_count > 0)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

### Task 58.16: Client Detail Page

**File: `src/app/(dashboard)/clients/[clientId]/page.tsx`**

```tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/actions/clients";
import { PageHeader } from "@/components/layout/page-header";
import { ClientDetailTabs } from "@/components/clients/client-detail-tabs";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { Button } from "@/components/ui/button";
import { Edit, LogIn } from "lucide-react";
import Link from "next/link";

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

export async function generateMetadata({ 
  params 
}: ClientDetailPageProps): Promise<Metadata> {
  const { clientId } = await params;
  const client = await getClient(clientId);
  
  return {
    title: client ? `${client.name} | DRAMAC` : "Client Not Found",
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params;
  const client = await getClient(clientId);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={client.company || client.email || "No contact info"}
        backHref="/dashboard/clients"
      >
        <div className="flex items-center gap-2">
          <ClientStatusBadge status={client.status} />
          
          {client.has_portal_access && (
            <Link href={`/portal/impersonate/${client.id}`}>
              <Button variant="outline" size="sm">
                <LogIn className="mr-2 h-4 w-4" />
                Portal
              </Button>
            </Link>
          )}
          
          <EditClientDialog client={client}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </EditClientDialog>
        </div>
      </PageHeader>

      <ClientDetailTabs client={client} />
    </div>
  );
}
```

---

### Task 58.17: Client Detail Tabs

**File: `src/components/clients/client-detail-tabs.tsx`**

```tsx
import type { Client } from "@/types/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientOverviewTab } from "./client-overview-tab";
import { ClientSitesTab } from "./client-sites-tab";
import { ClientActivityTab } from "./client-activity-tab";

interface ClientDetailTabsProps {
  client: Client & { sites?: any[] };
}

export function ClientDetailTabs({ client }: ClientDetailTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sites">Sites</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ClientOverviewTab client={client} />
      </TabsContent>

      <TabsContent value="sites">
        <ClientSitesTab client={client} />
      </TabsContent>

      <TabsContent value="activity">
        <ClientActivityTab clientId={client.id} />
      </TabsContent>
    </Tabs>
  );
}
```

---

### Task 58.18: Client Overview Tab

**File: `src/components/clients/client-overview-tab.tsx`**

```tsx
import type { Client } from "@/types/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Globe,
  KeyRound
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ClientOverviewTabProps {
  client: Client & { sites?: any[] };
}

export function ClientOverviewTab({ client }: ClientOverviewTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Contact Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={client.avatar_url || undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {client.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{client.name}</h3>
              {client.company && (
                <p className="text-muted-foreground">{client.company}</p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="hover:underline">
                  {client.email}
                </a>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="hover:underline">
                  {client.phone}
                </a>
              </div>
            )}

            {(client.address || client.city || client.country) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {client.address && <p>{client.address}</p>}
                  {(client.city || client.country) && (
                    <p className="text-muted-foreground">
                      {[client.city, client.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>Active Sites</span>
            </div>
            <span className="font-semibold text-lg">
              {client.sites?.length || 0}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2 text-muted-foreground">
              <KeyRound className="h-4 w-4" />
              <span>Portal Access</span>
            </div>
            <Badge variant={client.has_portal_access ? "default" : "secondary"}>
              {client.has_portal_access ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Member Since</span>
            </div>
            <span>
              {format(new Date(client.created_at), "MMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Last Updated</span>
            </div>
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(client.updated_at), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notes Card */}
      {client.notes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {client.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### Task 58.19: Client Sites Tab

**File: `src/components/clients/client-sites-tab.tsx`**

```tsx
import type { Client } from "@/types/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, ExternalLink, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ClientSitesTabProps {
  client: Client & { 
    sites?: {
      id: string;
      name: string;
      subdomain: string;
      status: string;
      created_at: string;
    }[] 
  };
}

export function ClientSitesTab({ client }: ClientSitesTabProps) {
  const sites = client.sites || [];

  if (sites.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No sites yet</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-4">
            Create a website for {client.name} to get started.
          </p>
          <Link href={`/dashboard/sites/new?clientId=${client.id}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Site
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {sites.length} Site{sites.length !== 1 ? "s" : ""}
        </h3>
        <Link href={`/dashboard/sites/new?clientId=${client.id}`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sites.map((site) => (
          <Card key={site.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{site.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {site.subdomain}.dramac.site
                  </p>
                </div>
                <Badge 
                  variant={site.status === "published" ? "default" : "secondary"}
                >
                  {site.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(new Date(site.created_at), { addSuffix: true })}
                </span>
                <div className="flex gap-2">
                  <Link href={`/editor/${site.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link 
                    href={`https://${site.subdomain}.dramac.site`} 
                    target="_blank"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

### Task 58.20: Client Activity Tab

**File: `src/components/clients/client-activity-tab.tsx`**

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface ClientActivityTabProps {
  clientId: string;
}

export function ClientActivityTab({ clientId }: ClientActivityTabProps) {
  // TODO: Implement activity logging in Phase 69
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Activity Log Coming Soon</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Track all client-related activities including site edits, 
          logins, and changes.
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] Test `createClientSchema` validation
- [ ] Test `updateClientSchema` validation
- [ ] Test all server actions return correct responses

### Integration Tests

- [ ] Create client with all fields
- [ ] Create client with minimal fields
- [ ] Update client successfully
- [ ] Delete client without sites
- [ ] Prevent delete client with sites
- [ ] Filters work correctly
- [ ] Search works correctly
- [ ] Sorting works correctly

### E2E Tests

- [ ] Complete create → view → edit → delete flow
- [ ] Navigation between client pages
- [ ] Form validation displays errors
- [ ] Loading states appear correctly
- [ ] Error boundary catches errors

---

## ✅ Completion Checklist

- [ ] All files created
- [ ] TypeScript compiles without errors
- [ ] All components render correctly
- [ ] Server actions work with RLS enabled
- [ ] Forms validate correctly
- [ ] Delete protection for clients with sites
- [ ] Responsive design on mobile
- [ ] Loading states implemented
- [ ] Error handling complete

---

## 📝 Notes

- Client creation triggers seat billing update
- Archived clients don't count toward billing
- Portal access requires separate authentication (Phase 70+)
- Activity logging will be added in Phase 69

---

**Next Phase**: Phase 59 - RLS Security Audit
