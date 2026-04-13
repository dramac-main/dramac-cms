"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Invoice, InvoiceStatus } from "../types";
import type { InvoiceFilters as IFilters } from "../actions/invoice-actions";
import { getInvoices } from "../actions/invoice-actions";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { AmountDisplay } from "./amount-display";
import { InvoiceFilters } from "./invoice-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { daysUntilDue } from "../lib/invoicing-utils";

interface InvoiceListProps {
  siteId: string;
}

export function InvoiceList({ siteId }: InvoiceListProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<IFilters>({});
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  useEffect(() => {
    setLoading(true);
    getInvoices(siteId, filters, { page, pageSize })
      .then(({ invoices: data, total: count }) => {
        setInvoices(data);
        setTotal(count);
      })
      .catch(() => {
        setInvoices([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [siteId, filters, page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Invoices</h2>
          <p className="text-sm text-muted-foreground">
            {total} invoice{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/sites/${siteId}/invoicing/invoices/new`}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <InvoiceFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  No invoices found.{" "}
                  <Link
                    href={`/dashboard/sites/${siteId}/invoicing/invoices/new`}
                    className="text-primary underline"
                  >
                    Create your first invoice
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => {
                const dueDays = daysUntilDue(inv.dueDate);
                return (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/dashboard/sites/${siteId}/invoicing/invoices/${inv.id}`,
                      )
                    }
                  >
                    <TableCell className="font-medium">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{inv.clientName}</span>
                        {inv.clientEmail && (
                          <span className="text-xs text-muted-foreground block">
                            {inv.clientEmail}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge
                        status={inv.status as InvoiceStatus}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.issueDate}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          dueDays < 0 &&
                          inv.status !== "paid" &&
                          inv.status !== "void"
                            ? "text-red-600 font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {inv.dueDate}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AmountDisplay
                        amount={inv.total}
                        currency={inv.currency}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <AmountDisplay
                        amount={inv.amountDue}
                        currency={inv.currency}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
