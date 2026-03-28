/**
 * E-Commerce Products API
 *
 * Phase EM-52: E-Commerce Module
 *
 * Public API for fetching products (used by embedded storefronts and Studio components)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getProducts,
  getProduct,
  getFeaturedProducts,
} from "@/modules/ecommerce/actions/ecommerce-actions";
import { PUBLIC_RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import {
  isValidUUID,
  clampLimit,
  clampPage,
  truncateText,
} from "@/lib/api-validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/modules/ecommerce/products
 *
 * Fetch products for a site (public endpoint for embedded storefronts)
 *
 * Query params:
 * - siteId: Required - The site ID
 * - source: Optional - Product source ('featured', 'new', 'sale', 'category', 'custom')
 * - category, categoryId: Optional - Filter by category
 * - status: Optional - Filter by status (defaults to 'active')
 * - search: Optional - Search query
 * - page: Optional - Page number (defaults to 1)
 * - limit: Optional - Items per page (defaults to 12)
 * - productId: Optional - Get single product
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 60 requests/minute per IP
    const ip = getClientIp(request);
    const rl = PUBLIC_RATE_LIMITS.products.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
        },
      );
    }

    const { searchParams } = new URL(request.url);

    const siteId = searchParams.get("siteId");
    const productId = searchParams.get("productId");
    const source = searchParams.get("source") || "featured";
    const category =
      searchParams.get("category") ||
      searchParams.get("categoryId") ||
      undefined;
    const status = searchParams.get("status") || "active";
    const search = truncateText(searchParams.get("search") || undefined, 200);
    const page = clampPage(parseInt(searchParams.get("page") || "1", 10));
    const limit = clampLimit(
      parseInt(searchParams.get("limit") || "12", 10),
      12,
      100,
    );

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 },
      );
    }

    // Validate UUID formats
    if (!isValidUUID(siteId)) {
      return NextResponse.json(
        { error: "Invalid siteId format" },
        { status: 400 },
      );
    }
    if (productId && !isValidUUID(productId)) {
      return NextResponse.json(
        { error: "Invalid productId format" },
        { status: 400 },
      );
    }

    // Single product request
    if (productId) {
      const product = await getProduct(siteId, productId);

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }

      // Transform for frontend
      return NextResponse.json({
        product: transformProduct(
          product as unknown as Record<string, unknown>,
        ),
      });
    }

    // List products based on source
    let result;

    switch (source) {
      case "featured":
        // Get featured products
        result = await getFeaturedProducts(siteId, limit);
        break;

      case "new":
        // Get newest products (sorted by created_at)
        result = await getProducts(
          siteId,
          { status: "active", search },
          1,
          limit,
        );
        // Sort by newest (already comes sorted from DB usually)
        break;

      case "sale":
        // Get products with compare_at_price set (on sale)
        result = await getProducts(
          siteId,
          { status: "active", search, onSale: true },
          1,
          limit,
        );
        break;

      case "category":
        // Get products from a specific category
        result = await getProducts(
          siteId,
          {
            category,
            status: status as "active" | "draft" | "archived",
            search,
          },
          page,
          limit,
        );
        break;

      default:
        // Default: get active products
        result = await getProducts(
          siteId,
          {
            category,
            status: status as "active" | "draft" | "archived",
            search,
          },
          page,
          limit,
        );
    }

    // Transform products for frontend consumption
    const products = (result.data || []).map((p) =>
      transformProduct(p as unknown as Record<string, unknown>),
    );

    return NextResponse.json({
      products,
      pagination: {
        page: result.page || 1,
        totalPages: result.totalPages || 1,
        total: result.total || products.length,
        limit,
      },
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Transform database product to frontend-friendly format
 *
 * NOTE: Prices are stored in the database in CENTS (integer).
 * The Create Product dialog multiplies by 100 before saving.
 * We divide by 100 here for display as dollar/kwacha amounts.
 */
function transformProduct(product: Record<string, unknown>) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    // Prices are stored in cents — convert to display amounts
    price:
      typeof product.base_price === "number" ? product.base_price / 100 : 0,
    compareAtPrice:
      typeof product.compare_at_price === "number"
        ? product.compare_at_price / 100
        : null,
    // Use first image or null
    image:
      Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : null,
    images: product.images || [],
    status: product.status,
    sku: product.sku,
    quantity: product.quantity,
    is_featured: product.is_featured,
    rating: product.rating || null,
    // Additional fields for complete product view
    short_description: product.short_description,
    track_inventory: product.track_inventory,
    tax_class: product.tax_class,
    weight: product.weight,
    weight_unit: product.weight_unit,
  };
}
