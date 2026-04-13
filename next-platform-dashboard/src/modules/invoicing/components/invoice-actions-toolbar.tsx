"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Invoice } from "../types";
import {
  sendInvoice,
  markAsSent,
  voidInvoice,
  duplicateInvoice,
  deleteInvoice,
} from "../actions/invoice-actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Send,
  CheckCircle,
  Copy,
  Ban,
  Trash2,
  Printer,
  Link2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface InvoiceActionsToolbarProps {
  siteId: string;
  invoice: Invoice;
}

export function InvoiceActionsToolbar({
  siteId,
  invoice,
}: InvoiceActionsToolbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");

  const canSend = invoice.status === "draft";
  const canMarkSent = invoice.status === "draft";
  const canVoid = ["draft", "sent", "viewed", "partial", "overdue"].includes(
    invoice.status,
  );
  const canDelete = invoice.status === "draft";
  const canDuplicate = true;

  const handleSend = () => {
    startTransition(async () => {
      try {
        await sendInvoice(invoice.id);
        toast.success("Invoice sent successfully");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to send invoice");
      }
    });
  };

  const handleMarkSent = () => {
    startTransition(async () => {
      try {
        await markAsSent(invoice.id);
        toast.success("Invoice marked as sent");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to update invoice");
      }
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      try {
        const dup = await duplicateInvoice(invoice.id);
        toast.success("Invoice duplicated");
        router.push(`/dashboard/sites/${siteId}/invoicing/invoices/${dup.id}`);
      } catch (err: any) {
        toast.error(err.message || "Failed to duplicate invoice");
      }
    });
  };

  const handleVoid = () => {
    if (!voidReason.trim()) {
      toast.error("Please provide a reason for voiding");
      return;
    }
    startTransition(async () => {
      try {
        await voidInvoice(invoice.id, voidReason);
        toast.success("Invoice voided");
        setVoidDialogOpen(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to void invoice");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteInvoice(invoice.id);
        toast.success("Invoice deleted");
        setDeleteDialogOpen(false);
        router.push(`/dashboard/sites/${siteId}/invoicing/invoices`);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete invoice");
      }
    });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/api/invoicing/view/${invoice.viewToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Invoice link copied to clipboard");
  };

  const handlePrint = () => {
    window.open(
      `/dashboard/sites/${siteId}/invoicing/invoices/${invoice.id}/pdf`,
      "_blank",
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {canSend && (
          <Button onClick={handleSend} disabled={isPending} size="sm">
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1.5" />
            )}
            Send Invoice
          </Button>
        )}

        {canMarkSent && (
          <Button
            variant="outline"
            onClick={handleMarkSent}
            disabled={isPending}
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Mark as Sent
          </Button>
        )}

        <Button variant="outline" onClick={handlePrint} size="sm">
          <Printer className="h-4 w-4 mr-1.5" />
          PDF
        </Button>

        <Button variant="outline" onClick={handleCopyLink} size="sm">
          <Link2 className="h-4 w-4 mr-1.5" />
          Copy Link
        </Button>

        {canDuplicate && (
          <Button
            variant="outline"
            onClick={handleDuplicate}
            disabled={isPending}
            size="sm"
          >
            <Copy className="h-4 w-4 mr-1.5" />
            Duplicate
          </Button>
        )}

        {canVoid && (
          <Button
            variant="outline"
            onClick={() => setVoidDialogOpen(true)}
            disabled={isPending}
            size="sm"
            className="text-destructive"
          >
            <Ban className="h-4 w-4 mr-1.5" />
            Void
          </Button>
        )}

        {canDelete && (
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isPending}
            size="sm"
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        )}
      </div>

      {/* Void Dialog */}
      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              This will void invoice {invoice.invoiceNumber}. This action cannot
              be undone. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Reason for voiding…"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoid}
              className="bg-destructive text-destructive-foreground"
            >
              Void Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice {invoice.invoiceNumber}. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
