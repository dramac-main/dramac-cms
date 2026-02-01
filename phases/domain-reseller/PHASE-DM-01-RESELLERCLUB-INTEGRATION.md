# Phase DM-01: ResellerClub API Integration

> **Priority**: 🔴 HIGH
> **Estimated Time**: 8 hours
> **Prerequisites**: None (Foundation Phase)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create a robust, type-safe ResellerClub API client for:
1. Domain availability search
2. Domain registration
3. Domain renewal
4. Domain transfers
5. Contact/Customer management
6. Pricing retrieval
7. Order management

---

## 📁 Files to Create

```
src/lib/resellerclub/
├── client.ts              # Main API client class
├── config.ts              # Configuration and constants
├── types.ts               # TypeScript interfaces
├── domains.ts             # Domain-specific operations
├── contacts.ts            # Contact management
├── customers.ts           # Customer management
├── orders.ts              # Order management
├── errors.ts              # Custom error classes
├── utils.ts               # Helper utilities
└── index.ts               # Barrel exports

src/types/
└── resellerclub.ts        # Public type exports
```

---

## 📋 Implementation Tasks

### Task 1: Configuration (30 mins)

```typescript
// src/lib/resellerclub/config.ts

export const RESELLERCLUB_CONFIG = {
  // API Configuration
  apiUrl: process.env.RESELLERCLUB_API_URL || 'https://httpapi.com/api',
  resellerId: process.env.RESELLERCLUB_RESELLER_ID!,
  apiKey: process.env.RESELLERCLUB_API_KEY!,
  sandbox: process.env.RESELLERCLUB_SANDBOX === 'true',
  
  // Default settings
  defaultPrivacy: true,
  defaultAutoRenew: true,
  defaultTransferLock: true,
  
  // Rate limiting
  maxRequestsPerSecond: 5,
  requestTimeout: 30000,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
} as const;

export const TLD_CATEGORIES = {
  popular: ['.com', '.net', '.org', '.io', '.co', '.app'],
  country: ['.uk', '.us', '.de', '.fr', '.au', '.ca', '.in'],
  business: ['.biz', '.company', '.agency', '.studio', '.consulting'],
  tech: ['.dev', '.tech', '.digital', '.cloud', '.online'],
  creative: ['.design', '.art', '.media', '.photography'],
} as const;

export const SUPPORTED_TLDS = Object.values(TLD_CATEGORIES).flat();

export function isConfigured(): boolean {
  return !!(
    RESELLERCLUB_CONFIG.resellerId &&
    RESELLERCLUB_CONFIG.apiKey
  );
}
```

### Task 2: Types Definition (45 mins)

```typescript
// src/lib/resellerclub/types.ts

// ============================================================================
// API Response Types
// ============================================================================

export interface ResellerClubResponse<T = unknown> {
  status: 'SUCCESS' | 'ERROR';
  response?: T;
  error?: ResellerClubError;
}

export interface ResellerClubError {
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
```

### Task 3: Error Classes (20 mins)

```typescript
// src/lib/resellerclub/errors.ts

export class ResellerClubError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ResellerClubError';
  }
  
  static fromResponse(response: unknown): ResellerClubError {
    if (typeof response === 'object' && response !== null) {
      const res = response as Record<string, unknown>;
      return new ResellerClubError(
        String(res.message || res.error || 'Unknown error'),
        String(res.status || 'UNKNOWN'),
        typeof res.statusCode === 'number' ? res.statusCode : undefined,
        res
      );
    }
    return new ResellerClubError('Unknown error occurred', 'UNKNOWN');
  }
}

export class DomainNotAvailableError extends ResellerClubError {
  constructor(domain: string) {
    super(`Domain ${domain} is not available`, 'DOMAIN_NOT_AVAILABLE');
  }
}

export class InsufficientFundsError extends ResellerClubError {
  constructor(required: number, available: number) {
    super(
      `Insufficient funds: required ${required}, available ${available}`,
      'INSUFFICIENT_FUNDS'
    );
  }
}

export class DomainExpiredError extends ResellerClubError {
  constructor(domain: string) {
    super(`Domain ${domain} has expired`, 'DOMAIN_EXPIRED');
  }
}

export class TransferNotAllowedError extends ResellerClubError {
  constructor(domain: string, reason: string) {
    super(`Transfer of ${domain} not allowed: ${reason}`, 'TRANSFER_NOT_ALLOWED');
  }
}

export class AuthCodeInvalidError extends ResellerClubError {
  constructor(domain: string) {
    super(`Invalid auth code for ${domain}`, 'AUTH_CODE_INVALID');
  }
}

export class ConfigurationError extends ResellerClubError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
  }
}
```

