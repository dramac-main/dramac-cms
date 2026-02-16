// src/types/domain.ts
// Domain Module TypeScript Type Definitions

// ============================================================================
// Domain Status Enums
// ============================================================================

export type DomainStatus = 
  | 'pending'
  | 'active'
  | 'expired'
  | 'suspended'
  | 'transferred'
  | 'cancelled'
  | 'redemption';

export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA' | 'PTR';

export type DnsRecordStatus = 'pending' | 'active' | 'error' | 'deleting';

export type EmailAccountType = 'mailbox' | 'alias' | 'forwarder' | 'group';

export type EmailAccountStatus = 'pending' | 'active' | 'suspended' | 'cancelled';

export type DomainOrderType = 'registration' | 'renewal' | 'transfer' | 'privacy' | 'email';

export type DomainOrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type TransferDirection = 'in' | 'out';

export type TransferStatus = 
  | 'pending'
  | 'auth_required'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type MarkupType = 'percentage' | 'fixed' | 'custom';

export type CloudflareZoneStatus = 'pending' | 'active' | 'moved' | 'deleted' | 'deactivated';

export type SslMode = 'off' | 'flexible' | 'full' | 'strict';

export type EmailPlanType = 'starter' | 'business' | 'enterprise';

export type BillingCycle = 'monthly' | 'yearly';

// ============================================================================
// Base Database Types
// ============================================================================

