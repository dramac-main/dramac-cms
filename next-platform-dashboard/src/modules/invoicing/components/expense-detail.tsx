"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Expense } from "../types/expense-types";
import type { InvoiceActivity } from "../types/activity-types";
import {
  getExpense,
  approveExpense,
  rejectExpense,
  deleteExpense,
} from "../actions/expense-actions";
import { ExpenseStatusBadge } from "./expense-status-badge";
import { InvoiceActivityLog } from "./invoice-activity-log";
import { AmountDisplay } from "./amount-display";
import { ExpenseReceiptViewer } from "./expense-receipt-viewer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Pencil,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type ExpenseWithDetails = Expense & {
  activity: InvoiceActivity[];
};

interface ExpenseDetailProps {
  siteId: string;
  expenseId: string;
}

export function ExpenseDetail({ siteId, expenseId }: ExpenseDetailProps) {
  const router = useRouter();
  const [expense, setExpense] = useState<ExpenseWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadExpense();
  }, [siteId, expenseId]);

  async function loadExpense() {
    setLoading(true);
    try {
      const result = await getExpense(expenseId);
      if (!result) {
        toast.error("Expense not found");
        return;
      }
      setExpense(result as ExpenseWithDetails);
    } catch {
      toast.error("Failed to load expense");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    setActing(true);
    try {
      await approveExpense(expenseId);
      toast.success("Expense approved");
      loadExpense();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve expense");
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setActing(true);
    try {
      await rejectExpense(expenseId, rejectReason.trim());
      toast.success("Expense rejected");
      loadExpense();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject expense");
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    setActing(true);
    try {
      await deleteExpense(expenseId);
      toast.success("Expense deleted");
      router.push(`/dashboard/sites/${siteId}/invoicing/expenses`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete expense");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Expense not found.{" "}
        <Link
          href={`/dashboard/sites/${siteId}/invoicing/expenses`}
          className="text-primary underline"
        >
          Back to expenses
        </Link>
      </div>
    );
  }

  const canEdit = !expense.isBilled && expense.status !== "void";
  const canApprove = expense.status === "pending";
  const canDelete = !expense.isBilled && expense.status !== "void";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/sites/${siteId}/invoicing/expenses`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                {expense.expenseNumber || "Expense"}
              </h2>
              <ExpenseStatusBadge status={expense.status} />
            </div>
            <p className="text-sm text-muted-foreground">{expense.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link
                href={`/dashboard/sites/${siteId}/invoicing/expenses/${expenseId}?edit=true`}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Link>
            </Button>
          )}

          {canApprove && (
            <>
              <Button
                variant="default"
                onClick={handleApprove}
                disabled={acting}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Approve
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={acting}>
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Expense</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please provide a reason for rejecting this expense.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label>Reason</Label>
                    <Input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection..."
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReject}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={acting}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this expense record. This cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Amount</p>
                <p className="text-3xl font-bold">
                  <AmountDisplay
                    amount={expense.amount}
                    currency={expense.currency}
                  />
                </p>
                {expense.taxAmount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Includes tax:{" "}
                    <AmountDisplay
                      amount={expense.taxAmount}
                      currency={expense.currency}
                    />
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {expense.receiptUrl && (
                <TabsTrigger value="receipt">Receipt</TabsTrigger>
              )}
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Date</dt>
                      <dd className="font-medium">
                        {new Date(expense.date).toLocaleDateString()}
                      </dd>
                    </div>
                    {expense.category && (
                      <div>
                        <dt className="text-muted-foreground">Category</dt>
                        <dd className="font-medium flex items-center gap-1.5">
                          {expense.category.color && (
                            <span
                              className="h-2.5 w-2.5 rounded-full inline-block"
                              style={{ backgroundColor: expense.category.color }}
                            />
                          )}
                          {expense.category.name}
                        </dd>
                      </div>
                    )}
                    {expense.paymentMethod && (
                      <div>
                        <dt className="text-muted-foreground">Payment Method</dt>
                        <dd className="font-medium capitalize">
                          {expense.paymentMethod.replace(/_/g, " ")}
                        </dd>
                      </div>
                    )}
                    {expense.paymentReference && (
                      <div>
                        <dt className="text-muted-foreground">Reference</dt>
                        <dd className="font-medium">
                          {expense.paymentReference}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {expense.notes && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Notes
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {expense.notes}
                        </p>
                      </div>
                    </>
                  )}

                  {expense.tags?.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex flex-wrap gap-1.5">
                        {expense.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {expense.receiptUrl && (
              <TabsContent value="receipt" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <ExpenseReceiptViewer
                      receiptUrl={expense.receiptUrl}
                      receiptFilename={expense.receiptFilename}
                      mode="compact"
                    />
                    <div className="mt-3">
                      <ExpenseReceiptViewer
                        receiptUrl={expense.receiptUrl}
                        receiptFilename={expense.receiptFilename}
                        mode="full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <InvoiceActivityLog
                    activities={expense.activity || []}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Billable</span>
                <Badge variant={expense.isBillable ? "default" : "secondary"}>
                  {expense.isBillable ? "Yes" : "No"}
                </Badge>
              </div>
              {expense.isBillable && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Billed</span>
                  <Badge
                    variant={expense.isBilled ? "default" : "outline"}
                    className={
                      expense.isBilled
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : ""
                    }
                  >
                    {expense.isBilled ? "Billed" : "Not Yet"}
                  </Badge>
                </div>
              )}
              {expense.billedInvoiceId && (
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Invoice
                  </span>
                  <Link
                    href={`/dashboard/sites/${siteId}/invoicing/invoices/${expense.billedInvoiceId}`}
                    className="text-primary underline text-xs"
                  >
                    View Invoice
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Status */}
          {(expense.status === "approved" || expense.status === "rejected") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {expense.status === "approved" ? "Approval" : "Rejection"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {expense.approvedAt && (
                  <div>
                    <span className="text-muted-foreground">
                      {expense.status === "approved" ? "Approved" : "Rejected"} on
                    </span>
                    <p className="font-medium">
                      {new Date(expense.approvedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {expense.status === "rejected" && expense.rejectionReason && (
                  <div>
                    <span className="text-muted-foreground">Reason</span>
                    <p className="font-medium text-destructive">
                      {expense.rejectionReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Currency</span>
                <p className="font-medium">{expense.currency}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="font-medium">
                  {new Date(expense.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Updated</span>
                <p className="font-medium">
                  {new Date(expense.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
