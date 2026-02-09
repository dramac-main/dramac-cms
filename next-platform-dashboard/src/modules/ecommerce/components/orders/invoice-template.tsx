/**
 * Invoice Template Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Printable invoice document
 */
'use client'

import { forwardRef } from 'react'
import { format } from 'date-fns'
import type { InvoiceData } from '../../types/ecommerce-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

interface InvoiceTemplateProps {
  data: InvoiceData
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency
  }).format(amount / 100)
}

// ============================================================================
// COMPONENT
// ============================================================================

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  function InvoiceTemplate({ data }, ref) {
    const { order, store, invoice_number, invoice_date, due_date } = data
    const billingAddress = order.billing_address as Record<string, string> | null

    // Calculate totals
    const subtotal = order.items?.reduce((sum, item) => 
      sum + (item.unit_price * item.quantity), 0
    ) || 0

    return (
      <div 
        ref={ref}
        className="bg-white p-8 max-w-[210mm] mx-auto text-black print:p-0"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {store.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={store.logo} 
                alt={store.name} 
                className="h-12 mb-2"
              />
            ) : (
              <h1 className="text-2xl font-bold">{store.name}</h1>
            )}
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {store.address}
            </div>
            {store.email && <div className="text-sm">{store.email}</div>}
            {store.phone && <div className="text-sm">{store.phone}</div>}
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h2>
            <table className="text-sm ml-auto">
              <tbody>
                <tr>
                  <td className="pr-4 text-gray-600">Invoice #:</td>
                  <td className="font-medium">{invoice_number}</td>
                </tr>
                <tr>
                  <td className="pr-4 text-gray-600">Date:</td>
                  <td>{format(new Date(invoice_date), 'MMM dd, yyyy')}</td>
                </tr>
                {due_date && (
                  <tr>
                    <td className="pr-4 text-gray-600">Due Date:</td>
                    <td>{format(new Date(due_date), 'MMM dd, yyyy')}</td>
                  </tr>
                )}
                <tr>
                  <td className="pr-4 text-gray-600">Order #:</td>
                  <td>{order.order_number}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">BILL TO</h3>
          <div className="text-sm">
            <div className="font-medium">{order.customer_name}</div>
            {billingAddress && (
              <>
                <div>{billingAddress.address_line_1}</div>
                {billingAddress.address_line_2 && (
                  <div>{billingAddress.address_line_2}</div>
                )}
                <div>
                  {billingAddress.city}, {billingAddress.state} {billingAddress.postal_code}
                </div>
                <div>{billingAddress.country}</div>
              </>
            )}
            {order.customer_email && <div>{order.customer_email}</div>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="py-2 text-left font-semibold">Description</th>
              <th className="py-2 text-right font-semibold">Qty</th>
              <th className="py-2 text-right font-semibold">Unit Price</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3">
                  <div className="font-medium">{item.product_name}</div>
                  {item.variant_name && (
                    <div className="text-gray-500 text-xs">{item.variant_name}</div>
                  )}
                  {(item.sku || item.product_sku) && (
                    <div className="text-gray-400 text-xs">SKU: {item.sku || item.product_sku}</div>
                  )}
                </td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right">
                  {formatCurrency(item.unit_price, order.currency)}
                </td>
                <td className="py-3 text-right">
                  {formatCurrency(item.unit_price * item.quantity, order.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <table className="text-sm w-64">
            <tbody>
              <tr>
                <td className="py-1">Subtotal:</td>
                <td className="py-1 text-right">
                  {formatCurrency(subtotal, order.currency)}
                </td>
              </tr>
              {(order.shipping_total > 0 || order.shipping_amount > 0) && (
                <tr>
                  <td className="py-1">Shipping:</td>
                  <td className="py-1 text-right">
                    {formatCurrency(order.shipping_total || order.shipping_amount, order.currency)}
                  </td>
                </tr>
              )}
              {(order.tax_total > 0 || order.tax_amount > 0) && (
                <tr>
                  <td className="py-1">Tax:</td>
                  <td className="py-1 text-right">
                    {formatCurrency(order.tax_total || order.tax_amount, order.currency)}
                  </td>
                </tr>
              )}
              {(order.discount_total > 0 || order.discount_amount > 0) && (
                <tr className="text-green-600">
                  <td className="py-1">Discount:</td>
                  <td className="py-1 text-right">
                    -{formatCurrency(order.discount_total || order.discount_amount, order.currency)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-gray-300 font-bold text-lg">
                <td className="py-2">Total:</td>
                <td className="py-2 text-right">
                  {formatCurrency(order.total, order.currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Status */}
        <div className="mb-8 p-4 bg-gray-50 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium">Payment Status:</span>
            <span className={
              order.payment_status === 'paid' 
                ? 'text-green-600 font-semibold' 
                : 'text-orange-600 font-semibold'
            }>
              {order.payment_status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 border-t pt-4">
          <p>Thank you for your business!</p>
          <p className="mt-1">
            If you have any questions about this invoice, please contact us at{' '}
            {store.email}
          </p>
        </div>
      </div>
    )
  }
)
