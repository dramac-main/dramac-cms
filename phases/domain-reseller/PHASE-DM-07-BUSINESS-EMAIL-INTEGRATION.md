# Phase DM-07: Business Email Integration (via ResellerClub)

> **Priority**: 🟡 MEDIUM  
> **Estimated Time**: 10 hours  
> **Prerequisites**: DM-01, DM-02, DM-03  
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Integrate **Business Email (Titan Mail)** using ResellerClub's HTTP API:

1. ✅ Business Email API client (via ResellerClub `/eelite/` endpoints)
2. ✅ Email order management (add, renew, upgrade)
3. ✅ Email account provisioning (add/delete accounts)
4. ✅ DNS record generation for email (MX, SPF, DKIM)
5. ✅ Email-domain linking
6. ✅ Billing integration

> **⚠️ CRITICAL**: Business Email (Titan) is managed **ONLY** through ResellerClub's HTTP API.
> There is NO separate Titan API. All operations go through `https://httpapi.com/api/eelite/`

---

## 📚 ResellerClub Business Email API Reference

```
Base URL: https://httpapi.com/api/eelite/
Test URL: https://test.httpapi.com/api/eelite/

API Endpoints (KB article 2155):
├── POST /eelite/add.json               # Create email order
├── POST /eelite/renew.json             # Renew email order
├── POST /eelite/add-email-account.json # Add email account
├── POST /eelite/delete-email-account.json # Delete email account
├── POST /eelite/suspend.json           # Suspend order
├── POST /eelite/unsuspend.json         # Unsuspend order
├── POST /eelite/delete.json            # Delete order
├── GET  /eelite/details.json           # Get order details
├── GET  /eelite/orderid.json           # Get order ID
├── GET  /eelite/search.json            # Search orders
├── GET  /eelite/customer-pricing.json  # Get customer pricing
├── GET  /eelite/reseller-pricing.json  # Get reseller pricing
├── GET  /eelite/dns-records.json       # Get DNS records for email
└── POST /eelite/add-storage-addon.json # Add storage addon

Authentication:
- auth-userid: Your ResellerClub Reseller ID
- api-key: Your ResellerClub API Key
```

---

## 📁 Files to Create

```
src/lib/resellerclub/
├── email/
│   ├── client.ts              # Business Email API client
│   ├── types.ts               # Email-specific types
│   ├── order-service.ts       # Email order operations
│   ├── account-service.ts     # Email account operations
│   ├── dns-service.ts         # Email DNS record generation
│   └── index.ts               # Barrel exports
│
└── index.ts                   # Update barrel to include email

src/lib/actions/
└── email.ts                   # Server actions for email

src/types/
└── email.ts                   # Email types (public)

migrations/
└── dm-07-email-schema.sql     # Email-related database tables
```

---

## 📋 Implementation Tasks

### Task 1: Email Types (30 mins)

