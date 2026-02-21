/**
 * Cart Recovery Redirect Endpoint
 * 
 * Phase ECOM-61: Abandoned Cart Recovery
 * 
 * When a customer clicks "Complete Your Order" in the recovery email,
 * this endpoint validates the recovery token and redirects to the
 * site's checkout page with the cart restored.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const TABLE_PREFIX = 'mod_ecommod01'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const siteId = searchParams.get('site')

  if (!token || !siteId) {
    return NextResponse.json({ error: 'Missing token or site' }, { status: 400 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    // Find cart by recovery token
    const { data: cart, error } = await supabase
      .from(`${TABLE_PREFIX}_carts`)
      .select('id, site_id, status, session_id')
      .eq('recovery_token', token)
      .eq('site_id', siteId)
      .maybeSingle()

    if (error || !cart) {
      return NextResponse.redirect(new URL('/cart-expired', request.url))
    }

    // If cart is already converted, redirect to orders
    if (cart.status === 'converted') {
      return NextResponse.redirect(new URL('/order-placed', request.url))
    }

    // Reactivate the cart if it was marked as abandoned
    if (cart.status === 'abandoned') {
      await supabase
        .from(`${TABLE_PREFIX}_carts`)
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', cart.id)
    }

    // Get site domain for redirect
    const { data: site } = await supabase
      .from('sites')
      .select('subdomain, custom_domain')
      .eq('id', siteId)
      .single()

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Construct redirect URL to the site's checkout page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'
    const domain = site.custom_domain || `${site.subdomain}.dramac.app`
    const checkoutUrl = `https://${domain}/checkout?cart=${cart.id}&recovered=true`

    // Track that the recovery link was clicked
    await supabase
      .from(`${TABLE_PREFIX}_carts`)
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', cart.id)

    return NextResponse.redirect(checkoutUrl)
  } catch (error) {
    console.error('[CartRecovery] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process cart recovery' },
      { status: 500 }
    )
  }
}
