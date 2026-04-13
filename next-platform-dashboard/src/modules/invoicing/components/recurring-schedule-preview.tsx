"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { getUpcomingGenerations } from "../actions/recurring-actions";

interface RecurringSchedulePreviewProps {
  recurringId: string;
  count?: number;
}

export function RecurringSchedulePreview({
  recurringId,
  count = 10,
}: RecurringSchedulePreviewProps) {
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUpcomingGenerations(recurringId, count)
      .then((d) => {
        if (!cancelled) setDates(d);
      })
      .catch(() => {
        if (!cancelled) setDates([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recurringId, count]);

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
          Upcoming Generations
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