export interface Domain {
  id: string;
  agency_id: string;
  client_id: string | null;
  site_id: string | null;
  domain_name: string;
  tld: string;
  sld: string;
  resellerclub_order_id: string | null;
  resellerclub_customer_id: string | null;
  registration_date: string | null;
  expiry_date: string | null;
  last_renewed_at: string | null;
  status: DomainStatus;
  cloudflare_zone_id: string | null;
  nameservers: string[];
  dns_configured: boolean;
  dns_verified_at: string | null;
  auto_renew: boolean;
  whois_privacy: boolean;
  transfer_lock: boolean;
  registrant_contact_id: string | null;
  admin_contact_id: string | null;
  tech_contact_id: string | null;
  billing_contact_id: string | null;
  wholesale_price: number | null;
  retail_price: number | null;
  currency: string;
  notes: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DomainInsert {
  id?: string;
  agency_id: string;
  client_id?: string | null;
  site_id?: string | null;
  domain_name: string;
  tld: string;
  sld: string;
  resellerclub_order_id?: string | null;
  resellerclub_customer_id?: string | null;
  registration_date?: string | null;
  expiry_date?: string | null;
  status?: DomainStatus;
  cloudflare_zone_id?: string | null;
  nameservers?: string[];
  dns_configured?: boolean;
  auto_renew?: boolean;
  whois_privacy?: boolean;
  transfer_lock?: boolean;
  registrant_contact_id?: string | null;
  admin_contact_id?: string | null;
  tech_contact_id?: string | null;
  billing_contact_id?: string | null;
  wholesale_price?: number | null;
  retail_price?: number | null;
  currency?: string;
  notes?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface DomainUpdate {
  client_id?: string | null;
  site_id?: string | null;
  resellerclub_order_id?: string | null;
  resellerclub_customer_id?: string | null;
  registration_date?: string | null;
  expiry_date?: string | null;
  last_renewed_at?: string | null;
  status?: DomainStatus;
  cloudflare_zone_id?: string | null;
  nameservers?: string[];
  dns_configured?: boolean;
  dns_verified_at?: string | null;
  auto_renew?: boolean;
  whois_privacy?: boolean;
  transfer_lock?: boolean;
  registrant_contact_id?: string | null;
  admin_contact_id?: string | null;
  tech_contact_id?: string | null;
  billing_contact_id?: string | null;
  wholesale_price?: number | null;
  retail_price?: number | null;
  notes?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface DomainDnsRecord {
  id: string;
  domain_id: string;
  record_type: DnsRecordType;
  name: string;
  content: string;
  ttl: number;
  priority: number | null;
  proxied: boolean;
  cloudflare_record_id: string | null;
  status: DnsRecordStatus;
  last_synced_at: string | null;
  error_message: string | null;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DomainDnsRecordInsert {
  id?: string;
  domain_id: string;
  record_type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  priority?: number | null;
  proxied?: boolean;
  cloudflare_record_id?: string | null;
  status?: DnsRecordStatus;
  created_by?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DomainEmailAccount {
  id: string;
  domain_id: string;
  agency_id: string;
  email_address: string;
  display_name: string | null;
  account_type: EmailAccountType;
  forward_to: string[] | null;
  resellerclub_email_account_id: string | null;
  resellerclub_email_order_id: string | null;
  resellerclub_email_subscription_id: string | null;
  mailbox_size_gb: number;
  storage_used_mb: number;
  status: EmailAccountStatus;
  monthly_price: number | null;
  next_billing_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DomainEmailAccountInsert {
  id?: string;
  domain_id: string;
  agency_id: string;
  email_address: string;
  display_name?: string | null;
  account_type?: EmailAccountType;
  forward_to?: string[] | null;
  resellerclub_email_account_id?: string | null;
  resellerclub_email_order_id?: string | null;
  resellerclub_email_subscription_id?: string | null;
  mailbox_size_gb?: number;
  status?: EmailAccountStatus;
  monthly_price?: number | null;
  next_billing_date?: string | null;
}

export interface DomainOrder {
  id: string;
  agency_id: string;
  domain_id: string | null;
  order_type: DomainOrderType;
  domain_name: string;
  years: number | null;
  wholesale_price: number;
  retail_price: number;
  platform_fee: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_method: string | null;
  paddle_transaction_id: string | null;
  resellerclub_order_id: string | null;
  resellerclub_invoice_id: string | null;
  status: DomainOrderStatus;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface DomainOrderInsert {
  id?: string;
  agency_id: string;
  domain_id?: string | null;
  order_type: DomainOrderType;
  domain_name: string;
  years?: number | null;
  wholesale_price: number;
  retail_price: number;
  platform_fee?: number;
  currency?: string;
  payment_status?: PaymentStatus;
  payment_method?: string | null;
  paddle_transaction_id?: string | null;
  resellerclub_order_id?: string | null;
  resellerclub_invoice_id?: string | null;
  status?: DomainOrderStatus;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DomainTransfer {
  id: string;
  agency_id: string;
  domain_id: string | null;
  direction: TransferDirection;
  domain_name: string;
  status: TransferStatus;
  auth_code_hash: string | null;
  resellerclub_transfer_id: string | null;
  wholesale_price: number | null;
  retail_price: number | null;
  initiated_at: string;
  approved_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  error_message: string | null;
  retry_count: number;
  notes: string | null;
  metadata: Record<string, unknown>;
}

export interface DomainTransferInsert {
  id?: string;
  agency_id: string;
  domain_id?: string | null;
  direction: TransferDirection;
  domain_name: string;
  status?: TransferStatus;
  auth_code_hash?: string | null;
  resellerclub_transfer_id?: string | null;
  wholesale_price?: number | null;
  retail_price?: number | null;
  expires_at?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DomainPricing {
  id: string;
  agency_id: string;
  tld: string | null;
  markup_type: MarkupType;
  markup_value: number;
  min_markup: number | null;
  max_markup: number | null;
  email_markup_type: string | null;
  email_markup_value: number | null;
  enabled: boolean;
  show_wholesale_to_clients: boolean;
  created_at: string;
  updated_at: string;
}

export interface DomainPricingInsert {
  id?: string;
  agency_id: string;
  tld?: string | null;
  markup_type?: MarkupType;
  markup_value?: number;
  min_markup?: number | null;
  max_markup?: number | null;
  email_markup_type?: string | null;
  email_markup_value?: number | null;
  enabled?: boolean;
  show_wholesale_to_clients?: boolean;
}

export interface CloudflareZone {
  id: string;
  domain_id: string;
  zone_id: string;
  account_id: string | null;
  name: string;
  status: CloudflareZoneStatus;
  assigned_nameservers: string[];
  original_nameservers: string[];
  plan: string;
  ssl_mode: SslMode;
  always_https: boolean;
  min_tls_version: string;
  created_at: string;
  activated_at: string | null;
  metadata: Record<string, unknown>;
}

export interface EmailSubscription {
  id: string;
  agency_id: string;
  domain_id: string;
  resellerclub_email_subscription_id: string | null;
  resellerclub_email_order_id: string | null;
  plan_type: EmailPlanType;
  max_mailboxes: number;
  current_mailboxes: number;
  billing_cycle: BillingCycle;
  price_per_mailbox: number | null;
  next_billing_date: string | null;
  status: 'active' | 'past_due' | 'suspended' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface DomainContact {
  id: string;
  agency_id: string;
  resellerclub_contact_id: string;
  resellerclub_customer_id: string | null;
  contact_type: 'Contact' | 'CoopContact' | 'UkContact' | 'EuContact' | 'CnContact';
  name: string;
  company: string | null;
  email: string;
  address_line_1: string;
  address_line_2: string | null;
  address_line_3: string | null;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  phone_country_code: string;
  phone: string;
  fax_country_code: string | null;
  fax: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Extended Types (with relations)
// ============================================================================

export interface DomainWithDetails extends Domain {
  client?: {
    id: string;
    name: string;
    company: string | null;
  } | null;
  site?: {
    id: string;
    name: string;
    subdomain: string;
  } | null;
  dns_records?: DomainDnsRecord[];
  cloudflare_zone?: CloudflareZone | null;
  email_accounts_count?: number;
}

export interface DomainWithDns extends Domain {
  dns_records: DomainDnsRecord[];
}

export interface DomainWithEmail extends Domain {
  email_accounts: DomainEmailAccount[];
  email_subscription?: EmailSubscription | null;
}

export interface DomainOrderWithDomain extends DomainOrder {
  domain?: Domain | null;
}

// ============================================================================
// Search & Filter Types
// ============================================================================

export interface DomainFilters {
  search?: string;
  status?: DomainStatus | 'all';
  tld?: string;
  clientId?: string;
  expiringWithinDays?: number;
  hasEmail?: boolean;
  hasCloudflare?: boolean;
  sortBy?: 'domain_name' | 'created_at' | 'expiry_date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DomainSearchResult {
  domain: string;
  tld: string;
  available: boolean;
  premium: boolean;
  /** True when the API was unavailable — availability could not be verified */
  unverified?: boolean;
  prices: {
    register: Record<number, number>;
    renew: Record<number, number>;
    transfer: number;
  };
  retailPrices: {
    register: Record<number, number>;
    renew: Record<number, number>;
    transfer: number;
  };
}

// ============================================================================
// Action Types
// ============================================================================

export interface RegisterDomainParams {
  domainName: string;
  years: number;
  clientId?: string;
  contactInfo: {
    name: string;
    email: string;
    company?: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
    phone: string;
  };
  privacy?: boolean;
  autoRenew?: boolean;
  customNameservers?: string[];
}

export interface RenewDomainParams {
  domainId: string;
  years: number;
}

export interface TransferDomainParams {
  domainName: string;
  authCode: string;
  contactInfo?: RegisterDomainParams['contactInfo'];
}

export interface DnsRecordParams {
  domainId: string;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}

export interface EmailAccountParams {
  domainId: string;
  email: string; // Just the local part (before @)
  displayName?: string;
  accountType?: EmailAccountType;
  forwardTo?: string[];
  mailboxSizeGb?: number;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DomainStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  totalEmails: number;
  domainsWithEmail: number;
}

export interface ExpiringDomain {
  id: string;
  domainName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  autoRenew: boolean;
}

// ============================================================================
// Cart Types (for checkout flow)
// ============================================================================

export interface DomainCartItem {
  type: 'registration' | 'renewal' | 'transfer';
  domainName: string;
  years: number;
  /** @deprecated Use wholesalePrices map instead */
  wholesalePrice: number;
  /** @deprecated Use retailPrices map instead */
  retailPrice: number;
  /** Full wholesale prices keyed by year count from RC API */
  wholesalePrices: Record<number, number>;
  /** Full retail prices keyed by year count (with markup applied) */
  retailPrices: Record<number, number>;
  privacy: boolean;
  privacyPrice: number;
}

export interface DomainCart {
  items: DomainCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface DomainActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedDomains {
  domains: DomainWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Webhook Event Types (Automation Engine Integration)
// ============================================================================

/**
 * Domain Module Events
 * 
 * These events integrate with the Automation Engine (EM-57).
 * When implementing, emit events using:
 * 
 * import { emitEvent } from '@/lib/modules/module-events';
 * await emitEvent(domainModuleId, siteId, 'domain.domain.registered', payload);
 * 
 * Naming Convention: domain.{entity}.{action}
 */
export type DomainEventType =
  // Domain lifecycle events
  | 'domain.domain.registered'        // New domain registered
  | 'domain.domain.renewed'           // Domain renewed
  | 'domain.domain.transferred_in'    // Transfer completed
  | 'domain.domain.transferred_out'   // Transfer out initiated
  | 'domain.domain.expiring_soon'     // Expiring within X days
  | 'domain.domain.expired'           // Domain expired
  | 'domain.domain.suspended'         // Domain suspended
  | 'domain.domain.reactivated'       // Domain reactivated
  | 'domain.domain.auto_renewed'      // Auto-renewal processed
  | 'domain.domain.nameservers_changed' // Nameservers changed
  // DNS events
  | 'domain.dns.record_created'       // DNS record added
  | 'domain.dns.record_updated'       // DNS record updated
  | 'domain.dns.record_deleted'       // DNS record deleted
  | 'domain.dns.zone_created'         // Cloudflare zone created
  | 'domain.dns.ssl_provisioned'      // SSL certificate ready
  | 'domain.dns.propagation_complete' // DNS propagated
  // Email events
  | 'domain.email.subscription_created'   // Email plan purchased
  | 'domain.email.subscription_cancelled' // Email cancelled
  | 'domain.email.account_created'    // Email mailbox created
  | 'domain.email.account_deleted'    // Email mailbox deleted
  | 'domain.email.quota_warning'      // Mailbox near capacity
  // Order events
  | 'domain.order.created'            // New order placed
  | 'domain.order.completed'          // Order fulfilled
  | 'domain.order.failed'             // Order failed
  | 'domain.order.refunded'           // Order refunded
  // Transfer events
  | 'domain.transfer.initiated'       // Transfer started
  | 'domain.transfer.auth_required'   // Auth code needed
  | 'domain.transfer.approved'        // Transfer approved
  | 'domain.transfer.completed'       // Transfer done
  | 'domain.transfer.failed'          // Transfer failed
  | 'domain.transfer.cancelled';      // Transfer cancelled

export interface DomainEvent {
  type: DomainEventType;
  domainId: string;
  domainName: string;
  agencyId: string;
  siteId?: string;
  timestamp: string;
  data: Record<string, unknown>;
}