```typescript
// src/lib/resellerclub/email/types.ts

// ============================================================================
// Business Email Plan Types (Titan via ResellerClub)
// ============================================================================

export type EmailPlanType = 'eeliteus' | 'eelitein' | 'eeliteuk';

export interface EmailPlan {
  planKey: EmailPlanType;
  name: string;
  storage: number; // GB per account
  features: string[];
  pricing: {
    monthly: number;
    yearly: number;
  };
}

// Product keys for ResellerClub
export const EMAIL_PRODUCT_KEYS = {
  eeliteus: 'eeliteus',   // Business Email - US datacenter
  eelitein: 'eelitein',   // Business Email - India datacenter  
  eeliteuk: 'eeliteuk',   // Business Email - UK datacenter
} as const;

// ============================================================================
// API Request Types
// ============================================================================

export interface CreateEmailOrderParams {
  domainName: string;
  customerId: string;
  numberOfAccounts: number;
  months: number; // 1, 3, 6, 12, 24, 36
  productKey?: EmailPlanType;
  invoiceOption?: 'NoInvoice' | 'PayInvoice' | 'KeepInvoice';
}

export interface AddEmailAccountParams {
  orderId: string;
  email: string; // Full email address (user@domain.com)
  password: string;
  firstName: string;
  lastName: string;
  countryCode?: string;
  languageCode?: string;
}

export interface DeleteEmailAccountParams {
  orderId: string;
  email: string; // Full email address to delete
}

export interface RenewEmailOrderParams {
  orderId: string;
  months: number; // 1, 3, 6, 12, 24, 36
  numberOfAccounts: number;
  invoiceOption?: 'NoInvoice' | 'PayInvoice' | 'KeepInvoice';
}

export interface SearchEmailOrdersParams {
  customerId?: string;
  domainName?: string;
  status?: EmailOrderStatus;
  pageNo?: number;
  noOfRecords?: number;
  orderBy?: 'orderid' | 'endtime' | 'timestamp';
}

// ============================================================================
// API Response Types
// ============================================================================

export type EmailOrderStatus = 
  | 'Active'
  | 'Pending'
  | 'Suspended'
  | 'Deleted'
  | 'InActive'
  | 'Expired';

export interface EmailOrderDetails {
  orderId: string;
  entityId: string;
  domainName: string;
  customerId: string;
  currentStatus: EmailOrderStatus;
  numberOfAccounts: number;
  usedAccounts: number;
  creationTime: string;
  endTime: string;
  productKey: EmailPlanType;
  productName: string;
  emailAccounts: EmailAccountInfo[];
}

export interface EmailAccountInfo {
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  lastLogin?: string;
  storageUsed?: number;
  storageLimit?: number;
}

export interface EmailPricingResponse {
  [productKey: string]: {
    [months: string]: {
      addnewaccount: string;
      renewaccount: string;
    };
  };
}

export interface EmailDnsRecords {
  mx: Array<{
    priority: number;
    host: string;
    ttl: number;
  }>;
  spf: {
    host: string;
    value: string;
    ttl: number;
  };
  dkim?: {
    host: string;
    value: string;
    ttl: number;
  };
}

// ============================================================================
// Database Types (Supabase)
// ============================================================================

export interface EmailOrder {
  id: string;
  agency_id: string;
  client_id?: string;
  domain_id?: string;
  
  // ResellerClub data
  resellerclub_order_id: string;
  resellerclub_customer_id: string;
  
  // Order details
  domain_name: string;
  product_key: EmailPlanType;
  number_of_accounts: number;
  used_accounts: number;
  status: EmailOrderStatus;
  
  // Dates
  start_date: string;
  expiry_date: string;
  
  // Pricing
  wholesale_price: number;
  retail_price: number;
  currency: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EmailAccount {
  id: string;
  email_order_id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: 'active' | 'suspended' | 'deleted';
  storage_used?: number;
  storage_limit?: number;
  last_login?: string;
  created_at: string;
  updated_at: string;
}
```

### Task 2: Business Email Client (60 mins)

