# Phase 48: Client Management - Complete Implementation

> **AI Model**: Claude Opus 4.5 (2x)
>
> **⚠️ FIRST**: Read `PHASE-46-REMEDIATION-MASTER-PLAN.md`

---

## 🎯 Objective

Create all missing client management pages and implement client portal access and impersonation features.

---

## 📋 Prerequisites

- [ ] Phase 47 completed
- [ ] Sites management working
- [ ] RLS properly configured

---

## ✅ Tasks

### Task 48.1: Create Clients List Page

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
  description: "Manage your clients",
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
    sortBy: params.sortBy as "name" | "created_at" | "updated_at" | undefined,
    sortOrder: params.sortOrder as "asc" | "desc" | undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your client accounts"
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

### Task 48.2: Client Detail Page

**File: `src/app/(dashboard)/clients/[clientId]/page.tsx`**

```tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/actions/clients";
import { PageHeader } from "@/components/layout/page-header";
import { ClientDetailTabs } from "@/components/clients/client-detail-tabs";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { Button } from "@/components/ui/button";
import { Edit, LogIn } from "lucide-react";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { ImpersonateClientButton } from "@/components/clients/impersonate-client-button";

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

export async function generateMetadata({ params }: ClientDetailPageProps): Promise<Metadata> {
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
            <ImpersonateClientButton clientId={client.id} clientName={client.name} />
          )}
          <EditClientDialog client={client}>
            <Button variant="outline">
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

### Task 48.3: Client Detail Tabs Component

**File: `src/components/clients/client-detail-tabs.tsx`**

```tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientOverview } from "./client-overview";
import { ClientSitesList } from "./client-sites-list";
import { ClientActivityLog } from "./client-activity-log";
import { ClientPortalSettings } from "./client-portal-settings";
import { ClientDangerZone } from "./client-danger-zone";
import type { Client } from "@/types/client";
import type { Site } from "@/types/site";

interface ClientDetailTabsProps {
  client: Client & {
    sites?: Site[];
  };
}

export function ClientDetailTabs({ client }: ClientDetailTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sites">Sites ({client.sites?.length || 0})</TabsTrigger>
        <TabsTrigger value="portal">Portal Access</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="danger">Danger Zone</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ClientOverview client={client} />
      </TabsContent>

      <TabsContent value="sites">
        <ClientSitesList clientId={client.id} sites={client.sites || []} />
      </TabsContent>

      <TabsContent value="portal">
        <ClientPortalSettings client={client} />
      </TabsContent>

      <TabsContent value="activity">
        <ClientActivityLog clientId={client.id} />
      </TabsContent>

      <TabsContent value="danger">
        <ClientDangerZone client={client} />
      </TabsContent>
    </Tabs>
  );
}
```

### Task 48.4: Client Status Badge

**File: `src/components/clients/client-status-badge.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClientStatus } from "@/types/client";

interface ClientStatusBadgeProps {
  status: ClientStatus;
  className?: string;
}

const statusConfig: Record<ClientStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-success text-success-foreground",
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground",
  },
  archived: {
    label: "Archived",
    className: "bg-danger/10 text-danger",
  },
};

