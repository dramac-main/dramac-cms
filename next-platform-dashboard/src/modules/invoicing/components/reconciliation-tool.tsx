"use client";

import { useState, useEffect } from "react";
import {
  getUnmatchedPayments,
  getPartialInvoices,
  getReconciliationSuggestions,
  matchPaymentToInvoice,
} from "../actions/reconciliation-actions";
import type {
  UnmatchedPayment,
  PartialInvoice,
  ReconciliationSuggestion,
} from "../actions/reconciliation-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { PAYMENT_METHOD_LABELS } from "../lib/invoicing-constants";
import { PaymentMethodIcon } from "./payment-method-icon";
import { AmountDisplay } from "./amount-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

interface ReconciliationToolProps {
  siteId: string;
}

export function ReconciliationTool({ siteId }: ReconciliationToolProps) {
  const [unmatched, setUnmatched] = useState<UnmatchedPayment[]>([]);
  const [partialInvoices, setPartialInvoices] = useState<PartialInvoice[]>([]);
  const [suggestions, setSuggestions] = useState<ReconciliationSuggestion[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  // Track selected invoice per payment for manual match
  const [selectedInvoices, setSelectedInvoices] = useState<
    Record<string, string>
  >({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, p, s] = await Promise.all([
        getUnmatchedPayments(siteId),
        getPartialInvoices(siteId),
        getReconciliationSuggestions(siteId),
      ]);
      setUnmatched(u);
      setPartialInvoices(p);
      setSuggestions(s);
    } catch {
      toast.error("Failed to load reconciliation data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [siteId]);

  const handleMatch = async (paymentId: string, invoiceId: string) => {
    setMatchingId(paymentId);
    try {
      const result = await matchPaymentToInvoice(siteId, paymentId, invoiceId);
      if (result.success) {
        toast.success("Payment reconciled successfully");
        await loadData();
      } else {
        toast.error(result.error || "Failed to reconcile");
      }
    } catch {
      toast.error("Failed to reconcile payment");
    } finally {
      setMatchingId(null);
    }
  };

  const handleApplySuggestion = async (
    suggestion: ReconciliationSuggestion,
  ) => {
    await handleMatch(suggestion.paymentId, suggestion.suggestedInvoiceId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const getSuggestionForPayment = (paymentId: string) =>
    suggestions.find((s) => s.paymentId === paymentId);

  const confidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Medium
          </Badge>
        );
      default:
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Low
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Payment Reconciliation</h2>
          <p className="text-sm text-muted-foreground">
            Match unverified payments to invoices and resolve discrepancies.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{unmatched.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partial Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">
                {partialInvoices.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Smart Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{suggestions.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              Smart Match Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((s) => (
                <div
                  key={`${s.paymentId}-${s.suggestedInvoiceId}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        {s.paymentNumber || "Payment"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <AmountDisplay
                          amount={s.paymentAmount}
                          currency={s.currency}
                        />
                      </p>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div>
                      <p className="text-sm font-medium">
                        {s.suggestedInvoiceNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due:{" "}
                        <AmountDisplay
                          amount={s.invoiceAmountDue}
                          currency={s.currency}
                        />
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {confidenceBadge(s.confidence)}
                      <span className="text-xs text-muted-foreground">
                        {s.reason}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApplySuggestion(s)}
                    disabled={matchingId === s.paymentId}
                  >
                    {matchingId === s.paymentId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                    )}
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unmatched Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Pending Payments ({unmatched.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unmatched.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="mx-auto h-8 w-8 opacity-50 mb-2" />
              <p>All payments have been reconciled.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Current Invoice</TableHead>
                    <TableHead>Match To</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unmatched.map((p) => {
                    const suggestion = getSuggestionForPayment(p.id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {p.paymentNumber || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {p.paymentDate}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <AmountDisplay
                            amount={p.amount}
                            currency={p.currency}
                          />
                        </TableCell>
                        <TableCell>
                          <PaymentMethodIcon
                            method={p.paymentMethod as any}
                            className="text-xs"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.transactionReference || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.invoiceNumber || "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={selectedInvoices[p.id] || ""}
                            onValueChange={(v) =>
                              setSelectedInvoices((prev) => ({
                                ...prev,
                                [p.id]: v,
                              }))
                            }
                          >
                            <SelectTrigger className="w-[200px] text-xs">
                              <SelectValue placeholder="Select invoice…" />
                            </SelectTrigger>
                            <SelectContent>
                              {partialInvoices.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                  {inv.invoiceNumber} — {inv.clientName} (
                                  {formatInvoiceAmount(
                                    inv.amountDue,
                                    inv.currency,
                                  )}
                                  )
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {suggestion && !selectedInvoices[p.id] && (
                            <p className="text-xs text-blue-600 mt-1">
                              💡 Suggested: {suggestion.suggestedInvoiceNumber}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              !selectedInvoices[p.id] || matchingId === p.id
                            }
                            onClick={() =>
                              handleMatch(p.id, selectedInvoices[p.id])
                            }
                          >
                            {matchingId === p.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Match"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partial Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Invoices with Outstanding Balances ({partialInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partialInvoices.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">
              No invoices with outstanding balances.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partialInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-sm">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {inv.clientName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AmountDisplay
                          amount={inv.total}
                          currency={inv.currency}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <AmountDisplay
                          amount={inv.amountPaid}
                          currency={inv.currency}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <AmountDisplay
                          amount={inv.amountDue}
                          currency={inv.currency}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {inv.dueDate || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