### Task 4: Main API Client (90 mins)

```typescript
// src/lib/resellerclub/client.ts

import { RESELLERCLUB_CONFIG, isConfigured } from './config';
import { 
  ResellerClubError, 
  ConfigurationError,
  InsufficientFundsError 
} from './errors';
import type { ResellerClubResponse } from './types';

type HttpMethod = 'GET' | 'POST';

interface RequestOptions {
  method?: HttpMethod;
  params?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
  timeout?: number;
}

export class ResellerClubClient {
  private baseUrl: string;
  private resellerId: string;
  private apiKey: string;
  private requestQueue: Promise<unknown> = Promise.resolve();
  private lastRequestTime = 0;
  
  constructor() {
    if (!isConfigured()) {
      throw new ConfigurationError(
        'ResellerClub API not configured. Set RESELLERCLUB_RESELLER_ID and RESELLERCLUB_API_KEY'
      );
    }
    
    this.baseUrl = RESELLERCLUB_CONFIG.apiUrl;
    this.resellerId = RESELLERCLUB_CONFIG.resellerId;
    this.apiKey = RESELLERCLUB_CONFIG.apiKey;
  }
  
  /**
   * Rate-limited request method
   */
  private async rateLimitedRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    // Queue requests to respect rate limits
    return new Promise((resolve, reject) => {
      this.requestQueue = this.requestQueue.then(async () => {
        // Enforce rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = 1000 / RESELLERCLUB_CONFIG.maxRequestsPerSecond;
        
        if (timeSinceLastRequest < minInterval) {
          await this.delay(minInterval - timeSinceLastRequest);
        }
        
        try {
          const result = await this.executeRequest<T>(endpoint, options);
          this.lastRequestTime = Date.now();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  
  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T>(
    endpoint: string,
    options: RequestOptions = {},
    retryCount = 0
  ): Promise<T> {
    const { method = 'GET', params = {}, timeout = RESELLERCLUB_CONFIG.requestTimeout } = options;
    
    // Build URL with auth params
    const authParams = {
      'auth-userid': this.resellerId,
      'api-key': this.apiKey,
      ...params,
    };
    
    // Filter undefined values and build query string
    const queryParams = new URLSearchParams();
    Object.entries(authParams).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `${this.baseUrl}/${endpoint}?${queryParams.toString()}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      // Check for API errors
      if (data.status === 'ERROR' || data.error) {
        throw ResellerClubError.fromResponse(data);
      }
      
      // Check for insufficient funds error
      if (data.actionstatus === 'Failed' && data.actionstatusdesc?.includes('funds')) {
        throw new InsufficientFundsError(0, 0);
      }
      
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ResellerClubError('Request timeout', 'TIMEOUT');
      }
      
      // Retry on network errors
      if (retryCount < RESELLERCLUB_CONFIG.maxRetries && this.isRetryable(error)) {
        await this.delay(RESELLERCLUB_CONFIG.retryDelay * (retryCount + 1));
        return this.executeRequest<T>(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  }
  
  private isRetryable(error: unknown): boolean {
    if (error instanceof ResellerClubError) {
      // Don't retry business logic errors
      return false;
    }
    // Retry network errors
    return true;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ============================================================================
  // Public Methods
  // ============================================================================
  
  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.rateLimitedRequest<T>(endpoint, { method: 'GET', params });
  }
  
  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.rateLimitedRequest<T>(endpoint, { method: 'POST', params });
  }
  
  /**
   * Get reseller balance
   */
  async getBalance(): Promise<{ balance: number; currency: string }> {
    const data = await this.get<{ sellingcurrencybalance: number }>('billing/reseller-balance.json');
    return {
      balance: data.sellingcurrencybalance || 0,
      currency: 'USD',
    };
  }
}

