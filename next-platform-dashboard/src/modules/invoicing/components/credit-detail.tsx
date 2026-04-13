"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  CreditNote,
  CreditNoteLineItem,
  CreditApplication,
} from "../types/credit-types";
import type { InvoiceActivity } from "../types/activity-types";
import {
  getCreditNote,
  issueCreditNote,
  voidCreditNote,
  deleteCreditNote,
} from "../actions/credit-actions";
import { CreditStatusBadge } from "./credit-status-badge";
import { CreditApplyDialog } from "./credit-apply-dialog";
import { InvoiceActivityLog } from "./invoice-activity-log";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Pencil,
  Send,
  Ban,
  Trash2,
  CreditCard,
} from "lucide-react";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { toast } from "sonner";

type CreditNoteWithDetails = CreditNote & {
  lineItems: CreditNoteLineItem[];
  applications: CreditApplication[];
  activity: InvoiceActivity[];
};

interface CreditDetailProps {
  siteId: string;
  creditNoteId: string;
}

export function CreditDetail({ siteId, creditNoteId }: CreditDetailProps) {
  const router = useRouter();
  const [creditNote, setCreditNote] = useState<CreditNoteWithDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [acting, setActing] = useState(false);

  const loadCreditNote = () => {
    setLoading(true);
    getCreditNote(creditNoteId)
      .then(setCreditNote)
      .catch(() => setCreditNote(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCreditNote();
  }, [creditNoteId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!creditNote) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Credit note not found.</p>
        <Button
          asChild
          variant="outline"
          className="mt-4"
        >
          <Link href={`/dashboard/sites/${siteId}/invoicing/credits`}>
            Back to Credit Notes
          </Link>
        </Button>
      </div>
    );
  }

  const cn = creditNote;

  async function handleIssue() {
    setActing(true);
    try {
      await issueCreditNote(cn.id);
      toast.success("Credit note issued");
      loadCreditNote();
    } catch (err: any) {
      toast.error(err.message || "Failed to issue");
    } finally {
      setActing(false);
    }
  }

  async function handleVoid() {
    setActing(true);
    try {
      await voidCreditNote(cn.id);
      toast.success("Credit note voided");
      loadCreditNote();
    } catch (err: any) {
      toast.error(err.message || "Failed to void");
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    setActing(true);
    try {
      await deleteCreditNote(cn.id);
      toast.success("Credit note deleted");
      router.push(`/dashboard/sites/${siteId}/invoicing/credits`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push(`/dashboard/sites/${siteId}/invoicing/credits`)
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{cn.creditNumber}</h2>
              <CreditStatusBadge status={cn.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {cn.clientName} &middot;{" "}
              {new Date(cn.issueDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cn.status === "draft" && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/sites/${siteId}/invoicing/credits/${cn.id}/edit`}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button size="sm" onClick={handleIssue} disabled={acting}>
                <Send className="h-4 w-4 mr-1" />
                Issue
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={acting}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Credit Note?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this draft credit note. This
                      action cannot be undone.
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
            </>
          )}
          {(cn.status === "issued" || cn.status === "partially_applied") && (
            <>
              <Button
                size="sm"
                onClick={() => setApplyDialogOpen(true)}
                disabled={acting || cn.amountRemaining <= 0}
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Apply to Invoice
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={acting}>
                    <Ban className="h-4 w-4 mr-1" />
                    Void
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Void Credit Note?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will void the credit note and reverse all
                      applications. Linked invoices will have their amounts
                      restored.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleVoid}>
                      Void
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Summary card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">
                    {formatInvoiceAmount(cn.total, cn.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Applied</p>
                  <p className="text-lg font-semibold">
                    {formatInvoiceAmount(cn.amountApplied, cn.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatInvoiceAmount(cn.amountRemaining, cn.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Currency</p>
                  <p className="text-lg font-semibold">{cn.currency}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="items">
            <TabsList>
              <TabsTrigger value="items">Line Items</TabsTrigger>
              <TabsTrigger value="applications">
                Applications ({cn.applications.length})
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cn.lineItems.map((li) => (
                      <TableRow key={li.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{li.name}</span>
                            {li.description && (
                              <p className="text-xs text-muted-foreground">
                                {li.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {li.quantity}
                          {li.unit && (
                            <span className="text-muted-foreground text-xs ml-0.5">
                              {li.unit}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatInvoiceAmount(li.unitPrice, cn.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatInvoiceAmount(li.taxAmount, cn.currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatInvoiceAmount(li.total, cn.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col items-end mt-3 space-y-1 text-sm">
                <div className="flex gap-8">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatInvoiceAmount(cn.subtotal, cn.currency)}</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatInvoiceAmount(cn.taxAmount, cn.currency)}</span>
                </div>
                <Separator className="w-40 my-1" />
                <div className="flex gap-8 font-semibold">
                  <span>Total</span>
                  <span>{formatInvoiceAmount(cn.total, cn.currency)}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="applications" className="mt-4">
              {cn.applications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No applications yet.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cn.applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/sites/${siteId}/invoicing/invoices/${app.invoiceId}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {app.invoiceId.slice(0, 8)}...
                            </Link>
                          </TableCell>
                          <TableCell>
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatInvoiceAmount(app.amount, cn.currency)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {app.notes || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <InvoiceActivityLog activities={cn.activity} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <CreditStatusBadge status={cn.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{cn.clientName}</span>
              </div>
              {cn.clientEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{cn.clientEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue Date</span>
                <span>
                  {new Date(cn.issueDate).toLocaleDateString()}
                </span>
              </div>
              {cn.invoiceId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linked Invoice</span>
                  <Link
                    href={`/dashboard/sites/${siteId}/invoicing/invoices/${cn.invoiceId}`}
                    className="text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              )}
              {cn.reason && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">Reason</span>
                    <p className="mt-1">{cn.reason}</p>
                  </div>
                </>
              )}
              {cn.notes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">Notes</span>
                    <p className="mt-1">{cn.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Apply credit dialog */}
      <CreditApplyDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        siteId={siteId}
        invoiceId=""
        contactId={cn.contactId}
        invoiceAmountDue={0}
        currency={cn.currency}
        onApplied={loadCreditNote}
      />
    </div>
  );
}