```typescript
// src/lib/resellerclub/email/client.ts

import { getResellerClubClient } from '../client';
import { ResellerClubApiError } from '../errors';
import type {
  CreateEmailOrderParams,
  AddEmailAccountParams,
  DeleteEmailAccountParams,
  RenewEmailOrderParams,
  SearchEmailOrdersParams,
  EmailOrderDetails,
  EmailPricingResponse,
  EmailDnsRecords,
  EMAIL_PRODUCT_KEYS,
} from './types';

// ============================================================================
// Business Email API Client
// ============================================================================

/**
 * Business Email (Titan) operations via ResellerClub API
 * 
 * All endpoints use: /api/eelite/
 * Documentation: https://manage.resellerclub.com/kb/answer/2155
 */
export const businessEmailApi = {
  // --------------------------------------------------------------------------
  // Order Management
  // --------------------------------------------------------------------------

  /**
   * Create a new Business Email order
   * POST /api/eelite/add.json
   */
  async createOrder(params: CreateEmailOrderParams): Promise<{ orderId: string; invoiceId: string }> {
    const client = getResellerClubClient();
    
    const response = await client.post<{ entityid: string; invoiceid: string }>('/eelite/add.json', {
      'domain-name': params.domainName,
      'customer-id': params.customerId,
      'no-of-accounts': params.numberOfAccounts,
      'months': params.months,
      'product-key': params.productKey || EMAIL_PRODUCT_KEYS.eeliteus,
      'invoice-option': params.invoiceOption || 'NoInvoice',
    });

    if (!response.entityid) {
      throw new ResellerClubApiError('Failed to create email order', 'CREATE_FAILED', 500);
    }

    return {
      orderId: response.entityid,
      invoiceId: response.invoiceid || '',
    };
  },

  /**
   * Renew an existing email order
   * POST /api/eelite/renew.json
   */
  async renewOrder(params: RenewEmailOrderParams): Promise<{ success: boolean; invoiceId: string }> {
    const client = getResellerClubClient();
    
    const response = await client.post<{ invoiceid: string }>('/eelite/renew.json', {
      'order-id': params.orderId,
      'months': params.months,
      'no-of-accounts': params.numberOfAccounts,
      'invoice-option': params.invoiceOption || 'NoInvoice',
    });

    return {
      success: true,
      invoiceId: response.invoiceid || '',
    };
  },

  /**
   * Get email order details
   * GET /api/eelite/details.json
   */
  async getOrderDetails(orderId: string): Promise<EmailOrderDetails> {
    const client = getResellerClubClient();
    
    const response = await client.get<Record<string, unknown>>('/eelite/details.json', {
      'order-id': orderId,
    });

    return mapOrderDetailsResponse(response);
  },

  /**
   * Get order ID by domain name
   * GET /api/eelite/orderid.json
   */
  async getOrderIdByDomain(domainName: string): Promise<string | null> {
    const client = getResellerClubClient();
    
    try {
      const response = await client.get<string>('/eelite/orderid.json', {
        'domain-name': domainName,
      });
      return response || null;
    } catch (error) {
      if ((error as ResellerClubApiError).code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  },

  /**
   * Search email orders
   * GET /api/eelite/search.json
   */
  async searchOrders(params: SearchEmailOrdersParams): Promise<EmailOrderDetails[]> {
    const client = getResellerClubClient();
    
    const queryParams: Record<string, string> = {
      'no-of-records': String(params.noOfRecords || 50),
      'page-no': String(params.pageNo || 1),
    };
    
    if (params.customerId) queryParams['customer-id'] = params.customerId;
    if (params.domainName) queryParams['domain-name'] = params.domainName;
    if (params.status) queryParams['status'] = params.status;
    if (params.orderBy) queryParams['order-by'] = params.orderBy;
    
    const response = await client.get<Record<string, Record<string, unknown>>>('/eelite/search.json', queryParams);
    
    // Response is keyed by order ID
    return Object.entries(response)
      .filter(([key]) => key !== 'recsonpage' && key !== 'recsindb')
      .map(([_, data]) => mapOrderDetailsResponse(data as Record<string, unknown>));
  },

  /**
   * Suspend an email order
   * POST /api/eelite/suspend.json
   */
  async suspendOrder(orderId: string, reason: string): Promise<void> {
    const client = getResellerClubClient();
    await client.post('/eelite/suspend.json', {
      'order-id': orderId,
      'reason': reason,
    });
  },

  /**
   * Unsuspend an email order
   * POST /api/eelite/unsuspend.json
   */
  async unsuspendOrder(orderId: string): Promise<void> {
    const client = getResellerClubClient();
    await client.post('/eelite/unsuspend.json', {
      'order-id': orderId,
    });
  },

  /**
   * Delete an email order
   * POST /api/eelite/delete.json
   */
  async deleteOrder(orderId: string): Promise<void> {
    const client = getResellerClubClient();
    await client.post('/eelite/delete.json', {
      'order-id': orderId,
    });
  },

  // --------------------------------------------------------------------------
  // Email Account Management
  // --------------------------------------------------------------------------

  /**
   * Add email account to an order
   * POST /api/eelite/add-email-account.json
   */
  async addEmailAccount(params: AddEmailAccountParams): Promise<{ success: boolean }> {
    const client = getResellerClubClient();
    
    await client.post('/eelite/add-email-account.json', {
      'order-id': params.orderId,
      'email': params.email,
      'passwd': params.password,
      'first-name': params.firstName,
      'last-name': params.lastName,
      'country-code': params.countryCode || 'US',
      'language-code': params.languageCode || 'en',
    });

    return { success: true };
  },

  /**
   * Delete an email account
   * POST /api/eelite/delete-email-account.json
   */
  async deleteEmailAccount(params: DeleteEmailAccountParams): Promise<{ success: boolean }> {
    const client = getResellerClubClient();
    
    await client.post('/eelite/delete-email-account.json', {
      'order-id': params.orderId,
      'email': params.email,
    });

    return { success: true };
  },

  // --------------------------------------------------------------------------
  // Pricing
  // --------------------------------------------------------------------------

  /**
   * Get customer pricing for email plans
   * GET /api/eelite/customer-pricing.json
   */
  async getCustomerPricing(customerId: string): Promise<EmailPricingResponse> {
    const client = getResellerClubClient();
    return client.get<EmailPricingResponse>('/eelite/customer-pricing.json', {
      'customer-id': customerId,
    });
  },

  /**
   * Get reseller pricing for email plans
   * GET /api/eelite/reseller-pricing.json
   */
  async getResellerPricing(): Promise<EmailPricingResponse> {
    const client = getResellerClubClient();
    return client.get<EmailPricingResponse>('/eelite/reseller-pricing.json');
  },

  // --------------------------------------------------------------------------
  // DNS Records
  // --------------------------------------------------------------------------

  /**
   * Get DNS records required for email
   * GET /api/eelite/dns-records.json
   */
  async getDnsRecords(orderId: string): Promise<EmailDnsRecords> {
    const client = getResellerClubClient();
    
    const response = await client.get<Record<string, unknown>>('/eelite/dns-records.json', {
      'order-id': orderId,
    });

    return mapDnsRecordsResponse(response);
  },
};

// ============================================================================
// Response Mappers
// ============================================================================

function mapOrderDetailsResponse(data: Record<string, unknown>): EmailOrderDetails {
  return {
    orderId: String(data.entityid || data.orderid || ''),
    entityId: String(data.entityid || ''),
    domainName: String(data.domainname || ''),
    customerId: String(data.customerid || ''),
    currentStatus: (data.currentstatus as EmailOrderDetails['currentStatus']) || 'Pending',
    numberOfAccounts: Number(data.noofaccounts || 0),
    usedAccounts: Number(data.usedaccounts || 0),
    creationTime: String(data.creationtime || ''),
    endTime: String(data.endtime || ''),
    productKey: (data.productkey as EmailOrderDetails['productKey']) || 'eeliteus',
    productName: String(data.productname || 'Business Email'),
    emailAccounts: mapEmailAccounts(data.emailaccounts as Record<string, unknown> | undefined),
  };
}

function mapEmailAccounts(data?: Record<string, unknown>): EmailOrderDetails['emailAccounts'] {
  if (!data) return [];
  
  return Object.values(data).map((account: unknown) => {
    const acc = account as Record<string, unknown>;
    return {
      email: String(acc.email || ''),
      firstName: String(acc.firstname || ''),
      lastName: String(acc.lastname || ''),
      status: (acc.status as 'active' | 'suspended' | 'deleted') || 'active',
      createdAt: String(acc.creationtime || ''),
      lastLogin: acc.lastlogin ? String(acc.lastlogin) : undefined,
    };
  });
}

function mapDnsRecordsResponse(data: Record<string, unknown>): EmailDnsRecords {
  const mxRecords = (data.mx as Array<Record<string, unknown>>) || [];
  
  return {
    mx: mxRecords.map(mx => ({
      priority: Number(mx.priority || 10),
      host: String(mx.host || ''),
      ttl: Number(mx.ttl || 3600),
    })),
    spf: {
      host: '@',
      value: String(data.spf || 'v=spf1 include:spf.titan.email ~all'),
      ttl: 3600,
    },
    dkim: data.dkim ? {
      host: String((data.dkim as Record<string, unknown>).host || ''),
      value: String((data.dkim as Record<string, unknown>).value || ''),
      ttl: 3600,
    } : undefined,
  };
}

export { businessEmailApi };
```