// Singleton instance
let clientInstance: ResellerClubClient | null = null;

export function getResellerClubClient(): ResellerClubClient {
  if (!clientInstance) {
    clientInstance = new ResellerClubClient();
  }
  return clientInstance;
}

export function resetClient(): void {
  clientInstance = null;
}
```

### Task 5: Domain Operations (90 mins)

```typescript
// src/lib/resellerclub/domains.ts

import { getResellerClubClient } from './client';
import { DomainNotAvailableError, DomainExpiredError } from './errors';
import { SUPPORTED_TLDS, TLD_CATEGORIES } from './config';
import type {
  DomainAvailability,
  DomainPrice,
  DomainDetails,
  DomainRegistrationParams,
  DomainRenewalParams,
  DomainTransferParams,
} from './types';

export class DomainService {
  private client = getResellerClubClient();
  
  // ============================================================================
  // Domain Availability
  // ============================================================================
  
  /**
   * Check availability for a single domain
   */
  async checkAvailability(domainName: string): Promise<DomainAvailability> {
    const results = await this.checkMultipleAvailability([domainName]);
    return results[0];
  }
  
  /**
   * Check availability for multiple domains
   */
  async checkMultipleAvailability(domainNames: string[]): Promise<DomainAvailability[]> {
    // Normalize domain names
    const normalizedDomains = domainNames.map(d => d.toLowerCase().trim());
    
    // Group by TLD for efficient API calls
    const domainTlds = normalizedDomains.map(d => {
      const parts = d.split('.');
      return {
        sld: parts.slice(0, -1).join('.'),
        tld: '.' + parts[parts.length - 1],
        full: d,
      };
    });
    
    // Build API parameters
    const params: Record<string, string | number | boolean> = {};
    const uniqueTlds = [...new Set(domainTlds.map(d => d.tld))];
    uniqueTlds.forEach((tld, i) => {
      params[`tlds[${i}]`] = tld.replace('.', '');
    });
    
    // Group SLDs
    const slds = [...new Set(domainTlds.map(d => d.sld))];
    slds.forEach((sld, i) => {
      params[`domain-name[${i}]`] = sld;
    });
    
    const response = await this.client.get<Record<string, { status: string; classkey?: string }>>(
      'domains/available.json',
      params
    );
    
    // Map results
    const results: DomainAvailability[] = [];
    
    for (const domain of domainTlds) {
      const key = `${domain.sld}${domain.tld}`;
      const result = response[key];
      
      let status: DomainAvailability['status'] = 'unknown';
      if (result?.status === 'available') {
        status = 'available';
      } else if (result?.status === 'regthroughus' || result?.status === 'regthroughothers') {
        status = 'unavailable';
      } else if (result?.classkey?.includes('premium')) {
        status = 'premium';
      }
      
      results.push({
        domain: domain.full,
        status,
        classKey: result?.classkey,
      });
    }
    
    return results;
  }
  
  /**
   * Suggest domain names based on a keyword
   */
  async suggestDomains(keyword: string, tlds?: string[]): Promise<DomainAvailability[]> {
    const tldsToCheck = tlds || TLD_CATEGORIES.popular;
    const domainNames = tldsToCheck.map(tld => `${keyword}${tld}`);
    return this.checkMultipleAvailability(domainNames);
  }
  
  // ============================================================================
  // Pricing
  // ============================================================================
  
