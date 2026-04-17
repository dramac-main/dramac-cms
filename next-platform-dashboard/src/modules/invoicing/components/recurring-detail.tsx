"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pause,
  Play,
  Zap,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  getRecurringInvoice,
  pauseRecurringInvoice,
  resumeRecurringInvoice,
  generateNow,
  deleteRecurringInvoice,
} from "../actions/recurring-actions";
import { RecurringSchedulePreview } from "./recurring-schedule-preview";
import {
  RECURRING_STATUS_CONFIG,
  RECURRING_FREQUENCY_LABELS,
  INVOICE_STATUS_CONFIG,
} from "../lib/invoicing-constants";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type {
  RecurringInvoice,
  RecurringLineItem,
  RecurringStatus,
  RecurringFrequency,
} from "../types/recurring-types";
import type { Invoice, InvoiceStatus } from "../types/invoice-types";
import { toast } from "sonner";

interface RecurringDetailProps {
  siteId: string;
  recurringId: string;
}

export function RecurringDetail({ siteId, recurringId }: RecurringDetailProps) {
  const router = useRouter();
  const [recurring, setRecurring] = useState<
    | (RecurringInvoice & {
        lineItems: RecurringLineItem[];
        generatedInvoices: Invoice[];
      })
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const base = `/dashboard/sites/${siteId}/invoicing`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRecurringInvoice(recurringId)
      .then((data) => {
        if (!cancelled) setRecurring(data);
      })
      .catch(() => {
        if (!cancelled) setRecurring(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recurringId]);

  const reload = () => {
    getRecurringInvoice(recurringId)
      .then(setRecurring)
      .catch(() => null);
  };

  const handlePause = async () => {
    setActionLoading("pause");
    try {
      await pauseRecurringInvoice(recurringId);
      reload();
    } catch {
      toast.error("Failed to pause recurring invoice");
    } finally {
      setActionLoading("");
    }
  };

  const handleResume = async () => {
    setActionLoading("resume");
    try {
      await resumeRecurringInvoice(recurringId);
      reload();
    } catch {
      toast.error("Failed to resume recurring invoice");
    } finally {
      setActionLoading("");
    }
  };

  const handleGenerate = async () => {
    setActionLoading("generate");
    try {
      const invoice = await generateNow(recurringId);
      reload();
      router.push(`${base}/invoices/${invoice.id}`);
    } catch {
      toast.error("Failed to generate invoice");
      reload();
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Delete this recurring invoice? Generated invoices will not be deleted.",
      )
    )
      return;
    setActionLoading("delete");
    try {
      await deleteRecurringInvoice(recurringId);
      router.push(`${base}/recurring`);
    } catch {
      toast.error("Failed to delete recurring invoice");
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!recurring) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Recurring invoice not found.
      </div>
    );
  }

  const r = recurring;
  const status = r.status as RecurringStatus;
  const statusCfg = RECURRING_STATUS_CONFIG[status];
  const freq =
    RECURRING_FREQUENCY_LABELS[
      (r.frequency as RecurringFrequency) || "monthly"
    ] || r.frequency;
  const isActive = status === "active";
  const isPaused = status === "paused";
  const canGenerate = status === "active" || status === "paused";

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-ZM", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`${base}/recurring`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{r.name}</h2>
              {statusCfg && (
                <Badge className={`${statusCfg.bgColor} ${statusCfg.color}`}>
                  {statusCfg.label}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {r.clientName} · {freq}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              disabled={!!actionLoading}
            >
              {actionLoading === "pause" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Pause className="h-4 w-4 mr-1" />
              )}
              Pause
            </Button>
          )}
          {isPaused && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResume}
              disabled={!!actionLoading}
            >
              {actionLoading === "resume" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Resume
            </Button>
          )}
          {canGenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={!!actionLoading}
            >
              {actionLoading === "generate" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-1" />
              )}
              Generate Now
            </Button>
          )}
          {(isActive || isPaused) && (
            <Link href={`${base}/recurring/${recurringId}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={!!actionLoading}
          >
            {actionLoading === "delete" ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Settings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Frequency</span>
                  <p className="font-medium">{freq}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Start Date</span>
                  <p className="font-medium">{formatDate(r.startDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">End Date</span>
                  <p className="font-medium">{formatDate(r.endDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Next Generation</span>
                  <p className="font-medium">
                    {formatDate(r.nextGenerateDate)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Generated / Max</span>
                  <p className="font-medium">
                    {r.occurrencesGenerated ?? 0}
                    {r.maxOccurrences ? ` / ${r.maxOccurrences}` : " / ∞"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Auto-Send</span>
                  <p className="font-medium">{r.autoSend ? "Yes" : "No"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Terms</span>
                  <p className="font-medium">
                    Net {r.paymentTermsDays ?? 30} days
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Template Total</span>
                  <p className="font-medium font-mono">
                    {formatInvoiceAmount(r.total, r.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.lineItems.map((li) => (
                    <TableRow key={li.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{li.name}</p>
                          {li.description && (
                            <p className="text-sm text-muted-foreground">
                              {li.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {li.quantity}
                        {li.unit ? ` ${li.unit}` : ""}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatInvoiceAmount(li.unitPrice, r.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatInvoiceAmount(
                          Math.round(
                            (Number(li.quantity) || 1) * (li.unitPrice || 0),
                          ),
                          r.currency,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Generated Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Generated Invoices ({r.generatedInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {r.generatedInvoices.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No invoices generated yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {r.generatedInvoices.map((inv) => {
                      const invStatus = (inv.status || "") as InvoiceStatus;
                      const invCfg = INVOICE_STATUS_CONFIG[invStatus];
                      return (
                        <TableRow key={inv.id}>
                          <TableCell>
                            <Link
                              href={`${base}/invoices/${inv.id}`}
                              className="font-medium hover:underline"
                            >
                              {inv.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{formatDate(inv.issueDate)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatInvoiceAmount(inv.total, inv.currency)}
                          </TableCell>
                          <TableCell>
                            {invCfg && (
                              <Badge
                                variant="secondary"
                                className={`${invCfg.bgColor} ${invCfg.color}`}
                              >
                                {invCfg.label}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <RecurringSchedulePreview recurringId={recurringId} />

          {/* Notes */}
          {(r.notes || r.terms) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Notes & Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {r.notes && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Notes</p>
                    <p>{r.notes}</p>
                  </div>
                )}
                {r.terms && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Terms</p>
                    <p>{r.terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
