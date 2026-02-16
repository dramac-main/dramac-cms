/**
 * E-Commerce Checkout API
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * API for checkout operations (used by embedded storefronts)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getPublicCart,
  createPublicOrderFromCart,
  getPublicEcommerceSettings
} from '@/modules/ecommerce/actions/public-ecommerce-actions'
import type { 
  Address, 
  CreateOrderInput,
  PaddleConfig,
  FlutterwaveConfig,
  PesapalConfig,
  DpoConfig
} from '@/modules/ecommerce/types/ecommerce-types'
import { calculateShipping } from '@/modules/ecommerce/lib/shipping-calculator'

export const dynamic = 'force-dynamic'

/**
 * POST /api/modules/ecommerce/checkout
 * 
 * Initialize checkout and create order
 * 
 * Body:
 * - cartId: Required - Cart ID
 * - shippingAddress: Required - Shipping address
 * - billingAddress: Optional - Billing address (defaults to shipping)
 * - customerEmail: Required - Customer email
 * - customerName: Optional - Customer name
 * - customerPhone: Optional - Customer phone
 * - paymentProvider: Required - Payment provider to use
 * - shippingMethod: Optional - Shipping method ID
 * - notes: Optional - Order notes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      cartId,
      shippingAddress,
      billingAddress,
      customerEmail,
      customerName,
      customerPhone,
      paymentProvider,
      shippingMethod: _shippingMethod,
      notes
    } = body

    // Validation
    if (!cartId) {
      return NextResponse.json({ error: 'cartId is required' }, { status: 400 })
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: 'shippingAddress is required' }, { status: 400 })
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'customerEmail is required' }, { status: 400 })
    }

    if (!paymentProvider) {
      return NextResponse.json({ error: 'paymentProvider is required' }, { status: 400 })
    }

    // Get cart (uses admin client — works for anonymous subdomain visitors)
    const cart = await getPublicCart(cartId)
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    if (cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Get settings for tax calculation and payment config
    const settings = await getPublicEcommerceSettings(cart.site_id)
    if (!settings) {
      return NextResponse.json({ error: 'Store settings not found' }, { status: 400 })
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
    const discount = cart.discount_amount || 0
    const taxableAmount = Math.max(0, subtotal - discount)
    const tax = (taxableAmount * (settings.tax_rate || 0)) / 100

    // Calculate shipping from site's shipping zones/settings
    const shippingResult = calculateShipping({
      items: cart.items,
      shippingAddress: shippingAddress as Address,
      settings,
      subtotal: taxableAmount,
      shippingMethodId: _shippingMethod || undefined,
    })
    const shipping = shippingResult.cost
    const total = taxableAmount + tax + shipping

    // Validate payment provider
    const validProviders = ['paddle', 'flutterwave', 'pesapal', 'dpo', 'manual']
    if (!validProviders.includes(paymentProvider)) {
      return NextResponse.json({ error: 'Invalid payment provider' }, { status: 400 })
    }

    // Check provider is configured
    if (paymentProvider !== 'manual') {
      const providerKey = `${paymentProvider}_config` as keyof typeof settings
      const providerConfig = settings[providerKey] as PaddleConfig | FlutterwaveConfig | PesapalConfig | DpoConfig | null
      
      if (!providerConfig?.enabled) {
        return NextResponse.json(
          { error: `Payment provider ${paymentProvider} is not enabled` },
          { status: 400 }
        )
      }
    }

    // Create order
    const orderInput: CreateOrderInput = {
      site_id: cart.site_id,
      user_id: cart.user_id,
      cart_id: cart.id,
      status: 'pending',
      payment_status: 'pending',
      payment_provider: paymentProvider,
      subtotal,
      discount,
      tax,
      shipping,
      total,
      currency: settings.currency,
      shipping_address: shippingAddress as Address,
      billing_address: (billingAddress || shippingAddress) as Address,
      customer_email: customerEmail,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      discount_code: cart.discount_code,
      notes: notes || null,
      metadata: {}
    }

    const order = await createPublicOrderFromCart(orderInput)

    // Generate payment URL based on provider
    const paymentUrl: string | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let paymentData: Record<string, any> = {}

    switch (paymentProvider) {
      case 'paddle': {
        const paddleConfig = settings.paddle_config as PaddleConfig
        // Paddle checkout is typically handled client-side with Paddle.js
        paymentData = {
          provider: 'paddle',
          vendorId: paddleConfig.vendor_id,
          orderId: order.id,
          orderNumber: order.order_number,
          total,
          currency: settings.currency,
          customerEmail,
          // Generate custom checkout data
          checkoutData: {
            product: {
              quantity: 1,
              name: `Order ${order.order_number}`,
              price: total
            },
            customer: {
              email: customerEmail
            },
            successUrl: `${settings.store_url || ''}/checkout/success?orderId=${order.id}`,
            closeUrl: `${settings.store_url || ''}/checkout/cancel?orderId=${order.id}`
          }
        }
        break
      }

      case 'flutterwave': {
        const fwConfig = settings.flutterwave_config as FlutterwaveConfig
        // Flutterwave inline checkout
        paymentData = {
          provider: 'flutterwave',
          publicKey: fwConfig.public_key,
          orderId: order.id,
          orderNumber: order.order_number,
          amount: total,
          currency: settings.currency,
          customer: {
            email: customerEmail,
            name: customerName || customerEmail,
            phone_number: customerPhone || ''
          },
          customizations: {
            title: 'Order Payment',
            description: `Payment for order ${order.order_number}`
          },
          redirectUrl: `${settings.store_url || ''}/api/modules/ecommerce/webhooks/payment?provider=flutterwave&orderId=${order.id}`
        }
        break
      }

      case 'pesapal': {
        const pesapalConfig = settings.pesapal_config as PesapalConfig
        const callbackUrl = `${settings.store_url || ''}/api/modules/ecommerce/webhooks/payment?provider=pesapal&orderId=${order.id}`
        
        // Build Pesapal payment data for client-side redirect
        // In production with Pesapal 3.0, register IPN URL and submit order
        try {
          if (pesapalConfig.consumer_key && pesapalConfig.consumer_secret) {
            const isSandbox = pesapalConfig.environment === 'demo'
            // Step 1: Get auth token
            const authUrl = isSandbox 
              ? 'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken'
              : 'https://pay.pesapal.com/v3/api/Auth/RequestToken'
            
            const authRes = await fetch(authUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({
                consumer_key: pesapalConfig.consumer_key,
                consumer_secret: pesapalConfig.consumer_secret,
              }),
            })
            const authData = await authRes.json()
            const token = authData.token

            if (token) {
              // Step 2: Register IPN URL
              const ipnUrl = isSandbox
                ? 'https://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN'
                : 'https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN'
              
              const ipnRes = await fetch(ipnUrl, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json', 
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                  url: callbackUrl,
                  ipn_notification_type: 'POST',
                }),
              })
              const ipnData = await ipnRes.json()

              // Step 3: Submit order
              const submitUrl = isSandbox
                ? 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest'
                : 'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest'

              const submitRes = await fetch(submitUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json', 
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  id: order.id,
                  currency: settings.currency,
                  amount: total,
                  description: `Payment for order ${order.order_number}`,
                  callback_url: callbackUrl,
                  notification_id: ipnData.ipn_id,
                  billing_address: {
                    email_address: customerEmail,
                    phone_number: customerPhone || '',
                    first_name: customerName?.split(' ')[0] || '',
                    last_name: customerName?.split(' ').slice(1).join(' ') || '',
                  },
                }),
              })
              const submitData = await submitRes.json()

              if (submitData.redirect_url) {
                paymentData = {
                  provider: 'pesapal',
                  orderId: order.id,
                  orderNumber: order.order_number,
                  redirectUrl: submitData.redirect_url,
                  orderTrackingId: submitData.order_tracking_id,
                }
                break
              }
            }
          }
        } catch (pesapalError) {
          console.error('[Checkout] Pesapal API error:', pesapalError)
        }

        // Fallback: return data for client-side handling
        paymentData = {
          provider: 'pesapal',
          orderId: order.id,
          orderNumber: order.order_number,
          amount: total,
          currency: settings.currency,
          description: `Payment for order ${order.order_number}`,
          callback_url: callbackUrl,
          notification_id: order.id,
          billing_address: {
            email: customerEmail,
            phone: customerPhone || '',
            first_name: customerName?.split(' ')[0] || '',
            last_name: customerName?.split(' ').slice(1).join(' ') || ''
          }
        }
        break
      }

      case 'dpo': {
        const dpoConfig = settings.dpo_config as DpoConfig
        const successUrl = `${settings.store_url || ''}/api/modules/ecommerce/webhooks/payment?provider=dpo&orderId=${order.id}`
        const cancelUrl = `${settings.store_url || ''}/checkout/cancel?orderId=${order.id}`

        // Create DPO transaction token via API
        try {
          if (dpoConfig.company_token) {
            const createTokenXml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${dpoConfig.company_token}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${total.toFixed(2)}</PaymentAmount>
    <PaymentCurrency>${settings.currency}</PaymentCurrency>
    <CompanyRef>${order.id}</CompanyRef>
    <RedirectURL>${successUrl}</RedirectURL>
    <BackURL>${cancelUrl}</BackURL>
    <CompanyRefUnique>1</CompanyRefUnique>
    <PTL>24</PTL>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${dpoConfig.service_type || '5525'}</ServiceType>
      <ServiceDescription>Order ${order.order_number}</ServiceDescription>
      <ServiceDate>${new Date().toISOString().split('T')[0]} 00:00</ServiceDate>
    </Service>
  </Services>
</API3G>`

            const tokenRes = await fetch('https://secure.3gdirectpay.com/API/v6/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/xml' },
              body: createTokenXml,
            })
            const tokenBody = await tokenRes.text()

            // Extract result and token from XML response
            const resultCode = tokenBody.match(/<Result>(\d+)<\/Result>/)?.[1]
            const transToken = tokenBody.match(/<TransToken>([^<]+)<\/TransToken>/)?.[1]

            if (resultCode === '000' && transToken) {
              // Successfully created payment token
              const dpoPaymentUrl = `https://secure.3gdirectpay.com/payv3.php?ID=${transToken}`
              paymentData = {
                provider: 'dpo',
                orderId: order.id,
                orderNumber: order.order_number,
                transactionToken: transToken,
                paymentUrl: dpoPaymentUrl,
              }
              break
            } else {
              console.error('[Checkout] DPO createToken failed, result:', resultCode)
            }
          }
        } catch (dpoError) {
          console.error('[Checkout] DPO API error:', dpoError)
        }

        // Fallback: return data for manual handling
        paymentData = {
          provider: 'dpo',
          orderId: order.id,
          orderNumber: order.order_number,
          amount: total,
          currency: settings.currency,
          error: 'Failed to create DPO payment token. Please try again or contact support.',
        }
        break
      }

      case 'manual': {
        // Manual payment - order created with pending status
        paymentData = {
          provider: 'manual',
          orderId: order.id,
          orderNumber: order.order_number,
          instructions: settings.manual_payment_instructions || 'Please contact us for payment instructions.'
        }
        break
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        total: order.total,
        currency: order.currency
      },
      payment: paymentData,
      paymentUrl
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}
