# Phase DM-09: Domain Transfers & Automation

> **Priority**: 🟡 MEDIUM  
> **Estimated Time**: 10 hours  
> **Prerequisites**: DM-01, DM-02, DM-03, DM-05  
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create domain transfer capabilities and automation features:

1. ✅ Domain transfer-in wizard (from other registrars)
2. ✅ Domain transfer-out (auth code generation)
3. ✅ Transfer status tracking
4. ✅ Auto-renewal system
5. ✅ Domain health checks
6. ✅ Expiry notifications
7. ✅ Scheduled tasks for domain maintenance
8. ✅ **Automation Engine Integration** (emit events for workflows)

---

## 🔗 Automation Engine Integration (EM-57)

This module emits events that can trigger automations. Example workflows:

| Event | Automation Example |
|-------|-------------------|
| `domain.domain.expiring_soon` | Send email reminder → Create CRM task → Slack notification |
| `domain.domain.registered` | Welcome email → Create contact → Add DNS records |
| `domain.transfer.completed` | Notify admin → Update CRM → Configure site |
| `domain.email.account_created` | Send setup instructions → Log activity |
| `domain.domain.expired` | Alert owner → Suspend site → Create urgent task |

### Emitting Events

```typescript
import { emitEvent } from '@/lib/modules/module-events';

// After domain registration
await emitEvent(
  DOMAIN_MODULE_ID,
  siteId,
  'domain.domain.registered',
  {
    domainId: domain.id,
    domainName: domain.domain_name,
    expiryDate: domain.expiry_date,
    clientId: domain.client_id,
  }
);

// Before expiration (cron job)
await emitEvent(
  DOMAIN_MODULE_ID,
  siteId,
  'domain.domain.expiring_soon',
  {
    domainId: domain.id,
    domainName: domain.domain_name,
    expiryDate: domain.expiry_date,
    daysUntilExpiry: 30,
    autoRenewEnabled: domain.auto_renew,
  }
);
```

---

## 📁 Files to Create

```
src/app/(dashboard)/dashboard/domains/
├── transfer/
│   ├── page.tsx                    # Transfer wizard
│   ├── in/page.tsx                 # Transfer-in list
│   └── out/page.tsx                # Transfer-out list

src/components/domains/transfer/
├── transfer-wizard.tsx             # Multi-step transfer wizard
├── transfer-auth-code.tsx          # Auth code input
├── transfer-status-tracker.tsx     # Transfer progress
├── transfer-list.tsx               # List of transfers
├── transfer-contact-form.tsx       # Contact info for transfer
└── index.ts                        # Barrel exports

src/components/domains/automation/
├── auto-renew-toggle.tsx           # Auto-renewal switch
├── domain-health-check.tsx         # Domain health status
├── expiry-notifications.tsx        # Notification settings
├── bulk-actions-toolbar.tsx        # Bulk operations
└── index.ts                        # Barrel exports

src/lib/resellerclub/
└── transfers.ts                    # Transfer operations

src/lib/actions/
├── transfers.ts                    # Transfer server actions
└── automation.ts                   # Automation server actions

src/lib/cron/
├── domain-health.ts                # Health check cron
├── expiry-check.ts                 # Expiry notification cron
└── auto-renew.ts                   # Auto-renewal cron

migrations/
└── dm-09-transfers-schema.sql      # Transfer tables
```

---

## 📋 Implementation Tasks

### Task 1: Transfer Types & API (60 mins)

