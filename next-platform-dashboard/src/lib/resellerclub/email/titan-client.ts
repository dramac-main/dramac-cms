// src/lib/resellerclub/email/titan-client.ts
// Titan Mail REST API Client — newer API that supports Professional, Business & Enterprise plans
//
// Product Keys: titanmailglobal (US/Global), titanmailindia (India)
// Plan IDs:
//   Professional = 1762 (Global) / 1761 (India) — 5 GB
//   Business     = 1756 (Global) / 1758 (India) — 10 GB
//   Enterprise   = 1757 (Global) / 1759 (India) — 50 GB
//   Free Trial   = 1755 (Global) / 1760 (India) — 90-day trial of Business
//
// Docs: https://manage.resellerclub.com/kb/node/3483
// Base: /restapi/product/{product_key}/... (NOT /api/eelite/...)

import { RESELLERCLUB_CONFIG } from '../config';
import { ResellerClubError, PurchasesDisabledError } from '../errors';
import { arePurchasesAllowed } from '../config';

// ============================================================================
// Types
// ============================================================================

export type TitanRegion = 'global' | 'india';

export const TITAN_PRODUCT_KEYS = {
  global: 'titanmailglobal',
  india: 'titanmailindia',
} as const;

// Plan IDs from RC documentation
export const TITAN_PLAN_IDS = {
  global: {
    professional: 1762,
    business: 1756,
    enterprise: 1757,
    free_trial: 1755,
  },
  india: {
    professional: 1761,
    business: 1758,
    enterprise: 1759,
    free_trial: 1760,
  },
} as const;

export type TitanPlanName = 'professional' | 'business' | 'enterprise' | 'free_trial';

export interface TitanPlanInfo {
  planId: number;
  name: string;
  storageGB: number;
  productKey: string;
}

/** All Titan plans for Global region */
export const TITAN_PLANS: Record<TitanPlanName, TitanPlanInfo> = {
  professional: { planId: 1762, name: 'Professional', storageGB: 5, productKey: 'titanmailglobal' },
  business: { planId: 1756, name: 'Business', storageGB: 10, productKey: 'titanmailglobal' },
  enterprise: { planId: 1757, name: 'Enterprise', storageGB: 50, productKey: 'titanmailglobal' },
  free_trial: { planId: 1755, name: 'Business (Free Trial)', storageGB: 10, productKey: 'titanmailglobal' },
};

export interface TitanCreateOrderParams {
  domainName: string;
  customerId: string;
  planId: number;
  numberOfAccounts: number;
  months: number;
  invoiceOption?: 'NoInvoice' | 'PayInvoice' | 'KeepInvoice' | 'OnlyAdd';
  discountAmount?: number;
  region?: TitanRegion;
}

export interface TitanCreateOrderResult {
  orderId: string;
  entityId: string;
  invoiceId: string;
  status: string;
  actionStatus: string;
}

export interface TitanRenewOrderParams {
  orderId: string;
  months: number;
  invoiceOption?: 'NoInvoice' | 'PayInvoice' | 'KeepInvoice' | 'OnlyAdd';
  additionalAccounts?: number;
  region?: TitanRegion;
}

export interface TitanOrderDetails {
  orderId: string;
  entityId: string;
  domainName: string;
  customerId: string;
  currentStatus: string;
  numberOfAccounts: number;
  usedAccounts: number;
  planId: number;
  planName: string;
  productKey: string;
  creationTime: string;
  endTime: string;
  isFree: boolean;
}

// ============================================================================
// REST API Client
// ============================================================================

/**
 * Build the base URL for the Titan Mail REST API.
 * Production: https://httpapi.com/restapi
 * Sandbox:    https://test.httpapi.com/restapi
 */
function getBaseUrl(): string {
  const apiUrl = RESELLERCLUB_CONFIG.apiUrl; // e.g. https://httpapi.com/api
  // Replace /api suffix with /restapi
  return apiUrl.replace(/\/api\/?$/, '/restapi');
}

function getAuthParams(): URLSearchParams {
  return new URLSearchParams({
    'auth-userid': RESELLERCLUB_CONFIG.resellerId,
    'api-key': RESELLERCLUB_CONFIG.apiKey,
  });
}

