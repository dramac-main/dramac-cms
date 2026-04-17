"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  CreateInvoiceInput,
  CreateInvoiceLineItemInput,
} from "../actions/invoice-actions";
import type { Invoice } from "../types";
import { createInvoice, updateInvoice } from "../actions/invoice-actions";
import { getInvoicingSettings } from "../actions/settings-actions";
import { ContactInvoicePicker } from "./contact-invoice-picker";
import { InvoiceLineItems } from "./invoice-line-items";
import { InvoicePreview } from "./invoice-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Save, Loader2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { CurrencySelector } from "./currency-selector";

interface InvoiceFormProps {
  siteId: string;
  invoice?: Invoice & { lineItems?: any[] };
  mode: "create" | "edit";
}

export function InvoiceForm({ siteId, invoice, mode }: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showClientFields, setShowClientFields] = useState(!invoice?.contactId);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // Form state
  const [contactId, setContactId] = useState(invoice?.contactId || "");
  const [clientName, setClientName] = useState(invoice?.clientName || "");
  const [clientEmail, setClientEmail] = useState(invoice?.clientEmail || "");
  const [clientPhone, setClientPhone] = useState(invoice?.clientPhone || "");
  const [clientAddress, setClientAddress] = useState(
    invoice?.clientAddress || "",
  );
  const [clientTaxId, setClientTaxId] = useState(invoice?.clientTaxId || "");
  const [currency, setCurrency] = useState(invoice?.currency || "ZMW");
  const [issueDate, setIssueDate] = useState(
    invoice?.issueDate || new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState(() => {
    if (invoice?.dueDate) return invoice.dueDate;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [paymentTerms, setPaymentTerms] = useState(
    invoice?.paymentTerms || "Net 30",
  );
  const [discountType, setDiscountType] = useState(invoice?.discountType || "");
  const [discountValue, setDiscountValue] = useState(
    invoice?.discountValue ? invoice.discountValue / 100 : 0,
  );
  const [notes, setNotes] = useState(invoice?.notes || "");
  const [terms, setTerms] = useState(invoice?.terms || "");
  const [internalNotes, setInternalNotes] = useState(
    invoice?.internalNotes || "",
  );
  const [footer, setFooter] = useState(invoice?.footer || "");
  const [reference, setReference] = useState(invoice?.reference || "");

  // Auto-populate defaults from settings on create
  useEffect(() => {
    if (mode !== "create") return;
    getInvoicingSettings(siteId).then((s) => {
      if (!s) return;
      if (!terms && s.defaultTerms) setTerms(s.defaultTerms);
      if (!notes && s.defaultNotes) setNotes(s.defaultNotes);
      if (s.defaultCurrency && currency === "ZMW") setCurrency(s.defaultCurrency);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, mode]);

  // Payment terms → auto-calc due date
  const calcDueDate = useCallback((fromDate: string, termsLabel: string) => {
    const daysMap: Record<string, number> = {
      "Due on Receipt": 0,
      "Net 7": 7,
      "Net 14": 14,
      "Net 30": 30,
      "Net 60": 60,
      "Net 90": 90,
    };
    const days = daysMap[termsLabel];
    if (days === undefined) return;
    const d = new Date(fromDate);
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split("T")[0]);
  }, []);

  const handlePaymentTermsChange = (value: string) => {
    setPaymentTerms(value);
    calcDueDate(issueDate, value);
  };

  const handleIssueDateChange = (value: string) => {
    setIssueDate(value);
    calcDueDate(value, paymentTerms);
  };

  // Line items
  const [lineItems, setLineItems] = useState<CreateInvoiceLineItemInput[]>(
    invoice?.lineItems?.map((li: any) => ({
      itemId: li.itemId || li.item_id,
      sortOrder: li.sortOrder || li.sort_order,
      name: li.name,
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,
      unitPrice: li.unitPrice || li.unit_price,
      discountType: li.discountType || li.discount_type,
      discountValue: li.discountValue || li.discount_value,
      taxRateId: li.taxRateId || li.tax_rate_id,
      taxRate: li.taxRate || li.tax_rate,
    })) || [{ name: "", quantity: 1, unitPrice: 0, sortOrder: 0 }],
  );

  const handleContactSelect = (data: {
    contactId: string;
    clientName: string;
    clientEmail: string | null;
    clientPhone: string | null;
    clientAddress: string | null;
  }) => {
    setContactId(data.contactId);
    setClientName(data.clientName);
    setClientEmail(data.clientEmail || "");
    setClientPhone(data.clientPhone || "");
    setClientAddress(data.clientAddress || "");
  };

  const handleSubmit = () => {
    if (!clientName.trim()) {
      toast.error("Client name is required");
      return;
    }
    if (lineItems.length === 0 || !lineItems.some((li) => li.name.trim())) {
      toast.error("At least one line item is required");
      return;
    }

    const input: CreateInvoiceInput = {
      contactId: contactId || undefined,
      clientName: clientName.trim(),
      clientEmail: clientEmail || undefined,
      clientPhone: clientPhone || undefined,
      clientAddress: clientAddress || undefined,
      clientTaxId: clientTaxId || undefined,
      currency,
      issueDate,
      dueDate,
      paymentTerms: paymentTerms || undefined,
      discountType: discountType
        ? (discountType as "percentage" | "fixed")
        : undefined,
      discountValue: discountType ? Math.round(discountValue * 100) : 0,
      notes: notes || undefined,
      terms: terms || undefined,
      internalNotes: internalNotes || undefined,
      footer: footer || undefined,
      reference: reference || undefined,
      lineItems: lineItems.filter((li) => li.name.trim()),
    };

    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await createInvoice(siteId, input);
          toast.success(`Invoice ${created.invoiceNumber || "created"} saved`);
          router.push(
            `/dashboard/sites/${siteId}/invoicing/invoices/${created.id}`,
          );
        } else if (invoice) {
          await updateInvoice(invoice.id, input);
          toast.success("Invoice updated");
          router.push(
            `/dashboard/sites/${siteId}/invoicing/invoices/${invoice.id}`,
          );
        }
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to save invoice");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6">
      {/* Form */}
      <div className="space-y-6">
        {/* Client Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select from CRM</Label>
              <ContactInvoicePicker
                siteId={siteId}
                value={contactId}
                onSelect={handleContactSelect}
              />
            </div>

            {/* Summary card when contact is selected */}
            {contactId && clientName && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {[clientEmail, clientPhone].filter(Boolean).join(" · ") || "No contact details"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClientFields(!showClientFields)}
                  >
                    {showClientFields ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Editable fields — always shown if no contact, collapsible if contact selected */}
            {(showClientFields || !contactId) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Client or company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Phone</Label>
                    <Input
                      id="clientPhone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+260..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientTaxId">Tax ID</Label>
                    <Input
                      id="clientTaxId"
                      value={clientTaxId}
                      onChange={(e) => setClientTaxId(e.target.value)}
                      placeholder="TPIN"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="clientAddress">Address</Label>
                  <Textarea
                    id="clientAddress"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Client address"
                    rows={2}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => handleIssueDateChange(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={handlePaymentTermsChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Due on Receipt">
                      Due on Receipt
                    </SelectItem>
                    <SelectItem value="Net 7">Net 7</SelectItem>
                    <SelectItem value="Net 14">Net 14</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Net 90">Net 90</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <CurrencySelector
                  value={currency}
                  onValueChange={setCurrency}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="reference">Reference / PO Number</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional reference"
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceLineItems
              siteId={siteId}
              items={lineItems}
              onChange={setLineItems}
              currency={currency}
            />
          </CardContent>
        </Card>

        {/* Invoice-level discount */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Discount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <Select
                  value={discountType || "none"}
                  onValueChange={(v) => setDiscountType(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Discount</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {discountType && (
                <div>
                  <Label>
                    {discountType === "percentage" ? "Percentage" : "Amount"}
                  </Label>
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    min={0}
                    step={discountType === "percentage" ? 1 : 0.01}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes & Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes & Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="notes">
              <TabsList className="mb-3">
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="terms">Terms</TabsTrigger>
                <TabsTrigger value="internal">Internal Notes</TabsTrigger>
                <TabsTrigger value="footer">Footer</TabsTrigger>
              </TabsList>
              <TabsContent value="notes">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes visible on the invoice (e.g., thank you message)"
                  rows={3}
                />
              </TabsContent>
              <TabsContent value="terms">
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Payment terms & conditions"
                  rows={3}
                />
              </TabsContent>
              <TabsContent value="internal">
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Internal notes (not visible on invoice)"
                  rows={3}
                />
              </TabsContent>
              <TabsContent value="footer">
                <Textarea
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  placeholder="Footer text for the invoice PDF"
                  rows={2}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end gap-3 pb-10">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === "create" ? "Create Invoice" : "Update Invoice"}
          </Button>
        </div>
      </div>

      {/* Live Preview — desktop */}
      <div className="hidden md:block">
        <div className="sticky top-20">
          <InvoicePreview
            clientName={clientName}
            clientEmail={clientEmail}
            clientAddress={clientAddress}
            issueDate={issueDate}
            dueDate={dueDate}
            currency={currency}
            lineItems={lineItems}
            discountType={
              discountType ? (discountType as "percentage" | "fixed") : null
            }
            discountValue={discountType ? Math.round(discountValue * 100) : 0}
            notes={notes}
          />
        </div>
      </div>

      {/* Floating preview button — mobile */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <Dialog open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg h-14 w-14">
              <Eye className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            <InvoicePreview
              clientName={clientName}
              clientEmail={clientEmail}
              clientAddress={clientAddress}
              issueDate={issueDate}
              dueDate={dueDate}
              currency={currency}
              lineItems={lineItems}
              discountType={
                discountType ? (discountType as "percentage" | "fixed") : null
              }
              discountValue={discountType ? Math.round(discountValue * 100) : 0}
              notes={notes}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