```typescript
// src/lib/resellerclub/transfers.ts

import { getResellerClubClient } from './client';
import { ResellerClubApiError } from './errors';

// ============================================================================
// Transfer Types
// ============================================================================

export type TransferStatus = 
  | 'pending'
  | 'awaiting-auth'
  | 'auth-submitted'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface DomainTransferIn {
  domainName: string;
  authCode: string;
  customerId: string;
  registrantContactId: string;
  adminContactId: string;
  techContactId: string;
  billingContactId: string;
  purchasePrivacy?: boolean;
  autoRenew?: boolean;
}

export interface DomainTransferOut {
  orderId: string;
}

export interface TransferDetails {
  orderId: string;
  domainName: string;
  status: TransferStatus;
  initiatedAt: string;
  completedAt?: string;
  failureReason?: string;
  currentStep: number;
  totalSteps: number;
  estimatedCompletion?: string;
}

// ============================================================================
// Transfer Operations
// ============================================================================

export const transferService = {
  /**
   * Initiate a domain transfer-in
   * POST /api/domains/transfer.json
   */
  async initiateTransferIn(params: DomainTransferIn): Promise<{ orderId: string }> {
    const client = getResellerClubClient();
    
    const response = await client.post<{ entityid: string }>('/domains/transfer.json', {
      'domain-name': params.domainName,
      'auth-code': params.authCode,
      'customer-id': params.customerId,
      'reg-contact-id': params.registrantContactId,
      'admin-contact-id': params.adminContactId,
      'tech-contact-id': params.techContactId,
      'billing-contact-id': params.billingContactId,
      'purchase-privacy': params.purchasePrivacy ? 'true' : 'false',
      'auto-renew': params.autoRenew ? 'true' : 'false',
      'invoice-option': 'NoInvoice',
    });

    if (!response.entityid) {
      throw new ResellerClubApiError('Failed to initiate transfer', 'TRANSFER_FAILED', 500);
    }

    return { orderId: response.entityid };
  },

  /**
   * Submit auth code for pending transfer
   * POST /api/domains/transfer/submit-auth-code.json
   */
  async submitAuthCode(orderId: string, authCode: string): Promise<void> {
    const client = getResellerClubClient();
    
    await client.post('/domains/transfer/submit-auth-code.json', {
      'order-id': orderId,
      'auth-code': authCode,
    });
  },

  /**
   * Cancel a pending transfer
   * POST /api/domains/transfer/cancel.json
   */
  async cancelTransfer(orderId: string): Promise<void> {
    const client = getResellerClubClient();
    
    await client.post('/domains/transfer/cancel.json', {
      'order-id': orderId,
    });
  },

  /**
   * Get transfer details
   * GET /api/domains/details.json (transfer-specific fields)
   */
  async getTransferDetails(orderId: string): Promise<TransferDetails> {
    const client = getResellerClubClient();
    
    const response = await client.get<Record<string, unknown>>('/domains/details.json', {
      'order-id': orderId,
      'options': 'TransferStatus',
    });

    return mapTransferDetails(response);
  },

  /**
   * Get auth code for transfer-out
   * GET /api/domains/locks.json + unlock then get code
   */
  async getAuthCode(orderId: string): Promise<string> {
    const client = getResellerClubClient();
    
    // First, disable transfer lock
    await client.post('/domains/disable-theft-protection.json', {
      'order-id': orderId,
    });

    // Get the auth code
    const response = await client.get<{ domsecret: string }>('/domains/details.json', {
      'order-id': orderId,
      'options': 'DomainSecret',
    });

    if (!response.domsecret) {
      throw new ResellerClubApiError('Auth code not available', 'AUTH_CODE_UNAVAILABLE', 400);
    }

    return response.domsecret;
  },

  /**
   * Enable/disable transfer lock
   */
  async setTransferLock(orderId: string, locked: boolean): Promise<void> {
    const client = getResellerClubClient();
    
    const endpoint = locked 
      ? '/domains/enable-theft-protection.json'
      : '/domains/disable-theft-protection.json';
    
    await client.post(endpoint, {
      'order-id': orderId,
    });
  },

  /**
   * Resend transfer approval email
   */
  async resendApprovalEmail(orderId: string): Promise<void> {
    const client = getResellerClubClient();
    
    await client.post('/domains/transfer/resend-approval-email.json', {
      'order-id': orderId,
    });
  },
};

// ============================================================================
// Renewal Operations
// ============================================================================

export const renewalService = {
  /**
   * Renew a domain
   * POST /api/domains/renew.json
   */
  async renewDomain(orderId: string, years: number): Promise<{ invoiceId: string }> {
    const client = getResellerClubClient();
    
    const response = await client.post<{ invoiceid: string }>('/domains/renew.json', {
      'order-id': orderId,
      'years': years,
      'invoice-option': 'NoInvoice',
    });

    return { invoiceId: response.invoiceid || '' };
  },

  /**
   * Enable auto-renewal
   */
  async setAutoRenew(orderId: string, enabled: boolean): Promise<void> {
    const client = getResellerClubClient();
    
    const endpoint = enabled
      ? '/domains/enable-auto-renewal.json'
      : '/domains/disable-auto-renewal.json';
    
    await client.post(endpoint, {
      'order-id': orderId,
    });
  },

  /**
   * Get domains expiring soon
   * GET /api/domains/search.json with expiry filter
   */
  async getExpiringDomains(days: number = 30): Promise<string[]> {
    const client = getResellerClubClient();
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const response = await client.get<Record<string, Record<string, string>>>('/domains/search.json', {
      'expiry-date-start': Math.floor(Date.now() / 1000).toString(),
      'expiry-date-end': Math.floor(expiryDate.getTime() / 1000).toString(),
      'no-of-records': '100',
      'page-no': '1',
    });

    return Object.values(response)
      .filter(d => typeof d === 'object' && d.entity)
      .map(d => d.entity);
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function mapTransferDetails(data: Record<string, unknown>): TransferDetails {
  const statusMap: Record<string, TransferStatus> = {
    'Pending': 'pending',
    'InProgress': 'in-progress',
    'Completed': 'completed',
    'Failed': 'failed',
    'Cancelled': 'cancelled',
  };

  return {
    orderId: String(data.entityid || data.orderid || ''),
    domainName: String(data.domainname || ''),
    status: statusMap[data.orderstatus as string] || 'pending',
    initiatedAt: String(data.creationtime || ''),
    completedAt: data.completiontime ? String(data.completiontime) : undefined,
    failureReason: data.reason ? String(data.reason) : undefined,
    currentStep: 1,
    totalSteps: 5,
  };
}
```

