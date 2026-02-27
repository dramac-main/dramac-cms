/**
 * E-Commerce Structured Data (Schema.org JSON-LD)
 * 
 * Generates JSON-LD structured data for Google Rich Results.
 * When Google crawls a product page, it uses this data to display
 * rich product cards in search results with images, prices, ratings,
 * and availability — directly in the search page.
 * 
 * Supported Schema.org types:
 * - Product (individual product pages)
 * - ItemList (product listing / category pages)
 * - BreadcrumbList (navigation breadcrumbs)
 * - WebSite (site-level search action)
 * - Organization (store identity)
 * 
 * @see https://developers.google.com/search/docs/appearance/structured-data/product
 * @see https://schema.org/Product
 */

import type { Product, ProductVariant, EcommerceSettings } from '../types/ecommerce-types';

// ============================================================================
// TYPES
// ============================================================================

interface ReviewStatsForSchema {
  averageRating: number;
  totalReviews: number;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface StructuredDataOptions {
  siteUrl: string;
  storeName: string;
  currency: string;
}

// ============================================================================
// PRODUCT STRUCTURED DATA
// ============================================================================

/**
 * Generate Schema.org Product JSON-LD for a single product page.
 * 
 * This produces the rich product cards that appear in Google search results
 * showing the product image, price, rating stars, availability, etc.
 * 
 * @see https://developers.google.com/search/docs/appearance/structured-data/product
 */
export function generateProductJsonLd(
  product: Product,
  options: StructuredDataOptions,
  reviewStats?: ReviewStatsForSchema | null,
): Record<string, unknown> {
  const { siteUrl, storeName, currency } = options;
  const productUrl = `${siteUrl}/products/${product.slug}`;

  // Determine availability based on inventory tracking
  const availability = getAvailability(product);

  // Build offers — if variants exist with different prices, create multiple offers
  const offers = buildOffers(product, productUrl, currency, availability, options);

  // Core product schema
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: productUrl,
    description: product.description || product.short_description || undefined,
  };

  // Images (Google recommends at least one high-quality image)
  if (product.images && product.images.length > 0) {
    schema.image = product.images;
  }

  // SKU & identifiers
  if (product.sku) {
    schema.sku = product.sku;
  }
  if (product.barcode) {
    // Could be GTIN-8, GTIN-12 (UPC), GTIN-13 (EAN), or GTIN-14
    const barcodeLen = product.barcode.replace(/[^0-9]/g, '').length;
    if (barcodeLen === 8 || barcodeLen === 12 || barcodeLen === 13 || barcodeLen === 14) {
      schema.gtin = product.barcode;
    } else {
      schema.mpn = product.barcode;
    }
  }

  // Brand — use store name as brand if no explicit brand in metadata
  const brand = (product.metadata?.brand as string) || storeName;
  if (brand) {
    schema.brand = {
      '@type': 'Brand',
      name: brand,
    };
  }

  // Category
  if (product.categories && product.categories.length > 0) {
    schema.category = product.categories.map(c => c.name).join(' > ');
  }

  // Weight
  if (product.weight && product.weight > 0) {
    schema.weight = {
      '@type': 'QuantitativeValue',
      value: product.weight,
      unitCode: mapWeightUnit(product.weight_unit),
    };
  }

  // Offers (price, currency, availability)
  schema.offers = offers;

  // Aggregate rating (only include if there are reviews)
  if (reviewStats && reviewStats.totalReviews > 0 && reviewStats.averageRating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, reviewStats.averageRating)),
      reviewCount: reviewStats.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

/**
 * Build Schema.org Offer(s) for a product.
 * If variants exist with different prices, creates an AggregateOffer.
 */
