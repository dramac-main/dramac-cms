"use client";

import { useState } from "react";
import type { PurchaseOrderLineItem, ReceiptInput, POReceipt } from "../types";
import { receivePurchaseOrder, getPoReceipts } from "../actions/purchase-order-actions";
import { AmountDisplay } from "./amount-display";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface POReceiveFormProps {
  siteId: string;
  purchaseOrderId: string;
  lineItems: PurchaseOrderLineItem[];
  currency: string;
  existingReceipts?: POReceipt[];
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function POReceiveForm({
  siteId,
  purchaseOrderId,
  lineItems,
  currency,
  existingReceipts = [],
  onSuccess,
  trigger,
}: POReceiveFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, string>>({});

  // Calculate already received per line
  const receivedByLine: Record<number, number> = {};
  for (const r of existingReceipts) {
    receivedByLine[r.lineIndex] =
      (receivedByLine[r.lineIndex] || 0) + r.receivedQuantity;
  }

  const handleSubmit = async () => {
    const receipts: ReceiptInput[] = [];
    for (const [idx, qty] of Object.entries(quantities)) {
      const parsed = parseFloat(qty);
      if (parsed > 0) {
        receipts.push({ lineIndex: parseInt(idx), receivedQuantity: parsed });
      }
    }

    if (receipts.length === 0) {
      toast.error("Enter at least one received quantity");
      return;
    }

    // Validate: don't receive more than ordered minus already received
    for (const r of receipts) {
      const ordered = lineItems[r.lineIndex]?.quantity || 0;
      const alreadyReceived = receivedByLine[r.lineIndex] || 0;
      const remaining = ordered - alreadyReceived;
      if (r.receivedQuantity > remaining) {
        toast.error(
          `Line ${r.lineIndex + 1}: Cannot receive ${r.receivedQuantity} — only ${remaining} remaining`,
        );
        return;
      }
    }

    setSaving(true);
    try {
      const result = await receivePurchaseOrder(siteId, purchaseOrderId, receipts);
      toast.success(
        `Goods received — PO status: ${result.newStatus.replace("_", " ")}`,
      );
      setOpen(false);
      setQuantities({});
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to record receipt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Package className="h-4 w-4 mr-1.5" />
            Receive Goods
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receive Goods</DialogTitle>
          <DialogDescription>
            Enter the quantity received for each line item.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Receive Now</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item, idx) => {
                const ordered = item.quantity;
                const received = receivedByLine[idx] || 0;
                const remaining = ordered - received;
                const isFullyReceived = remaining <= 0;

                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{ordered}</TableCell>
                    <TableCell className="text-right">
                      {received > 0 ? (
                        <Badge
                          variant={isFullyReceived ? "default" : "secondary"}
                        >
                          {received}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isFullyReceived ? (
                        <Badge variant="default">Done</Badge>
                      ) : (
                        remaining
                      )}
                    </TableCell>
                    <TableCell className="text-right w-28">
                      {isFullyReceived ? (
                        <span className="text-muted-foreground text-sm">—</span>
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          max={remaining}
                          step="any"
                          placeholder="0"
                          className="w-24 text-right"
                          value={quantities[idx] || ""}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [idx]: e.target.value,
                            }))
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Record Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
