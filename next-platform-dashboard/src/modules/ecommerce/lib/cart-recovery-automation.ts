/**
 * Cart Recovery Automation
 * 
 * Phase ECOM-61: Abandoned Cart Recovery
 * 
 * Automated cart recovery system that identifies abandoned carts
 * and sends recovery emails. Follows quote-automation.ts pattern.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendBrandedEmail } from '@/lib/email/send-branded-email'
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/locale-config'

const TABLE_PREFIX = 'mod_ecommod01'

// ============================================================================
// TYPES
// ============================================================================

export interface CartRecoveryResult {
  processed: number
  emails_sent: number
  carts_expired: number
  errors: string[]
}

interface AbandonedCartRow {
  id: string
  site_id: string
  user_id: string | null
  session_id: string | null
  currency: string
  status: string
  created_at: string
  updated_at: string
  expires_at: string
  recovery_email_sent_at: string | null
  recovery_email_count: number
  recovery_token: string | null
  customer_email: string | null
  customer_name: string | null
}

interface CartItemRow {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  product_name?: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Time after which an active cart is considered abandoned (in hours) */
const ABANDONMENT_THRESHOLD_HOURS = 1

/** Maximum number of recovery emails to send per cart */
const MAX_RECOVERY_EMAILS = 3

/** Delay between recovery emails (in hours) */
const RECOVERY_EMAIL_DELAYS = [1, 24, 72] // 1hr, 24hr, 72hr

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Process abandoned carts for a site
 * Should be called by the cron job
 */