  /**
   * Get pricing for TLDs
   */
  async getPricing(tlds?: string[]): Promise<Record<string, DomainPrice>> {
    const tldsToGet = tlds || SUPPORTED_TLDS;
    
    // ResellerClub returns all prices at once
    const response = await this.client.get<Record<string, Record<string, unknown>>>(
      'products/reseller-price.json',
      { 'product-key': 'domorder' }
    );
    
    const prices: Record<string, DomainPrice> = {};
    
    for (const tld of tldsToGet) {
      const tldKey = tld.replace('.', '');
      const tldData = response[tldKey];
      
      if (tldData) {
        prices[tld] = {
          register: {
            1: this.extractPrice(tldData, 'addnewdomain', 1),
            2: this.extractPrice(tldData, 'addnewdomain', 2),
            5: this.extractPrice(tldData, 'addnewdomain', 5),
          },
          renew: {
            1: this.extractPrice(tldData, 'renewdomain', 1),
            2: this.extractPrice(tldData, 'renewdomain', 2),
            5: this.extractPrice(tldData, 'renewdomain', 5),
          },
          transfer: this.extractPrice(tldData, 'transferdomain', 1),
          restore: this.extractPrice(tldData, 'restoredomain', 1),
          currency: 'USD',
        };
      }
    }
    
    return prices;
  }
  