### Task 3: Email Order Service (60 mins)

```typescript
// src/lib/resellerclub/email/order-service.ts

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { businessEmailApi } from './client';
import { cloudflareApi } from '@/lib/cloudflare';
import type { 
  CreateEmailOrderParams, 
  EmailOrder,
  EmailOrderDetails,
} from './types';

// ============================================================================
// Email Order Service
// ============================================================================

export const emailOrderService = {
  /**
   * Create a new email order with database sync
   */
  async createOrder(params: {
    agencyId: string;
    clientId?: string;
    domainId?: string;
    domainName: string;
    customerId: string;
    numberOfAccounts: number;
    months: number;
    retailPrice: number;
    currency?: string;
  }): Promise<EmailOrder> {
    const adminClient = createAdminClient();
    
    // 1. Create order in ResellerClub
    const rcResult = await businessEmailApi.createOrder({
      domainName: params.domainName,
      customerId: params.customerId,
      numberOfAccounts: params.numberOfAccounts,
      months: params.months,
    });

    // 2. Get order details from ResellerClub
    const orderDetails = await businessEmailApi.getOrderDetails(rcResult.orderId);

    // 3. Get pricing info
    const pricing = await businessEmailApi.getResellerPricing();
    const wholesalePrice = calculateWholesalePrice(pricing, orderDetails.productKey, params.months, params.numberOfAccounts);

    // 4. Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + params.months);

    // 5. Save to database
    const { data: emailOrder, error } = await adminClient
      .from('email_orders')
      .insert({
        agency_id: params.agencyId,
        client_id: params.clientId,
        domain_id: params.domainId,
        resellerclub_order_id: rcResult.orderId,
        resellerclub_customer_id: params.customerId,
        domain_name: params.domainName,
        product_key: orderDetails.productKey,
        number_of_accounts: params.numberOfAccounts,
        used_accounts: 0,
        status: 'Active',
        start_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
        wholesale_price: wholesalePrice,
        retail_price: params.retailPrice,
        currency: params.currency || 'USD',
      })
      .select()
      .single();

    if (error) throw error;
    return emailOrder;
  },

  /**
   * Get email order by ID
   */
  async getOrder(orderId: string): Promise<EmailOrder | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('email_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Get email order by domain
   */
  async getOrderByDomain(domainName: string, agencyId: string): Promise<EmailOrder | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('email_orders')
      .select('*')
      .eq('domain_name', domainName)
      .eq('agency_id', agencyId)
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Sync order details from ResellerClub
   */
  async syncOrder(orderId: string): Promise<EmailOrder> {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get local order
    const { data: localOrder, error: fetchError } = await supabase
      .from('email_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !localOrder) {
      throw new Error('Order not found');
    }

    // Get details from ResellerClub
    const rcDetails = await businessEmailApi.getOrderDetails(localOrder.resellerclub_order_id);

    // Update local order
    const { data: updatedOrder, error: updateError } = await adminClient
      .from('email_orders')
      .update({
        status: rcDetails.currentStatus,
        number_of_accounts: rcDetails.numberOfAccounts,
        used_accounts: rcDetails.usedAccounts,
        expiry_date: new Date(parseInt(rcDetails.endTime) * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedOrder;
  },

  /**
   * Configure DNS for email
   */
  async configureDns(orderId: string, cloudflareZoneId: string): Promise<void> {
    const supabase = await createClient();
    
    // Get order
    const { data: order, error } = await supabase
      .from('email_orders')
      .select('resellerclub_order_id, domain_id')
      .eq('id', orderId)
      .single();

    if (error || !order) throw new Error('Order not found');

    // Get DNS records from ResellerClub
    const dnsRecords = await businessEmailApi.getDnsRecords(order.resellerclub_order_id);

    // Add MX records
    for (const mx of dnsRecords.mx) {
      await cloudflareApi.dns.createRecord({
        zoneId: cloudflareZoneId,
        type: 'MX',
        name: '@',
        content: mx.host,
        priority: mx.priority,
        ttl: mx.ttl,
      });
    }

    // Add SPF record
    await cloudflareApi.dns.createRecord({
      zoneId: cloudflareZoneId,
      type: 'TXT',
      name: dnsRecords.spf.host,
      content: dnsRecords.spf.value,
      ttl: dnsRecords.spf.ttl,
    });

    // Add DKIM record if available
    if (dnsRecords.dkim) {
      await cloudflareApi.dns.createRecord({
        zoneId: cloudflareZoneId,
        type: 'TXT',
        name: dnsRecords.dkim.host,
        content: dnsRecords.dkim.value,
        ttl: dnsRecords.dkim.ttl,
      });
    }

    // Update domain with email DNS configured flag
    if (order.domain_id) {
      await supabase
        .from('domains')
        .update({ email_dns_configured: true })
        .eq('id', order.domain_id);
    }
  },
};

function calculateWholesalePrice(
  pricing: Record<string, Record<string, { addnewaccount: string }>>,
  productKey: string,
  months: number,
  accounts: number
): number {
  const productPricing = pricing[productKey];
  if (!productPricing) return 0;
  
  const monthPricing = productPricing[String(months)];
  if (!monthPricing) return 0;
  
  return parseFloat(monthPricing.addnewaccount) * accounts;
}
```