### Task 2: Database Schema for Transfers (30 mins)

```sql
-- migrations/dm-09-transfers-schema.sql

-- ============================================================================
-- DOMAIN TRANSFERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  
  -- Transfer Details
  domain_name TEXT NOT NULL,
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('in', 'out')),
  resellerclub_order_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'awaiting-auth',
    'auth-submitted',
    'in-progress',
    'completed',
    'failed',
    'cancelled'
  )),
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 5,
  
  -- Details
  auth_code_encrypted TEXT, -- Encrypted auth code
  failure_reason TEXT,
  
  -- Contacts for transfer-in
  registrant_contact_id TEXT,
  admin_contact_id TEXT,
  tech_contact_id TEXT,
  billing_contact_id TEXT,
  
  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_domain_transfers_agency ON domain_transfers(agency_id);
CREATE INDEX idx_domain_transfers_domain ON domain_transfers(domain_id);
CREATE INDEX idx_domain_transfers_status ON domain_transfers(status);

-- ============================================================================
-- DOMAIN HEALTH CHECKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  
  -- Health Status
  dns_healthy BOOLEAN DEFAULT false,
  ssl_healthy BOOLEAN DEFAULT false,
  nameservers_correct BOOLEAN DEFAULT false,
  whois_accessible BOOLEAN DEFAULT false,
  
  -- Details
  dns_issues JSONB DEFAULT '[]',
  ssl_issues JSONB DEFAULT '[]',
  
  -- Last Check
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  next_check_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours'
);

-- Index
CREATE INDEX idx_domain_health_domain ON domain_health_checks(domain_id);
CREATE INDEX idx_domain_health_next_check ON domain_health_checks(next_check_at);

-- ============================================================================
-- EXPIRY NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_expiry_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  
  -- Notification Settings
  notify_30_days BOOLEAN DEFAULT true,
  notify_14_days BOOLEAN DEFAULT true,
  notify_7_days BOOLEAN DEFAULT true,
  notify_1_day BOOLEAN DEFAULT true,
  
  -- Notification Status
  notified_30_days_at TIMESTAMPTZ,
  notified_14_days_at TIMESTAMPTZ,
  notified_7_days_at TIMESTAMPTZ,
  notified_1_day_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE UNIQUE INDEX idx_domain_expiry_notifications_domain ON domain_expiry_notifications(domain_id);

-- ============================================================================
-- ADD AUTO-RENEW SETTINGS TO DOMAINS TABLE
-- ============================================================================

ALTER TABLE domains ADD COLUMN IF NOT EXISTS auto_renew_enabled BOOLEAN DEFAULT true;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS auto_renew_days_before INTEGER DEFAULT 14;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'unknown';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE domain_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_expiry_notifications ENABLE ROW LEVEL SECURITY;

-- Transfers RLS
CREATE POLICY "Users can view transfers for their agency"
  ON domain_transfers FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create transfers for their agency"
  ON domain_transfers FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Health Checks RLS (based on domain ownership)
CREATE POLICY "Users can view health checks for their domains"
  ON domain_health_checks FOR SELECT
  USING (
    domain_id IN (
      SELECT id FROM domains WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Expiry Notifications RLS
CREATE POLICY "Users can view expiry notifications for their domains"
  ON domain_expiry_notifications FOR SELECT
  USING (
    domain_id IN (
      SELECT id FROM domains WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update expiry notifications for their domains"
  ON domain_expiry_notifications FOR UPDATE
  USING (
    domain_id IN (
      SELECT id FROM domains WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );
```

