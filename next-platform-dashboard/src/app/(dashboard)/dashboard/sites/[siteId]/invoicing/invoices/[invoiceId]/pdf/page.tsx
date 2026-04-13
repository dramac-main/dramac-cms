/**
 * Invoice PDF Preview Page — INV-02
 *
 * Renders the invoice in a print-ready A4 template.
 * User can print or save as PDF via browser print dialog.
 */
"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import type {
  InvoiceWithItems,
  InvoicingSettings,
} from "@/modules/invoicing/types";
import { getInvoice } from "@/modules/invoicing/actions/invoice-actions";
import { getInvoicingSettings } from "@/modules/invoicing/actions/settings-actions";
import { InvoicePdfTemplate } from "@/modules/invoicing/components/invoice-pdf-template";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer } from "lucide-react";

interface PdfPageProps {
  params: Promise<{ siteId: string; invoiceId: string }>;
}

export default function PdfPage({ params }: PdfPageProps) {
  const { siteId, invoiceId } = use(params);
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [settings, setSettings] = useState<InvoicingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getInvoice(invoiceId), getInvoicingSettings(siteId)])
      .then(([inv, sett]) => {
        setInvoice(inv);
        setSettings(sett);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [invoiceId, siteId]);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-[800px] max-w-[210mm] mx-auto" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar — hidden in print */}
      <div className="print:hidden border-b bg-background sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Invoice template */}
      <div className="py-8 print:py-0">
        <InvoicePdfTemplate
          ref={printRef}
          invoice={invoice}
          settings={settings}
        />
      </div>
    </div>
  );
}
