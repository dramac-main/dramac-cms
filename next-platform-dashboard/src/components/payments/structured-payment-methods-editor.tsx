"use client";

/**
 * StructuredPaymentMethodsEditor — controlled UI for editing manual payment
 * methods as a list of {label, details} rows.
 *
 * Renders to the same numbered free-text format that
 * `parsePaymentMethods()` (modules/live-chat/lib/payment-method-parser.ts)
 * understands, so Chiko can show each method as a button in chat.
 *
 * Usage:
 *   const [text, setText] = useState(initialFreeText);
 *   <StructuredPaymentMethodsEditor value={text} onChange={setText} />
 *
 * The component takes free-text payment instructions and renders them
 * as a structured editor. On every edit it serialises back to the
 * numbered format and calls onChange. Pre-existing free-text that
 * cannot be parsed is preserved as a single "Payment Instructions" row.
 */

import { useMemo } from "react";
import { Plus, Trash2, GripVertical, CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parsePaymentMethods } from "@/modules/live-chat/lib/payment-method-parser";
import {
  renderPaymentMethods,
  type PaymentMethodRow,
} from "@/lib/portal/payment-methods-render";

export interface StructuredPaymentMethodsEditorProps {
  /** The free-text representation (numbered list format). */
  value: string;
  /** Called whenever the structured rows change with the new free-text. */
  onChange: (value: string) => void;
  /** Optional surface label used in helper copy. */
  surfaceLabel?: string;
  /** Hide the outer Card; useful when embedded in an existing card. */
  unstyled?: boolean;
}

const PRESETS: PaymentMethodRow[] = [
  {
    label: "Airtel Money",
    details:
      "Send to: 097XXXXXXX\nAccount Name: Your Business Name\nReference: Use your order/booking number.",
  },
  {
    label: "MTN Mobile Money",
    details:
      "Send to: 096XXXXXXX\nAccount Name: Your Business Name\nReference: Use your order/booking number.",
  },
  {
    label: "Zamtel Money",
    details:
      "Send to: 095XXXXXXX\nAccount Name: Your Business Name\nReference: Use your order/booking number.",
  },
  {
    label: "Bank Transfer",
    details:
      "Bank: [Your Bank Name]\nAccount Name: Your Business Name\nAccount Number: 1234567890\nBranch: [Branch Name]\nSwift: [Swift Code]\nReference: Use your order/booking number.",
  },
];

function parseValue(value: string): PaymentMethodRow[] {
  if (!value || !value.trim()) return [];
  const parsed = parsePaymentMethods(value);
  if (parsed && parsed.length > 0) {
    return parsed.map((m) => ({ label: m.label, details: m.details }));
  }
  // Single unparseable block — preserve as one row so the user can split it manually.
  return [{ label: "Payment Instructions", details: value.trim() }];
}

export function StructuredPaymentMethodsEditor({
  value,
  onChange,
  surfaceLabel = "this site",
  unstyled = false,
}: StructuredPaymentMethodsEditorProps) {
  const rows = useMemo(() => parseValue(value), [value]);

  function emit(next: PaymentMethodRow[]) {
    onChange(renderPaymentMethods(next));
  }

  function updateRow(idx: number, patch: Partial<PaymentMethodRow>) {
    emit(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addRow(preset?: PaymentMethodRow) {
    emit([...rows, preset ?? { label: "", details: "" }]);
  }

  function removeRow(idx: number) {
    emit(rows.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...rows];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap]!, next[idx]!];
    emit(next);
  }

  const body = (
    <div className="space-y-4">
      {rows.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No payment methods yet. Add your first one below — try a preset to get
          started.
        </div>
      )}

      {rows.map((row, idx) => (
        <div key={idx} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {idx + 1}
            </Badge>
            <div className="flex-1" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              title="Move up"
            >
              <GripVertical className="h-4 w-4 rotate-90" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => move(idx, 1)}
              disabled={idx === rows.length - 1}
              title="Move down"
            >
              <GripVertical className="h-4 w-4 -rotate-90" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(idx)}
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`pm-label-${idx}`}>Method name</Label>
            <Input
              id={`pm-label-${idx}`}
              value={row.label}
              onChange={(e) => updateRow(idx, { label: e.target.value })}
              placeholder="e.g. Airtel Money, MTN MoMo, Bank Transfer"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              This is the exact label customers see on the button in chat.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`pm-details-${idx}`}>
              Payment details / instructions
            </Label>
            <Textarea
              id={`pm-details-${idx}`}
              value={row.details}
              onChange={(e) => updateRow(idx, { details: e.target.value })}
              placeholder={`Send to: 097XXXXXXX\nAccount Name: Your Business\nReference: Use your order/booking number`}
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addRow()}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add blank method
        </Button>
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addRow(preset)}
            disabled={rows.some(
              (r) =>
                r.label.trim().toLowerCase() === preset.label.toLowerCase(),
            )}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );

  if (unstyled) return body;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Manual payment methods
        </CardTitle>
        <CardDescription>
          Add the payment options customers can use on {surfaceLabel}. Chiko
          presents these as buttons in chat — when a customer picks one, Chiko
          sends just that method&apos;s details with their order or booking
          number as the reference.
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