### Task 3: Transfer Server Actions (45 mins)

```typescript
// src/lib/actions/transfers.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { transferService, renewalService } from "@/lib/resellerclub/transfers";
import type { TransferDetails, TransferStatus } from "@/lib/resellerclub/transfers";

// ============================================================================
// Transfer-In Actions
// ============================================================================

export async function initiateTransferIn(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };

  try {
    const domainName = formData.get('domainName') as string;
    const authCode = formData.get('authCode') as string;
    const registrantContactId = formData.get('registrantContactId') as string;
    const purchasePrivacy = formData.get('purchasePrivacy') === 'true';
    const autoRenew = formData.get('autoRenew') === 'true';

    // Get agency's customer ID
    const { data: agency } = await supabase
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', profile.agency_id)
      .single();

    if (!agency?.resellerclub_customer_id) {
      return { success: false, error: 'Agency not configured for domain services' };
    }

    // Initiate transfer at ResellerClub
    const result = await transferService.initiateTransferIn({
      domainName,
      authCode,
      customerId: agency.resellerclub_customer_id,
      registrantContactId,
      adminContactId: registrantContactId,
      techContactId: registrantContactId,
      billingContactId: registrantContactId,
      purchasePrivacy,
      autoRenew,
    });

    // Create transfer record
    const { data: transfer, error } = await adminClient
      .from('domain_transfers')
      .insert({
        agency_id: profile.agency_id,
        domain_name: domainName,
        transfer_type: 'in',
        resellerclub_order_id: result.orderId,
        status: 'in-progress',
        registrant_contact_id: registrantContactId,
        admin_contact_id: registrantContactId,
        tech_contact_id: registrantContactId,
        billing_contact_id: registrantContactId,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/domains/transfer');
    
    return { success: true, data: transfer };
  } catch (error) {
    console.error('Initiate transfer error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to initiate transfer' 
    };
  }
}

export async function getTransfers(type?: 'in' | 'out') {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };

  let query = supabase
    .from('domain_transfers')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .order('initiated_at', { ascending: false });

  if (type) {
    query = query.eq('transfer_type', type);
  }

  const { data, error } = await query;

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function cancelTransfer(transferId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get transfer
    const { data: transfer } = await supabase
      .from('domain_transfers')
      .select('resellerclub_order_id, status')
      .eq('id', transferId)
      .single();

    if (!transfer) {
      return { success: false, error: 'Transfer not found' };
    }

    if (transfer.status === 'completed' || transfer.status === 'cancelled') {
      return { success: false, error: 'Transfer cannot be cancelled' };
    }

    // Cancel at ResellerClub
    if (transfer.resellerclub_order_id) {
      await transferService.cancelTransfer(transfer.resellerclub_order_id);
    }

    // Update status
    await adminClient
      .from('domain_transfers')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', transferId);

    revalidatePath('/dashboard/domains/transfer');
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cancel transfer' 
    };
  }
}

// ============================================================================
// Transfer-Out Actions
// ============================================================================

export async function getAuthCode(domainId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get domain
    const { data: domain } = await supabase
      .from('domains')
      .select('resellerclub_order_id')
      .eq('id', domainId)
      .single();

    if (!domain?.resellerclub_order_id) {
      return { success: false, error: 'Domain not found' };
    }

    const authCode = await transferService.getAuthCode(domain.resellerclub_order_id);
    
    return { success: true, data: { authCode } };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get auth code' 
    };
  }
}

export async function setTransferLock(domainId: string, locked: boolean) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const { data: domain } = await supabase
      .from('domains')
      .select('resellerclub_order_id')
      .eq('id', domainId)
      .single();

    if (!domain?.resellerclub_order_id) {
      return { success: false, error: 'Domain not found' };
    }

    await transferService.setTransferLock(domain.resellerclub_order_id, locked);
    
    // Update local record
    await supabase
      .from('domains')
      .update({ transfer_lock: locked })
      .eq('id', domainId);

    revalidatePath(`/dashboard/domains/${domainId}`);
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update transfer lock' 
    };
  }
}
```

