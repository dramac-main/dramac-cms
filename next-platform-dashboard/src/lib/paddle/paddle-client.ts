/**
 * Paddle.js Client-Side Integration
 * 
 * Phase EM-59: Paddle Billing Integration
 * 
 * This file provides client-side Paddle.js functionality:
 * - Initialize Paddle.js
 * - Open checkout overlay
 * - Update payment method
 * 
 * Usage:
 * ```tsx
 * import { openPaddleCheckout } from '@/lib/paddle/paddle-client';
 * 
 * // In component
 * const handleSubscribe = async () => {
 *   await openPaddleCheckout({
 *     priceId: 'pri_xxx',
 *     agencyId: 'agency-uuid',
 *     email: 'user@example.com',
 *   });
 * };
 * ```
 * 
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 */

'use client';

import { initializePaddle, Paddle } from '@paddle/paddle-js';

// ============================================================================
// Singleton Instance
// ============================================================================

let paddleInstance: Paddle | null = null;
let initPromise: Promise<Paddle> | null = null;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Get or initialize the Paddle.js instance
 */
export async function getPaddle(): Promise<Paddle> {
  // Return existing instance if available
  if (paddleInstance) {
    return paddleInstance;
  }
  
  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }
  
  // Start initialization
  initPromise = initializePaddleInstance();
  paddleInstance = await initPromise;
  return paddleInstance;
}

async function initializePaddleInstance(): Promise<Paddle> {
  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;
  
  if (!clientToken) {
    throw new Error('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not configured');
  }
  
  const paddle = await initializePaddle({
    environment: environment === 'sandbox' ? 'sandbox' : 'production',
    token: clientToken,
    checkout: {
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en',
        allowLogout: true,
        showAddDiscounts: true,
        showAddTaxId: true,
      },
    },
    eventCallback: (event) => {
      handlePaddleEvent(event);
    },
  });
  
  if (!paddle) {
    throw new Error('Failed to initialize Paddle.js');
  }
  
  return paddle;
}

// ============================================================================
// Event Handling
// ============================================================================

function handlePaddleEvent(event: any): void {
  // Log full event object for debugging
  console.log('[Paddle.js] Event received:', event);
  console.log('[Paddle.js] Event name:', event?.name);
  console.log('[Paddle.js] Event data:', event?.data);
  console.log('[Paddle.js] Event error:', event?.error);
  
  switch (event?.name) {
    case 'checkout.loaded':
      console.log('[Paddle.js] Checkout loaded successfully');
      break;
    
    case 'checkout.completed':
      console.log('[Paddle.js] Checkout completed!', event.data);
      // The webhook will handle the subscription creation
      // We can show a success message or redirect
      window.dispatchEvent(new CustomEvent('paddle:checkout:completed', {
        detail: event.data,
      }));
      break;
    
    case 'checkout.closed':
      console.log('[Paddle.js] Checkout closed');
      window.dispatchEvent(new CustomEvent('paddle:checkout:closed', {
        detail: event.data,
      }));
      break;
    
    case 'checkout.error':
      // Log all available error info
      console.error('[Paddle.js] Checkout error event:', {
        name: event?.name,
        data: event?.data,
        error: event?.error,
        detail: event?.detail,
        message: event?.message,
        fullEvent: JSON.stringify(event, null, 2),
      });
      window.dispatchEvent(new CustomEvent('paddle:checkout:error', {
        detail: event.data || event.error || event,
      }));
      break;
    
    case 'checkout.payment.initiated':
      console.log('[Paddle.js] Payment initiated');
      break;
    
    case 'checkout.payment.selected':
      console.log('[Paddle.js] Payment method selected');
      break;
    
    default:
      // Log any unknown events
      if (event?.name) {
        console.log('[Paddle.js] Unknown event:', event.name, event);
      }
  }
}

// ============================================================================
// Checkout Functions
// ============================================================================

export interface OpenCheckoutParams {
  priceId: string;
  agencyId: string;
  email: string;
  customerId?: string;
  successUrl?: string;
  discountCode?: string;
}

/**
 * Open Paddle checkout overlay for subscription
 */