export async function processAbandonedCarts(siteId: string): Promise<CartRecoveryResult> {
  const result: CartRecoveryResult = {
    processed: 0,
    emails_sent: 0,
    carts_expired: 0,
    errors: [],
  }

  try {
    const supabase = createAdminClient() as any
    const now = new Date()

    // Get site settings for cart recovery configuration
    const { data: settings } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .select('cart_settings, general_settings')
      .eq('site_id', siteId)
      .maybeSingle()

    const cartSettings = settings?.cart_settings || {}
    const cartRecoveryEnabled = cartSettings.recovery_enabled !== false // default true

    if (!cartRecoveryEnabled) {
      return result
    }

    // 1. Find abandoned carts (active carts not updated recently, with customer info)
    const thresholdDate = new Date(now.getTime() - ABANDONMENT_THRESHOLD_HOURS * 60 * 60 * 1000)

    const { data: abandonedCarts, error } = await supabase
      .from(`${TABLE_PREFIX}_carts`)
      .select('*')
      .eq('site_id', siteId)
      .eq('status', 'active')
      .lt('updated_at', thresholdDate.toISOString())
      .not('customer_email', 'is', null)

    if (error) {
      result.errors.push(`Failed to fetch abandoned carts: ${error.message}`)
      return result
    }

    if (!abandonedCarts || abandonedCarts.length === 0) {
      return result
    }

    result.processed = abandonedCarts.length

    // 2. Process each abandoned cart
    for (const cart of abandonedCarts as AbandonedCartRow[]) {
      try {
        const emailCount = cart.recovery_email_count || 0

        // Check if we've already sent the max number of recovery emails
        if (emailCount >= MAX_RECOVERY_EMAILS) {
          // Mark as abandoned
          await supabase
            .from(`${TABLE_PREFIX}_carts`)
            .update({ status: 'abandoned', updated_at: now.toISOString() })
            .eq('id', cart.id)
          result.carts_expired++
          continue
        }

        // Check if enough time has passed since last recovery email
        if (cart.recovery_email_sent_at) {
          const lastSent = new Date(cart.recovery_email_sent_at)
          const delayHours = RECOVERY_EMAIL_DELAYS[emailCount] || RECOVERY_EMAIL_DELAYS[RECOVERY_EMAIL_DELAYS.length - 1]
          const nextSendTime = new Date(lastSent.getTime() + delayHours * 60 * 60 * 1000)
          
          if (now < nextSendTime) {
            continue // Not yet time for the next email
          }
        }

        // 3. Get cart items with product names
        const { data: items } = await supabase
          .from(`${TABLE_PREFIX}_cart_items`)
          .select('id, product_id, quantity, unit_price')
          .eq('cart_id', cart.id)

        if (!items || items.length === 0) {
          // Empty cart, mark as abandoned
          await supabase
            .from(`${TABLE_PREFIX}_carts`)
            .update({ status: 'abandoned', updated_at: now.toISOString() })
            .eq('id', cart.id)
          result.carts_expired++
          continue
        }

        // Get product names
        const productIds = items.map((i: CartItemRow) => i.product_id)
        const { data: products } = await supabase
          .from(`${TABLE_PREFIX}_products`)
          .select('id, name')
          .in('id', productIds)

        const productMap = new Map(
          (products || []).map((p: { id: string; name: string }) => [p.id, p.name])
        )

        // Calculate totals
        const currency = cart.currency || DEFAULT_CURRENCY
        const total = items.reduce((sum: number, item: CartItemRow) => sum + item.unit_price * item.quantity, 0)

        // Generate recovery token if not exists
        let recoveryToken = cart.recovery_token
        if (!recoveryToken) {
          recoveryToken = crypto.randomUUID()
          await supabase
            .from(`${TABLE_PREFIX}_carts`)
            .update({ recovery_token: recoveryToken })
            .eq('id', cart.id)
        }

        // Build checkout/recovery URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'
        const checkoutUrl = `${appUrl}/api/ecommerce/cart-recovery?token=${recoveryToken}&site=${siteId}`

        // Get site info for branded email
        const { data: site } = await supabase
          .from('sites')
          .select('name, agency_id')
          .eq('id', siteId)
          .single()

        if (!site) {
          result.errors.push(`Site not found for cart ${cart.id}`)
          continue
        }

        // Format items for email
        const formattedItems = items.map((item: CartItemRow) => ({
          name: productMap.get(item.product_id) || 'Product',
          quantity: item.quantity,
          price: formatCurrency(item.unit_price * item.quantity, currency),
        }))

        // 4. Send recovery email
        const emailResult = await sendBrandedEmail(site.agency_id, {
          to: {
            email: cart.customer_email!,
            name: cart.customer_name || undefined,
          },
          emailType: 'abandoned_cart_customer',
          data: {
            customerName: cart.customer_name || 'there',
            items: formattedItems,
            total: formatCurrency(total, currency),
            checkoutUrl,
            businessName: site.name || 'Our Store',
          },
        })

        if (emailResult.success) {
          // Update cart with recovery email tracking
          await supabase
            .from(`${TABLE_PREFIX}_carts`)
            .update({
              recovery_email_sent_at: now.toISOString(),
              recovery_email_count: emailCount + 1,
            })
            .eq('id', cart.id)

          result.emails_sent++
        } else {
          result.errors.push(`Failed to send email for cart ${cart.id}: ${emailResult.error || 'unknown'}`)
        }
      } catch (cartError) {
        result.errors.push(`Error processing cart ${cart.id}: ${cartError instanceof Error ? cartError.message : 'unknown'}`)
      }
    }
  } catch (error) {
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'unknown'}`)
  }

  return result
}

/**
 * Process all sites' abandoned carts
 * Called by the unified cron handler
 */
export async function runCartRecoveryAutomation(): Promise<CartRecoveryResult> {
  const aggregatedResult: CartRecoveryResult = {
    processed: 0,
    emails_sent: 0,
    carts_expired: 0,
    errors: [],
  }

  try {
    const supabase = createAdminClient() as any

    // Find all sites with active e-commerce module
    const { data: installations } = await supabase
      .from('site_module_installations')
      .select('site_id')
      .eq('module_id', 'ecommerce')
      .eq('status', 'active')

    if (!installations || installations.length === 0) {
      return aggregatedResult
    }

    for (const install of installations) {
      const siteResult = await processAbandonedCarts(install.site_id)
      aggregatedResult.processed += siteResult.processed
      aggregatedResult.emails_sent += siteResult.emails_sent
      aggregatedResult.carts_expired += siteResult.carts_expired
      aggregatedResult.errors.push(...siteResult.errors)
    }
  } catch (error) {
    aggregatedResult.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'unknown'}`)
  }

  console.log(`[CartRecovery] Processed ${aggregatedResult.processed} carts, sent ${aggregatedResult.emails_sent} emails, expired ${aggregatedResult.carts_expired} carts`)

  return aggregatedResult
}
