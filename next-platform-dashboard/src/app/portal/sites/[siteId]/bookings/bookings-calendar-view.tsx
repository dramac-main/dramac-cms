"use client";

/**
 * Portal Bookings — month-grid calendar view.
 *
 * Renders a month calendar with appointment dots/labels per day. Clicking
 * a day opens a popover-list of that day's bookings; clicking a booking
 * navigates to its detail page. Pure presentation — receives the same
 * `bookings` array used by `BookingsListClient`.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PortalStatusPill } from "@/components/portal/patterns/portal-status-pill";
import type { PortalBookingListItem } from "@/lib/portal/commerce-data-access";
import { formatPortalCurrency } from "@/lib/portal/format";

interface Props {
  siteId: string;
  bookings: PortalBookingListItem[];
  initialMonth?: string; // YYYY-MM
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function buildGrid(reference: Date) {
  const first = startOfMonth(reference);
  const last = endOfMonth(reference);
  const start = new Date(first);
  start.setDate(start.getDate() - first.getDay()); // back to Sunday
  const cells: Date[] = [];
  const cursor = new Date(start);
  // 6 rows × 7 cols = 42 cells
  for (let i = 0; i < 42; i += 1) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return { cells, first, last };
}

export function BookingsCalendarView({ siteId, bookings, initialMonth }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const initialDate = useMemo(() => {
    if (initialMonth && /^\d{4}-\d{2}$/.test(initialMonth)) {
      const [y, m] = initialMonth.split("-").map((s) => parseInt(s, 10));
      return new Date(y, m - 1, 1);
    }
    return startOfMonth(new Date());
  }, [initialMonth]);

  const [reference, setReference] = useState<Date>(initialDate);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { cells, first, last } = useMemo(
    () => buildGrid(reference),
    [reference],
  );

  // Bucket bookings by YYYY-MM-DD (in local TZ)
  const byDay = useMemo(() => {
    const map = new Map<string, PortalBookingListItem[]>();
    for (const b of bookings) {
      const t = Date.parse(b.startsAt);
      if (!Number.isFinite(t)) continue;
      const key = ymd(new Date(t));
      const arr = map.get(key);
      if (arr) arr.push(b);
      else map.set(key, [b]);
    }
    // sort within each day by time
    for (const arr of map.values()) {
      arr.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    }
    return map;
  }, [bookings]);

  const todayKey = ymd(new Date());
  const monthLabel = reference.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  function navigateMonth(delta: number) {
    setSelectedDay(null);
    setReference(
      new Date(reference.getFullYear(), reference.getMonth() + delta, 1),
    );
  }

  function switchToList() {
    const params = new URLSearchParams(sp?.toString() ?? "");
    params.delete("view");
    router.push(`/portal/sites/${siteId}/bookings?${params.toString()}`);
  }

  const selectedBookings = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigateMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedDay(null);
                setReference(startOfMonth(new Date()));
              }}
            >
              Today
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigateMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="ml-2 text-lg font-semibold">{monthLabel}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              {bookings.length} this view
            </Badge>
            <Button size="sm" variant="outline" onClick={switchToList}>
              <List className="mr-1.5 h-3.5 w-3.5" />
              List view
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const key = ymd(d);
            const inMonth =
              d.getMonth() === reference.getMonth() &&
              d.getFullYear() === reference.getFullYear();
            const dayBookings = byDay.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;
            return (
              <button
                type="button"
                key={key}
                onClick={() =>
                  setSelectedDay(dayBookings.length ? key : null)
                }
                className={cn(
                  "min-h-22 border-b border-r p-1.5 text-left text-xs transition-colors",
                  inMonth ? "bg-background" : "bg-muted/30",
                  !inMonth && "text-muted-foreground",
                  isSelected && "ring-2 ring-primary ring-inset",
                  dayBookings.length > 0 && "hover:bg-accent/40 cursor-pointer",
                  dayBookings.length === 0 && "cursor-default",
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium tabular-nums text-primary">
                      {dayBookings.length}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] leading-tight text-primary"
                      title={`${new Date(b.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} — ${b.customerName ?? "Customer"}`}
                    >
                      {new Date(b.startsAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      {b.customerName ?? "Customer"}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{dayBookings.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected day detail */}
      {selectedDay && selectedBookings.length > 0 && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">
              {new Date(selectedDay).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedDay(null)}
            >
              Close
            </Button>
          </div>
          <div className="divide-y">
            {selectedBookings.map((b) => {
              const start = new Date(b.startsAt);
              const end = new Date(b.endsAt);
              return (
                <Link
                  key={b.id}
                  href={`/portal/sites/${siteId}/bookings/${b.id}`}
                  className="flex items-start justify-between gap-3 py-3 hover:bg-accent/40 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium tabular-nums">
                        {start.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {" – "}
                        {end.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <PortalStatusPill status={b.status} />
                    </div>
                    <div className="mt-1 text-sm">
                      {b.customerName ?? "Walk-in"}
                      {b.serviceName ? (
                        <span className="text-muted-foreground">
                          {" • "}
                          {b.serviceName}
                        </span>
                      ) : null}
                    </div>
                    {b.staffName && (
                      <div className="text-xs text-muted-foreground">
                        with {b.staffName}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    {b.priceCents > 0
                      ? formatPortalCurrency(b.priceCents, b.currency)
                      : ""}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
