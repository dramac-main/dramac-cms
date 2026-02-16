// src/lib/resellerclub/contacts.ts
// ResellerClub Contact Management Service

import { getResellerClubClient } from './client';
import { ContactNotFoundError } from './errors';
import type { Contact, ContactCreateParams, SearchResponse } from './types';

/**
 * Contact Service
 * 
 * Manages WHOIS contacts for domain registration.
 * Each domain requires 4 contacts:
 * - Registrant: Domain owner
 * - Admin: Administrative contact
 * - Tech: Technical contact
 * - Billing: Billing contact
 */
export class ContactService {
  private get client() {
    return getResellerClubClient();
  }
  
  /**
   * Create a new contact
   */
  async create(params: ContactCreateParams): Promise<{ contactId: string }> {
    // GUARD: Validate customerId
    if (!params.customerId || params.customerId === 'undefined' || params.customerId === 'null') {
      throw new Error(`[ContactService] Cannot create contact: invalid customerId="${params.customerId}"`);
    }

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
    
    const response = await this.client.post<string | { entityid: string }>(
      'contacts/add.json', 
      apiParams
    );
    
    // Response can be just the ID or an object
    const contactId = typeof response === 'string' 
      ? response 
      : String(response.entityid);
    
    return { contactId };
  }
  
  /**
   * Get contact details
   */
  async get(contactId: string): Promise<Contact> {
    const response = await this.client.get<Record<string, unknown>>(
      'contacts/details.json',
      { 'contact-id': contactId }
    );
    
    if (!response || Object.keys(response).length === 0) {
      throw new ContactNotFoundError(contactId);
    }
    
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
    if (params.company !== undefined) apiParams['company'] = params.company || '';
    if (params.email) apiParams['email'] = params.email;
    if (params.addressLine1) apiParams['address-line-1'] = params.addressLine1;
    if (params.addressLine2) apiParams['address-line-2'] = params.addressLine2;
    if (params.city) apiParams['city'] = params.city;
    if (params.state) apiParams['state'] = params.state;
    if (params.country) apiParams['country'] = params.country;
    if (params.zipcode) apiParams['zipcode'] = params.zipcode;
    if (params.phoneCountryCode) apiParams['phone-cc'] = params.phoneCountryCode;
    if (params.phone) apiParams['phone'] = params.phone;
    if (params.faxCountryCode) apiParams['fax-cc'] = params.faxCountryCode;
    if (params.fax) apiParams['fax'] = params.fax;
    
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
  async listByCustomer(
    customerId: string, 
    options?: { type?: string; page?: number; limit?: number }
  ): Promise<{ contacts: Contact[]; total: number }> {
    // GUARD: Validate customerId before hitting RC API
    if (!customerId || customerId === 'undefined' || customerId === 'null') {
      throw new Error(`[ContactService] Invalid customer-id: "${customerId}" — cannot search contacts without a valid RC customer ID`);
    }

    const params: Record<string, string | number> = {
      'customer-id': customerId,
      'no-of-records': options?.limit || 500,
      'page-no': options?.page || 1,
    };
    
    if (options?.type) params['type'] = options.type;
    
    const response = await this.client.get<SearchResponse<Record<string, unknown>>>(
      'contacts/search.json',
      params
    );
    
    const contacts: Contact[] = [];
    if (response.result && Array.isArray(response.result)) {
      for (const item of response.result) {
        contacts.push(this.mapContact(item));
      }
    }
    
    return {
      contacts,
      total: parseInt(response.recsindb || '0'),
    };
  }
  
  /**
   * Check if contact can be used for a specific TLD
   */
  async validateForTld(contactId: string, tld: string): Promise<{ valid: boolean; errors?: string[] }> {
    const params = {
      'contact-id': contactId,
      'tld': tld.replace('.', ''),
    };
    
    try {
      await this.client.get('contacts/validate-registrant.json', params);
      return { valid: true };
    } catch (error) {
      if (error instanceof Error) {
        return { valid: false, errors: [error.message] };
      }
      return { valid: false, errors: ['Unknown validation error'] };
    }
  }
  
  /**
   * Get default contact for a customer (if exists)
   */
  async getDefault(customerId: string): Promise<Contact | null> {
    const { contacts } = await this.listByCustomer(customerId, { limit: 1 });
    return contacts[0] || null;
  }
  
  /**
   * Create or update contact
   * Returns existing contact if matches by email, otherwise creates new
   */
  async createOrUpdate(params: ContactCreateParams): Promise<{ contactId: string; created: boolean }> {
    // GUARD: Validate customerId before any RC API calls
    if (!params.customerId || params.customerId === 'undefined' || params.customerId === 'null') {
      throw new Error(`[ContactService] Cannot create/update contact: invalid customerId="${params.customerId}". Ensure ResellerClub customer is created first.`);
    }

    // Try to find existing contact by email
    const { contacts } = await this.listByCustomer(params.customerId);
    const existing = contacts.find(c => c.email.toLowerCase() === params.email.toLowerCase());
    
    if (existing) {
      // Update existing contact
      await this.update(existing.contactId, params);
      return { contactId: existing.contactId, created: false };
    }
    
    // Create new contact
    const result = await this.create(params);
    return { contactId: result.contactId, created: true };
  }
  
  /**
   * Map API response to Contact type
   */
  private mapContact(data: Record<string, unknown>): Contact {
    return {
      contactId: String(data.contactid || data['contact-id'] || data.entityid || ''),
      type: (data.type as Contact['type']) || 'Contact',
      name: String(data.name || ''),
      company: data.company ? String(data.company) : undefined,
      email: String(data.emailaddr || data.email || ''),
      addressLine1: String(data['address-line-1'] || data.address1 || data.addressline1 || ''),
      addressLine2: data['address-line-2'] ? String(data['address-line-2']) : undefined,
      addressLine3: data['address-line-3'] ? String(data['address-line-3']) : undefined,
      city: String(data.city || ''),
      state: String(data.state || ''),
      country: String(data.country || ''),
      zipcode: String(data.zip || data.zipcode || data.postalcode || ''),
      phoneCountryCode: String(data['phone-cc'] || data.phonecc || data.telnocc || ''),
      phone: String(data.phone || data.telno || ''),
      faxCountryCode: data['fax-cc'] ? String(data['fax-cc']) : undefined,
      fax: data.fax ? String(data.fax) : undefined,
    };
  }
}

// Export singleton instance
export const contactService = new ContactService();