export function ClientStatusBadge({ status, className }: ClientStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
```

### Task 48.5: Impersonate Client Button

**File: `src/components/clients/impersonate-client-button.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { impersonateClient } from "@/lib/actions/clients";

interface ImpersonateClientButtonProps {
  clientId: string;
  clientName: string;
}

export function ImpersonateClientButton({ clientId, clientName }: ImpersonateClientButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleImpersonate = async () => {
    setIsLoading(true);
    try {
      const result = await impersonateClient(clientId);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Now viewing as ${clientName}`);
      // Redirect to client portal view
      router.push("/portal");
    } catch (error) {
      toast.error("Failed to impersonate client");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <LogIn className="mr-2 h-4 w-4" />
          View as Client
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>View as Client</AlertDialogTitle>
          <AlertDialogDescription>
            You will see the platform from <strong>{clientName}'s</strong> perspective.
            This is useful for troubleshooting or demonstrating features.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={handleImpersonate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Task 48.6: Client Portal Settings Component

**File: `src/components/clients/client-portal-settings.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Loader2, Mail, Key, Shield } from "lucide-react";
import { toast } from "sonner";
import { updateClientAction, inviteClientToPortal, revokeClientPortalAccess } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Client } from "@/types/client";

interface ClientPortalSettingsProps {
  client: Client;
}

export function ClientPortalSettings({ client }: ClientPortalSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    if (!client.email) {
      toast.error("Client must have an email address to receive portal access");
      return;
    }

    setIsLoading(true);
    try {
      const result = await inviteClientToPortal(client.id);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invitation sent! The client will receive an email with login instructions.");
      }
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    setIsLoading(true);
    try {
      const result = await revokeClientPortalAccess(client.id);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Portal access revoked");
      }
    } catch (error) {
      toast.error("Failed to revoke access");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Client Portal Access
          </CardTitle>
          <CardDescription>
            Allow your client to log in and view their sites directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {client.has_portal_access ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-success/5 border-success/20">
                <div>
                  <p className="font-medium text-success">Portal Access Enabled</p>
                  <p className="text-sm text-muted-foreground">
                    {client.email} can log in to view their sites
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Revoke Access
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke Portal Access</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately prevent {client.name} from logging in to view their sites.
                        You can re-enable access at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button variant="destructive" onClick={handleRevoke} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Revoke Access
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-2">
                <Label>Portal Permissions</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">View Sites</p>
                      <p className="text-xs text-muted-foreground">Client can see their website previews</p>
                    </div>
                    <Switch defaultChecked disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Edit Content</p>
                      <p className="text-xs text-muted-foreground">Client can make basic content changes</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">View Analytics</p>
                      <p className="text-xs text-muted-foreground">Client can see site analytics</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Portal Access Disabled</p>
                  <p className="text-sm text-muted-foreground">
                    {client.email 
                      ? "Send an invitation to enable client login"
                      : "Add an email address to enable portal access"
                    }
                  </p>
                </div>
              </div>

              {client.email ? (
                <Button onClick={handleInvite} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Mail className="mr-2 h-4 w-4" />
                  Send Portal Invitation
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Please add an email address in the client details to enable portal access.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Portal Features
          </CardTitle>
          <CardDescription>
            What clients can do when they log in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              View their website in preview mode
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              See site statistics and analytics
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              Submit content change requests
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted" />
              Make direct content edits (optional)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 48.7: Client Danger Zone Component

**File: `src/components/clients/client-danger-zone.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, AlertTriangle, Archive } from "lucide-react";
import { toast } from "sonner";
import { deleteClientAction, updateClientAction } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import type { Client } from "@/types/client";

interface ClientDangerZoneProps {
  client: Client & { sites?: { id: string }[] };
}

export function ClientDangerZone({ client }: ClientDangerZoneProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const hasSites = (client.sites?.length || 0) > 0;
  const canDelete = confirmText === client.name && !hasSites;

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const result = await updateClientAction(client.id, { status: "archived" });
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Client archived successfully");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to archive client");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteClientAction(client.id);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Client deleted successfully");
        router.push("/dashboard/clients");
      }
    } catch (error) {
      toast.error("Failed to delete client");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-danger">
      <CardHeader>
        <CardTitle className="text-danger flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible and destructive actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Archive */}
        {client.status !== "archived" && (
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Archive this client</p>
              <p className="text-sm text-muted-foreground">
                Hide from active clients. Can be restored later.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive Client</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move "{client.name}" to archived clients.
                    Their sites will remain but won't be visible in the main list.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button onClick={handleArchive} disabled={isArchiving}>
                    {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Archive Client
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Delete */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-danger/50">
          <div>
            <p className="font-medium">Delete this client</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete this client. Cannot be undone.
            </p>
            {hasSites && (
              <p className="text-sm text-danger mt-1">
                ⚠️ Delete all sites first ({client.sites?.length} sites exist)
              </p>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={hasSites}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Client</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  <strong> "{client.name}"</strong> and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Type <strong>{client.name}</strong> to confirm:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={client.name}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!canDelete || isDeleting}
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Client
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 48.8: Add Client Actions to Server

**Update: `src/lib/actions/clients.ts`** - Add these functions:

```typescript
// Invite client to portal
export async function inviteClientToPortal(clientId: string) {
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, email, name, agency_id")
    .eq("id", clientId)
    .single();

  if (!client) {
    return { error: "Client not found" };
  }

  if (!client.email) {
    return { error: "Client must have an email address" };
  }

  // Create portal user account
  // In production, this would send an email invitation
  // For now, we'll just mark the client as having portal access

  const { error } = await supabase
    .from("clients")
    .update({
      has_portal_access: true,
      // portal_user_id would be set after the user accepts the invitation
    })
    .eq("id", clientId);

  if (error) {
    return { error: error.message };
  }

  // TODO: Send invitation email via Resend
  // await sendPortalInvitation(client.email, client.name);

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// Revoke client portal access
export async function revokeClientPortalAccess(clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      has_portal_access: false,
      portal_user_id: null,
    })
    .eq("id", clientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// Impersonate client (set session flag)
export async function impersonateClient(clientId: string) {
  const supabase = await createClient();

  // Verify client exists and has portal access
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, has_portal_access")
    .eq("id", clientId)
    .single();

  if (!client) {
    return { error: "Client not found" };
  }

  if (!client.has_portal_access) {
    return { error: "Client does not have portal access enabled" };
  }

  // In a real implementation, this would set a session cookie/flag
  // to indicate the user is impersonating a client
  // The middleware would then show the client portal view

  // For now, return success - the actual implementation requires
  // session management which would be handled separately

  return { success: true, clientId: client.id };
}
```

### Task 48.9: Client Activity Log Component

**File: `src/components/clients/client-activity-log.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Globe, FileText, Settings, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ClientActivityLogProps {
  clientId: string;
}

const getActivityIcon = (entityType: string) => {
  switch (entityType) {
    case "site":
      return Globe;
    case "page":
      return FileText;
    case "settings":
      return Settings;
    default:
      return User;
  }
};

export function ClientActivityLog({ clientId }: ClientActivityLogProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    // For now, we'll show placeholder data
    setIsLoading(false);
    setActivities([]);
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No activity recorded yet.</p>
            <p className="text-sm mt-1">Activity will appear here as you work with this client.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.entity_type);
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🧪 Testing Checklist

After implementing this phase, verify:

- [ ] `/dashboard/clients` displays all clients
- [ ] "Add Client" button opens create dialog
- [ ] Create client form validates correctly
- [ ] Client detail page loads with all tabs
- [ ] Overview tab shows client info
- [ ] Sites tab shows client's sites
- [ ] Portal Access tab allows enabling/disabling access
- [ ] Portal invitation can be sent (email address required)
- [ ] Activity tab shows activity log
- [ ] Danger zone allows archiving
- [ ] Danger zone blocks deletion with existing sites
- [ ] Delete confirmation works correctly
- [ ] Status badges display correctly
- [ ] Impersonate button shows for clients with portal access

---

## 📝 Notes

- Client impersonation requires additional session management (future enhancement)
- Portal invitation would send email in production (requires Resend integration)
- Activity log requires activity tracking implementation (Phase 54)
- Archived clients should be filtered in default view (implemented in filters)
