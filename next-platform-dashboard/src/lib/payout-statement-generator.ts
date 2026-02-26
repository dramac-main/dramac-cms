/**
 * Payout Statement HTML Generator
 * 
 * Phase FIX-02: PDF Generation Implementation
 * 
 * Generates professional HTML documents for developer payout statements.
 * Uses browser print-to-PDF (window.print) — no external PDF libraries needed.
 */

import { DEFAULT_LOCALE } from '@/lib/locale-config'
import { formatCurrency } from '@/lib/locale-config'

// ============================================================================
// TYPES
// ============================================================================

export interface PayoutStatementData {
  /** Developer name */
  developerName: string
  /** Developer email */
  developerEmail?: string
  /** Payout ID or reference */
  payoutId: string
  /** Payout amount */
  payoutAmount: number
  /** Currency code */
  currency?: string
  /** Payout status */
  status: string
  /** Period start date (ISO string) */
  periodStart?: string
  /** Period end date (ISO string) */
  periodEnd?: string
  /** Date processed (ISO string) */
  processedAt?: string
  /** Line items / earnings breakdown */
  lineItems?: PayoutLineItem[]
  /** Platform/company info */
  companyName?: string
  companyLogoUrl?: string
  primaryColor?: string
}

export interface PayoutLineItem {
  description: string
  moduleName?: string
  sales?: number
  grossAmount: number
  commissionRate?: number
  netAmount: number
}

// ============================================================================
// HTML GENERATION
// ============================================================================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(DEFAULT_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Generate a professional HTML payout statement.
 */