async function titanRequest<T = unknown>(
  method: string,
  path: string,
  params?: Record<string, string | number | boolean>,
  body?: Record<string, string | number | boolean>
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = new URL(`${baseUrl}${path}`);

  // Add auth params
  const authParams = getAuthParams();
  authParams.forEach((val, key) => url.searchParams.set(key, val));

  // Add query params
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      url.searchParams.set(key, String(val));
    }
  }

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'type': 'text',
    },
  };

  // For POST/PATCH/DELETE with body params, encode in URL query (RC pattern)
  if (body && (method === 'POST' || method === 'PATCH' || method === 'DELETE')) {
    for (const [key, val] of Object.entries(body)) {
      url.searchParams.set(key, String(val));
    }
  }

  const response = await fetch(url.toString(), init);

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `Titan Mail API error: HTTP ${response.status}`;
    try {
      const errorData = JSON.parse(text);
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      errorMsg = text || errorMsg;
    }
    throw new ResellerClubError(errorMsg, 'TITAN_API_ERROR', response.status);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// Titan Mail API Methods
// ============================================================================

export const titanMailApi = {
  /**
   * Create a new Titan Mail order.
   * POST /restapi/product/{product_key}/order
   *
   * Docs: https://manage.resellerclub.com/kb/node/3483
   */
  async createOrder(params: TitanCreateOrderParams): Promise<TitanCreateOrderResult> {
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('Titan Mail order creation');
    }

    const productKey = params.region === 'india'
      ? TITAN_PRODUCT_KEYS.india
      : TITAN_PRODUCT_KEYS.global;

    const additionalParamJson = JSON.stringify({ no_of_accounts: String(params.numberOfAccounts) });

    const response = await titanRequest<Record<string, unknown>>(
      'POST',
      `/product/${productKey}/order`,
      {
        'domain-name': params.domainName,
        'customer-id': params.customerId,
        'plan-id': params.planId,
        'noOfMonths': params.months,
        'invoice-option': params.invoiceOption || 'NoInvoice',
        'additional-param-json': additionalParamJson,
        ...(params.discountAmount ? { 'discount-amount': params.discountAmount } : {}),
      }
    );

    // Check for errors
    if (response.status === 'error' || response.error) {
      throw new ResellerClubError(
        String(response.error || response.message || 'Order creation failed'),
        'CREATE_FAILED',
        500
      );
    }

    return {
      orderId: String(response.orderid || ''),
      entityId: String(response.entityid || ''),
      invoiceId: String(response.invoiceid || ''),
      status: String(response.status || 'success'),
      actionStatus: String(response.actionstatus || ''),
    };
  },

  /**
   * Renew an existing Titan Mail order.
   * PATCH /restapi/product/{product_key}/order/{order-id}/tenure/{tenure}
   */
  async renewOrder(params: TitanRenewOrderParams): Promise<{ success: boolean; status: string }> {
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('Titan Mail order renewal');
    }

    const productKey = params.region === 'india'
      ? TITAN_PRODUCT_KEYS.india
      : TITAN_PRODUCT_KEYS.global;

    const queryParams: Record<string, string | number | boolean> = {
      'invoice-option': params.invoiceOption || 'NoInvoice',
    };
    if (params.additionalAccounts) {
      queryParams['additional-info'] = JSON.stringify({ no_of_accounts: String(params.additionalAccounts) });
    }

    const response = await titanRequest<Record<string, unknown>>(
      'PATCH',
      `/product/${productKey}/order/${params.orderId}/tenure/${params.months}`,
      queryParams
    );

    return {
      success: true,
      status: String(response.actionstatus || response.status || 'success'),
    };
  },

  /**
   * Get order details.
   * GET /restapi/product/{product_key}?order-id={orderId}
   */
  async getOrderDetails(orderId: string, region: TitanRegion = 'global'): Promise<TitanOrderDetails> {
    const productKey = region === 'india'
      ? TITAN_PRODUCT_KEYS.india
      : TITAN_PRODUCT_KEYS.global;

    const response = await titanRequest<Record<string, unknown>>(
      'GET',
      `/product/${productKey}`,
      { 'order-id': orderId }
    );

    return {
      orderId: String(response.orderid || ''),
      entityId: String(response.entityid || ''),
      domainName: String(response.domainname || ''),
      customerId: String(response.customerid || ''),
      currentStatus: String(response.currentstatus || ''),
      numberOfAccounts: Number(response.noofaccounts || 0),
      usedAccounts: Number(response.used_account_count || 0),
      planId: Number(response.planid || 0),
      planName: String(response.plan_name || ''),
      productKey: String(response.productkey || productKey),
      creationTime: String(response.creationtime || ''),
      endTime: String(response.endtime || ''),
      isFree: Boolean(response.is_free),
    };
  },

  /**
   * Add additional mailbox seats.
   * PATCH /restapi/product/{product_key}/orders/{order-id}/seats/{seats}
   */
  async addSeats(orderId: string, seats: number, region: TitanRegion = 'global'): Promise<{ success: boolean }> {
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('Titan Mail add seats');
    }

    const productKey = region === 'india'
      ? TITAN_PRODUCT_KEYS.india
      : TITAN_PRODUCT_KEYS.global;

    await titanRequest(
      'PATCH',
      `/product/${productKey}/orders/${orderId}/seats/${seats}`,
      { 'invoice-option': 'NoInvoice' }
    );

    return { success: true };
  },

  /**
   * Suspend an order.
   * PATCH /restapi/product/{product_key}/order/{order-id}/suspend
   */
  async suspendOrder(orderId: string, reason: string, region: TitanRegion = 'global'): Promise<void> {
    const productKey = region === 'india'
      ? TITAN_PRODUCT_KEYS.india
      : TITAN_PRODUCT_KEYS.global;

    await titanRequest(
      'PATCH',
      `/product/${productKey}/order/${orderId}/suspend`,
      { reason }
    );
  },

  /**
   * Unsuspend an order.
   * PATCH /restapi/product/{product_key}/order/{order-id}/unsuspend
   */
  async unsuspendOrder(orderId: string, region: TitanRegion = 'global'): Promise<void> {
    const productKey = region === 'india'
      ? TITAN_PRODUCT_KEYS.india
      : TITAN_PRODUCT_KEYS.global;

    await titanRequest(
      'PATCH',
      `/product/${productKey}/order/${orderId}/unsuspend`
    );
  },

  /**
   * Delete an order.
   * DELETE /restapi/product/{product_key}/order/{order-id}
   */
  async deleteOrder(orderId: string, region: TitanRegion = 'global'): Promise<void> {
    const productKey = region === 'india'
      ? TITAN_PRODUCT_KEYS.india
      : TITAN_PRODUCT_KEYS.global;

    await titanRequest(
      'DELETE',
      `/product/${productKey}/order/${orderId}`
    );
  },

  /**
   * Fetch autologin SSO URL.
   * GET /restapi/product/{product_key}/order/{order-id}/sso-url
   */
  async getAutoLoginUrl(orderId: string, region: TitanRegion = 'global'): Promise<{ ssoUrl: string; iframeUrl: string }> {
    const productKey = region === 'india'
      ? TITAN_PRODUCT_KEYS.india
      : TITAN_PRODUCT_KEYS.global;

    const response = await titanRequest<{ sso_url: string; iframe_url: string }>(
      'GET',
      `/product/${productKey}/order/${orderId}/sso-url`
    );

    return {
      ssoUrl: response.sso_url || '',
      iframeUrl: response.iframe_url || '',
    };
  },

  /**
   * Modify (upgrade) an order to a different plan.
   * PATCH /restapi/product/{product_key}/order/{order-id}/plan/{planid}
   */
  async upgradePlan(
    orderId: string,
    newPlanId: number,
    months: number,
    region: TitanRegion = 'global'
  ): Promise<{ success: boolean }> {
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('Titan Mail plan upgrade');
    }

    const productKey = region === 'india'
      ? TITAN_PRODUCT_KEYS.india
      : TITAN_PRODUCT_KEYS.global;

    await titanRequest(
      'PATCH',
      `/product/${productKey}/order/${orderId}/plan/${newPlanId}`,
      {
        'noOfMonths': months,
        'invoice-option': 'NoInvoice',
      }
    );

    return { success: true };
  },
};

/**
 * Resolve a plan-id to a human-readable plan name.
 */
export function titanPlanName(planId: number): string {
  for (const [, plans] of Object.entries(TITAN_PLAN_IDS)) {
    for (const [name, id] of Object.entries(plans)) {
      if (id === planId) {
        return name === 'free_trial'
          ? 'Business (Free Trial)'
          : name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
  }
  return 'Email';
}
