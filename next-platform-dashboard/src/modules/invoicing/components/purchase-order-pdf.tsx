"use client";

import { forwardRef } from "react";
import type { PurchaseOrder, PurchaseOrderLineItem, Vendor } from "../types";

interface PurchaseOrderPdfProps {
  purchaseOrder: PurchaseOrder & { vendor?: Vendor | null };
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

function fmt(amount: number, currency = "ZMW"): string {
  const symbol = currency === "ZMW" ? "K" : currency + " ";
  return `${symbol}${(amount / 100).toFixed(2)}`;
}

export const PurchaseOrderPdf = forwardRef<HTMLDivElement, PurchaseOrderPdfProps>(
  function PurchaseOrderPdf(
    { purchaseOrder: po, companyName, companyAddress, companyPhone, companyEmail },
    ref,
  ) {
    const lineItems: PurchaseOrderLineItem[] =
      (po.metadata as any)?.lineItems || [];

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
            <h1 className="text-2xl font-bold">
              {companyName || "Purchase Order"}
            </h1>
            {companyAddress && (
              <p className="text-xs text-gray-600 whitespace-pre-line mt-1">
                {companyAddress}
              </p>
            )}
            {companyPhone && (
              <p className="text-xs text-gray-600">{companyPhone}</p>
            )}
            {companyEmail && (
              <p className="text-xs text-gray-600">{companyEmail}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-700">PURCHASE ORDER</h2>
            <p className="text-lg font-semibold mt-1">{po.poNumber}</p>
            <p className="text-sm text-gray-500 mt-2">
              Status: {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
            </p>
          </div>
        </div>

        {/* Vendor + Dates */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Vendor
            </h3>
            {po.vendor ? (
              <div className="text-sm">
                <p className="font-semibold">{po.vendor.name}</p>
                {po.vendor.email && (
                  <p className="text-gray-600">{po.vendor.email}</p>
                )}
                {po.vendor.phone && (
                  <p className="text-gray-600">{po.vendor.phone}</p>
                )}
                {po.vendor.address && (
                  <p className="text-gray-600">{po.vendor.address}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No vendor info</p>
            )}
          </div>
          <div className="text-right text-sm">
            <div className="space-y-1">
              <p>
                <span className="text-gray-500">Issue Date: </span>
                <span className="font-medium">{po.issueDate}</span>
              </p>
              {po.expectedDate && (
                <p>
                  <span className="text-gray-500">Expected Delivery: </span>
                  <span className="font-medium">{po.expectedDate}</span>
                </p>
              )}
              <p>
                <span className="text-gray-500">Currency: </span>
                <span className="font-medium">{po.currency}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {po.shippingAddress && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Ship To
            </h3>
            <p className="text-sm whitespace-pre-line">{po.shippingAddress}</p>
          </div>
        )}

        {/* Line Items Table */}
        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 font-semibold">#</th>
              <th className="text-left py-2 font-semibold">Item</th>
              <th className="text-center py-2 font-semibold">Qty</th>
              <th className="text-right py-2 font-semibold">Unit Price</th>
              <th className="text-right py-2 font-semibold">Tax</th>
              <th className="text-right py-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((li, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-2 text-gray-500">{idx + 1}</td>
                <td className="py-2">
                  <span className="font-medium">{li.name}</span>
                  {li.description && (
                    <span className="block text-xs text-gray-500">
                      {li.description}
                    </span>
                  )}
                </td>
                <td className="py-2 text-center">
                  {li.quantity}
                  {li.unit ? ` ${li.unit}` : ""}
                </td>
                <td className="py-2 text-right">
                  {fmt(li.unitPrice, po.currency)}
                </td>
                <td className="py-2 text-right text-gray-500">
                  {fmt(li.taxAmount || 0, po.currency)}
                </td>
                <td className="py-2 text-right font-medium">
                  {fmt(li.total, po.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-500">Subtotal:</span>
              <span>{fmt(po.subtotal, po.currency)}</span>
            </div>
            {po.taxAmount > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-500">Tax:</span>
                <span>{fmt(po.taxAmount, po.currency)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 text-base font-bold border-t-2 border-gray-300 mt-1">
              <span>Total:</span>
              <span>{fmt(po.total, po.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {po.notes && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Notes
            </h3>
            <p className="text-sm whitespace-pre-line">{po.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          <p>
            Generated by {companyName || "Dramac"} &bull; PO {po.poNumber}
          </p>
        </div>
      </div>
    );
  },
);