### Task 4: Automation Server Actions (45 mins)

```typescript
// src/lib/actions/automation.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { renewalService } from "@/lib/resellerclub/transfers";
import { cloudflareApi } from "@/lib/cloudflare";

// ============================================================================
// Auto-Renewal Actions
// ============================================================================

export async function setAutoRenew(domainId: string, enabled: boolean) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get domain
    const { data: domain } = await supabase
      .from('domains')
      .select('resellerclub_order_id')
      .eq('id', domainId)
      .single();

    if (!domain?.resellerclub_order_id) {
      return { success: false, error: 'Domain not found' };
    }

    // Update at ResellerClub
    await renewalService.setAutoRenew(domain.resellerclub_order_id, enabled);
    
    // Update local record
    await supabase
      .from('domains')
      .update({ auto_renew_enabled: enabled, auto_renew: enabled })
      .eq('id', domainId);

    revalidatePath(`/dashboard/domains/${domainId}`);
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update auto-renewal' 
    };
  }
}

export async function renewDomain(domainId: string, years: number = 1) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get domain
    const { data: domain } = await supabase
      .from('domains')
      .select('resellerclub_order_id, expiry_date')
      .eq('id', domainId)
      .single();

    if (!domain?.resellerclub_order_id) {
      return { success: false, error: 'Domain not found' };
    }

    // Renew at ResellerClub
    const result = await renewalService.renewDomain(domain.resellerclub_order_id, years);
    
    // Calculate new expiry
    const currentExpiry = new Date(domain.expiry_date);
    currentExpiry.setFullYear(currentExpiry.getFullYear() + years);

    // Update local record
    await adminClient
      .from('domains')
      .update({ 
        expiry_date: currentExpiry.toISOString(),
        last_renewed_at: new Date().toISOString(),
      })
      .eq('id', domainId);

    revalidatePath(`/dashboard/domains/${domainId}`);
    revalidatePath('/dashboard/domains');
    
    return { success: true, data: { newExpiry: currentExpiry.toISOString() } };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to renew domain' 
    };
  }
}

// ============================================================================
// Health Check Actions
// ============================================================================

export async function runHealthCheck(domainId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get domain
    const { data: domain } = await supabase
      .from('domains')
      .select('domain_name, cloudflare_zone_id, nameservers')
      .eq('id', domainId)
      .single();

    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }

    const healthResults = {
      dns_healthy: false,
      ssl_healthy: false,
      nameservers_correct: false,
      whois_accessible: true, // Simplified check
      dns_issues: [] as string[],
      ssl_issues: [] as string[],
    };

    // Check Cloudflare zone if exists
    if (domain.cloudflare_zone_id) {
      try {
        const zone = await cloudflareApi.zones.getZone(domain.cloudflare_zone_id);
        healthResults.dns_healthy = zone.status === 'active';
        
        if (!healthResults.dns_healthy) {
          healthResults.dns_issues.push(`Zone status: ${zone.status}`);
        }

        // Check if nameservers match
        const expectedNs = zone.nameServers || [];
        const currentNs = domain.nameservers || [];
        healthResults.nameservers_correct = expectedNs.every(ns => 
          currentNs.some(current => current.toLowerCase() === ns.toLowerCase())
        );

        if (!healthResults.nameservers_correct) {
          healthResults.dns_issues.push('Nameservers not correctly configured');
        }

        // Check SSL
        try {
          const sslSettings = await cloudflareApi.ssl.getSettings(domain.cloudflare_zone_id);
          healthResults.ssl_healthy = sslSettings.mode !== 'off';
          if (!healthResults.ssl_healthy) {
            healthResults.ssl_issues.push('SSL is disabled');
          }
        } catch {
          healthResults.ssl_issues.push('Could not check SSL status');
        }
      } catch {
        healthResults.dns_issues.push('Could not access Cloudflare zone');
      }
    } else {
      healthResults.dns_issues.push('Domain not configured with Cloudflare');
    }

    // Calculate overall health status
    const allHealthy = healthResults.dns_healthy && 
                       healthResults.ssl_healthy && 
                       healthResults.nameservers_correct;
    const someHealthy = healthResults.dns_healthy || 
                        healthResults.ssl_healthy || 
                        healthResults.nameservers_correct;
    
    const healthStatus = allHealthy ? 'healthy' : someHealthy ? 'warning' : 'unhealthy';

    // Upsert health check record
    await adminClient
      .from('domain_health_checks')
      .upsert({
        domain_id: domainId,
        ...healthResults,
        dns_issues: healthResults.dns_issues,
        ssl_issues: healthResults.ssl_issues,
        last_checked_at: new Date().toISOString(),
        next_check_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'domain_id',
      });

    // Update domain health status
    await adminClient
      .from('domains')
      .update({ 
        health_status: healthStatus,
        last_health_check_at: new Date().toISOString(),
      })
      .eq('id', domainId);

    revalidatePath(`/dashboard/domains/${domainId}`);
    
    return { 
      success: true, 
      data: { ...healthResults, status: healthStatus } 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to run health check' 
    };
  }
}

export async function getHealthCheck(domainId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('domain_health_checks')
    .select('*')
    .eq('domain_id', domainId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// ============================================================================
// Expiry Notifications Actions
// ============================================================================

export async function updateExpiryNotifications(domainId: string, settings: {
  notify_30_days?: boolean;
  notify_14_days?: boolean;
  notify_7_days?: boolean;
  notify_1_day?: boolean;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const { error } = await supabase
      .from('domain_expiry_notifications')
      .upsert({
        domain_id: domainId,
        ...settings,
      }, {
        onConflict: 'domain_id',
      });

    if (error) throw error;

    revalidatePath(`/dashboard/domains/${domainId}/settings`);
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update notification settings' 
    };
  }
}

// ============================================================================
// Bulk Actions
// ============================================================================

export async function bulkSetAutoRenew(domainIds: string[], enabled: boolean) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const results = await Promise.allSettled(
    domainIds.map(id => setAutoRenew(id, enabled))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = domainIds.length - successful;

  revalidatePath('/dashboard/domains');
  
  return { 
    success: true, 
    data: { successful, failed, total: domainIds.length } 
  };
}

export async function bulkRunHealthCheck(domainIds: string[]) {
  const results = await Promise.allSettled(
    domainIds.map(id => runHealthCheck(id))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = domainIds.length - successful;

  return { 
    success: true, 
    data: { successful, failed, total: domainIds.length } 
  };
}
```