### Task 4: Email Account Service (45 mins)

```typescript
// src/lib/resellerclub/email/account-service.ts

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { businessEmailApi } from './client';
import type { 
  AddEmailAccountParams,
  EmailAccount,
} from './types';

// ============================================================================
// Email Account Service
// ============================================================================

export const emailAccountService = {
  /**
   * Add a new email account
   */
  async createAccount(params: {
    emailOrderId: string;
    username: string; // Just the part before @
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<EmailAccount> {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get email order
    const { data: order, error: orderError } = await supabase
      .from('email_orders')
      .select('resellerclub_order_id, domain_name, used_accounts, number_of_accounts')
      .eq('id', params.emailOrderId)
      .single();

    if (orderError || !order) {
      throw new Error('Email order not found');
    }

    // Check account limit
    if (order.used_accounts >= order.number_of_accounts) {
      throw new Error('Account limit reached. Please upgrade your plan.');
    }

    const fullEmail = `${params.username}@${order.domain_name}`;

    // Create account in ResellerClub
    await businessEmailApi.addEmailAccount({
      orderId: order.resellerclub_order_id,
      email: fullEmail,
      password: params.password,
      firstName: params.firstName,
      lastName: params.lastName,
    });

    // Save to database
    const { data: account, error: insertError } = await adminClient
      .from('email_accounts')
      .insert({
        email_order_id: params.emailOrderId,
        email: fullEmail,
        first_name: params.firstName,
        last_name: params.lastName,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update used accounts count
    await adminClient
      .from('email_orders')
      .update({ used_accounts: order.used_accounts + 1 })
      .eq('id', params.emailOrderId);

    return account;
  },

  /**
   * Delete an email account
   */
  async deleteAccount(accountId: string): Promise<void> {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get account with order
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select(`
        *,
        email_order:email_orders(resellerclub_order_id, used_accounts)
      `)
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Email account not found');
    }

    // Delete in ResellerClub
    await businessEmailApi.deleteEmailAccount({
      orderId: account.email_order.resellerclub_order_id,
      email: account.email,
    });

    // Update database - mark as deleted (soft delete)
    await adminClient
      .from('email_accounts')
      .update({ status: 'deleted' })
      .eq('id', accountId);

    // Update used accounts count
    await adminClient
      .from('email_orders')
      .update({ used_accounts: Math.max(0, account.email_order.used_accounts - 1) })
      .eq('id', account.email_order_id);
  },

  /**
   * List email accounts for an order
   */
  async listAccounts(emailOrderId: string): Promise<EmailAccount[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('email_order_id', emailOrderId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Sync accounts from ResellerClub
   */
  async syncAccounts(emailOrderId: string): Promise<void> {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get order
    const { data: order, error: orderError } = await supabase
      .from('email_orders')
      .select('resellerclub_order_id')
      .eq('id', emailOrderId)
      .single();

    if (orderError || !order) {
      throw new Error('Email order not found');
    }

    // Get details from ResellerClub
    const rcDetails = await businessEmailApi.getOrderDetails(order.resellerclub_order_id);

    // Sync each account
    for (const rcAccount of rcDetails.emailAccounts) {
      await adminClient
        .from('email_accounts')
        .upsert({
          email_order_id: emailOrderId,
          email: rcAccount.email,
          first_name: rcAccount.firstName,
          last_name: rcAccount.lastName,
          status: rcAccount.status,
          last_login: rcAccount.lastLogin,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'email_order_id,email',
        });
    }
  },
};
```

