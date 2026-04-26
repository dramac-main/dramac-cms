"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, GripVertical, CreditCard } from "lucide-react";
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
import { toast } from "sonner";
import {
  updatePaymentMethods,
  type PaymentMethodRow,
  type PaymentSurface,
} from "@/lib/portal/actions/payment-methods-actions";

interface Props {
  siteId: string;
  surface: PaymentSurface;
  initial: PaymentMethodRow[];
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
    label: "Zanaco Bank Transfer",
    details:
      "Bank: Zambia National Commercial Bank\nAccount Name: Your Business Name\nAccount Number: 1234567890\nBranch: Cairo Road, Lusaka\nSwift: ZNCOZMLU\nReference: Use your order/booking number.",
  },
];

export function PaymentMethodsForm({ siteId, surface, initial }: Props) {
  const [rows, setRows] = useState<PaymentMethodRow[]>(
    initial.length > 0 ? initial : [],
  );
  const [isPending, startTransition] = useTransition();

  function updateRow(idx: number, patch: Partial<PaymentMethodRow>) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );
  }

  function addRow(preset?: PaymentMethodRow) {
    setRows((prev) => [...prev, preset ?? { label: "", details: "" }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    setRows((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap]!, next[idx]!];
      return next;
    });
  }

  function save() {
    const empty = rows.find((r) => !r.label.trim());
    if (empty) {
      toast.error("Every payment method needs a label.");
      return;
    }
    startTransition(async () => {
      const result = await updatePaymentMethods(siteId, surface, rows);
      if (result.ok) {
        toast.success("Payment methods saved.");
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    });
  }

  const surfaceLabel = surface === "ecommerce" ? "store orders" : "bookings";

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manual payment methods
          </CardTitle>
          <CardDescription>
            Add the payment options customers can use to pay for {surfaceLabel}.
            Chiko presents these as buttons in chat — when a customer picks one,
            Chiko sends just that method&apos;s details with their order or
            booking number as the reference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No payment methods yet. Add your first one below — try a preset
              to get started.
            </div>
          )}

          {rows.map((row, idx) => (
            <div
              key={idx}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
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
                <Label htmlFor={`label-${idx}`}>Method name</Label>
                <Input
                  id={`label-${idx}`}
                  value={row.label}
                  onChange={(e) =>
                    updateRow(idx, { label: e.target.value })
                  }
                  placeholder="e.g. Airtel Money, MTN MoMo, Zanaco Bank"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  This is the exact label customers will see on the button in
                  chat.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`details-${idx}`}>
                  Payment details / instructions
                </Label>
                <Textarea
                  id={`details-${idx}`}
                  value={row.details}
                  onChange={(e) =>
                    updateRow(idx, { details: e.target.value })
                  }
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
                    r.label.trim().toLowerCase() ===
                    preset.label.toLowerCase(),
                )}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {preset.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Saving…" : "Save payment methods"}
        </Button>
      </div>
    </div>
  );
}
