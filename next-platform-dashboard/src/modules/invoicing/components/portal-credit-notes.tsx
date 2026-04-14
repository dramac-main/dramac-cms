"use client";

/**
 * Portal Credit Notes Component — INV-09
 *
 * Client portal credit note list.
 */

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { getPortalCreditNotes } from "../actions/statement-actions";

interface PortalCreditNotesProps {
  siteId: string;
  clientId: string;
}

export function PortalCreditNotes({
  siteId,
  clientId,
}: PortalCreditNotesProps) {
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getPortalCreditNotes(siteId, clientId, {
          page,
          perPage,
        });
        setCreditNotes(result.creditNotes);
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
        {Array.from({ length: 3 }).map((_, i) => (
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
            Credit Notes{" "}
            {total > 0 && (
              <span className="text-muted-foreground font-normal">
                ({total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {creditNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3" />
              <p className="text-sm">No credit notes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {creditNotes.map((cn: any) => (
                <div
                  key={cn.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cn.credit_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {cn.issue_date}
                        {cn.reason && ` · ${cn.reason}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        cn.status === "fully_applied" ? "default" : "secondary"
                      }
                      className="text-xs capitalize"
                    >
                      {(cn.status || "").replace(/_/g, " ")}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatInvoiceAmount(cn.total || 0, cn.currency)}
                      </p>
                      {(cn.amount_remaining || 0) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Remaining:{" "}
                          {formatInvoiceAmount(
                            cn.amount_remaining,
                            cn.currency,
                          )}
                        </p>
                      )}
                    </div>
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
