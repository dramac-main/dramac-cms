"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Bill, BillLineItem, Vendor, CreateBillInput } from "../types";
import { getBill, createBill, updateBill } from "../actions/bill-actions";
import { getVendors } from "../actions/vendor-actions";
import { AmountDisplay } from "./amount-display";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface BillFormProps {
  siteId: string;
  billId?: string; // edit mode
}

interface LineItemRow {
  description: string;
  quantity: number;
  unitPrice: number; // display dollars
  taxRate: number;
}

function emptyLine(): LineItemRow {
  return {
    description: "",
    quantity: 1,
    unitPrice: 0,
    taxRate: 16,
  };
}

export function BillForm({ siteId, billId }: BillFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(!!billId);

  // Vendors
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Form
  const [vendorId, setVendorId] = useState(searchParams.get("vendorId") || "");
  const [vendorBillReference, setVendorBillReference] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("ZMW");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItemRow[]>([emptyLine()]);

  // Load vendors
  useEffect(() => {
    getVendors(siteId, {}, { pageSize: 200 }).then((res) =>
      setVendors(res.vendors),
    );
  }, [siteId]);

  // Load bill for edit
  useEffect(() => {
    if (!billId) return;
    getBill(billId).then((res) => {
      setVendorId(res.vendorId);
      setVendorBillReference(res.vendorBillReference || "");
      setIssueDate(res.issueDate || "");
      setDueDate(res.dueDate || "");
      setCurrency(res.currency);
      setNotes(res.notes || "");
      if (res.lineItems && res.lineItems.length > 0) {
        setLineItems(
          res.lineItems.map((li: BillLineItem) => ({
            description: li.name || li.description || "",
            quantity: li.quantity,
            unitPrice: li.unitPrice / 100,
            taxRate: li.taxRate || 16,
          })),
        );
      }
      setLoading(false);
    });
  }, [billId]);

  // Line item helpers
  const updateLine = (index: number, field: keyof LineItemRow, value: any) => {
    setLineItems((prev) =>
      prev.map((li, i) => (i === index ? { ...li, [field]: value } : li)),
    );
  };

  const removeLine = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addLine = () => {
    setLineItems((prev) => [...prev, emptyLine()]);
  };

  // Calculations
  const calcLine = (li: LineItemRow) => {
    const subtotal = Math.round(li.quantity * li.unitPrice * 100);
    const tax = Math.round(subtotal * (li.taxRate / 100));
    return { subtotal, tax, total: subtotal + tax };
  };

  const totals = lineItems.reduce(
    (acc, li) => {
      const c = calcLine(li);
      return {
        subtotal: acc.subtotal + c.subtotal,
        tax: acc.tax + c.tax,
        total: acc.total + c.total,
      };
    },
    { subtotal: 0, tax: 0, total: 0 },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorId) {
      toast.error("Please select a vendor");
      return;
    }
    if (lineItems.length === 0 || lineItems.every((li) => !li.description)) {
      toast.error("Add at least one line item");
      return;
    }

    const items = lineItems
      .filter((li) => li.description)
      .map((li) => {
        const c = calcLine(li);
        return {
          name: li.description,
          quantity: li.quantity,
          unitPrice: Math.round(li.unitPrice * 100),
          taxRate: li.taxRate,
        };
      });

    startTransition(async () => {
      try {
        if (billId) {
          await updateBill(
            billId,
            {
              vendorBillReference: vendorBillReference || undefined,
              issueDate,
              dueDate: dueDate || undefined,
              currency,
              notes: notes || undefined,
            },
            items,
          );
          toast.success("Bill updated");
          router.push(`/dashboard/sites/${siteId}/invoicing/bills/${billId}`);
        } else {
          const input: CreateBillInput = {
            vendorId,
            vendorBillReference: vendorBillReference || undefined,
            issueDate,
            dueDate: dueDate,
            currency,
            notes: notes || undefined,
            lineItems: items,
          };
          const result = await createBill(siteId, input);
          toast.success("Bill created");
          router.push(
            `/dashboard/sites/${siteId}/invoicing/bills/${result.id}`,
          );
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save bill");
      }
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={
              billId
                ? `/dashboard/sites/${siteId}/invoicing/bills/${billId}`
                : `/dashboard/sites/${siteId}/invoicing/bills`
            }
          >
            <Button type="button" variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {billId ? "Edit Bill" : "New Bill"}
          </h1>
        </div>
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4 mr-1.5" />
          {isPending ? "Saving..." : "Save Bill"}
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
          <CardDescription>
            Basic information about this vendor bill.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Vendor */}
          <div className="space-y-2">
            <Label>Vendor *</Label>
            <Select
              value={vendorId}
              onValueChange={setVendorId}
              disabled={!!billId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor Bill Reference */}
          <div className="space-y-2">
            <Label htmlFor="vendorRef">Vendor Bill #</Label>
            <Input
              id="vendorRef"
              placeholder="Vendor's invoice/bill number"
              value={vendorBillReference}
              onChange={(e) => setVendorBillReference(e.target.value)}
            />
          </div>

          {/* Issue Date */}
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date *</Label>
            <Input
              id="issueDate"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ZMW">ZMW - Zambian Kwacha</SelectItem>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-4">Description</div>
              <div className="col-span-1">Qty</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-1">Tax %</div>
              <div className="col-span-3 text-right">Total</div>
              <div className="col-span-1" />
            </div>

            {lineItems.map((li, idx) => {
              const c = calcLine(li);
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-4"
                    placeholder="Description"
                    value={li.description}
                    onChange={(e) =>
                      updateLine(idx, "description", e.target.value)
                    }
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    min={1}
                    value={li.quantity}
                    onChange={(e) =>
                      updateLine(idx, "quantity", parseInt(e.target.value) || 1)
                    }
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    value={li.unitPrice || ""}
                    onChange={(e) =>
                      updateLine(
                        idx,
                        "unitPrice",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    min={0}
                    max={100}
                    value={li.taxRate}
                    onChange={(e) =>
                      updateLine(
                        idx,
                        "taxRate",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                  <div className="col-span-3 text-right text-sm font-medium">
                    <AmountDisplay amount={c.total} currency={currency} />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(idx)}
                      disabled={lineItems.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              );
            })}

            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Line
            </Button>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <AmountDisplay amount={totals.subtotal} currency={currency} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <AmountDisplay amount={totals.tax} currency={currency} />
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                <span>Total:</span>
                <AmountDisplay amount={totals.total} currency={currency} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Internal notes about this bill..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>
    </form>
  );
}
