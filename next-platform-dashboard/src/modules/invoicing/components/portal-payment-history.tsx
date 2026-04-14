"use client";

/**
 * Portal Payment History Component — INV-09
 *
 * Client portal payment list — date, amount, method, invoice reference.
 */

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { getPortalPayments } from "../actions/statement-actions";

interface PortalPaymentHistoryProps {
  siteId: string;
  clientId: string;
}

export function PortalPaymentHistory({
  siteId,
  clientId,
}: PortalPaymentHistoryProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getPortalPayments(siteId, clientId, {
          page,
          perPage,
        });
        setPayments(result.payments);
        setTotal(result.total);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    });
  }, [siteId, clientId, page]);

  const totalPages = Math.ceil(total / perPage);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Payment History{" "}
            {total > 0 && (
              <span className="text-muted-foreground font-normal">
                ({total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-3" />
              <p className="text-sm">No payments recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((pmt: any) => (
                <div
                  key={pmt.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                      <Receipt className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {pmt.payment_number || `Payment`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pmt.payment_date} ·{" "}
                        {(pmt.payment_method || "").replace(/_/g, " ")}
                      </p>
                      {pmt.transaction_reference && (
                        <p className="text-xs text-muted-foreground">
                          Ref: {pmt.transaction_reference}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        pmt.status === "completed" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {pmt.status}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {formatInvoiceAmount(pmt.amount || 0, pmt.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isPending}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isPending}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