  private extractPrice(data: Record<string, unknown>, action: string, years: number): number {
    const key = `${action}${years}`;
    const value = data[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    return 0;
  }
  
  // ============================================================================
  // Registration
  // ============================================================================
  
  /**
   * Register a new domain
   */
  async register(params: DomainRegistrationParams): Promise<{ orderId: string; invoiceId?: string }> {
    // First check availability
    const availability = await this.checkAvailability(params.domainName);
    if (availability.status !== 'available') {
      throw new DomainNotAvailableError(params.domainName);
    }
    
    // Build registration parameters
    const apiParams: Record<string, string | number | boolean> = {
      'domain-name': params.domainName,
      'years': params.years,
      'customer-id': params.customerId,
      'reg-contact-id': params.registrantContactId,
      'admin-contact-id': params.adminContactId,
      'tech-contact-id': params.techContactId,
      'billing-contact-id': params.billingContactId,
      'purchase-privacy': params.purchasePrivacy ?? true,
      'protect-privacy': params.purchasePrivacy ?? true,
      'invoice-option': params.invoiceOption || 'NoInvoice',
    };
    
    // Add nameservers if provided
    if (params.nameservers && params.nameservers.length > 0) {
      params.nameservers.forEach((ns, i) => {
        apiParams[`ns${i + 1}`] = ns;
      });
    }
    
    const response = await this.client.post<{ entityid: string; invoiceid?: string }>(
      'domains/register.json',
      apiParams
    );
    
    return {
      orderId: response.entityid,
      invoiceId: response.invoiceid,
    };
  }
  
  // ============================================================================
  // Domain Details & Management
  // ============================================================================
  
  /**
   * Get domain details by order ID
   */
  async getDetails(orderId: string): Promise<DomainDetails> {
    const response = await this.client.get<Record<string, unknown>>(
      'domains/details.json',
      { 'order-id': orderId, options: 'All' }
    );
    
    return {
      orderId: String(response.entityid || response['order-id']),
      domainName: String(response.domainname || response['domain-name']),
      currentStatus: String(response.currentstatus) as DomainDetails['currentStatus'],
      creationDate: String(response.creationdt),
      expiryDate: String(response.endtime),
      autoRenew: response.isrecurring === 'true',
      privacyProtection: response['isprivacyprotected'] === 'true',
      transferLock: response['istransferlocked'] === 'true',
      registrantContactId: String(response.registrantcontactid),
      adminContactId: String(response.admincontactid),
      techContactId: String(response.techcontactid),
      billingContactId: String(response.billingcontactid),
      nameservers: this.extractNameservers(response),
    };
  }
  
  /**
   * Get domain details by domain name
   */
  async getDetailsByDomain(domainName: string): Promise<DomainDetails> {
    const response = await this.client.get<Record<string, unknown>>(
      'domains/details-by-name.json',
      { 'domain-name': domainName, options: 'All' }
    );
    
    return {
      orderId: String(response.entityid || response['order-id']),
      domainName: String(response.domainname || response['domain-name']),
      currentStatus: String(response.currentstatus) as DomainDetails['currentStatus'],
      creationDate: String(response.creationdt),
      expiryDate: String(response.endtime),
      autoRenew: response.isrecurring === 'true',
      privacyProtection: response['isprivacyprotected'] === 'true',
      transferLock: response['istransferlocked'] === 'true',
      registrantContactId: String(response.registrantcontactid),
      adminContactId: String(response.admincontactid),
      techContactId: String(response.techcontactid),
      billingContactId: String(response.billingcontactid),
      nameservers: this.extractNameservers(response),
    };
  }
  
  private extractNameservers(data: Record<string, unknown>): string[] {
    const nameservers: string[] = [];
    for (let i = 1; i <= 13; i++) {
      const ns = data[`ns${i}`];
      if (ns && typeof ns === 'string') {
        nameservers.push(ns);
      }
    }
    return nameservers;
  }
  
  // ============================================================================
  // Renewal
  // ============================================================================
  
  /**
   * Renew a domain
   */
  async renew(params: DomainRenewalParams): Promise<{ orderId: string; invoiceId?: string }> {
    // Get current details to check status
    const details = await this.getDetails(params.orderId);
    
    if (details.currentStatus === 'Expired') {
      throw new DomainExpiredError(details.domainName);
    }
    
    const response = await this.client.post<{ entityid: string; invoiceid?: string }>(
      'domains/renew.json',
      {
        'order-id': params.orderId,
        'years': params.years,
        'invoice-option': params.invoiceOption || 'NoInvoice',
      }
    );
    
    return {
      orderId: response.entityid,
      invoiceId: response.invoiceid,
    };
  }
  
  // ============================================================================
  // Nameserver Management
  // ============================================================================
  
  /**
   * Update nameservers for a domain
   */
  async updateNameservers(orderId: string, nameservers: string[]): Promise<{ success: boolean }> {
    const params: Record<string, string | number> = {
      'order-id': orderId,
    };
    
    nameservers.forEach((ns, i) => {
      params[`ns${i + 1}`] = ns;
    });
    
    await this.client.post('domains/modify-ns.json', params);
    return { success: true };
  }
  
  // ============================================================================
  // Transfer Lock
  // ============================================================================
  
  /**
   * Enable transfer lock
   */
  async enableTransferLock(orderId: string): Promise<{ success: boolean }> {
    await this.client.post('domains/enable-theft-protection.json', {
      'order-id': orderId,
    });
    return { success: true };
  }
  
  /**
   * Disable transfer lock
   */
  async disableTransferLock(orderId: string): Promise<{ success: boolean }> {
    await this.client.post('domains/disable-theft-protection.json', {
      'order-id': orderId,
    });
    return { success: true };
  }
  
  // ============================================================================
  // Privacy Protection
  // ============================================================================
  
  /**
   * Purchase/Enable privacy protection
   */
  async enablePrivacy(orderId: string): Promise<{ success: boolean }> {
    await this.client.post('domains/purchase-privacy.json', {
      'order-id': orderId,
      'invoice-option': 'NoInvoice',
    });
    return { success: true };
  }
  
  // ============================================================================
  // Transfer
  // ============================================================================
  
  /**
   * Initiate domain transfer
   */
  async transfer(params: DomainTransferParams): Promise<{ orderId: string }> {
    const apiParams: Record<string, string | number | boolean> = {
      'domain-name': params.domainName,
      'auth-code': params.authCode,
      'customer-id': params.customerId,
      'reg-contact-id': params.registrantContactId,
      'admin-contact-id': params.adminContactId,
      'tech-contact-id': params.techContactId,
      'billing-contact-id': params.billingContactId,
      'invoice-option': params.invoiceOption || 'NoInvoice',
    };
    
    const response = await this.client.post<{ entityid: string }>(
      'domains/transfer.json',
      apiParams
    );
    
    return { orderId: response.entityid };
  }
  
  /**
   * Cancel a domain transfer
   */
  async cancelTransfer(orderId: string): Promise<{ success: boolean }> {
    await this.client.post('domains/cancel-transfer.json', {
      'order-id': orderId,
    });
    return { success: true };
  }
  
  /**
   * Get auth code for transfer out
   */
  async getAuthCode(orderId: string): Promise<{ authCode: string }> {
    // First disable transfer lock
    await this.disableTransferLock(orderId);
    
    // Get domain secret (auth code)
    const response = await this.client.get<{ domsecret: string }>(
      'domains/get-domsecret.json',
      { 'order-id': orderId }
    );
    
    return { authCode: response.domsecret };
  }
  
  // ============================================================================
  // Auto-Renewal
  // ============================================================================
  
  /**
   * Enable auto-renewal
   */
  async enableAutoRenew(orderId: string): Promise<{ success: boolean }> {
    await this.client.post('domains/enable-recurring.json', {
      'order-id': orderId,
    });
    return { success: true };
  }
  
  /**
   * Disable auto-renewal
   */
  async disableAutoRenew(orderId: string): Promise<{ success: boolean }> {
    await this.client.post('domains/disable-recurring.json', {
      'order-id': orderId,
    });
    return { success: true };
  }
}

// Export singleton
export const domainService = new DomainService();
```

### Task 6: Contact Management (60 mins)

```typescript
// src/lib/resellerclub/contacts.ts

import { getResellerClubClient } from './client';
import type { Contact, ContactCreateParams } from './types';

export class ContactService {
  private client = getResellerClubClient();
  
