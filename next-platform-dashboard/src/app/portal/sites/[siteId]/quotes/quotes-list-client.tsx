"use client";

/**
 * Portal Quotes — list client (Session 6A).
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";
import { PortalStatusPill } from "@/components/portal/patterns/portal-status-pill";
import { PortalEmptyState } from "@/components/portal/patterns/portal-empty-state";
import type { PortalQuoteListItem } from "@/lib/portal/commerce-data-access";
import {
  formatPortalCurrency,
  formatPortalRelative,
  formatPortalDate,
} from "@/lib/portal/format";

interface Props {
  siteId: string;
  quotes: PortalQuoteListItem[];
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  activeStatus: string;
  activeSearch: string;
}

const QUOTE_STATUSES = [
  "all",
  "draft",
  "pending_approval",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "converted",
  "cancelled",
] as const;

export function QuotesListClient({
  siteId,
  quotes,
  currentPage,
  pageSize,
  hasMore,
  activeStatus,
  activeSearch,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function push(next: Record<string, string | null>) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "all") params.delete(k);
      else params.set(k, v);
    }
    if (!("page" in next)) params.delete("page");
    startTransition(() => {
      router.push(`/portal/sites/${siteId}/quotes?${params.toString()}`);
    });
  }

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const q = String(form.get("q") ?? "").trim();
    push({ q: q || null });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form
          onSubmit={onSearchSubmit}
          className="flex w-full gap-2 md:max-w-sm"
          role="search"
          aria-label="Search quotes"
        >
          <Input
            name="q"
            defaultValue={activeSearch}
            placeholder="Quote number, customer…"
            aria-label="Search quotes"
            className="h-9"
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={isPending}
          >
            Search
          </Button>
        </form>
        <div className="flex items-center gap-2">
          <label
            htmlFor="quote-status"
            className="text-xs text-muted-foreground"
          >
            Status
          </label>
          <Select
            value={activeStatus}
            onValueChange={(v) => push({ status: v })}
          >
            <SelectTrigger id="quote-status" className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUOTE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All" : s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {quotes.length === 0 ? (
        <PortalEmptyState
          icon={FileText}
          title="No quotes"
          description="Quotes you create or receive will appear here."
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {quotes.map((q) => (
              <Card key={q.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/portal/sites/${siteId}/quotes/${q.id}`}
                      className="min-w-0 flex-1 underline-offset-4 hover:underline"
                    >
                      <div className="truncate font-mono text-sm">
                        {q.quoteNumber}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {q.customerName || q.customerEmail}
                      </div>
                    </Link>
                    <PortalStatusPill status={q.status} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {q.validUntil
                        ? `Valid until ${formatPortalDate(q.validUntil)}`
                        : q.createdAt
                          ? formatPortalRelative(q.createdAt)
                          : "—"}
                    </span>
                    <span className="tabular-nums">
                      {formatPortalCurrency(q.totalCents, q.currency)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10 sr-only">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => (
                  <TableRow key={q.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Link
                        href={`/portal/sites/${siteId}/quotes/${q.id}`}
                        className="font-mono text-xs underline-offset-4 hover:underline"
                      >
                        {q.quoteNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="truncate">{q.customerName || "—"}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {q.customerEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PortalStatusPill status={q.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPortalCurrency(q.totalCents, q.currency)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {q.validUntil ? formatPortalDate(q.validUntil) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {q.createdAt ? formatPortalRelative(q.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/portal/sites/${siteId}/quotes/${q.id}`}
                          aria-label={`Open ${q.quoteNumber}`}
                        >
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {(currentPage > 1 || hasMore) && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">Page {currentPage}</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() =>
                push({
                  page: currentPage <= 2 ? null : String(currentPage - 1),
                })
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore || isPending}
              onClick={() => push({ page: String(currentPage + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
