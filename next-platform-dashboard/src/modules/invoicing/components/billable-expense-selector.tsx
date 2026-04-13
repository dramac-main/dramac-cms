"use client";

import { useState, useEffect, useTransition } from "react";
import type { Expense } from "../types/expense-types";
import { getExpenses, convertToInvoiceItem } from "../actions/expense-actions";
import { AmountDisplay } from "./amount-display";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";

interface BillableExpenseSelectorProps {
  siteId: string;
  invoiceId: string;
  contactId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConverted?: () => void;
}

export function BillableExpenseSelector({
  siteId,
  invoiceId,
  contactId,
  open,
  onOpenChange,
  onConverted,
}: BillableExpenseSelectorProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(new Set());
    getExpenses(
      siteId,
      {
        isBillable: true,
        status: "approved",
      },
      { page: 1, pageSize: 100 },
    )
      .then(({ expenses: data }) => {
        // Filter to only unbilled expenses
        setExpenses(data.filter((e) => !e.isBilled));
      })
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false));
  }, [open, siteId, contactId]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === expenses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(expenses.map((e) => e.id)));
    }
  }

  function handleConvert() {
    if (selected.size === 0) {
      toast.error("Select at least one expense");
      return;
    }

    startTransition(async () => {
      let successCount = 0;
      let errorCount = 0;

      try {
        await convertToInvoiceItem(Array.from(selected), invoiceId);
        successCount = selected.size;
      } catch {
        errorCount = selected.size;
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} expense${successCount > 1 ? "s" : ""} added to invoice`,
        );
      }
      if (errorCount > 0) {
        toast.error(
          `${errorCount} expense${errorCount > 1 ? "s" : ""} failed to convert`,
        );
      }

      onOpenChange(false);
      onConverted?.();
    });
  }

  const selectedTotal = expenses
    .filter((e) => selected.has(e.id))
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Billable Expenses</DialogTitle>
          <DialogDescription>
            Select approved billable expenses to add as line items to this
            invoice.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No unbilled billable expenses found.</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === expenses.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow
                    key={exp.id}
                    className="cursor-pointer"
                    onClick={() => toggleSelect(exp.id)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(exp.id)}
                        onCheckedChange={() => toggleSelect(exp.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{exp.description}</span>
                      {exp.category && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {exp.category.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(exp.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AmountDisplay
                        amount={exp.amount}
                        currency={exp.currency}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {selected.size > 0 && (
              <>
                {selected.size} selected &middot;{" "}
                <AmountDisplay amount={selectedTotal} currency="ZMW" />
              </>
            )}
          </div>
          <Button
            onClick={handleConvert}
            disabled={isPending || selected.size === 0}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Add to Invoice ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
