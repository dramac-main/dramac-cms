"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2, Bell } from "lucide-react";
import { FrequencySelector } from "./frequency-selector";
import { RecurringSchedulePreview } from "./recurring-schedule-preview";
import {
  createRecurringInvoice,
  updateRecurringInvoice,
} from "../actions/recurring-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type {
  RecurringInvoice,
  RecurringFrequency,
  CreateRecurringInput,
  CreateRecurringLineItemInput,
} from "../types/recurring-types";

interface RecurringFormProps {
  siteId: string;
  existing?: RecurringInvoice & { lineItems?: any[] };
}

interface LineItemRow {
  key: string;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

function newLineItem(): LineItemRow {
  return {
    key: crypto.randomUUID(),
    name: "",
    description: "",
    quantity: "1",
    unit: "",
    unitPrice: "",
  };
}

export function RecurringForm({ siteId, existing }: RecurringFormProps) {
  const router = useRouter();
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name || "");
  const [clientName, setClientName] = useState(
    existing?.clientName || (existing as any)?.client_name || "",
  );
  const [clientEmail, setClientEmail] = useState(
    existing?.clientEmail || (existing as any)?.client_email || "",
  );
  const [clientAddress, setClientAddress] = useState(
    existing?.clientAddress || (existing as any)?.client_address || "",
  );
  const [frequency, setFrequency] = useState<RecurringFrequency>(
    (existing?.frequency as RecurringFrequency) || "monthly",
  );
  const [customIntervalDays, setCustomIntervalDays] = useState<number | null>(
    existing?.customIntervalDays ??
      (existing as any)?.custom_interval_days ??
      null,
  );
  const [startDate, setStartDate] = useState(
    existing?.startDate ||
      (existing as any)?.start_date ||
      new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    existing?.endDate || (existing as any)?.end_date || "",
  );
  const [maxOccurrences, setMaxOccurrences] = useState(
    String(
      existing?.maxOccurrences ?? (existing as any)?.max_occurrences ?? "",
    ),
  );
  const [autoSend, setAutoSend] = useState(
    existing?.autoSend ?? (existing as any)?.auto_send ?? true,
  );
  const [notifyBeforeGeneration, setNotifyBeforeGeneration] = useState(
    (existing as any)?.notifyBeforeGeneration ??
      (existing as any)?.notify_before_generation ??
      false,
  );
  const [paymentTermsDays, setPaymentTermsDays] = useState(
    String(
      existing?.paymentTermsDays ?? (existing as any)?.payment_terms_days ?? 30,
    ),
  );
  const [notes, setNotes] = useState(existing?.notes || "");
  const [terms, setTerms] = useState(existing?.terms || "");

  const [lineItems, setLineItems] = useState<LineItemRow[]>(() => {
    if (existing?.lineItems && existing.lineItems.length > 0) {
      return existing.lineItems.map((li: any) => ({
        key: li.id || crypto.randomUUID(),
        name: li.name || "",
        description: li.description || "",
        quantity: String(li.quantity || 1),
        unit: li.unit || "",
        unitPrice: String((li.unitPrice || li.unit_price || 0) / 100),
      }));
    }
    return [newLineItem()];
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateLineItem = (
    index: number,
    field: keyof LineItemRow,
    value: string,
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + Math.round(qty * price * 100);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const items: CreateRecurringLineItemInput[] = lineItems
        .filter((li) => li.name.trim())
        .map((li, idx) => ({
          sortOrder: idx,
          name: li.name.trim(),
          description: li.description.trim() || undefined,
          quantity: parseFloat(li.quantity) || 1,
          unit: li.unit.trim() || undefined,
          unitPrice: Math.round((parseFloat(li.unitPrice) || 0) * 100),
        }));

      if (items.length === 0) {
        setError("At least one line item is required.");
        setSaving(false);
        return;
      }

      const input: CreateRecurringInput = {
        name: name.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        frequency,
        customIntervalDays:
          frequency === "custom" ? customIntervalDays : undefined,
        startDate,
        endDate: endDate || undefined,
        maxOccurrences: maxOccurrences
          ? parseInt(maxOccurrences, 10)
          : undefined,
        autoSend,
        notifyBeforeGeneration,
        paymentTermsDays: parseInt(paymentTermsDays, 10) || 30,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        lineItems: items,
      };

      if (isEdit && existing) {
        await updateRecurringInvoice(existing.id, input);
        router.push(
          `/dashboard/sites/${siteId}/invoicing/recurring/${existing.id}`,
        );
      } else {
        const created = await createRecurringInvoice(siteId, input);
        router.push(
          `/dashboard/sites/${siteId}/invoicing/recurring/${created.id}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {isEdit ? "Edit Recurring Invoice" : "New Recurring Invoice"}
        </h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Template Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Template Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Monthly Web Hosting"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Client Email</Label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Client Address</Label>
              <Input
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Address"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FrequencySelector
              frequency={frequency}
              customIntervalDays={customIntervalDays}
              onFrequencyChange={setFrequency}
              onCustomIntervalChange={setCustomIntervalDays}
            />
            <div className="space-y-1.5">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for indefinite.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Max Occurrences</Label>
              <Input
                type="number"
                min={1}
                value={maxOccurrences}
                onChange={(e) => setMaxOccurrences(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Terms (days)</Label>
              <Input
                type="number"
                min={0}
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch checked={autoSend} onCheckedChange={setAutoSend} />
              <Label>Auto-send generated invoices</Label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={notifyBeforeGeneration}
                onCheckedChange={setNotifyBeforeGeneration}
              />
              <div className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                <Label>Notify me before each generation</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Preview */}
      {startDate && frequency && (
        <RecurringSchedulePreview
          frequency={frequency}
          customIntervalDays={customIntervalDays}
          startDate={startDate}
          endDate={endDate || undefined}
          maxOccurrences={maxOccurrences ? parseInt(maxOccurrences, 10) : null}
          amount={calculateTotal()}
          currency="ZMW"
          count={12}
        />
      )}

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLineItems((prev) => [...prev, newLineItem()])}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lineItems.map((item, idx) => (
            <div key={item.key} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4 space-y-1">
                {idx === 0 && <Label className="text-xs">Name</Label>}
                <Input
                  value={item.name}
                  onChange={(e) => updateLineItem(idx, "name", e.target.value)}
                  placeholder="Item name"
                />
              </div>
              <div className="col-span-2 space-y-1">
                {idx === 0 && <Label className="text-xs">Qty</Label>}
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={item.quantity}
                  onChange={(e) =>
                    updateLineItem(idx, "quantity", e.target.value)
                  }
                />
              </div>
              <div className="col-span-2 space-y-1">
                {idx === 0 && <Label className="text-xs">Unit</Label>}
                <Input
                  value={item.unit}
                  onChange={(e) => updateLineItem(idx, "unit", e.target.value)}
                  placeholder="ea"
                />
              </div>
              <div className="col-span-3 space-y-1">
                {idx === 0 && <Label className="text-xs">Unit Price</Label>}
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateLineItem(idx, "unitPrice", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={lineItems.length <= 1}
                  onClick={() => removeLineItem(idx)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
          <Separator />
          <div className="flex justify-end text-sm">
            <span className="font-medium">
              Estimated Total:{" "}
              <span className="font-mono">
                {formatInvoiceAmount(calculateTotal(), "ZMW")}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes to appear on generated invoices..."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Terms</Label>
            <Textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Payment terms..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
