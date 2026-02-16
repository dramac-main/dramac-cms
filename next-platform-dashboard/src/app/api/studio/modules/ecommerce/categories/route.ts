/**
 * E-Commerce Categories API for Studio Fields
 * 
 * Fetches categories for the category selector custom field.
 * Supports parent filtering and product count display.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =============================================================================
// TYPES
// =============================================================================

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  productCount: number;
  order: number;
}

interface CategoriesResponse {
  categories: CategoryOption[];
  total: number;
  demo?: boolean;
}

// Demo categories for development/testing
const DEMO_CATEGORIES: CategoryOption[] = [
  {
    id: "demo-cat-1",
    name: "Electronics",
    slug: "electronics",
    description: "Electronic devices and gadgets",
    productCount: 15,
    order: 1,
  },
  {
    id: "demo-cat-2",
    name: "Clothing",
    slug: "clothing",
    description: "Apparel and fashion",
    productCount: 25,
    order: 2,
  },
  {
    id: "demo-cat-3",
    name: "Home & Garden",
    slug: "home-garden",
    description: "Home improvement and garden supplies",
    productCount: 10,
    order: 3,
  },
  {
    id: "demo-cat-4",
    name: "Sports",
    slug: "sports",
    description: "Sports equipment and gear",
    productCount: 8,
    order: 4,
  },
];

// =============================================================================
// GET HANDLER
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const parentId = searchParams.get("parentId");
    const includeEmpty = searchParams.get("includeEmpty") === "true";

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Try to query mod_ecommod01_categories table
    // Using type assertion since the table may not exist in generated types
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("mod_ecommod01_categories")
        .select(`
          id,
          name,
          slug,
          description,
          image,
          parent_id,
          sort_order
        `)
        .eq("site_id", siteId)
        .order("sort_order", { ascending: true });

      if (error) {
        throw error;
      }

      // Try to get product counts per category via join table
      let productCounts: Record<string, number> = {};
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: countData } = await (supabase as any)
          .from("mod_ecommod01_product_categories")
          .select("category_id, product:mod_ecommod01_products!inner(status)")
          .eq("product.site_id", siteId)
          .eq("product.status", "active");

        if (countData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          productCounts = countData.reduce((acc: Record<string, number>, row: any) => {
            if (row.category_id) {
              acc[row.category_id] = (acc[row.category_id] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);
        }
      } catch {
        // Ignore if products table doesn't exist
      }

      // Transform data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let categories: CategoryOption[] = (data || []).map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        parentId: category.parent_id,
        productCount: productCounts[category.id] || 0,
        order: category.sort_order || 0,
      }));

      // Filter by parent if specified
      if (parentId === "root") {
        categories = categories.filter(c => !c.parentId);
      } else if (parentId) {
        categories = categories.filter(c => c.parentId === parentId);
      }

      // Filter empty categories if requested
      if (!includeEmpty) {
        categories = categories.filter(c => c.productCount > 0);
      }

      const response: CategoriesResponse = {
        categories,
        total: categories.length,
      };

      return NextResponse.json(response);

    } catch (dbError) {
      // Table doesn't exist - return demo data for development
      console.warn("[CategoriesAPI] Database error, returning demo data:", dbError);

      return NextResponse.json({
        categories: DEMO_CATEGORIES,
        total: DEMO_CATEGORIES.length,
        demo: true,
      });
    }

  } catch (error) {
    console.error("[CategoriesAPI] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
