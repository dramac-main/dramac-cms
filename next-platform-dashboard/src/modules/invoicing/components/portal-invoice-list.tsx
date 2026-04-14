"use client";

/**
 * Portal Invoice List Component — INV-09
 *
 * Client portal invoice list with search and status filter.
 */

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { getPortalInvoices } from "../actions/statement-actions";

interface PortalInvoiceListProps {
  siteId: string;
  clientId: string;
}

export function PortalInvoiceList({
  siteId,
  clientId,
}: PortalInvoiceListProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const perPage = 20;

  const loadInvoices = (p: number, s: string, status: string) => {
    startTransition(async () => {
      try {
        const filters: { status?: string; search?: string } = {};
        if (status !== "all") filters.status = status;
        if (s.trim()) filters.search = s.trim();

        const result = await getPortalInvoices(siteId, clientId, filters, {
          page: p,
          perPage,
        });
        setInvoices(result.invoices);
        setTotal(result.total);
      } catch {
        // Silent fail
      }
    });
  };

  useEffect(() => {
    loadInvoices(page, search, statusFilter);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    loadInvoices(1, search, statusFilter);
  };

  const totalPages = Math.ceil(total / perPage);
  const basePath = `/portal/sites/${siteId}/invoicing`;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search invoices..."
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Invoices{" "}
            {total > 0 && (
              <span className="text-muted-foreground font-normal">
                ({total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3" />
              <p className="text-sm">No invoices found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv: any) => (
                <Link
                  key={inv.id}
                  href={`${basePath}/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {inv.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Issued {inv.issue_date} · Due {inv.due_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={inv.status} />
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatInvoiceAmount(inv.total || 0, inv.currency)}
                      </p>
                      {inv.amount_due > 0 && inv.status !== "paid" && (
                        <p className="text-xs text-destructive">
                          Due:{" "}
                          {formatInvoiceAmount(inv.amount_due, inv.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
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

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    paid: "default",
    partial: "secondary",
    sent: "outline",
    viewed: "outline",
    overdue: "destructive",
  };
  return (
    <Badge
      variant={variants[status] || "secondary"}
      className="text-xs capitalize"
    >
      {status}
    </Badge>
  );
}