### Task 5: Transfer Wizard Component (60 mins)

```typescript
// src/components/domains/transfer/transfer-wizard.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle,
  Key,
  User,
  Shield,
  Loader2,
} from "lucide-react";
import { initiateTransferIn } from "@/lib/actions/transfers";
import { checkDomainAvailability } from "@/lib/actions/domains";
import { toast } from "sonner";

const STEPS = [
  { id: 'domain', title: 'Domain', description: 'Enter domain to transfer' },
  { id: 'auth', title: 'Authorization', description: 'Provide auth code' },
  { id: 'contacts', title: 'Contacts', description: 'Verify contact info' },
  { id: 'options', title: 'Options', description: 'Choose options' },
  { id: 'confirm', title: 'Confirm', description: 'Review and submit' },
];

const formSchema = z.object({
  domainName: z.string().min(1, "Domain name is required").regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  authCode: z.string().min(1, "Auth code is required"),
  registrantContactId: z.string().min(1, "Contact is required"),
  purchasePrivacy: z.boolean().default(true),
  autoRenew: z.boolean().default(true),
  confirmTerms: z.boolean().refine(val => val === true, "You must accept the terms"),
});

type FormValues = z.infer<typeof formSchema>;

interface TransferWizardProps {
  contacts: Array<{ id: string; name: string; email: string }>;
}

export function TransferWizard({ contacts }: TransferWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [domainStatus, setDomainStatus] = useState<'checking' | 'available' | 'unavailable' | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domainName: "",
      authCode: "",
      registrantContactId: contacts[0]?.id || "",
      purchasePrivacy: true,
      autoRenew: true,
      confirmTerms: false,
    },
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  async function checkDomain() {
    const domain = form.getValues('domainName');
    if (!domain) return;

    setDomainStatus('checking');
    const result = await checkDomainAvailability(domain);
    
    // For transfer, we want the domain to be UNAVAILABLE (already registered)
    if (result.success && result.data?.status === 'unavailable') {
      setDomainStatus('available');
    } else {
      setDomainStatus('unavailable');
    }
  }

  function nextStep() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.append('domainName', values.domainName);
    formData.append('authCode', values.authCode);
    formData.append('registrantContactId', values.registrantContactId);
    formData.append('purchasePrivacy', String(values.purchasePrivacy));
    formData.append('autoRenew', String(values.autoRenew));

    startTransition(async () => {
      const result = await initiateTransferIn(formData);
      
      if (result.success) {
        toast.success("Transfer initiated successfully!");
        router.push('/dashboard/domains/transfer');
      } else {
        toast.error(result.error || "Failed to initiate transfer");
      }
    });
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Domain
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="domainName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain Name</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        placeholder="example.com" 
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={checkDomain}
                      disabled={domainStatus === 'checking'}
                    >
                      {domainStatus === 'checking' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Check'
                      )}
                    </Button>
                  </div>
                  <FormDescription>
                    Enter the domain you want to transfer to your account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {domainStatus === 'available' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  This domain is registered and can be transferred.
                </AlertDescription>
              </Alert>
            )}

            {domainStatus === 'unavailable' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This domain appears to be available for registration, not transfer. 
                  Please check the domain name.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 1: // Auth Code
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Key className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Authorization Code Required</p>
                <p className="text-sm text-muted-foreground">
                  Get this from your current registrar
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="authCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auth Code (EPP Code)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter auth code" 
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    This code authorizes the transfer. It's case-sensitive.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert>
              <AlertDescription>
                <strong>Before transferring:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                  <li>Unlock your domain at your current registrar</li>
                  <li>Disable WHOIS privacy protection temporarily</li>
                  <li>Ensure domain is not within 60 days of registration/previous transfer</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        );

      case 2: // Contacts
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <User className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Contact Information</p>
                <p className="text-sm text-muted-foreground">
                  Select the contact to use for this domain
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="registrantContactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registrant Contact</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    >
                      {contacts.map(contact => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} ({contact.email})
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    This contact will be used for all contact types
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3: // Options
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="purchasePrivacy"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      WHOIS Privacy Protection
                    </FormLabel>
                    <FormDescription>
                      Hide your personal information from public WHOIS lookups
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoRenew"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable Auto-Renewal</FormLabel>
                    <FormDescription>
                      Automatically renew this domain before it expires
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        );

      case 4: // Confirm
        const values = form.getValues();
        return (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Domain</span>
                <span className="font-mono font-medium">{values.domainName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Privacy</span>
                <span>{values.purchasePrivacy ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-Renewal</span>
                <span>{values.autoRenew ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="confirmTerms"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I confirm that I am authorized to transfer this domain and accept the terms
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <Alert>
              <AlertDescription>
                Domain transfers typically take 5-7 days to complete. 
                You'll receive an email to approve the transfer.
              </AlertDescription>
            </Alert>
          </div>
        );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, i) => (
                <div 
                  key={step.id}
                  className={`flex items-center gap-2 ${i <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      i < currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : i === currentStep 
                          ? 'border-2 border-primary' 
                          : 'border-2 border-muted'
                    }`}
                  >
                    {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="hidden md:inline text-sm">{step.title}</span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-1" />
            <CardTitle className="mt-4">{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>

          <CardContent>
            {renderStepContent()}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || isPending}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initiating Transfer...
                  </>
                ) : (
                  'Start Transfer'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
```

