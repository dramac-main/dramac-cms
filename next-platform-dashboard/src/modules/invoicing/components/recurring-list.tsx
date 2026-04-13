"use client";

import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getRecurringInvoices,
  type RecurringFilters,
  type RecurringPagination,
} from "../actions/recurring-actions";
import {
  RECURRING_STATUS_CONFIG,
  RECURRING_FREQUENCY_LABELS,
} from "../lib/invoicing-constants";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type {
  RecurringInvoice,
  RecurringStatus,
  RecurringFrequency,
} from "../types/recurring-types";

interface RecurringListProps {
  siteId: string;
}

export function RecurringList({ siteId }: RecurringListProps) {
  const [recurring, setRecurring] = useState<RecurringInvoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const filters: RecurringFilters = {};
    if (search) filters.search = search;
    if (statusFilter !== "all")
      filters.status = statusFilter as RecurringStatus;
    if (frequencyFilter !== "all")
      filters.frequency = frequencyFilter as RecurringFrequency;

    const pagination: RecurringPagination = { page, pageSize };

    getRecurringInvoices(siteId, filters, pagination)
      .then((data) => {
        if (!cancelled) {
          setRecurring(data.recurring);
          setTotal(data.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecurring([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [siteId, search, statusFilter, frequencyFilter, page]);

  const totalPages = Math.ceil(total / pageSize);
  const base = `/dashboard/sites/${siteId}/invoicing`;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-ZM", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Recurring Invoices
          </h2>
          <p className="text-muted-foreground">
            Manage auto-billing schedules and recurring templates.
          </p>
        </div>
        <Link href={`${base}/recurring/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Recurring
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or client..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
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
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={frequencyFilter}
              onValueChange={(v) => {
                setFrequencyFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequencies</SelectItem>
                {(
                  Object.entries(RECURRING_FREQUENCY_LABELS) as [
                    RecurringFrequency,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Generated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : recurring.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No recurring invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                recurring.map((r) => {
                  const statusCfg =
                    RECURRING_STATUS_CONFIG[r.status as RecurringStatus];
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link
                          href={`${base}/recurring/${r.id}`}
                          className="font-medium hover:underline"
                        >
                          {r.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {r.clientName || (r as any).client_name}
                      </TableCell>
                      <TableCell>
                        {RECURRING_FREQUENCY_LABELS[
                          (r.frequency as RecurringFrequency) || "monthly"
                        ] || r.frequency}
                      </TableCell>
                      <TableCell>
                        {formatDate(
                          r.nextGenerateDate || (r as any).next_generate_date,
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatInvoiceAmount(r.total, r.currency)}
                      </TableCell>
                      <TableCell>
                        {statusCfg && (
                          <Badge
                            variant="secondary"
                            className={`${statusCfg.bgColor} ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.occurrencesGenerated ??
                          (r as any).occurrences_generated ??
                          0}
                        {r.maxOccurrences || (r as any).max_occurrences
                          ? ` / ${r.maxOccurrences || (r as any).max_occurrences}`
                          : ""}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
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
