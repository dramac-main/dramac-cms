# Phase 85: Client Portal Enhancement

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 IMPORTANT
>
> **Estimated Time**: 10-12 hours

---

## 🎯 Objective

ENHANCE the existing client portal with:
1. **Full authentication** - Supabase Auth for client users
2. **Expanded features** - Analytics, support tickets
3. **Permissions** - Granular access controls
4. **Better UX** - Professional portal experience

---

## 📋 Prerequisites

- [ ] Authentication working
- [ ] Client management complete
- [ ] Site management complete
- [ ] `has_portal_access` column in clients table

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ `/portal/` route exists with layout and pages
- ✅ `src/app/portal/layout.tsx` - Portal layout
- ✅ `src/app/portal/page.tsx` - Portal dashboard (cookie-based "impersonation")
- ✅ `src/app/portal/sites/` - Site listing for portal
- ✅ `src/app/portal/support/` - Basic support page
- ✅ `clients` table has `portal_user_id` column
- ✅ `clients` table has `has_portal_access` boolean

**What's Missing:**
- Real Supabase Auth for clients (not cookie impersonation)
- Portal-specific login page
- Support ticket system
- Client notifications
- Proper permission enforcement
- Billing/invoice viewing

---

## ⚠️ IMPORTANT: USE EXISTING PORTAL ROUTES

The `/portal/` route already exists! We will:
1. ✅ **ENHANCE** existing portal pages - don't recreate
2. ✅ **ADD** authentication using Supabase Auth
3. ✅ **LINK** client users via `clients.portal_user_id` → `auth.users.id`
4. ✅ **ADD** new features (tickets, notifications)

**DO NOT:**
- ❌ Create separate `/client-portal/` route (use existing `/portal/`)
- ❌ Use bcryptjs for passwords (use Supabase Auth)
- ❌ Create separate `client_users` table (use `auth.users` + `clients`)

---

## 💼 Business Value

1. **Client Experience** - Self-service reduces support
2. **Agency Efficiency** - Fewer client emails
3. **Transparency** - Clients see what they pay for
4. **Professional** - Competitors have client portals
5. **Upsell** - Show clients available modules

---

## 📁 Files to Modify/Create

```
src/app/portal/
├── layout.tsx              # MODIFY - Add Supabase Auth check
├── page.tsx                # MODIFY - Use real auth, not impersonation
├── login/page.tsx          # CREATE - Portal login page
├── sites/
│   └── page.tsx            # MODIFY - Filter by authenticated client
├── analytics/page.tsx      # CREATE - Performance overview
├── support/
│   ├── page.tsx            # MODIFY - Real ticket system
│   └── [ticketId]/page.tsx # CREATE - Ticket detail
├── settings/page.tsx       # CREATE - Client settings

src/lib/portal/
├── portal-auth.ts          # CREATE - Supabase Auth helpers for portal
├── portal-service.ts       # CREATE - Portal data access
├── support-service.ts      # CREATE - Support ticket CRUD

Database:
├── support_tickets         # CREATE - Support requests
├── ticket_messages         # CREATE - Ticket conversation
├── client_notifications    # CREATE - Portal notifications
├── client_permissions      # CREATE - Granular permissions
```

---

## ✅ Tasks

### Task 85.0: Update Auth Schema (USE Supabase Auth!)

**File: `migrations/client-portal-auth.sql`**

```sql
-- IMPORTANT: We use Supabase Auth for client users
-- The clients.portal_user_id links to auth.users.id

-- Add permissions columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS can_edit_content BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS can_view_invoices BOOLEAN DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_last_login TIMESTAMPTZ;

-- Client permissions table (for more granular control per site)
CREATE TABLE IF NOT EXISTS client_site_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  can_view BOOLEAN DEFAULT TRUE,
  can_edit_content BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT TRUE,
  can_publish BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_id, site_id)
);

CREATE INDEX idx_client_site_permissions ON client_site_permissions(client_id, site_id);
```

---

### Task 85.1: Database Schema for Support & Notifications

**File: `migrations/client-portal-tables.sql`**

