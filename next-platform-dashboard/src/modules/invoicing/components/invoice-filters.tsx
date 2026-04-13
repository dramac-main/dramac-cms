"use client";

import { useState } from "react";
import type { InvoiceStatus } from "../types";
import type { InvoiceFilters as IFilters } from "../actions/invoice-actions";
import { INVOICE_STATUS_LABELS } from "../lib/invoicing-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface InvoiceFiltersProps {
  filters: IFilters;
  onFiltersChange: (filters: IFilters) => void;
}

const STATUS_OPTIONS: InvoiceStatus[] = [
  "draft",
  "sent",
  "viewed",
  "partial",
  "paid",
  "overdue",
  "void",
];

export function InvoiceFilters({
  filters,
  onFiltersChange,
}: InvoiceFiltersProps) {
  const [search, setSearch] = useState(filters.search || "");

  const handleSearchSubmit = () => {
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const hasFilters =
    filters.search || filters.status || filters.dateFrom || filters.dateTo;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
          className="pl-9"
        />
      </div>

      <Select
        value={(filters.status as string) || "all"}
        onValueChange={(val) =>
          onFiltersChange({
            ...filters,
            status: val === "all" ? undefined : (val as InvoiceStatus),
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {INVOICE_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={filters.dateFrom || ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            dateFrom: e.target.value || undefined,
          })
        }
        className="w-[150px]"
        placeholder="From date"
      />

      <Input
        type="date"
        value={filters.dateTo || ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            dateTo: e.target.value || undefined,
          })
        }
        className="w-[150px]"
        placeholder="To date"
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            onFiltersChange({});
          }}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