  /**
   * Create a new contact
   */
  async create(params: ContactCreateParams): Promise<{ contactId: string }> {
    const apiParams: Record<string, string | number> = {
      'name': params.name,
      'email': params.email,
      'address-line-1': params.addressLine1,
      'city': params.city,
      'state': params.state,
      'country': params.country,
      'zipcode': params.zipcode,
      'phone-cc': params.phoneCountryCode,
      'phone': params.phone,
      'customer-id': params.customerId,
      'type': params.type || 'Contact',
    };
    
    if (params.company) apiParams['company'] = params.company;
    if (params.addressLine2) apiParams['address-line-2'] = params.addressLine2;
    if (params.addressLine3) apiParams['address-line-3'] = params.addressLine3;
    if (params.faxCountryCode) apiParams['fax-cc'] = params.faxCountryCode;
    if (params.fax) apiParams['fax'] = params.fax;
    
    const response = await this.client.post<string>('contacts/add.json', apiParams);
    
    return { contactId: response };
  }
  
  /**
   * Get contact details
   */
  async get(contactId: string): Promise<Contact> {
    const response = await this.client.get<Record<string, unknown>>(
      'contacts/details.json',
      { 'contact-id': contactId }
    );
    
    return this.mapContact(response);
  }
  
  /**
   * Update a contact
   */
  async update(contactId: string, params: Partial<ContactCreateParams>): Promise<{ success: boolean }> {
    const apiParams: Record<string, string | number> = {
      'contact-id': contactId,
    };
    
    if (params.name) apiParams['name'] = params.name;
    if (params.company !== undefined) apiParams['company'] = params.company;
    if (params.email) apiParams['email'] = params.email;
    if (params.addressLine1) apiParams['address-line-1'] = params.addressLine1;
    if (params.addressLine2) apiParams['address-line-2'] = params.addressLine2;
    if (params.city) apiParams['city'] = params.city;
    if (params.state) apiParams['state'] = params.state;
    if (params.country) apiParams['country'] = params.country;
    if (params.zipcode) apiParams['zipcode'] = params.zipcode;
    if (params.phoneCountryCode) apiParams['phone-cc'] = params.phoneCountryCode;
    if (params.phone) apiParams['phone'] = params.phone;
    
    await this.client.post('contacts/modify.json', apiParams);
    return { success: true };
  }
  
