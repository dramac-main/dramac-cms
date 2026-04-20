"use client";

/**
 * DunningTimeline — Escalation history for a single invoice
 *
 * Phase INVFIX-09: Shows the staged dunning progression timeline,
 * including overdue reminders, dunning warnings, final notices, and write-off flags.
 * Uses activity log data from invoiceActivity table.
 */

import { useState, useEffect, useTransition } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Clock,
  FileWarning,
  Ban,
  CheckCircle2,
  Mail,
  Send,
  Pause,
  Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { INV_TABLES } from "../lib/invoicing-constants";

interface DunningEvent {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  oldValue: string | null;
  newValue: string | null;
}

interface DunningTimelineProps {
  invoiceId: string;
  currentStage?: number;
  writeOffFlagged?: boolean;
  dunningPaused?: boolean;
  onSendReminder?: () => Promise<void>;
  onTogglePause?: (paused: boolean) => Promise<void>;
}

const STAGE_CONFIG: Record<
  string,
  { icon: typeof AlertTriangle; color: string; label: string }
> = {
  marked_overdue: {
    icon: Clock,
    color: "text-amber-500",
    label: "Marked Overdue",
  },
  overdue_reminder_sent: {
    icon: Bell,
    color: "text-blue-500",
    label: "Reminder Sent",
  },
  dunning_escalation: {
    icon: AlertTriangle,
    color: "text-orange-500",
    label: "Dunning Escalation",
  },
  late_fee_applied: {
    icon: FileWarning,
    color: "text-red-500",
    label: "Late Fee Applied",
  },
  payment_recorded: {
    icon: CheckCircle2,
    color: "text-green-500",
    label: "Payment Received",
  },
};

const DUNNING_ACTIONS = [
  "marked_overdue",
  "overdue_reminder_sent",
  "dunning_escalation",
  "late_fee_applied",
  "payment_recorded",
];

export function DunningTimeline({
  invoiceId,
  currentStage = 0,
  writeOffFlagged = false,
  dunningPaused = false,
  onSendReminder,
  onTogglePause,
}: DunningTimelineProps) {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [events, setEvents] = useState<DunningEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!siteId || !invoiceId) return;

    const fetchTimeline = async () => {
      setLoading(true);
      const supabase = createClient() as any;
      const { data } = await supabase
        .from(INV_TABLES.invoiceActivity)
        .select("id, action, description, created_at, old_value, new_value")
        .eq("site_id", siteId)
        .eq("entity_id", invoiceId)
        .in("action", DUNNING_ACTIONS)
        .order("created_at", { ascending: true });

      setEvents(
        (data || []).map((row: any) => ({
          id: row.id,
          action: row.action,
          description: row.description,
          createdAt: row.created_at,
          oldValue: row.old_value,
          newValue: row.new_value,
        })),
      );
      setLoading(false);
    };

    fetchTimeline();
  }, [siteId, invoiceId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Dunning Timeline
          </CardTitle>
          <div className="flex items-center gap-2">
            {dunningPaused && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Pause className="h-3 w-3" />
                Paused
              </Badge>
            )}
            {currentStage > 0 && (
              <Badge variant={currentStage >= 4 ? "destructive" : "secondary"}>
                Stage {currentStage}/5
              </Badge>
            )}
            {writeOffFlagged && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Ban className="h-3 w-3" />
                Write-Off Flagged
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No dunning activity yet
          </p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

            <div className="space-y-4">
              {events.map((event) => {
                const config = STAGE_CONFIG[event.action] || {
                  icon: Bell,
                  color: "text-muted-foreground",
                  label: event.action,
                };
                const Icon = config.icon;
                const parsedNew = parseJsonSafe(event.newValue);

                return (
                  <div key={event.id} className="relative pl-10">
                    {/* Icon dot */}
                    <div
                      className={`absolute left-2 top-1 w-5 h-5 rounded-full bg-background border-2 border-current flex items-center justify-center ${config.color}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {config.label}
                        </span>
                        {parsedNew?.stage && (
                          <Badge variant="outline" className="text-[10px]">
                            Stage {String(parsedNew.stage)}
                          </Badge>
                        )}
                        {parsedNew?.type && (
                          <Badge
                            variant={
                              (parsedNew.type as string) === "writeoff"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {String(parsedNew.type)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {new Date(event.createdAt).toLocaleDateString("en-ZM", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage progression indicator */}
        {currentStage > 0 && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Escalation Progress
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${
                    s <= currentStage
                      ? s >= 4
                        ? "bg-red-500"
                        : "bg-amber-500"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Urgent</span>
              <span>Final</span>
              <span>2nd Formal</span>
              <span>Admin</span>
              <span>Write-Off</span>
            </div>
          </div>
        )}

        {/* Manual controls */}
        {(onSendReminder || onTogglePause) && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2">
            {onSendReminder && (
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await onSendReminder();
                  });
                }}
              >
                <Send className="h-3 w-3 mr-1" />
                Send Reminder Now
              </Button>
            )}
            {onTogglePause && (
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await onTogglePause(!dunningPaused);
                  });
                }}
              >
                {dunningPaused ? (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Resume Dunning
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3 mr-1" />
                    Pause Dunning
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function parseJsonSafe(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
