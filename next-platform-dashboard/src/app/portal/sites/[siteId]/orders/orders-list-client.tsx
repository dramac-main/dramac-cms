"use client";

/**
 * Portal Orders — list client component.
 *
 * Mobile-first. Cards on xs; responsive table from md up. Filters +
 * search + pagination are driven through URL search params (RSC reload)
 * so filter state is sharable and survives refresh.
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
import { PortalStatusPill } from "@/components/portal/patterns/portal-status-pill";
import { PortalEmptyState } from "@/components/portal/patterns/portal-empty-state";
import { ShoppingCart, ArrowRight } from "lucide-react";
import type { PortalOrderListItem } from "@/lib/portal/commerce-data-access";
import {
  formatPortalCurrency,
  formatPortalRelative,
} from "@/lib/portal/format";

const ORDER_STATUSES = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const PAYMENT_STATUSES = [
  "all",
  "pending",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
] as const;

interface Props {
  siteId: string;
  orders: PortalOrderListItem[];
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  activeStatus: string;
  activePaymentStatus: string;
  activeSearch: string;
}

export function OrdersListClient({
  siteId,
  orders,
  currentPage,
  pageSize,
  hasMore,
  activeStatus,
  activePaymentStatus,
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
    // Reset page when filters change (except explicit page updates).
    if (!("page" in next)) params.delete("page");
    startTransition(() => {
      router.push(`/portal/sites/${siteId}/orders?${params.toString()}`);
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
      {/* Filter bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form
          onSubmit={onSearchSubmit}
          className="flex w-full gap-2 md:max-w-sm"
          role="search"
          aria-label="Search orders"
        >
          <Input
            name="q"
            defaultValue={activeSearch}
            placeholder="Search order # or customer…"
            aria-label="Search orders"
            className="h-9"
          />
          <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
            Search
          </Button>
        </form>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs text-muted-foreground">
              Status
            </label>
            <Select
              value={activeStatus}
              onValueChange={(v) => push({ status: v })}
            >
              <SelectTrigger id="status-filter" className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="payment-filter" className="text-xs text-muted-foreground">
              Payment
            </label>
            <Select
              value={activePaymentStatus}
              onValueChange={(v) => push({ paymentStatus: v })}
            >
              <SelectTrigger id="payment-filter" className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All payments" : s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <PortalEmptyState
          icon={ShoppingCart}
          title="No orders"
          description={
            activeSearch || activeStatus !== "all" || activePaymentStatus !== "all"
              ? "Nothing matches your filters. Adjust or clear them to see more."
              : "Once customers place orders on this site they'll appear here."
          }
        />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-2 md:hidden">
            {orders.map((o) => (
              <OrderCard key={o.id} siteId={siteId} order={o} />
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead className="w-16 text-right sr-only">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/portal/sites/${siteId}/orders/${o.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{o.customerName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.customerEmail ?? ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PortalStatusPill status={o.status} />
                    </TableCell>
                    <TableCell>
                      <PortalStatusPill status={o.paymentStatus ?? "pending"} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {o.itemCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPortalCurrency(o.totalCents, o.currency)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatPortalRelative(o.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/portal/sites/${siteId}/orders/${o.id}`}
                          aria-label={`Open order ${o.orderNumber}`}
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

      {/* Pagination */}
      {(currentPage > 1 || hasMore) && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Page {currentPage}
            {orders.length > 0 ? ` · showing ${orders.length} of up to ${pageSize}` : ""}
          </div>
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

function OrderCard({ siteId, order }: { siteId: string; order: PortalOrderListItem }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/portal/sites/${siteId}/orders/${order.id}`}
              className="block font-mono text-sm font-medium underline-offset-4 hover:underline"
            >
              {order.orderNumber}
            </Link>
            <div className="mt-0.5 truncate text-sm">
              {order.customerName ?? "—"}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {order.customerEmail ?? ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums">
              {formatPortalCurrency(order.totalCents, order.currency)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {formatPortalRelative(order.createdAt)}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <PortalStatusPill status={order.status} />
          <PortalStatusPill status={order.paymentStatus ?? "pending"} />
          <span className="text-xs text-muted-foreground">
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
