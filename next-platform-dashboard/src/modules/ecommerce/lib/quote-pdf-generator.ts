/**
 * Quote PDF Generator Utility
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * PDF generation for quotes
 * NOTE: Full implementation would use @react-pdf/renderer
 */

import type { Quote, QuoteItem, QuoteSettings } from '../types/ecommerce-types'
import { formatQuoteCurrency, calculateItemLineTotal } from './quote-utils'

import { DEFAULT_LOCALE } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

export interface QuotePDFOptions {
  includeCompanyLogo?: boolean
  logoUrl?: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  primaryColor?: string
  showTerms?: boolean
  customFooter?: string
}

export interface QuotePDFData {
  quote: Quote
  items: QuoteItem[]
  options: QuotePDFOptions
}

// ============================================================================
// PDF TEMPLATE DATA
// ============================================================================

/**
 * Generate data structure for PDF template
 */
export function generatePDFData(
  quote: Quote,
  items: QuoteItem[],
  options: QuotePDFOptions = {}
): QuotePDFData {
  return {
    quote,
    items: items.sort((a, b) => a.sort_order - b.sort_order),
    options: {
      includeCompanyLogo: true,
      primaryColor: '#2563eb',
      showTerms: true,
      ...options
    }
  }
}

/**
 * Format quote data for PDF sections
 */
export function formatQuoteForPDF(data: QuotePDFData) {
  const { quote, items, options } = data
  
  return {
    // Header
    header: {
      title: quote.title || `Quote ${quote.quote_number}`,
      quoteNumber: quote.quote_number,
      date: new Date(quote.created_at).toLocaleDateString(DEFAULT_LOCALE, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      validUntil: quote.valid_until 
        ? new Date(quote.valid_until).toLocaleDateString(DEFAULT_LOCALE, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : null
    },
    
    // Company Info
    company: {
      name: options.companyName || '',
      address: options.companyAddress || '',
      phone: options.companyPhone || '',
      email: options.companyEmail || '',
      logo: options.logoUrl || null
    },
    
    // Customer Info
    customer: {
      name: quote.customer_name,
      email: quote.customer_email,
      company: quote.customer_company || '',
      phone: quote.customer_phone || ''
    },
    
    // Introduction
    introduction: quote.introduction || null,
    
    // Line Items
    items: items.map(item => ({
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      quantity: item.quantity,
      unitPrice: formatQuoteCurrency(item.unit_price, quote.currency),
      discount: item.discount_percent > 0 ? `${item.discount_percent}%` : '',
      total: formatQuoteCurrency(
        calculateItemLineTotal(
          item.quantity,
          item.unit_price,
          item.discount_percent,
          item.tax_rate
        ),
        quote.currency
      )
    })),
    
    // Totals
    totals: {
      subtotal: formatQuoteCurrency(quote.subtotal, quote.currency),
      discount: quote.discount_amount > 0 
        ? formatQuoteCurrency(quote.discount_amount, quote.currency)
        : null,
      discountLabel: quote.discount_type === 'percentage'
        ? `Discount (${quote.discount_value}%)`
        : 'Discount',
      tax: quote.tax_amount > 0
        ? formatQuoteCurrency(quote.tax_amount, quote.currency)
        : null,
      taxLabel: quote.tax_rate > 0 ? `Tax (${quote.tax_rate}%)` : 'Tax',
      shipping: quote.shipping_amount > 0
        ? formatQuoteCurrency(quote.shipping_amount, quote.currency)
        : null,
      total: formatQuoteCurrency(quote.total, quote.currency)
    },
    
    // Terms
    terms: options.showTerms ? quote.terms_and_conditions : null,
    
    // Notes
    notesToCustomer: quote.notes_to_customer || null,
    
    // Footer
    footer: options.customFooter || null,
    
    // Styling
    primaryColor: options.primaryColor || '#2563eb'
  }
}

/**
 * Generate PDF filename
 */
export function generatePDFFilename(quote: Quote): string {
  const customerSlug = quote.customer_name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  return `${quote.quote_number}-${customerSlug}.pdf`
}

/**
 * Generate PDF blob (placeholder implementation)
 * 
 * NOTE: Full implementation would use @react-pdf/renderer:
 * 
 * import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
 * 
 * const QuotePDFDocument = ({ data }) => (
 *   <Document>
 *     <Page size="A4" style={styles.page}>
 *       <View style={styles.header}>
 *         <Text>{data.header.title}</Text>
 *         <Text>Quote #: {data.header.quoteNumber}</Text>
 *       </View>
 *     </Page>
 *   </Document>
 * )
 * 
 * export async function generateQuotePDF(data: QuotePDFData): Promise<Blob> {
 *   const formattedData = formatQuoteForPDF(data)
 *   return pdf(<QuotePDFDocument data={formattedData} />).toBlob()
 * }
 */
export async function generateQuotePDF(_data: QuotePDFData): Promise<Blob | null> {
  // Placeholder - would return actual PDF blob
  console.log('PDF generation not yet implemented')
  return null
}
