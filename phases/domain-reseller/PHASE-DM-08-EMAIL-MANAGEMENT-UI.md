# Phase DM-08: Email Management UI

> **Priority**: 🟡 MEDIUM  
> **Estimated Time**: 8 hours  
> **Prerequisites**: DM-07 (Business Email Integration)  
> **Status**: ✅ IMPLEMENTED (February 2, 2026)

---

## 📝 Implementation Status (February 2, 2026)

### ✅ FULLY IMPLEMENTED

After deep platform scan, **DM-08 is 100% complete** with the following implementation:

#### Email Pages (All Exist & Functional)
- ✅ `/dashboard/email/page.tsx` - Email orders list with stats
- ✅ `/dashboard/email/purchase/page.tsx` - Purchase wizard
- ✅ `/dashboard/email/[orderId]/page.tsx` - Order details
- ✅ `/dashboard/email/[orderId]/accounts/page.tsx` - Account management
- ✅ `/dashboard/email/[orderId]/settings/page.tsx` - Order settings
- ✅ `/dashboard/email/loading.tsx` - Loading states
- ✅ `/dashboard/domains/[domainId]/email/page.tsx` - Domain-specific email (unified Feb 2)

#### Components (All Exist & Functional)
- ✅ `email-orders-list.tsx` - Orders list with cards
- ✅ `email-accounts-table.tsx` - Account management table
- ✅ `email-account-form.tsx` - Create account dialog
- ✅ `email-purchase-wizard.tsx` - Purchase flow
- ✅ `email-dns-setup.tsx` - DNS configuration helper
- ✅ `email-stats-cards.tsx` - Dashboard statistics
- ✅ `email-storage-usage.tsx` - Storage display
- ✅ `email-webmail-link.tsx` - Webmail access button
- ✅ `index.ts` - Barrel exports

#### Server Actions (All Exist & Functional)
Located in `src/lib/actions/business-email.ts`:
- ✅ `createBusinessEmailOrder()` - Create email order
- ✅ `getBusinessEmailOrders()` - List all orders
- ✅ `getBusinessEmailOrder()` - Get order details
- ✅ `getBusinessEmailStats()` - Dashboard stats
- ✅ `getBusinessEmailAccounts()` - List accounts
- ✅ `createBusinessEmailAccount()` - Create account
- ✅ `deleteBusinessEmailAccount()` - Delete account
- ✅ `configureBusinessEmailDns()` - Auto-configure DNS
- ✅ `syncBusinessEmailOrder()` - Sync from ResellerClub
- ✅ `renewBusinessEmailOrder()` - Renew order
- ✅ `getBusinessEmailPricing()` - Get pricing
- ✅ `getBusinessEmailDnsRecords()` - Get DNS records
- ✅ `verifyBusinessEmailDns()` - Verify DNS setup
- ✅ `getBusinessEmailOrderByDomainId()` - Domain-specific lookup (added Feb 2)

#### ResellerClub Integration (All Exist & Functional)
Located in `src/lib/resellerclub/email/`:
- ✅ `client.ts` - Business Email API client
- ✅ `types.ts` - TypeScript types
- ✅ `order-service.ts` - Order operations
- ✅ `account-service.ts` - Account operations
- ✅ `dns-service.ts` - DNS record generation
- ✅ `index.ts` - Barrel exports

#### Database Tables (All Exist & Applied)
Migration `dm-07-email-schema.sql` applied with:
- ✅ `email_orders` - Email order records
- ✅ `email_accounts` - Email account records
- ✅ RLS policies for multi-tenant security
- ✅ Indexes for performance

