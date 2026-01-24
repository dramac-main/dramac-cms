/**
 * E-Commerce Products API
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Public API for fetching products (used by embedded storefronts)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProducts, getProduct, getCategories } from '@/modules/ecommerce/actions/ecommerce-actions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/modules/ecommerce/products
 * 
 * Fetch products for a site (public endpoint for embedded storefronts)
 * 
 * Query params:
 * - siteId: Required - The site ID
 * - category: Optional - Filter by category
 * - status: Optional - Filter by status (defaults to 'active')
 * - search: Optional - Search query
 * - page: Optional - Page number (defaults to 1)
 * - limit: Optional - Items per page (defaults to 12)
 * - productId: Optional - Get single product
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const siteId = searchParams.get('siteId')
    const productId = searchParams.get('productId')
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || 'active'
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      )
    }

    // Single product request
    if (productId) {
      const product = await getProduct(siteId, productId)
      
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ product })
    }

    // List products
    const result = await getProducts(
      siteId,
      { 
        category, 
        status: status as 'active' | 'draft' | 'archived', 
        search 
      },
      page,
      limit
    )

    return NextResponse.json({
      products: result.data,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
        limit
      }
    })
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