export function generatePayoutStatementHTML(data: PayoutStatementData): string {
  const primaryColor = data.primaryColor || '#0f172a'
  const companyName = data.companyName || 'DRAMAC Platform'
  const currency = data.currency || 'USD'

  const fmtAmount = (amount: number) => formatCurrency(amount, currency)

  const lineItemsHtml = data.lineItems?.length
    ? data.lineItems.map(item => `
      <tr>
        <td>
          <div style="font-weight:600">${escapeHtml(item.description)}</div>
          ${item.moduleName ? `<div style="font-size:11px;color:#999">${escapeHtml(item.moduleName)}</div>` : ''}
        </td>
        <td class="text-center">${item.sales != null ? item.sales : '—'}</td>
        <td class="text-right">${fmtAmount(item.grossAmount)}</td>
        <td class="text-center">${item.commissionRate != null ? `${item.commissionRate}%` : '—'}</td>
        <td class="text-right">${fmtAmount(item.netAmount)}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="5" style="text-align:center;padding:20px;color:#999">No detailed breakdown available</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payout Statement — ${escapeHtml(data.payoutId)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 15mm 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px; line-height: 1.5; color: #1a1a1a; background: #fff;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .document { max-width: 800px; margin: 0 auto; padding: 40px; }
    @media print {
      .document { padding: 0; max-width: none; }
      .no-print { display: none !important; }
    }
    
    .header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid ${primaryColor};
    }
    .company-name { font-size: 22px; font-weight: 700; color: ${primaryColor}; }
    .company-logo { max-height: 50px; max-width: 180px; margin-bottom: 8px; }
    .doc-type { font-size: 24px; font-weight: 700; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 2px; }
    .doc-number { font-size: 13px; color: #666; margin-top: 4px; }
    
    .info-grid { display: flex; gap: 40px; margin-bottom: 32px; }
    .info-block { flex: 1; }
    .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 600; margin-bottom: 8px; }
    .info-value { font-size: 13px; color: #333; line-height: 1.6; }
    .info-value strong { font-size: 14px; display: block; margin-bottom: 2px; }
    
    .summary-box {
      padding: 20px; background: #f8f9fa; border-radius: 8px;
      margin-bottom: 32px; display: flex; gap: 32px; align-items: center;
    }
    .summary-item { text-align: center; flex: 1; }
    .summary-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-value { font-size: 22px; font-weight: 700; color: ${primaryColor}; margin-top: 4px; }
    .summary-value.status-completed { color: #16a34a; }
    .summary-value.status-pending { color: #d97706; }
    .summary-value.status-failed { color: #dc2626; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    thead th {
      text-align: left; padding: 10px 12px; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.5px; color: #fff;
      background: ${primaryColor}; font-weight: 600;
    }
    thead th:first-child { border-radius: 6px 0 0 0; }
    thead th:last-child { border-radius: 0 6px 0 0; text-align: right; }
    thead th.text-right { text-align: right; }
    thead th.text-center { text-align: center; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody tr:last-child td { border-bottom: 2px solid ${primaryColor}; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    .total-row {
      display: flex; justify-content: flex-end; margin-bottom: 32px;
    }
    .total-box {
      padding: 16px 24px; background: ${primaryColor}; color: #fff;
      border-radius: 8px; text-align: right; min-width: 250px;
    }
    .total-label { font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
    .total-amount { font-size: 24px; font-weight: 700; margin-top: 4px; }
    
    .footer {
      margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;
      text-align: center; font-size: 11px; color: #999;
    }
    .footer-brand { font-weight: 600; color: ${primaryColor}; }
    
    .print-actions { text-align: center; margin-bottom: 24px; padding: 16px; }
    .print-btn {
      padding: 10px 32px; font-size: 14px; font-weight: 600; color: #fff;
      background: ${primaryColor}; border: none; border-radius: 6px; cursor: pointer; margin: 0 8px;
    }
    .print-btn:hover { opacity: 0.9; }
    .print-btn.secondary { background: #6b7280; }
  </style>
</head>
<body>
  <div class="no-print print-actions">
    <button class="print-btn" onclick="window.print()">Save as PDF / Print</button>
    <button class="print-btn secondary" onclick="window.close()">Close</button>
  </div>

  <div class="document">
    <div class="header">
      <div>
        ${data.companyLogoUrl ? `<img src="${escapeHtml(data.companyLogoUrl)}" alt="${escapeHtml(companyName)}" class="company-logo" />` : ''}
        <div class="company-name">${escapeHtml(companyName)}</div>
      </div>
      <div style="text-align:right">
        <div class="doc-type">Payout Statement</div>
        <div class="doc-number">Ref: ${escapeHtml(data.payoutId)}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <div class="info-label">Payee</div>
        <div class="info-value">
          <strong>${escapeHtml(data.developerName)}</strong>
          ${data.developerEmail ? escapeHtml(data.developerEmail) : ''}
        </div>
      </div>
      <div class="info-block">
        <div class="info-label">Period</div>
        <div class="info-value">
          ${data.periodStart && data.periodEnd
            ? `${formatDate(data.periodStart)} — ${formatDate(data.periodEnd)}`
            : data.processedAt
              ? `Processed: ${formatDate(data.processedAt)}`
              : 'N/A'}
        </div>
      </div>
    </div>

    <div class="summary-box">
      <div class="summary-item">
        <div class="summary-label">Payout Amount</div>
        <div class="summary-value">${fmtAmount(data.payoutAmount)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Currency</div>
        <div class="summary-value" style="color:#333;font-size:16px">${escapeHtml(currency)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Status</div>
        <div class="summary-value status-${data.status}">${escapeHtml(data.status)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-center">Sales</th>
          <th class="text-right">Gross</th>
          <th class="text-center">Commission</th>
          <th class="text-right">Net</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>

    <div class="total-row">
      <div class="total-box">
        <div class="total-label">Total Payout</div>
        <div class="total-amount">${fmtAmount(data.payoutAmount)}</div>
      </div>
    </div>

    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString(DEFAULT_LOCALE, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p class="footer-brand">${escapeHtml(companyName)}</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Open payout statement in a new window for print-to-PDF.
 * @returns true if the window was opened successfully
 */
export function downloadPayoutStatement(data: PayoutStatementData): boolean {
  const html = generatePayoutStatementHTML(data)
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    return false
  }
  printWindow.document.write(html)
  printWindow.document.close()
  return true
}
