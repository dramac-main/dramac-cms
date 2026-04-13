"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CreditNote, CreditNoteStatus } from "../types/credit-types";
import {
  getCreditNotes,
  type CreditNoteFilters,
} from "../actions/credit-actions";
import { CreditStatusBadge } from "./credit-status-badge";
import { AmountDisplay } from "./amount-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { CREDIT_NOTE_STATUS_LABELS } from "../lib/invoicing-constants";

interface CreditListProps {
  siteId: string;
}

export function CreditList({ siteId }: CreditListProps) {
  const router = useRouter();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CreditNoteFilters>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  useEffect(() => {
    setLoading(true);
    getCreditNotes(siteId, filters, { page, pageSize })
      .then(({ creditNotes: data, total: count }) => {
        setCreditNotes(data);
        setTotal(count);
      })
      .catch(() => {
        setCreditNotes([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [siteId, filters, page]);

  const totalPages = Math.ceil(total / pageSize);

  function handleSearch() {
    setPage(1);
    setFilters((prev) => ({ ...prev, search: search || undefined }));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Credit Notes</h2>
          <p className="text-sm text-muted-foreground">
            {total} credit note{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/sites/${siteId}/invoicing/credits/new`}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Credit Note
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by number or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-8"
          />
        </div>
        <Select
          value={filters.status || "all"}
          onValueChange={(v) => {
            setPage(1);
            setFilters((prev) => ({
              ...prev,
              status: v === "all" ? undefined : (v as CreditNoteStatus),
            }));
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(CREDIT_NOTE_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Credit #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Applied</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
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
            ) : creditNotes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  No credit notes found.{" "}
                  <Link
                    href={`/dashboard/sites/${siteId}/invoicing/credits/new`}
                    className="text-primary underline"
                  >
                    Create your first credit note
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              creditNotes.map((cn) => (
                <TableRow
                  key={cn.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/sites/${siteId}/invoicing/credits/${cn.id}`,
                    )
                  }
                >
                  <TableCell className="font-medium">
                    {cn.creditNumber}
                  </TableCell>
                  <TableCell>{cn.clientName}</TableCell>
                  <TableCell>
                    <CreditStatusBadge status={cn.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(cn.issueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <AmountDisplay amount={cn.total} currency={cn.currency} />
                  </TableCell>
                  <TableCell className="text-right">
                    <AmountDisplay amount={cn.amountApplied} currency={cn.currency} />
                  </TableCell>
                  <TableCell className="text-right">
                    <AmountDisplay amount={cn.amountRemaining} currency={cn.currency} />
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
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
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
