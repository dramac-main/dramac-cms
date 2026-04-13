"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getCreditNotes,
  applyCreditToInvoice,
} from "../actions/credit-actions";
import { CreditStatusBadge } from "./credit-status-badge";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { CreditNote } from "../types/credit-types";

interface CreditApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  invoiceId: string;
  contactId?: string | null;
  invoiceAmountDue: number;
  currency?: string;
  onApplied?: () => void;
}

export function CreditApplyDialog({
  open,
  onOpenChange,
  siteId,
  invoiceId,
  contactId,
  invoiceAmountDue,
  currency = "ZMW",
  onApplied,
}: CreditApplyDialogProps) {
  const [credits, setCredits] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      setSelectedCreditId(null);
      setAmount("");

      // Fetch available credits (issued or partially applied) for this contact
      getCreditNotes(siteId, {
        status: undefined,
        contactId: contactId || undefined,
      })
        .then((result) => {
          const available = result.creditNotes.filter(
            (cn) =>
              (cn.status === "issued" || cn.status === "partially_applied") &&
              cn.amountRemaining > 0,
          );
          setCredits(available);
        })
        .catch(() => setCredits([]))
        .finally(() => setLoading(false));
    }
  }, [open, siteId, contactId]);

  const selectedCredit = credits.find((c) => c.id === selectedCreditId);
  const maxAmount = selectedCredit
    ? Math.min(selectedCredit.amountRemaining, invoiceAmountDue)
    : 0;

  async function handleApply() {
    if (!selectedCreditId) return;
    const parsedAmount = Math.round(parseFloat(amount) * 100);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (parsedAmount > maxAmount) {
      toast.error(
        `Amount exceeds maximum of ${formatInvoiceAmount(maxAmount, currency)}`,
      );
      return;
    }

    setApplying(true);
    try {
      await applyCreditToInvoice(selectedCreditId, invoiceId, parsedAmount);
      toast.success("Credit applied successfully");
      onOpenChange(false);
      onApplied?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to apply credit");
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply Credit to Invoice</DialogTitle>
          <DialogDescription>
            Select an available credit note and enter the amount to apply.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : credits.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No available credits for this client.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Credit Note</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {credits.map((cn) => (
                  <button
                    key={cn.id}
                    type="button"
                    onClick={() => {
                      setSelectedCreditId(cn.id);
                      const max = Math.min(
                        cn.amountRemaining,
                        invoiceAmountDue,
                      );
                      setAmount((max / 100).toFixed(2));
                    }}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      selectedCreditId === cn.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">
                          {cn.creditNumber}
                        </span>
                        <span className="text-muted-foreground text-xs ml-2">
                          {cn.clientName}
                        </span>
                      </div>
                      <CreditStatusBadge status={cn.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Available:{" "}
                      {formatInvoiceAmount(cn.amountRemaining, cn.currency)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedCreditId && (
              <div className="space-y-2">
                <Label htmlFor="credit-amount">
                  Amount to Apply (max{" "}
                  {formatInvoiceAmount(maxAmount, currency)})
                </Label>
                <Input
                  id="credit-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(maxAmount / 100).toFixed(2)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!selectedCreditId || applying || !amount}
          >
            {applying ? "Applying..." : "Apply Credit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
