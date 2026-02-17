// src/lib/resellerclub/email/types.ts
// Business Email (Titan) Types via ResellerClub API

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

/**
 * RC Business Email pricing response structure (confirmed from RC API docs).
 * Structure: productKey → email_account_ranges → slab (e.g. "1-5") → action → tenure-in-months → price
 *
 * Example: { "eeliteus": { "email_account_ranges": { "1-5": { "add": { "1": 0.86, "12": 10.20 }, "renew": { ... } }, "6-25": { ... } } } }
 *
 * Prices are TOTAL for the tenure per-account (NOT per-month).
 * E.g. add["12"] = 10.20 means $10.20 total for 12 months for 1 account.
 */
export interface EmailPricingResponse {
  [productKey: string]: {
    email_account_ranges?: {
      [slab: string]: {
        add?: Record<string, number>;
        renew?: Record<string, number>;
      };
    };
    // Legacy fallback shape (should not appear, but be defensive)
    [key: string]: unknown;
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
  client_id?: string | null;
  domain_id?: string | null;
  
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
  storage_used?: number | null;
  storage_limit?: number | null;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Service Types
// ============================================================================

export interface CreateEmailOrderInput {
  agencyId: string;
  clientId?: string;
  domainId?: string;
  domainName: string;
  customerId: string;
  numberOfAccounts: number;
  months: number;
  retailPrice: number;
  currency?: string;
}

export interface CreateEmailAccountInput {
  emailOrderId: string;
  username: string; // Just the part before @
  password: string;
  firstName: string;
  lastName: string;
}
