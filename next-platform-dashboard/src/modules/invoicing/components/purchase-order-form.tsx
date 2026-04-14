"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  PurchaseOrder,
  PurchaseOrderLineItem,
  CreatePurchaseOrderInput,
  Vendor,
} from "../types";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrder,
} from "../actions/purchase-order-actions";
import { getVendors } from "../actions/vendor-actions";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { AmountDisplay } from "./amount-display";

interface PurchaseOrderFormProps {
  siteId: string;
  purchaseOrderId?: string;
}

const emptyLineItem = (): PurchaseOrderLineItem => ({
  name: "",
  description: "",
  quantity: 1,
  unit: "",
  unitPrice: 0,
  taxRate: 0,
  taxRateId: null,
  taxAmount: 0,
  subtotal: 0,
  total: 0,
});

export function PurchaseOrderForm({
  siteId,
  purchaseOrderId,
}: PurchaseOrderFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(!!purchaseOrderId);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
    null,
  );

  // Vendor picker
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  useEffect(() => {
    getVendors(siteId, {}, { pageSize: 200 })
      .then(({ vendors: v }) => setVendors(v))
      .catch(() => {})
      .finally(() => setVendorsLoading(false));
  }, [siteId]);

  // Load existing PO for edit mode
  useEffect(() => {
    if (!purchaseOrderId) return;
    getPurchaseOrder(purchaseOrderId)
      .then((po) => {
        if (!po) return;
        setPurchaseOrder(po);
        setVendorId(po.vendorId || "");
        setCurrency(po.currency || "ZMW");
        setIssueDate(po.issueDate || new Date().toISOString().split("T")[0]);
        setExpectedDate(po.expectedDate || "");
        setShippingAddress(po.shippingAddress || "");
        setNotes(po.notes || "");
        setInternalNotes(po.internalNotes || "");
        const existing = (po.metadata as any)?.lineItems as
          | PurchaseOrderLineItem[]
          | undefined;
        if (existing && existing.length > 0) setLineItems(existing);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [purchaseOrderId]);

  // Form state
  const preselectedVendor = searchParams.get("vendorId") || "";
  const [vendorId, setVendorId] = useState(preselectedVendor);
  const [currency, setCurrency] = useState("ZMW");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [expectedDate, setExpectedDate] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Line items
  const [lineItems, setLineItems] = useState<PurchaseOrderLineItem[]>([
    emptyLineItem(),
  ]);

  const updateLineItem = (
    index: number,
    field: keyof PurchaseOrderLineItem,
    value: any,
  ) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      // Recalculate
      item.subtotal = item.quantity * item.unitPrice;
      item.taxAmount = Math.round((item.subtotal * (item.taxRate || 0)) / 100);
      item.total = item.subtotal + item.taxAmount;
      updated[index] = item;
      return updated;
    });
  };

  const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()]);

  const removeLineItem = (index: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== index));

  // Totals
  const subtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const taxTotal = lineItems.reduce((sum, li) => sum + (li.taxAmount || 0), 0);
  const total = subtotal + taxTotal;

  const handleSubmit = () => {
    if (!vendorId) {
      toast.error("Please select a vendor");
      return;
    }
    const validItems = lineItems.filter((li) => li.name.trim());
    if (validItems.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    const input: CreatePurchaseOrderInput = {
      vendorId,
      currency,
      issueDate,
      expectedDate: expectedDate || undefined,
      shippingAddress: shippingAddress || undefined,
      notes: notes || undefined,
      internalNotes: internalNotes || undefined,
      lineItems: validItems,
    };

    startTransition(async () => {
      try {
        if (!purchaseOrderId) {
          const created = await createPurchaseOrder(siteId, input);
          toast.success(`PO ${created.poNumber} created`);
          router.push(
            `/dashboard/sites/${siteId}/invoicing/purchase-orders/${created.id}`,
          );
        } else {
          await updatePurchaseOrder(purchaseOrderId, input);
          toast.success("Purchase order updated");
          router.push(
            `/dashboard/sites/${siteId}/invoicing/purchase-orders/${purchaseOrderId}`,
          );
        }
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to save purchase order");
      }
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/sites/${siteId}/invoicing/purchase-orders`}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Purchase Orders
        </Link>
      </Button>

      {loading ? (
        <div className="space-y-3">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-40 bg-muted rounded animate-pulse" />
        </div>
      ) : null}

      <h2 className="text-xl font-semibold">
        {!purchaseOrderId
          ? "New Purchase Order"
          : `Edit PO ${purchaseOrder?.poNumber || ""}`}
      </h2>

      {/* PO Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label>Vendor *</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      vendorsLoading ? "Loading..." : "Select a vendor"
                    }
                  />
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
            <div>
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expectedDate">Expected Delivery</Label>
              <Input
                id="expectedDate"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZMW">ZMW</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="ZAR">ZAR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="shippingAddress">Shipping Address</Label>
            <Textarea
              id="shippingAddress"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Delivery / shipping address"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_100px_80px_100px_100px_32px] gap-2 text-xs font-medium text-muted-foreground">
              <span>Item</span>
              <span>Qty</span>
              <span>Unit Price</span>
              <span>Tax %</span>
              <span>Tax</span>
              <span>Total</span>
              <span />
            </div>
            {lineItems.map((li, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_80px_100px_80px_100px_100px_32px] gap-2 items-start"
              >
                <div>
                  <Input
                    value={li.name}
                    onChange={(e) =>
                      updateLineItem(idx, "name", e.target.value)
                    }
                    placeholder="Item name"
                    className="text-sm"
                  />
                  <Input
                    value={li.description || ""}
                    onChange={(e) =>
                      updateLineItem(idx, "description", e.target.value)
                    }
                    placeholder="Description (optional)"
                    className="text-xs mt-1"
                  />
                </div>
                <Input
                  type="number"
                  value={li.quantity}
                  onChange={(e) =>
                    updateLineItem(idx, "quantity", Number(e.target.value))
                  }
                  min={1}
                  className="text-sm"
                />
                <Input
                  type="number"
                  value={li.unitPrice / 100}
                  onChange={(e) =>
                    updateLineItem(
                      idx,
                      "unitPrice",
                      Math.round(Number(e.target.value) * 100),
                    )
                  }
                  min={0}
                  step={0.01}
                  className="text-sm"
                />
                <Input
                  type="number"
                  value={li.taxRate || 0}
                  onChange={(e) =>
                    updateLineItem(idx, "taxRate", Number(e.target.value))
                  }
                  min={0}
                  max={100}
                  className="text-sm"
                />
                <div className="text-sm py-2 text-muted-foreground text-right">
                  <AmountDisplay
                    amount={li.taxAmount || 0}
                    currency={currency}
                  />
                </div>
                <div className="text-sm py-2 font-medium text-right">
                  <AmountDisplay amount={li.total} currency={currency} />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeLineItem(idx)}
                  disabled={lineItems.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <AmountDisplay amount={subtotal} currency={currency} />
              </div>
              {taxTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <AmountDisplay amount={taxTotal} currency={currency} />
                </div>
              )}
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Total:</span>
                <AmountDisplay amount={total} currency={currency} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Notes (visible to vendor)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes included in the PO"
              rows={3}
            />
          </div>
          <div>
            <Label>Internal Notes</Label>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Internal notes (not visible to vendor)"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/sites/${siteId}/invoicing/purchase-orders`}>
            Cancel
          </Link>
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          {!purchaseOrderId ? "Create PO" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
