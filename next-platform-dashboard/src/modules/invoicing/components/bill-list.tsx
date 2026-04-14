"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Bill, BillStatus } from "../types";
import type { BillFilters as BFilters } from "../actions/bill-actions";
import { getBills } from "../actions/bill-actions";
import { AmountDisplay } from "./amount-display";
import {
  BILL_STATUS_CONFIG,
  BILL_STATUS_LABELS,
} from "../lib/invoicing-constants";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  FileStack,
  Search,
} from "lucide-react";

interface BillListProps {
  siteId: string;
}

export function BillList({ siteId }: BillListProps) {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const pageSize = 25;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const filters: BFilters = {};
    if (search) filters.search = search;
    if (statusFilter !== "all") filters.status = statusFilter as BillStatus;

    getBills(siteId, filters, { page, pageSize }).then((res) => {
      if (!cancelled) {
        setBills(res.bills);
        setTotal(res.total);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [siteId, page, search, statusFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const isOverdue = (bill: Bill) => {
    if (bill.status === "paid" || bill.status === "void") return false;
    if (!bill.dueDate) return false;
    return new Date(bill.dueDate) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bills..."
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
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(BILL_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link
          href={`/dashboard/sites/${siteId}/invoicing/bills/new`}
        >
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Bill
          </Button>
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileStack className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bills found</p>
          <p className="text-sm mt-1">
            Create your first bill to track vendor payments.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => {
                const cfg = BILL_STATUS_CONFIG[bill.status] ||
                  BILL_STATUS_CONFIG.draft;
                return (
                  <TableRow
                    key={bill.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(
                        `/dashboard/sites/${siteId}/invoicing/bills/${bill.id}`,
                      )
                    }
                  >
                    <TableCell className="font-medium">
                      {bill.billNumber}
                    </TableCell>
                    <TableCell>
                      {(bill as any).vendor?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${cfg.color} ${cfg.bgColor} border-0`}
                      >
                        {cfg.label}
                      </Badge>
                      {isOverdue(bill) && bill.status !== "overdue" && (
                        <Badge
                          variant="outline"
                          className="ml-1 text-red-700 bg-red-100 border-0 text-xs"
                        >
                          Overdue
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {bill.dueDate
                        ? new Date(bill.dueDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AmountDisplay
                        amount={bill.total}
                        currency={bill.currency}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <AmountDisplay
                        amount={bill.amountDue}
                        currency={bill.currency}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} bill{total !== 1 ? "s" : ""} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
