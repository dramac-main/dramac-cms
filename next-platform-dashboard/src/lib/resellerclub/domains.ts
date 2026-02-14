// src/lib/resellerclub/domains.ts
// ResellerClub Domain Operations Service

import { getResellerClubClient } from './client';
import { 
  DomainNotAvailableError, 
  DomainExpiredError,
  DomainNotFoundError,
  PurchasesDisabledError,
} from './errors';
import { SUPPORTED_TLDS, TLD_CATEGORIES, arePurchasesAllowed, getDomainCheckUrl } from './config';
import { DEFAULT_CURRENCY } from '@/lib/locale-config'
import type {
  DomainAvailability,
  DomainPrice,
  DomainDetails,
  DomainRegistrationParams,
  DomainRenewalParams,
  DomainTransferParams,
  DomainSearchResult,
  SearchResponse,
} from './types';

/**
 * Domain Service
 * 
 * Provides domain-related operations including:
 * - Availability checking
 * - Registration
 * - Renewal
 * - Transfer
 * - Nameserver management
 * - Privacy protection
 * - Auto-renewal settings
 */
export class DomainService {
  private get client() {
    return getResellerClubClient();
  }
  
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
   * 
   * Uses the dedicated domaincheck.httpapi.com endpoint:
   * https://domaincheck.httpapi.com/api/domains/available.json?auth-userid=X&api-key=X&domain-name=keyword&tlds=com&tlds=net
   * See: https://manage.resellerclub.com/kb/answer/764
   * 
   * ResellerClub API uses REPEATED query param keys (not array brackets):
   *   domain-name=test&tlds=com&tlds=net  (CORRECT)
   *   tlds[0]=com&tlds[1]=net             (WRONG)
   */
  async checkMultipleAvailability(domainNames: string[]): Promise<DomainAvailability[]> {
    // Normalize domain names
    const normalizedDomains = domainNames.filter(Boolean).map(d => d.toLowerCase().trim());
    
    // Group by TLD for efficient API calls
    const domainTlds = normalizedDomains.map(d => {
      const parts = d.split('.');
      return {
        sld: parts.slice(0, -1).join('.'),
        tld: '.' + parts[parts.length - 1],
        full: d,
      };
    });
    
    // Build API parameters with array values for repeated keys
    const uniqueTlds = [...new Set(domainTlds.map(d => d.tld))];
    const slds = [...new Set(domainTlds.map(d => d.sld))];
    
    const params: Record<string, string | string[]> = {
      // Use repeated keys: domain-name=test1&domain-name=test2
      'domain-name': slds.length === 1 ? slds[0] : slds,
      // Use repeated keys: tlds=com&tlds=net&tlds=org
      'tlds': uniqueTlds.map(tld => tld.replace('.', '')),
    };
    
    const domainCheckUrl = getDomainCheckUrl();
    
    const response = await this.client.get<Record<string, { status?: string; classkey?: string; classKey?: string }>>(
      'domains/available.json',
      params,
      domainCheckUrl
    );
    
    // Build case-insensitive lookup (ResellerClub may return keys in varying case)
    const responseLower = Object.fromEntries(
      Object.entries(response).map(([k, v]) => [k.toLowerCase(), v])
    );
    
    // Map results
    // Response keys from ResellerClub are full domain names, e.g. "keyword.com", "keyword.net"
    const results: DomainAvailability[] = [];
    
    for (const domain of domainTlds) {
      const keyWithDot = `${domain.sld}${domain.tld}`; // "keyword.com"
      const keyNoDot = `${domain.sld}${domain.tld.replace('.', '')}`; // "keywordcom"
      const result =
        response[keyWithDot] ?? response[domain.full]
        ?? responseLower[keyWithDot.toLowerCase()]
        ?? response[keyNoDot] ?? responseLower[keyNoDot.toLowerCase()];
      
      const statusVal = result?.status?.toLowerCase();
      const classKeyVal = result?.classkey ?? result?.classKey ?? '';
      
      let status: DomainAvailability['status'] = 'unknown';
      if (statusVal === 'available') {
        status = 'available';
      } else if (statusVal === 'regthroughus' || statusVal === 'regthroughothers') {
        status = 'unavailable';
      } else if (typeof classKeyVal === 'string' && classKeyVal.toLowerCase().includes('premium')) {
        status = 'premium';
      }
      
      results.push({
        domain: domain.full,
        status,
        classKey: result?.classkey ?? result?.classKey,
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
   * Get customer pricing for TLDs (what end-customers pay)
   * This reflects ResellerClub markups and should be used as retail price
   *
   * API docs: GET /api/products/customer-price.json
   * Params: auth-userid, api-key, customer-id (optional)
   * NOTE: Does NOT accept product-key — returns ALL products at once.
   */
  async getCustomerPricing(customerId: string, tlds?: string[]): Promise<Record<string, DomainPrice>> {
    const tldsToGet = tlds || SUPPORTED_TLDS;
    
    const response = await this.client.get<Record<string, Record<string, unknown>>>(
      'products/customer-price.json',
      { 'customer-id': customerId }
    );
    
    return this.parsePricingResponse(response, tldsToGet);
  }
  
  /**
   * Get reseller cost pricing (wholesale/what you pay ResellerClub)
   *
   * API docs: GET /api/products/reseller-cost-price.json
   * Params: auth-userid, api-key, reseller-id (optional)
   * NOTE: Does NOT accept product-key — returns ALL products at once.
   */
  async getResellerCostPricing(tlds?: string[]): Promise<Record<string, DomainPrice>> {
    const tldsToGet = tlds || SUPPORTED_TLDS;
    
    const response = await this.client.get<Record<string, Record<string, unknown>>>(
      'products/reseller-cost-price.json',
      {}
    );
    
    return this.parsePricingResponse(response, tldsToGet);
  }
  
  /**
   * Get reseller pricing for TLDs (slab-based pricing you configure)
   * @deprecated Use getCustomerPricing for retail or getResellerCostPricing for wholesale
   *
   * API docs: GET /api/products/reseller-price.json
   * Params: auth-userid, api-key, reseller-id (optional)
   * NOTE: Does NOT accept product-key — returns ALL products at once.
   */
  async getResellerPricing(tlds?: string[]): Promise<Record<string, DomainPrice>> {
    const tldsToGet = tlds || SUPPORTED_TLDS;
    
    const response = await this.client.get<Record<string, Record<string, unknown>>>(
      'products/reseller-price.json',
      {}
    );
    
    return this.parsePricingResponse(response, tldsToGet);
  }
  
  /**
   * Get pricing for TLDs — uses reseller cost pricing (no customer-id needed)
   */
  async getPricing(tlds?: string[]): Promise<Record<string, DomainPrice>> {
    return this.getResellerCostPricing(tlds);
  }
  
  /**
   * Parse ResellerClub pricing API response into our format.
   *
   * ResellerClub returns domain TLD keys in different formats depending on
   * the endpoint and the TLD:
   *   - customer-price / cost-price: flat keys like "dotcom", "dotnet", "dotcoza"
   *   - reseller-price (slab): "domcno" with nested slab structure
   *   - Some responses use bare TLD keys: "com", "net", "co.za"
   *
   * We try multiple key variants to find the data for each TLD.
   */
  private parsePricingResponse(
    response: Record<string, Record<string, unknown>>, 
    tlds: string[]
  ): Record<string, DomainPrice> {
    const prices: Record<string, DomainPrice> = {};
    
    // Build a case-insensitive lookup of response keys
    const responseLower: Record<string, Record<string, unknown>> = {};
    for (const [key, val] of Object.entries(response)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        responseLower[key.toLowerCase()] = val as Record<string, unknown>;
      }
    }
    
    for (const tld of tlds) {
      // ".com" → "com", ".co.za" → "co.za"
      const bare = tld.startsWith('.') ? tld.slice(1) : tld;
      // "dotcom", "dotcoza" (dots replaced)
      const dotPrefixed = 'dot' + bare.replace(/\./g, '');
      // "domcno" variant (used in some slab responses for .com → "domcno")
      const domcno = 'domc' + bare.replace(/\./g, '');
      
      // Try multiple key variants
      const tldData =
        responseLower[bare] ??
        responseLower[dotPrefixed] ??
        responseLower[bare.replace(/\./g, '')] ??
        responseLower[domcno] ??
        undefined;
      
      if (tldData) {
        // For slab-based responses, the pricing may be nested under a slab index
        // e.g. { "0": { "pricing": { "addnewdomain": { "1": "9.99" } } } }
        const pricingData = this.unwrapSlabPricing(tldData);
        
        prices[tld] = {
          register: {
            1: this.extractPrice(pricingData, 'addnewdomain', 1),
            2: this.extractPrice(pricingData, 'addnewdomain', 2),
            5: this.extractPrice(pricingData, 'addnewdomain', 5),
          },
          renew: {
            1: this.extractPrice(pricingData, 'renewdomain', 1),
            2: this.extractPrice(pricingData, 'renewdomain', 2),
            5: this.extractPrice(pricingData, 'renewdomain', 5),
          },
          transfer: this.extractPrice(pricingData, 'transferdomain', 1),
          restore: this.extractPrice(pricingData, 'restoredomain', 1),
          currency: DEFAULT_CURRENCY,
        };
      }
    }
    
    return prices;
  }
  
  /**
   * Unwrap slab-based pricing structure.
   * Reseller-price returns: { "0": { "pricing": { "addnewdomain": { "1": "9.99" } }, "category": {...} } }
   * Customer/cost-price returns flat: { "addnewdomain1": "9.99" } or { "addnewdomain": { "1": "9.99" } }
   * This method detects the slab wrapper and returns the inner pricing object.
   */
  private unwrapSlabPricing(data: Record<string, unknown>): Record<string, unknown> {
    // Check if this looks like a slab response (key "0" with nested "pricing")
    const firstSlab = data['0'];
    if (firstSlab && typeof firstSlab === 'object' && !Array.isArray(firstSlab)) {
      const slabObj = firstSlab as Record<string, unknown>;
      if (slabObj['pricing'] && typeof slabObj['pricing'] === 'object') {
        return slabObj['pricing'] as Record<string, unknown>;
      }
    }
    return data;
  }
  
  /**
   * Get pricing for a specific TLD
   * @deprecated Use getCustomerPricing, getResellerCostPricing, or getResellerPricing explicitly
   */
  async getTldPricing(tld: string): Promise<DomainPrice | null> {
    const prices = await this.getPricing([tld]);
    return prices[tld] || null;
  }
  
  /**
   * Get customer pricing for a specific TLD
   */
  async getTldCustomerPricing(customerId: string, tld: string): Promise<DomainPrice | null> {
    const prices = await this.getCustomerPricing(customerId, [tld]);
    return prices[tld] || null;
  }
  
  /**
   * Get reseller cost for a specific TLD
   */
  async getTldResellerCost(tld: string): Promise<DomainPrice | null> {
    const prices = await this.getResellerCostPricing([tld]);
    return prices[tld] || null;
  }
  
  /**
   * Extract a price from a pricing data object.
   * Handles multiple ResellerClub response formats:
   *   - Flat: { "addnewdomain1": "9.99" }
   *   - Nested: { "addnewdomain": { "1": "9.99" } }
   */
  private extractPrice(data: Record<string, unknown>, action: string, years: number): number {
    // Try flat key first: "addnewdomain1"
    const flatKey = `${action}${years}`;
    const flatValue = data[flatKey];
    if (flatValue !== undefined && flatValue !== null) {
      if (typeof flatValue === 'number') return flatValue;
      if (typeof flatValue === 'string') return parseFloat(flatValue) || 0;
    }
    
    // Try nested key: data["addnewdomain"]["1"]
    const nestedObj = data[action];
    if (nestedObj && typeof nestedObj === 'object' && !Array.isArray(nestedObj)) {
      const nested = (nestedObj as Record<string, unknown>)[String(years)];
      if (typeof nested === 'number') return nested;
      if (typeof nested === 'string') return parseFloat(nested) || 0;
    }
    
    return 0;
  }
  
  // ============================================================================
  // Registration
  // ============================================================================
  
  /**
   * Register a new domain
   */
  async register(params: DomainRegistrationParams): Promise<{ orderId: string; invoiceId?: string }> {
    // ⚠️ SAFETY: This operation spends real money
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('domain registration');
    }

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
      orderId: String(response.entityid),
      invoiceId: response.invoiceid ? String(response.invoiceid) : undefined,
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
    
    return this.mapDomainDetails(response);
  }
  
  /**
   * Get domain details by domain name
   */
  async getDetailsByDomain(domainName: string): Promise<DomainDetails> {
    const response = await this.client.get<Record<string, unknown>>(
      'domains/details-by-name.json',
      { 'domain-name': domainName, options: 'All' }
    );
    
    if (!response || Object.keys(response).length === 0) {
      throw new DomainNotFoundError(domainName);
    }
    
    return this.mapDomainDetails(response);
  }
  
  /**
   * Search domains for a customer
   */
  async searchDomains(
    customerId: string, 
    options?: { 
      status?: string; 
      page?: number; 
      limit?: number;
    }
  ): Promise<{ domains: DomainSearchResult[]; total: number }> {
    const params: Record<string, string | number> = {
      'customer-id': customerId,
      'no-of-records': options?.limit || 50,
      'page-no': options?.page || 1,
    };
    
    if (options?.status) {
      params['status'] = options.status;
    }
    
    const response = await this.client.get<SearchResponse<DomainSearchResult>>(
      'domains/search.json',
      params
    );
    
    return {
      domains: response.result || [],
      total: parseInt(response.recsindb || '0'),
    };
  }
  
  private mapDomainDetails(data: Record<string, unknown>): DomainDetails {
    return {
      orderId: String(data.entityid || data['order-id'] || data.orderid),
      domainName: String(data.domainname || data['domain-name']),
      currentStatus: String(data.currentstatus || data.status) as DomainDetails['currentStatus'],
      creationDate: String(data.creationdt || data.creationdate || ''),
      expiryDate: String(data.endtime || data.expirydate || ''),
      autoRenew: data.isrecurring === 'true' || data.isrecurring === true,
      privacyProtection: data.isprivacyprotected === 'true' || data.isprivacyprotected === true,
      transferLock: data.istransferlocked === 'true' || data.istransferlocked === true,
      registrantContactId: String(data.registrantcontactid || data['registrant-contact-id'] || ''),
      adminContactId: String(data.admincontactid || data['admin-contact-id'] || ''),
      techContactId: String(data.techcontactid || data['tech-contact-id'] || ''),
      billingContactId: String(data.billingcontactid || data['billing-contact-id'] || ''),
      nameservers: this.extractNameservers(data),
    };
  }
  
  private extractNameservers(data: Record<string, unknown>): string[] {
    const nameservers: string[] = [];
    // ResellerClub can return up to 13 nameservers
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
    // ⚠️ SAFETY: This operation spends real money
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('domain renewal');
    }

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
        'exp-date': details.expiryDate,
        'invoice-option': params.invoiceOption || 'NoInvoice',
      }
    );
    
