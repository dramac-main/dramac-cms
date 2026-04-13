"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Expense, ExpenseCategory, ExpensePaymentMethod } from "../types/expense-types";
import {
  createExpense,
  updateExpense,
  getExpenseCategories,
} from "../actions/expense-actions";
import { ReceiptUpload } from "./receipt-upload";
import { ContactInvoicePicker } from "./contact-invoice-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PAYMENT_METHODS: { value: ExpensePaymentMethod; label: string }[] = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "petty_cash", label: "Petty Cash" },
  { value: "other", label: "Other" },
];

interface ExpenseFormProps {
  siteId: string;
  expense?: Expense;
  mode: "create" | "edit";
}

export function ExpenseForm({ siteId, expense, mode }: ExpenseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  // Form state
  const [description, setDescription] = useState(expense?.description || "");
  const [amount, setAmount] = useState(
    expense ? (expense.amount / 100).toFixed(2) : "",
  );
  const [currency, setCurrency] = useState(expense?.currency || "ZMW");
  const [date, setDate] = useState(
    expense?.date?.split("T")[0] ||
      new Date().toISOString().split("T")[0],
  );
  const [categoryId, setCategoryId] = useState(expense?.categoryId || "");
  const [paymentMethod, setPaymentMethod] = useState<string>(
    expense?.paymentMethod || "",
  );
  const [paymentReference, setPaymentReference] = useState(
    expense?.paymentReference || "",
  );
  const [receiptUrl, setReceiptUrl] = useState(expense?.receiptUrl || "");
  const [receiptFilename, setReceiptFilename] = useState(
    expense?.receiptFilename || "",
  );
  const [isBillable, setIsBillable] = useState(expense?.isBillable || false);
  const [contactId, setContactId] = useState(expense?.contactId || "");
  const [notes, setNotes] = useState(expense?.notes || "");
  const [tags, setTags] = useState(expense?.tags?.join(", ") || "");

  useEffect(() => {
    getExpenseCategories(siteId).then(setCategories).catch(() => {});
  }, [siteId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const input = {
      description: description.trim(),
      amount: amountCents,
      currency,
      date,
      categoryId: categoryId || null,
      paymentMethod: (paymentMethod || null) as ExpensePaymentMethod | null,
      paymentReference: paymentReference || null,
      receiptUrl: receiptUrl || null,
      receiptFilename: receiptFilename || null,
      isBillable,
      contactId: isBillable && contactId ? contactId : null,
      notes: notes || null,
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };

    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await createExpense(siteId, input);
          toast.success("Expense recorded");
          router.push(
            `/dashboard/sites/${siteId}/invoicing/expenses/${created.id}`,
          );
        } else {
          await updateExpense(expense!.id, input);
          toast.success("Expense updated");
          router.push(
            `/dashboard/sites/${siteId}/invoicing/expenses/${expense!.id}`,
          );
        }
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {mode === "create" ? "New Expense" : "Edit Expense"}
        </h2>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          {mode === "create" ? "Record Expense" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Description *</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was this expense for?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                      K
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            {cat.color && (
                              <span
                                className="h-2.5 w-2.5 rounded-full inline-block"
                                style={{ backgroundColor: cat.color }}
                              />
                            )}
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value}>
                          {pm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {paymentMethod && (
                <div>
                  <Label>Payment Reference</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Transaction ID, cheque number, etc."
                  />
                </div>
              )}

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Tags</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Comma-separated tags (e.g. office, supplies, Q1)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Receipt Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              <ReceiptUpload
                siteId={siteId}
                value={receiptUrl || null}
                filename={receiptFilename || null}
                onChange={(url: string | null, fname: string | null) => {
                  setReceiptUrl(url || "");
                  setReceiptFilename(fname || "");
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Billable */}
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="billable-toggle">Billable to Client</Label>
                <Switch
                  id="billable-toggle"
                  checked={isBillable}
                  onCheckedChange={setIsBillable}
                />
              </div>
              {isBillable && (
                <div>
                  <Label>Client</Label>
                  <ContactInvoicePicker
                    siteId={siteId}
                    value={contactId}
                    onSelect={(data) => setContactId(data.contactId)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Currency */}
          <Card>
            <CardHeader>
              <CardTitle>Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZMW">ZMW (Kwacha)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="ZAR">ZAR (South African Rand)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
