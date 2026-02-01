// src/lib/resellerclub/customers.ts
// ResellerClub Customer Management Service

import { getResellerClubClient } from './client';
import { CustomerNotFoundError, ResellerClubError } from './errors';
import type { Customer, CustomerCreateParams, SearchResponse, DomainSearchResult } from './types';

/**
 * Customer Service
 * 
 * Manages ResellerClub customers (sub-accounts under the reseller).
 * Each customer can have contacts and domains.
 */
export class CustomerService {
  private get client() {
    return getResellerClubClient();
  }
  
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
    
    const response = await this.client.post<string | { entityid: string }>(
      'customers/signup.json', 
      apiParams
    );
    
    // Response can be just the ID or an object
    const customerId = typeof response === 'string' 
      ? response 
      : String(response.entityid);
    
    return { customerId };
  }
  
  /**
   * Get customer details by ID
   */
  async get(customerId: string): Promise<Customer> {
    const response = await this.client.get<Record<string, unknown>>(
      'customers/details.json',
      { 'customer-id': customerId }
    );
    
    if (!response || Object.keys(response).length === 0) {
      throw new CustomerNotFoundError(customerId);
    }
    
    return this.mapCustomer(response);
  }
  
  /**
   * Get customer by username (email)
   */
  async getByUsername(username: string): Promise<Customer> {
    const response = await this.client.get<Record<string, unknown>>(
      'customers/details-by-id.json',
      { 'username': username }
    );
    
    if (!response || Object.keys(response).length === 0) {
      throw new CustomerNotFoundError(username);
    }
    
    return this.mapCustomer(response);
  }
  
  /**
   * Check if a customer exists by username
   */
  async exists(username: string): Promise<boolean> {
    try {
      await this.getByUsername(username);
      return true;
    } catch (error) {
      if (error instanceof CustomerNotFoundError) {
        return false;
      }
      // Re-throw other errors
      throw error;
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
   * Generate temporary auth token for customer portal access
   */
  async generateToken(customerId: string, ip?: string): Promise<{ token: string }> {
    const params: Record<string, string> = {
      'customer-id': customerId,
    };
    
    if (ip) {
      params['ip'] = ip;
    }
    
    const response = await this.client.get<Record<string, unknown>>(
      'customers/temp-password.json',
      params
    );
    
    return { 
      token: String(response.auth_token || response.temppasswd || response.token || '') 
    };
  }
  
  /**
   * Get customer's domain list
   */
  async getDomains(
    customerId: string, 
    options?: { page?: number; limit?: number; status?: string }
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
  
  /**
   * Modify customer details
   */
  async update(
    customerId: string, 
    params: Partial<Omit<CustomerCreateParams, 'password' | 'username'>>
  ): Promise<{ success: boolean }> {
    const apiParams: Record<string, string | number> = {
      'customer-id': customerId,
    };
    
    if (params.name) apiParams['name'] = params.name;
    if (params.company) apiParams['company'] = params.company;
    if (params.addressLine1) apiParams['address-line-1'] = params.addressLine1;
    if (params.city) apiParams['city'] = params.city;
    if (params.state) apiParams['state'] = params.state;
    if (params.country) apiParams['country'] = params.country;
    if (params.zipcode) apiParams['zipcode'] = params.zipcode;
    if (params.phoneCountryCode) apiParams['phone-cc'] = params.phoneCountryCode;
    if (params.phone) apiParams['phone'] = params.phone;
    if (params.languagePreference) apiParams['lang-pref'] = params.languagePreference;
    
    await this.client.post('customers/modify.json', apiParams);
    return { success: true };
  }
  
  /**
   * Suspend a customer
   */
  async suspend(customerId: string, reason: string): Promise<{ success: boolean }> {
    await this.client.post('customers/suspend.json', {
      'customer-id': customerId,
      'reason': reason,
    });
    return { success: true };
  }
  
  /**
   * Unsuspend a customer
   */
  async unsuspend(customerId: string): Promise<{ success: boolean }> {
    await this.client.post('customers/unsuspend.json', {
      'customer-id': customerId,
    });
    return { success: true };
  }
  
  /**
   * Delete a customer (only if no active orders)
   */
  async delete(customerId: string): Promise<{ success: boolean }> {
    await this.client.post('customers/delete.json', {
      'customer-id': customerId,
    });
    return { success: true };
  }
  
  /**
   * Search customers
   */
  async search(
    options?: { 
      name?: string; 
      email?: string; 
      company?: string;
      status?: 'Active' | 'Suspended' | 'Deleted';
      page?: number; 
      limit?: number 
    }
  ): Promise<{ customers: Customer[]; total: number }> {
    const params: Record<string, string | number> = {
      'no-of-records': options?.limit || 50,
      'page-no': options?.page || 1,
    };
    
    if (options?.name) params['name'] = options.name;
    if (options?.email) params['email'] = options.email;
    if (options?.company) params['company'] = options.company;
    if (options?.status) params['status'] = options.status;
    
    const response = await this.client.get<SearchResponse<Record<string, unknown>>>(
      'customers/search.json',
      params
    );
    
    const customers: Customer[] = [];
    if (response.result && Array.isArray(response.result)) {
      for (const item of response.result) {
        customers.push(this.mapCustomer(item));
      }
    }
    
    return {
      customers,
      total: parseInt(response.recsindb || '0'),
    };
  }
  
  /**
   * Create or get existing customer by username
   */
  async createOrGet(params: CustomerCreateParams): Promise<{ customerId: string; created: boolean }> {
    // Check if customer exists
    const exists = await this.exists(params.username);
    
    if (exists) {
      const customer = await this.getByUsername(params.username);
      return { customerId: customer.customerId, created: false };
    }
    
    // Create new customer
    const result = await this.create(params);
    return { customerId: result.customerId, created: true };
  }
  
  /**
   * Get customer's total spending
   */
  async getTotalReceipts(customerId: string): Promise<number> {
    const customer = await this.get(customerId);
    return customer.totalReceipts || 0;
  }
  
  /**
   * Generate password that meets ResellerClub requirements
   */
  generatePassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '!@#$%'[Math.floor(Math.random() * 5)]; // special
    
    // Fill the rest
    for (let i = 0; i < 8; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
  
  /**
   * Map API response to Customer type
   */
  private mapCustomer(data: Record<string, unknown>): Customer {
    return {
      customerId: String(data.customerid || data['customer-id'] || data.entityid || ''),
      username: String(data.username || data.useremail || ''),
      name: String(data.name || ''),
      company: data.company ? String(data.company) : undefined,
      email: String(data.useremail || data.email || ''),
      status: this.mapStatus(data.customerstatus || data.status),
      parentId: data.parentid ? String(data.parentid) : undefined,
      totalReceipts: data.totalreceipts ? Number(data.totalreceipts) : undefined,
      pinMode: data.pinmode === 'true' || data.pinmode === true,
      languagePreference: data['lang-pref'] ? String(data['lang-pref']) : undefined,
    };
  }
  
  private mapStatus(status: unknown): Customer['status'] {
    const statusStr = String(status).toLowerCase();
    if (statusStr === 'active' || statusStr === 'true') return 'Active';
    if (statusStr === 'suspended') return 'Suspended';
    return 'Deleted';
  }
}

// Export singleton instance
export const customerService = new CustomerService();