    return {
      orderId: String(response.entityid),
      invoiceId: response.invoiceid ? String(response.invoiceid) : undefined,
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
  
  /**
   * Get current nameservers
   */
  async getNameservers(orderId: string): Promise<string[]> {
    const details = await this.getDetails(orderId);
    return details.nameservers;
  }
  
  // ============================================================================
  // Transfer Lock
  // ============================================================================
  
  /**
   * Enable transfer lock (theft protection)
   */
  async enableTransferLock(orderId: string): Promise<{ success: boolean }> {
    await this.client.post('domains/enable-theft-protection.json', {
      'order-id': orderId,
    });
    return { success: true };
  }
  
  /**
   * Disable transfer lock (theft protection)
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
    // ⚠️ SAFETY: This operation spends real money
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('privacy protection purchase');
    }

    await this.client.post('domains/purchase-privacy.json', {
      'order-id': orderId,
      'invoice-option': 'NoInvoice',
    });
    return { success: true };
  }
  
  /**
   * Check privacy protection status
   */
  async getPrivacyStatus(orderId: string): Promise<boolean> {
    const details = await this.getDetails(orderId);
    return details.privacyProtection;
  }
  
  // ============================================================================
  // Transfer
  // ============================================================================
  
  /**
   * Initiate domain transfer (transfer in)
   */
  async transfer(params: DomainTransferParams): Promise<{ orderId: string }> {
    // ⚠️ SAFETY: This operation spends real money
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('domain transfer');
    }

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
    
    return { orderId: String(response.entityid) };
  }
  
