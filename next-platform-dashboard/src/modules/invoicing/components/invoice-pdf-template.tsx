"use client";

import { forwardRef } from "react";
import type { InvoiceWithItems, InvoicingSettings } from "../types";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { INVOICE_STATUS_LABELS } from "../lib/invoicing-constants";

interface InvoicePdfTemplateProps {
  invoice: InvoiceWithItems;
  settings?: InvoicingSettings | null;
}

export const InvoicePdfTemplate = forwardRef<
  HTMLDivElement,
  InvoicePdfTemplateProps
>(function InvoicePdfTemplate({ invoice, settings }, ref) {
  const lineItems = invoice.lineItems ?? [];
  const fmt = (amount: number) => formatInvoiceAmount(amount, invoice.currency);

  return (
    <div
      ref={ref}
      className="bg-white text-black max-w-[210mm] mx-auto p-8 print:p-0 print:max-w-none print:mx-0"
    >
      <style jsx>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          {settings?.brandLogoUrl ? (
            <img
              src={settings.brandLogoUrl}
              alt={settings?.companyName ?? "Company"}
              className="h-12 mb-2 object-contain"
            />
          ) : (
            <h1 className="text-2xl font-bold">
              {settings?.companyName ?? "Invoice"}
            </h1>
          )}
          {settings?.companyName && settings?.brandLogoUrl && (
            <p className="text-sm font-medium">{settings.companyName}</p>
          )}
          {settings?.companyAddress && (
            <p className="text-xs text-gray-600 whitespace-pre-line mt-1">
              {settings.companyAddress}
            </p>
          )}
          {settings?.companyEmail && (
            <p className="text-xs text-gray-600">{settings.companyEmail}</p>
          )}
          {settings?.companyPhone && (
            <p className="text-xs text-gray-600">{settings.companyPhone}</p>
          )}
          {settings?.companyTaxId && (
            <p className="text-xs text-gray-600">
              Tax #: {settings.companyTaxId}
            </p>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-wide">
            Invoice
          </h2>
          <p className="text-lg font-semibold mt-1">{invoice.invoiceNumber}</p>
          <p className="text-xs text-gray-500 mt-1 uppercase">
            {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
          </p>
        </div>
      </div>

      {/* Bill To + Dates */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Bill To
          </p>
          <p className="font-medium">{invoice.clientName}</p>
          {invoice.clientTaxId && (
            <p className="text-sm text-gray-600">
              Tax ID: {invoice.clientTaxId}
            </p>
          )}
          {invoice.clientEmail && (
            <p className="text-sm text-gray-600">{invoice.clientEmail}</p>
          )}
          {invoice.clientPhone && (
            <p className="text-sm text-gray-600">{invoice.clientPhone}</p>
          )}
          {invoice.clientAddress && (
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {invoice.clientAddress}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="inline-block text-left">
            <table className="text-sm">
              <tbody>
                <tr>
                  <td className="text-gray-500 pr-4 py-0.5">Issue Date:</td>
                  <td className="font-medium">{invoice.issueDate}</td>
                </tr>
                <tr>
                  <td className="text-gray-500 pr-4 py-0.5">Due Date:</td>
                  <td className="font-medium">{invoice.dueDate}</td>
                </tr>
                {invoice.reference && (
                  <tr>
                    <td className="text-gray-500 pr-4 py-0.5">Reference:</td>
                    <td className="font-medium">{invoice.reference}</td>
                  </tr>
                )}
                {invoice.paymentTerms && (
                  <tr>
                    <td className="text-gray-500 pr-4 py-0.5">Terms:</td>
                    <td className="font-medium">{invoice.paymentTerms}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-2 font-semibold">#</th>
            <th className="text-left py-2 font-semibold">Item</th>
            <th className="text-right py-2 font-semibold">Qty</th>
            <th className="text-right py-2 font-semibold">Unit Price</th>
            <th className="text-right py-2 font-semibold">Tax</th>
            <th className="text-right py-2 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((li, idx) => (
            <tr key={li.id ?? idx} className="border-b border-gray-200">
              <td className="py-2 text-gray-500">{idx + 1}</td>
              <td className="py-2">
                <p className="font-medium">{li.name}</p>
                {li.description && (
                  <p className="text-xs text-gray-500">{li.description}</p>
                )}
              </td>
              <td className="py-2 text-right">{li.quantity}</td>
              <td className="py-2 text-right">{fmt(li.unitPrice)}</td>
              <td className="py-2 text-right text-gray-500">
                {li.taxRate ? `${li.taxRate}%` : "—"}
              </td>
              <td className="py-2 text-right font-medium">{fmt(li.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between py-1 text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{fmt(invoice.subtotal)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-500">Discount</span>
              <span>-{fmt(invoice.discountAmount)}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-500">Tax</span>
              <span>{fmt(invoice.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 mt-1 border-t-2 border-gray-800 text-lg font-bold">
            <span>Total</span>
            <span>{fmt(invoice.total)}</span>
          </div>
          {invoice.amountPaid > 0 && (
            <>
              <div className="flex justify-between py-1 text-sm text-green-700">
                <span>Paid</span>
                <span>-{fmt(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between pt-1 mt-1 border-t border-gray-400 text-base font-bold">
                <span>Balance Due</span>
                <span>{fmt(invoice.amountDue)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Notes
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Terms */}
      {invoice.terms && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Terms & Conditions
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {invoice.terms}
          </p>
        </div>
      )}

      {/* Payment Instructions */}
      {settings?.paymentInstructions && (
        <div className="mt-6 p-4 bg-gray-50 rounded text-sm print:bg-gray-100">
          <p className="font-semibold text-gray-700 mb-1">
            Payment Instructions
          </p>
          <p className="text-gray-600 whitespace-pre-line">
            {settings.paymentInstructions}
          </p>
        </div>
      )}

      {/* Footer */}
      {invoice.footer && (
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          {invoice.footer}
        </div>
      )}
    </div>
  );
});