### Task 5: Server Actions (60 mins)

```typescript
// src/lib/actions/email.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { emailOrderService, emailAccountService, businessEmailApi } from "@/lib/resellerclub/email";
import type { EmailOrder, EmailAccount, EmailPricingResponse } from "@/lib/resellerclub/email/types";

// ============================================================================
// Email Order Actions
// ============================================================================

export async function createEmailOrder(formData: FormData) {
  const supabase = await createClient();
  
  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  // Get user's agency
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };

  try {
    const domainId = formData.get('domainId') as string | null;
    const domainName = formData.get('domainName') as string;
    const numberOfAccounts = parseInt(formData.get('numberOfAccounts') as string);
    const months = parseInt(formData.get('months') as string);
    const clientId = formData.get('clientId') as string | null;

    // Get customer ID from agency or create one
    const { data: agency } = await supabase
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', profile.agency_id)
      .single();

    if (!agency?.resellerclub_customer_id) {
      return { success: false, error: 'Agency not configured for domain services' };
    }

    // Calculate retail price based on agency markup
    const { data: pricing } = await supabase
      .from('agency_domain_pricing')
      .select('default_markup_type, default_markup_value')
      .eq('agency_id', profile.agency_id)
      .single();

    const wholesalePricing = await businessEmailApi.getResellerPricing();
    const basePrice = calculateBasePrice(wholesalePricing, months, numberOfAccounts);
    const retailPrice = applyMarkup(basePrice, pricing?.default_markup_type || 'percentage', pricing?.default_markup_value || 30);

    const order = await emailOrderService.createOrder({
      agencyId: profile.agency_id,
      clientId: clientId || undefined,
      domainId: domainId || undefined,
      domainName,
      customerId: agency.resellerclub_customer_id,
      numberOfAccounts,
      months,
      retailPrice,
    });

    revalidatePath('/dashboard/domains');
    revalidatePath('/dashboard/email');
    
    return { success: true, data: order };
  } catch (error) {
    console.error('Create email order error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create email order' 
    };
  }
}

export async function getEmailOrders() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };

  const { data, error } = await supabase
    .from('email_orders')
    .select(`
      *,
      domain:domains(id, domain_name, status),
      client:clients(id, name)
    `)
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function configureEmailDns(orderId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get order with domain
    const { data: order } = await supabase
      .from('email_orders')
      .select(`
        *,
        domain:domains(cloudflare_zone_id)
      `)
      .eq('id', orderId)
      .single();

    if (!order?.domain?.cloudflare_zone_id) {
      return { success: false, error: 'Domain not configured with Cloudflare' };
    }

    await emailOrderService.configureDns(orderId, order.domain.cloudflare_zone_id);
    
    revalidatePath(`/dashboard/domains/${order.domain_id}`);
    revalidatePath('/dashboard/email');
    
    return { success: true };
  } catch (error) {
    console.error('Configure email DNS error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to configure DNS' 
    };
  }
}

// ============================================================================
// Email Account Actions
// ============================================================================

export async function createEmailAccount(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const emailOrderId = formData.get('emailOrderId') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    // Verify user has access to this order
    const { data: order } = await supabase
      .from('email_orders')
      .select('id')
      .eq('id', emailOrderId)
      .single();

    if (!order) {
      return { success: false, error: 'Email order not found' };
    }

    const account = await emailAccountService.createAccount({
      emailOrderId,
      username,
      password,
      firstName,
      lastName,
    });

    revalidatePath(`/dashboard/email/${emailOrderId}`);
    
    return { success: true, data: account };
  } catch (error) {
    console.error('Create email account error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create email account' 
    };
  }
}

export async function deleteEmailAccount(accountId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    await emailAccountService.deleteAccount(accountId);
    
    revalidatePath('/dashboard/email');
    
    return { success: true };
  } catch (error) {
    console.error('Delete email account error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete email account' 
    };
  }
}

export async function getEmailAccounts(emailOrderId: string) {
  try {
    const accounts = await emailAccountService.listAccounts(emailOrderId);
    return { success: true, data: accounts };
  } catch (error) {
    console.error('Get email accounts error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get email accounts' 
    };
  }
}

// ============================================================================
// Pricing Actions
// ============================================================================

export async function getEmailPricing() {
  try {
    const pricing = await businessEmailApi.getResellerPricing();
    return { success: true, data: pricing };
  } catch (error) {
    console.error('Get email pricing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get pricing' 
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateBasePrice(
  pricing: EmailPricingResponse,
  months: number,
  accounts: number
): number {
  // Default to US pricing
  const productPricing = pricing['eeliteus'];
  if (!productPricing) return 0;
  
  const monthPricing = productPricing[String(months)];
  if (!monthPricing) return 0;
  
  return parseFloat(monthPricing.addnewaccount) * accounts;
}

function applyMarkup(
  basePrice: number,
  markupType: string,
  markupValue: number
): number {
  switch (markupType) {
    case 'percentage':
      return basePrice * (1 + markupValue / 100);
    case 'fixed':
      return basePrice + markupValue;
    default:
      return basePrice;
  }
}
```

