"use client";

import { useState } from "react";
import { recordPayment } from "../actions/payment-actions";
import { PaymentProofUpload } from "./payment-proof-upload";
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
import { DollarSign } from "lucide-react";

interface PaymentFormProps {
  invoiceId: string;
  amountDue: number;
  currency?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function PaymentForm({
  invoiceId,
  amountDue,
  currency = "ZMW",
  onSuccess,
  trigger,
}: PaymentFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("bank_transfer");
  const [paymentMethodDetail, setPaymentMethodDetail] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [notes, setNotes] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const resetForm = () => {
    setAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("bank_transfer");
    setPaymentMethodDetail("");
    setTransactionReference("");
    setNotes("");
    setProofUrl(null);
    setError(null);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Prefill amount with amount_due converted from cents to display
      setAmount((amountDue / 100).toFixed(2));
      resetForm();
      setAmount((amountDue / 100).toFixed(2));
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

      await recordPayment(invoiceId, {
        invoiceId,
        amount: amountInCents,
        currency,
        paymentDate,
        paymentMethod,
        paymentMethodDetail: paymentMethodDetail || null,
        transactionReference: transactionReference || null,
        notes: notes || null,
        proofUrl,
      });

      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <DollarSign className="h-4 w-4 mr-1.5" />
            Record Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Balance due:{" "}
              <AmountDisplay amount={amountDue} currency={currency} />
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </p>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            {/* Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
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

            {/* Method Detail */}
            <div className="space-y-2">
              <Label htmlFor="payment-detail">
                Method Detail{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="payment-detail"
                placeholder='e.g., "Airtel Money", "Zanaco", cheque #'
                value={paymentMethodDetail}
                onChange={(e) => setPaymentMethodDetail(e.target.value)}
              />
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="payment-ref">
                Transaction Reference{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="payment-ref"
                placeholder="Receipt / transaction number"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="payment-notes">
                Notes{" "}
                <span className="text-muted-foregrund font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="payment-notes"
                placeholder="Internal notes about this payment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Proof Upload */}
            <PaymentProofUpload value={proofUrl} onChange={setProofUrl} />
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
            <Button type="submit" disabled={saving}>
              {saving ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
