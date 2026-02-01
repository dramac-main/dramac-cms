// src/lib/resellerclub/types.ts
// ResellerClub API Type Definitions

// ============================================================================
// API Response Types
// ============================================================================

export interface ResellerClubApiError {
  code: string;
  message: string;
  status: number;
}

// ============================================================================
// Domain Types
// ============================================================================

export interface DomainAvailability {
  domain: string;
  status: 'available' | 'unavailable' | 'premium' | 'unknown';
  classKey?: string;
  price?: DomainPrice;
  premium?: {
    price: number;
    currency: string;
  };
}

export interface DomainPrice {
  register: {
    1: number;
    2?: number;
    3?: number;
    5?: number;
    10?: number;
  };
  renew: {
    1: number;
    2?: number;
    3?: number;
    5?: number;
    10?: number;
  };
  transfer: number;
  restore?: number;
  currency: string;
}

export interface DomainDetails {
  orderId: string;
  domainName: string;
  currentStatus: 'Active' | 'InActive' | 'Pending' | 'Deleted' | 'Expired';
  creationDate: string;
  expiryDate: string;
  autoRenew: boolean;
  privacyProtection: boolean;
  transferLock: boolean;
  registrantContactId: string;
  adminContactId: string;
  techContactId: string;
  billingContactId: string;
  nameservers: string[];
}

export interface DomainRegistrationParams {
  domainName: string;
  years: number;
  customerId: string;
  registrantContactId: string;
  adminContactId: string;
  techContactId: string;
  billingContactId: string;
  purchasePrivacy?: boolean;
  autoRenew?: boolean;
  nameservers?: string[];
  invoiceOption?: 'NoInvoice' | 'PayInvoice' | 'KeepInvoice';
}

export interface DomainRenewalParams {
  orderId: string;
  years: number;
  invoiceOption?: 'NoInvoice' | 'PayInvoice' | 'KeepInvoice';
}

export interface DomainTransferParams {
  domainName: string;
  authCode: string;
  customerId: string;
  registrantContactId: string;
  adminContactId: string;
  techContactId: string;
  billingContactId: string;
  invoiceOption?: 'NoInvoice' | 'PayInvoice' | 'KeepInvoice';
}

// ============================================================================
// Contact Types
// ============================================================================

export interface Contact {
  contactId: string;
  type: 'Contact' | 'CoopContact' | 'UkContact' | 'EuContact';
  name: string;
  company?: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  phoneCountryCode: string;
  phone: string;
  faxCountryCode?: string;
  fax?: string;
}

export interface ContactCreateParams {
  name: string;
  company?: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  state: string;
  country: string; // 2-letter country code
  zipcode: string;
  phoneCountryCode: string;
  phone: string;
  faxCountryCode?: string;
  fax?: string;
  customerId: string;
  type?: 'Contact' | 'CoopContact' | 'UkContact' | 'EuContact';
}

// ============================================================================
// Customer Types
// ============================================================================

export interface Customer {
  customerId: string;
  username: string;
  name: string;
  company?: string;
  email: string;
  status: 'Active' | 'Suspended' | 'Deleted';
  parentId?: string;
  totalReceipts?: number;
  pinMode?: boolean;
  languagePreference?: string;
}

export interface CustomerCreateParams {
  username: string;
  password: string;
  name: string;
  company?: string;
  email: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  phoneCountryCode: string;
  phone: string;
  languagePreference?: string;
}

// ============================================================================
// Order Types
// ============================================================================

export interface Order {
  orderId: string;
  description: string;
  domainName?: string;
  currentStatus: string;
  orderType: 'domainregistration' | 'domainrenewal' | 'domaintransfer';
  creationTime: string;
  customerId: string;
  amount: number;
  currency: string;
}

export interface Transaction {
  transactionId: string;
  transactionType: string;
  description: string;
  amount: number;
  currency: string;
  transactionDate: string;
  balance: number;
}

// ============================================================================
// Search/List Response Types
// ============================================================================

export interface SearchResponse<T> {
  recsindb: string;
  recsonpage: string;
  result: T[];
}

export interface DomainSearchResult {
  entityid: string;
  entity: string;
  description: string;
  currentstatus: string;
  endtime: string;
  creationdt: string;
}

// ============================================================================
// Business Email Types (via ResellerClub EElite API)
// ============================================================================

export interface EmailOrderParams {
  domainName: string;
  customerId: string;
  numberOfAccounts: number;
  invoiceOption?: 'NoInvoice' | 'PayInvoice' | 'KeepInvoice';
}

export interface EmailAccountCreateParams {
  orderId: string;
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  countryCode?: string;
  languageCode?: string;
}

export interface EmailAccount {
  emailAccountId: string;
  email: string;
  firstName: string;
  lastName?: string;
  status: 'active' | 'suspended' | 'deleted';
  quotaUsed?: number;
  quotaLimit?: number;
}

// ============================================================================
// Pricing Types
// ============================================================================

export interface TldPricing {
  addnewdomain1: number;
  addnewdomain2?: number;
  addnewdomain3?: number;
  addnewdomain5?: number;
  addnewdomain10?: number;
  renewdomain1: number;
  renewdomain2?: number;
  renewdomain3?: number;
  renewdomain5?: number;
  renewdomain10?: number;
  transferdomain1: number;
  restoredomain1?: number;
}

// ============================================================================
// DNS Types (ResellerClub DNS API)
// ============================================================================

export interface DnsRecordParams {
  orderId: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV';
  host: string;
  value: string;
  ttl?: number;
  priority?: number; // For MX records
}

export interface DnsRecord {
  host: string;
  type: string;
  value: string;
  ttl: number;
  priority?: number;
}
