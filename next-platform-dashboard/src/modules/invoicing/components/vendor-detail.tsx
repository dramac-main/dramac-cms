"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Vendor, Bill, PurchaseOrder, VendorStats } from "../types";
import type { Expense } from "../types/expense-types";
import { getVendor, deleteVendor, getVendorStats } from "../actions/vendor-actions";
import { AmountDisplay } from "./amount-display";
import { BILL_STATUS_LABELS, PO_STATUS_LABELS } from "../lib/invoicing-constants";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  FileStack,
  ClipboardList,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

interface VendorDetailProps {
  siteId: string;
  vendorId: string;
}

export function VendorDetail({ siteId, vendorId }: VendorDetailProps) {
  const router = useRouter();
  const [vendor, setVendor] = useState<
    (Vendor & { bills?: Bill[]; purchaseOrders?: PurchaseOrder[]; expenses?: Expense[] }) | null
  >(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLoading(true);
    Promise.all([getVendor(vendorId), getVendorStats(vendorId)])
      .then(([vendorData, statsData]) => {
        setVendor(vendorData);
        setStats(statsData);
      })
      .catch(() => {
        toast.error("Failed to load vendor");
      })
      .finally(() => setLoading(false));
  }, [vendorId]);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteVendor(vendorId);
        toast.success("Vendor deleted");
        router.push(`/dashboard/sites/${siteId}/invoicing/vendors`);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete vendor");
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

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vendor not found</p>
        <Button variant="link" asChild className="mt-2">
          <Link href={`/dashboard/sites/${siteId}/invoicing/vendors`}>
            Back to Vendors
          </Link>
        </Button>
      </div>
    );
  }

  const basePath = `/dashboard/sites/${siteId}/invoicing`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`${basePath}/vendors`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{vendor.name}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`${basePath}/vendors/${vendorId}/edit`}>
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Link>
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
                <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                <AlertDialogDescription>
                  This will soft-delete &quot;{vendor.name}&quot;. This action cannot
                  be undone if there are unpaid bills.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total Billed</p>
              <p className="text-lg font-semibold">
                <AmountDisplay
                  amount={stats.totalBilled}
                  currency={vendor.currency || "ZMW"}
                />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-lg font-semibold">
                <AmountDisplay
                  amount={stats.totalPaid}
                  currency={vendor.currency || "ZMW"}
                />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-lg font-semibold text-amber-600">
                <AmountDisplay
                  amount={stats.totalOutstanding}
                  currency={vendor.currency || "ZMW"}
                />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Active POs</p>
              <p className="text-lg font-semibold">{stats.activePurchaseOrders}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info + Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Side info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {vendor.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${vendor.email}`}
                    className="text-primary hover:underline"
                  >
                    {vendor.email}
                  </a>
                </div>
              )}
              {vendor.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {vendor.website}
                  </a>
                </div>
              )}
              {(vendor.address || vendor.city) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>
                    {[vendor.address, vendor.city, vendor.state, vendor.postalCode, vendor.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
              {vendor.taxId && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>TPIN: {vendor.taxId}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {(vendor.bankName || vendor.bankAccountNumber) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Banking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {vendor.bankName && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>{vendor.bankName}</span>
                  </div>
                )}
                {vendor.bankAccountNumber && (
                  <p className="text-muted-foreground ml-6">
                    Acc: {vendor.bankAccountNumber}
                  </p>
                )}
                {vendor.bankBranchCode && (
                  <p className="text-muted-foreground ml-6">
                    Branch: {vendor.bankBranchCode}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {vendor.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {vendor.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bills" className="w-full">
          <TabsList>
            <TabsTrigger value="bills" className="gap-1.5">
              <FileStack className="h-3.5 w-3.5" />
              Bills ({vendor.bills?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pos" className="gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Purchase Orders ({vendor.purchaseOrders?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              Expenses ({vendor.expenses?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Bills Tab */}
          <TabsContent value="bills">
            <Card>
              <CardContent className="pt-4">
                {!vendor.bills || vendor.bills.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No bills for this vendor yet.{" "}
                    <Link
                      href={`${basePath}/bills/new?vendorId=${vendorId}`}
                      className="text-primary underline"
                    >
                      Create one
                    </Link>
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.bills.map((bill: Bill) => (
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
                            <Badge variant="secondary">
                              {BILL_STATUS_LABELS[bill.status] || bill.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {bill.dueDate || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <AmountDisplay
                              amount={bill.total}
                              currency={bill.currency}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <AmountDisplay
                              amount={bill.amountDue}
                              currency={bill.currency}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchase Orders Tab */}
          <TabsContent value="pos">
            <Card>
              <CardContent className="pt-4">
                {!vendor.purchaseOrders || vendor.purchaseOrders.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No purchase orders for this vendor yet.{" "}
                    <Link
                      href={`${basePath}/purchase-orders/new?vendorId=${vendorId}`}
                      className="text-primary underline"
                    >
                      Create one
                    </Link>
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.purchaseOrders.map((po: PurchaseOrder) => (
                        <TableRow
                          key={po.id}
                          className="cursor-pointer"
                          onClick={() =>
                            router.push(`${basePath}/purchase-orders/${po.id}`)
                          }
                        >
                          <TableCell className="font-medium">
                            {po.poNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {PO_STATUS_LABELS[po.status] || po.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {po.issueDate}
                          </TableCell>
                          <TableCell className="text-right">
                            <AmountDisplay
                              amount={po.total}
                              currency={po.currency}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card>
              <CardContent className="pt-4">
                {!vendor.expenses || vendor.expenses.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No expenses linked to this vendor yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.expenses.map((exp: Expense) => (
                        <TableRow
                          key={exp.id}
                          className="cursor-pointer"
                          onClick={() =>
                            router.push(`${basePath}/expenses/${exp.id}`)
                          }
                        >
                          <TableCell className="font-medium">
                            {exp.description || "Untitled"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {exp.categoryId || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {exp.date}
                          </TableCell>
                          <TableCell className="text-right">
                            <AmountDisplay
                              amount={exp.amount}
                              currency={exp.currency}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