```sql
-- Support tickets (linked to client via clients table)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE, -- SUP-0001
  
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id),
  assigned_to UUID REFERENCES profiles(id),
  
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- general, bug, feature, billing
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Ticket messages (conversation thread)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  
  sender_type TEXT NOT NULL, -- 'client' or 'agent'
  sender_id UUID NOT NULL, -- client_id or profile_id
  sender_name TEXT NOT NULL,
  
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- [{url, name, type}]
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client notifications
CREATE TABLE IF NOT EXISTS client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- ticket_update, site_published, invoice
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'SUP-' || LPAD(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS INTEGER)), 0) + 1 
     FROM support_tickets)::TEXT, 
    5, '0'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number
BEFORE INSERT ON support_tickets
FOR EACH ROW
WHEN (NEW.ticket_number IS NULL)
EXECUTE FUNCTION generate_ticket_number();

-- Indexes
CREATE INDEX idx_support_tickets_client ON support_tickets(client_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_client_notifications_client ON client_notifications(client_id);
CREATE INDEX idx_client_notifications_unread ON client_notifications(client_id, is_read);
```

---

### Task 85.2: Portal Authentication (Supabase Auth!)

**File: `src/lib/portal/portal-auth.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface PortalUser {
  userId: string;         // auth.users.id
  clientId: string;       // clients.id
  email: string;
  fullName: string;
  companyName: string;
  agencyId: string;
  canViewAnalytics: boolean;
  canEditContent: boolean;
  canViewInvoices: boolean;
}

/**
 * Get current portal user from Supabase Auth session
 * Links auth.users to clients via portal_user_id
 */
export async function getPortalUser(): Promise<PortalUser | null> {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Find client linked to this user
  const { data: client, error } = await supabase
    .from("clients")
    .select(`
      id,
      name,
      email,
      company,
      agency_id,
      has_portal_access,
      can_view_analytics,
      can_edit_content,
      can_view_invoices
    `)
    .eq("portal_user_id", user.id)
    .eq("has_portal_access", true)
    .single();

  if (error || !client) {
    // User exists but isn't a portal client
    return null;
  }

  // Update last login
  await supabase
    .from("clients")
    .update({ portal_last_login: new Date().toISOString() })
    .eq("id", client.id);

  return {
    userId: user.id,
    clientId: client.id,
    email: client.email,
    fullName: client.name,
    companyName: client.company || "",
    agencyId: client.agency_id,
    canViewAnalytics: client.can_view_analytics ?? true,
    canEditContent: client.can_edit_content ?? false,
    canViewInvoices: client.can_view_invoices ?? true,
  };
}

/**
 * Require portal authentication - redirect to login if not authenticated
 */
export async function requirePortalAuth(): Promise<PortalUser> {
  const user = await getPortalUser();
  if (!user) {
    redirect("/portal/login");
  }
  return user;
}

/**
 * Create a portal user account for a client
 * Called when agency enables portal access
 */
export async function createPortalAccount(
  clientId: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "portal_client",
      client_id: clientId,
    },
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || "Failed to create account" };
  }

  // Link to client
  const { error: updateError } = await supabase
    .from("clients")
    .update({
      portal_user_id: authData.user.id,
      has_portal_access: true,
    })
    .eq("id", clientId);

  if (updateError) {
    // Rollback auth user
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: "Failed to link account" };
  }

  return { success: true };
}

/**
 * Sign in to portal
 */
export async function portalSignIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: "Invalid email or password" };
  }

  // Verify this user is a portal client
  const portalUser = await getPortalUser();
  if (!portalUser) {
    await supabase.auth.signOut();
    return { success: false, error: "Portal access not enabled" };
  }

  return { success: true };
}

/**
 * Sign out of portal
 */
export async function portalSignOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}

/**
 * Check if email has portal access
 */
export async function checkPortalAccess(email: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("email", email)
    .eq("has_portal_access", true)
    .single();

  return !!data;
}
```

---

### Task 85.3: Portal Service

