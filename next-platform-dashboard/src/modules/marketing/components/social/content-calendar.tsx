/**
 * Content Calendar
 *
 * Phase MKT-12: Social Media Integration
 *
 * Unified marketing calendar showing email campaigns, social posts,
 * blog posts, and sequence emails in a month/week view.
 */
"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Share2,
  FileText,
  Zap,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { getCalendarEvents } from "@/modules/marketing/actions/social-actions";
import type {
  CalendarEvent,
  CalendarEventType,
} from "@/modules/marketing/types/social-types";

interface ContentCalendarProps {
  siteId: string;
}

const EVENT_TYPE_CONFIG: Record<
  CalendarEventType,
  { label: string; icon: React.ElementType; className: string }
> = {
  campaign: {
    label: "Campaign",
    icon: Mail,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  social: {
    label: "Social",
    icon: Share2,
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  blog: {
    label: "Blog",
    icon: FileText,
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  sequence: {
    label: "Sequence",
    icon: Zap,
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  landing_page: {
    label: "Landing Page",
    icon: FileText,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function ContentCalendar({ siteId }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"month" | "week">("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(() => {
    startTransition(async () => {
      try {
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
        const data = await getCalendarEvents(siteId, startDate, endDate);
        setEvents(data);
      } catch {
        // Silently fail — calendar shows empty
      }
    });
  }, [siteId, year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function navigateMonth(direction: -1 | 1) {
    setCurrentDate(new Date(year, month + direction, 1));
  }

  function getEventsForDay(day: number): CalendarEvent[] {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month &&
        eventDate.getDate() === day
      );
    });
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">{monthName}</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          {(
            Object.entries(EVENT_TYPE_CONFIG) as [
              CalendarEventType,
              (typeof EVENT_TYPE_CONFIG)[CalendarEventType],
            ][]
          ).map(([type, config]) => (
            <div key={type} className="flex items-center gap-1 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    type === "campaign"
                      ? "#3B82F6"
                      : type === "social"
                        ? "#22C55E"
                        : type === "blog"
                          ? "#A855F7"
                          : type === "sequence"
                            ? "#F97316"
                            : "#6B7280",
                }}
              />
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Day names */}
          <div className="grid grid-cols-7 border-b">
            {dayNames.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[100px] border-b border-r p-1 bg-muted/30"
              />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const cellIndex = firstDay + i;

              return (
                <div
                  key={day}
                  className={`min-h-[100px] border-b border-r p-1 ${
                    isToday(day) ? "bg-primary/5" : ""
                  } ${cellIndex % 7 === 0 || cellIndex % 7 === 6 ? "bg-muted/20" : ""}`}
                >
                  <div
                    className={`text-xs font-medium mb-1 ${
                      isToday(day)
                        ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                        : "text-muted-foreground px-1"
                    }`}
                  >
                    {day}
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => {
                      const config = EVENT_TYPE_CONFIG[event.type];
                      return (
                        <Link
                          key={event.id}
                          href={event.link}
                          className={`block rounded px-1 py-0.5 text-xs truncate ${config.className} hover:opacity-80 transition-opacity`}
                        >
                          {event.title}
                        </Link>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-xs text-muted-foreground px-1">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty cells to fill the grid */}
            {Array.from({
              length: (7 - ((firstDay + daysInMonth) % 7)) % 7,
            }).map((_, i) => (
              <div
                key={`end-${i}`}
                className="min-h-[100px] border-b border-r p-1 bg-muted/30"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
