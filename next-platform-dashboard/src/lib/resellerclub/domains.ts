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
    
    // Build API parameters with array values for repeated keys
    const uniqueTlds = [...new Set(domainTlds.map(d => d.tld))];
    const slds = [...new Set(domainTlds.map(d => d.sld))];
    
    const params: Record<string, string | string[]> = {
      // Use repeated keys: domain-name=test1&domain-name=test2
      'domain-name': slds.length === 1 ? slds[0] : slds,
      // Use repeated keys: tlds=com&tlds=net&tlds=org
      'tlds': uniqueTlds.map(tld => tld.replace('.', '')),
    };
    
    // Use the dedicated domaincheck.httpapi.com endpoint
    const domainCheckUrl = getDomainCheckUrl();
    
    console.log('[DomainService] Availability check URL:', domainCheckUrl);
    console.log('[DomainService] Params:', JSON.stringify(params));
    
    const response = await this.client.get<Record<string, { status: string; classkey?: string }>>(
      'domains/available.json',
      params,
      domainCheckUrl
    );
    
    console.log('[DomainService] Raw API response keys:', Object.keys(response));
    console.log('[DomainService] Raw API response:', JSON.stringify(response).slice(0, 500));
    
    // Map results
    // Response keys from ResellerClub are in format: "keyword.com", "keyword.net"
    // (i.e., the full domain name as the key)
    const results: DomainAvailability[] = [];
    
    for (const domain of domainTlds) {
      // Try multiple key formats that ResellerClub might use
      const keyWithDot = `${domain.sld}${domain.tld}`; // "keyword.com"
      const keyNoDot = `${domain.sld}${domain.tld.replace('.', '')}`; // "keywordcom"
      const result = response[keyWithDot] || response[keyNoDot] || response[domain.full];
      
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
          currency: DEFAULT_CURRENCY,
        };
      }
    }
    
    return prices;
  }
  
  /**
   * Get pricing for a specific TLD
   */
  async getTldPricing(tld: string): Promise<DomainPrice | null> {
    const prices = await this.getPricing([tld]);
    return prices[tld] || null;
  }
  
  private extractPrice(data: Record<string, unknown>, action: string, years: number): number {
    const key = `${action}${years}`;
    const value = data[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
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
    const parts = domainName.toLowerCase().split('.');
    return '.' + parts[parts.length - 1];
  }
  
  /**
   * Extract SLD (second-level domain) from domain name
   */
  extractSld(domainName: string): string {
    const parts = domainName.toLowerCase().split('.');
    return parts.slice(0, -1).join('.');
  }
}

// Export singleton instance
export const domainService = new DomainService();
