"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Payment, PaymentMethod } from "../types/payment-types";
import type { PaymentFilters as PFilters } from "../actions/payment-actions";
import { getPayments } from "../actions/payment-actions";
import { PaymentMethodIcon } from "./payment-method-icon";
import { PaymentSummaryCard } from "./payment-summary-card";
import { AmountDisplay } from "./amount-display";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../lib/invoicing-constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface PaymentListProps {
  siteId: string;
}

export function PaymentList({ siteId }: PaymentListProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const pageSize = 25;

  useEffect(() => {
    setLoading(true);
    const filters: PFilters = {};
    if (search) filters.search = search;
    if (methodFilter !== "all") filters.method = methodFilter as PaymentMethod;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    getPayments(siteId, filters, { page, pageSize })
      .then(({ payments: data, total: count }) => {
        setPayments(data);
        setTotal(count);
      })
      .catch(() => {
        setPayments([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [siteId, page, search, methodFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <PaymentSummaryCard siteId={siteId} />

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Payments</h2>
        <p className="text-sm text-muted-foreground">
          {total} payment{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference, notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={methodFilter}
          onValueChange={(v) => {
            setMethodFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="w-[150px]"
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="w-[150px]"
          placeholder="To"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/sites/${siteId}/invoicing/invoices/${p.invoiceId}`,
                    )
                  }
                >
                  <TableCell className="font-medium">
                    {p.paymentNumber || "—"}
                    {p.transactionReference && (
                      <span className="text-xs text-muted-foreground block">
                        Ref: {p.transactionReference}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.type === "refund" ? "destructive" : "secondary"
                      }
                      className="text-xs capitalize"
                    >
                      {p.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.paymentDate}
                  </TableCell>
                  <TableCell>
                    <PaymentMethodIcon
                      method={p.paymentMethod}
                      className="text-sm"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={p.type === "refund" ? "text-red-600" : ""}>
                      {p.type === "refund" ? "-" : ""}
                      <AmountDisplay amount={p.amount} currency={p.currency} />
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {PAYMENT_STATUS_LABELS[p.status] || p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
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