### Task 6: Database Migration (30 mins)

```sql
-- migrations/dm-07-email-schema.sql

-- ============================================================================
-- EMAIL ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  
  -- ResellerClub Integration
  resellerclub_order_id TEXT NOT NULL UNIQUE,
  resellerclub_customer_id TEXT NOT NULL,
  
  -- Order Details
  domain_name TEXT NOT NULL,
  product_key TEXT NOT NULL DEFAULT 'eeliteus',
  number_of_accounts INTEGER NOT NULL DEFAULT 1,
  used_accounts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_date TIMESTAMPTZ NOT NULL,
  
  -- Pricing
  wholesale_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  retail_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_orders_agency ON email_orders(agency_id);
CREATE INDEX idx_email_orders_domain ON email_orders(domain_id);
CREATE INDEX idx_email_orders_status ON email_orders(status);
CREATE INDEX idx_email_orders_expiry ON email_orders(expiry_date);
CREATE INDEX idx_email_orders_rc_order ON email_orders(resellerclub_order_id);

-- ============================================================================
-- EMAIL ACCOUNTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_order_id UUID NOT NULL REFERENCES email_orders(id) ON DELETE CASCADE,
  
  -- Account Details
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  
  -- Usage Stats
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 10737418240, -- 10GB default
  last_login TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique email per order
  UNIQUE(email_order_id, email)
);

-- Indexes
CREATE INDEX idx_email_accounts_order ON email_accounts(email_order_id);
CREATE INDEX idx_email_accounts_status ON email_accounts(status);

-- ============================================================================
-- ADD EMAIL DNS FLAG TO DOMAINS TABLE
-- ============================================================================

ALTER TABLE domains 
ADD COLUMN IF NOT EXISTS email_dns_configured BOOLEAN DEFAULT false;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE email_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- Email Orders RLS
CREATE POLICY "Users can view email orders for their agency"
  ON email_orders FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create email orders for their agency"
  ON email_orders FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update email orders for their agency"
  ON email_orders FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Email Accounts RLS
CREATE POLICY "Users can view email accounts for their orders"
  ON email_accounts FOR SELECT
  USING (
    email_order_id IN (
      SELECT id FROM email_orders WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create email accounts for their orders"
  ON email_accounts FOR INSERT
  WITH CHECK (
    email_order_id IN (
      SELECT id FROM email_orders WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update email accounts for their orders"
  ON email_accounts FOR UPDATE
  USING (
    email_order_id IN (
      SELECT id FROM email_orders WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_email_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_orders_updated_at
  BEFORE UPDATE ON email_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_email_orders_updated_at();

CREATE TRIGGER trigger_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_orders_updated_at();
```

