"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StructuredPaymentMethodsEditor } from "@/components/payments/structured-payment-methods-editor";
import { renderPaymentMethods } from "@/lib/portal/payment-methods-render";
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

export function PaymentMethodsForm({ siteId, surface, initial }: Props) {
  const [value, setValue] = useState<string>(() =>
    initial.length > 0 ? renderPaymentMethods(initial) : "",
  );
  const [isPending, startTransition] = useTransition();

  const surfaceLabel = surface === "ecommerce" ? "store orders" : "bookings";

  function save() {
    // Re-parse from the rendered string so we send a clean array.
    const lines = value.split(/\n\n+/).filter(Boolean);
    const rows: PaymentMethodRow[] = lines.map((block) => {
      const [first, ...rest] = block.split("\n");
      const label = (first ?? "").replace(/^\s*\d+\.\s*/, "").trim();
      const details = rest.join("\n").trim();
      return { label, details };
    });

    if (rows.some((r) => !r.label)) {
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

  return (
    <div className="space-y-6 max-w-3xl">
      <StructuredPaymentMethodsEditor
        value={value}
        onChange={setValue}
        surfaceLabel={surfaceLabel}
      />

      <div className="flex justify-end">
        <Button onClick={save} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Saving…" : "Save payment methods"}
        </Button>
      </div>
    </div>
  );
}
