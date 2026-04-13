"use client";

import { useCallback } from "react";
import type { CreateInvoiceLineItemInput } from "../actions/invoice-actions";
import type { Item } from "../types";
import {
  calculateLineItemTotals,
  formatInvoiceAmount,
} from "../lib/invoicing-utils";
import { ItemPicker } from "./item-picker";
import { TaxRateSelector } from "./tax-rate-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, GripVertical, Plus } from "lucide-react";

interface InvoiceLineItemsProps {
  siteId: string;
  items: CreateInvoiceLineItemInput[];
  onChange: (items: CreateInvoiceLineItemInput[]) => void;
  currency?: string;
  disabled?: boolean;
}

function LineItemRow({
  item,
  index,
  siteId,
  currency,
  onChange,
  onRemove,
  disabled,
}: {
  item: CreateInvoiceLineItemInput;
  index: number;
  siteId: string;
  currency: string;
  onChange: (index: number, field: string, value: unknown) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  const totals = calculateLineItemTotals(
    item.quantity,
    item.unitPrice,
    item.discountType || null,
    item.discountValue || 0,
    item.taxRate || 0,
  );

  return (
    <div className="grid grid-cols-[auto_1fr_80px_100px_100px_80px_100px_auto] gap-2 items-start py-2 border-b border-border last:border-b-0">
      <div className="flex items-center pt-2">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      </div>

      <div className="space-y-1">
        <Input
          value={item.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
          placeholder="Item name"
          disabled={disabled}
          className="font-medium"
        />
        <Textarea
          value={item.description || ""}
          onChange={(e) => onChange(index, "description", e.target.value)}
          placeholder="Description (optional)"
          disabled={disabled}
          className="min-h-[32px] text-xs resize-none"
          rows={1}
        />
      </div>

      <Input
        type="number"
        value={item.quantity}
        onChange={(e) => onChange(index, "quantity", Number(e.target.value))}
        min={0}
        step={1}
        disabled={disabled}
        className="text-right"
      />

      <Input
        type="number"
        value={item.unitPrice / 100}
        onChange={(e) =>
          onChange(index, "unitPrice", Math.round(Number(e.target.value) * 100))
        }
        min={0}
        step={0.01}
        disabled={disabled}
        className="text-right"
      />

      <Input
        type="number"
        value={(item.discountValue || 0) / 100}
        onChange={(e) =>
          onChange(
            index,
            "discountValue",
            Math.round(Number(e.target.value) * 100),
          )
        }
        min={0}
        step={0.01}
        disabled={disabled}
        placeholder="0.00"
        className="text-right"
      />

      <div className="pt-1">
        <TaxRateSelector
          siteId={siteId}
          value={item.taxRateId}
          onChange={(id, rate) => {
            onChange(index, "taxRateId", id);
            onChange(index, "taxRate", rate);
          }}
          disabled={disabled}
        />
      </div>

      <div className="text-right pt-2 font-medium text-sm">
        {formatInvoiceAmount(totals.total, currency)}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        disabled={disabled}
        className="mt-1"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function InvoiceLineItems({
  siteId,
  items,
  onChange,
  currency = "ZMW",
  disabled,
}: InvoiceLineItemsProps) {
  const handleFieldChange = useCallback(
    (index: number, field: string, value: unknown) => {
      const updated = [...items];
      updated[index] = { ...updated[index], [field]: value };
      onChange(updated);
    },
    [items, onChange],
  );

  const handleRemove = useCallback(
    (index: number) => {
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange],
  );

  const handleAdd = useCallback(() => {
    onChange([
      ...items,
      {
        name: "",
        quantity: 1,
        unitPrice: 0,
        sortOrder: items.length,
      },
    ]);
  }, [items, onChange]);

  const handleItemPickerSelect = useCallback(
    (item: Item) => {
      onChange([
        ...items,
        {
          itemId: item.id,
          name: item.name,
          description: item.description,
          quantity: 1,
          unitPrice: item.unitPrice,
          unit: item.unit,
          taxRateId: item.taxRateId,
          sortOrder: items.length,
        },
      ]);
    },
    [items, onChange],
  );

  // Compute grand total from all line items
  const grandTotal = items.reduce((sum, item) => {
    const totals = calculateLineItemTotals(
      item.quantity,
      item.unitPrice,
      item.discountType || null,
      item.discountValue || 0,
      item.taxRate || 0,
    );
    return sum + totals.total;
  }, 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_80px_100px_100px_80px_100px_auto] gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
        <div />
        <div>Item</div>
        <div className="text-right">Qty</div>
        <div className="text-right">Price</div>
        <div className="text-right">Discount</div>
        <div>Tax</div>
        <div className="text-right">Total</div>
        <div />
      </div>

      {/* Line items */}
      {items.map((item, index) => (
        <LineItemRow
          key={index}
          item={item}
          index={index}
          siteId={siteId}
          currency={currency}
          onChange={handleFieldChange}
          onRemove={handleRemove}
          disabled={disabled}
        />
      ))}

      {/* Add buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
          className="gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Line
        </Button>
        <ItemPicker siteId={siteId} onSelect={handleItemPickerSelect} />
      </div>

      {/* Grand total */}
      <div className="flex justify-end pt-2 border-t">
        <div className="text-right">
          <span className="text-sm text-muted-foreground mr-3">
            Line Items Total:
          </span>
          <span className="text-lg font-bold">
            {formatInvoiceAmount(grandTotal, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