### Task 7: Barrel Exports (15 mins)

```typescript
// src/lib/resellerclub/email/index.ts

export * from './types';
export { businessEmailApi } from './client';
export { emailOrderService } from './order-service';
export { emailAccountService } from './account-service';
```

```typescript
// Update src/lib/resellerclub/index.ts to include email

export * from './client';
export * from './config';
export * from './types';
export * from './domains';
export * from './contacts';
export * from './customers';
export * from './orders';
export * from './errors';
export * from './utils';

// Email exports
export * from './email';
```

---

## ✅ Verification Checklist

- [ ] Business Email types match ResellerClub API responses
- [ ] API client correctly hits `/api/eelite/` endpoints
- [ ] Order creation flow works end-to-end
- [ ] Email account creation/deletion works
- [ ] DNS records can be retrieved and applied
- [ ] Database schema supports all required data
- [ ] RLS policies correctly restrict access
- [ ] Server actions handle errors gracefully
- [ ] Pricing calculations are accurate

---

## 🔗 Dependencies

### Requires from Previous Phases:
- **DM-01**: `getResellerClubClient()` function
- **DM-02**: `agencies`, `domains` tables
- **DM-03**: `cloudflareApi.dns.createRecord()` function

### Provides to Next Phases:
- **DM-08**: Email management UI will consume these services
- **DM-10**: Billing integration will use pricing functions

---

## 📚 ResellerClub API Documentation

- Business Email API: https://manage.resellerclub.com/kb/answer/2155
- Email Service Management: https://manage.resellerclub.com/kb/answer/1033
- Product Keys: https://manage.resellerclub.com/kb/answer/1918
- API Authentication: https://manage.resellerclub.com/kb/answer/753
