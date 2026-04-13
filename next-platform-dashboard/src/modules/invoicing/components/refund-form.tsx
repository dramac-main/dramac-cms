"use client";

import { useState } from "react";
import {
  recordRefund,
  type CreateRefundInput,
} from "../actions/payment-actions";
import { AmountDisplay } from "./amount-display";
import { PAYMENT_METHOD_LABELS } from "../lib/invoicing-constants";
import type { PaymentMethod } from "../types/payment-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Undo2 } from "lucide-react";

interface RefundFormProps {
  invoiceId: string;
  amountPaid: number;
  currency?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function RefundForm({
  invoiceId,
  amountPaid,
  currency = "ZMW",
  onSuccess,
  trigger,
}: RefundFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("bank_transfer");
  const [transactionReference, setTransactionReference] = useState("");
  const [notes, setNotes] = useState("");

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setAmount("");
      setReason("");
      setPaymentMethod("bank_transfer");
      setTransactionReference("");
      setNotes("");
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      if (isNaN(amountInCents) || amountInCents <= 0) {
        throw new Error("Enter a valid amount");
      }

      await recordRefund(invoiceId, {
        amount: amountInCents,
        paymentMethod,
        reason: reason || undefined,
        transactionReference: transactionReference || null,
        notes: notes || null,
      });

      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record refund");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Undo2 className="h-4 w-4 mr-1.5" />
            Record Refund
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Refund</DialogTitle>
            <DialogDescription>
              Total paid:{" "}
              <AmountDisplay amount={amountPaid} currency={currency} />
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={(amountPaid / 100).toFixed(2)}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund-reason">Reason</Label>
              <Textarea
                id="refund-reason"
                placeholder="Reason for refund"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Refund Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund-ref">
                Transaction Reference{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="refund-ref"
                placeholder="Receipt / transaction number"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund-notes">
                Notes{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="refund-notes"
                placeholder="Internal notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={saving}>
              {saving ? "Processing..." : "Record Refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
