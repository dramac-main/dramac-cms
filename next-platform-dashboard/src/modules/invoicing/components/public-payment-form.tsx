"use client";

/**
 * Public Payment Form Component — INVFIX-04
 *
 * Public-facing payment form with method-specific instructions
 * and manual payment submission.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Banknote,
  Smartphone,
  Wallet,
} from "lucide-react";
import { formatInvoiceAmount } from "../lib/invoicing-utils";

interface PublicPaymentFormProps {
  invoiceNumber: string;
  amountDue: number;
  currency: string;
  paymentInstructions?: string | null;
  bankTransferInstructions?: string | null;
  mobileMoneyInstructions?: string | null;
  onlinePaymentEnabled?: boolean;
  paymentToken: string;
  companyName?: string | null;
  companyLogo?: string | null;
  brandColor?: string | null;
}

export function PublicPaymentForm({
  invoiceNumber,
  amountDue,
  currency,
  paymentInstructions,
  bankTransferInstructions,
  mobileMoneyInstructions,
  onlinePaymentEnabled,
  paymentToken,
  companyName,
  companyLogo,
  brandColor,
}: PublicPaymentFormProps) {
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const effectiveBrand = brandColor || "#2563eb";

  // Get method-specific instructions
  const getMethodInstructions = () => {
    if (method === "bank_transfer" && bankTransferInstructions) {
      return bankTransferInstructions;
    }
    if (method === "mobile_money" && mobileMoneyInstructions) {
      return mobileMoneyInstructions;
    }
    return null;
  };

  const methodInstructions = getMethodInstructions();

  // Handle manual payment submission (bank transfer, mobile money, cash, cheque, other)
  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!reference.trim()) {
      setError("Please enter a payment reference or transaction ID.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/invoicing/pay/${paymentToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: method,
          transactionReference: reference.trim(),
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Payment submission failed");
      }

      setSuccessMessage(
        "Your payment notification has been received. It will be verified and applied shortly.",
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
        <Card className="mx-auto max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Payment Submitted</h2>
            <p className="text-sm text-muted-foreground">
              {successMessage ||
                `Your payment notification for invoice ${invoiceNumber} has been received.`}
            </p>
            {reference && (
              <p className="text-xs text-muted-foreground">
                Reference: {reference}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 justify-center">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName || "Company"}
              className="h-10 w-auto"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold"
              style={{ backgroundColor: effectiveBrand }}
            >
              <Building2 className="h-5 w-5" />
            </div>
          )}
          {companyName && (
            <span className="text-lg font-semibold">{companyName}</span>
          )}
        </div>

        {/* Amount Due Card */}
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-3xl font-bold mt-1">
              {formatInvoiceAmount(amountDue, currency)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Invoice {invoiceNumber}
            </p>
          </CardContent>
        </Card>

        {/* General Payment Instructions */}
        {paymentInstructions && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-lg p-4 text-sm whitespace-pre-line"
                style={{ backgroundColor: `${effectiveBrand}10` }}
              >
                {paymentInstructions}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment submission disabled notice */}
        {!onlinePaymentEnabled && (
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Online payment submission is not enabled for this invoice.
                Please follow the payment instructions above and contact the
                business directly to confirm your payment.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Manual Payment Form — only shown when online payment is enabled */}
        {onlinePaymentEnabled && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Confirm Your Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">
                      <span className="flex items-center gap-2">
                        <Banknote className="h-3.5 w-3.5" />
                        Bank Transfer
                      </span>
                    </SelectItem>
                    <SelectItem value="mobile_money">
                      <span className="flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5" />
                        Mobile Money
                      </span>
                    </SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Method-specific instructions */}
              {methodInstructions && (
                <div
                  className="rounded-lg p-4 text-sm whitespace-pre-line border"
                  style={{
                    backgroundColor: `${effectiveBrand}08`,
                    borderColor: `${effectiveBrand}20`,
                  }}
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {method === "bank_transfer"
                      ? "Bank Transfer Details"
                      : "Mobile Money Details"}
                  </p>
                  {methodInstructions}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reference">
                  Transaction Reference / Receipt Number *
                </Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. TXN123456789"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the reference number from your payment confirmation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information about the payment..."
                  rows={3}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Separator />

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
                style={{ backgroundColor: effectiveBrand }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Payment
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Your payment will be verified before being applied to the
                invoice.
              </p>
            </form>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
