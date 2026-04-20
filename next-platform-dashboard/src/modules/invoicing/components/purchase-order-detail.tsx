"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  PurchaseOrder,
  PurchaseOrderLineItem,
  Bill,
  Vendor,
  POReceipt,
} from "../types";
import {
  getPurchaseOrder,
  sendPurchaseOrder,
  approvePurchaseOrder,
  markAsReceived,
  convertToBill,
  cancelPurchaseOrder,
  deletePurchaseOrder,
  getPoReceipts,
} from "../actions/purchase-order-actions";
import { AmountDisplay } from "./amount-display";
import { POReceiveForm } from "./po-receive-form";
import { PO_STATUS_LABELS, PO_STATUS_CONFIG } from "../lib/invoicing-constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle2,
  Package,
  FileStack,
  XCircle,
  Trash2,
  Printer,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface PurchaseOrderDetailProps {
  siteId: string;
  purchaseOrderId: string;
}

export function PurchaseOrderDetail({
  siteId,
  purchaseOrderId,
}: PurchaseOrderDetailProps) {
  const router = useRouter();
  const [po, setPo] = useState<
    (PurchaseOrder & { vendor?: Vendor | null; linkedBills: Bill[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [receipts, setReceipts] = useState<POReceipt[]>([]);

  const fetchPO = () => {
    setLoading(true);
    Promise.all([
      getPurchaseOrder(purchaseOrderId),
      getPoReceipts(siteId, purchaseOrderId),
    ])
      .then(([poData, rcpts]) => {
        setPo(poData);
        setReceipts(rcpts);
      })
      .catch(() => toast.error("Failed to load purchase order"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPO();
  }, [purchaseOrderId]);

  const handleAction = (
    action: () => Promise<any>,
    successMsg: string,
    redirect?: string,
  ) => {
    startTransition(async () => {
      try {
        const result = await action();
        toast.success(successMsg);
        if (redirect) {
          router.push(redirect);
        } else {
          fetchPO();
        }
        return result;
      } catch (err: any) {
        toast.error(err.message || "Action failed");
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

  if (!po) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Purchase order not found</p>
        <Button variant="link" asChild className="mt-2">
          <Link href={`/dashboard/sites/${siteId}/invoicing/purchase-orders`}>
            Back to Purchase Orders
          </Link>
        </Button>
      </div>
    );
  }

  const basePath = `/dashboard/sites/${siteId}/invoicing`;
  const lineItems: PurchaseOrderLineItem[] =
    (po.metadata as any)?.lineItems || [];
  const config = PO_STATUS_CONFIG[po.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`${basePath}/purchase-orders`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{po.poNumber}</h2>
              <Badge variant="secondary" className={config?.color || ""}>
                {PO_STATUS_LABELS[po.status] || po.status}
              </Badge>
            </div>
            {po.vendor && (
              <p className="text-sm text-muted-foreground">
                Vendor:{" "}
                <Link
                  href={`${basePath}/vendors/${po.vendorId}`}
                  className="text-primary hover:underline"
                >
                  {po.vendor.name}
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {po.status === "draft" && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`${basePath}/purchase-orders/${purchaseOrderId}/edit`}
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
                </Link>
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  handleAction(
                    () => sendPurchaseOrder(purchaseOrderId),
                    "Purchase order sent to vendor",
                  )
                }
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                Send to Vendor
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isPending}>
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete PO {po.poNumber}. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        handleAction(
                          () => deletePurchaseOrder(purchaseOrderId),
                          "Purchase order deleted",
                          `${basePath}/purchase-orders`,
                        )
                      }
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {po.status === "sent" && (
            <>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  handleAction(
                    () => approvePurchaseOrder(purchaseOrderId),
                    "PO acknowledged",
                  )
                }
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Mark Acknowledged
              </Button>
              <POReceiveForm
                siteId={siteId}
                purchaseOrderId={purchaseOrderId}
                lineItems={lineItems}
                currency={po.currency}
                existingReceipts={receipts}
                onSuccess={fetchPO}
              />
            </>
          )}

          {(po.status === "acknowledged" ||
            po.status === "partially_received") && (
            <POReceiveForm
              siteId={siteId}
              purchaseOrderId={purchaseOrderId}
              lineItems={lineItems}
              currency={po.currency}
              existingReceipts={receipts}
              onSuccess={fetchPO}
            />
          )}

          {(po.status === "received" || po.status === "acknowledged") &&
            po.linkedBills.length === 0 && (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  handleAction(async () => {
                    const bill = await convertToBill(purchaseOrderId);
                    router.push(`${basePath}/bills/${bill.id}`);
                  }, "Bill created from PO")
                }
              >
                <FileStack className="h-4 w-4 mr-1.5" />
                Convert to Bill
              </Button>
            )}

          {!["cancelled", "received"].includes(po.status) &&
            po.status !== "draft" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isPending}>
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Cancel PO
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Purchase Order</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel PO {po.poNumber}. This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        handleAction(
                          () => cancelPurchaseOrder(purchaseOrderId),
                          "Purchase order cancelled",
                        )
                      }
                    >
                      Confirm Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
        </div>
      </div>

      {/* PO Info */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{po.issueDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expected Delivery</p>
                  <p className="font-medium">{po.expectedDate || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Currency</p>
                  <p className="font-medium">{po.currency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(po.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              {lineItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No line items
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((li, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <span className="font-medium">{li.name}</span>
                          {li.description && (
                            <span className="text-xs text-muted-foreground block">
                              {li.description}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {li.quantity}
                          {li.unit ? ` ${li.unit}` : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          <AmountDisplay
                            amount={li.unitPrice}
                            currency={po.currency}
                          />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <AmountDisplay
                            amount={li.taxAmount || 0}
                            currency={po.currency}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <AmountDisplay
                            amount={li.total}
                            currency={po.currency}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <AmountDisplay
                      amount={po.subtotal}
                      currency={po.currency}
                    />
                  </div>
                  {po.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax:</span>
                      <AmountDisplay
                        amount={po.taxAmount}
                        currency={po.currency}
                      />
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>Total:</span>
                    <AmountDisplay amount={po.total} currency={po.currency} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goods Received History */}
          {receipts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Goods Received ({receipts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">
                        Qty Received
                      </TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((r) => {
                      const item = lineItems[r.lineIndex];
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">
                            {new Date(r.receivedDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {item?.name || `Line ${r.lineIndex + 1}`}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {r.receivedQuantity}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.notes || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Linked Bills */}
          {po.linkedBills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked Bills</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.linkedBills.map((bill) => (
                      <TableRow
                        key={bill.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`${basePath}/bills/${bill.id}`)
                        }
                      >
                        <TableCell className="font-medium">
                          {bill.billNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{bill.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <AmountDisplay
                            amount={bill.total}
                            currency={bill.currency}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {po.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {po.shippingAddress}
                </p>
              </CardContent>
            </Card>
          )}
          {po.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {po.notes}
                </p>
              </CardContent>
            </Card>
          )}
          {po.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {po.internalNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
