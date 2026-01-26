/**
 * Paddle Test Utilities
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * Test utilities for Paddle integration:
 * - Test card numbers
 * - Webhook simulation
 * - Test subscription creation
 * 
 * @see phases/enterprise-modules/PHASE-EM-59B-PADDLE-BILLING.md
 */

import { paddle, isPaddleConfigured, isPaddleSandbox } from '../client';

// ============================================================================
// Test Credit Card Numbers (Paddle Sandbox)
// ============================================================================

/**
 * Test credit card numbers for Paddle sandbox environment
 * These only work in sandbox mode - never use in production
 */
export const TEST_CARDS = {
  /** Successful payment */
  success: '4242424242424242',
  /** Generic decline */
  decline: '4000000000000002',
  /** Insufficient funds */
  insufficient_funds: '4000000000009995',
  /** Expired card */
  expired: '4000000000000069',
  /** Processing error */
  processing_error: '4000000000000119',
  /** CVC check fails */
  cvc_check_fail: '4000000000000127',
  /** 3D Secure authentication required */
  require_3ds: '4000000000003220',
};

/**
 * Default test card details
 */
export const TEST_CARD_DETAILS = {
  cardNumber: TEST_CARDS.success,
  expiryMonth: '12',
  expiryYear: '2030',
  cvc: '123',
  cardholderName: 'Test User',
};

// ============================================================================
// Webhook Simulation
// ============================================================================

/**
 * Simulates a Paddle webhook event for testing
 * 
 * @param eventType - The type of event to simulate
 * @param data - The event data
 * @returns A mock webhook event object
 */
export function simulateWebhook(eventType: string, data: Record<string, unknown>): {
  eventId: string;
  eventType: string;
  occurredAt: string;
  data: Record<string, unknown>;
} {
  return {
    eventId: `evt_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    eventType,
    occurredAt: new Date().toISOString(),
    data,
  };
}

/**
 * Generate mock subscription created webhook
 */
export function mockSubscriptionCreatedWebhook(params: {
  subscriptionId: string;
  customerId: string;
  priceId: string;
  status?: string;
}) {
  return simulateWebhook('subscription.created', {
    id: params.subscriptionId,
    customer_id: params.customerId,
    status: params.status || 'active',
    items: [{
      price: { id: params.priceId },
      quantity: 1,
    }],
    current_billing_period: {
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
}

/**
 * Generate mock transaction completed webhook
 */
export function mockTransactionCompletedWebhook(params: {
  transactionId: string;
  subscriptionId: string;
  total: number;
  currency?: string;
}) {
  return simulateWebhook('transaction.completed', {
    id: params.transactionId,
    subscription_id: params.subscriptionId,
    status: 'completed',
    details: {
      totals: {
        total: params.total.toString(),
        subtotal: params.total.toString(),
        tax: '0',
      },
    },
    currency_code: params.currency || 'USD',
    billed_at: new Date().toISOString(),
  });
}

/**
 * Generate mock payment failed webhook
 */
export function mockPaymentFailedWebhook(params: {
  transactionId: string;
  subscriptionId: string;
  errorCode?: string;
}) {
  return simulateWebhook('transaction.payment_failed', {
    id: params.transactionId,
    subscription_id: params.subscriptionId,
    status: 'past_due',
    payments: [{
      status: 'error',
      error_code: params.errorCode || 'card_declined',
    }],
  });
}

// ============================================================================
// Test Subscription Helpers
// ============================================================================

/**
 * Create a test subscription in Paddle sandbox
 * Note: Paddle subscriptions are created through checkout, not direct API.
 * This function simulates the subscription creation process for testing.
 * 
 * In real scenarios, subscriptions are created when:
 * 1. Customer completes checkout flow
 * 2. Paddle sends subscription.created webhook
 * 
 * For testing, use the webhook simulation functions instead.
 * 
 * @param customerId - Paddle customer ID
 * @param priceId - Paddle price ID
 * @returns Mock subscription ID for testing
 */
export async function createTestSubscription(
  customerId: string,
  priceId: string
): Promise<string> {
  if (!isPaddleConfigured || !isPaddleSandbox) {
    throw new Error('Test subscriptions can only be created in Paddle sandbox');
  }
  
  if (!paddle) {
    throw new Error('Paddle client not initialized');
  }
  
  // Note: Paddle doesn't have a direct subscription.create API
  // Subscriptions are created through checkout flow + webhooks
  // For testing, return a mock subscription ID
  console.warn('[Test] Paddle subscriptions are created via checkout, not direct API');
  console.warn('[Test] Use mockSubscriptionCreatedWebhook for webhook testing');
  
  // Generate a test subscription ID (format: sub_test_xxx)
  const testSubId = `sub_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  return testSubId;
}

/**
 * Create a test customer in Paddle sandbox
 * 
 * @param email - Customer email
 * @param name - Customer name
 * @returns Customer ID
 */
export async function createTestCustomer(
  email: string,
  name?: string
): Promise<string> {
  if (!isPaddleConfigured || !isPaddleSandbox) {
    throw new Error('Test customers can only be created in Paddle sandbox');
  }
  
  if (!paddle) {
    throw new Error('Paddle client not initialized');
  }
  
  const customer = await paddle.customers.create({
    email,
    name: name || 'Test User',
  });
  
  return customer.id;
}

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Generate a random test email
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `test+${timestamp}${random}@dramac.test`;
}

/**
 * Generate test agency data
 */
export function generateTestAgencyData() {
  const id = `test_agency_${Date.now()}`;
  return {
    id,
    name: `Test Agency ${id}`,
    email: generateTestEmail(),
  };
}

/**
 * Generate test usage data
 */
export function generateTestUsageData(agencyId: string, siteId: string) {
  return {
    agency_id: agencyId,
    site_id: siteId,
    automation_runs: Math.floor(Math.random() * 500),
    ai_actions: Math.floor(Math.random() * 200),
    api_calls: Math.floor(Math.random() * 5000),
    hour_timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Test Validation
// ============================================================================

/**
 * Verify Paddle sandbox is properly configured
 */
export function verifySandboxConfiguration(): {
  configured: boolean;
  sandbox: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!process.env.PADDLE_API_KEY) {
    errors.push('PADDLE_API_KEY is not set');
  }
  
  if (process.env.PADDLE_ENVIRONMENT !== 'sandbox') {
    errors.push('PADDLE_ENVIRONMENT is not set to "sandbox"');
  }
  
  if (!process.env.PADDLE_WEBHOOK_SECRET) {
    errors.push('PADDLE_WEBHOOK_SECRET is not set');
  }
  
  return {
    configured: isPaddleConfigured,
    sandbox: isPaddleSandbox,
    errors,
  };
}
