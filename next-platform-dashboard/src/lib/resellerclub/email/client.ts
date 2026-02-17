// src/lib/resellerclub/email/client.ts
// Business Email (Titan) API Client via ResellerClub

import { getResellerClubClient } from '../client';
import { ResellerClubError, PurchasesDisabledError } from '../errors';
import { arePurchasesAllowed } from '../config';
import type {
  CreateEmailOrderParams,
  AddEmailAccountParams,
  DeleteEmailAccountParams,
  RenewEmailOrderParams,
  SearchEmailOrdersParams,
  EmailOrderDetails,
  EmailPricingResponse,
  EmailDnsRecords,
  EmailOrderStatus,
  EmailPlanType,
} from './types';
import { EMAIL_PRODUCT_KEYS } from './types';

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
    // ⚠️ SAFETY: This operation spends real money
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('email order creation');
    }

    const client = getResellerClubClient();
    
    const response = await client.post<Record<string, unknown>>('eelite/add.json', {
      'domain-name': params.domainName,
      'customer-id': params.customerId,
      'no-of-accounts': params.numberOfAccounts,
      'months': params.months,
      'product-key': params.productKey || EMAIL_PRODUCT_KEYS.eeliteus,
      'invoice-option': params.invoiceOption || 'NoInvoice',
      'auto-renew': false, // Required parameter per RC API docs
    });

    // Defensive response handling — RC may return number, string, or object
    // (same pattern as domain contacts fix)
    let orderId: string;
    if (typeof response === 'number') {
      orderId = String(response);
    } else if (typeof response === 'string') {
      orderId = response;
    } else if (response && typeof response === 'object') {
      // Check actionstatus for errors
      if (response.status === 'ERROR' || response.actionstatus === 'Failed') {
        const errorMsg = response.message || response.actionstatusdesc || 'Order creation failed';
        throw new ResellerClubError(String(errorMsg), 'CREATE_FAILED', 500);
      }
      orderId = String(response.entityid || '');
    } else {
      throw new ResellerClubError('Failed to create email order — unexpected response', 'CREATE_FAILED', 500);
    }

    if (!orderId || orderId === 'undefined' || orderId === 'null') {
      throw new ResellerClubError('Failed to create email order — no order ID returned', 'CREATE_FAILED', 500);
    }

    return {
      orderId,
      invoiceId: (response as Record<string, unknown>)?.invoiceid ? String((response as Record<string, unknown>).invoiceid) : '',
    };
  },

  /**
   * Renew an existing email order
   * POST /api/eelite/renew.json
   */
  async renewOrder(params: RenewEmailOrderParams): Promise<{ success: boolean; invoiceId: string }> {
    // ⚠️ SAFETY: This operation spends real money
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('email order renewal');
    }

    const client = getResellerClubClient();
    
    const response = await client.post<{ invoiceid?: string }>('eelite/renew.json', {
      'order-id': params.orderId,
      'months': params.months,
      'no-of-accounts': params.numberOfAccounts,
      'invoice-option': params.invoiceOption || 'NoInvoice',
    });

    return {
      success: true,
      invoiceId: response.invoiceid ? String(response.invoiceid) : '',
    };
  },

  /**
   * Get email order details
   * GET /api/eelite/details.json
   */
  async getOrderDetails(orderId: string): Promise<EmailOrderDetails> {
    const client = getResellerClubClient();
    
    const response = await client.get<Record<string, unknown>>('eelite/details.json', {
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
      const response = await client.get<string | number>('eelite/orderid.json', {
        'domain-name': domainName,
      });
      return response ? String(response) : null;
    } catch (error) {
      if ((error as ResellerClubError).code === 'NOT_FOUND') {
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
    
    const queryParams: Record<string, string | number | boolean> = {
      'no-of-records': params.noOfRecords || 50,
      'page-no': params.pageNo || 1,
    };
    
    if (params.customerId) queryParams['customer-id'] = params.customerId;
    if (params.domainName) queryParams['domain-name'] = params.domainName;
    if (params.status) queryParams['status'] = params.status;
    if (params.orderBy) queryParams['order-by'] = params.orderBy;
    
    const response = await client.get<Record<string, Record<string, unknown>>>('eelite/search.json', queryParams);
    
    // Response is keyed by order ID
    return Object.entries(response)
      .filter(([key]) => key !== 'recsonpage' && key !== 'recsindb')
      .map(([, data]) => mapOrderDetailsResponse(data as Record<string, unknown>));
  },

  /**
   * Suspend an email order
   * POST /api/eelite/suspend.json
   */
  async suspendOrder(orderId: string, reason: string): Promise<void> {
    const client = getResellerClubClient();
    await client.post('eelite/suspend.json', {
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
    await client.post('eelite/unsuspend.json', {
      'order-id': orderId,
    });
  },

  /**
   * Delete an email order
   * POST /api/eelite/delete.json
   */
  async deleteOrder(orderId: string): Promise<void> {
    const client = getResellerClubClient();
    await client.post('eelite/delete.json', {
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
    
    await client.post('eelite/add-email-account.json', {
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
    
    await client.post('eelite/delete-email-account.json', {
      'order-id': params.orderId,
      'email': params.email,
    });

    return { success: true };
  },

  // --------------------------------------------------------------------------
  // Pricing
  // --------------------------------------------------------------------------

  /**
   * Get customer pricing for email plans (what end-customers pay)
   * This reflects ResellerClub markups and should be used as retail price.
   * Uses the generic Products API: GET /api/products/customer-price.json
   * The response contains ALL products; callers extract the 'eeliteus' key.
   */
  async getCustomerPricing(customerId?: string): Promise<EmailPricingResponse> {
    const client = getResellerClubClient();
    const params: Record<string, string> = {};
    if (customerId && customerId.trim()) {
      params['customer-id'] = customerId;
    }
    return client.get<EmailPricingResponse>('products/customer-price.json', params);
  },

  /**
   * Get reseller pricing for email plans (slab-based pricing you configure)
   * @deprecated Use getCustomerPricing for retail or getResellerCostPricing for wholesale
   * Uses the generic Products API: GET /api/products/reseller-price.json
   */
  async getResellerPricing(): Promise<EmailPricingResponse> {
    const client = getResellerClubClient();
    return client.get<EmailPricingResponse>('products/reseller-price.json');
  },
  
  /**
   * Get reseller cost pricing for email plans (wholesale/what you pay ResellerClub)
   * Uses the generic Products API: GET /api/products/reseller-cost-price.json
   */
  async getResellerCostPricing(): Promise<EmailPricingResponse> {
    const client = getResellerClubClient();
    return client.get<EmailPricingResponse>('products/reseller-cost-price.json');
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
    
    const response = await client.get<Record<string, unknown>>('eelite/dns-records.json', {
      'order-id': orderId,
    });

    return mapDnsRecordsResponse(response);
  },
};

function mapOrderDetailsResponse(data: Record<string, unknown>): EmailOrderDetails {
  return {
    orderId: String(data.entityid || data.orderid || ''),
    entityId: String(data.entityid || ''),
    domainName: String(data.domainname || ''),
    customerId: String(data.customerid || ''),
    currentStatus: (data.currentstatus as EmailOrderStatus) || 'Pending',
    numberOfAccounts: Number(data.noofaccounts || 0),
    usedAccounts: Number(data.usedaccounts || 0),
    creationTime: String(data.creationtime || ''),
    endTime: String(data.endtime || ''),
    productKey: (data.productkey as EmailPlanType) || 'eeliteus',
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
