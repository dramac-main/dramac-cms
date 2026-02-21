/**
 * E-Commerce SEO Structured Data Injector (Server Component)
 * 
 * Injects Schema.org JSON-LD structured data into published site pages
 * so Google can display rich product cards in search results.
 * 
 * This runs SERVER-SIDE — Googlebot sees the structured data immediately
 * without needing to execute JavaScript.
 * 
 * Injected on:
 * - Product detail pages (/products/[slug]) → Product schema
 * - Shop / category pages (/shop, /categories/[slug]) → ItemList schema
 * - All ecommerce pages → Organization + WebSite schemas
 */

import {
  generateProductJsonLd,
  generateProductListJsonLd,
  generateBreadcrumbJsonLd,
  generateStoreJsonLd,
  generateWebSiteSearchJsonLd,
  buildSiteUrl,
} from '@/modules/ecommerce/lib/structured-data';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Product, EcommerceSettings } from '@/modules/ecommerce/types/ecommerce-types';

// ============================================================================
// TYPES
// ============================================================================

interface EcomSeoInjectorProps {
  siteId: string;
  pageSlug: string;
  subdomain?: string | null;
  customDomain?: string | null;
  siteName: string;
}

const ECOMMERCE_SHORT_ID = 'ecommod01';
const TABLE_PREFIX = `mod_${ECOMMERCE_SHORT_ID}`;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Server component that fetches product/store data and injects JSON-LD.
 * Renders <script type="application/ld+json"> tags in the HTML.
 */
export async function EcommerceSeoInjector({
  siteId,
  pageSlug,
  subdomain,
  customDomain,
  siteName,
}: EcomSeoInjectorProps) {
  const siteUrl = buildSiteUrl(subdomain, customDomain);
  if (!siteUrl) return null;

  try {
    // Fetch ecommerce settings for currency + store info
    const settings = await getSettings(siteId);
    const currency = settings?.currency || 'ZMW';
    const storeName = settings?.store_name || siteName || 'Store';

    // If quotation mode hides prices, skip product structured data
    // (Google requires accurate prices — showing wrong info can cause penalties)
    if (settings?.quotation_mode_enabled && settings?.quotation_hide_prices) {
      // Still inject Organization + WebSite schemas
      return (
        <>
          <JsonLdScript data={generateStoreJsonLd(settings, siteUrl)} />
          <JsonLdScript data={generateWebSiteSearchJsonLd(storeName, siteUrl)} />
        </>
      );
    }

    const options = { siteUrl, storeName, currency };

    // Determine page type and inject appropriate structured data
    const normalizedSlug = pageSlug.replace(/^\/+/, '');

    // ── Product Detail Page: /products/[slug] ────────────────────────
    if (normalizedSlug.startsWith('products/')) {
      const productSlug = normalizedSlug.replace('products/', '');
      return (
        <ProductPageSeo
          siteId={siteId}
          productSlug={productSlug}
          options={options}
          settings={settings}
          siteUrl={siteUrl}
          storeName={storeName}
        />
      );
    }

    // ── Shop Page: /shop ─────────────────────────────────────────────
    if (normalizedSlug === 'shop' || normalizedSlug === '') {
      return (
        <ShopPageSeo
          siteId={siteId}
          options={options}
          settings={settings}
          siteUrl={siteUrl}
          storeName={storeName}
        />
      );
    }

    // ── Category Page: /categories/[slug] ────────────────────────────
    if (normalizedSlug.startsWith('categories/')) {
      const categorySlug = normalizedSlug.replace('categories/', '');
      return (
        <CategoryPageSeo
          siteId={siteId}
          categorySlug={categorySlug}
          options={options}
          settings={settings}
          siteUrl={siteUrl}
          storeName={storeName}
        />
      );
    }

    // ── Other ecommerce pages (cart, checkout, etc.) — just inject store schema
    const ecommercePages = ['cart', 'checkout', 'order-confirmation', 'quotes'];
    if (ecommercePages.includes(normalizedSlug)) {
      return settings ? (
        <JsonLdScript data={generateStoreJsonLd(settings, siteUrl)} />
      ) : null;
    }

    return null;
  } catch (err) {
    console.error('[EcomSeo] Error generating structured data:', err);
    return null;
  }
}

// ============================================================================
// SUB-COMPONENTS (all server components)
// ============================================================================

