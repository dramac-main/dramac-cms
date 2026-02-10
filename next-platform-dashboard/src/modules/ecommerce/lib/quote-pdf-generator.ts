/**
 * Quote & Invoice PDF Generator Utility
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * Phase FIX-02: PDF Generation Implementation
 * 
 * Generates professional HTML documents for quotes/invoices.
 * Uses browser print-to-PDF (window.print) — no external PDF libraries needed.
 */

import type { Quote, QuoteItem } from '../types/ecommerce-types'
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
  /** 'quote' or 'invoice' — controls heading text */
  documentType?: 'quote' | 'invoice'
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
      documentType: 'quote',
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
export function generatePDFFilename(quote: Quote, type: 'quote' | 'invoice' = 'quote'): string {
  const customerSlug = quote.customer_name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  const prefix = type === 'invoice' ? 'INV' : quote.quote_number
  return `${prefix}-${customerSlug}.pdf`
}

// ============================================================================
// HTML DOCUMENT GENERATION
// ============================================================================

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Generate the CSS styles for print-ready document
 */
function generateStyles(primaryColor: string): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: A4;
      margin: 15mm 20mm;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .document {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    
    @media print {
      .document { padding: 0; max-width: none; }
      .no-print { display: none !important; }
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${primaryColor};
    }
    
    .header-left { flex: 1; }
    
    .header-right {
      text-align: right;
      flex-shrink: 0;
    }
    
    .company-logo {
      max-height: 60px;
      max-width: 200px;
      margin-bottom: 8px;
    }
    
    .company-name {
      font-size: 22px;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 4px;
    }
    
    .company-details {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }
    
    .doc-type {
      font-size: 28px;
      font-weight: 700;
      color: ${primaryColor};
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .doc-number {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }
    
    .doc-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 8px;
    }
    
    .status-draft { background: #f3f4f6; color: #6b7280; }
    .status-sent { background: #dbeafe; color: #1d4ed8; }
    .status-viewed { background: #e9d5ff; color: #7c3aed; }
    .status-accepted { background: #dcfce7; color: #16a34a; }
    .status-rejected { background: #fee2e2; color: #dc2626; }
    .status-expired { background: #fef3c7; color: #d97706; }
    .status-converted { background: #dbeafe; color: #2563eb; }
    
    /* Info Grid */
    .info-grid {
      display: flex;
      gap: 40px;
      margin-bottom: 32px;
    }
    
    .info-block { flex: 1; }
    
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #999;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .info-value {
      font-size: 13px;
      color: #333;
      line-height: 1.6;
    }
    
    .info-value strong {
      font-size: 14px;
      display: block;
      margin-bottom: 2px;
    }
    
    /* Dates row */
    .dates-row {
      display: flex;
      gap: 40px;
      margin-bottom: 32px;
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    
    .date-item {
      font-size: 12px;
    }
    
    .date-item span {
      color: #999;
      margin-right: 8px;
    }
    
    /* Introduction */
    .introduction {
      margin-bottom: 28px;
      padding: 16px;
      background: #f8f9fa;
      border-left: 3px solid ${primaryColor};
      border-radius: 0 6px 6px 0;
      font-size: 13px;
      white-space: pre-wrap;
    }
    
    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    
    .items-table thead th {
      text-align: left;
      padding: 10px 12px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #fff;
      background: ${primaryColor};
      font-weight: 600;
    }
    
    .items-table thead th:first-child {
      border-radius: 6px 0 0 0;
    }
    
    .items-table thead th:last-child {
      border-radius: 0 6px 0 0;
      text-align: right;
    }
    
    .items-table thead th.text-right { text-align: right; }
    .items-table thead th.text-center { text-align: center; }
    
    .items-table tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    
    .items-table tbody tr:nth-child(even) {
      background: #fafafa;
    }
    
    .items-table tbody tr:last-child td {
      border-bottom: 2px solid ${primaryColor};
    }
    
    .item-name { font-weight: 600; }
    .item-sku { font-size: 11px; color: #999; }
    .item-desc { font-size: 11px; color: #666; margin-top: 2px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    /* Totals */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    
    .totals-table {
      width: 280px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    
    .totals-row.discount {
      color: #16a34a;
    }
    
    .totals-divider {
      border-top: 1px solid #ddd;
      margin: 4px 0;
    }
    
    .totals-row.total {
      font-size: 18px;
      font-weight: 700;
      padding: 12px 0;
      border-top: 2px solid ${primaryColor};
      color: ${primaryColor};
    }
    
    /* Notes */
    .notes-section {
      margin-bottom: 24px;
      padding: 16px;
      background: #eff6ff;
      border-radius: 6px;
    }
    
    .notes-title {
      font-size: 12px;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 8px;
    }
    
    .notes-content {
      font-size: 12px;
      color: #333;
      white-space: pre-wrap;
    }
    
    /* Terms */
    .terms-section {
      margin-bottom: 24px;
    }
    
    .terms-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }
    
    .terms-content {
      font-size: 11px;
      color: #666;
      white-space: pre-wrap;
      line-height: 1.6;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #999;
    }
    
    .footer-brand {
      font-weight: 600;
      color: ${primaryColor};
    }
    
    /* Print button (screen only) */
    .print-actions {
      text-align: center;
      margin-bottom: 24px;
      padding: 16px;
    }
    
    .print-btn {
      padding: 10px 32px;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      background: ${primaryColor};
      border: none;
      border-radius: 6px;
      cursor: pointer;
      margin: 0 8px;
    }
    
    .print-btn:hover { opacity: 0.9; }
    
    .print-btn.secondary {
      background: #6b7280;
    }
  `
}

/**
 * Build the status badge class
 */
function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    draft: 'status-draft',
    pending_approval: 'status-sent',
    sent: 'status-sent',
    viewed: 'status-viewed',
    accepted: 'status-accepted',
    rejected: 'status-rejected',
    expired: 'status-expired',
    converted: 'status-converted',
  }
  return map[status] || 'status-draft'
}

/**
 * Generate a professional HTML document for a quote (or invoice).
 * Opens in a new window for browser print-to-PDF.
 */
export function generateQuoteHTML(data: QuotePDFData): string {
  const formatted = formatQuoteForPDF(data)
  const docType = data.options.documentType || 'quote'
  const docLabel = docType === 'invoice' ? 'Invoice' : 'Quote'
  const primaryColor = formatted.primaryColor

  // Build items rows
  const hasDiscount = data.items.some(i => i.discount_percent > 0)
  const itemsHtml = formatted.items.map(item => `
    <tr>
      <td>
        <div class="item-name">${escapeHtml(item.name)}</div>
        ${item.sku ? `<div class="item-sku">SKU: ${escapeHtml(item.sku)}</div>` : ''}
        ${item.description ? `<div class="item-desc">${escapeHtml(item.description)}</div>` : ''}
      </td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">${escapeHtml(item.unitPrice)}</td>
      ${hasDiscount ? `<td class="text-center">${item.discount || '—'}</td>` : ''}
      <td class="text-right">${escapeHtml(item.total)}</td>
    </tr>
  `).join('')

  // Build totals
  const totalsHtml = `
    <div class="totals-row">
      <span>Subtotal</span>
      <span>${escapeHtml(formatted.totals.subtotal)}</span>
    </div>
    ${formatted.totals.discount ? `
      <div class="totals-row discount">
        <span>${escapeHtml(formatted.totals.discountLabel)}</span>
        <span>-${escapeHtml(formatted.totals.discount)}</span>
      </div>
    ` : ''}
    ${formatted.totals.tax ? `
      <div class="totals-row">
        <span>${escapeHtml(formatted.totals.taxLabel)}</span>
        <span>${escapeHtml(formatted.totals.tax)}</span>
      </div>
    ` : ''}
    ${formatted.totals.shipping ? `
      <div class="totals-row">
        <span>Shipping</span>
        <span>${escapeHtml(formatted.totals.shipping)}</span>
      </div>
    ` : ''}
    <div class="totals-divider"></div>
    <div class="totals-row total">
      <span>Total</span>
      <span>${escapeHtml(formatted.totals.total)}</span>
    </div>
  `

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docLabel} ${escapeHtml(formatted.header.quoteNumber)} — ${escapeHtml(formatted.customer.name)}</title>
  <style>${generateStyles(primaryColor)}</style>
</head>
<body>
  <div class="no-print print-actions">
    <button class="print-btn" onclick="window.print()">Save as PDF / Print</button>
    <button class="print-btn secondary" onclick="window.close()">Close</button>
  </div>

  <div class="document">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        ${formatted.company.logo ? `<img src="${escapeHtml(formatted.company.logo)}" alt="${escapeHtml(formatted.company.name)}" class="company-logo" />` : ''}
        ${formatted.company.name ? `<div class="company-name">${escapeHtml(formatted.company.name)}</div>` : ''}
        <div class="company-details">
          ${formatted.company.address ? escapeHtml(formatted.company.address) + '<br>' : ''}
          ${formatted.company.phone ? escapeHtml(formatted.company.phone) + '<br>' : ''}
          ${formatted.company.email ? escapeHtml(formatted.company.email) : ''}
        </div>
      </div>
      <div class="header-right">
        <div class="doc-type">${docLabel}</div>
        <div class="doc-number">#${escapeHtml(formatted.header.quoteNumber)}</div>
        <div class="doc-status ${getStatusClass(data.quote.status)}">
          ${escapeHtml(data.quote.status.replace(/_/g, ' '))}
        </div>
      </div>
    </div>

    <!-- Customer & Dates -->
    <div class="info-grid">
      <div class="info-block">
        <div class="info-label">${docLabel} To</div>
        <div class="info-value">
          <strong>${escapeHtml(formatted.customer.name)}</strong>
          ${formatted.customer.company ? escapeHtml(formatted.customer.company) + '<br>' : ''}
          ${formatted.customer.email ? escapeHtml(formatted.customer.email) + '<br>' : ''}
          ${formatted.customer.phone ? escapeHtml(formatted.customer.phone) : ''}
        </div>
      </div>
      <div class="info-block">
        <div class="info-label">${docLabel} Details</div>
        <div class="info-value">
          <strong>${docLabel} #${escapeHtml(formatted.header.quoteNumber)}</strong>
          Date: ${escapeHtml(formatted.header.date)}<br>
          ${formatted.header.validUntil ? `Valid Until: ${escapeHtml(formatted.header.validUntil)}` : ''}
        </div>
      </div>
    </div>

    ${formatted.introduction ? `
      <div class="introduction">${escapeHtml(formatted.introduction)}</div>
    ` : ''}

    <!-- Line Items -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Unit Price</th>
          ${hasDiscount ? '<th class="text-center">Discount</th>' : ''}
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-table">
        ${totalsHtml}
      </div>
    </div>

    ${formatted.notesToCustomer ? `
      <div class="notes-section">
        <div class="notes-title">Notes</div>
        <div class="notes-content">${escapeHtml(formatted.notesToCustomer)}</div>
      </div>
    ` : ''}

    ${formatted.terms ? `
      <div class="terms-section">
        <div class="terms-title">Terms &amp; Conditions</div>
        <div class="terms-content">${escapeHtml(formatted.terms)}</div>
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      ${formatted.footer ? `<p>${escapeHtml(formatted.footer)}</p>` : ''}
      <p>Generated on ${new Date().toLocaleDateString(DEFAULT_LOCALE, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      ${formatted.company.name ? `<p class="footer-brand">${escapeHtml(formatted.company.name)}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate a quote/invoice PDF by opening a print-ready HTML page in a new window.
 * The user can then use the browser's "Save as PDF" option from the print dialog.
 * 
 * @returns true if the window was successfully opened
 */
export function generateQuotePDF(data: QuotePDFData): boolean {
  const html = generateQuoteHTML(data)
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    return false
  }
  printWindow.document.write(html)
  printWindow.document.close()
  return true
}

/**
 * Convenience helper: build QuotePDFData from a Quote and open the print window.
 * This is the function that UI components should call.
 */
export function downloadQuotePDF(
  quote: Quote,
  options: QuotePDFOptions = {}
): boolean {
  const items = quote.items || []
  const data = generatePDFData(quote, items, options)
  return generateQuotePDF(data)
}

/**
 * Generate an invoice PDF for a quote (same layout, different heading).
 */
export function downloadInvoicePDF(
  quote: Quote,
  options: QuotePDFOptions = {}
): boolean {
  return downloadQuotePDF(quote, { ...options, documentType: 'invoice' })
}
