"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { getUpcomingGenerations } from "../actions/recurring-actions";
import { calculateNextDate } from "../lib/invoicing-utils";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { RecurringFrequency } from "../types/recurring-types";

interface RecurringSchedulePreviewProps {
  /** Fetch from server for an existing recurring template */
  recurringId?: string;
  count?: number;
  /** Client-side computation mode (for in-form preview) */
  frequency?: RecurringFrequency;
  customIntervalDays?: number | null;
  startDate?: string;
  endDate?: string;
  maxOccurrences?: number | null;
  /** Amount in cents to display next to each date */
  amount?: number;
  currency?: string;
}

export function RecurringSchedulePreview({
  recurringId,
  count = 12,
  frequency,
  customIntervalDays,
  startDate,
  endDate,
  maxOccurrences,
  amount,
  currency = "ZMW",
}: RecurringSchedulePreviewProps) {
  const [serverDates, setServerDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!recurringId);

  // Server-fetch mode
  useEffect(() => {
    if (!recurringId) return;
    let cancelled = false;
    setLoading(true);
    getUpcomingGenerations(recurringId, count)
      .then((d) => {
        if (!cancelled) setServerDates(d);
      })
      .catch(() => {
        if (!cancelled) setServerDates([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recurringId, count]);

  // Client-computed mode (for form preview without a saved template)
  const clientDates = useMemo(() => {
    if (recurringId || !frequency || !startDate) return [];
    const dates: string[] = [];
    let current = startDate;
    for (let i = 0; i < count; i++) {
      if (endDate && current > endDate) break;
      if (maxOccurrences && i >= maxOccurrences) break;
      dates.push(current);
      current = calculateNextDate(
        current,
        frequency,
        customIntervalDays ?? null,
      );
    }
    return dates;
  }, [
    recurringId,
    frequency,
    customIntervalDays,
    startDate,
    endDate,
    maxOccurrences,
    count,
  ]);

  const dates = recurringId ? serverDates : clientDates;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-ZM", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr === today;
  };

  const isPast = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr < today;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Upcoming Generations ({dates.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : dates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming generations scheduled.
          </p>
        ) : (
          <div className="space-y-1.5">
            {dates.map((date, i) => (
              <div
                key={date}
                className="flex items-center justify-between py-1.5 px-2 rounded text-sm hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground w-5 text-right">
                    {i + 1}.
                  </span>
                  <span>{formatDate(date)}</span>
                </span>
                <span className="flex items-center gap-2">
                  {amount != null && amount > 0 && (
                    <span className="text-muted-foreground font-medium">
                      {formatInvoiceAmount(amount, currency)}
                    </span>
                  )}
                  {isToday(date) && (
                    <Badge variant="secondary" className="text-xs">
                      Today
                    </Badge>
                  )}
                  {isPast(date) && !isToday(date) && (
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
