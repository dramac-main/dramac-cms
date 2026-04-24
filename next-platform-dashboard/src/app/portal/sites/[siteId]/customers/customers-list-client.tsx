"use client";

/**
 * Portal Customers — list client (Session 6A, read-only).
 */

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { Users, ArrowRight } from "lucide-react";
import { PortalStatusPill } from "@/components/portal/patterns/portal-status-pill";
import { PortalEmptyState } from "@/components/portal/patterns/portal-empty-state";
import type { PortalCustomerListItem } from "@/lib/portal/commerce-data-access";
import {
  formatPortalCurrency,
  formatPortalRelative,
} from "@/lib/portal/format";

interface Props {
  siteId: string;
  customers: PortalCustomerListItem[];
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  activeStatus: string;
  activeSearch: string;
}

const CUSTOMER_STATUSES = ["all", "active", "inactive", "guest"] as const;

export function CustomersListClient({
  siteId,
  customers,
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
      router.push(`/portal/sites/${siteId}/customers?${params.toString()}`);
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
          aria-label="Search customers"
        >
          <Input
            name="q"
            defaultValue={activeSearch}
            placeholder="Name or email…"
            aria-label="Search customers"
            className="h-9"
          />
          <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
            Search
          </Button>
        </form>
        <div className="flex items-center gap-2">
          <label htmlFor="cust-status" className="text-xs text-muted-foreground">
            Status
          </label>
          <Select
            value={activeStatus}
            onValueChange={(v) => push({ status: v })}
          >
            <SelectTrigger id="cust-status" className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOMER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {customers.length === 0 ? (
        <PortalEmptyState
          icon={Users}
          title="No customers"
          description="Customers who check out or sign up will appear here."
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {customers.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/portal/sites/${siteId}/customers/${c.id}`}
                      className="min-w-0 flex-1 underline-offset-4 hover:underline"
                    >
                      <div className="truncate font-medium">
                        {`${c.firstName} ${c.lastName}`.trim() || c.email}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.email}
                      </div>
                    </Link>
                    <PortalStatusPill status={c.status} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{c.ordersCount} orders</span>
                    <span className="tabular-nums">
                      {formatPortalCurrency(c.totalSpentCents, "USD")}
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total spent</TableHead>
                  <TableHead>Last order</TableHead>
                  <TableHead className="w-10 sr-only">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Link
                        href={`/portal/sites/${siteId}/customers/${c.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {`${c.firstName} ${c.lastName}`.trim() || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.email}
                    </TableCell>
                    <TableCell>
                      <PortalStatusPill status={c.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.ordersCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPortalCurrency(c.totalSpentCents, "USD")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.lastOrderAt ? formatPortalRelative(c.lastOrderAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/portal/sites/${siteId}/customers/${c.id}`}
                          aria-label={`Open ${c.email}`}
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
                push({ page: currentPage <= 2 ? null : String(currentPage - 1) })
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
