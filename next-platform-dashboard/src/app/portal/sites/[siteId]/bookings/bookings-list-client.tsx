"use client";

/**
 * Portal Bookings — list client (Session 6A).
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
import { CalendarClock, ArrowRight } from "lucide-react";
import { PortalStatusPill } from "@/components/portal/patterns/portal-status-pill";
import { PortalEmptyState } from "@/components/portal/patterns/portal-empty-state";
import type { PortalBookingListItem } from "@/lib/portal/commerce-data-access";
import { formatPortalCurrency, formatPortalDate } from "@/lib/portal/format";

interface Props {
  siteId: string;
  bookings: PortalBookingListItem[];
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  activeStatus: string;
  activeFrom: string;
  activeTo: string;
}

const BOOKING_STATUSES = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
] as const;

export function BookingsListClient({
  siteId,
  bookings,
  currentPage,
  pageSize,
  hasMore,
  activeStatus,
  activeFrom,
  activeTo,
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
      router.push(`/portal/sites/${siteId}/bookings?${params.toString()}`);
    });
  }

  function onDateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    push({
      from: String(form.get("from") ?? "") || null,
      to: String(form.get("to") ?? "") || null,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <form
          onSubmit={onDateSubmit}
          className="flex flex-wrap items-end gap-2"
          aria-label="Filter bookings by date range"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="bk-from"
              className="text-xs text-muted-foreground"
            >
              From
            </label>
            <Input
              id="bk-from"
              name="from"
              type="date"
              defaultValue={activeFrom}
              className="h-9 w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="bk-to" className="text-xs text-muted-foreground">
              To
            </label>
            <Input
              id="bk-to"
              name="to"
              type="date"
              defaultValue={activeTo}
              className="h-9 w-40"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
            Apply
          </Button>
        </form>
        <div className="flex items-center gap-2">
          <label htmlFor="bk-status" className="text-xs text-muted-foreground">
            Status
          </label>
          <Select
            value={activeStatus}
            onValueChange={(v) => push({ status: v })}
          >
            <SelectTrigger id="bk-status" className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOOKING_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All" : s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {bookings.length === 0 ? (
        <PortalEmptyState
          icon={CalendarClock}
          title="No bookings"
          description="Appointments for this site will appear here."
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {bookings.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/portal/sites/${siteId}/bookings/${b.id}`}
                      className="min-w-0 flex-1 underline-offset-4 hover:underline"
                    >
                      <div className="truncate font-medium">
                        {b.serviceName || "Service"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {b.customerName || b.customerEmail || "—"}
                      </div>
                    </Link>
                    <PortalStatusPill status={b.status} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {formatPortalDate(b.startsAt, { withTime: true })}
                    </span>
                    <span className="tabular-nums">
                      {formatPortalCurrency(b.priceCents, b.currency)}
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
                  <TableHead>Service</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="w-10 sr-only">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Link
                        href={`/portal/sites/${siteId}/bookings/${b.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {b.serviceName || "—"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="truncate">{b.customerName || "—"}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {b.customerEmail || b.customerPhone || ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{b.staffName || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {formatPortalDate(b.startsAt, { withTime: true })}
                    </TableCell>
                    <TableCell>
                      <PortalStatusPill status={b.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPortalCurrency(b.priceCents, b.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/portal/sites/${siteId}/bookings/${b.id}`}
                          aria-label={`Open booking`}
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