async function ProductPageSeo({
  siteId,
  productSlug,
  options,
  settings,
  siteUrl,
  storeName,
}: {
  siteId: string;
  productSlug: string;
  options: { siteUrl: string; storeName: string; currency: string };
  settings: EcommerceSettings | null;
  siteUrl: string;
  storeName: string;
}) {
  const supabase = createAdminClient() as ReturnType<typeof createAdminClient> & { from: (...args: unknown[]) => unknown };
  const db = supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Fetch product with variants
  const { data: productData } = await db
    .from(`${TABLE_PREFIX}_products`)
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', productSlug)
    .eq('status', 'active')
    .single();

  if (!productData) return null;

  const product = productData as Product;

  // Fetch variants
  const { data: variantsData } = await db
    .from(`${TABLE_PREFIX}_product_variants`)
    .select('*')
    .eq('product_id', product.id);

  product.variants = variantsData || [];

  // Fetch categories
  const { data: categoryLinks } = await db
    .from(`${TABLE_PREFIX}_product_categories`)
    .select('category_id')
    .eq('product_id', product.id);

  if (categoryLinks && categoryLinks.length > 0) {
    const categoryIds = categoryLinks.map((l: { category_id: string }) => l.category_id);
    const { data: categories } = await db
      .from(`${TABLE_PREFIX}_categories`)
      .select('id, name, slug')
      .in('id', categoryIds);
    product.categories = categories || [];
  }

  // Fetch review stats (average_rating + review_count from product row)
  const reviewStats = {
    averageRating: (productData as any).average_rating || 0,  // eslint-disable-line @typescript-eslint/no-explicit-any
    totalReviews: (productData as any).review_count || 0,  // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  // Generate product JSON-LD
  const productJsonLd = generateProductJsonLd(product, options, reviewStats);

  // Generate breadcrumb
  const breadcrumbItems = [
    { name: 'Home', url: siteUrl },
    { name: 'Shop', url: `${siteUrl}/shop` },
  ];
  if (product.categories && product.categories.length > 0) {
    const cat = product.categories[0] as { name: string; slug: string };
    breadcrumbItems.push({ name: cat.name, url: `${siteUrl}/categories/${cat.slug}` });
  }
  breadcrumbItems.push({ name: product.name, url: `${siteUrl}/products/${product.slug}` });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  return (
    <>
      <JsonLdScript data={productJsonLd} />
      <JsonLdScript data={breadcrumbJsonLd} />
      {settings && <JsonLdScript data={generateStoreJsonLd(settings, siteUrl)} />}
    </>
  );
}

async function ShopPageSeo({
  siteId,
  options,
  settings,
  siteUrl,
  storeName,
}: {
  siteId: string;
  options: { siteUrl: string; storeName: string; currency: string };
  settings: EcommerceSettings | null;
  siteUrl: string;
  storeName: string;
}) {
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Fetch first 20 active products for the ItemList
  const { data: products } = await db
    .from(`${TABLE_PREFIX}_products`)
    .select('id, name, slug, images, base_price, status')
    .eq('site_id', siteId)
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);

  const schemas: Record<string, unknown>[] = [];

  if (products && products.length > 0) {
    schemas.push(generateProductListJsonLd(products as Product[], {
      ...options,
      listName: `${storeName} - All Products`,
    }));
  }

  // Organization + WebSite with search
  if (settings) {
    schemas.push(generateStoreJsonLd(settings, siteUrl));
  }
  schemas.push(generateWebSiteSearchJsonLd(storeName, siteUrl));

  // Breadcrumb
  schemas.push(generateBreadcrumbJsonLd([
    { name: 'Home', url: siteUrl },
    { name: 'Shop', url: `${siteUrl}/shop` },
  ]));

  return (
    <>
      {schemas.map((schema, i) => (
        <JsonLdScript key={i} data={schema} />
      ))}
    </>
  );
}

async function CategoryPageSeo({
  siteId,
  categorySlug,
  options,
  settings,
  siteUrl,
  storeName,
}: {
  siteId: string;
  categorySlug: string;
  options: { siteUrl: string; storeName: string; currency: string };
  settings: EcommerceSettings | null;
  siteUrl: string;
  storeName: string;
}) {
  const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Fetch category
  const { data: category } = await db
    .from(`${TABLE_PREFIX}_categories`)
    .select('id, name, slug')
    .eq('site_id', siteId)
    .eq('slug', categorySlug)
    .single();

  if (!category) return null;

  // Fetch products in this category
  const { data: productLinks } = await db
    .from(`${TABLE_PREFIX}_product_categories`)
    .select('product_id')
    .eq('category_id', category.id);

  let products: Product[] = [];
  if (productLinks && productLinks.length > 0) {
    const productIds = productLinks.map((l: { product_id: string }) => l.product_id);
    const { data: productData } = await db
      .from(`${TABLE_PREFIX}_products`)
      .select('id, name, slug, images, base_price, status')
      .in('id', productIds)
      .eq('status', 'active')
      .limit(20);
    products = (productData || []) as Product[];
  }

  const schemas: Record<string, unknown>[] = [];

  if (products.length > 0) {
    schemas.push(generateProductListJsonLd(products, {
      ...options,
      listName: `${category.name} - ${storeName}`,
    }));
  }

  // Breadcrumb
  schemas.push(generateBreadcrumbJsonLd([
    { name: 'Home', url: siteUrl },
    { name: 'Shop', url: `${siteUrl}/shop` },
    { name: category.name, url: `${siteUrl}/categories/${category.slug}` },
  ]));

  if (settings) {
    schemas.push(generateStoreJsonLd(settings, siteUrl));
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <JsonLdScript key={i} data={schema} />
      ))}
    </>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Renders a <script type="application/ld+json"> tag with structured data.
 */
function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  // Remove undefined values to keep JSON clean
  const cleaned = JSON.parse(JSON.stringify(data));
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleaned) }}
    />
  );
}

/**
 * Fetch ecommerce settings for a site
 */
async function getSettings(siteId: string): Promise<EcommerceSettings | null> {
  try {
    const db = createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const { data, error } = await db
      .from(`${TABLE_PREFIX}_settings`)
      .select('*')
      .eq('site_id', siteId)
      .single();

    if (error) return null;
    return data as EcommerceSettings;
  } catch {
    return null;
  }
}
