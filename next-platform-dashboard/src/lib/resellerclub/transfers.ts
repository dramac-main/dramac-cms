// src/lib/resellerclub/transfers.ts
// ResellerClub Domain Transfer & Renewal Operations

import { getResellerClubClient } from './client';
import { ResellerClubError, PurchasesDisabledError } from './errors';
import { arePurchasesAllowed } from './config';

// ============================================================================
// Transfer Types
// ============================================================================

export type TransferStatus =
  | 'pending'
  | 'awaiting-auth'
  | 'auth-submitted'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface DomainTransferIn {
  domainName: string;
  authCode: string;
  customerId: string;
  registrantContactId: string;
  adminContactId: string;
  techContactId: string;
  billingContactId: string;
  purchasePrivacy?: boolean;
  autoRenew?: boolean;
}

export interface DomainTransferOut {
  orderId: string;
}

export interface TransferDetails {
  orderId: string;
  domainName: string;
  status: TransferStatus;
  initiatedAt: string;
  completedAt?: string;
  failureReason?: string;
  currentStep: number;
  totalSteps: number;
  estimatedCompletion?: string;
}

// ============================================================================
// Transfer Operations
// ============================================================================

export const transferService = {
  /**
   * Initiate a domain transfer-in
   * POST /api/domains/transfer.json
   */
  async initiateTransferIn(params: DomainTransferIn): Promise<{ orderId: string }> {
    // ⚠️ SAFETY: This operation spends real money
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('domain transfer');
    }

    const client = getResellerClubClient();

    const response = await client.post<{ entityid: string }>('/domains/transfer.json', {
      'domain-name': params.domainName,
      'auth-code': params.authCode,
      'customer-id': params.customerId,
      'reg-contact-id': params.registrantContactId,
      'admin-contact-id': params.adminContactId,
      'tech-contact-id': params.techContactId,
      'billing-contact-id': params.billingContactId,
      'purchase-privacy': params.purchasePrivacy ? 'true' : 'false',
      'auto-renew': params.autoRenew ? 'true' : 'false',
      'invoice-option': 'NoInvoice',
    });

    if (!response.entityid) {
      throw new ResellerClubError('Failed to initiate transfer', 'TRANSFER_FAILED', 500);
    }

    return { orderId: response.entityid };
  },

  /**
   * Submit auth code for pending transfer
   * POST /api/domains/transfer/submit-auth-code.json
   */
  async submitAuthCode(orderId: string, authCode: string): Promise<void> {
    const client = getResellerClubClient();

    await client.post('/domains/transfer/submit-auth-code.json', {
      'order-id': orderId,
      'auth-code': authCode,
    });
  },

  /**
   * Cancel a pending transfer
   * POST /api/domains/transfer/cancel.json
   */
  async cancelTransfer(orderId: string): Promise<void> {
    const client = getResellerClubClient();

    await client.post('/domains/transfer/cancel.json', {
      'order-id': orderId,
    });
  },

  /**
   * Get transfer details
   * GET /api/domains/details.json (transfer-specific fields)
   */
  async getTransferDetails(orderId: string): Promise<TransferDetails> {
    const client = getResellerClubClient();

    const response = await client.get<Record<string, unknown>>('/domains/details.json', {
      'order-id': orderId,
      'options': 'TransferStatus',
    });

    return mapTransferDetails(response);
  },

  /**
   * Get auth code for transfer-out
   * GET /api/domains/locks.json + unlock then get code
   */
  async getAuthCode(orderId: string): Promise<string> {
    const client = getResellerClubClient();

    // First, disable transfer lock
    await client.post('/domains/disable-theft-protection.json', {
      'order-id': orderId,
    });

    // Get the auth code
    const response = await client.get<{ domsecret: string }>('/domains/details.json', {
      'order-id': orderId,
      'options': 'DomainSecret',
    });

    if (!response.domsecret) {
      throw new ResellerClubError('Auth code not available', 'AUTH_CODE_UNAVAILABLE', 400);
    }

    return response.domsecret;
  },

  /**
   * Enable/disable transfer lock
   */
  async setTransferLock(orderId: string, locked: boolean): Promise<void> {
    const client = getResellerClubClient();

    const endpoint = locked
      ? '/domains/enable-theft-protection.json'
      : '/domains/disable-theft-protection.json';

    await client.post(endpoint, {
      'order-id': orderId,
    });
  },

  /**
   * Resend transfer approval email
   */
  async resendApprovalEmail(orderId: string): Promise<void> {
    const client = getResellerClubClient();

    await client.post('/domains/transfer/resend-approval-email.json', {
      'order-id': orderId,
    });
  },
};

// ============================================================================
// Renewal Operations
// ============================================================================

export const renewalService = {
  /**
   * Renew a domain
   * POST /api/domains/renew.json
   */
  async renewDomain(orderId: string, years: number): Promise<{ invoiceId: string }> {
    // ⚠️ SAFETY: This operation spends real money
    if (!arePurchasesAllowed()) {
      throw new PurchasesDisabledError('domain renewal');
    }

    const client = getResellerClubClient();

    const response = await client.post<{ invoiceid: string }>('/domains/renew.json', {
      'order-id': orderId,
      'years': years,
      'invoice-option': 'NoInvoice',
    });

    return { invoiceId: response.invoiceid || '' };
  },

  /**
   * Enable auto-renewal
   */
  async setAutoRenew(orderId: string, enabled: boolean): Promise<void> {
    const client = getResellerClubClient();

    const endpoint = enabled
      ? '/domains/enable-auto-renewal.json'
      : '/domains/disable-auto-renewal.json';

    await client.post(endpoint, {
      'order-id': orderId,
    });
  },

  /**
   * Get domains expiring soon
   * GET /api/domains/search.json with expiry filter
   */
  async getExpiringDomains(days: number = 30): Promise<string[]> {
    const client = getResellerClubClient();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const response = await client.get<Record<string, Record<string, string>>>('/domains/search.json', {
      'expiry-date-start': Math.floor(Date.now() / 1000).toString(),
      'expiry-date-end': Math.floor(expiryDate.getTime() / 1000).toString(),
      'no-of-records': '100',
      'page-no': '1',
    });

    return Object.values(response)
      .filter(d => typeof d === 'object' && d.entity)
      .map(d => d.entity);
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function mapTransferDetails(data: Record<string, unknown>): TransferDetails {
  const statusMap: Record<string, TransferStatus> = {
    'Pending': 'pending',
    'AwaitingAuth': 'awaiting-auth',
    'AuthSubmitted': 'auth-submitted',
    'InProgress': 'in-progress',
    'Completed': 'completed',
    'Failed': 'failed',
    'Cancelled': 'cancelled',
  };

  return {
    orderId: String(data.entityid || data.orderid || ''),
    domainName: String(data.domainname || ''),
    status: statusMap[data.orderstatus as string] || 'pending',
    initiatedAt: String(data.creationtime || ''),
    completedAt: data.completiontime ? String(data.completiontime) : undefined,
    failureReason: data.reason ? String(data.reason) : undefined,
    currentStep: 1,
    totalSteps: 5,
  };
}
