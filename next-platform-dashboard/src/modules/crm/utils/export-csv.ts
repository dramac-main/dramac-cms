/**
 * CRM CSV Export Utility
 * 
 * Phase FIX-02 Task 8a: CSV Export Implementation
 * 
 * Generic CSV export function for CRM data (contacts, companies, deals, etc.)
 */

/**
 * Export an array of objects to a downloadable CSV file.
 * Handles quoting, escaping, and null/undefined values.
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return

  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(item =>
    Object.values(item)
      .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  )
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Flatten a contact object for CSV export (removes nested objects).
 */
export function flattenContact(contact: Record<string, unknown>): Record<string, unknown> {
  const { company, tags, custom_fields, ...rest } = contact
  return {
    ...rest,
    company_name: (company as Record<string, unknown> | null)?.name ?? '',
  }
}

/**
 * Flatten a company object for CSV export.
 */
export function flattenCompany(company: Record<string, unknown>): Record<string, unknown> {
  const { tags, custom_fields, ...rest } = company
  return rest
}

/**
 * Flatten a deal object for CSV export.
 */
export function flattenDeal(deal: Record<string, unknown>): Record<string, unknown> {
  const { stage, contact, company, tags, custom_fields, ...rest } = deal
  return {
    ...rest,
    stage_name: (stage as Record<string, unknown> | null)?.name ?? '',
    contact_name: contact
      ? `${(contact as Record<string, unknown>).first_name ?? ''} ${(contact as Record<string, unknown>).last_name ?? ''}`.trim()
      : '',
    company_name: (company as Record<string, unknown> | null)?.name ?? '',
  }
}