  /**
   * Delete a contact
   */
  async delete(contactId: string): Promise<{ success: boolean }> {
    await this.client.post('contacts/delete.json', { 'contact-id': contactId });
    return { success: true };
  }
  
  /**
   * List contacts for a customer
   */
  async listByCustomer(customerId: string, type?: string): Promise<Contact[]> {
    const params: Record<string, string | number> = {
      'customer-id': customerId,
      'no-of-records': 500,
      'page-no': 1,
    };
    
    if (type) params['type'] = type;
    
    const response = await this.client.get<{ recsonpage: string; result: Record<string, Record<string, unknown>>[] }>(
      'contacts/search.json',
      params
    );
    
    const contacts: Contact[] = [];
    if (response.result && Array.isArray(response.result)) {
      for (const item of response.result) {
        contacts.push(this.mapContact(item));
      }
    }
    
    return contacts;
  }
  
  private mapContact(data: Record<string, unknown>): Contact {
    return {
      contactId: String(data.contactid || data['contact-id']),
      type: (data.type || 'Contact') as Contact['type'],
      name: String(data.name || ''),
      company: data.company ? String(data.company) : undefined,
      email: String(data.emailaddr || data.email || ''),
      addressLine1: String(data['address-line-1'] || data.address1 || ''),
      addressLine2: data['address-line-2'] ? String(data['address-line-2']) : undefined,
      addressLine3: data['address-line-3'] ? String(data['address-line-3']) : undefined,
      city: String(data.city || ''),
      state: String(data.state || ''),
      country: String(data.country || ''),
      zipcode: String(data.zip || data.zipcode || ''),
      phoneCountryCode: String(data['phone-cc'] || data.phonecc || ''),
      phone: String(data.phone || data.telno || ''),
      faxCountryCode: data['fax-cc'] ? String(data['fax-cc']) : undefined,
      fax: data.fax ? String(data.fax) : undefined,
    };
  }
}

export const contactService = new ContactService();
```

### Task 7: Customer Management (45 mins)

```typescript
// src/lib/resellerclub/customers.ts

import { getResellerClubClient } from './client';
import type { Customer, CustomerCreateParams } from './types';

export class CustomerService {
  private client = getResellerClubClient();
  
  /**
   * Create a new customer (sub-account under reseller)
   */
  async create(params: CustomerCreateParams): Promise<{ customerId: string }> {
    const apiParams: Record<string, string | number> = {
      'username': params.username,
      'passwd': params.password,
      'name': params.name,
      'email': params.email,
      'address-line-1': params.addressLine1,
      'city': params.city,
      'state': params.state,
      'country': params.country,
      'zipcode': params.zipcode,
      'phone-cc': params.phoneCountryCode,
      'phone': params.phone,
    };
    
    if (params.company) apiParams['company'] = params.company;
    if (params.languagePreference) apiParams['lang-pref'] = params.languagePreference;
    
    const response = await this.client.post<string>('customers/signup.json', apiParams);
    
    return { customerId: response };
  }
  
  /**
   * Get customer details
   */
  async get(customerId: string): Promise<Customer> {
    const response = await this.client.get<Record<string, unknown>>(
      'customers/details.json',
      { 'customer-id': customerId }
    );
    
    return this.mapCustomer(response);
  }
  
  /**
   * Get customer by username
   */
  async getByUsername(username: string): Promise<Customer> {
    const response = await this.client.get<Record<string, unknown>>(
      'customers/details-by-id.json',
      { 'username': username }
    );
    
    return this.mapCustomer(response);
  }
  
