"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, ExternalLink, Eye } from "lucide-react";
import type { PortalPaymentProof } from "@/lib/portal/commerce-data-access";
import {
  approvePaymentProofAction,
  rejectPaymentProofAction,
  bulkReviewPaymentProofsAction,
  signPaymentProofUrlAction,
} from "@/lib/portal/actions/payment-proofs-actions";
import { fromCents } from "@/lib/money";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(fromCents(cents));
}

function statusVariant(status: PortalPaymentProof["status"]) {
  if (status === "approved") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  return "secondary" as const;
}

export function PaymentProofsQueue({
  siteId,
  proofs,
  activeStatus,
}: {
  siteId: string;
  proofs: PortalPaymentProof[];
  activeStatus: StatusFilter;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<PortalPaymentProof | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleAll = () => {
    if (selected.size === proofs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(proofs.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onApprove = (id: string) => {
    startTransition(async () => {
      const res = await approvePaymentProofAction(siteId, id);
      if (res.ok) {
        toast.success("Payment proof approved");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onReject = () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      toast.error("Reason must be at least 3 characters");
      return;
    }
    startTransition(async () => {
      const res = await rejectPaymentProofAction(siteId, rejectTarget.id, reason);
      if (res.ok) {
        toast.success("Payment proof rejected");
        setRejectTarget(null);
        setRejectReason("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onBulkApprove = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(async () => {
      const res = await bulkReviewPaymentProofsAction(siteId, ids, {
        status: "approved",
      });
      if (res.ok) {
        toast.success(
          `Approved ${res.succeeded}${res.failed.length ? ` · ${res.failed.length} failed` : ""}`,
        );
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onBulkReject = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const reason = bulkReason.trim();
    if (reason.length < 3) {
      toast.error("Reason must be at least 3 characters");
      return;
    }
    startTransition(async () => {
      const res = await bulkReviewPaymentProofsAction(siteId, ids, {
        status: "rejected",
        reason,
      });
      if (res.ok) {
        toast.success(
          `Rejected ${res.succeeded}${res.failed.length ? ` · ${res.failed.length} failed` : ""}`,
        );
        setSelected(new Set());
        setBulkRejectOpen(false);
        setBulkReason("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onPreview = (id: string) => {
    startTransition(async () => {
      const res = await signPaymentProofUrlAction(siteId, id);
      if (res.ok) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Payment Proofs</CardTitle>
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/portal/sites/${siteId}/payment-proofs?status=${tab.key}`}
              scroll={false}
            >
              <Badge
                variant={activeStatus === tab.key ? "default" : "outline"}
                className="cursor-pointer"
              >
                {tab.label}
              </Badge>
            </Link>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3">
            <span className="text-sm font-medium">
              {selected.size} selected
            </span>
            <Button
              size="sm"
              onClick={onBulkApprove}
              disabled={isPending}
            >
              <Check className="mr-1 h-4 w-4" /> Approve all
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkRejectOpen(true)}
              disabled={isPending}
            >
              <X className="mr-1 h-4 w-4" /> Reject all
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        {proofs.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No payment proofs in this tab.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      selected.size === proofs.length && proofs.length > 0
                    }
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proofs.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggleOne(p.id)}
                      aria-label={`Select ${p.orderNumber ?? p.id}`}
                      disabled={p.status !== "pending"}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/portal/sites/${siteId}/orders?order=${p.orderId}`}
                      className="flex items-center gap-1 font-medium hover:underline"
                    >
                      {p.orderNumber ?? p.orderId.slice(0, 8)}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{p.customerName ?? "—"}</div>
                    {p.customerEmail && (
                      <div className="text-xs text-muted-foreground">
                        {p.customerEmail}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.submittedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatAmount(p.amountCents, p.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                    {p.status === "rejected" && p.reason && (
                      <div
                        className="mt-1 max-w-xs truncate text-xs text-muted-foreground"
                        title={p.reason}
                      >
                        {p.reason}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPreview(p.id)}
                        disabled={isPending}
                        aria-label="Preview proof"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {p.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onApprove(p.id)}
                            disabled={isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRejectTarget(p);
                              setRejectReason("");
                            }}
                            disabled={isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(v) => !v && setRejectTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject payment proof</DialogTitle>
            <DialogDescription>
              Order {rejectTarget?.orderNumber ?? ""} — the customer will be
              notified with your reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (shared with customer)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onReject}
              disabled={isPending || rejectReason.trim().length < 3}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkRejectOpen} onOpenChange={setBulkRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selected.size} payment proofs</DialogTitle>
            <DialogDescription>
              This reason will be applied to every selected proof and shared
              with customers.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection"
            value={bulkReason}
            onChange={(e) => setBulkReason(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkRejectOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onBulkReject}
              disabled={isPending || bulkReason.trim().length < 3}
            >
              Reject all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