**File: `src/lib/portal/portal-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export interface PortalSite {
  id: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
  isPublished: boolean;
  thumbnailUrl: string | null;
  lastUpdatedAt: string;
  pageCount: number;
}

export interface PortalAnalytics {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  avgSessionDuration: number;
  topPages: { page: string; views: number }[];
}

export async function getClientSites(clientId: string): Promise<PortalSite[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select(`
      id, name, subdomain, custom_domain, is_published, 
      thumbnail_url, updated_at,
      pages:pages(count)
    `)
    .eq("client_id", clientId)
    .order("name");

  if (error || !data) {
    return [];
  }

  return data.map((site) => ({
    id: site.id,
    name: site.name,
    subdomain: site.subdomain,
    customDomain: site.custom_domain,
    isPublished: site.is_published,
    thumbnailUrl: site.thumbnail_url,
    lastUpdatedAt: site.updated_at,
    pageCount: site.pages?.[0]?.count || 0,
  }));
}

export async function getClientSite(
  clientId: string,
  siteId: string
): Promise<PortalSite | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select(`
      id, name, subdomain, custom_domain, is_published, 
      thumbnail_url, updated_at,
      pages:pages(count)
    `)
    .eq("id", siteId)
    .eq("client_id", clientId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    subdomain: data.subdomain,
    customDomain: data.custom_domain,
    isPublished: data.is_published,
    thumbnailUrl: data.thumbnail_url,
    lastUpdatedAt: data.updated_at,
    pageCount: data.pages?.[0]?.count || 0,
  };
}

export async function getPortalAnalytics(clientId: string): Promise<PortalAnalytics> {
  // In production, integrate with actual analytics provider
  // For now, return mock data
  return {
    totalVisits: Math.floor(Math.random() * 10000) + 1000,
    uniqueVisitors: Math.floor(Math.random() * 5000) + 500,
    pageViews: Math.floor(Math.random() * 20000) + 2000,
    avgSessionDuration: Math.floor(Math.random() * 300) + 60,
    topPages: [
      { page: "/", views: Math.floor(Math.random() * 2000) + 500 },
      { page: "/about", views: Math.floor(Math.random() * 1000) + 200 },
      { page: "/contact", views: Math.floor(Math.random() * 500) + 100 },
      { page: "/services", views: Math.floor(Math.random() * 800) + 150 },
      { page: "/blog", views: Math.floor(Math.random() * 600) + 100 },
    ],
  };
}

export async function getClientInfo(clientId: string): Promise<{
  name: string;
  companyName: string | null;
  agencyName: string;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select(`
      name,
      company_name,
      agency:agencies(name)
    `)
    .eq("id", clientId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    name: data.name,
    companyName: data.company_name,
    agencyName: (data.agency as { name: string })?.name || "Agency",
  };
}
```

---

### Task 85.4: Support Service

**File: `src/lib/portal/support-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  siteName: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  messageCount: number;
}

export interface TicketMessage {
  id: string;
  senderType: "client" | "agent";
  senderName: string;
  message: string;
  attachments: { url: string; name: string; type: string }[];
  createdAt: string;
}

export async function getClientTickets(clientId: string): Promise<SupportTicket[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("support_tickets")
    .select(`
      *,
      site:sites(name),
      messages:ticket_messages(count)
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((t) => ({
    id: t.id,
    ticketNumber: t.ticket_number,
    subject: t.subject,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    siteName: (t.site as { name: string })?.name || null,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    resolvedAt: t.resolved_at,
    messageCount: t.messages?.[0]?.count || 0,
  }));
}

export async function getTicket(
  ticketId: string,
  clientId: string
): Promise<{ ticket: SupportTicket; messages: TicketMessage[] } | null> {
  const supabase = await createClient();

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select(`
      *,
      site:sites(name)
    `)
    .eq("id", ticketId)
    .eq("client_id", clientId)
    .single();

  if (error || !ticket) {
    return null;
  }

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at");

  return {
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      siteName: (ticket.site as { name: string })?.name || null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      resolvedAt: ticket.resolved_at,
      messageCount: messages?.length || 0,
    },
    messages: (messages || []).map((m) => ({
      id: m.id,
      senderType: m.sender_type,
      senderName: m.sender_name,
      message: m.message,
      attachments: m.attachments || [],
      createdAt: m.created_at,
    })),
  };
}