  /**
   * Cancel a pending domain transfer
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
    // First disable transfer lock to get auth code
    await this.disableTransferLock(orderId);
    
    // Get domain secret (auth code)
    const response = await this.client.get<{ domsecret: string }>(
      'domains/get-domsecret.json',
      { 'order-id': orderId }
    );
    
    return { authCode: String(response.domsecret) };
  }
  
  /**
   * Resend transfer approval email
   */
  async resendTransferApprovalEmail(orderId: string): Promise<{ success: boolean }> {
    await this.client.post('domains/resend-transfer-approval-mail.json', {
      'order-id': orderId,
    });
    return { success: true };
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
  
  // ============================================================================
  // Contact Management
  // ============================================================================
  
  /**
   * Modify domain contacts
   */
  async modifyContacts(
    orderId: string,
    contacts: {
      registrantContactId?: string;
      adminContactId?: string;
      techContactId?: string;
      billingContactId?: string;
    }
  ): Promise<{ success: boolean }> {
    const params: Record<string, string> = {
      'order-id': orderId,
    };
    
    if (contacts.registrantContactId) {
      params['reg-contact-id'] = contacts.registrantContactId;
    }
    if (contacts.adminContactId) {
      params['admin-contact-id'] = contacts.adminContactId;
    }
    if (contacts.techContactId) {
      params['tech-contact-id'] = contacts.techContactId;
    }
    if (contacts.billingContactId) {
      params['billing-contact-id'] = contacts.billingContactId;
    }
    
    await this.client.post('domains/modify-contact.json', params);
    return { success: true };
  }
  
  // ============================================================================
  // Domain Validation
  // ============================================================================
  
  /**
   * Validate domain name format
   */
  validateDomainName(domainName: string): { valid: boolean; error?: string } {
    const normalized = domainName.toLowerCase().trim();
    
    // Check for empty string
    if (!normalized) {
      return { valid: false, error: 'Domain name is required' };
    }
    
    // Check for valid characters
    const validPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/;
    if (!validPattern.test(normalized)) {
      return { valid: false, error: 'Invalid domain name format' };
    }
    
    // Check length
    const parts = normalized.split('.');
    const sld = parts[0];
    if (sld.length < 2) {
      return { valid: false, error: 'Domain name too short (minimum 2 characters)' };
    }
    if (sld.length > 63) {
      return { valid: false, error: 'Domain name too long (maximum 63 characters)' };
    }
    
    // Check for consecutive hyphens (invalid for most TLDs)
    if (sld.includes('--')) {
      return { valid: false, error: 'Domain name cannot contain consecutive hyphens' };
    }
    
    return { valid: true };
  }
  
  /**
   * Extract TLD from domain name
   */
  extractTld(domainName: string): string {
    if (!domainName) return '.unknown';
    const parts = domainName.toLowerCase().split('.');
    // Handle compound TLDs like .co.za
    if (parts.length >= 3) {
      const possibleCompound = '.' + parts.slice(-2).join('.');
      const allTlds: readonly string[] = Object.values(TLD_CATEGORIES).flat();
      if (allTlds.includes(possibleCompound)) {
        return possibleCompound;
      }
    }
    return '.' + parts[parts.length - 1];
  }
  
  /**
   * Extract SLD (second-level domain) from domain name
   */
  extractSld(domainName: string): string {
    if (!domainName) return '';
    const parts = domainName.toLowerCase().split('.');
    return parts.slice(0, -1).join('.');
  }
}

// Export singleton instance
export const domainService = new DomainService();