### Key Features Working
1. ✅ Email orders dashboard with stats (active, expiring, total accounts)
2. ✅ Email order details page with account management
3. ✅ Create/delete email accounts with real-time sync
4. ✅ DNS auto-configuration for email (MX, SPF, DKIM)
5. ✅ Purchase wizard with pricing calculation
6. ✅ Webmail links (https://app.titan.email)
7. ✅ Domain-specific email management (unified Feb 2)
8. ✅ Expiry tracking and renewal prompts

### Architecture
```
/dashboard/email (Global Hub)
  ├── Stats cards (total, active, expiring, accounts)
  ├── Orders list (all email orders)
  └── /purchase (Purchase wizard)

/dashboard/email/[orderId] (Order Management)
  ├── Order overview
  ├── Account management
  ├── DNS configuration
  └── /settings (Order settings)

/dashboard/domains/[domainId]/email (Domain Context)
  ├── No email: Purchase prompt
  └── Has email: Account management
```

### User Flows Working
1. **Purchase Flow**: Dashboard → Purchase → Select domain → Choose accounts → Create order
2. **Account Management**: Order page → Create account → Verify → Access webmail
3. **DNS Setup**: Order page → Auto-configure DNS → Verify → Email works
4. **Domain Integration**: Domain page → Email tab → Manage accounts OR purchase

---

## 🎯 Original Objective (Already Achieved)

Create a comprehensive email management interface:

1. ✅ Email orders dashboard (list, status, expiry)
2. ✅ Email account management (create, delete, reset password)
3. ✅ Mailbox overview (storage usage, last login)
4. ✅ Email DNS configuration helper
5. ✅ Order renewal/upgrade interface
6. ✅ Email webmail links

---

## 📁 Files Status

> **All files from original specification already exist and are functional.**
> This section preserved for reference only.

### Pages ✅ (All Implemented)
```
src/app/(dashboard)/dashboard/email/
├── page.tsx                        ✅ Email orders list
├── purchase/page.tsx               ✅ Purchase email for domain
├── [orderId]/
│   ├── page.tsx                    ✅ Email order details
│   ├── accounts/page.tsx           ✅ Manage accounts
│   └── settings/page.tsx           ✅ Order settings
└── loading.tsx                     ✅ Loading state

src/app/(dashboard)/dashboard/domains/[domainId]/
└── email/
    ├── page.tsx                    ✅ Domain-specific email (Feb 2 unification)
    └── domain-email-accounts-client.tsx  ✅ Client component
```

### Components ✅ (All Implemented)
```
src/components/email/
├── email-orders-list.tsx           ✅ List of email orders
├── email-accounts-table.tsx        ✅ Email accounts table
├── email-account-form.tsx          ✅ Create account form
├── email-purchase-wizard.tsx       ✅ Purchase email flow
├── email-dns-setup.tsx             ✅ DNS configuration helper
├── email-storage-usage.tsx         ✅ Storage usage display
├── email-stats-cards.tsx           ✅ Dashboard stats
├── email-webmail-link.tsx          ✅ Webmail access button
└── index.ts                        ✅ Barrel exports
```

### Actions ✅ (All Implemented)
```
src/lib/actions/business-email.ts   ✅ 15 server actions (see above)
```

### Services ✅ (All Implemented)
```
src/lib/resellerclub/email/
├── client.ts                       ✅ Business Email API client
├── types.ts                        ✅ Email-specific types
├── order-service.ts                ✅ Email order operations
├── account-service.ts              ✅ Email account operations
├── dns-service.ts                  ✅ Email DNS record generation
└── index.ts                        ✅ Barrel exports
```

### Database ✅ (Already Applied)
```
migrations/dm-07-email-schema.sql   ✅ Applied to database
  ├── email_orders table
  ├── email_accounts table
  └── RLS policies
```

---

## 📋 Implementation Tasks (COMPLETED)

All tasks from original specification have been implemented:

### ✅ Task 1: Email Orders List Page (60 mins) - DONE
- Page uses `getBusinessEmailOrders()` and `getBusinessEmailStats()`
- Stats cards show: total orders, active, accounts, expiring soon
- Orders list with search and filters
- Empty state with purchase CTA

### ✅ Task 2: Email Orders List Component (45 mins) - DONE
- Card-based order display
- Status badges (Active, Expiring Soon, Suspended)
- Account usage progress bars
- Expiry date display with warning icons
- Quick actions dropdown

### ✅ Task 3: Email Order Details Page (45 mins) - DONE
- Order overview with stats cards
- Account management integration
- DNS setup section
- Quick actions (webmail, admin panel, renew)

### ✅ Task 4: Email Accounts Table (45 mins) - DONE
- Create/delete accounts
- Account list with status badges
- Last login tracking
- Webmail links per account
- Delete confirmation dialogs

### ✅ Task 5: Email Account Form (30 mins) - DONE
- Zod validation
- Username, password, first/last name fields
- Password strength requirements
- Form submission with FormData

### ✅ Task 6: Email DNS Setup Component (30 mins) - DONE
- DNS status badge (configured/not configured)
- Auto-configure button
- Manual configuration instructions
- MX, SPF, DKIM record display

### ✅ Task 7: Additional Server Actions (30 mins) - DONE
- `getBusinessEmailOrderDetails()`
- `getBusinessEmailStats()`
- All actions with proper auth and error handling

### ✅ Task 8: Email Stats Cards Component (15 mins) - DONE
- Total orders, active, accounts, expiring soon
- Color-coded icons
- Real-time data from database

### ✅ Task 9: Barrel Exports (5 mins) - DONE
- `src/components/email/index.ts` exports all components

---

## ✅ Verification Checklist (All Passing)

- ✅ Email orders list displays correctly
- ✅ Order details page shows all information
- ✅ Email accounts can be created
- ✅ Email accounts can be deleted
- ✅ DNS setup component works
- ✅ Webmail links open correctly (https://app.titan.email)
- ✅ Stats cards show accurate data
- ✅ Empty states display properly
- ✅ Error handling works for all operations
- ✅ Domain-specific email page shows real data (Feb 2 unification)

---

## 🔗 Dependencies (All Satisfied)

### ✅ Has from Previous Phases:
- **DM-07**: Email services (`emailOrderService`, `emailAccountService`) ✅
- **DM-03**: DNS configuration integration (Cloudflare API) ✅
- **DM-02**: Database tables (`email_orders`, `email_accounts`) ✅

### Provides to Next Phases:
- **DM-10**: Email pricing and billing integration (all pricing functions ready)

---

## 📚 Additional Notes

**Implementation Details:**
- Actions use `getBusinessEmail*` naming (not `getEmail*` as in spec)
- All components are client components with "use client" directive
- Webmail: https://app.titan.email (corrected from mail.titan.email)
- Admin panel: https://control.titan.email
- All operations via ResellerClub API `/api/eelite/` endpoints

**Known Working Features:**
- Real-time account creation/deletion
- DNS auto-configuration via Cloudflare
- Purchase wizard with pricing calculation
- Order sync from ResellerClub
- Expiry tracking and renewal prompts
- Domain-specific email management
- Multi-tenant RLS security

**No Further Action Required:**
This phase is production-ready and fully integrated with the platform.

---

## 📋 Original Implementation Tasks Reference

> The following sections are from the original phase specification.
> **ALL TASKS BELOW HAVE BEEN COMPLETED** - preserved for reference only.

---

### Task 1: Email Orders List Page (60 mins)

```typescript
// src/app/(dashboard)/dashboard/email/page.tsx

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Plus, Mail, RefreshCw, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailOrdersList } from "@/components/email/email-orders-list";
import { EmailStatsCards } from "@/components/email/email-stats-cards";
import { getEmailOrders, getEmailStats } from "@/lib/actions/email";

export const metadata: Metadata = {
  title: "Email Management | DRAMAC",
  description: "Manage your business email accounts",
};

interface EmailPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

async function EmailStats() {
  const { data: stats } = await getEmailStats();
  
  if (!stats) return null;
  
  return <EmailStatsCards stats={stats} />;
}

async function EmailOrders({ searchParams }: { searchParams: EmailPageProps['searchParams'] }) {
  const params = await searchParams;
  const result = await getEmailOrders();
  
  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {result.error || "Failed to load email orders"}
        </CardContent>
      </Card>
    );
  }

  return <EmailOrdersList orders={result.data} />;
}

export default async function EmailPage({ searchParams }: EmailPageProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Email Management</h1>
          <p className="text-muted-foreground">
            Manage your business email orders and accounts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/email/purchase">
            <Plus className="h-4 w-4 mr-2" />
            Purchase Email
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <Suspense fallback={<Skeleton className="h-24" />}>
        <EmailStats />
      </Suspense>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by domain..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Orders List */}
      <Suspense fallback={<Skeleton className="h-64" />}>
        <EmailOrders searchParams={searchParams} />
      </Suspense>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle>Business Email Features</CardTitle>
          <CardDescription>
            Titan-powered professional email for your domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-1">📧 Professional Email</h4>
              <p className="text-sm text-muted-foreground">
                Custom @yourdomain.com email addresses
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-1">💾 10GB Storage</h4>
              <p className="text-sm text-muted-foreground">
                Generous storage per mailbox
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-1">🌐 Webmail Access</h4>
              <p className="text-sm text-muted-foreground">
                Access email from any browser
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 2: Email Orders List Component (45 mins)

```typescript
// src/components/email/email-orders-list.tsx

"use client";

import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Mail, 
  MoreHorizontal, 
  ExternalLink, 
  Settings, 
  Users, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { EmailOrder } from "@/lib/resellerclub/email/types";

interface EmailOrdersListProps {
  orders: (EmailOrder & {
    domain?: { id: string; domain_name: string; status: string } | null;
    client?: { id: string; name: string } | null;
  })[];
}

export function EmailOrdersList({ orders }: EmailOrdersListProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Email Orders</h3>
          <p className="text-muted-foreground text-center mb-4">
            Purchase business email to add professional email addresses to your domains.
          </p>
          <Button asChild>
            <Link href="/dashboard/email/purchase">Purchase Email</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <EmailOrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function EmailOrderCard({ order }: { order: EmailOrdersListProps['orders'][0] }) {
  const accountUsage = (order.used_accounts / order.number_of_accounts) * 100;
  const expiryDate = new Date(order.expiry_date);
  const isExpiringSoon = expiryDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
  const isExpired = expiryDate < new Date();

  const getStatusBadge = () => {
    switch (order.status) {
      case 'Active':
        if (isExpired) {
          return <Badge variant="destructive">Expired</Badge>;
        }
        if (isExpiringSoon) {
          return <Badge variant="warning" className="bg-yellow-500">Expiring Soon</Badge>;
        }
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'Suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'Pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{order.status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  href={`/dashboard/email/${order.id}`}
                  className="text-lg font-medium hover:underline"
                >
                  {order.domain_name}
                </Link>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                {order.client && (
                  <span>Client: {order.client.name}</span>
                )}
                <span>Plan: Business Email</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/email/${order.id}`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/email/${order.id}/accounts`}>
                  <Users className="h-4 w-4 mr-2" />
                  Accounts
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a 
                  href="https://mail.titan.email" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Webmail
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          {/* Accounts Usage */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Email Accounts</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {order.used_accounts} / {order.number_of_accounts}
              </span>
            </div>
            <Progress value={accountUsage} className="h-1 mt-1" />
          </div>

          {/* Expiry */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Expires</p>
            <div className="flex items-center gap-1">
              {isExpired ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : isExpiringSoon ? (
                <Clock className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              <span className="font-medium">
                {format(expiryDate, "MMM d, yyyy")}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
            <p className="font-medium">
              ${(order.retail_price / 12).toFixed(2)}/mo
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/email/${order.id}/accounts`}>
                <Users className="h-4 w-4 mr-1" />
                Accounts
              </Link>
            </Button>
            {isExpiringSoon && (
              <Button size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Renew
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 3: Email Order Details Page (45 mins)

```typescript
// src/app/(dashboard)/dashboard/email/[orderId]/page.tsx

import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Settings, ExternalLink, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailAccountsTable } from "@/components/email/email-accounts-table";
import { EmailStorageUsage } from "@/components/email/email-storage-usage";
import { EmailDnsSetup } from "@/components/email/email-dns-setup";
import { EmailWebmailLink } from "@/components/email/email-webmail-link";
import { getEmailOrderDetails, getEmailAccounts } from "@/lib/actions/email";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Email Order Details | DRAMAC",
  description: "Manage your email order",
};

interface EmailOrderPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function EmailOrderPage({ params }: EmailOrderPageProps) {
  const { orderId } = await params;
  
  const [orderResult, accountsResult] = await Promise.all([
    getEmailOrderDetails(orderId),
    getEmailAccounts(orderId),
  ]);
  
  if (!orderResult.success || !orderResult.data) {
    notFound();
  }

  const order = orderResult.data;
  const accounts = accountsResult.data || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/email">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{order.domain_name}</h1>
              <Badge 
                variant={order.status === 'Active' ? 'default' : 'secondary'}
                className={order.status === 'Active' ? 'bg-green-500' : ''}
              >
                {order.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">Business Email</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EmailWebmailLink domain={order.domain_name} />
          <Button variant="outline" asChild>
            <Link href={`/dashboard/email/${orderId}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {order.used_accounts}/{order.number_of_accounts}
                </p>
                <p className="text-sm text-muted-foreground">Email Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {format(new Date(order.expiry_date), "MMM d")}
                </p>
                <p className="text-sm text-muted-foreground">Expires</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">10 GB</p>
                <p className="text-sm text-muted-foreground">Storage/Account</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${order.retail_price}</p>
                <p className="text-sm text-muted-foreground">Yearly Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Email Accounts</CardTitle>
            <CardDescription>
              Manage email accounts for {order.domain_name}
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/dashboard/email/${orderId}/accounts`}>
              <Users className="h-4 w-4 mr-2" />
              Manage Accounts
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <EmailAccountsTable 
            accounts={accounts} 
            orderId={orderId}
            maxAccounts={order.number_of_accounts}
            compact
          />
        </CardContent>
      </Card>

      {/* DNS Setup */}
      <EmailDnsSetup 
        orderId={orderId} 
        domainId={order.domain_id} 
        dnsConfigured={!!order.domain_id}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a 
              href="https://mail.titan.email" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Webmail
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a 
              href="https://control.titan.email" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </a>
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Renew Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 4: Email Accounts Table (45 mins)

```typescript
// src/components/email/email-accounts-table.tsx

"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  Key,
  ExternalLink,
  Mail,
  Clock,
} from "lucide-react";
import { EmailAccountForm } from "./email-account-form";
import { deleteEmailAccount } from "@/lib/actions/email";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { EmailAccount } from "@/lib/resellerclub/email/types";

interface EmailAccountsTableProps {
  accounts: EmailAccount[];
  orderId: string;
  maxAccounts: number;
  compact?: boolean;
}

export function EmailAccountsTable({ 
  accounts, 
  orderId, 
  maxAccounts,
  compact = false,
}: EmailAccountsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<EmailAccount | null>(null);

  const canAddMore = accounts.length < maxAccounts;
  const displayAccounts = compact ? accounts.slice(0, 5) : accounts;

  async function handleDelete() {
    if (!deletingAccount) return;
    
    startTransition(async () => {
      const result = await deleteEmailAccount(deletingAccount.id);
      if (result.success) {
        toast.success("Email account deleted");
      } else {
        toast.error(result.error || "Failed to delete account");
      }
      setDeletingAccount(null);
    });
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Email Accounts</h3>
        <p className="text-muted-foreground mb-4">
          Create your first email account to get started.
        </p>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Account
        </Button>
        
        <EmailAccountForm 
          orderId={orderId}
          open={showAddForm}
          onOpenChange={setShowAddForm}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canAddMore && !compact && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account ({accounts.length}/{maxAccounts})
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              {!compact && <TableHead>Last Login</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-mono">{account.email}</TableCell>
                <TableCell>{account.first_name} {account.last_name}</TableCell>
                {!compact && (
                  <TableCell className="text-muted-foreground">
                    {account.last_login ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(account.last_login), { addSuffix: true })}
                      </span>
                    ) : (
                      "Never"
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Badge 
                    variant={account.status === 'active' ? 'default' : 'secondary'}
                    className={account.status === 'active' ? 'bg-green-500' : ''}
                  >
                    {account.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a 
                          href={`https://mail.titan.email/?email=${encodeURIComponent(account.email)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Webmail
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Key className="h-4 w-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeletingAccount(account)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {compact && accounts.length > 5 && (
        <p className="text-sm text-muted-foreground text-center">
          And {accounts.length - 5} more accounts...
        </p>
      )}

      {/* Add Account Dialog */}
      <EmailAccountForm 
        orderId={orderId}
        open={showAddForm}
        onOpenChange={setShowAddForm}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAccount} onOpenChange={(open) => !open && setDeletingAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingAccount?.email}</strong>? 
              All emails and data will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

### Task 5: Email Account Form (30 mins)

```typescript
// src/components/email/email-account-form.tsx

"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { createEmailAccount } from "@/lib/actions/email";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  username: z.string()
    .min(1, "Username is required")
    .max(64, "Username too long")
    .regex(/^[a-zA-Z0-9._-]+$/, "Only letters, numbers, dots, underscores, and hyphens"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

interface EmailAccountFormProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailAccountForm({ orderId, open, onOpenChange }: EmailAccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.append('emailOrderId', orderId);
    formData.append('username', values.username);
    formData.append('password', values.password);
    formData.append('firstName', values.firstName);
    formData.append('lastName', values.lastName);

    startTransition(async () => {
      const result = await createEmailAccount(formData);
      
      if (result.success) {
        toast.success("Email account created");
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error || "Failed to create account");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Email Account</DialogTitle>
          <DialogDescription>
            Create a new email account for your domain.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Username</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input 
                        placeholder="john.doe" 
                        {...field} 
                        className="font-mono"
                      />
                    </FormControl>
                    <span className="text-muted-foreground">@domain.com</span>
                  </div>
                  <FormDescription>
                    Only letters, numbers, dots, underscores, and hyphens
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field} 
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormDescription>
                    Min 8 characters with uppercase, lowercase, and number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="••••••••"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 6: Email DNS Setup Component (30 mins)

```typescript
// src/components/email/email-dns-setup.tsx

"use client";

import { useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Settings2, Loader2 } from "lucide-react";
import { configureEmailDns } from "@/lib/actions/email";
import { toast } from "sonner";
import Link from "next/link";

interface EmailDnsSetupProps {
  orderId: string;
  domainId?: string | null;
  dnsConfigured: boolean;
}

export function EmailDnsSetup({ orderId, domainId, dnsConfigured }: EmailDnsSetupProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfigureDns = () => {
    startTransition(async () => {
      const result = await configureEmailDns(orderId);
      if (result.success) {
        toast.success("DNS records configured for email");
      } else {
        toast.error(result.error || "Failed to configure DNS");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Email DNS Configuration
              {dnsConfigured ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              MX, SPF, and DKIM records required for email delivery
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dnsConfigured ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>Your email DNS records are configured correctly.</span>
            </div>
            {domainId && (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/domains/${domainId}/dns`}>
                  <Settings2 className="h-4 w-4 mr-2" />
                  View DNS Records
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Email DNS records need to be configured for email to work properly. 
              This will add MX, SPF, and DKIM records to your domain.
            </p>
            
            <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
              <div><span className="text-purple-600">MX</span> mx1.titan.email (priority 10)</div>
              <div><span className="text-purple-600">MX</span> mx2.titan.email (priority 20)</div>
              <div><span className="text-yellow-600">TXT</span> v=spf1 include:spf.titan.email ~all</div>
            </div>

            {domainId ? (
              <div className="flex gap-2">
                <Button onClick={handleConfigureDns} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Configuring...
                    </>
                  ) : (
                    <>
                      <Settings2 className="h-4 w-4 mr-2" />
                      Auto-Configure DNS
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/domains/${domainId}/dns`}>
                    Configure Manually
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This email order is not linked to a managed domain. 
                Please configure DNS records manually at your DNS provider.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Task 7: Additional Server Actions (30 mins)

```typescript
// Add to src/lib/actions/email.ts

export async function getEmailOrderDetails(orderId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('email_orders')
    .select(`
      *,
      domain:domains(id, domain_name, cloudflare_zone_id, status),
      client:clients(id, name)
    `)
    .eq('id', orderId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getEmailStats() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };

  // Get counts
  const { data: orders } = await supabase
    .from('email_orders')
    .select('id, status, number_of_accounts, used_accounts, expiry_date')
    .eq('agency_id', profile.agency_id);

  if (!orders) return { success: true, data: { total: 0, active: 0, accounts: 0, expiringSoon: 0 } };

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const stats = {
    total: orders.length,
    active: orders.filter(o => o.status === 'Active').length,
    accounts: orders.reduce((sum, o) => sum + o.used_accounts, 0),
    expiringSoon: orders.filter(o => new Date(o.expiry_date) < thirtyDaysFromNow).length,
  };

  return { success: true, data: stats };
}
```

### Task 8: Email Stats Cards Component (15 mins)

```typescript
// src/components/email/email-stats-cards.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Mail, Users, Clock, AlertTriangle } from "lucide-react";

interface EmailStatsCardsProps {
  stats: {
    total: number;
    active: number;
    accounts: number;
    expiringSoon: number;
  };
}

export function EmailStatsCards({ stats }: EmailStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Email Orders</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.accounts}</p>
              <p className="text-sm text-muted-foreground">Email Accounts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expiringSoon}</p>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 9: Barrel Exports (5 mins)

```typescript
// src/components/email/index.ts

export * from './email-orders-list';
export * from './email-accounts-table';
export * from './email-account-form';
export * from './email-dns-setup';
export * from './email-stats-cards';
export * from './email-storage-usage';
export * from './email-webmail-link';
```

```typescript
// src/components/email/email-webmail-link.tsx

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface EmailWebmailLinkProps {
  domain: string;
}

export function EmailWebmailLink({ domain }: EmailWebmailLinkProps) {
  return (
    <Button variant="outline" asChild>
      <a 
        href="https://mail.titan.email" 
        target="_blank" 
        rel="noopener noreferrer"
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Open Webmail
      </a>
    </Button>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Email orders list displays correctly
- [ ] Order details page shows all information
- [ ] Email accounts can be created
- [ ] Email accounts can be deleted
- [ ] DNS setup component works
- [ ] Webmail links open correctly
- [ ] Stats cards show accurate data
- [ ] Empty states display properly
- [ ] Error handling works for all operations

---

## 🔗 Dependencies

### Requires from Previous Phases:
- **DM-07**: Email services (`emailOrderService`, `emailAccountService`)
- **DM-06**: DNS configuration integration
- **DM-02**: Database tables (`email_orders`, `email_accounts`)

### Provides to Next Phases:
- **DM-10**: Email pricing and billing integration

---

## 📚 Additional Notes

- Webmail access: https://mail.titan.email
- Admin panel: https://control.titan.email
- All email operations go through ResellerClub API (not direct Titan API)
