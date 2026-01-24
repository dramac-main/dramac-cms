/**
 * E-Commerce Categories API
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Public API for fetching categories (used by embedded storefronts)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCategories, getCategory } from '@/modules/ecommerce/actions/ecommerce-actions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/modules/ecommerce/categories
 * 
 * Fetch categories for a site (public endpoint for embedded storefronts)
 * 
 * Query params:
 * - siteId: Required - The site ID
 * - categoryId: Optional - Get single category
 * - activeOnly: Optional - Filter to active only (defaults to true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const siteId = searchParams.get('siteId')
    const categoryId = searchParams.get('categoryId')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      )
    }

    // Single category request
    if (categoryId) {
      const category = await getCategory(siteId, categoryId)
      
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ category })
    }

    // List categories
    const categories = await getCategories(siteId)
    const filtered = activeOnly 
      ? categories.filter(c => c.is_active) 
      : categories

    return NextResponse.json({ categories: filtered })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