export async function createTicket(
  clientId: string,
  clientUserId: string,
  ticket: {
    subject: string;
    description: string;
    category?: string;
    priority?: string;
    siteId?: string;
  }
): Promise<{ success: boolean; ticketId?: string; ticketNumber?: string; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      client_id: clientId,
      client_user_id: clientUserId,
      site_id: ticket.siteId || null,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category || "general",
      priority: ticket.priority || "normal",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Failed to create ticket" };
  }

  return {
    success: true,
    ticketId: data.id,
    ticketNumber: data.ticket_number,
  };
}

export async function addTicketMessage(
  ticketId: string,
  clientId: string,
  clientUserId: string,
  message: string,
  senderName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify ticket belongs to client
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("id", ticketId)
    .eq("client_id", clientId)
    .single();

  if (!ticket) {
    return { success: false, error: "Ticket not found" };
  }

  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_type: "client",
    sender_id: clientUserId,
    sender_name: senderName,
    message,
  });

  if (error) {
    return { success: false, error: "Failed to send message" };
  }

  // Update ticket timestamp
  await supabase
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  return { success: true };
}
```

---

### Task 85.5: Portal Layout

**File: `src/app/(client-portal)/portal/layout.tsx`**

```tsx
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { getClientInfo } from "@/lib/portal/portal-service";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalSidebar } from "@/components/portal/portal-sidebar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePortalAuth();
  const clientInfo = await getClientInfo(user.clientId);

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader user={user} agencyName={clientInfo?.agencyName || "Agency"} />
      
      <div className="flex">
        <PortalSidebar user={user} />
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

---

### Task 85.6: Portal Header

**File: `src/components/portal/portal-header.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { portalLogout, type ClientUser } from "@/lib/portal/portal-auth";

interface PortalHeaderProps {
  user: ClientUser;
  agencyName: string;
}

export function PortalHeader({ user, agencyName }: PortalHeaderProps) {
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await portalLogout();
  };

  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/portal" className="font-bold text-xl">
          {agencyName}
        </Link>
        <span className="text-sm text-muted-foreground">Client Portal</span>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/portal/notifications">
            <Bell className="h-5 w-5" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline">{user.fullName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/portal/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

---

### Task 85.7: Portal Sidebar

**File: `src/components/portal/portal-sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  BarChart3,
  MessageCircle,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ClientUser } from "@/lib/portal/portal-auth";

interface PortalSidebarProps {
  user: ClientUser;
}