function buildOffers(
  product: Product,
  productUrl: string,
  currency: string,
  availability: string,
  options: StructuredDataOptions,
): Record<string, unknown> {
  const hasVariantPrices = product.variants?.some(v => v.price !== null && v.price !== product.base_price);

  if (hasVariantPrices && product.variants && product.variants.length > 0) {
    // Multiple price points — use AggregateOffer
    const prices = [
      product.base_price,
      ...product.variants
        .filter(v => v.price !== null && v.is_active)
        .map(v => v.price as number),
    ];
    const lowPrice = Math.min(...prices);
    const highPrice = Math.max(...prices);

    return {
      '@type': 'AggregateOffer',
      lowPrice: (lowPrice / 100).toFixed(2),
      highPrice: (highPrice / 100).toFixed(2),
      priceCurrency: currency,
      offerCount: product.variants.filter(v => v.is_active).length + 1,
      availability: `https://schema.org/${availability}`,
      url: productUrl,
    };
  }

  // Single price — use Offer
  const { storeName: sellerName } = options;
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    price: (Number(product.base_price) / 100).toFixed(2),
    priceCurrency: currency,
    availability: `https://schema.org/${availability}`,
    url: productUrl,
    seller: {
      '@type': 'Organization',
      name: (product.metadata?.brand as string) || sellerName || 'Store',
    },
  };

  // Add sale metadata for Google rich results
  if (product.compare_at_price && product.compare_at_price > product.base_price) {
    offer.itemCondition = 'https://schema.org/NewCondition';
    // priceValidUntil is required by Google for Product rich results
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    offer.priceValidUntil = validUntil.toISOString().split('T')[0];
  }

  return offer;
}

// ============================================================================
// PRODUCT LISTING (ITEMLIST) STRUCTURED DATA
// ============================================================================

/**
 * Generate Schema.org ItemList JSON-LD for product listing pages (shop, category).
 * This helps Google understand the product catalog and can show carousel results.
 */
export function generateProductListJsonLd(
  products: Product[],
  options: StructuredDataOptions & { listName?: string },
): Record<string, unknown> {
  const { siteUrl, listName } = options;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName || 'Products',
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/products/${product.slug}`,
      name: product.name,
      image: product.images?.[0] || undefined,
      item: {
        '@type': 'Product',
        name: product.name,
        url: `${siteUrl}/products/${product.slug}`,
        image: product.images?.[0] || undefined,
        offers: {
          '@type': 'Offer',
          price: (Number(product.base_price) / 100).toFixed(2),
          priceCurrency: options.currency,
          availability: `https://schema.org/${product.track_inventory && product.quantity <= 0 ? 'OutOfStock' : 'InStock'}`,
        },
      },
    })),
  };
}

// ============================================================================
// BREADCRUMB STRUCTURED DATA
// ============================================================================

/**
 * Generate Schema.org BreadcrumbList JSON-LD.
 * Helps Google show breadcrumb navigation in search results.
 */
export function generateBreadcrumbJsonLd(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ============================================================================
// STORE / ORGANIZATION STRUCTURED DATA
// ============================================================================

/**
 * Generate Schema.org Organization JSON-LD for the store.
 * Provides Google with store identity information.
 */
export function generateStoreJsonLd(
  settings: EcommerceSettings,
  siteUrl: string,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.store_name || 'Store',
    url: siteUrl,
  };

  if (settings.store_email) {
    schema.email = settings.store_email;
  }
  if (settings.store_phone) {
    schema.telephone = settings.store_phone;
  }
  if (settings.store_address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: settings.store_address.address_line_1,
      addressLocality: settings.store_address.city,
      addressRegion: settings.store_address.state,
      postalCode: settings.store_address.postal_code,
      addressCountry: settings.store_address.country,
    };
  }

  return schema;
}

/**
 * Generate Schema.org WebSite JSON-LD with SearchAction.
 * Enables Google Sitelinks Search Box for the store.
 */
export function generateWebSiteSearchJsonLd(
  storeName: string,
  siteUrl: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: storeName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Determine Schema.org availability status from product inventory data
 */
function getAvailability(product: Product): string {
  if (!product.track_inventory) {
    return 'InStock'; // Not tracking = always available
  }
  if (product.quantity > 0) {
    return 'InStock';
  }
  // Check if we have active variants with stock
  if (product.variants?.some(v => v.is_active && v.quantity > 0)) {
    return 'InStock';
  }
  return 'OutOfStock';
}

/**
 * Map weight unit strings to UN/CEFACT unit codes for Schema.org
 */
function mapWeightUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    kg: 'KGM',
    g: 'GRM',
    lb: 'LBR',
    lbs: 'LBR',
    oz: 'ONZ',
  };
  return unitMap[unit?.toLowerCase()] || 'KGM';
}

/**
 * Construct the canonical site URL from domain/subdomain info.
 * Used for all structured data URL fields.
 */
export function buildSiteUrl(
  subdomain?: string | null,
  customDomain?: string | null,
): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  if (subdomain) {
    return `https://${subdomain}.dramac.app`;
  }
  return '';
}
