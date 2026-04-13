"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Expense, ExpenseStatus } from "../types/expense-types";
import {
  getExpenses,
  type ExpenseFilters,
} from "../actions/expense-actions";
import { ExpenseStatusBadge } from "./expense-status-badge";
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
  Search,
  Receipt,
} from "lucide-react";
import { EXPENSE_STATUS_LABELS } from "../lib/invoicing-constants";

interface ExpenseListProps {
  siteId: string;
}

export function ExpenseList({ siteId }: ExpenseListProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  useEffect(() => {
    setLoading(true);
    getExpenses(siteId, filters, { page, pageSize })
      .then(({ expenses: data, total: count }) => {
        setExpenses(data);
        setTotal(count);
      })
      .catch(() => {
        setExpenses([]);
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
          <h2 className="text-xl font-semibold">Expenses</h2>
          <p className="text-sm text-muted-foreground">
            {total} expense{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/sites/${siteId}/invoicing/expenses/new`}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Expense
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
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
              status: v === "all" ? undefined : (v as ExpenseStatus),
            }));
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(EXPENSE_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={
            filters.isBillable === true
              ? "billable"
              : filters.isBillable === false
                ? "non-billable"
                : "all"
          }
          onValueChange={(v) => {
            setPage(1);
            setFilters((prev) => ({
              ...prev,
              isBillable:
                v === "billable"
                  ? true
                  : v === "non-billable"
                    ? false
                    : undefined,
            }));
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="billable">Billable</SelectItem>
            <SelectItem value="non-billable">Non-Billable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Billable</TableHead>
              <TableHead>Receipt</TableHead>
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
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No expenses found.{" "}
                  <Link
                    href={`/dashboard/sites/${siteId}/invoicing/expenses/new`}
                    className="text-primary underline"
                  >
                    Record your first expense
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((exp) => (
                <TableRow
                  key={exp.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/sites/${siteId}/invoicing/expenses/${exp.id}`,
                    )
                  }
                >
                  <TableCell>
                    <div className="max-w-[300px] truncate font-medium">
                      {exp.description}
                    </div>
                    {exp.expenseNumber && (
                      <span className="text-xs text-muted-foreground">
                        {exp.expenseNumber}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(exp.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ExpenseStatusBadge status={exp.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <AmountDisplay
                      amount={exp.amount}
                      currency={exp.currency}
                    />
                  </TableCell>
                  <TableCell>
                    {exp.isBillable && (
                      <Badge
                        variant="outline"
                        className={
                          exp.isBilled
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                        }
                      >
                        {exp.isBilled ? "Billed" : "Billable"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {exp.receiptUrl && (
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                    )}
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
