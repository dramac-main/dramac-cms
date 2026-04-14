"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Bill, BillLineItem, Vendor } from "../types";
import { getBill, approveBill, voidBill, deleteBill } from "../actions/bill-actions";
import { BillPaymentDialog } from "./bill-payment-dialog";
import { AmountDisplay } from "./amount-display";
import {
  BILL_STATUS_CONFIG,
} from "../lib/invoicing-constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Trash2,
  CheckCircle,
  Ban,
  FileStack,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

interface BillDetailProps {
  siteId: string;
  billId: string;
}

export function BillDetail({ siteId, billId }: BillDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [bill, setBill] = useState<Bill | null>(null);
  const [lineItems, setLineItems] = useState<BillLineItem[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBill = () => {
    getBill(billId).then((res) => {
      setBill(res);
      setLineItems(res.lineItems || []);
      setVendor(res.vendor || null);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadBill();
  }, [billId]);

  const handleAction = (
    action: () => Promise<any>,
    successMsg: string,
    redirect?: string,
  ) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMsg);
        if (redirect) {
          router.push(redirect);
        } else {
          loadBill();
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Action failed",
        );
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

  if (!bill) {
    return (
      <div className="text-center py-12">
        <FileStack className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Bill not found</p>
      </div>
    );
  }

  const cfg = BILL_STATUS_CONFIG[bill.status] || BILL_STATUS_CONFIG.draft;
  const isDraft = bill.status === "draft";
  const canPay =
    bill.status === "received" ||
    bill.status === "partial" ||
    bill.status === "overdue";
  const canVoid =
    bill.status !== "void" && bill.status !== "paid" && bill.amountPaid === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/sites/${siteId}/invoicing/bills`}
          >
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{bill.billNumber}</h1>
              <Badge
                variant="outline"
                className={`${cfg.color} ${cfg.bgColor} border-0`}
              >
                {cfg.label}
              </Badge>
            </div>
            {bill.vendorBillReference && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Vendor ref: {bill.vendorBillReference}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <Link
                href={`/dashboard/sites/${siteId}/invoicing/bills/${billId}/edit`}
              >
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() =>
                  handleAction(
                    () => approveBill(billId),
                    "Bill approved",
                  )
                }
                disabled={isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Approve
              </Button>
            </>
          )}
          {canPay && (
            <BillPaymentDialog
              billId={billId}
              amountDue={bill.amountDue}
              currency={bill.currency}
              onSuccess={loadBill}
            />
          )}
          {canVoid && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleAction(
                  () => voidBill(billId),
                  "Bill voided",
                )
              }
              disabled={isPending}
            >
              <Ban className="h-4 w-4 mr-1.5" />
              Void
            </Button>
          )}
          {isDraft && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Bill?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete bill {bill.billNumber}. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      handleAction(
                        () => deleteBill(billId),
                        "Bill deleted",
                        `/dashboard/sites/${siteId}/invoicing/bills`,
                      )
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amounts */}
          <div className="grid gap-4 grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">
                  <AmountDisplay amount={bill.total} currency={bill.currency} />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  <AmountDisplay
                    amount={bill.amountPaid}
                    currency={bill.currency}
                  />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">
                  <AmountDisplay
                    amount={bill.amountDue}
                    currency={bill.currency}
                  />
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              {lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No line items
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((li, idx) => (
                      <TableRow key={li.id || idx}>
                        <TableCell className="text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell>{li.description}</TableCell>
                        <TableCell className="text-center">
                          {li.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          <AmountDisplay
                            amount={li.unitPrice}
                            currency={bill.currency}
                          />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <AmountDisplay
                            amount={li.taxAmount}
                            currency={bill.currency}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <AmountDisplay
                            amount={li.total}
                            currency={bill.currency}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Totals summary */}
              <div className="flex justify-end mt-4">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <AmountDisplay
                      amount={bill.subtotal}
                      currency={bill.currency}
                    />
                  </div>
                  {bill.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax:</span>
                      <AmountDisplay
                        amount={bill.taxAmount}
                        currency={bill.currency}
                      />
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <AmountDisplay
                      amount={bill.total}
                      currency={bill.currency}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {bill.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{bill.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vendor Card */}
          {vendor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Vendor
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <Link
                  href={`/dashboard/sites/${siteId}/invoicing/vendors/${vendor.id}`}
                  className="font-medium hover:underline"
                >
                  {vendor.name}
                </Link>
                {vendor.email && (
                  <p className="text-muted-foreground">{vendor.email}</p>
                )}
                {vendor.phone && (
                  <p className="text-muted-foreground">{vendor.phone}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue Date</span>
                <span>{bill.issueDate || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span>{bill.dueDate || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span>{bill.currency}</span>
              </div>
              {bill.purchaseOrderId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Order</span>
                  <Link
                    href={`/dashboard/sites/${siteId}/invoicing/purchase-orders/${bill.purchaseOrderId}`}
                    className="text-primary hover:underline"
                  >
                    View PO
                  </Link>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>
                  {new Date(bill.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