  /**
   * Check if customer exists
   */
  async exists(username: string): Promise<boolean> {
    try {
      await this.getByUsername(username);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Update customer password
   */
  async updatePassword(customerId: string, newPassword: string): Promise<{ success: boolean }> {
    await this.client.post('customers/change-password.json', {
      'customer-id': customerId,
      'new-passwd': newPassword,
    });
    return { success: true };
  }
  
  /**
   * Generate auth token for customer portal
   */
  async generateToken(customerId: string): Promise<{ token: string }> {
    const response = await this.client.get<{ auth_token: string }>(
      'customers/temp-password.json',
      { 'customer-id': customerId }
    );
    return { token: response.auth_token };
  }
  
  /**
   * Get customer's domain list
   */
  async getDomains(customerId: string, page = 1, limit = 50): Promise<{ domains: string[]; total: number }> {
    const response = await this.client.get<{ recsindb: string; result: Record<string, unknown>[] }>(
      'domains/search.json',
      {
        'customer-id': customerId,
        'no-of-records': limit,
        'page-no': page,
      }
    );
    
    const domains = (response.result || []).map(d => String(d.entity || d['domain-name']));
    return {
      domains,
      total: parseInt(response.recsindb || '0'),
    };
  }
  
  private mapCustomer(data: Record<string, unknown>): Customer {
    return {
      customerId: String(data.customerid || data['customer-id']),
      username: String(data.username || data.useremail || ''),
      name: String(data.name || ''),
      company: data.company ? String(data.company) : undefined,
      email: String(data.useremail || data.email || ''),
      status: this.mapStatus(data.customerstatus || data.status),
      parentId: data.parentid ? String(data.parentid) : undefined,
      totalReceipts: data.totalreceipts ? Number(data.totalreceipts) : undefined,
    };
  }
  
  private mapStatus(status: unknown): Customer['status'] {
    const statusStr = String(status).toLowerCase();
    if (statusStr === 'active' || statusStr === 'true') return 'Active';
    if (statusStr === 'suspended') return 'Suspended';
    return 'Deleted';
  }
}

export const customerService = new CustomerService();
```

### Task 8: Index Exports (15 mins)

```typescript
// src/lib/resellerclub/index.ts

export { getResellerClubClient, resetClient } from './client';
export { domainService, DomainService } from './domains';
export { contactService, ContactService } from './contacts';
export { customerService, CustomerService } from './customers';
export { RESELLERCLUB_CONFIG, TLD_CATEGORIES, SUPPORTED_TLDS, isConfigured } from './config';
export * from './types';
export * from './errors';
```

```typescript
// src/types/resellerclub.ts

// Re-export all types for public use
export type {
  DomainAvailability,
  DomainPrice,
  DomainDetails,
  DomainRegistrationParams,
  DomainRenewalParams,
  DomainTransferParams,
  Contact,
  ContactCreateParams,
  Customer,
  CustomerCreateParams,
  Order,
  Transaction,
} from '@/lib/resellerclub/types';
```

---

## ✅ Completion Checklist

- [ ] Configuration file with environment variables
- [ ] Complete TypeScript interfaces for all API entities
- [ ] Custom error classes for specific failure modes
- [ ] Rate-limited API client with retry logic
- [ ] Domain availability checking (single and bulk)
- [ ] Domain registration functionality
- [ ] Domain renewal functionality
- [ ] Domain transfer functionality
- [ ] Nameserver management
- [ ] Transfer lock management
- [ ] Privacy protection management
- [ ] Auto-renewal settings
- [ ] Contact CRUD operations
- [ ] Customer CRUD operations
- [ ] Barrel exports and public type exports
- [ ] TypeScript compiles with zero errors

---

## 🧪 Testing Considerations

1. Use ResellerClub sandbox environment for testing
2. Test rate limiting with burst requests
3. Test error handling for insufficient funds
4. Test retry logic with network failures
5. Verify domain availability checks are accurate

---

## 📚 Reference

- [ResellerClub API Documentation](https://manage.resellerclub.com/kb/answer/744)
- [ResellerClub Domain API](https://manage.resellerclub.com/kb/answer/752)
- [ResellerClub Customer API](https://manage.resellerclub.com/kb/answer/804)
