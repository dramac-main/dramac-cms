/**
 * E-Commerce Cart API
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * API for cart operations (used by embedded storefronts)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrCreateCart,
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  applyDiscountToCart,
  removeDiscountFromCart,
  mergeGuestCartToUser
} from '@/modules/ecommerce/actions/ecommerce-actions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/modules/ecommerce/cart
 * 
 * Get or create a cart
 * 
 * Query params:
 * - siteId: Required - The site ID
 * - cartId: Optional - Existing cart ID
 * - userId: Optional - User ID (for authenticated users)
 * - sessionId: Optional - Session ID (for guests)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const siteId = searchParams.get('siteId')
    const cartId = searchParams.get('cartId')
    const userId = searchParams.get('userId') || undefined
    const sessionId = searchParams.get('sessionId') || undefined

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      )
    }

    // Get existing cart by ID
    if (cartId) {
      const cart = await getCart(cartId)
      
      if (!cart) {
        return NextResponse.json(
          { error: 'Cart not found' },
          { status: 404 }
        )
      }

      // Verify cart belongs to requested site
      if (cart.site_id !== siteId) {
        return NextResponse.json(
          { error: 'Cart not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ cart })
    }

    // Get or create cart
    const cart = await getOrCreateCart(siteId, userId, sessionId)
    return NextResponse.json({ cart })
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/modules/ecommerce/cart
 * 
 * Cart operations: add item, update quantity, remove item, apply discount, etc.
 * 
 * Body:
 * - action: Required - 'addItem' | 'updateQuantity' | 'removeItem' | 'clear' | 'applyDiscount' | 'removeDiscount' | 'merge'
 * - cartId: Required - Cart ID
 * - productId: Required for addItem
 * - variantId: Optional for addItem
 * - quantity: Required for addItem & updateQuantity
 * - itemId: Required for updateQuantity & removeItem
 * - discountCode: Required for applyDiscount
 * - guestCartId: Required for merge
 * - userId: Required for merge
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, cartId } = body

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      )
    }

    if (!cartId && action !== 'merge') {
      return NextResponse.json(
        { error: 'cartId is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'addItem': {
        const { productId, variantId, quantity = 1 } = body
        
        if (!productId) {
          return NextResponse.json(
            { error: 'productId is required' },
            { status: 400 }
          )
        }

        const item = await addCartItem(cartId, productId, variantId || null, quantity)
        const cart = await getCart(cartId)
        
        return NextResponse.json({ item, cart })
      }

      case 'updateQuantity': {
        const { itemId, quantity } = body
        
        if (!itemId) {
          return NextResponse.json(
            { error: 'itemId is required' },
            { status: 400 }
          )
        }

        if (typeof quantity !== 'number') {
          return NextResponse.json(
            { error: 'quantity is required' },
            { status: 400 }
          )
        }

        const item = await updateCartItemQuantity(itemId, quantity)
        const cart = await getCart(cartId)
        
        return NextResponse.json({ item, cart })
      }

      case 'removeItem': {
        const { itemId } = body
        
        if (!itemId) {
          return NextResponse.json(
            { error: 'itemId is required' },
            { status: 400 }
          )
        }

        await removeCartItem(itemId)
        const cart = await getCart(cartId)
        
        return NextResponse.json({ cart })
      }

      case 'clear': {
        await clearCart(cartId)
        const cart = await getCart(cartId)
        
        return NextResponse.json({ cart })
      }

      case 'applyDiscount': {
        const { discountCode, subtotal = 0 } = body
        
        if (!discountCode) {
          return NextResponse.json(
            { error: 'discountCode is required' },
            { status: 400 }
          )
        }

        const result = await applyDiscountToCart(cartId, discountCode, subtotal)
        const cart = await getCart(cartId)
        
        if (result.success) {
          return NextResponse.json({ 
            success: true, 
            discountAmount: result.discountAmount,
            cart 
          })
        } else {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          )
        }
      }

      case 'removeDiscount': {
        await removeDiscountFromCart(cartId)
        const cart = await getCart(cartId)
        
        return NextResponse.json({ cart })
      }

      case 'merge': {
        const { guestCartId, userId, siteId } = body
        
        if (!guestCartId || !userId || !siteId) {
          return NextResponse.json(
            { error: 'guestCartId, userId, and siteId are required' },
            { status: 400 }
          )
        }

        const cart = await mergeGuestCartToUser(guestCartId, userId, siteId)
        return NextResponse.json({ cart })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