export function PortalSidebar({ user }: PortalSidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      href: "/portal",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/portal/sites",
      label: "My Sites",
      icon: Globe,
    },
    ...(user.canViewAnalytics
      ? [
          {
            href: "/portal/analytics",
            label: "Analytics",
            icon: BarChart3,
          },
        ]
      : []),
    {
      href: "/portal/support",
      label: "Support",
      icon: MessageCircle,
    },
    ...(user.canViewInvoices
      ? [
          {
            href: "/portal/invoices",
            label: "Invoices",
            icon: FileText,
          },
        ]
      : []),
    {
      href: "/portal/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 border-r bg-white min-h-[calc(100vh-64px)] p-4">
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

---

### Task 85.8: Portal Dashboard

**File: `src/app/(client-portal)/portal/page.tsx`**

```tsx
import Link from "next/link";
import { Globe, MessageCircle, ArrowRight, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientSites, getPortalAnalytics, getClientInfo } from "@/lib/portal/portal-service";
import { getClientTickets } from "@/lib/portal/support-service";

export default async function PortalDashboard() {
  const user = await requirePortalAuth();
  const [clientInfo, sites, analytics, tickets] = await Promise.all([
    getClientInfo(user.clientId),
    getClientSites(user.clientId),
    user.canViewAnalytics ? getPortalAnalytics(user.clientId) : null,
    getClientTickets(user.clientId),
  ]);

  const openTickets = tickets.filter((t) => t.status !== "closed").length;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user.fullName.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your sites with {clientInfo?.agencyName}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Globe className="h-10 w-10 text-primary" />
              <div>
                <p className="text-3xl font-bold">{sites.length}</p>
                <p className="text-muted-foreground">Active Sites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {analytics && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <BarChart3 className="h-10 w-10 text-green-600" />
                <div>
                  <p className="text-3xl font-bold">
                    {analytics.totalVisits.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">Total Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <MessageCircle className="h-10 w-10 text-orange-600" />
              <div>
                <p className="text-3xl font-bold">{openTickets}</p>
                <p className="text-muted-foreground">Open Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sites */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Sites</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/portal/sites">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.slice(0, 4).map((site) => (
              <Link
                key={site.id}
                href={`/portal/sites/${site.id}`}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                  {site.thumbnailUrl ? (
                    <img
                      src={site.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <Globe className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{site.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {site.customDomain || `${site.subdomain}.dramac.app`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {site.pageCount} pages • {site.isPublished ? "Live" : "Draft"}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {sites.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No sites yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      {tickets.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Support Tickets</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/support">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.slice(0, 3).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.ticketNumber} • {ticket.category}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      ticket.status === "open"
                        ? "bg-yellow-100 text-yellow-800"
                        : ticket.status === "resolved"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### Task 85.9: Portal Login Page

**File: `src/app/(client-portal)/portal/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { sendMagicLink, loginWithPassword } from "@/lib/portal/portal-auth";

export default function PortalLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const result = await sendMagicLink(email);
    setLoading(false);

    if (result.success) {
      setMagicLinkSent(true);
    } else {
      toast.error(result.error || "Failed to send login link");
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const result = await loginWithPassword(email, password);
    setLoading(false);

    if (result.success) {
      router.push("/portal");
    } else {
      toast.error(result.error || "Login failed");
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <Mail className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Check your email</h2>
            <p className="text-muted-foreground mb-4">
              We sent a login link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to access your portal.
              The link expires in 15 minutes.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setMagicLinkSent(false)}
            >
              Try different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Client Portal</CardTitle>
          <CardDescription>
            Sign in to access your sites and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="magic-link">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="magic-link">
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Mail className="h-4 w-4 mr-2" />
                  Send Login Link
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="password">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 85.10: Magic Link Verification

**File: `src/app/(client-portal)/portal/verify/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { verifyMagicLink } from "@/lib/portal/portal-auth";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Invalid link");
      return;
    }

    verifyMagicLink(token).then((result) => {
      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          router.push("/portal");
        }, 1500);
      } else {
        setStatus("error");
        setError(result.error || "Verification failed");
      }
    });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          {status === "verifying" && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
              <h2 className="text-xl font-bold">Verifying...</h2>
              <p className="text-muted-foreground mt-2">
                Please wait while we log you in
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-xl font-bold">Success!</h2>
              <p className="text-muted-foreground mt-2">
                Redirecting to your portal...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
              <h2 className="text-xl font-bold">Verification Failed</h2>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button className="mt-4" onClick={() => router.push("/portal/login")}>
                Back to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Magic link generation/verification
- [ ] Session cookie handling
- [ ] Permission checks

### Integration Tests
- [ ] Client user creation
- [ ] Login flow (magic link)
- [ ] Login flow (password)
- [ ] Support ticket creation

### E2E Tests
- [ ] Full login journey
- [ ] View sites list
- [ ] Submit support ticket
- [ ] View analytics (if permitted)

---

## ✅ Completion Checklist

- [ ] Database schema for client portal
- [ ] Portal authentication (magic link + password)
- [ ] Portal layout and navigation
- [ ] Portal dashboard
- [ ] Sites listing
- [ ] Site detail view
- [ ] Support tickets system
- [ ] Login page
- [ ] Magic link verification
- [ ] Permission-based features
- [ ] bcryptjs installed

---

**Summary**: Phase 85 completes the Client Portal, giving agency clients self-service access to their sites, analytics, and support - reducing agency workload and improving client experience.