export async function openPaddleCheckout(params: OpenCheckoutParams): Promise<void> {
  console.log('[Paddle.js] Opening checkout with params:', {
    priceId: params.priceId,
    agencyId: params.agencyId,
    email: params.email,
    customerId: params.customerId,
  });
  
  // Validate required params
  if (!params.priceId || params.priceId.trim() === '') {
    throw new Error('Invalid priceId: Price ID is required');
  }
  if (!params.agencyId) {
    throw new Error('Invalid agencyId: Agency ID is required');
  }
  if (!params.email && !params.customerId) {
    throw new Error('Either email or customerId is required');
  }
  
  const paddle = await getPaddle();
  
  const checkoutOptions: any = {
    items: [{ priceId: params.priceId, quantity: 1 }],
    customData: {
      agency_id: params.agencyId,
    },
    settings: {
      successUrl: params.successUrl || `${window.location.origin}/dashboard/billing?success=true`,
    },
  };
  
  // Add customer info
  if (params.customerId) {
    checkoutOptions.customer = { id: params.customerId };
  } else {
    checkoutOptions.customer = { email: params.email };
  }
  
  // Add discount code if provided
  if (params.discountCode) {
    checkoutOptions.discountCode = params.discountCode;
  }
  
  console.log('[Paddle.js] Checkout options:', JSON.stringify(checkoutOptions, null, 2));
  
  try {
    await paddle.Checkout.open(checkoutOptions);
  } catch (checkoutError: any) {
    console.error('[Paddle.js] Checkout.open() threw error:', {
      message: checkoutError?.message,
      code: checkoutError?.code,
      detail: checkoutError?.detail,
      errors: checkoutError?.errors,
      fullError: checkoutError,
    });
    throw checkoutError;
  }
}

/**
 * Open checkout from API response
 * Fetches checkout data from our API first
 */
export async function openCheckoutForPlan(
  planType: 'starter' | 'pro',
  billingCycle: 'monthly' | 'yearly',
  agencyId: string
): Promise<void> {
  // Get checkout data from our API
  const response = await fetch('/api/billing/paddle/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planType, billingCycle, agencyId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout');
  }
  
  const { data } = await response.json();
  
  await openPaddleCheckout({
    priceId: data.priceId,
    agencyId: data.agencyId,
    email: data.customerEmail,
    customerId: data.customerId,
  });
}

/**
 * Open payment method update
 */
export async function openUpdatePaymentMethod(transactionId: string): Promise<void> {
  const paddle = await getPaddle();
  
  await paddle.Checkout.open({
    transactionId,
    settings: {
      displayMode: 'overlay',
    },
  });
}

// ============================================================================
// Price Display Helpers
// ============================================================================

export interface PricePreviewParams {
  priceId: string;
  quantity?: number;
  customerCountry?: string;
}

/**
 * Get localized price preview
 */
export async function getPricePreview(params: PricePreviewParams): Promise<{
  subtotal: string;
  tax: string;
  total: string;
  currencyCode: string;
}> {
  const paddle = await getPaddle();
  
  const preview = await paddle.PricePreview({
    items: [{ priceId: params.priceId, quantity: params.quantity || 1 }],
    address: params.customerCountry ? { countryCode: params.customerCountry } : undefined,
  });
  
  const lineItem = preview.data.details.lineItems[0];
  
  // Use formattedTotals from line item for all values
  return {
    subtotal: lineItem?.formattedTotals?.subtotal || '',
    tax: lineItem?.formattedTotals?.tax || '',
    total: lineItem?.formattedTotals?.total || '',
    currencyCode: preview.data.currencyCode,
  };
}

// ============================================================================
// Hooks for React Components
// ============================================================================

/**
 * Check if Paddle.js is configured
 */
export function isPaddleClientConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
}

/**
 * Listen for checkout events
 * Returns cleanup function
 */
export function onCheckoutComplete(
  callback: (data: any) => void
): () => void {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener('paddle:checkout:completed', handler as EventListener);
  return () => {
    window.removeEventListener('paddle:checkout:completed', handler as EventListener);
  };
}

/**
 * Listen for checkout close
 * Returns cleanup function
 */
export function onCheckoutClose(
  callback: () => void
): () => void {
  const handler = () => callback();
  window.addEventListener('paddle:checkout:closed', handler);
  return () => {
    window.removeEventListener('paddle:checkout:closed', handler);
  };
}

/**
 * Listen for checkout error
 * Returns cleanup function
 */
export function onCheckoutError(
  callback: (error: any) => void
): () => void {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener('paddle:checkout:error', handler as EventListener);
  return () => {
    window.removeEventListener('paddle:checkout:error', handler as EventListener);
  };
}