### Task 6: Domain Health Check Component (30 mins)

```typescript
// src/components/domains/automation/domain-health-check.tsx

"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Globe,
  Shield,
  Server,
  Loader2,
} from "lucide-react";
import { runHealthCheck } from "@/lib/actions/automation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface HealthCheckData {
  dns_healthy: boolean;
  ssl_healthy: boolean;
  nameservers_correct: boolean;
  whois_accessible: boolean;
  dns_issues: string[];
  ssl_issues: string[];
  last_checked_at: string;
}

interface DomainHealthCheckProps {
  domainId: string;
  healthData?: HealthCheckData | null;
  healthStatus?: string;
}

export function DomainHealthCheck({ domainId, healthData, healthStatus }: DomainHealthCheckProps) {
  const [isPending, startTransition] = useTransition();
  const [localData, setLocalData] = useState(healthData);

  const handleRunCheck = () => {
    startTransition(async () => {
      const result = await runHealthCheck(domainId);
      if (result.success && result.data) {
        setLocalData({
          ...result.data,
          last_checked_at: new Date().toISOString(),
        });
        toast.success("Health check completed");
      } else {
        toast.error(result.error || "Failed to run health check");
      }
    });
  };

  const getStatusBadge = () => {
    const status = healthStatus || 'unknown';
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Unhealthy</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const checks = [
    { 
      key: 'dns_healthy', 
      label: 'DNS Configuration', 
      icon: Globe,
      healthy: localData?.dns_healthy,
      issues: localData?.dns_issues,
    },
    { 
      key: 'ssl_healthy', 
      label: 'SSL/TLS', 
      icon: Shield,
      healthy: localData?.ssl_healthy,
      issues: localData?.ssl_issues,
    },
    { 
      key: 'nameservers_correct', 
      label: 'Nameservers', 
      icon: Server,
      healthy: localData?.nameservers_correct,
      issues: localData?.nameservers_correct ? [] : ['Nameservers not matching expected values'],
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Domain Health
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            {localData?.last_checked_at 
              ? `Last checked ${formatDistanceToNow(new Date(localData.last_checked_at), { addSuffix: true })}`
              : 'Health check not run yet'
            }
          </CardDescription>
        </div>
        <Button onClick={handleRunCheck} disabled={isPending} variant="outline" size="sm">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Check Now</span>
        </Button>
      </CardHeader>
      <CardContent>
        {localData ? (
          <div className="space-y-4">
            {checks.map((check) => (
              <div key={check.key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  check.healthy 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <check.icon className={`h-4 w-4 ${
                    check.healthy ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{check.label}</span>
                    {check.healthy ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {check.issues && check.issues.length > 0 && (
                    <ul className="mt-1 text-sm text-muted-foreground">
                      {check.issues.map((issue, i) => (
                        <li key={i}>• {issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Run a health check to see your domain's status</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Task 7: Auto-Renew Toggle Component (15 mins)

```typescript
// src/components/domains/automation/auto-renew-toggle.tsx

"use client";

import { useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Loader2 } from "lucide-react";
import { setAutoRenew } from "@/lib/actions/automation";
import { toast } from "sonner";

interface AutoRenewToggleProps {
  domainId: string;
  enabled: boolean;
  expiryDate: string;
}

export function AutoRenewToggle({ domainId, enabled, expiryDate }: AutoRenewToggleProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await setAutoRenew(domainId, checked);
      if (result.success) {
        toast.success(`Auto-renewal ${checked ? 'enabled' : 'disabled'}`);
      } else {
        toast.error(result.error || "Failed to update auto-renewal");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Auto-Renewal
        </CardTitle>
        <CardDescription>
          Automatically renew this domain before it expires
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-renew">Enable Auto-Renewal</Label>
            <p className="text-sm text-muted-foreground">
              Domain expires: {new Date(expiryDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="auto-renew"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={isPending}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 8: Barrel Exports (5 mins)

```typescript
// src/components/domains/transfer/index.ts

export * from './transfer-wizard';
export * from './transfer-status-tracker';
export * from './transfer-list';
```

```typescript
// src/components/domains/automation/index.ts

export * from './auto-renew-toggle';
export * from './domain-health-check';
export * from './expiry-notifications';
export * from './bulk-actions-toolbar';
```

---

## ✅ Verification Checklist

- [ ] Transfer wizard works through all steps
- [ ] Auth code validation works
- [ ] Transfer status displays correctly
- [ ] Auth code generation works for transfer-out
- [ ] Transfer lock can be toggled
- [ ] Auto-renewal can be enabled/disabled
- [ ] Domain health check runs and displays results
- [ ] Bulk actions work correctly
- [ ] Database migrations apply without errors
- [ ] RLS policies work correctly

---

## 🔗 Dependencies

### Requires from Previous Phases:
- **DM-01**: ResellerClub API client
- **DM-02**: Domains table
- **DM-03**: Cloudflare API (for health checks)
- **DM-05**: Domain management UI

### Provides to Next Phases:
- **DM-10**: Billing integration for renewals and transfers

---

## 📚 ResellerClub API Documentation

- Domain Transfers: https://manage.resellerclub.com/kb/answer/770
- Transfer Auth Code: https://manage.resellerclub.com/kb/answer/769
- Renewals: https://manage.resellerclub.com/kb/answer/761
- Transfer Lock: https://manage.resellerclub.com/kb/answer/762
