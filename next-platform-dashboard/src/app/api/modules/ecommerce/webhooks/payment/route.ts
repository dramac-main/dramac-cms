/**
 * E-Commerce Payment Webhooks
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Handles payment provider webhooks (Paddle, Flutterwave, Pesapal, DPO)
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { 
  updateOrderStatus,
  updateOrderPaymentStatus,
  updateOrder,
  getEcommerceSettings 
} from '@/modules/ecommerce/actions/ecommerce-actions'
import type {
  PaddleConfig,
  FlutterwaveConfig,
  PesapalConfig,
  DpoConfig
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

    // Get order to find site_id
    const supabase = await createClient()
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
        const txRef = searchParams.get('tx_ref')
        const transactionId = searchParams.get('transaction_id')
        
        if (status === 'successful' && transactionId) {
          // Verify transaction with Flutterwave API
          // In production, call Flutterwave verify endpoint
          await updateOrderPaymentStatus(siteId, orderId, 'paid', transactionId)
          return NextResponse.redirect(new URL(`/checkout/success?orderId=${orderId}`, request.url))
        } else {
          await updateOrderPaymentStatus(siteId, orderId, 'failed')
          return NextResponse.redirect(new URL(`/checkout/error?orderId=${orderId}`, request.url))
        }
      }
      
      case 'pesapal': {
        const pesapalTransactionId = searchParams.get('pesapal_transaction_tracking_id')
        const merchantReference = searchParams.get('pesapal_merchant_reference')
        
        if (pesapalTransactionId) {
          // Query Pesapal for payment status
          // In production, call Pesapal QueryPaymentStatus endpoint
          await updateOrder(siteId, orderId, {
            payment_transaction_id: pesapalTransactionId,
            metadata: { pesapal_tracking_id: pesapalTransactionId }
          })
          return NextResponse.redirect(new URL(`/checkout/pending?orderId=${orderId}`, request.url))
        }
        return NextResponse.redirect(new URL(`/checkout/error?orderId=${orderId}`, request.url))
      }
      
      case 'dpo': {
        const transToken = searchParams.get('TransactionToken')
        const ccdApproval = searchParams.get('CCDapproval')
        
        if (transToken && ccdApproval) {
          // Verify with DPO API
          await updateOrderPaymentStatus(siteId, orderId, 'paid', transToken)
          return NextResponse.redirect(new URL(`/checkout/success?orderId=${orderId}`, request.url))
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
    const supabase = await createClient()
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
    const settings = await getEcommerceSettings(siteId)
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

    // Handle different event types
    const eventType = data.event_type || data.alert_name
    const transactionId = data.subscription_id || data.checkout_id
    
    switch (eventType) {
      case 'payment_succeeded':
      case 'subscription_payment_succeeded':
        await updateOrderPaymentStatus(siteId, orderId, 'paid', transactionId)
        await updateOrderStatus(siteId, orderId, 'confirmed')
        break
        
      case 'payment_failed':
      case 'subscription_payment_failed':
        await updateOrderPaymentStatus(siteId, orderId, 'failed')
        break
        
      case 'payment_refunded':
      case 'subscription_payment_refunded':
        await updateOrderPaymentStatus(siteId, orderId, 'refunded')
        await updateOrderStatus(siteId, orderId, 'refunded')
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
    
    // Extract order ID from tx_ref (we encode it in the reference)
    const txRef = data.data?.tx_ref || data.tx_ref
    const orderId = txRef?.split('-')[0] // Assuming format: orderId-timestamp
    
    if (!orderId) {
      console.error('Flutterwave webhook: No order ID found')
      return NextResponse.json({ received: true })
    }

    // Get order to find site settings for verification
    const supabase = await createClient()
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
    const settings = await getEcommerceSettings(siteId)
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
      await updateOrderPaymentStatus(siteId, orderId, 'paid', String(transactionId))
      await updateOrderStatus(siteId, orderId, 'confirmed')
    } else if (status === 'failed') {
      await updateOrderPaymentStatus(siteId, orderId, 'failed')
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
    const supabase = await createClient()
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
      await updateOrderPaymentStatus(siteId, orderId, 'paid', orderTrackingId || undefined)
      await updateOrderStatus(siteId, orderId, 'confirmed')
    } else if (orderNotificationType === 'FAILED') {
      await updateOrderPaymentStatus(siteId, orderId, 'failed')
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
    const supabase = await createClient()
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
      await updateOrderPaymentStatus(siteId, orderId, 'paid', transToken || undefined)
      await updateOrderStatus(siteId, orderId, 'confirmed')
    } else {
      await updateOrderPaymentStatus(siteId, orderId, 'failed')
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
