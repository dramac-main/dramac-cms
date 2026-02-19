/**
 * E-Commerce Payment Webhooks
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Handles payment provider webhooks (Paddle, Flutterwave, Pesapal, DPO)
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { 
  updatePublicOrderStatus,
  updatePublicOrderPaymentStatus,
  updatePublicOrder,
  getPublicEcommerceSettings 
} from '@/modules/ecommerce/actions/public-ecommerce-actions'
import type {
  PaddleConfig,
  FlutterwaveConfig
} from '@/modules/ecommerce/types/ecommerce-types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/modules/ecommerce/webhooks/payment
 * 
 * Handle payment provider webhooks
 * 
 * Query params:
 * - provider: Required - Payment provider (paddle, flutterwave, pesapal, dpo)
 * - orderId: Optional - Order ID (for some providers)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    
    if (!provider) {
      return NextResponse.json(
        { error: 'provider is required' },
        { status: 400 }
      )
    }

    const body = await request.text()
    const signature = request.headers.get('x-signature') || 
                     request.headers.get('verif-hash') ||
                     request.headers.get('paddle-signature')

    switch (provider) {
      case 'paddle':
        return handlePaddleWebhook(body, signature)
      case 'flutterwave':
        return handleFlutterwaveWebhook(body, signature)
      case 'pesapal':
        return handlePesapalWebhook(body, searchParams)
      case 'dpo':
        return handleDpoWebhook(body, searchParams)
      default:
        return NextResponse.json(
          { error: `Unknown provider: ${provider}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * GET handler for callback redirects (some providers use GET)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const orderId = searchParams.get('orderId')
    
    if (!provider || !orderId) {
      return NextResponse.redirect(new URL('/checkout/error', request.url))
    }

    // Get order to find site_id (uses admin client — webhooks have no auth cookies)
    const supabase = createAdminClient() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order } = await (supabase as any)
      .from('mod_ecommod01_orders')
      .select('site_id')
      .eq('id', orderId)
      .single()

    if (!order) {
      return NextResponse.redirect(new URL('/checkout/error', request.url))
    }

    const siteId = (order as { site_id: string }).site_id

    // Handle callback redirects
    switch (provider) {
      case 'flutterwave': {
        const status = searchParams.get('status')
        const _txRef = searchParams.get('tx_ref')
        const transactionId = searchParams.get('transaction_id')
        
        if (status === 'successful' && transactionId) {
          // Verify transaction with Flutterwave API (server-side verification)
          const settings = await getPublicEcommerceSettings(siteId)
          const fwConfig = settings?.flutterwave_config as FlutterwaveConfig | null
          
          if (fwConfig?.secret_key) {
            try {
              const verifyResponse = await fetch(
                `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
                {
                  headers: {
                    'Authorization': `Bearer ${fwConfig.secret_key}`,
                    'Content-Type': 'application/json',
                  },
                }
              )
              const verifyData = await verifyResponse.json()
              
              if (verifyData.status === 'success' && verifyData.data?.status === 'successful') {
                await updatePublicOrderPaymentStatus(siteId, orderId, 'paid', transactionId)
                return NextResponse.redirect(new URL(`/checkout/success?orderId=${orderId}`, request.url))
              } else {
                console.error('[Flutterwave] Verification failed:', verifyData)
                await updatePublicOrderPaymentStatus(siteId, orderId, 'failed')
                return NextResponse.redirect(new URL(`/checkout/error?orderId=${orderId}`, request.url))
              }
            } catch (verifyError) {
              console.error('[Flutterwave] Verification error:', verifyError)
              // Fallback: mark as pending for manual review
              await updatePublicOrder(siteId, orderId, {
                payment_transaction_id: transactionId,
                metadata: { flutterwave_needs_manual_review: true }
              })
              return NextResponse.redirect(new URL(`/checkout/pending?orderId=${orderId}`, request.url))
            }
          } else {
            // No secret key configured — mark as pending for manual review
            await updatePublicOrder(siteId, orderId, {
              payment_transaction_id: transactionId,
              metadata: { flutterwave_unverified: true, note: 'Secret key not configured for verification' }
            })
            return NextResponse.redirect(new URL(`/checkout/pending?orderId=${orderId}`, request.url))
          }
        } else {
          await updatePublicOrderPaymentStatus(siteId, orderId, 'failed')
          return NextResponse.redirect(new URL(`/checkout/error?orderId=${orderId}`, request.url))
        }
      }
      
      case 'pesapal': {
        const pesapalTransactionId = searchParams.get('pesapal_transaction_tracking_id')
        const _merchantReference = searchParams.get('pesapal_merchant_reference')
        
        if (pesapalTransactionId) {
          // Pesapal: The GET callback is a redirect, NOT a confirmation.
          // Actual payment status is confirmed via IPN (POST handler above).
          // Mark as pending and store tracking ID — IPN will update to paid.
          await updatePublicOrder(siteId, orderId, {
            payment_transaction_id: pesapalTransactionId,
            metadata: { 
              pesapal_tracking_id: pesapalTransactionId,
              awaiting_ipn_confirmation: true 
            }
          })
          return NextResponse.redirect(new URL(`/checkout/pending?orderId=${orderId}`, request.url))
        }
        return NextResponse.redirect(new URL(`/checkout/error?orderId=${orderId}`, request.url))
      }
      
      case 'dpo': {
        const transToken = searchParams.get('TransactionToken')
        const ccdApproval = searchParams.get('CCDapproval')
        
        if (transToken && ccdApproval) {
          // DPO: Verify the transaction token with DPO's verifyToken API
          const settings = await getPublicEcommerceSettings(siteId)
          const dpoConfig = settings?.dpo_config as { company_token?: string } | null
          
          if (dpoConfig?.company_token) {
            try {
              // Call DPO verifyToken endpoint
              const verifyXml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${dpoConfig.company_token}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${transToken}</TransactionToken>
</API3G>`
              
              const verifyResponse = await fetch('https://secure.3gdirectpay.com/API/v6/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/xml' },
                body: verifyXml,
              })
              const verifyBody = await verifyResponse.text()
              const resultCode = extractFromXml(verifyBody, 'Result')
              
              if (resultCode === '000') {
                // Transaction verified as paid
                await updatePublicOrderPaymentStatus(siteId, orderId, 'paid', transToken)
                return NextResponse.redirect(new URL(`/checkout/success?orderId=${orderId}`, request.url))
              } else {
                console.error('[DPO] Verification failed, result code:', resultCode)
                await updatePublicOrderPaymentStatus(siteId, orderId, 'failed')
                return NextResponse.redirect(new URL(`/checkout/error?orderId=${orderId}`, request.url))
              }
            } catch (verifyError) {
              console.error('[DPO] Verification error:', verifyError)
              // Fallback: mark for manual review
              await updatePublicOrder(siteId, orderId, {
                payment_transaction_id: transToken,
                metadata: { dpo_needs_manual_review: true }
              })
              return NextResponse.redirect(new URL(`/checkout/pending?orderId=${orderId}`, request.url))
            }
          } else {
            // No company token configured for verification
            await updatePublicOrder(siteId, orderId, {
              payment_transaction_id: transToken,
              metadata: { dpo_unverified: true, note: 'Company token not configured' }
            })
            return NextResponse.redirect(new URL(`/checkout/pending?orderId=${orderId}`, request.url))
          }
        }
        return NextResponse.redirect(new URL(`/checkout/error?orderId=${orderId}`, request.url))
      }
      
      default:
        return NextResponse.redirect(new URL('/checkout/error', request.url))
    }
  } catch (error) {
    console.error('Webhook GET error:', error)
    return NextResponse.redirect(new URL('/checkout/error', request.url))
  }
}

// ============================================================================
// PADDLE WEBHOOK HANDLER
// ============================================================================

async function handlePaddleWebhook(body: string, signature: string | null): Promise<NextResponse> {
  try {
    const data = JSON.parse(body)
    
    // Extract order ID from passthrough or custom data
    const orderId = data.passthrough?.order_id || data.custom_data?.order_id
    
    if (!orderId) {
      console.error('Paddle webhook: No order ID found')
      return NextResponse.json({ received: true })
    }

    // Get order to find site settings for verification
    const supabase = createAdminClient() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order } = await (supabase as any)
      .from('mod_ecommod01_orders')
      .select('site_id')
      .eq('id', orderId)
      .single()

    if (!order) {
      console.error('Paddle webhook: Order not found')
      return NextResponse.json({ received: true })
    }

    const siteId = (order as { site_id: string }).site_id

    // Get settings for signature verification
    const settings = await getPublicEcommerceSettings(siteId)
    const paddleConfig = settings?.paddle_config as PaddleConfig | null
    
    // Verify signature if configured
    if (paddleConfig?.webhook_secret && signature) {
      // Paddle signature verification
      const ts = signature.split(';')[0]?.split('=')[1] || ''
      const h1 = signature.split(';')[1]?.split('=')[1] || ''
      
      const signedPayload = `${ts}:${body}`
      const expectedSignature = crypto
        .createHmac('sha256', paddleConfig.webhook_secret)
        .update(signedPayload)
        .digest('hex')
      
      if (h1 !== expectedSignature) {
        console.error('Paddle webhook: Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Handle different event types (support both Paddle Classic and Paddle Billing event names)
    const eventType = data.event_type || data.alert_name
    const transactionId = data.data?.id || data.subscription_id || data.checkout_id
    
    switch (eventType) {
      // Paddle Billing event types
      case 'transaction.completed':
      // Paddle Classic event types
      case 'payment_succeeded':
      case 'subscription_payment_succeeded':
        await updatePublicOrderPaymentStatus(siteId, orderId, 'paid', transactionId)
        await updatePublicOrderStatus(siteId, orderId, 'confirmed')
        break
        
      case 'transaction.payment_failed':
      case 'payment_failed':
      case 'subscription_payment_failed':
        await updatePublicOrderPaymentStatus(siteId, orderId, 'failed')
        break
      
      case 'adjustment.created':
      case 'payment_refunded':
      case 'subscription_payment_refunded':
        await updatePublicOrderPaymentStatus(siteId, orderId, 'refunded')
        await updatePublicOrderStatus(siteId, orderId, 'refunded')
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Paddle webhook error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

// ============================================================================
// FLUTTERWAVE WEBHOOK HANDLER
// ============================================================================

async function handleFlutterwaveWebhook(body: string, signature: string | null): Promise<NextResponse> {
  try {
    const data = JSON.parse(body)
    
    // Extract order ID from tx_ref or custom_data
    // tx_ref format may be: orderId, orderId-timestamp, or a UUID
    const txRef = data.data?.tx_ref || data.tx_ref
    const customOrderId = data.data?.meta?.order_id || data.meta?.order_id
    // If tx_ref looks like a UUID (36 chars with dashes), use it directly
    // Otherwise try custom_data.order_id
    const orderId = customOrderId || (txRef?.length === 36 ? txRef : txRef?.split('-').slice(0, 5).join('-'))
    
    if (!orderId) {
      console.error('Flutterwave webhook: No order ID found')
      return NextResponse.json({ received: true })
    }

    // Get order to find site settings for verification
    const supabase = createAdminClient() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order } = await (supabase as any)
      .from('mod_ecommod01_orders')
      .select('site_id')
      .eq('id', orderId)
      .single()

    if (!order) {
      console.error('Flutterwave webhook: Order not found')
      return NextResponse.json({ received: true })
    }

    const siteId = (order as { site_id: string }).site_id

    // Get settings for signature verification
    const settings = await getPublicEcommerceSettings(siteId)
    const fwConfig = settings?.flutterwave_config as FlutterwaveConfig | null

    // Verify signature
    if (fwConfig?.webhook_secret_hash && signature) {
      if (signature !== fwConfig.webhook_secret_hash) {
        console.error('Flutterwave webhook: Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Handle event
    const status = data.data?.status || data.status
    const transactionId = data.data?.id || data.id

    if (status === 'successful') {
      await updatePublicOrderPaymentStatus(siteId, orderId, 'paid', String(transactionId))
      await updatePublicOrderStatus(siteId, orderId, 'confirmed')
    } else if (status === 'failed') {
      await updatePublicOrderPaymentStatus(siteId, orderId, 'failed')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Flutterwave webhook error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

// ============================================================================
// PESAPAL WEBHOOK HANDLER (IPN)
// ============================================================================

async function handlePesapalWebhook(body: string, params: URLSearchParams): Promise<NextResponse> {
  try {
    // Pesapal IPN sends data as query parameters or form data
    const orderTrackingId = params.get('OrderTrackingId')
    const orderMerchantReference = params.get('OrderMerchantReference')
    const orderNotificationType = params.get('OrderNotificationType')
    
    // The merchant reference is our order ID
    const orderId = orderMerchantReference
    
    if (!orderId) {
      console.error('Pesapal IPN: No order ID found')
      return NextResponse.json({ received: true })
    }

    // Get order
    const supabase = createAdminClient() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order } = await (supabase as any)
      .from('mod_ecommod01_orders')
      .select('site_id')
      .eq('id', orderId)
      .single()

    if (!order) {
      console.error('Pesapal IPN: Order not found')
      return NextResponse.json({ received: true })
    }

    const siteId = (order as { site_id: string }).site_id

    // In production, query Pesapal API for transaction status
    // For now, update based on notification type
    if (orderNotificationType === 'COMPLETED') {
      await updatePublicOrderPaymentStatus(siteId, orderId, 'paid', orderTrackingId || undefined)
      await updatePublicOrderStatus(siteId, orderId, 'confirmed')
    } else if (orderNotificationType === 'FAILED') {
      await updatePublicOrderPaymentStatus(siteId, orderId, 'failed')
    }

    // Pesapal expects specific response
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Pesapal IPN error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

// ============================================================================
// DPO PAY WEBHOOK HANDLER
// ============================================================================

async function handleDpoWebhook(body: string, params: URLSearchParams): Promise<NextResponse> {
  try {
    // DPO sends XML or form data
    const transToken = params.get('TransactionToken') || extractFromXml(body, 'TransactionToken')
    const companyRef = params.get('CompanyRef') || extractFromXml(body, 'CompanyRef')
    const transactionApproval = params.get('TransactionApproval') || extractFromXml(body, 'TransactionApproval')
    
    // Company ref is our order ID
    const orderId = companyRef
    
    if (!orderId) {
      console.error('DPO webhook: No order ID found')
      return NextResponse.json({ received: true })
    }

    // Get order
    const supabase = createAdminClient() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order } = await (supabase as any)
      .from('mod_ecommod01_orders')
      .select('site_id')
      .eq('id', orderId)
      .single()

    if (!order) {
      console.error('DPO webhook: Order not found')
      return NextResponse.json({ received: true })
    }

    const siteId = (order as { site_id: string }).site_id

    // Check result code
    const resultCode = params.get('Result') || extractFromXml(body, 'Result')
    
    if (resultCode === '000' || transactionApproval) {
      await updatePublicOrderPaymentStatus(siteId, orderId, 'paid', transToken || undefined)
      await updatePublicOrderStatus(siteId, orderId, 'confirmed')
    } else {
      await updatePublicOrderPaymentStatus(siteId, orderId, 'failed')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('DPO webhook error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

// Helper to extract values from XML
function extractFromXml(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1] : null
}
