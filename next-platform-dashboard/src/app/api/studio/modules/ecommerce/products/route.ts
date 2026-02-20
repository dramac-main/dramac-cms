/**
 * E-Commerce Products API for Studio Fields
 * 
 * Fetches products for the product selector custom field.
 * Supports search filtering, category filtering, and pagination.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =============================================================================
// TYPES
// =============================================================================

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  status: "active" | "draft" | "archived";
  inventory?: number;
  sku?: string;
  categoryId?: string;
  categoryName?: string;
}

interface ProductsResponse {
  products: ProductOption[];
  total: number;
  hasMore: boolean;
  demo?: boolean;
}

// Demo products for development/testing
const DEMO_PRODUCTS: ProductOption[] = [
  {
    id: "demo-1",
    name: "Sample Product 1",
    slug: "sample-product-1",
    price: 29.99,
    compareAtPrice: 39.99,
    status: "active",
    inventory: 100,
    sku: "DEMO-001",
  },
  {
    id: "demo-2",
    name: "Sample Product 2",
    slug: "sample-product-2",
    price: 49.99,
    status: "active",
    inventory: 50,
    sku: "DEMO-002",
  },
  {
    id: "demo-3",
    name: "Premium Widget",
    slug: "premium-widget",
    price: 99.99,
    compareAtPrice: 129.99,
    status: "active",
    inventory: 25,
    sku: "DEMO-003",
  },
];

// =============================================================================
// GET HANDLER
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Try to query mod_ecommod01_products table
    // Using type assertion since the table may not exist in generated types
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("mod_ecommod01_products")
        .select(`
          id,
          name,
          slug,
          base_price,
          compare_at_price,
          images,
          status,
          quantity,
          sku
        `, { count: "exact" })
        .eq("site_id", siteId)
        .eq("status", "active")
        .order("name", { ascending: true });
      
      // Apply search filter at DB level
      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }
      
      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      // If categoryId filter is requested, get product IDs from product_categories join table
      let categoryProductIds: Set<string> | null = null;
      if (categoryId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: catLinks } = await (supabase as any)
          .from("mod_ecommod01_product_categories")
          .select("product_id")
          .eq("category_id", categoryId);
        categoryProductIds = new Set((catLinks || []).map((l: { product_id: string }) => l.product_id));
      }

      // Transform data — prices stored in cents, convert to display amounts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let products: ProductOption[] = (data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: typeof product.base_price === 'number' ? product.base_price / 100 : 0,
        compareAtPrice: typeof product.compare_at_price === 'number' ? product.compare_at_price / 100 : null,
        image: product.images?.[0] || undefined,
        status: product.status,
        inventory: product.quantity,
        sku: product.sku,
      }));

      // Apply category filter if needed
      if (categoryProductIds) {
        products = products.filter(p => categoryProductIds!.has(p.id));
      }

      const response: ProductsResponse = {
        products,
        total: count || products.length,
        hasMore: offset + limit < (count || 0),
      };

      return NextResponse.json(response);

    } catch (dbError) {
      // Table doesn't exist - return demo data for development
      console.warn("[ProductsAPI] Database error, returning demo data:", dbError);
      
      // Filter demo products by search if provided
      const filteredProducts = search
        ? DEMO_PRODUCTS.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase())
          )
        : DEMO_PRODUCTS;

      return NextResponse.json({
        products: filteredProducts,
        total: filteredProducts.length,
        hasMore: false,
        demo: true,
      });
    }

  } catch (error) {
    console.error("[ProductsAPI] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
