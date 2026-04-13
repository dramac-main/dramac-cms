"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CreditNote } from "../types/credit-types";
import type { CreateCreditNoteLineItemInput } from "../types/credit-types";
import {
  createCreditNote,
  updateCreditNote,
} from "../actions/credit-actions";
import { ContactInvoicePicker } from "./contact-invoice-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatInvoiceAmount, calculateLineItemTotals } from "../lib/invoicing-utils";

interface CreditFormProps {
  siteId: string;
  creditNote?: CreditNote & { lineItems?: any[] };
  mode: "create" | "edit";
}

interface LineItemRow {
  itemId?: string | null;
  sortOrder: number;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number; // in major currency units for display
  taxRate: number;
  taxRateId?: string | null;
}

export function CreditForm({ siteId, creditNote, mode }: CreditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Client details
  const [contactId, setContactId] = useState(creditNote?.contactId || "");
  const [clientName, setClientName] = useState(creditNote?.clientName || "");
  const [clientEmail, setClientEmail] = useState(creditNote?.clientEmail || "");
  const [currency, setCurrency] = useState(creditNote?.currency || "ZMW");
  const [issueDate, setIssueDate] = useState(
    creditNote?.issueDate || new Date().toISOString().split("T")[0],
  );
  const [reason, setReason] = useState(creditNote?.reason || "");
  const [notes, setNotes] = useState(creditNote?.notes || "");
  const [internalNotes, setInternalNotes] = useState(
    creditNote?.internalNotes || "",
  );

  // Line items
  const [lineItems, setLineItems] = useState<LineItemRow[]>(() => {
    if (creditNote?.lineItems?.length) {
      return creditNote.lineItems.map((li: any) => ({
        itemId: li.itemId || li.item_id || null,
        sortOrder: li.sortOrder || li.sort_order || 0,
        name: li.name || "",
        description: li.description || "",
        quantity: li.quantity || 1,
        unit: li.unit || "",
        unitPrice: (li.unitPrice || li.unit_price || 0) / 100,
        taxRate: li.taxRate || li.tax_rate || 0,
        taxRateId: li.taxRateId || li.tax_rate_id || null,
      }));
    }
    return [
      {
        sortOrder: 0,
        name: "",
        description: "",
        quantity: 1,
        unit: "",
        unitPrice: 0,
        taxRate: 0,
      },
    ];
  });

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
  };

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      {
        sortOrder: prev.length,
        name: "",
        description: "",
        quantity: 1,
        unit: "",
        unitPrice: 0,
        taxRate: 0,
      },
    ]);
  }

  function removeLineItem(idx: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLineItem(idx: number, field: keyof LineItemRow, value: any) {
    setLineItems((prev) =>
      prev.map((li, i) => (i === idx ? { ...li, [field]: value } : li)),
    );
  }

  // Calculate totals for preview
  const computedItems = lineItems
    .filter((li) => li.name.trim())
    .map((li) => {
      const priceInCents = Math.round(li.unitPrice * 100);
      const { subtotal, taxAmount, total } = calculateLineItemTotals(
        li.quantity,
        priceInCents,
        null,
        0,
        li.taxRate,
      );
      return { ...li, subtotal, taxAmount, total, priceInCents };
    });
  const subtotalCents = computedItems.reduce((s, i) => s + i.subtotal, 0);
  const taxCents = computedItems.reduce((s, i) => s + i.taxAmount, 0);
  const totalCents = computedItems.reduce((s, i) => s + i.total, 0);

  function handleSubmit() {
    if (!clientName.trim()) {
      toast.error("Client name is required");
      return;
    }
    const validItems = lineItems.filter((li) => li.name.trim());
    if (validItems.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    const inputLineItems: CreateCreditNoteLineItemInput[] = validItems.map(
      (li, idx) => ({
        itemId: li.itemId || undefined,
        sortOrder: idx,
        name: li.name.trim(),
        description: li.description || undefined,
        quantity: li.quantity,
        unit: li.unit || undefined,
        unitPrice: Math.round(li.unitPrice * 100),
        taxRateId: li.taxRateId || undefined,
      }),
    );

    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await createCreditNote(siteId, {
            contactId: contactId || undefined,
            clientName: clientName.trim(),
            clientEmail: clientEmail || undefined,
            currency,
            issueDate,
            reason: reason || undefined,
            notes: notes || undefined,
            internalNotes: internalNotes || undefined,
            lineItems: inputLineItems,
          });
          toast.success(`Credit note ${created.creditNumber} created`);
          router.push(
            `/dashboard/sites/${siteId}/invoicing/credits/${created.id}`,
          );
        } else if (creditNote) {
          await updateCreditNote(creditNote.id, {
            contactId: contactId || undefined,
            clientName: clientName.trim(),
            clientEmail: clientEmail || undefined,
            currency,
            issueDate,
            reason: reason || undefined,
            notes: notes || undefined,
            internalNotes: internalNotes || undefined,
            lineItems: inputLineItems,
          });
          toast.success("Credit note updated");
          router.push(
            `/dashboard/sites/${siteId}/invoicing/credits/${creditNote.id}`,
          );
        }
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to save credit note");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cn-clientName">Client Name *</Label>
                <Input
                  id="cn-clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client or company name"
                />
              </div>
              <div>
                <Label htmlFor="cn-clientEmail">Client Email</Label>
                <Input
                  id="cn-clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Note Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credit Note Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cn-issueDate">Issue Date</Label>
                <Input
                  id="cn-issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cn-currency">Currency</Label>
                <Input
                  id="cn-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="ZMW"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cn-reason">Reason</Label>
              <Textarea
                id="cn-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for credit note (e.g., returned goods, pricing error)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineItems.map((li, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_80px_100px_80px_40px] gap-2 items-end"
              >
                <div>
                  {idx === 0 && (
                    <Label className="text-xs text-muted-foreground">
                      Name
                    </Label>
                  )}
                  <Input
                    value={li.name}
                    onChange={(e) =>
                      updateLineItem(idx, "name", e.target.value)
                    }
                    placeholder="Item name"
                  />
                </div>
                <div>
                  {idx === 0 && (
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                  )}
                  <Input
                    type="number"
                    min={1}
                    value={li.quantity}
                    onChange={(e) =>
                      updateLineItem(idx, "quantity", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  {idx === 0 && (
                    <Label className="text-xs text-muted-foreground">
                      Unit Price
                    </Label>
                  )}
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={li.unitPrice}
                    onChange={(e) =>
                      updateLineItem(
                        idx,
                        "unitPrice",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
                <div>
                  {idx === 0 && (
                    <Label className="text-xs text-muted-foreground">
                      Tax %
                    </Label>
                  )}
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={li.taxRate}
                    onChange={(e) =>
                      updateLineItem(
                        idx,
                        "taxRate",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLineItem(idx)}
                  disabled={lineItems.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addLineItem}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Line Item
            </Button>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cn-notes">Client-Facing Notes</Label>
              <Textarea
                id="cn-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="cn-internalNotes">Internal Notes</Label>
              <Textarea
                id="cn-internalNotes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            {mode === "create" ? "Create Credit Note" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Preview sidebar */}
      <div className="hidden xl:block">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatInvoiceAmount(subtotalCents, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatInvoiceAmount(taxCents, currency)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total</span>
              <span>{formatInvoiceAmount(totalCents, currency)}</span>
            </div>
            {computedItems.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Add line items to see totals
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
