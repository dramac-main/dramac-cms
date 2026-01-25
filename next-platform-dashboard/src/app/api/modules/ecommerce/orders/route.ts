/**
 * E-Commerce Orders API
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * API for order management (authenticated endpoints)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getOrders,
  getOrder,
  updateOrder
} from '@/modules/ecommerce/actions/ecommerce-actions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/modules/ecommerce/orders
 * 
 * Get orders for a site (requires authentication)
 * 
 * Query params:
 * - siteId: Required - The site ID
 * - orderId: Optional - Get single order
 * - status: Optional - Filter by status
 * - paymentStatus: Optional - Filter by payment status
 * - page: Optional - Page number (defaults to 1)
 * - limit: Optional - Items per page (defaults to 20)
 * - customerId: Optional - Filter by customer ID
 * - startDate: Optional - Filter by date range start
 * - endDate: Optional - Filter by date range end
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    const siteId = searchParams.get('siteId')
    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status') || undefined
    const paymentStatus = searchParams.get('paymentStatus') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const customerId = searchParams.get('customerId') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
    }

    // Single order request
    if (orderId) {
      const order = await getOrder(siteId, orderId)
      
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      return NextResponse.json({ order })
    }

    // List orders
    const result = await getOrders(
      siteId,
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: status as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payment_status: paymentStatus as any,
        customer_id: customerId,
        date_from: startDate,
        date_to: endDate
      },
      page,
      limit
    )

    return NextResponse.json({
      orders: result.data,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
        limit
      }
    })
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/modules/ecommerce/orders
 * 
 * Update order status (requires authentication)
 * 
 * Body:
 * - orderId: Required - Order ID
 * - status: Optional - New order status
 * - paymentStatus: Optional - New payment status
 * - trackingNumber: Optional - Shipping tracking number
 * - notes: Optional - Admin notes
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { siteId, orderId, status, paymentStatus, trackingNumber, notes } = body

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
    }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    // Build update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {}
    
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = status
    }
    
    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded']
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
      }
      updates.payment_status = paymentStatus
    }
    
    if (trackingNumber !== undefined) {
      updates.tracking_number = trackingNumber
    }
    
    if (notes !== undefined) {
      updates.internal_notes = notes
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const order = await updateOrder(siteId, orderId, updates)
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}
